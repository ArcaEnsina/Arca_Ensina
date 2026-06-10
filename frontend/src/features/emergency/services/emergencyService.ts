import api from '@/lib/api/client';
import type { Patient } from '@/features/patient/types';

interface EmergencyPayload {
  peso: number;
  idade_anos: number;
  sintomas?: string[];
}

interface EmergencyResponse {
  patient: Patient;
  execution: {
    id: number;
    version: number;
    status: string;
  };
}

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      const camel = k.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      return [camel, v];
    }),
  );
}

export async function startEmergency(
  payload: EmergencyPayload,
): Promise<EmergencyResponse> {
  const res = await api.post('emergency/', {
    ...payload,
    genero: 'O',
  });

  const raw = res.data;
  const patient = snakeToCamel(raw.patient) as unknown as Patient;

  return {
    patient,
    execution: raw.execution,
  };
}
