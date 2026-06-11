import { describe, it, expect, vi, afterEach } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import { enqueue, listPending } from '../executionQueue'
import { startSyncListener, stopSyncListener } from '../syncOrchestrator'
import { getDB } from '../db'
import api from '@/lib/api/client'

vi.mock('@/lib/api/client', () => ({
  default: { post: vi.fn() },
}))

const mockPost = vi.mocked(api.post)

function axiosErrorWithStatus(status: number): AxiosError {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    { status } as AxiosResponse,
  )
}

async function getEntry(id: number) {
  const db = await getDB()
  return db.get('syncQueue', id)
}

describe('syncOrchestrator', () => {
  afterEach(() => {
    stopSyncListener()
    mockPost.mockReset()
  })

  it('flushes pending entries on startup without waiting for an online event', async () => {
    mockPost.mockResolvedValue({ data: {} })
    const id = await enqueue('calculator.calculate', { dose: 1 })

    startSyncListener()

    await vi.waitFor(async () => {
      expect(mockPost).toHaveBeenCalledWith('calculator/calculate/', { dose: 1 })
      expect((await getEntry(id))!.status).toBe('done')
    })
  })

  it('keeps entry pending with backoff on transient (network) failure', async () => {
    mockPost.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'))
    const id = await enqueue('calculator.calculate', { dose: 2 })

    startSyncListener()

    await vi.waitFor(async () => {
      const entry = await getEntry(id)
      expect(entry!.status).toBe('pending')
      expect(entry!.retryCount).toBe(1)
      expect(entry!.nextAttemptAt).toBeGreaterThan(Date.now())
    })
    expect(await listPending()).toHaveLength(1)
  })

  it('keeps entry pending on 5xx failure', async () => {
    mockPost.mockRejectedValue(axiosErrorWithStatus(503))
    const id = await enqueue('calculator.calculate', { dose: 3 })

    startSyncListener()

    await vi.waitFor(async () => {
      const entry = await getEntry(id)
      expect(entry!.retryCount).toBe(1)
      expect(entry!.status).toBe('pending')
    })
  })

  it('parks entry as error on permanent 4xx failure', async () => {
    mockPost.mockRejectedValue(axiosErrorWithStatus(400))
    const id = await enqueue('calculator.calculate', { dose: 4 })

    startSyncListener()

    await vi.waitFor(async () => {
      expect((await getEntry(id))!.status).toBe('error')
    })
    expect(await listPending()).toHaveLength(0)
  })

  it('posts guided execution sync in the serializer contract shape', async () => {
    mockPost.mockResolvedValue({ data: {} })
    const id = await enqueue('guided:execution-upsert', {
      clientUuid: 'uuid-123',
      protocolVersionId: '42',
      status: 'em_andamento',
      currentStepKey: 'step_2',
      patientName: 'Maria',
      patientId: 7,
      states: [
        {
          stepKey: 'step_1',
          values: { answer: true },
          loopCount: 0,
          answeredAt: '2026-06-10T12:00:00.000Z',
        },
      ],
    })

    startSyncListener()

    await vi.waitFor(async () => {
      expect((await getEntry(id))!.status).toBe('done')
    })
    expect(mockPost).toHaveBeenCalledWith('protocol-executions/sync/', {
      client_uuid: 'uuid-123',
      protocol_version_id: 42, // coerced to number
      patient_name: 'Maria',
      patient_id: 7,
      status: 'em_andamento',
      current_step_key: 'step_2',
      states: [
        {
          step_key: 'step_1',
          values: { answer: true },
          loop_count: 0,
          gate_warnings: [],
          answered_at: '2026-06-10T12:00:00.000Z',
        },
      ],
    })
  })

  it('keeps the local state for an in-progress guided sync but clears it on concluido', async () => {
    const db = await getDB()
    const baseState = {
      currentStepKey: 'step_2',
      history: [],
      values: {},
      protocolVersionId: '42',
      protocolId: '1',
      patientName: 'Maria',
      status: 'em_andamento' as const,
      updatedAt: '2026-06-10T12:00:00.000Z',
    }
    await db.put('guidedExecutionStates', { ...baseState, clientUuid: 'uuid-live' })
    await db.put('guidedExecutionStates', {
      ...baseState,
      clientUuid: 'uuid-done',
      status: 'concluido',
    })

    mockPost.mockResolvedValue({ data: {} })
    await enqueue('guided:execution-upsert', {
      clientUuid: 'uuid-live',
      protocolVersionId: '42',
      status: 'em_andamento',
      states: [],
    })
    await enqueue('guided:execution-upsert', {
      clientUuid: 'uuid-done',
      protocolVersionId: '42',
      status: 'concluido',
      states: [],
    })

    startSyncListener()

    await vi.waitFor(async () => {
      expect(mockPost).toHaveBeenCalledTimes(2)
    })
    // in-progress run survives for continued offline use; finished one is purged
    expect(await db.get('guidedExecutionStates', 'uuid-live')).toBeDefined()
    expect(await db.get('guidedExecutionStates', 'uuid-done')).toBeUndefined()
  })

  it('does not resend an entry before its nextAttemptAt is due', async () => {
    mockPost.mockResolvedValue({ data: {} })
    const db = await getDB()
    await db.add('syncQueue', {
      type: 'calculator.calculate',
      payload: { dose: 5 },
      status: 'pending',
      createdAt: Date.now(),
      retryCount: 1,
      nextAttemptAt: Date.now() + 60_000,
    })

    startSyncListener()

    // dá tempo do flush de startup rodar
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(mockPost).not.toHaveBeenCalled()
    expect(await listPending()).toHaveLength(1)
  })
})
