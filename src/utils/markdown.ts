/**
 * Format a thought entry as a single line with ISO 8601 timestamp
 * Format: {ISO 8601 timestamp} {content}
 */
export function formatThoughtEntry(_thought: string, _existingContent: string, timestamp?: number): string {
  const date = new Date(timestamp || Date.now())
  return `${date.toISOString()} ${_thought}\n`
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format time as HH:MM AM/PM
 */
export function formatTime(date: Date): string {
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'

  hours = hours % 12
  hours = hours ? hours : 12 // 0 should be 12

  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
}

/**
 * Get initial markdown file content
 */
export function getInitialContent(): string {
  return ''
}

/**
 * Generate content from array of thought entries
 * One line per thought: {ISO 8601 timestamp} {content}
 */
export function generateMarkdown(
  thoughts: Array<{ timestamp: number; thought: string }>
): string {
  if (thoughts.length === 0) {
    return ''
  }

  // Sort by timestamp (oldest first for chronological order in file)
  const sorted = [...thoughts].sort((a, b) => a.timestamp - b.timestamp)

  return sorted.map(t => `${new Date(t.timestamp).toISOString()} ${t.thought}`).join('\n') + '\n'
}
