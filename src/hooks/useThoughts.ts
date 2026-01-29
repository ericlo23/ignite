import { useState, useCallback } from 'react'
import type { ParsedThought } from '../types'
import { getAllThoughts } from '../services/googleDrive'
import { getPendingEntries } from '../services/storage'
import { formatDate, formatTime } from '../utils/markdown'

export function useThoughts(accessToken: string | null) {
  const [thoughts, setThoughts] = useState<ParsedThought[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadThoughts = useCallback(async () => {
    if (!accessToken) {
      setError('Not signed in')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch from Drive
      const driveThoughts = await getAllThoughts(accessToken)

      // Fetch pending from IndexedDB
      const pendingEntries = await getPendingEntries()

      // Convert pending entries to ParsedThought format
      const pendingThoughts: ParsedThought[] = pendingEntries.map(entry => {
        const timestamp = new Date(entry.timestamp)
        return {
          id: `pending-${entry.id}`,
          date: formatDate(timestamp),
          time: formatTime(timestamp),
          content: entry.thought,
          timestamp,
          isPending: true
        }
      })

      // Merge and sort by timestamp (newest first)
      const allThoughts = [...driveThoughts, ...pendingThoughts].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      )

      setThoughts(allThoughts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thoughts')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  return { thoughts, isLoading, error, loadThoughts }
}
