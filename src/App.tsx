import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useGoogleDrive } from './hooks/useGoogleDrive'
import { useOfflineQueue } from './hooks/useOfflineQueue'
import { ThoughtInput } from './components/ThoughtInput'
import { SaveIndicator } from './components/SaveIndicator'
import { UpdatePrompt } from './components/UpdatePrompt'
import { AuthCallback } from './pages/AuthCallback'
import './App.css'

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })))
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })))
const Reauthorize = lazy(() => import('./pages/Reauthorize').then(module => ({ default: module.Reauthorize })))

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

  const handleSave = async (thought: string): Promise<boolean> => {
    if (!isOnline || !isSignedIn) {
      // Queue for later sync
      await queueEntry(thought)
      return true
    }
    return await saveThought(thought)
  }

  return (
    <Suspense fallback={
      <div className="app loading">
        <div className="spinner" />
      </div>
    }>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reauthorize" element={<Reauthorize />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/" element={
          isLoading ? (
            <div className="app loading">
              <div className="spinner" />
            </div>
          ) : (
            <div className="app">
              <UpdatePrompt />

              <header className="header">
                <h1 className="logo">
                  <img src="/pwa-192x192.png" alt="Ignite" className="logo-icon" />
                  Ignite
                </h1>
                <div className="header-actions">
                  {!isOnline && <span className="offline-badge">Offline</span>}
                  {pendingCount > 0 && (
                    <span className="pending-badge" title="Thoughts pending sync">
                      {pendingCount}
                    </span>
                  )}
                  {isSignedIn ? (
                    <button onClick={signOut} className="auth-button">
                      Sign Out
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
                    {driveError && (
                      <div className="reauth-hint">
                        Having trouble saving? <Link to="/auth/reauthorize">Reauthorize Google Drive access</Link>
                      </div>
                    )}
                    {pendingCount > 0 && isOnline && (
                      <div className="sync-status">
                        Syncing {pendingCount} pending thoughts...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="auth-prompt">
                    <div className="auth-content">
                      <img src="/pwa-192x192.png" alt="Ignite" className="auth-icon" />
                      <h2>Ignite Your Spark</h2>
                      <p>Sign in with Google to save your thoughts to Google Drive</p>
                      <button onClick={signIn} className="auth-button primary large">
                        Sign in with Google
                      </button>
                    </div>
                  </div>
                )}
              </main>

              <footer className="footer">
                <p>Thoughts are saved to ignite-thoughts.md in your Google Drive</p>
                <p className="footer-links">
                  <Link to="/privacy-policy">Privacy Policy</Link>
                  <span> · </span>
                  <Link to="/terms-of-service">Terms of Service</Link>
                </p>
              </footer>
            </div>
          )
        } />
      </Routes>
    </Suspense>
  )
}

export default App
