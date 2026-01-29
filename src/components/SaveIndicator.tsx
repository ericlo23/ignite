import './SaveIndicator.css'

interface SaveIndicatorProps {
  lastSaved: Date | null
  error: string | null
  onDismissError?: () => void
}

export function SaveIndicator({ lastSaved, error, onDismissError }: SaveIndicatorProps) {
  if (error) {
    return (
      <div className="save-indicator status-item error" onClick={onDismissError}>
        <span className="indicator-icon">!</span>
        <span className="indicator-text">{error}</span>
      </div>
    )
  }

  if (!lastSaved) {
    return null
  }

  const timeStr = lastSaved.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="save-indicator status-item success">
      <span className="indicator-icon">✓</span>
      <span className="indicator-text">Saved at {timeStr}</span>
    </div>
  )
}
