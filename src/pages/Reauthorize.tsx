import { Link } from 'react-router-dom'
import { useGoogleAuth } from '../hooks/useGoogleAuth'

export function Reauthorize() {
  const { signIn, isLoading } = useGoogleAuth()

  return (
    <div className="app">
      <main className="main">
        <div className="auth-prompt">
          <div className="auth-content">
            <img src="/pwa-192x192.png" alt="Ignite" className="auth-icon" />
            <h2>Reauthorize Google Drive Access</h2>
            <p>Ignite needs Google Drive permission to save to ignite-thoughts.md.</p>
            <ol className="auth-steps">
              <li>Click the button below to open Google sign-in.</li>
              <li>
                On the consent screen, make sure the Google Drive permission is checked
                (the one that lets Ignite create and edit its own files).
              </li>
              <li>Click Continue or Allow to finish.</li>
            </ol>
            <button onClick={signIn} className="auth-button primary large" disabled={isLoading}>
              Reauthorize with Google
            </button>
            <div className="auth-secondary">
              <Link to="/">Back to Ignite</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
