import type { WorkerLoginResponse, WorkerAuthResponse, WorkerRefreshResponse } from '../types'
import { logger } from '../utils/logger'

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string
const TOKEN_KEY = 'ignite_access_token'
const TOKEN_EXPIRY_KEY = 'ignite_token_expiry'
const SESSION_KEY = 'ignite_session_token'
const GRANTED_SCOPES_KEY = 'ignite_granted_scopes'
const REFRESH_BUFFER_MS = 5 * 60 * 1000 // 5 minutes before expiry
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

let accessToken: string | null = null
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

async function silentRefresh(): Promise<void> {
  const sessionToken = localStorage.getItem(SESSION_KEY)
  if (isRefreshing || !sessionToken) return
  isRefreshing = true

  try {
    logger.api('POST /auth/refresh → Request sent', { hasSession: !!sessionToken })
    const res = await fetch(`${WORKER_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
    })

    if (!res.ok) {
      // Session expired or refresh token revoked
      logger.api('POST /auth/refresh ← Session expired/revoked')
      accessToken = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRY_KEY)
      localStorage.removeItem(SESSION_KEY)
      clearScheduledRefresh()
      notifyTokenChange(null)
      return
    }

    const data: WorkerRefreshResponse = await res.json()
    logger.api(`POST /auth/refresh ← Token received (expires in ${data.expires_in}s)`)
    saveToken(data.access_token, data.expires_in)
    notifyTokenChange(data.access_token)
  } catch (error) {
    // Network error — don't clear session, will retry on visibility change
    logger.api('POST /auth/refresh ← Network error', error)
  } finally {
    isRefreshing = false
  }
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

  // Clear expired access token but keep session for refresh
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

function scopeIncludes(scope: string | null | undefined, required: string): boolean {
  if (!scope) return false
  return scope.split(/\s+/).includes(required)
}

async function fetchGrantedScopes(token: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`)
    if (!res.ok) return null
    const data = await res.json() as { scope?: string }
    return data.scope ?? null
  } catch {
    return null
  }
}

export async function initGoogleAuth(): Promise<void> {
  if (!WORKER_URL) {
    throw new Error('VITE_WORKER_URL is not configured')
  }

  const hasValidToken = restoreToken()

  // If we have a session but no valid access token, try a silent refresh
  if (!hasValidToken && localStorage.getItem(SESSION_KEY)) {
    await silentRefresh()
  }
}

export async function signIn(): Promise<void> {
  const redirectUri = `${window.location.origin}/auth/callback`
  logger.api('GET /auth/login → Request sent')
  const res = await fetch(`${WORKER_URL}/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}`)
  if (!res.ok) {
    throw new Error('Failed to get login URL')
  }
  const data: WorkerLoginResponse = await res.json()
  logger.api('GET /auth/login ← Redirect URL received', { url: data.url })
  // Store state for CSRF verification
  sessionStorage.setItem('ignite_oauth_state', data.state)
  // Redirect to Google OAuth consent
  window.location.href = data.url
}

export async function handleAuthCallback(code: string, state: string): Promise<boolean> {
  const savedState = sessionStorage.getItem('ignite_oauth_state')
  sessionStorage.removeItem('ignite_oauth_state')

  if (!savedState || savedState !== state) {
    throw new Error('Invalid OAuth state — possible CSRF attack')
  }

  const redirectUri = `${window.location.origin}/auth/callback`
  logger.api('POST /auth/callback → Request sent', { codeLength: code.length })
  const res = await fetch(`${WORKER_URL}/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Auth callback failed' }))
    throw new Error((err as { error: string }).error || 'Auth callback failed')
  }

  const data: WorkerAuthResponse = await res.json()
  logger.api(`POST /auth/callback ← Tokens received (expires in ${data.expires_in}s)`)
  saveToken(data.access_token, data.expires_in)
  localStorage.setItem(SESSION_KEY, data.session_token)
  logger.api('POST /auth/callback ← Session saved')
  notifyTokenChange(data.access_token)
  if (data.scope) {
    localStorage.setItem(GRANTED_SCOPES_KEY, data.scope)
  }

  const hasDriveScopeFromResponse = scopeIncludes(data.scope, DRIVE_SCOPE)
  const tokenInfoScopes = await fetchGrantedScopes(data.access_token)
  if (tokenInfoScopes) {
    localStorage.setItem(GRANTED_SCOPES_KEY, tokenInfoScopes)
  }

  return hasDriveScopeFromResponse || scopeIncludes(tokenInfoScopes, DRIVE_SCOPE)
}

export function getAccessToken(): string | null {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (expiry && Date.now() < parseInt(expiry, 10) && accessToken) {
    return accessToken
  }
  return null
}

export async function signOut(): Promise<void> {
  clearScheduledRefresh()
  const sessionToken = localStorage.getItem(SESSION_KEY)

  accessToken = null
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('ignite_file_id')

  if (sessionToken) {
    try {
      logger.api('POST /auth/revoke → Request sent')
      await fetch(`${WORKER_URL}/auth/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      logger.api('POST /auth/revoke ← Revocation complete')
    } catch (error) {
      // Best-effort revocation
      logger.api('POST /auth/revoke ← Error (best-effort)', error)
    }
  }
}

export function isTokenValid(): boolean {
  if (!accessToken) {
    restoreToken()
  }
  return !!accessToken
}
