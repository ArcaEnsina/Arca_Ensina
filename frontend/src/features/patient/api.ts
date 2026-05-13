import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { toSnakeCase, toCamelCase } from '@/lib/api/case';
import type { PatientCreateInput } from './schemas';
import type { Patient, Symptom } from './types';

export const usePatients = () =>
  useQuery({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      const res = await api.get<Record<string, unknown>[]>('pacientes/');
      return res.data.map(
        (item) => toCamelCase(item) as unknown as Patient,
      );
    },
    staleTime: 5 * 60_000,
  });

export const useCreatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PatientCreateInput) => {
      const payload = toSnakeCase({
        ...input,
        alergias: input.alergias ?? [],
        sintomas: input.sintomas ?? [],
        clientUuid: crypto.randomUUID(),
      });
      const res = await api.post('pacientes/', payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients', 'list'] });
    },
    retry: 0, // safety-critical: no automatic retry
  });
};

export const useSymptoms = () =>
  useQuery({
    queryKey: ['symptoms', 'list'],
    queryFn: async () => {
      try {
        const res = await api.get<Record<string, unknown>[]>('symptoms/');
        return res.data.map(
          (item) => toCamelCase(item) as unknown as Symptom,
        );
      } catch (err: unknown) {
        if (
          err !== null &&
          typeof err === 'object' &&
          'response' in err &&
          (err as { response?: { status?: number } }).response?.status === 404
        ) {
          // engolido propositalmente porque o endpoint /symptoms/ pode não existir ainda no backend;
          // fallback para lista vazia permite que o usuário digite sintomas livremente.
          return [] as Symptom[];
        }
        throw err;
      }
    },
    staleTime: 5 * 60_000,
  });
