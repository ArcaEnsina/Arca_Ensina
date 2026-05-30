import { type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMedication, useMedications } from '../api'
import { medicationCache } from '@/lib/offline'

// Mock the api client to throw (simulating network failure)
vi.mock('@/lib/api/client', () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error('Network error'))),
    post: vi.fn(() => Promise.reject(new Error('Network error'))),
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, networkMode: 'offlineFirst' } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('calculator API hooks — offline fallback', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true, configurable: true })
  })

  it('useMedications falls back to cached list when offline', async () => {
    await medicationCache.putMedication({
      id: 1, name: 'Adrenalina', category: 'Vaso', description: '...', updatedAt: Date.now(),
    })
    await medicationCache.putMedication({
      id: 2, name: 'Amoxicilina', category: 'Antib', description: '...', updatedAt: Date.now(),
    })

    const { result } = renderHook(() => useMedications(), { wrapper })

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2)
    })
  })

  it('useMedication falls back to cached item when offline', async () => {
    await medicationCache.putMedication({
      id: 42, name: 'Clonidina', category: 'Sedativo', description: '...', updatedAt: Date.now(),
    })

    const { result } = renderHook(() => useMedication(42), { wrapper })

    await waitFor(() => {
      expect(result.current.data?.name).toBe('Clonidina')
    })
  })
})
