import { useState, useEffect, useCallback } from 'react'
import {
  initGoogleAuth,
  requestAuth,
  getAccessToken,
  signOut as authSignOut,
  isTokenValid,
  onTokenChange,
  setupVisibilityRefresh
} from '../services/googleAuth'

interface UseGoogleAuthReturn {
  isSignedIn: boolean
  isLoading: boolean
  error: string | null
  accessToken: string | null
  signIn: () => Promise<void>
  signOut: () => void
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        await initGoogleAuth()
        if (mounted) {
          const token = getAccessToken()
          if (token && isTokenValid()) {
            setAccessToken(token)
            setIsSignedIn(true)
          }
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize auth')
          setIsLoading(false)
        }
      }
    }

    init()

    const unsubscribeToken = onTokenChange((token) => {
      if (!mounted) return
      if (token) {
        setAccessToken(token)
        setIsSignedIn(true)
      } else {
        setAccessToken(null)
        setIsSignedIn(false)
      }
    })

    const cleanupVisibility = setupVisibilityRefresh()

    return () => {
      mounted = false
      unsubscribeToken()
      cleanupVisibility()
    }
  }, [])

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = await requestAuth()
      setAccessToken(token)
      setIsSignedIn(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(() => {
    authSignOut()
    setAccessToken(null)
    setIsSignedIn(false)
    setError(null)
  }, [])

  return {
    isSignedIn,
    isLoading,
    error,
    accessToken,
    signIn,
    signOut
  }
}
