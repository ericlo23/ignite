import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { useThoughts } from '../hooks/useThoughts'
import './ReviewPage.css'

export function ReviewPage() {
  const { accessToken } = useGoogleAuth()
  const { thoughts, isLoading, error, loadThoughts } = useThoughts(accessToken)

  useEffect(() => {
    if (accessToken) {
      loadThoughts()
    }
  }, [accessToken, loadThoughts])

  if (isLoading) {
    return (
      <div className="review-page loading">
        <div className="spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="review-page">
        <header className="review-header">
          <Link to="/" className="back-link">← Back to Capture</Link>
        </header>
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={loadThoughts} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (thoughts.length === 0) {
    return (
      <div className="review-page">
        <header className="review-header">
          <Link to="/" className="back-link">← Back to Capture</Link>
        </header>
        <div className="empty-state">
          <p className="empty-message">No thoughts captured yet</p>
          <Link to="/" className="empty-link">Start capturing thoughts →</Link>
        </div>
      </div>
    )
  }

  // Group thoughts by date
  const thoughtsByDate = new Map<string, typeof thoughts>()
  for (const thought of thoughts) {
    const dateThoughts = thoughtsByDate.get(thought.date) || []
    dateThoughts.push(thought)
    thoughtsByDate.set(thought.date, dateThoughts)
  }

  return (
    <div className="review-page">
      <header className="review-header">
        <Link to="/" className="back-link">← Back to Capture</Link>
      </header>

      <main className="review-content">
        {Array.from(thoughtsByDate.entries()).map(([date, dateThoughts]) => (
          <section key={date} className="date-group">
            <h1 className="date-header">{date}</h1>
            <div className="thoughts-list">
              {dateThoughts.map(thought => (
                <article key={thought.id} className="thought-card">
                  <div className="thought-header">
                    <time className="thought-time">{thought.time}</time>
                    {thought.isPending && (
                      <span className="pending-badge">Pending sync</span>
                    )}
                  </div>
                  <p className="thought-content">{thought.content}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
