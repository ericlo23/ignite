import { useState, useEffect, useCallback } from 'react'
import { saveThought as saveThoughtToStorage, getSyncStats } from '../services/storage'

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
      throw new Error('Thought cannot be empty')
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
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [updateSyncStats])

  const clearSaveError = useCallback(() => {
    setSaveError(null)
  }, [])

  return {
    saveThought,
    isSaving,
    lastSaved,
    saveError,
    syncStats,
    updateSyncStats,
    clearSaveError
  }
}
