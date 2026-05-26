import { describe, it, expect } from 'vitest'
import {
  putMedication,
  getMedication,
  listCached,
  isCached,
} from '../medicationCache'

describe('medicationCache', () => {
  it('puts and gets a medication', async () => {
    const med = {
      id: 1,
      name: 'Adrenalina',
      category: 'Vasopressor',
      description: 'Catecolamina',
      updatedAt: Date.now(),
    }
    await putMedication(med)
    const cached = await getMedication(1)
    expect(cached).toEqual(med)
  })

  it('lists cached medications', async () => {
    await putMedication({ id: 1, name: 'A', category: 'X', description: '', updatedAt: 1 })
    await putMedication({ id: 2, name: 'B', category: 'Y', description: '', updatedAt: 2 })
    const all = await listCached()
    expect(all).toHaveLength(2)
  })

  it('checks if medication is cached', async () => {
    expect(await isCached(99)).toBe(false)
    await putMedication({ id: 99, name: 'Z', category: 'Z', description: '', updatedAt: 1 })
    expect(await isCached(99)).toBe(true)
  })
})
