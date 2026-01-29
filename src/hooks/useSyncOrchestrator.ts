import { useState, useCallback } from 'react'
import { isPermissionError } from '../services/googleDrive'
import { useGoogleDrive } from './useGoogleDrive'
import { useThoughtStorage } from './useThoughtStorage'

interface SyncStats {
  total: number
  synced: number
  unsynced: number
}

interface UseSyncOrchestratorReturn {
  // Main operations
  saveThought: (thought: string) => Promise<boolean>
  pullAndMerge: () => Promise<void>
  // State
  isSaving: boolean
  isSyncing: boolean
  lastSaved: Date | null
  saveError: string | null
  syncError: string | null
  syncStats: SyncStats
  hasPermissionError: boolean
  // Actions
  clearSaveError: () => void
  clearSyncError: () => void
}

/**
 * Orchestrates sync between Google Drive and local storage
 * Coordinates between Drive API operations and storage operations
 */
export function useSyncOrchestrator(accessToken: string | null): UseSyncOrchestratorReturn {
  const driveHook = useGoogleDrive(accessToken)
  const storageHook = useThoughtStorage()

  // Destructure functions to avoid object reference changes triggering re-renders
  const { fetchFileContent, parseThoughts, uploadThoughts, appendThought } = driveHook
  const { mergeFromDrive, getUnsynced, markAllSynced, markSynced, updateSyncStats, saveThought: saveThoughtToStorage, isSaving, lastSaved, syncStats } = storageHook

  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [hasPermissionError, setHasPermissionError] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isOnline] = useState(navigator.onLine)

  /**
   * Pull thoughts from Drive and merge with local
   * Then upload any unsynced local thoughts
   */
  const pullAndMerge = useCallback(async () => {
    if (!accessToken) {
      setSyncError('Not authenticated')
      return
    }

    setIsSyncing(true)
    setSyncError(null)
    setHasPermissionError(false)

    try {
      // 1. Fetch from Drive
      const content = await fetchFileContent()

      // 2. Parse to entries
      const driveThoughts = parseThoughts(content)

      // 3. Merge into local storage
      await mergeFromDrive(driveThoughts)

      // 4. Get unsynced local thoughts
      const unsynced = await getUnsynced()

      if (unsynced.length > 0) {
        // 5. Re-fetch to ensure we have latest
        const currentContent = await fetchFileContent()
        const existingThoughts = parseThoughts(currentContent)

        // 6. Merge with unsynced
        const allThoughts = [...existingThoughts, ...unsynced]

        // 7. Deduplicate by ID
        const uniqueThoughts = Array.from(
          new Map(allThoughts.map(t => [t.id, t])).values()
        )

        // 8. Upload to Drive
        await uploadThoughts(uniqueThoughts)

        // 9. Mark all as synced
        await markAllSynced(unsynced.map(t => t.id))
      }

      // 10. Ensure stats are up-to-date after sync completes
      await updateSyncStats()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      setSyncError(message)
      setHasPermissionError(isPermissionError(err))
    } finally {
      setIsSyncing(false)
    }
  }, [accessToken, fetchFileContent, parseThoughts, mergeFromDrive, getUnsynced, uploadThoughts, markAllSynced, updateSyncStats])

  /**
   * Internal: Sync a single thought to Drive (append operation)
   * Sets syncError if sync fails
   */
  const syncThoughtToDrive = useCallback(async (id: number, thought: string) => {
    if (!accessToken) return

    setIsSyncing(true)

    try {
      await appendThought(thought, id)
      await markSynced(id)
      await updateSyncStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Background sync failed'
      setSyncError(message)
      setHasPermissionError(isPermissionError(error))
      console.error('Background sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [accessToken, appendThought, markSynced, updateSyncStats])

  /**
   * Save thought locally and sync to Drive if online
   * Returns true if save succeeded
   */
  const saveThought = useCallback(async (thought: string): Promise<boolean> => {
    if (!thought.trim()) return false

    try {
      // Save locally first (now throws on error)
      const id = await saveThoughtToStorage(thought.trim())

      // Clear any previous save errors
      setSaveError(null)

      // Background sync to Drive if signed in and online
      const isSignedIn = Boolean(accessToken)
      if (isSignedIn && isOnline) {
        syncThoughtToDrive(id, thought.trim())
      }

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save locally'
      setSaveError(message)
      return false
    }
  }, [accessToken, isOnline, saveThoughtToStorage, syncThoughtToDrive])

  const clearSaveError = useCallback(() => {
    setSaveError(null)
  }, [])

  const clearSyncError = useCallback(() => {
    setSyncError(null)
    setHasPermissionError(false)
  }, [])

  return {
    // Main operations
    saveThought,
    pullAndMerge,
    // State
    isSaving,
    isSyncing,
    lastSaved,
    saveError,
    syncError,
    syncStats,
    hasPermissionError,
    // Actions
    clearSaveError,
    clearSyncError
  }
}
