import { describe, it, expect } from 'vitest'
import { isOffline, OfflineResourceError } from '../gracefulDegrade'

describe('gracefulDegrade', () => {
  it('returns false when online', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true, configurable: true })
    expect(isOffline()).toBe(false)
  })

  it('returns true when offline', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true, configurable: true })
    expect(isOffline()).toBe(true)
  })

  it('creates OfflineResourceError with message', () => {
    const err = new OfflineResourceError('Protocolo X')
    expect(err.name).toBe('OfflineResourceError')
    expect(err.message).toContain('Protocolo X')
  })
})
