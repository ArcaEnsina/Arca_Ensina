import { describe, it, expect } from 'vitest'
import {
  enqueue,
  listPending,
  markDone,
  markError,
  peek,
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

  it('peeks at next pending item', async () => {
    const id = await enqueue('test', { data: 42 })
    const entry = await peek()
    expect(entry).toBeDefined()
    expect(entry!.id).toBe(id)
    expect(entry!.type).toBe('test')
    expect(entry!.status).toBe('pending')
  })
})
