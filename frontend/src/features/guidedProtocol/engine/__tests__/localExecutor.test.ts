import { describe, it, expect, beforeEach } from 'vitest'
import { localExecutor, __resetLocalEngines } from '../localExecutor'
import { putProtocol, type CachedProtocol } from '@/lib/offline/protocolCache'
import { loadExecutionState } from '@/lib/offline/executionState'

/** Minimal two-step linear protocol: s1 → s2 → end. */
function cachedProtocol(): CachedProtocol {
  return {
    id: '1',
    title: 'Mini',
    cid: 'A00',
    specialty: 'UTI',
    author: 'Dr. Teste',
    tags: [],
    age_range_min: null,
    age_range_max: null,
    gender_applicable: null,
    is_active: true,
    current_version: {
      id: '99',
      protocol_type: 'guiado',
      steps_data: {
        steps: [
          { id: 's1', type: 'info', title: 'Start', next_step: 's2' },
          { id: 's2', type: 'info', title: 'End', next_step: null },
        ],
      },
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

describe('localExecutor — deterministic lookup & purge', () => {
  beforeEach(async () => {
    __resetLocalEngines()
    await putProtocol(cachedProtocol())
  })

  it('a concluded run does not shadow a fresh start of the same protocol', async () => {
    // Run A: start → advance to s2 → advance to conclude.
    await localExecutor.start(1, 'Maria', 'uuid-a')
    await localExecutor.advance(1) // s1 → s2
    const finishA = await localExecutor.advance(1) // s2 → concluido
    expect(finishA.status).toBe('concluido')

    // Run B: a brand-new client_uuid for the same protocol must start fresh at
    // s1 — not inherit run A's "concluído" engine via a stale engines entry.
    const execB = await localExecutor.start(1, 'João', 'uuid-b')
    expect(execB.status).toBe('em_andamento')
    expect(execB.currentStepKey).toBe('s1')

    const stepB = await localExecutor.getStep(1)
    expect(stepB.status).toBe('em_andamento')
    expect(stepB.step?.id).toBe('s1')
  })

  it('refreshes protocolVersionId from cache when resuming a snapshot that lacks it', async () => {
    // Simulate an online-started run that fell back: a snapshot exists but its
    // protocolVersionId was never captured (empty string).
    const { saveExecutionState } = await import('@/lib/offline/executionState')
    await saveExecutionState({
      clientUuid: 'uuid-resumed',
      currentStepKey: 's1',
      history: [],
      values: {},
      protocolVersionId: '',
      protocolId: '1',
      patientName: 'Maria',
      status: 'em_andamento',
      updatedAt: new Date().toISOString(),
    })

    await localExecutor.start(1, 'Maria', 'uuid-resumed')

    const record = await loadExecutionState('uuid-resumed')
    expect(record?.protocolVersionId).toBe('99')
  })
})
