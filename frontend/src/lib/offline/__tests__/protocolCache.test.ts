import { describe, it, expect } from 'vitest'
import {
  putProtocol,
  getProtocol,
  getAllProtocols,
  deleteProtocol,
  isCached,
  getProtocolsBySpecialty,
} from '../protocolCache'
import type { CachedProtocol } from '../protocolCache'

function makeProtocol(id: string, specialty: string = 'UTI'): CachedProtocol {
  return {
    id,
    title: 'Protocolo Teste',
    cid: 'A00',
    specialty,
    author: 'Dr. Teste',
    tags: ['tag1'],
    age_range_min: null,
    age_range_max: null,
    gender_applicable: null,
    is_active: true,
    current_version: {
      id: 'v1',
      protocol_type: 'guiado',
      steps_data: { steps: [] },
      panel_data: null,
      version_number: 1,
    },
    versions_count: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    version: 1,
    downloaded_at: Date.now(),
  }
}

describe('protocolCache', () => {
  it('puts and gets a protocol', async () => {
    const protocol = makeProtocol('p1')
    await putProtocol(protocol)
    const cached = await getProtocol('p1')
    expect(cached).toEqual(protocol)
  })

  it('returns undefined for missing protocol', async () => {
    const cached = await getProtocol('nonexistent')
    expect(cached).toBeUndefined()
  })

  it('lists all protocols', async () => {
    await putProtocol(makeProtocol('p1'))
    await putProtocol(makeProtocol('p2'))
    const all = await getAllProtocols()
    expect(all).toHaveLength(2)
    expect(all.map(p => p.id)).toContain('p1')
    expect(all.map(p => p.id)).toContain('p2')
  })

  it('deletes a protocol', async () => {
    await putProtocol(makeProtocol('p1'))
    await deleteProtocol('p1')
    const cached = await getProtocol('p1')
    expect(cached).toBeUndefined()
  })

  it('checks if protocol is cached', async () => {
    expect(await isCached('p1')).toBe(false)
    await putProtocol(makeProtocol('p1'))
    expect(await isCached('p1')).toBe(true)
  })

  it('filters protocols by specialty', async () => {
    await putProtocol(makeProtocol('p1', 'UTI'))
    await putProtocol(makeProtocol('p2', 'Cardiologia'))
    await putProtocol(makeProtocol('p3', 'UTI'))
    const uti = await getProtocolsBySpecialty('UTI')
    expect(uti).toHaveLength(2)
    expect(uti.map(p => p.id).sort()).toEqual(['p1', 'p3'])
  })
})
