import { describe, it, expect } from 'vitest'
import { getDB } from '../db'

describe('ArcaDB', () => {
  it('opens database with version 4', async () => {
    const db = await getDB()
    expect(db.version).toBe(4)
    expect(db.name).toBe('arca-offline')
    db.close()
  })

  it('has all expected object stores', async () => {
    const db = await getDB()
    const storeNames = Array.from(db.objectStoreNames)
    expect(storeNames).toContain('protocols')
    expect(storeNames).toContain('bulas')
    expect(storeNames).toContain('syncQueue')
    expect(storeNames).toContain('patientSession')
    expect(storeNames).toContain('medicationDetails')
    db.close()
  })
})
