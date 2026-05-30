import { getDB } from './db'

export interface QueueEntry {
  id?: number
  type: string
  payload: unknown
  status: 'pending' | 'done' | 'error'
  createdAt: number
  retryCount: number
}

export async function enqueue(type: string, payload: unknown): Promise<number> {
  const db = await getDB()
  const id = await db.add('syncQueue', {
    type,
    payload,
    status: 'pending',
    createdAt: Date.now(),
    retryCount: 0,
  })
  return id as number
}

export async function dequeue(): Promise<QueueEntry | undefined> {
  const db = await getDB()
  const tx = db.transaction('syncQueue', 'readwrite')
  const index = tx.store.index('by-status')
  const cursor = await index.openCursor('pending')
  if (!cursor) return undefined
  const entry = { ...cursor.value }
  await cursor.delete()
  await tx.done
  return entry
}

export async function peek(): Promise<QueueEntry | undefined> {
  const db = await getDB()
  const index = db.transaction('syncQueue').store.index('by-status')
  const cursor = await index.openCursor('pending')
  return cursor ? { ...cursor.value } : undefined
}

export async function listPending(): Promise<QueueEntry[]> {
  const db = await getDB()
  return db.getAllFromIndex('syncQueue', 'by-status', 'pending')
}

export async function markDone(id: number): Promise<void> {
  const db = await getDB()
  const entry = await db.get('syncQueue', id)
  if (entry) {
    await db.put('syncQueue', { ...entry, id, status: 'done' })
  }
}

export async function markError(id: number): Promise<void> {
  const db = await getDB()
  const entry = await db.get('syncQueue', id)
  if (entry) {
    await db.put('syncQueue', {
      ...entry,
      id,
      status: 'error',
      retryCount: entry.retryCount + 1,
    })
  }
}

export async function countPending(): Promise<number> {
  const db = await getDB()
  return db.countFromIndex('syncQueue', 'by-status', 'pending')
}
