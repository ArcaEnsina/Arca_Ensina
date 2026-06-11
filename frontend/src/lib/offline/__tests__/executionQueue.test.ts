import { describe, it, expect } from 'vitest'
import {
  enqueue,
  listPending,
  markDone,
  markError,
  markRetry,
  peek,
  upsertQueueEntry,
} from '../executionQueue'

describe('executionQueue', () => {
  it('enqueues and lists pending items', async () => {
    await enqueue('test', { x: 1 })
    await enqueue('test', { x: 2 })
    const pending = await listPending()
    expect(pending).toHaveLength(2)
  })

  it('marks item as done', async () => {
    const id = await enqueue('test', {})
    await markDone(id)
    const pending = await listPending()
    expect(pending).toHaveLength(0)
  })

  it('marks item as error', async () => {
    const id = await enqueue('test', {})
    await markError(id)
    const pending = await listPending()
    expect(pending).toHaveLength(0)
  })

  it('keeps item pending with backoff on markRetry', async () => {
    const id = await enqueue('test', {})
    const before = Date.now()
    await markRetry(id, 5_000)
    const pending = await listPending()
    expect(pending).toHaveLength(1)
    expect(pending[0].retryCount).toBe(1)
    expect(pending[0].nextAttemptAt).toBeGreaterThanOrEqual(before + 5_000)
  })

  it('peeks at next pending item', async () => {
    const id = await enqueue('test', { data: 42 })
    const entry = await peek()
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(id)
    expect(entry!.type).toBe('test')
    expect(entry!.status).toBe('pending')
  })

  describe('upsertQueueEntry', () => {
    it('replaces the pending entry for the same type + clientUuid instead of appending', async () => {
      const first = await upsertQueueEntry('guided:execution-upsert', 'uuid-a', {
        clientUuid: 'uuid-a',
        currentStepKey: 'step_1',
      })
      const second = await upsertQueueEntry('guided:execution-upsert', 'uuid-a', {
        clientUuid: 'uuid-a',
        currentStepKey: 'step_2',
      })

      expect(second).toBe(first) // same row reused
      const pending = await listPending()
      expect(pending).toHaveLength(1)
      expect(
        (pending[0].payload as { currentStepKey: string }).currentStepKey,
      ).toBe('step_2')
    })

    it('keeps separate entries for different clientUuids', async () => {
      await upsertQueueEntry('guided:execution-upsert', 'uuid-a', {
        clientUuid: 'uuid-a',
      })
      await upsertQueueEntry('guided:execution-upsert', 'uuid-b', {
        clientUuid: 'uuid-b',
      })

      expect(await listPending()).toHaveLength(2)
    })

    it('does not dedup across different queue types', async () => {
      await enqueue('calculator.calculate', { clientUuid: 'uuid-a' })
      await upsertQueueEntry('guided:execution-upsert', 'uuid-a', {
        clientUuid: 'uuid-a',
      })

      expect(await listPending()).toHaveLength(2)
    })
  })
})
