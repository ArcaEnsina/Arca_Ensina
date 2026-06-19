import { describe, it, expect } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { isOffline, isOfflineError, OfflineResourceError } from '../gracefulDegrade'

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

  describe('isOfflineError', () => {
    it('returns true if navigator.onLine is false', () => {
      Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true, configurable: true })
      expect(isOfflineError(new Error('Any error'))).toBe(true)
    })

    it('returns true if navigator.onLine is true but error is Axios network error (no response)', () => {
      Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true, configurable: true })
      const error = new AxiosError('Network Error')
      expect(isOfflineError(error)).toBe(true)
    })

    it('returns true if navigator.onLine is true but error has ERR_NETWORK code', () => {
      Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true, configurable: true })
      const error = new AxiosError('Network Error', 'ERR_NETWORK')
      expect(isOfflineError(error)).toBe(true)
    })

    it('returns false if navigator.onLine is true and error is a standard Axios error with response (e.g. 400 Bad Request)', () => {
      Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true, configurable: true })
      const error = new AxiosError('Bad Request', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
        data: {},
      })
      expect(isOfflineError(error)).toBe(false)
    })

    it('returns false if navigator.onLine is true and error is a generic non-Axios error', () => {
      Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true, configurable: true })
      expect(isOfflineError(new Error('Some other error'))).toBe(false)
    })
  })
})

