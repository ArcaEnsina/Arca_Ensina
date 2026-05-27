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

const MOCK_PROTOCOL_VERSION: ProtocolVersion = {
    id: 1,
    protocolId: 'dengue',
    versionNumber: 1,
    protocolType: 'guided',
    isCurrent: true,
    stepsData: {
        steps: [
            {
                id: 'step_1_gravidade',
                title: 'Avalie os sinais de gravidade',
                items: [
                    { id: 'vomito', label: 'Vômitos persistentes' },
                    { id: 'dor_abdominal', label: 'Dor abdominal intensa e contínua' },
                    { id: 'hipotensao', label: 'Hipotensão postural' },
                    { id: 'hepatomegalia', label: 'Hepatomegalia dolorosa' },
                    { id: 'sangramento', label: 'Sangramento de mucosa' },
                    { id: 'sonolencia', label: 'Letargia ou irritabilidade' },
                    { id: 'derrame', label: 'Derrame seroso (ascite, pleural, pericárdico)' },
                ],
            },
            {
                id: 'step_2_hidratacao',
                title: 'Conduta de hidratação',
                items: [
                    { id: 'hidratacao_1', label: 'Iniciar hidratação venosa com SF 0,9%' },
                    { id: 'hidratacao_2', label: 'Observar sinais de hiper-hidratação' },
                ],
            },
        ],
    } as unknown as Record<number, ProtocolStep>,
    createdAt: new Date().toISOString(),
}

export function useProtocolVersion(protocolId: string) {
    return useQuery({
        queryKey: ['protocols', protocolId, 'versions'],
        queryFn: async () => {
            try {
                const res = await api.get<Record<string, unknown>>(`protocols/${protocolId}/versions/current/`);
                return toCamelCase(res.data) as unknown as ProtocolVersion;
            } catch {
                console.warn(`API protocols/${protocolId}/versions/current/ indisponível — usando dados mock`);
                return MOCK_PROTOCOL_VERSION;
            }
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
            try {
                const res = await api.get<Record<string, unknown>>(`pacientes/${patientId}/`);
                return toCamelCase(res.data) as unknown as Patient;
            } catch {
                console.warn(`API pacientes/${patientId}/ indisponível — usando dados mock`);
                return {
                    id: patientId,
                    nome: 'Maria Silva',
                    dataNascimento: '1990-05-15',
                    genero: 'F',
                    telefone: '(11) 99999-8888',
                    peso: '65',
                    altura: '1.65',
                    alergias: [],
                    sintomas: [],
                } as Patient;
            }
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