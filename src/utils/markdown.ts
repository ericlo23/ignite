/**
 * Format a thought entry with timestamp for the markdown file
 */
export function formatThoughtEntry(thought: string, existingContent: string): string {
  const now = new Date()
  const dateStr = formatDate(now)
  const timeStr = formatTime(now)

  const todayHeader = `# ${dateStr}`
  const timeEntry = `## ${timeStr}\n\n${thought}\n\n---\n\n`

  // Check if today's date section already exists
  if (existingContent.includes(todayHeader)) {
    // Just return the time entry to append
    return timeEntry
  }

  // Return date header + time entry
  return `${todayHeader}\n\n${timeEntry}`
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
