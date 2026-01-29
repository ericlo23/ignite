import { Link } from 'react-router-dom'

interface ErrorHintProps {
  error: string | null
  needsReauth: boolean
  onReauthorize?: () => void
}

export function ErrorHint({ error, needsReauth, onReauthorize }: ErrorHintProps) {
  if (!error) {
    return null
  }

  const content = (
    <>
      <span className="indicator-icon">!</span>
      <div className="indicator-text">
        <div className="error-message">{error}</div>
      </div>
    </>
  )

  return needsReauth ? (
    <Link
      className="error-hint status-item error-hint-link"
      to="/auth/reauthorize"
      onClick={onReauthorize}
    >
      {content}
    </Link>
  ) : (
    <div className="error-hint status-item">{content}</div>
  )
}
