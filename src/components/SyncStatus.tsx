interface SyncStatusProps {
  isSignedIn: boolean
  unsyncedCount: number
}

export function SyncStatus({ isSignedIn, unsyncedCount }: SyncStatusProps) {
  if (!isSignedIn || unsyncedCount === 0) {
    return null
  }

  return (
    <div className="sync-status status-item">
      <span className="indicator-icon">☁️</span>
      <span className="indicator-text">Syncing {unsyncedCount} thoughts...</span>
    </div>
  )
}
