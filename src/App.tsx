import { useEffect } from 'react'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useGoogleDrive } from './hooks/useGoogleDrive'
import { useOfflineQueue } from './hooks/useOfflineQueue'
import { ThoughtInput } from './components/ThoughtInput'
import { SaveIndicator } from './components/SaveIndicator'
import { UpdatePrompt } from './components/UpdatePrompt'
import './App.css'

function App() {
  const { isSignedIn, isLoading, error: authError, accessToken, signIn, signOut } = useGoogleAuth()
  const { saveThought, isSaving, lastSaved, error: driveError, clearError } = useGoogleDrive(accessToken)
  const { isOnline, pendingCount, queueEntry, syncPending, isSyncing } = useOfflineQueue()

  // Sync pending entries when coming back online
  useEffect(() => {
    if (isOnline && isSignedIn && pendingCount > 0 && !isSyncing) {
      syncPending(saveThought)
    }
  }, [isOnline, isSignedIn, pendingCount, isSyncing, syncPending, saveThought])

  const handleSave = async (thought: string) => {
    if (!isOnline || !isSignedIn) {
      // Queue for later sync
      await queueEntry(thought)
      return
    }
    await saveThought(thought)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="app loading">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="app">
      <UpdatePrompt />

      <header className="header">
        <h1 className="logo">Ignite</h1>
        <div className="header-actions">
          {!isOnline && <span className="offline-badge">離線</span>}
          {pendingCount > 0 && (
            <span className="pending-badge" title="待同步的想法">
              {pendingCount}
            </span>
          )}
          {isSignedIn ? (
            <button onClick={signOut} className="auth-button">
              登出
            </button>
          ) : null}
        </div>
      </header>

      <main className="main">
        {authError && (
          <div className="auth-error">
            {authError}
          </div>
        )}

        {isSignedIn ? (
          <div className="capture-container">
            <ThoughtInput
              onSave={handleSave}
              isSaving={isSaving || isSyncing}
            />
            <SaveIndicator
              lastSaved={lastSaved}
              error={driveError}
              onDismissError={clearError}
            />
            {pendingCount > 0 && isOnline && (
              <div className="sync-status">
                正在同步 {pendingCount} 則待處理的想法...
              </div>
            )}
          </div>
        ) : (
          <div className="auth-prompt">
            <div className="auth-content">
              <div className="auth-icon">✨</div>
              <h2>捕捉靈光一閃</h2>
              <p>登入 Google 帳號，將想法儲存到 Google Drive</p>
              <button onClick={signIn} className="auth-button primary large">
                使用 Google 登入
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>想法會儲存到 Google Drive 中的 ignite-thoughts.md</p>
      </footer>
    </div>
  )
}

export default App
