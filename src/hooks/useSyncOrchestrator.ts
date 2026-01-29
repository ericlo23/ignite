import { useState, useCallback } from 'react'
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

  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
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

    try {
      // 1. Fetch from Drive
      const content = await driveHook.fetchFileContent()

      // 2. Parse to entries
      const driveThoughts = driveHook.parseThoughts(content)

      // 3. Merge into local storage
      await storageHook.mergeFromDrive(driveThoughts)

      // 4. Get unsynced local thoughts
      const unsynced = await storageHook.getUnsynced()

      if (unsynced.length > 0) {
        // 5. Re-fetch to ensure we have latest
        const currentContent = await driveHook.fetchFileContent()
        const existingThoughts = driveHook.parseThoughts(currentContent)

        // 6. Merge with unsynced
        const allThoughts = [...existingThoughts, ...unsynced]

        // 7. Deduplicate by ID
        const uniqueThoughts = Array.from(
          new Map(allThoughts.map(t => [t.id, t])).values()
        )

        // 8. Upload to Drive
        await driveHook.uploadThoughts(uniqueThoughts)

        // 9. Mark all as synced
        await storageHook.markAllSynced(unsynced.map(t => t.id))
      }

      // 10. Ensure stats are up-to-date after sync completes
      await storageHook.updateSyncStats()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      setSyncError(message)
    } finally {
      setIsSyncing(false)
    }
  }, [accessToken, driveHook, storageHook])

  /**
   * Internal: Sync a single thought to Drive (append operation)
   * Sets syncError if sync fails
   */
  const syncThoughtToDrive = useCallback(async (id: number, thought: string) => {
    if (!accessToken) return

    try {
      await driveHook.appendThought(thought, id)
      await storageHook.markSynced(id)
      await storageHook.updateSyncStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Background sync failed'
      setSyncError(message)
      console.error('Background sync failed:', error)
    }
  }, [accessToken, driveHook, storageHook])

  /**
   * Save thought locally and sync to Drive if online
   * Returns true if save succeeded
   */
  const saveThought = useCallback(async (thought: string): Promise<boolean> => {
    if (!thought.trim()) return false

    // Save locally first
    const id = await storageHook.saveThought(thought.trim())

    // If save failed (id is 0), return false
    if (id === 0) return false

    // Background sync to Drive if signed in and online
    const isSignedIn = Boolean(accessToken)
    if (isSignedIn && isOnline) {
      syncThoughtToDrive(id, thought.trim())
    }

    return true
  }, [accessToken, isOnline, storageHook, syncThoughtToDrive])

  const clearSyncError = useCallback(() => {
    setSyncError(null)
    driveHook.clearError()
  }, [driveHook])

  return {
    // Main operations
    saveThought,
    pullAndMerge,
    // State
    isSaving: storageHook.isSaving,
    isSyncing,
    lastSaved: storageHook.lastSaved,
    saveError: storageHook.saveError,
    syncError,
    syncStats: storageHook.syncStats,
    hasPermissionError: driveHook.hasPermissionError,
    // Actions
    clearSaveError: storageHook.clearSaveError,
    clearSyncError
  }
}
