export interface Env {
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ALLOWED_ORIGIN: string
}

export interface SessionData {
  userId: string
  refreshToken: string
  createdAt: number
}

export interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token?: string
  id_token?: string
}

export interface GoogleIdTokenPayload {
  sub: string
  email?: string
}
