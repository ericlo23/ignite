import { useEffect, useState, lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { useGoogleAuth } from './hooks/useGoogleAuth'
import { useGoogleDrive } from './hooks/useGoogleDrive'
import { saveThought, getSyncStats } from './services/storage'
import { ThoughtInput } from './components/ThoughtInput'
import { SaveIndicator } from './components/SaveIndicator'
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
  const { pullAndMerge, syncThoughtToDrive, isSyncing, syncError, clearSyncError } = useGoogleDrive(accessToken)

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncStats, setSyncStats] = useState({ total: 0, synced: 0, unsynced: 0 })
  const [isOnline] = useState(navigator.onLine)

  // Update sync stats periodically
  const updateSyncStats = async () => {
    const stats = await getSyncStats()
    setSyncStats(stats)
  }

  // Initial sync stats load
  useEffect(() => {
    updateSyncStats()
  }, [])

  // Auto-sync on app start and periodically when signed in
  useEffect(() => {
    if (!isSignedIn || !accessToken) return

    // Initial sync on mount
    pullAndMerge()
      .then(() => updateSyncStats())
      .catch(console.error)

    // Periodic sync every 5 minutes
    const interval = setInterval(() => {
      if (navigator.onLine) {
        pullAndMerge()
          .then(() => updateSyncStats())
          .catch(console.error)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isSignedIn, accessToken, pullAndMerge])

  // Sync on visibility change (tab becomes active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSignedIn && navigator.onLine) {
        pullAndMerge()
          .then(() => updateSyncStats())
          .catch(console.error)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isSignedIn, pullAndMerge])

  const handleSave = async (thought: string): Promise<boolean> => {
    if (!thought.trim()) return false

    setIsSaving(true)
    setSaveError(null)

    try {
      // Always save locally first
      const id = await saveThought(thought.trim())
      setLastSaved(new Date())
      await updateSyncStats()

      // Background sync to Drive if signed in and online
      if (isSignedIn && isOnline) {
        syncThoughtToDrive(id, thought.trim()).then(() => {
          // Update stats after sync completes
          updateSyncStats()
        })
      }

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save'
      setSaveError(message)
      return false
    } finally {
      setIsSaving(false)
    }
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
                    <span className="pending-badge" title="Thoughts pending sync">
                      {syncStats.unsynced}
                    </span>
                  )}
                  <Link to="/review" className="review-button">
                    Review
                  </Link>
                  {isSignedIn ? (
                    <button onClick={signOut} className="auth-button">
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
                  <SaveIndicator
                    lastSaved={lastSaved}
                    error={saveError || syncError}
                    onDismissError={() => {
                      setSaveError(null)
                      clearSyncError()
                    }}
                  />
                  <ErrorHint
                    authError={authError}
                    syncError={syncError}
                    saveError={saveError}
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
