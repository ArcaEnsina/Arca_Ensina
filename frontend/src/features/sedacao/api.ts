import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { toSnakeCase, toCamelCase } from '@/lib/api/case';
import type {
  PanelDrugOption,
  DrugOption,
  PanelCalculationResult,
  PanelCalculatePayload,
  PrescriptionPayload,
  ConversionPayload,
  PanelConversionResponse,
  TaperSchedule,
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

/** Rich drug catalog with categories, icons, destinations, taper/cale types. */
const DRUG_CATALOG: DrugOption[] = [
  {
    id: 'Midazolam IV contínua',
    name: 'Midazolam',
    category: 'Benzodiazepínico',
    route: 'Infusão contínua',
    icon: 'Brain',
    destinations: ['Diazepam VO'],
    doseUnit: 'mg/kg/h',
    dosePlaceholder: '0.1',
    taperType: 'midaz',
    scaleType: 'RASS',
  },
  {
    id: 'Fentanil IV contínuo',
    name: 'Fentanil',
    category: 'Opioide',
    route: 'Infusão contínua',
    icon: 'Droplets',
    destinations: ['Morfina VO', 'Morfina IV contínua'],
    doseUnit: 'mcg/kg/h',
    dosePlaceholder: '1',
    taperType: 'morfina',
    scaleType: 'SOS',
  },
  {
    id: 'Morfina IV contínua',
    name: 'Morfina IV',
    category: 'Opioide',
    route: 'Infusão contínua',
    icon: 'Activity',
    destinations: ['Morfina VO', 'Metadona VO'],
    doseUnit: 'mg/kg/h',
    dosePlaceholder: '0.05',
    taperType: 'morfina',
    scaleType: 'SOS',
  },
  {
    id: 'Dexmedetomidina IV',
    name: 'Dexmedetomidina',
    category: 'Agonista alfa-2',
    route: 'Infusão contínua',
    icon: 'Pill',
    destinations: ['Clonidina VO/SL'],
    doseUnit: 'mcg/kg/h',
    dosePlaceholder: '0.5',
    taperType: 'midaz',
    scaleType: 'RASS',
  },
  {
    id: 'Lorazepam IV',
    name: 'Lorazepam',
    category: 'Benzodiazepínico',
    route: 'Intermitente',
    icon: 'Droplet',
    destinations: ['Diazepam VO'],
    doseUnit: 'mg/kg/dose',
    dosePlaceholder: '0.05',
    taperType: 'midaz',
    scaleType: 'RASS',
  },
];

/** Tapering schedules based on drug taper type. */
const TAPER_SCHEDULES: Record<string, TaperSchedule> = {
  midaz: {
    id: 'midaz',
    title: 'Protocolo de redução — Benzodiazepínico',
    steps: [
      { day: 'Dia 1', action: 'Reduzir 50% da dose', note: 'Manter monitorização RASS' },
      { day: 'Dia 2', action: 'Reduzir 25% da dose', note: 'Reavaliar sedação' },
      { day: 'Dia 3', action: 'Suspender', note: 'Monitorar sinais de abstinência' },
    ],
  },
  morfina: {
    id: 'morfina',
    title: 'Protocolo de redução — Opioide',
    steps: [
      { day: 'Dia 1', action: 'Reduzir 25% da dose', note: 'Manter monitorização SOS' },
      { day: 'Dia 2', action: 'Reduzir 25% da dose', note: 'Reavaliar dor e abstinência' },
      { day: 'Dia 3', action: 'Reduzir 25% da dose', note: 'Observar sinais de abstinência' },
      { day: 'Dia 4', action: 'Reduzir 12.5% da dose', note: 'Redução mais lenta' },
      { day: 'Dia 5', action: 'Reduzir 12.5% da dose', note: 'Monitorar SOS' },
      { day: 'Dia 6', action: 'Reduzir para dose mínima', note: 'Avaliar possibilidade de suspensão' },
      { day: 'Dia 7', action: 'Suspender', note: 'Monitorar sinais de abstinência por 24h' },
    ],
  },
};

/** Fetch available panel drugs. */
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

/** Fetch rich drug catalog for a panel. */
export const useDrugCatalog = (panelId: string) =>
  useQuery<DrugOption[]>({
    queryKey: ['sedation', 'catalog', panelId],
    queryFn: async () => {
      const res = await api.get(`panels/${panelId}/drugs/`);
      const data = deepToCamelCase(res.data) as Array<{
        id: string;
        name: string;
        fullName: string;
        destinations: Array<{ id: string; name: string; fullName: string; route: string }>;
        route: string;
        frequency: string;
        outputUnit: string;
        taperType: string;
        scaleType: string;
      }>;

      // Map API response to DrugOption with presentation layer
      return data.map((drug) => ({
        id: drug.id,
        name: drug.name,
        category: inferCategory(drug.id),
        route: inferRoute(drug.id),
        icon: inferIcon(drug.id),
        destinations: drug.destinations.map((d) => d.id),
        doseUnit: inferDoseUnit(drug.id),
        dosePlaceholder: inferPlaceholder(drug.id),
        taperType: drug.taperType as 'midaz' | 'morfina',
        scaleType: drug.scaleType as 'RASS' | 'SOS',
      }));
    },
    staleTime: Infinity,
    enabled: !!panelId,
  });

function inferCategory(drugId: string): string {
  const lower = drugId.toLowerCase();
  if (lower.includes('midazolam') || lower.includes('lorazepam') || lower.includes('diazepam')) return 'Benzodiazepínico';
  if (lower.includes('fentanil') || lower.includes('morfina') || lower.includes('metadona')) return 'Opioide';
  if (lower.includes('dexmedetomidina') || lower.includes('clonidina')) return 'Agonista alfa-2';
  return 'Outro';
}

function inferRoute(drugId: string): string {
  const lower = drugId.toLowerCase();
  if (lower.includes('iv contínua') || lower.includes('iv contínuo')) return 'Infusão contínua';
  if (lower.includes('iv')) return 'Intermitente';
  if (lower.includes('vo') || lower.includes('vo/sl')) return 'Oral';
  return '';
}

function inferIcon(drugId: string): string {
  const lower = drugId.toLowerCase();
  if (lower.includes('midazolam')) return 'Brain';
  if (lower.includes('fentanil')) return 'Droplets';
  if (lower.includes('morfina')) return 'Activity';
  if (lower.includes('dexmedetomidina')) return 'Pill';
  if (lower.includes('lorazepam')) return 'Droplet';
  return 'Pill';
}

function inferDoseUnit(drugId: string): string {
  const lower = drugId.toLowerCase();
  if (lower.includes('fentanil')) return 'mcg/kg/h';
  if (lower.includes('dexmedetomidina')) return 'mcg/kg/h';
  if (lower.includes('morfina iv')) return 'mg/kg/h';
  if (lower.includes('midazolam')) return 'mg/kg/h';
  if (lower.includes('lorazepam')) return 'mg/kg/dose';
  return 'mg';
}

function inferPlaceholder(drugId: string): string {
  const lower = drugId.toLowerCase();
  if (lower.includes('midazolam')) return '0.1';
  if (lower.includes('fentanil')) return '1';
  if (lower.includes('morfina')) return '0.05';
  if (lower.includes('dexmedetomidina')) return '0.5';
  if (lower.includes('lorazepam')) return '0.05';
  return '0';
}

/** Get destination drugs for a given source drug. */
export function getDestinations(sourceId: string): DrugOption[] {
  const source = DRUG_CATALOG.find((d) => d.id === sourceId);
  if (!source) return [];
  return source.destinations.map((destName) => {
    const dest = DRUG_CATALOG.find((d) => d.id === destName);
    if (dest) return dest;
    // Destination may not be in source catalog (e.g. Diazepam VO, Morfina VO)
    return {
      id: destName,
      name: destName.split(' ')[0] ?? destName,
      category: '',
      route: destName.split(' ').slice(1).join(' '),
      icon: 'Pill',
      destinations: [],
      doseUnit: 'mg',
      dosePlaceholder: '5',
      taperType: 'midaz' as const,
      scaleType: 'RASS' as const,
    };
  });
}

/** Get taper schedule for a drug. */
export function getTaperSchedule(sourceId: string): TaperSchedule | null {
  const source = DRUG_CATALOG.find((d) => d.id === sourceId);
  if (!source) return null;
  return TAPER_SCHEDULES[source.taperType] ?? null;
}

/** Get the source DrugOption by id. */
export function getDrugById(id: string): DrugOption | undefined {
  return DRUG_CATALOG.find((d) => d.id === id);
}

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
      const body = deepToSnakeCase(payload as unknown as Record<string, unknown>) as Record<string, unknown>;
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

/** Create conversion (prescrição) via panel endpoint. Safety-critical: retry 0. */
export const useCreateConversion = () => {
  const queryClient = useQueryClient();

  return useMutation<PanelConversionResponse, Error, ConversionPayload>({
    mutationFn: async (payload) => {
      const { panelId, ...rest } = payload;
      const body = deepToSnakeCase(rest as unknown as Record<string, unknown>) as Record<string, unknown>;
      const res = await api.post(`panels/${panelId}/conversions/`, body);
      return deepToCamelCase(res.data as Record<string, unknown>) as PanelConversionResponse;
    },
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedation'] });
    },
  });
};
