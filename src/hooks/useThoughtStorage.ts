import { useState, useEffect, useCallback } from 'react'
import {
  saveThought as saveThoughtToStorage,
  getSyncStats,
  mergeThoughtsFromDrive,
  getUnsyncedThoughts,
  markSyncedToDrive,
  ThoughtEntry
} from '../services/storage'
import { logger } from '../utils/logger'

interface SyncStats {
  total: number
  synced: number
  unsynced: number
}

interface UseThoughtStorageReturn {
  saveThought: (thought: string) => Promise<number>
  isSaving: boolean
  lastSaved: Date | null
  syncStats: SyncStats
  updateSyncStats: () => Promise<void>
  // Sync operations
  mergeFromDrive: (driveThoughts: ThoughtEntry[]) => Promise<void>
  getUnsynced: () => Promise<ThoughtEntry[]>
  markSynced: (id: number) => Promise<void>
  markAllSynced: (ids: number[]) => Promise<void>
}

export function useThoughtStorage(): UseThoughtStorageReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [syncStats, setSyncStats] = useState<SyncStats>({ total: 0, synced: 0, unsynced: 0 })

  // Update sync stats
  const updateSyncStats = useCallback(async () => {
    logger.storage('Update stats → Triggered')
    const stats = await getSyncStats()
    logger.storage('Update stats → Complete', stats)
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

    logger.storage('Save thought → Starting', { isSaving: true, thought: thought.slice(0, 50) + (thought.length > 50 ? '...' : '') })
    setIsSaving(true)

    try {
      const id = await saveThoughtToStorage(thought.trim())
      logger.storage('Save thought → ID returned', { id })
      const savedTime = new Date()
      setLastSaved(savedTime)
      logger.storage('Save thought → Complete', { lastSaved: savedTime.toISOString() })
      await updateSyncStats()
      return id
    } finally {
      logger.storage('Save thought → Finished', { isSaving: false })
      setIsSaving(false)
    }
  }, [updateSyncStats])

  // Sync operations
  const mergeFromDrive = useCallback(async (driveThoughts: ThoughtEntry[]): Promise<void> => {
    logger.storage('Merge from Drive → Starting', { driveCount: driveThoughts.length })
    await mergeThoughtsFromDrive(driveThoughts)
    logger.storage('Merge from Drive → Complete, updating stats')
    await updateSyncStats()
  }, [updateSyncStats])

  const getUnsynced = useCallback(async (): Promise<ThoughtEntry[]> => {
    logger.storage('Get unsynced → Fetching')
    return await getUnsyncedThoughts()
  }, [])

  const markSynced = useCallback(async (id: number): Promise<void> => {
    logger.storage('Mark synced → Single ID', { id })
    await markSyncedToDrive(id)
    logger.storage('Mark synced → Updating stats')
    await updateSyncStats()
  }, [updateSyncStats])

  const markAllSynced = useCallback(async (ids: number[]): Promise<void> => {
    for (const id of ids) {
      logger.storage('Mark synced → Marking ID', { id })
      await markSyncedToDrive(id)
    }
    logger.storage('Mark synced → Bulk complete, updating stats', { count: ids.length })
    await updateSyncStats()
  }, [updateSyncStats])

  return {
    saveThought,
    isSaving,
    lastSaved,
    syncStats,
    updateSyncStats,
    // Sync operations
    mergeFromDrive,
    getUnsynced,
    markSynced,
    markAllSynced
  }
}
