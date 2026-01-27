import type { TokenClient, TokenResponse } from '../types'

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const TOKEN_KEY = 'ignite_access_token'
const TOKEN_EXPIRY_KEY = 'ignite_token_expiry'
const REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes before expiry

let tokenClient: TokenClient | null = null
let accessToken: string | null = null
let authCallback: ((token: string) => void) | null = null
let errorCallback: ((error: string) => void) | null = null
let refreshTimerId: ReturnType<typeof setTimeout> | null = null
let isRefreshing = false

export type TokenChangeListener = (token: string | null) => void
let tokenChangeListener: TokenChangeListener | null = null

export function onTokenChange(listener: TokenChangeListener): () => void {
  tokenChangeListener = listener
  return () => {
    if (tokenChangeListener === listener) {
      tokenChangeListener = null
    }
  }
}

function notifyTokenChange(token: string | null): void {
  tokenChangeListener?.(token)
}

function clearScheduledRefresh(): void {
  if (refreshTimerId !== null) {
    clearTimeout(refreshTimerId)
    refreshTimerId = null
  }
}

function scheduleTokenRefresh(expiresInMs: number): void {
  clearScheduledRefresh()
  const delay = Math.max(expiresInMs - REFRESH_BUFFER_MS, 0)
  refreshTimerId = setTimeout(() => {
    silentRefresh()
  }, delay)
}

function silentRefresh(): void {
  if (isRefreshing || !tokenClient) return
  isRefreshing = true

  authCallback = (token: string) => {
    isRefreshing = false
    notifyTokenChange(token)
  }
  errorCallback = () => {
    isRefreshing = false
    accessToken = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    clearScheduledRefresh()
    notifyTokenChange(null)
  }

  tokenClient.requestAccessToken({ prompt: '' })
}

function handleVisibilityChange(): void {
  if (document.visibilityState !== 'visible') return

  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiry) return

  const remainingMs = parseInt(expiry, 10) - Date.now()
  if (remainingMs <= REFRESH_BUFFER_MS) {
    silentRefresh()
  } else {
    scheduleTokenRefresh(remainingMs)
  }
}

export function setupVisibilityRefresh(): () => void {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

function restoreToken(): boolean {
  const savedToken = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

  if (savedToken && expiry && Date.now() < parseInt(expiry, 10)) {
    accessToken = savedToken
    const remainingMs = parseInt(expiry, 10) - Date.now()
    scheduleTokenRefresh(remainingMs)
    return true
  }

  // Clear expired token
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  return false
}

function saveToken(token: string, expiresIn: number): void {
  accessToken = token
  const expiryTime = Date.now() + expiresIn * 1000
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryTime))
  scheduleTokenRefresh(expiresIn * 1000)
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }

    const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }

    const script = document.createElement('script')
    script.src = GIS_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

export async function initGoogleAuth(): Promise<void> {
  restoreToken()

  await loadGisScript()

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not configured')
  }

  tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (response: TokenResponse) => {
      if (response.error) {
        errorCallback?.(response.error)
        return
      }
      if (response.access_token) {
        saveToken(response.access_token, response.expires_in)
        authCallback?.(response.access_token)
      }
    },
    error_callback: (error: { type: string; message?: string }) => {
      const errorMessage = error.message || error.type || 'Sign in cancelled'
      errorCallback?.(errorMessage)
    }
  })
}

export function requestAuth(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Auth not initialized'))
      return
    }

    authCallback = resolve
    errorCallback = reject

    tokenClient.requestAccessToken({ prompt: '' })
  })
}

export function getAccessToken(): string | null {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (expiry && Date.now() < parseInt(expiry, 10) && accessToken) {
    return accessToken
  }
  return null
}

export function signOut(): void {
  clearScheduledRefresh()
  const token = accessToken
  accessToken = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)

  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {})
  }
}

export function isTokenValid(): boolean {
  if (!accessToken) {
    restoreToken()
  }
  return !!accessToken
}
