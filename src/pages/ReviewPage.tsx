import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllThoughts } from '../services/storage'
import { formatDate, formatTime } from '../utils/markdown'
import './ReviewPage.css'

interface DisplayThought {
  id: string
  date: string
  time: string
  content: string
  timestamp: number
  syncedToDrive: boolean
}

export function ReviewPage() {
  const [thoughts, setThoughts] = useState<DisplayThought[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLocalThoughts()
  }, [])

  async function loadLocalThoughts() {
    setIsLoading(true)
    setError(null)

    try {
      const entries = await getAllThoughts()

      // Transform to display format
      const parsed: DisplayThought[] = entries.map(entry => ({
        id: `${entry.timestamp}`,
        date: formatDate(new Date(entry.timestamp)),
        time: formatTime(new Date(entry.timestamp)),
        content: entry.thought,
        timestamp: entry.timestamp,
        syncedToDrive: entry.syncedToDrive
      }))

      // Deduplicate by timestamp (millisecond precision)
      const uniqueThoughts = Array.from(
        new Map(parsed.map(t => [t.timestamp, t])).values()
      )

      setThoughts(uniqueThoughts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thoughts')
    } finally {
      setIsLoading(false)
    }
  }

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
          <button onClick={loadLocalThoughts} className="retry-button">
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
                    {!thought.syncedToDrive && (
                      <span className="pending-badge">Not synced</span>
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
