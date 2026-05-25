import { getDB } from './db'

export interface CachedMedication {
  id: number
  name: string
  category: string
  description: string
  updatedAt: number
}

export async function putMedication(med: CachedMedication): Promise<void> {
  const db = await getDB()
  await db.put('bulas', med)
}

export async function getMedication(id: number): Promise<CachedMedication | undefined> {
  const db = await getDB()
  return db.get('bulas', id)
}

export async function getMedicationByCategory(category: string): Promise<CachedMedication[]> {
  const db = await getDB()
  return db.getAllFromIndex('bulas', 'by-category', category)
}

export async function listCached(): Promise<CachedMedication[]> {
  const db = await getDB()
  return db.getAll('bulas')
}
