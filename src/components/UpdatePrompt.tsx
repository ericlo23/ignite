import { useRegisterSW } from 'virtual:pwa-register/react'
import './UpdatePrompt.css'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    }
  })

  if (!needRefresh) {
    return null
  }

  return (
    <div className="update-prompt status-item">
      <span className="update-text">New version available</span>
      <div className="update-actions">
        <button
          className="update-button primary"
          onClick={() => updateServiceWorker(true)}
        >
          Update
        </button>
        <button
          className="update-button"
          onClick={() => setNeedRefresh(false)}
        >
          Later
        </button>
      </div>
    </div>
  )
}
