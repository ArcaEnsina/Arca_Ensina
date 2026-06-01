import { getDB } from './db'

export interface PatientSessionEntry {
  sessionId: string
  patientId: string
  data: unknown
  createdAt: number
}

export async function setSession(session: PatientSessionEntry): Promise<void> {
  const db = await getDB()
  await db.put('patientSession', session)
}

export async function getSession(sessionId: string): Promise<PatientSessionEntry | undefined> {
  const db = await getDB()
  return db.get('patientSession', sessionId)
}

export async function clearSession(sessionId: string): Promise<void> {
  const db = await getDB()
  await db.delete('patientSession', sessionId)
}
