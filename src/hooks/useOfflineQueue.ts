import { useState, useEffect, useCallback } from 'react'
import {
  queueOfflineEntry,
  getPendingEntries,
  getPendingCount,
  markEntrySynced
} from '../services/storage'

interface UseOfflineQueueReturn {
  isOnline: boolean
  pendingCount: number
  queueEntry: (thought: string) => Promise<void>
  syncPending: (saveThought: (thought: string) => Promise<boolean>) => Promise<void>
  isSyncing: boolean
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load pending count on mount
  useEffect(() => {
    getPendingCount().then(setPendingCount)
  }, [])

  const queueEntry = useCallback(async (thought: string) => {
    await queueOfflineEntry(thought)
    const count = await getPendingCount()
    setPendingCount(count)
  }, [])

  const syncPending = useCallback(async (
    saveThought: (thought: string) => Promise<boolean>
  ) => {
    if (isSyncing) return

    setIsSyncing(true)

    try {
      const pending = await getPendingEntries()

      for (const entry of pending) {
        const success = await saveThought(entry.thought)
        if (success) {
          await markEntrySynced(entry.id)
        } else {
          // Stop syncing if one fails
          break
        }
      }

      const count = await getPendingCount()
      setPendingCount(count)
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing])

  return {
    isOnline,
    pendingCount,
    queueEntry,
    syncPending,
    isSyncing
  }
}
