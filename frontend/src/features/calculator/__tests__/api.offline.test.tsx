import { type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useMedication, useMedications, useCalculateDose } from '../api'
import { medicationCache, medicationDetailCache } from '@/lib/offline'

// Mock the api client to throw (simulating network failure)
vi.mock('@/lib/api/client', () => {
  const error = new AxiosError('Network Error', 'ERR_NETWORK')
  return {
    default: {
      get: vi.fn(() => Promise.reject(error)),
      post: vi.fn(() => Promise.reject(error)),
    },
  }
})

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: 'offlineFirst' },
      mutations: { retry: false, networkMode: 'offlineFirst' },
    },
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

  it('useCalculateDose falls back to frontend calculation when offline', async () => {
    await medicationDetailCache.putDetail({
      id: 42,
      name: 'Clonidina',
      category: 'Sedativo',
      description: '...',
      prescription: 1,
      frequency_hours: 8,
      min_dose_mg_kg: 0.005,
      max_dose_mg_kg: 0.01,
      max_absolute_dose_mg: 0.15,
      concentration_mg: 0.15,
      concentration_ml: 1,
    })

    const { result } = renderHook(() => useCalculateDose(), { wrapper })

    result.current.mutate({
      weight: 10,
      height: 100,
      age_days: 365,
      medication_id: 42,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.computedOffline).toBe(true)
    expect(result.current.data?.dosage_mg).toBeGreaterThan(0)
  })

  it('useCalculateDose falls back to frontend calculation on network error even if navigator.onLine is true', async () => {
    Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true, configurable: true })

    await medicationDetailCache.putDetail({
      id: 42,
      name: 'Clonidina',
      category: 'Sedativo',
      description: '...',
      prescription: 1,
      frequency_hours: 8,
      min_dose_mg_kg: 0.005,
      max_dose_mg_kg: 0.01,
      max_absolute_dose_mg: 0.15,
      concentration_mg: 0.15,
      concentration_ml: 1,
    })

    const { result } = renderHook(() => useCalculateDose(), { wrapper })

    result.current.mutate({
      weight: 10,
      height: 100,
      age_days: 365,
      medication_id: 42,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.computedOffline).toBe(true)
    expect(result.current.data?.dosage_mg).toBeGreaterThan(0)
  })
})

