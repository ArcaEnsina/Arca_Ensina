import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/lib/api/client'
import { runProtocolAutoUpdate } from '../protocolAutoUpdate'
import { putProtocol, getProtocol, deleteProtocol, listCached } from '../protocolCache'
import { saveExecutionState, deleteExecutionState } from '../executionState'
import type { CachedProtocol } from '../protocolCache'

vi.mock('@/lib/api/client', () => ({
  default: { get: vi.fn() },
}))

const mockGet = vi.mocked(api.get)

function makeCached(id: string, versionNumber: number, updatedAt: string): CachedProtocol {
  return {
    id,
    title: 'Protocolo Teste',
    cid: 'A00',
    specialty: 'UTI',
    author: 'Dr. Teste',
    tags: [],
    age_range_min: null,
    age_range_max: null,
    gender_applicable: null,
    is_active: true,
    current_version: {
      id: `v${versionNumber}`,
      protocol_type: 'guiado',
      steps_data: { steps: [] },
      panel_data: null,
      version_number: versionNumber,
    },
    versions_count: versionNumber,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: updatedAt,
    version: 1,
    downloaded_at: Date.now(),
  }
}

function makeServer(id: string, versionNumber: number, updatedAt: string) {
  const rest = { ...makeCached(id, versionNumber, updatedAt) }
  delete (rest as { downloaded_at?: number }).downloaded_at
  return rest
}

describe('protocolAutoUpdate', () => {
  beforeEach(async () => {
    mockGet.mockReset()
    for (const p of await listCached()) {
      await deleteProtocol(p.id)
    }
  })

  it('atualiza protocolo baixado quando há versão mais nova', async () => {
    await putProtocol(makeCached('p1', 1, '2024-01-01T00:00:00Z'))
    mockGet.mockResolvedValueOnce({ data: makeServer('p1', 2, '2024-02-01T00:00:00Z') })

    const updated = await runProtocolAutoUpdate()

    expect(updated).toHaveLength(1)
    const cached = await getProtocol('p1')
    expect(cached?.current_version?.version_number).toBe(2)
  })

  it('não altera o cache quando a versão é a mesma', async () => {
    await putProtocol(makeCached('p1', 1, '2024-01-01T00:00:00Z'))
    mockGet.mockResolvedValueOnce({ data: makeServer('p1', 1, '2024-01-01T00:00:00Z') })

    const updated = await runProtocolAutoUpdate()

    expect(updated).toHaveLength(0)
  })

  it('não roda quando há execução de protocolo em andamento', async () => {
    await putProtocol(makeCached('p1', 1, '2024-01-01T00:00:00Z'))
    await saveExecutionState({
      clientUuid: 'exec-1',
      currentStepKey: 'step1',
      history: [],
      values: {},
      protocolVersionId: 'v1',
      protocolId: 'p1',
      patientName: 'Paciente',
      status: 'em_andamento',
      updatedAt: new Date().toISOString(),
    })

    const updated = await runProtocolAutoUpdate()

    expect(updated).toHaveLength(0)
    expect(mockGet).not.toHaveBeenCalled()

    await deleteExecutionState('exec-1')
  })

  it('ignora erros de rede por protocolo e segue para os demais', async () => {
    await putProtocol(makeCached('p1', 1, '2024-01-01T00:00:00Z'))
    await putProtocol(makeCached('p2', 1, '2024-01-01T00:00:00Z'))
    mockGet
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ data: makeServer('p2', 3, '2024-03-01T00:00:00Z') })

    const updated = await runProtocolAutoUpdate()

    expect(updated).toHaveLength(1)
    expect(updated[0].id).toBe('p2')
  })
})
