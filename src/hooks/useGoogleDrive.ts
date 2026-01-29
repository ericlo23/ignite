import { useState, useCallback, useRef } from 'react'
import {
  findOrCreateThoughtsFile,
  appendThought,
  clearFileCache,
  getFileContent,
  uploadThoughts as uploadThoughtsToAPI,
  parseThoughtsToEntries
} from '../services/googleDrive'
import {
  mergeThoughtsFromDrive,
  markSyncedToDrive,
  getUnsyncedThoughts
} from '../services/storage'

interface UseGoogleDriveReturn {
  pullAndMerge: () => Promise<void>
  syncThoughtToDrive: (id: number, thought: string) => Promise<void>
  isSyncing: boolean
  syncError: string | null
  hasPermissionError: boolean
  clearSyncError: () => void
}

export function useGoogleDrive(accessToken: string | null): UseGoogleDriveReturn {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [hasPermissionError, setHasPermissionError] = useState(false)
  const fileIdRef = useRef<string | null>(null)

  /**
   * Pull thoughts from Drive and merge with local
   * Then upload any unsynced local thoughts
   */
  const pullAndMerge = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      setSyncError('Not authenticated')
      return
    }

    setIsSyncing(true)
    setSyncError(null)

    try {
      // 1. Get or create file ID
      if (!fileIdRef.current) {
        fileIdRef.current = await findOrCreateThoughtsFile(accessToken)
      }

      // 2. Get file content from Drive
      const content = await getFileContent(accessToken, fileIdRef.current)

      // 3. Parse markdown to thought entries
      const driveThoughts = parseThoughtsToEntries(content)

      // 4. Merge into IndexedDB (dedup by timestamp)
      await mergeThoughtsFromDrive(driveThoughts)

      // 5. Upload unsynced local thoughts back to Drive
      const unsynced = await getUnsyncedThoughts()
      if (unsynced.length > 0) {
        // Get current content again to append to
        const currentContent = await getFileContent(accessToken, fileIdRef.current)
        const existingThoughts = parseThoughtsToEntries(currentContent)

        // Merge local unsynced with Drive thoughts
        const allThoughts = [...existingThoughts, ...unsynced]

        // Remove duplicates by timestamp
        const uniqueThoughts = Array.from(
          new Map(allThoughts.map(t => [t.id, t])).values()
        )

        // Upload complete set
        await uploadThoughtsToAPI(accessToken, fileIdRef.current, uniqueThoughts)

        // Mark all as synced
        for (const t of unsynced) {
          await markSyncedToDrive(t.id)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      setSyncError(message)

      // Check if it's a permission error
      const isPermissionError =
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('401') ||
        message.toLowerCase().includes('403')
      setHasPermissionError(isPermissionError)

      // If file not found, clear cache
      if (message.includes('not found') || message.includes('404')) {
        fileIdRef.current = null
        clearFileCache()
      }
    } finally {
      setIsSyncing(false)
    }
  }, [accessToken])

  /**
   * Sync a single thought to Drive (append operation)
   * Sets syncError if sync fails
   */
  const syncThoughtToDrive = useCallback(async (id: number, thought: string): Promise<void> => {
    if (!accessToken) return

    try {
      // Get or create file ID
      if (!fileIdRef.current) {
        fileIdRef.current = await findOrCreateThoughtsFile(accessToken)
      }

      // Append thought to file with precise timestamp (id is the timestamp)
      await appendThought(accessToken, fileIdRef.current, thought, id)

      // Mark as synced
      await markSyncedToDrive(id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Background sync failed'
      setSyncError(message)

      // Check if it's a permission error
      const isPermissionError =
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('401') ||
        message.toLowerCase().includes('403')
      setHasPermissionError(isPermissionError)

      console.error('Background sync failed:', error)
    }
  }, [accessToken])

  const clearSyncError = useCallback(() => {
    setSyncError(null)
    setHasPermissionError(false)
  }, [])

  return {
    pullAndMerge,
    syncThoughtToDrive,
    isSyncing,
    syncError,
    hasPermissionError,
    clearSyncError
  }
}
