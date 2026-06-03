import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api/client'
import { medicationCache, medicationDetailCache, executionQueue, isOffline } from '@/lib/offline'
import { calculateForMedication } from '@/engines/calculator'
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
        medicationDetailCache.putDetail(res.data)
        return res.data
      } catch (err) {
        if (isOffline()) {
          const cached = await medicationDetailCache.getDetail(id)
          if (cached) return cached
          const fallback = await medicationCache.getMedication(id)
          if (fallback) return fallback
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
    mutationFn: async (data: CalculatorFormData): Promise<CalculationResult> => {
      if (data.weight == null) {
        throw new Error('Peso é obrigatório para o cálculo.')
      }

      const clientUuid = data.client_uuid ?? crypto.randomUUID()
      const payload = { ...data, client_uuid: clientUuid }

      try {
        const res = await api.post<CalculationResult>('calculator/calculate/', payload)
        return res.data
      } catch (err) {
        if (isOffline() && data.medication_id != null) {
          const cached = await medicationDetailCache.getDetail(data.medication_id)
          if (!cached) throw err

          const result = calculateForMedication(cached, {
            weight: data.weight,
            height: data.height ?? null,
            ageDays: data.age_days ?? null,
            indication: data.indication ?? null,
            route: data.route ?? null,
            presentationIndex: data.presentation_index ?? null,
          })

          await executionQueue.enqueue('calculator.calculate', payload)

          return { ...result, computedOffline: true }
        }
        throw err
      }
    },
    retry: 0, // safety-critical: no automatic retry
    // 'online' (default) pausa a mutation quando offline e nunca roda a
    // mutationFn — o fallback no catch jamais executaria. 'offlineFirst' roda
    // a função uma vez; o POST falha e o catch dispara o motor JS local.
    networkMode: 'offlineFirst',
  })
