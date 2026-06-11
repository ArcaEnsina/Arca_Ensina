import { getDB } from './db'

export interface CachedProtocol {
  id: string
  title: string
  cid: string
  specialty: string
  author: string
  tags: string[]
  age_range_min: number | null
  age_range_max: number | null
  gender_applicable: 'M' | 'F' | null
  is_active: boolean
  current_version: {
    id: string
    protocol_type: 'guiado' | 'painel'
    steps_data: Record<string, unknown> | null
    panel_data: Record<string, unknown> | null
    version_number: number
  } | null
  versions_count: number
  created_at: string
  updated_at: string
  version: number
  downloaded_at: number
}

export async function putProtocol(protocol: CachedProtocol): Promise<void> {
  const db = await getDB()
  // O PK do protocolo é um inteiro no backend, então `id` chega como número no
  // JSON. O IndexedDB diferencia chaves numéricas de strings (2 !== "2"), e a
  // execução offline busca via `String(protocolId)`. Normalizamos a chave para
  // string na escrita para que ambos os lados batam sempre.
  await db.put('protocols', { ...protocol, id: String(protocol.id) })
}

export async function getProtocol(id: string): Promise<CachedProtocol | undefined> {
  const db = await getDB()
  return db.get('protocols', String(id))
}

export async function getProtocolsBySpecialty(specialty: string): Promise<CachedProtocol[]> {
  const db = await getDB()
  return db.getAllFromIndex('protocols', 'by-specialty', specialty)
}

export async function getAllProtocols(): Promise<CachedProtocol[]> {
  const db = await getDB()
  return db.getAll('protocols')
}

export async function deleteProtocol(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('protocols', String(id))
}

export async function isCached(id: string): Promise<boolean> {
  const db = await getDB()
  const count = await db.count('protocols', String(id))
  return count > 0
}

export async function listCached(): Promise<CachedProtocol[]> {
  const db = await getDB()
  return db.getAll('protocols')
}
