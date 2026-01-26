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
    <div className="update-prompt">
      <span className="update-text">有新版本可用</span>
      <div className="update-actions">
        <button
          className="update-button primary"
          onClick={() => updateServiceWorker(true)}
        >
          更新
        </button>
        <button
          className="update-button"
          onClick={() => setNeedRefresh(false)}
        >
          稍後
        </button>
      </div>
    </div>
  )
}
