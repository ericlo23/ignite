import { formatThoughtEntry, getInitialContent } from '../utils/markdown'

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
 * Find or create the thoughts markdown file in Google Drive
 */
export async function findOrCreateThoughtsFile(accessToken: string): Promise<string> {
  // Check if we have a cached file ID
  const cachedFileId = localStorage.getItem(FILE_ID_KEY)
  if (cachedFileId) {
    // Verify the file still exists
    try {
      const response = await fetch(
        `${DRIVE_API_BASE}/files/${cachedFileId}?fields=id,name,trashed`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )
      if (response.ok) {
        const file = await response.json()
        if (!file.trashed) {
          return cachedFileId
        }
      }
    } catch {
      // File might not exist, continue to search
    }
  }

  // Search for existing file
  const query = encodeURIComponent(`name='${THOUGHTS_FILE_NAME}' and trashed=false`)
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
    localStorage.setItem(FILE_ID_KEY, fileId)
    return fileId
  }

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
  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  )

  if (!response.ok) {
    throw new Error(await buildDriveError(response, 'Failed to read file'))
  }

  return response.text()
}

/**
 * Append a new thought to the file
 */
export async function appendThought(
  accessToken: string,
  fileId: string,
  thought: string
): Promise<void> {
  // Get current content
  const currentContent = await getFileContent(accessToken, fileId)

  // Format and append new entry
  const newEntry = formatThoughtEntry(thought, currentContent)
  const updatedContent = currentContent + newEntry

  // Update file
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
    throw new Error(await buildDriveError(response, 'Failed to update file'))
  }
}

/**
 * Clear cached file ID (useful when switching accounts)
 */
export function clearFileCache(): void {
  localStorage.removeItem(FILE_ID_KEY)
}
