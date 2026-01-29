import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useGoogleDrive } from './hooks/useGoogleDrive'
import { useThoughtStorage } from './hooks/useThoughtStorage'
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
  const { pullAndMerge, syncThoughtToDrive, isSyncing, syncError, hasPermissionError: hasSyncPermissionError, clearSyncError } = useGoogleDrive(accessToken)
  const { saveThought, isSaving, saveError, syncStats, updateSyncStats, clearSaveError } = useThoughtStorage()

  const [isOnline] = useState(navigator.onLine)

  // Auto-sync on app start and periodically when signed in
  useEffect(() => {
    if (!isSignedIn || !accessToken) return

    // Initial sync on mount
    pullAndMerge().then(() => updateSyncStats())

    // Periodic sync every 5 minutes
    const interval = setInterval(() => {
      if (navigator.onLine) {
        pullAndMerge().then(() => updateSyncStats())
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isSignedIn, accessToken, pullAndMerge])

  // Sync on visibility change (tab becomes active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSignedIn && navigator.onLine) {
        pullAndMerge().then(() => updateSyncStats())
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isSignedIn, pullAndMerge])

  const handleSave = async (thought: string): Promise<boolean> => {
    if (!thought.trim()) return false

    try {
      // Save locally first
      const id = await saveThought(thought.trim())

      // Background sync to Drive if signed in and online
      if (isSignedIn && isOnline) {
        syncThoughtToDrive(id, thought.trim()).then(() => {
          // Update stats after sync completes
          updateSyncStats()
        })
      }

      return true
    } catch (error) {
      return false
    }
  }

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
                  {syncStats.unsynced > 0 && isSignedIn && (
                    <span
                      className="sync-cloud"
                      title={`Syncing ${syncStats.unsynced} thought${syncStats.unsynced === 1 ? '' : 's'}...`}
                      aria-label={`Syncing ${syncStats.unsynced} thought${syncStats.unsynced === 1 ? '' : 's'}...`}
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
                    onSave={handleSave}
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
