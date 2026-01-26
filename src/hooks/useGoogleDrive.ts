import { useState, useCallback, useRef } from 'react'
import {
  findOrCreateThoughtsFile,
  appendThought,
  clearFileCache
} from '../services/googleDrive'

interface UseGoogleDriveReturn {
  saveThought: (thought: string) => Promise<boolean>
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  clearError: () => void
}

export function useGoogleDrive(accessToken: string | null): UseGoogleDriveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileIdRef = useRef<string | null>(null)

  const saveThought = useCallback(async (thought: string): Promise<boolean> => {
    if (!accessToken) {
      setError('Not authenticated')
      return false
    }

    if (!thought.trim()) {
      return false
    }

    setIsSaving(true)
    setError(null)

    try {
      // Get or create file ID
      if (!fileIdRef.current) {
        fileIdRef.current = await findOrCreateThoughtsFile(accessToken)
      }

      // Append thought to file
      await appendThought(accessToken, fileIdRef.current, thought.trim())

      setLastSaved(new Date())
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setError(message)

      // If file not found, clear cache and try again next time
      if (message.includes('not found') || message.includes('404')) {
        fileIdRef.current = null
        clearFileCache()
      }

      return false
    } finally {
      setIsSaving(false)
    }
  }, [accessToken])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    saveThought,
    isSaving,
    lastSaved,
    error,
    clearError
  }
}
