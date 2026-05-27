import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { toSnakeCase, toCamelCase } from '@/lib/api/case';
import type {
  PanelDrugOption,
  PanelCalculationResult,
  PanelCalculatePayload,
  PrescriptionPayload,
} from './types';

/** Deep recursive camelCase conversion for nested API responses. */
function deepToCamelCase(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepToCamelCase);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    const converted = toCamelCase(obj);
    for (const key of Object.keys(converted)) {
      converted[key] = deepToCamelCase(converted[key]);
    }
    return converted;
  }
  return value;
}

/** Deep recursive snake_case conversion for nested request payloads. */
function deepToSnakeCase(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepToSnakeCase);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    const converted = toSnakeCase(obj);
    for (const key of Object.keys(converted)) {
      converted[key] = deepToSnakeCase(converted[key]);
    }
    return converted;
  }
  return value;
}

/** Fetch available panel drugs. */
// TODO: revert to api.get('panels/drugs/') once backend endpoint is implemented
export const usePanelDrugs = () =>
  useQuery<PanelDrugOption[]>({
    queryKey: ['sedation', 'drugs'],
    queryFn: async () => [
      { id: 'Midazolam IV contínua', name: 'Midazolam IV contínua', route: 'IV' },
      { id: 'Diazepam VO', name: 'Diazepam VO', route: 'VO' },
      { id: 'Morfina IV contínua', name: 'Morfina IV contínua', route: 'IV' },
      { id: 'Morfina VO', name: 'Morfina VO', route: 'VO' },
      { id: 'Fentanil IV contínuo', name: 'Fentanil IV contínuo', route: 'IV' },
      { id: 'Metadona VO', name: 'Metadona VO', route: 'VO' },
      { id: 'Dexmedetomidina IV', name: 'Dexmedetomidina IV', route: 'IV' },
      { id: 'Clonidina VO/SL', name: 'Clonidina VO/SL', route: 'VO/SL' },
      { id: 'Lorazepam IV', name: 'Lorazepam IV', route: 'IV' },
    ],
    staleTime: Infinity,
  });

/** Calculate sedation panel conversion. Safety-critical: retry 0. */
export const usePanelCalculate = () =>
  useMutation<PanelCalculationResult, Error, PanelCalculatePayload>({
    mutationFn: async (payload) => {
      const { panelId, ...body } = payload;
      const snakeBody = deepToSnakeCase(body as unknown as Record<string, unknown>) as Record<string, unknown>;
      const res = await api.post(`panels/${panelId}/calculate/`, snakeBody);
      return deepToCamelCase(res.data as unknown as Record<string, unknown>) as PanelCalculationResult;
    },
    retry: 0, // safety-critical: no automatic retry
  });

/** Create prescription. Safety-critical: retry 0, requires client_uuid. */
export const useCreatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PrescriptionPayload) => {
      const body = {
        ...(deepToSnakeCase(payload as unknown as Record<string, unknown>) as Record<string, unknown>),
        client_uuid: crypto.randomUUID(),
      };
      const res = await api.post<unknown>('prescriptions/', body);
      return deepToCamelCase(res.data as Record<string, unknown>) as PrescriptionPayload;
    },
    retry: 0, // safety-critical: no automatic retry
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['sedation'] });
    },
  });
};
