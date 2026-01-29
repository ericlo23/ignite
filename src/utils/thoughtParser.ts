import type { ParsedThought } from '../types'

/**
 * Parse markdown content into structured thought entries
 */
export function parseThoughts(markdown: string): ParsedThought[] {
  if (!markdown.trim()) {
    return []
  }

  const lines = markdown.split('\n')
  const thoughts: ParsedThought[] = []

  let currentDate: string | null = null
  let currentTime: string | null = null
  let currentTimestampMs: number | null = null
  let currentContent: string[] = []
  let captureContent = false

  const finishThought = () => {
    if (currentDate && currentTime && currentContent.length > 0) {
      const content = currentContent.join('\n').trim()
      if (content) {
        try {
          // Use precise timestamp if available, otherwise parse from date/time
          const timestamp = currentTimestampMs
            ? new Date(currentTimestampMs)
            : parseTimestamp(currentDate, currentTime)

          thoughts.push({
            id: `${currentDate}-${currentTime}`,
            date: currentDate,
            time: currentTime,
            content,
            timestamp
          })
        } catch {
          // Skip malformed timestamps
        }
      }
    }
    currentContent = []
    currentTimestampMs = null
    captureContent = false
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Date header: # YYYY-MM-DD
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
      finishThought()
      currentDate = trimmedLine.substring(2).trim()
      continue
    }

    // Time header: ## HH:MM AM/PM <!-- timestamp -->
    if (trimmedLine.startsWith('## ')) {
      finishThought()

      // Extract time and optional timestamp
      const timeHeader = trimmedLine.substring(3).trim()

      // Check for timestamp in HTML comment
      const timestampMatch = timeHeader.match(/<!--\s*(\d+)\s*-->/)
      if (timestampMatch) {
        currentTimestampMs = parseInt(timestampMatch[1], 10)
        // Remove the comment from the time string
        currentTime = timeHeader.replace(/\s*<!--\s*\d+\s*-->/, '').trim()
      } else {
        currentTime = timeHeader
        currentTimestampMs = null
      }

      captureContent = true
      continue
    }

    // Separator: ---
    if (trimmedLine === '---') {
      finishThought()
      continue
    }

    // Capture content between time header and separator
    if (captureContent && trimmedLine) {
      currentContent.push(line)
    }
  }

  // Handle last thought if no trailing separator
  finishThought()

  // Sort by timestamp, newest first
  return thoughts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Parse date and time strings into a Date object
 */
function parseTimestamp(dateStr: string, timeStr: string): Date {
  // Parse date: YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number)

  // Parse time: HH:MM AM/PM
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!timeMatch) {
    throw new Error('Invalid time format')
  }

  let hours = parseInt(timeMatch[1], 10)
  const minutes = parseInt(timeMatch[2], 10)
  const meridiem = timeMatch[3].toUpperCase()

  // Convert to 24-hour format
  if (meridiem === 'PM' && hours !== 12) {
    hours += 12
  } else if (meridiem === 'AM' && hours === 12) {
    hours = 0
  }

  return new Date(year, month - 1, day, hours, minutes)
}
