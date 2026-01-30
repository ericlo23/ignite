import { useState, useEffect, useCallback } from 'react'
import {
  initGoogleAuth,
  signIn as authSignIn,
  getAccessToken,
  signOut as authSignOut,
  isTokenValid,
  onTokenChange,
  setupVisibilityRefresh
} from '../services/googleAuth'
import { logger } from '../utils/logger'

interface UseGoogleAuthReturn {
  isSignedIn: boolean
  isLoading: boolean
  error: string | null
  accessToken: string | null
  signIn: () => void
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
        logger.auth('Auth initialization → Starting')
        await initGoogleAuth()
        if (mounted) {
          const token = getAccessToken()
          if (token && isTokenValid()) {
            logger.auth('Auth initialization → Token restored', { isValid: true })
            setAccessToken(token)
            setIsSignedIn(true)
          }
          logger.auth('Auth initialization → Complete', { isLoading: false })
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          logger.auth('Auth initialization → Error', err)
          setError(err instanceof Error ? err.message : 'Failed to initialize auth')
          setIsLoading(false)
        }
      }
    }

    init()

    const unsubscribeToken = onTokenChange((token) => {
      if (!mounted) return
      if (token) {
        logger.auth('Token updated → isSignedIn=true')
        setAccessToken(token)
        setIsSignedIn(true)
      } else {
        logger.auth('Token cleared → isSignedIn=false')
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

  const signIn = useCallback(() => {
    setError(null)
    logger.auth('Sign in → User triggered')
    authSignIn().catch((err) => {
      logger.auth('Sign in → Error', err)
      setError(err instanceof Error ? err.message : 'Sign in failed')
    })
  }, [])

  const signOut = useCallback(() => {
    authSignOut().then(() => {
      logger.auth('Sign out → Success, state cleared')
      setAccessToken(null)
      setIsSignedIn(false)
      setError(null)
    }).catch((err) => {
      // Clear local state even if revocation fails
      logger.auth('Sign out → Error but state cleared', err)
      setAccessToken(null)
      setIsSignedIn(false)
      setError(null)
    })
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
