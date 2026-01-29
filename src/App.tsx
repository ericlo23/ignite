import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useSyncOrchestrator } from './hooks/useSyncOrchestrator'
import { ThoughtInput } from './components/ThoughtInput'
import { UpdatePrompt } from './components/UpdatePrompt'
import { ErrorHint } from './components/ErrorHint'
import { AuthCallback } from './pages/AuthCallback'
import './App.css'
import './components/StatusBar.css'

// Lazy load pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })))
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })))
const Reauthorize = lazy(() => import('./pages/Reauthorize').then(module => ({ default: module.Reauthorize })))
const ReviewPage = lazy(() => import('./pages/ReviewPage').then(module => ({ default: module.ReviewPage })))

function App() {
  const { isSignedIn, isLoading, error: authError, accessToken, signIn, signOut } = useGoogleAuth()
  const {
    saveThought,
    pullAndMerge,
    isSaving,
    isSyncing,
    saveError,
    syncError,
    hasPermissionError: hasSyncPermissionError,
    clearSaveError,
    clearSyncError
  } = useSyncOrchestrator(accessToken)

  const [isOnline] = useState(navigator.onLine)

  // Auto-sync on app start and periodically when signed in
  useEffect(() => {
    if (!isSignedIn || !accessToken) return

    // Initial sync on mount
    pullAndMerge()

    // Periodic sync every 5 minutes
    const interval = setInterval(() => {
      if (navigator.onLine) {
        pullAndMerge()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isSignedIn, accessToken, pullAndMerge])

  // Sync on visibility change (tab becomes active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSignedIn && navigator.onLine) {
        pullAndMerge()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isSignedIn, pullAndMerge])

  const handleSignOut = () => {
    signOut()
    clearSaveError()
    clearSyncError()
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
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/" element={
          isLoading ? (
            <div className="app loading">
              <div className="spinner" />
            </div>
          ) : (
            <div className="app">
              <header className="header">
                <h1 className="logo">
                  <img src="/pwa-192x192.png" alt="Ignite" className="logo-icon" />
                  Ignite
                </h1>
                <div className="header-actions">
                  {!isOnline && <span className="offline-badge">Offline</span>}
                  {isSyncing && (
                    <span
                      className="sync-cloud"
                      title="Syncing to Drive..."
                      aria-label="Syncing to Drive..."
                    >
                      ☁️
                    </span>
                  )}
                  <Link to="/review" className="review-button">
                    Review
                  </Link>
                  {isSignedIn ? (
                    <button onClick={handleSignOut} className="auth-button">
                      Sign Out
                    </button>
                  ) : (
                    <button onClick={signIn} className="auth-button">
                      Sign In
                    </button>
                  )}
                </div>
              </header>

              <main className="main">
                {/* Fixed status bar */}
                <div className="status-bar">
                  <UpdatePrompt />
                  <ErrorHint
                    error={authError || syncError || saveError}
                    needsReauth={Boolean(authError) || hasSyncPermissionError}
                  />
                </div>

                {/* Input area - limited height */}
                <div className="capture-container">
                  <ThoughtInput
                    onSave={saveThought}
                    isSaving={isSaving || isSyncing}
                  />
                </div>
              </main>

              <footer className="footer">
                <p>Stored locally{isSignedIn ? ', synced to Drive' : '. Sign in for cloud sync'}.</p>
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
