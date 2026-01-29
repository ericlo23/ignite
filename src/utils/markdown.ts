/**
 * Format a thought entry with timestamp for the markdown file
 */
export function formatThoughtEntry(thought: string, existingContent: string, timestamp?: number): string {
  const now = new Date(timestamp || Date.now())
  const dateStr = formatDate(now)
  const timeStr = formatTime(now)
  const tsMs = now.getTime()

  const todayHeader = `# ${dateStr}`
  const timeEntry = `## ${timeStr} <!-- ${tsMs} -->\n\n${thought}\n\n---\n\n`

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

/**
 * Generate markdown content from array of thought entries
 * Used for full Drive file uploads
 */
export function generateMarkdown(
  thoughts: Array<{ timestamp: number; thought: string }>
): string {
  // Sort by timestamp (oldest first for chronological order in file)
  const sorted = [...thoughts].sort((a, b) => a.timestamp - b.timestamp)

  let markdown = ''
  let currentDate = ''

  for (const thought of sorted) {
    const date = new Date(thought.timestamp)
    const dateStr = formatDate(date)
    const timeStr = formatTime(date)
    const tsMs = thought.timestamp

    // Add date header if changed
    if (dateStr !== currentDate) {
      if (markdown) markdown += '\n'
      markdown += `# ${dateStr}\n\n`
      currentDate = dateStr
    }

    // Add time and content with millisecond timestamp
    markdown += `## ${timeStr} <!-- ${tsMs} -->\n\n${thought.thought}\n\n---\n\n`
  }

  return markdown
}
