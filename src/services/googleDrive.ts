import { formatThoughtEntry, getInitialContent, generateMarkdown } from '../utils/markdown'
import { parseThoughts } from '../utils/thoughtParser'
import type { ParsedThought } from '../types'
import type { ThoughtEntry } from './storage'
import { logger } from '../utils/logger'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'
const THOUGHTS_FILE_NAME = 'ignite-thoughts.md'
const FILE_ID_KEY = 'ignite_file_id'
const DRIVE_PERMISSION_ERROR = 'Google Drive permission missing. Please reauthorize and ensure Drive access is checked.'

interface DriveFile {
  id: string
  name: string
}

interface SearchResult {
  files: DriveFile[]
}

async function buildDriveError(response: Response, fallback: string): Promise<string> {
  if (response.status === 401 || response.status === 403) {
    return DRIVE_PERMISSION_ERROR
  }

  if (response.status === 404) {
    return 'File not found'
  }

  try {
    const data = await response.json() as { error?: { message?: string } }
    if (data?.error?.message) {
      return data.error.message
    }
  } catch {
    // Ignore parse errors
  }

  return fallback
}

/**
 * Check if an error indicates a Google Drive permission issue
 * Detects 401/403 errors and permission-related messages
 */
export function isPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('403')
  )
}

/**
 * Find or create the thoughts markdown file in Google Drive
 */
export async function findOrCreateThoughtsFile(accessToken: string): Promise<string> {
  // Check if we have a cached file ID
  const cachedFileId = localStorage.getItem(FILE_ID_KEY)
  if (cachedFileId) {
    // Verify the file still exists
    try {
      logger.api(`GET /files/${cachedFileId} → Verifying cached file`)
      const response = await fetch(
        `${DRIVE_API_BASE}/files/${cachedFileId}?fields=id,name,trashed`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )
      if (response.ok) {
        const file = await response.json()
        if (!file.trashed) {
          logger.api(`GET /files/${cachedFileId} ← File valid`)
          return cachedFileId
        }
        logger.api(`GET /files/${cachedFileId} ← File trashed`)
      }
    } catch (error) {
      // File might not exist, continue to search
      logger.api(`GET /files/${cachedFileId} ← Error`, error)
    }
  }

  // Search for existing file
  const query = encodeURIComponent(`name='${THOUGHTS_FILE_NAME}' and trashed=false`)
  logger.api(`GET /files?q=${THOUGHTS_FILE_NAME} → Searching for file`)
  const searchResponse = await fetch(
    `${DRIVE_API_BASE}/files?q=${query}&spaces=drive&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  )

  if (!searchResponse.ok) {
    throw new Error(await buildDriveError(searchResponse, 'Failed to search for file'))
  }

  const searchResult: SearchResult = await searchResponse.json()

  if (searchResult.files && searchResult.files.length > 0) {
    const fileId = searchResult.files[0].id
    logger.api(`GET /files?q=${THOUGHTS_FILE_NAME} ← File found`, { fileId })
    localStorage.setItem(FILE_ID_KEY, fileId)
    return fileId
  }
  logger.api(`GET /files?q=${THOUGHTS_FILE_NAME} ← No file found`)

  // Create new file with initial content
  const metadata = {
    name: THOUGHTS_FILE_NAME,
    mimeType: 'text/markdown'
  }

  const initialContent = getInitialContent()

  const form = new FormData()
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  )
  form.append('file', new Blob([initialContent], { type: 'text/markdown' }))

  logger.api('POST /upload/files → Creating new file')
  const createResponse = await fetch(
    `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    }
  )

  if (!createResponse.ok) {
    throw new Error(await buildDriveError(createResponse, 'Failed to create file'))
  }

  const createResult = await createResponse.json()
  logger.api('POST /upload/files ← File created', { fileId: createResult.id })
  localStorage.setItem(FILE_ID_KEY, createResult.id)
  return createResult.id
}

/**
 * Get the content of a file
 */
export async function getFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  logger.api(`GET /files/${fileId}?alt=media → Fetching content`)
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  )

  if (!response.ok) {
    throw new Error(await buildDriveError(response, 'Failed to read file'))
  }

  const content = await response.text()
  logger.api(`GET /files/${fileId}?alt=media ← Content received`, { length: content.length })
  return content
}

/**
 * Append a new thought to the file
 */
export async function appendThought(
  accessToken: string,
  fileId: string,
  thought: string,
  timestamp: number
): Promise<void> {
  // Get current content
  const currentContent = await getFileContent(accessToken, fileId)

  // Format and append new entry with precise timestamp
  const newEntry = formatThoughtEntry(thought, currentContent, timestamp)
  const updatedContent = currentContent + newEntry

  // Update file
  logger.api(`PATCH /upload/files/${fileId} → Appending thought`)
  const response = await fetch(
    `${UPLOAD_API_BASE}/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/markdown'
      },
      body: updatedContent
    }
  )

  if (!response.ok) {
    logger.api(`PATCH /upload/files/${fileId} ← Error ${response.status}`)
    throw new Error(await buildDriveError(response, 'Failed to update file'))
  }

  logger.api(`PATCH /upload/files/${fileId} ← Success`)
}

/**
 * Get all thoughts from the file
 */
export async function getAllThoughts(accessToken: string): Promise<ParsedThought[]> {
  const fileId = await findOrCreateThoughtsFile(accessToken)
  const content = await getFileContent(accessToken, fileId)
  return parseThoughts(content)
}

/**
 * Clear cached file ID (useful when switching accounts)
 */
export function clearFileCache(): void {
  localStorage.removeItem(FILE_ID_KEY)
}

/**
 * Parse Drive file content into ThoughtEntry format
 * Converts ParsedThought to ThoughtEntry with timestamp-based IDs
 */
export function parseThoughtsToEntries(content: string): ThoughtEntry[] {
  const parsed = parseThoughts(content)

  return parsed.map(thought => ({
    id: thought.timestamp.getTime(),
    thought: thought.content,
    timestamp: thought.timestamp.getTime(),
    syncedToDrive: true,
    lastModified: thought.timestamp.getTime()
  }))
}

/**
 * Upload complete thought list to Drive (replaces file content)
 * Used for bulk sync operations
 */
export async function uploadThoughts(
  accessToken: string,
  fileId: string,
  thoughts: ThoughtEntry[]
): Promise<void> {
  // Generate markdown from thoughts
  const markdown = generateMarkdown(thoughts)

  // Upload to Drive
  logger.api(`PATCH /upload/files/${fileId} → Uploading ${thoughts.length} thoughts`)
  const response = await fetch(
    `${UPLOAD_API_BASE}/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'text/markdown'
      },
      body: markdown
    }
  )

  if (!response.ok) {
    logger.api(`PATCH /upload/files/${fileId} ← Error ${response.status}`)
    throw new Error(await buildDriveError(response, 'Failed to upload thoughts'))
  }

  logger.api(`PATCH /upload/files/${fileId} ← Success`)
}
