import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { ThoughtEntry } from '../types'

interface IgniteDB extends DBSchema {
  pendingEntries: {
    key: number
    value: ThoughtEntry
    indexes: { 'by-timestamp': number }
  }
}

const DB_NAME = 'ignite-thoughts'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<IgniteDB>> | null = null

function getDB(): Promise<IDBPDatabase<IgniteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<IgniteDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('pendingEntries', {
          keyPath: 'id'
        })
        store.createIndex('by-timestamp', 'timestamp')
      }
    })
  }
  return dbPromise
}

/**
 * Queue a thought for offline storage
 */
export async function queueOfflineEntry(thought: string): Promise<number> {
  const db = await getDB()
  const id = Date.now()
  await db.add('pendingEntries', {
    id,
    thought,
    timestamp: id,
    synced: false
  })
  return id
}

/**
 * Get all pending (unsynced) entries
 */
export async function getPendingEntries(): Promise<ThoughtEntry[]> {
  const db = await getDB()
  return db.getAllFromIndex('pendingEntries', 'by-timestamp')
}

/**
 * Get count of pending entries
 */
export async function getPendingCount(): Promise<number> {
  const db = await getDB()
  return db.count('pendingEntries')
}

/**
 * Mark an entry as synced (delete it from pending)
 */
export async function markEntrySynced(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('pendingEntries', id)
}

/**
 * Clear all pending entries
 */
export async function clearPendingEntries(): Promise<void> {
  const db = await getDB()
  await db.clear('pendingEntries')
}
