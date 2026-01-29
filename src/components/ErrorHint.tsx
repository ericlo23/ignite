import { Link } from 'react-router-dom'

interface ErrorHintProps {
  authError: string | null
  syncError: string | null
  saveError: string | null
}

export function ErrorHint({ authError, syncError, saveError }: ErrorHintProps) {
  const error = authError || syncError || saveError

  if (!error) {
    return null
  }

  return (
    <div className="error-hint status-item">
      <span className="indicator-icon">!</span>
      <div className="indicator-text">
        <div className="error-message">{error}</div>
        {(syncError || saveError) && (
          <div className="reauth-link">
            Having trouble? <Link to="/auth/reauthorize">Reauthorize Google Drive access</Link>
          </div>
        )}
      </div>
    </div>
  )
}
