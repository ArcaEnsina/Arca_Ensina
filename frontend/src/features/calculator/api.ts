import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api/client'
import { medicationCache, isOffline } from '@/lib/offline'
import type { Medication, CalculatorFormData, CalculationResult } from './types'

export const useMedications = () =>
  useQuery({
    queryKey: ['medications', 'list'],
    queryFn: async () => {
      try {
        const res = await api.get<Medication[]>('medications')
        const meds = res.data
        for (const med of meds) {
          medicationCache.putMedication({ ...med, updatedAt: Date.now() })
        }
        return meds
      } catch (err) {
        if (isOffline()) {
          const cached = await medicationCache.listCached()
          if (cached.length > 0) return cached
        }
        throw err
      }
    },
    staleTime: 5 * 60_000,
    networkMode: 'offlineFirst',
  })

export const useMedication = (id: number | null) =>
  useQuery({
    queryKey: ['medications', 'detail', id],
    queryFn: async () => {
      if (id === null || Number.isNaN(id)) throw new Error('Invalid medication id')
      try {
        const res = await api.get<Medication>(`medications/${id}`)
        medicationCache.putMedication({ ...res.data, updatedAt: Date.now() })
        return res.data
      } catch (err) {
        if (isOffline()) {
          const cached = await medicationCache.getMedication(id)
          if (cached) return cached
        }
        throw err
      }
    },
    enabled: id !== null && !Number.isNaN(id),
    staleTime: 5 * 60_000,
    networkMode: 'offlineFirst',
  })

export const useDownloadMedication = () =>
  useMutation({
    mutationFn: async (id: number) => {
      const res = await api.get<Medication>(`medications/${id}`)
      await medicationCache.putMedication({ ...res.data, updatedAt: Date.now() })
      return res.data
    },
  })

export const useCalculateDose = () =>
  useMutation({
    mutationFn: async (data: CalculatorFormData) => {
      const res = await api.post<CalculationResult>('calculator/calculate/', data)
      return res.data
    },
    retry: 0, // safety-critical: no automatic retry
  })
