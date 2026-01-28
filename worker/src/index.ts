import type { Env, SessionData, GoogleTokenResponse, GoogleIdTokenPayload } from './types'

const SCOPES = 'openid https://www.googleapis.com/auth/drive.file'
const SESSION_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days

function corsHeaders(origin: string, allowedOrigin: string): Record<string, string> {
  if (origin !== allowedOrigin) return {}
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function jsonResponse(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function decodeIdTokenPayload(idToken: string): GoogleIdTokenPayload {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Invalid id_token format')
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
  return payload as GoogleIdTokenPayload
}

async function handleLogin(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const url = new URL(request.url)
  const redirectUri = url.searchParams.get('redirect_uri')
  if (!redirectUri) {
    return jsonResponse({ error: 'redirect_uri is required' }, 400, cors)
  }

  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return jsonResponse({ url: authUrl, state }, 200, cors)
}

async function handleCallback(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const body = await request.json<{ code: string; redirect_uri: string }>()
  if (!body.code || !body.redirect_uri) {
    return jsonResponse({ error: 'code and redirect_uri are required' }, 400, cors)
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: body.code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: body.redirect_uri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    return jsonResponse({ error: 'Token exchange failed', details: err }, 400, cors)
  }

  const tokens: GoogleTokenResponse = await tokenRes.json()

  if (!tokens.refresh_token) {
    return jsonResponse({ error: 'No refresh_token returned. Ensure prompt=consent was used.' }, 400, cors)
  }

  if (!tokens.id_token) {
    return jsonResponse({ error: 'No id_token returned' }, 400, cors)
  }

  const idPayload = decodeIdTokenPayload(tokens.id_token)
  const sessionToken = generateSessionToken()

  const sessionData: SessionData = {
    userId: idPayload.sub,
    refreshToken: tokens.refresh_token,
    createdAt: Date.now(),
  }

  await env.SESSIONS.put(`session:${sessionToken}`, JSON.stringify(sessionData), {
    expirationTtl: SESSION_TTL_SECONDS,
  })

  return jsonResponse(
    {
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      session_token: sessionToken,
    },
    200,
    cors
  )
}

async function handleRefresh(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing session token' }, 401, cors)
  }

  const sessionToken = authHeader.slice(7)
  const stored = await env.SESSIONS.get(`session:${sessionToken}`)
  if (!stored) {
    return jsonResponse({ error: 'Invalid or expired session' }, 401, cors)
  }

  const session: SessionData = JSON.parse(stored)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: session.refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenRes.ok) {
    // Refresh token may be revoked — clear the session
    await env.SESSIONS.delete(`session:${sessionToken}`)
    return jsonResponse({ error: 'Refresh failed, session cleared' }, 401, cors)
  }

  const tokens: GoogleTokenResponse = await tokenRes.json()

  return jsonResponse(
    {
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
    },
    200,
    cors
  )
}

async function handleRevoke(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing session token' }, 401, cors)
  }

  const sessionToken = authHeader.slice(7)
  const stored = await env.SESSIONS.get(`session:${sessionToken}`)
  if (!stored) {
    return jsonResponse({ ok: true }, 200, cors)
  }

  const session: SessionData = JSON.parse(stored)

  // Revoke the refresh token with Google
  await fetch(`https://oauth2.googleapis.com/revoke?token=${session.refreshToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  await env.SESSIONS.delete(`session:${sessionToken}`)
  return jsonResponse({ ok: true }, 200, cors)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || ''
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    try {
      if (url.pathname === '/auth/login' && request.method === 'GET') {
        return handleLogin(request, env, cors)
      }
      if (url.pathname === '/auth/callback' && request.method === 'POST') {
        return handleCallback(request, env, cors)
      }
      if (url.pathname === '/auth/refresh' && request.method === 'POST') {
        return handleRefresh(request, env, cors)
      }
      if (url.pathname === '/auth/revoke' && request.method === 'POST') {
        return handleRevoke(request, env, cors)
      }

      return jsonResponse({ error: 'Not found' }, 404, cors)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error'
      return jsonResponse({ error: message }, 500, cors)
    }
  },
} satisfies ExportedHandler<Env>
