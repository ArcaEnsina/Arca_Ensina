import api from '@/lib/api/client';
import { toCamelCase, toSnakeCase } from '@/lib/api/case';
import type {
  AnswerValues,
  Execution,
  Reminder,
  StepResponse,
} from '../types';
import type { IProtocolExecutor } from './executor';

/** Deep recursive camelCase conversion for nested API responses. */
export function deepToCamelCase(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepToCamelCase);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const converted = toCamelCase(value as Record<string, unknown>);
    for (const key of Object.keys(converted)) {
      converted[key] = deepToCamelCase(converted[key]);
    }
    return converted;
  }
  return value;
}

/** Deep recursive snake_case conversion for nested request payloads. */
export function deepToSnakeCase(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepToSnakeCase);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const converted = toSnakeCase(value as Record<string, unknown>);
    for (const key of Object.keys(converted)) {
      converted[key] = deepToSnakeCase(converted[key]);
    }
    return converted;
  }
  return value;
}

const base = (pk: number) => `protocols/${pk}/execute/`;

/** API-backed protocol executor. Safety-critical calls do not auto-retry. */
export const apiExecutor: IProtocolExecutor = {
  async start(protocolId, patientName, clientUuid, patientId) {
    const body = deepToSnakeCase({ patientName, clientUuid, patientId });
    const res = await api.post(`protocols/${protocolId}/execute/`, body);
    return deepToCamelCase(res.data) as Execution;
  },

  async getStep(protocolId) {
    const res = await api.get(`${base(protocolId)}step/`);
    return deepToCamelCase(res.data) as StepResponse;
  },

  async answer(protocolId, values: AnswerValues) {
    const body = deepToSnakeCase({ values });
    const res = await api.post(`${base(protocolId)}answer/`, body);
    return deepToCamelCase(res.data) as Execution;
  },

  async advance(protocolId) {
    const res = await api.post(`${base(protocolId)}next/`, {});
    return deepToCamelCase(res.data) as StepResponse;
  },

  async back(protocolId) {
    const res = await api.post(`${base(protocolId)}back/`, {});
    return deepToCamelCase(res.data) as StepResponse;
  },

  async getReminders(protocolId) {
    const res = await api.get(`${base(protocolId)}reminders/`);
    const data = deepToCamelCase(res.data) as { reminders?: Reminder[] };
    return data.reminders ?? [];
  },
};
