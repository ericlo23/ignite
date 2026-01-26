// Google Identity Services types
export interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  error?: string
}

export interface TokenClient {
  requestAccessToken(options?: { prompt?: string }): void
}

export interface GoogleOAuth2 {
  initTokenClient(config: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
  }): TokenClient
  revoke(token: string, callback?: () => void): void
}

export interface GoogleAccounts {
  oauth2: GoogleOAuth2
}

export interface Google {
  accounts: GoogleAccounts
}

declare global {
  interface Window {
    google?: Google
  }
}

// App types
export interface ThoughtEntry {
  id: number
  thought: string
  timestamp: number
  synced: boolean
}

export interface AuthState {
  isSignedIn: boolean
  isLoading: boolean
  error: string | null
}

export interface DriveState {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
}
