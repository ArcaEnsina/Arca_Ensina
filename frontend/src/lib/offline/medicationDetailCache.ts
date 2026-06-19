import { getDB } from './db'
import type { Medication } from '@/features/calculator/types'

export async function putDetail(med: Medication & { updatedAt?: number }): Promise<void> {
  const db = await getDB()
  await db.put('medicationDetails', { ...med, updatedAt: med.updatedAt ?? Date.now() })
}

export async function putDetails(meds: Medication[]): Promise<void> {
  if (meds.length === 0) return
  const db = await getDB()
  const now = Date.now()
  const tx = db.transaction('medicationDetails', 'readwrite')
  await Promise.all([
    ...meds.map((med) => tx.store.put({ ...med, updatedAt: now })),
    tx.done,
  ])
}

export async function getDetail(id: number): Promise<(Medication & { updatedAt?: number }) | undefined> {
  const db = await getDB()
  const result = await db.get('medicationDetails', id)
  return result as (Medication & { updatedAt?: number }) | undefined
}
