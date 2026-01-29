import { useState, useCallback, useRef } from 'react'
import {
  findOrCreateThoughtsFile,
  appendThought as appendThoughtToAPI,
  clearFileCache,
  getFileContent,
  uploadThoughts as uploadThoughtsToAPI,
  parseThoughtsToEntries
} from '../services/googleDrive'
import { ThoughtEntry } from '../services/storage'

interface UseGoogleDriveReturn {
  fetchFileContent: () => Promise<string>
  parseThoughts: (content: string) => ThoughtEntry[]
  appendThought: (thought: string, timestamp: number) => Promise<void>
  uploadThoughts: (thoughts: ThoughtEntry[]) => Promise<void>
  isLoading: boolean
  error: string | null
  hasPermissionError: boolean
  clearError: () => void
}

export function useGoogleDrive(accessToken: string | null): UseGoogleDriveReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileIdRef = useRef<string | null>(null)

  /**
   * Fetch file content from Drive
   * Handles file ID caching and creation
   */
  const fetchFileContent = useCallback(async (): Promise<string> => {
    if (!accessToken) {
      throw new Error('Not authenticated')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get or create file ID
      if (!fileIdRef.current) {
        fileIdRef.current = await findOrCreateThoughtsFile(accessToken)
      }

      // Get file content from Drive
      const content = await getFileContent(accessToken, fileIdRef.current)
      return content
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch from Drive'
      setError(message)

      // If file not found, clear cache
      if (message.includes('not found') || message.includes('404')) {
        fileIdRef.current = null
        clearFileCache()
      }

      throw err
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  /**
   * Parse markdown content to thought entries
   */
  const parseThoughts = useCallback((content: string): ThoughtEntry[] => {
    return parseThoughtsToEntries(content)
  }, [])

  /**
   * Append a single thought to Drive
   */
  const appendThought = useCallback(async (thought: string, timestamp: number): Promise<void> => {
    if (!accessToken) {
      throw new Error('Not authenticated')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get or create file ID
      if (!fileIdRef.current) {
        fileIdRef.current = await findOrCreateThoughtsFile(accessToken)
      }

      // Append thought to file with precise timestamp
      await appendThoughtToAPI(accessToken, fileIdRef.current, thought, timestamp)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to append to Drive'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  /**
   * Upload complete thought list to Drive (replace entire file)
   */
  const uploadThoughts = useCallback(async (thoughts: ThoughtEntry[]): Promise<void> => {
    if (!accessToken) {
      throw new Error('Not authenticated')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get or create file ID
      if (!fileIdRef.current) {
        fileIdRef.current = await findOrCreateThoughtsFile(accessToken)
      }

      // Upload complete thought list
      await uploadThoughtsToAPI(accessToken, fileIdRef.current, thoughts)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload to Drive'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Compute permission error from error state
  const hasPermissionError = Boolean(
    error &&
    (error.toLowerCase().includes('permission') ||
     error.toLowerCase().includes('unauthorized') ||
     error.toLowerCase().includes('401') ||
     error.toLowerCase().includes('403'))
  )

  return {
    fetchFileContent,
    parseThoughts,
    appendThought,
    uploadThoughts,
    isLoading,
    error,
    hasPermissionError,
    clearError
  }
}
