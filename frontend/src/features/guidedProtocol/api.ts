import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { toCamelCase } from '@/lib/api/case';
import type { Protocol, ProtocolExecution, ProtocolVersion } from './types';
import type { Patient } from '@/features/patient/types';
import { useMutation } from '@tanstack/react-query';

export function useProtocols() {
    return useQuery({
        queryKey: ['protocols', 'list'],
        queryFn: async () => {
            const res = await api.get<Record<string, unknown>[]>('protocols/');
            return res.data.map((item) => toCamelCase(item) as unknown as Protocol);
        },
        staleTime: 5 * 60_000,
    });
}

export function useProtocolVersion(protocolId: string) {
    return useQuery({
        queryKey: ['protocols', protocolId, 'versions'],
        queryFn: async () => {
            const res = await api.get<Record<string, unknown>>(`protocols/${protocolId}/versions/current/`);
            return toCamelCase(res.data) as unknown as ProtocolVersion;
        },
        enabled: !!protocolId,
        staleTime: 5 * 60_000,
    });
}

export function usePatient(patientId: string | undefined) {
    return useQuery({
        queryKey: ['patients', patientId],
        queryFn: async () => {
            if (!patientId) return null;
            const res = await api.get<Record<string, unknown>>(`pacientes/${patientId}/`);
            return toCamelCase(res.data) as unknown as Patient;
        },
        enabled: !!patientId,
        staleTime: 5 * 60_000,
    });
}

export function useStartExecution() {
    return useMutation({
        mutationFn: async ({ protocolId, patientId }: { protocolId: string; patientId: number }) => {
            const res = await api.post<Record<string, unknown>>('protocol-executions/', {
                protocolId,
                patientId,
            });
            return toCamelCase(res.data) as unknown as ProtocolExecution;
        },
    });
}

export function useSaveAnswer(){
    return useMutation({
        mutationFn: async ({ executionId, stepNumber, answer }: { executionId: number; stepNumber: number; answer: string }) => {
            const res = await api.post<Record<string, unknown>>(`protocol-executions/${executionId}/steps/${stepNumber}/answers/`, {
                answer,
            });
            return toCamelCase(res.data) as unknown as ProtocolExecution;
        },
        retry: 0, // safety-critical: no automatic retry
    });
}