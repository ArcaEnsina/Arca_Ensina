import { getDB } from './db'
import type { Medication } from '@/features/calculator/types'

export async function putDetail(med: Medication & { updatedAt?: number }): Promise<void> {
  const db = await getDB()
  await db.put('medicationDetails', { ...med, updatedAt: med.updatedAt ?? Date.now() })
}

export async function getDetail(id: number): Promise<(Medication & { updatedAt?: number }) | undefined> {
  const db = await getDB()
  return db.get('medicationDetails', id)
}
