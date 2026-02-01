import type { ParsedThought } from '../types'

/**
 * Parse single-line format content into structured thought entries
 * Format: {ISO 8601 timestamp} {content}
 * Example: 2026-01-26T09:15:23.456Z First thought of the day
 */
export function parseThoughts(content: string): ParsedThought[] {
  if (!content.trim()) {
    return []
  }

  const lines = content.split('\n')
  const thoughts: ParsedThought[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // Find the first space to split timestamp from content
    const spaceIndex = trimmedLine.indexOf(' ')
    if (spaceIndex === -1) continue

    const isoTimestamp = trimmedLine.substring(0, spaceIndex)
    const thoughtContent = trimmedLine.substring(spaceIndex + 1)

    // Parse the ISO 8601 timestamp
    const timestamp = new Date(isoTimestamp)
    if (isNaN(timestamp.getTime())) continue

    // Skip empty content
    if (!thoughtContent.trim()) continue

    thoughts.push({
      id: String(timestamp.getTime()),
      date: isoTimestamp.substring(0, 10),   // YYYY-MM-DD
      time: isoTimestamp.substring(11, 23),  // HH:mm:ss.sss
      content: thoughtContent,
      timestamp
    })
  }

  // Sort by timestamp, newest first
  return thoughts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
