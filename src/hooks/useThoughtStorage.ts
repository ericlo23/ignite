import { useState, useEffect, useCallback } from 'react'
import {
  saveThought as saveThoughtToStorage,
  getSyncStats,
  mergeThoughtsFromDrive,
  getUnsyncedThoughts,
  markSyncedToDrive,
  ThoughtEntry
} from '../services/storage'

interface SyncStats {
  total: number
  synced: number
  unsynced: number
}

interface UseThoughtStorageReturn {
  saveThought: (thought: string) => Promise<number>
  isSaving: boolean
  lastSaved: Date | null
  saveError: string | null
  syncStats: SyncStats
  updateSyncStats: () => Promise<void>
  clearSaveError: () => void
  // Sync operations
  mergeFromDrive: (driveThoughts: ThoughtEntry[]) => Promise<void>
  getUnsynced: () => Promise<ThoughtEntry[]>
  markSynced: (id: number) => Promise<void>
  markAllSynced: (ids: number[]) => Promise<void>
}

export function useThoughtStorage(): UseThoughtStorageReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncStats, setSyncStats] = useState<SyncStats>({ total: 0, synced: 0, unsynced: 0 })

  // Update sync stats
  const updateSyncStats = useCallback(async () => {
    const stats = await getSyncStats()
    setSyncStats(stats)
  }, [])

  // Load initial sync stats
  useEffect(() => {
    updateSyncStats()
  }, [updateSyncStats])

  // Save thought to local storage
  const saveThought = useCallback(async (thought: string): Promise<number> => {
    if (!thought.trim()) {
      setSaveError('Thought cannot be empty')
      return 0
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const id = await saveThoughtToStorage(thought.trim())
      setLastSaved(new Date())
      await updateSyncStats()
      return id
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save locally'
      setSaveError(message)
      return 0
    } finally {
      setIsSaving(false)
    }
  }, [updateSyncStats])

  const clearSaveError = useCallback(() => {
    setSaveError(null)
  }, [])

  // Sync operations
  const mergeFromDrive = useCallback(async (driveThoughts: ThoughtEntry[]): Promise<void> => {
    await mergeThoughtsFromDrive(driveThoughts)
    await updateSyncStats()
  }, [updateSyncStats])

  const getUnsynced = useCallback(async (): Promise<ThoughtEntry[]> => {
    return await getUnsyncedThoughts()
  }, [])

  const markSynced = useCallback(async (id: number): Promise<void> => {
    await markSyncedToDrive(id)
    await updateSyncStats()
  }, [updateSyncStats])

  const markAllSynced = useCallback(async (ids: number[]): Promise<void> => {
    for (const id of ids) {
      await markSyncedToDrive(id)
    }
    await updateSyncStats()
  }, [updateSyncStats])

  return {
    saveThought,
    isSaving,
    lastSaved,
    saveError,
    syncStats,
    updateSyncStats,
    clearSaveError,
    // Sync operations
    mergeFromDrive,
    getUnsynced,
    markSynced,
    markAllSynced
  }
}
