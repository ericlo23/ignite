import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface ThoughtEntry {
  id: number              // Date.now() - creation timestamp
  thought: string         // content
  timestamp: number       // same as id, for indexing
  syncedToDrive: boolean  // whether backed up to Drive
  lastModified: number    // for conflict resolution
}

interface IgniteDB extends DBSchema {
  thoughts: {
    key: number
    value: ThoughtEntry
    indexes: {
      'by-timestamp': number
    }
  }
}

const DB_NAME = 'ignite-thoughts'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<IgniteDB>> | null = null

function getDB(): Promise<IDBPDatabase<IgniteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<IgniteDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('thoughts', {
          keyPath: 'id'
        })
        store.createIndex('by-timestamp', 'timestamp')
      }
    })
  }
  return dbPromise
}

/**
 * Get a unique timestamp by incrementing milliseconds if collision exists
 */
async function getUniqueTimestamp(db: IDBPDatabase<IgniteDB>, baseTs: number): Promise<number> {
  let ts = baseTs
  while (await db.get('thoughts', ts)) {
    ts++
  }
  return ts
}

/**
 * Save a thought to local storage - primary save function
 * Always succeeds locally, returns timestamp ID
 * Handles timestamp collisions by incrementing millisecond
 */
export async function saveThought(thought: string): Promise<number> {
  const db = await getDB()
  const baseTs = Date.now()
  const id = await getUniqueTimestamp(db, baseTs)
  const entry: ThoughtEntry = {
    id,
    thought,
    timestamp: id,
    syncedToDrive: false,
    lastModified: id
  }
  await db.add('thoughts', entry)
  return id
}

/**
 * Get all thoughts for Review page
 * Returns sorted by timestamp (newest first)
 */
export async function getAllThoughts(): Promise<ThoughtEntry[]> {
  const db = await getDB()
  const thoughts = await db.getAllFromIndex('thoughts', 'by-timestamp')
  // Sort newest first
  return thoughts.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Get unsynced thoughts for background upload
 */
export async function getUnsyncedThoughts(): Promise<ThoughtEntry[]> {
  const db = await getDB()
  const tx = db.transaction('thoughts', 'readonly')
  const store = tx.objectStore('thoughts')
  const all = await store.getAll()
  await tx.done

  // Filter for unsynced thoughts
  return all.filter(thought => !thought.syncedToDrive)
}

/**
 * Mark a thought as synced to Drive after successful upload
 */
export async function markSyncedToDrive(id: number): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('thoughts', 'readwrite')
  const store = tx.objectStore('thoughts')
  const entry = await store.get(id)

  if (entry) {
    entry.syncedToDrive = true
    entry.lastModified = Date.now()
    await store.put(entry)
  }

  await tx.done
}

/**
 * Merge thoughts from Drive, deduplicating by timestamp
 * Drive is the source of truth - local conflicts are relocated
 */
export async function mergeThoughtsFromDrive(
  driveThoughts: ThoughtEntry[]
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('thoughts', 'readwrite')
  const store = tx.objectStore('thoughts')

  for (const driveThought of driveThoughts) {
    const existing = await store.get(driveThought.id)

    if (!existing) {
      // No collision, insert directly
      await store.add({
        ...driveThought,
        syncedToDrive: true
      })
    } else if (existing.thought === driveThought.thought) {
      // Same content, mark as synced (duplicate)
      if (!existing.syncedToDrive) {
        await store.put({
          ...existing,
          syncedToDrive: true
        })
      }
    } else {
      // Different content with same timestamp - relocate LOCAL thought
      // Drive is source of truth, so we preserve Drive timestamp

      // 1. Find new unique timestamp for local thought
      let newLocalTs = existing.id + 1
      while (await store.get(newLocalTs)) {
        newLocalTs++
      }

      // 2. Delete old local entry
      await store.delete(existing.id)

      // 3. Re-insert local with new timestamp (mark as unsynced since it moved)
      await store.add({
        ...existing,
        id: newLocalTs,
        timestamp: newLocalTs,
        syncedToDrive: false,
        lastModified: Date.now()
      })

      // 4. Insert Drive thought at original timestamp
      await store.add({
        ...driveThought,
        syncedToDrive: true
      })
    }
  }

  await tx.done
}

/**
 * Get sync statistics for UI
 */
export async function getSyncStats(): Promise<{ total: number; synced: number; unsynced: number }> {
  const db = await getDB()
  const total = await db.count('thoughts')

  const tx = db.transaction('thoughts', 'readonly')
  const store = tx.objectStore('thoughts')
  const all = await store.getAll()
  await tx.done

  const synced = all.filter(t => t.syncedToDrive).length

  return {
    total,
    synced,
    unsynced: total - synced
  }
}
