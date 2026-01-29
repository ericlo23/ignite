// Worker auth response types
export interface WorkerLoginResponse {
  url: string
  state: string
}

export interface WorkerAuthResponse {
  access_token: string
  expires_in: number
  session_token: string
  scope?: string
}

export interface WorkerRefreshResponse {
  access_token: string
  expires_in: number
  scope?: string
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

export interface ParsedThought {
  id: string          // Generated from timestamp
  date: string        // YYYY-MM-DD
  time: string        // HH:MM AM/PM
  content: string     // Thought text
  timestamp: Date     // For sorting
  isPending?: boolean // True for offline thoughts not yet synced
}
