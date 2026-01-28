import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { handleAuthCallback } from '../services/googleAuth'

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      setError('Missing authorization code or state')
      return
    }

    handleAuthCallback(code, state)
      .then(() => {
        navigate('/', { replace: true })
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Authentication failed')
      })
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="app">
        <main className="main">
          <div className="auth-prompt">
            <div className="auth-content">
              <h2>Sign In Failed</h2>
              <p>{error}</p>
              <button onClick={() => navigate('/', { replace: true })} className="auth-button primary large">
                Back to Ignite
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app loading">
      <div className="spinner" />
    </div>
  )
}
