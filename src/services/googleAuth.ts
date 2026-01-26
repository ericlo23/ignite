import type { TokenClient, TokenResponse } from '../types'

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const TOKEN_KEY = 'ignite_access_token'
const TOKEN_EXPIRY_KEY = 'ignite_token_expiry'

let tokenClient: TokenClient | null = null
let accessToken: string | null = null
let authCallback: ((token: string) => void) | null = null
let errorCallback: ((error: string) => void) | null = null

function restoreToken(): boolean {
  const savedToken = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)

  if (savedToken && expiry && Date.now() < parseInt(expiry, 10)) {
    accessToken = savedToken
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
