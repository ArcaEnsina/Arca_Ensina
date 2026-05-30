//pega dados do backend e organiza para o frontend
import {useProtocolVersion} from '@/features/guidedProtocol/api';
import type {ProtocolStep} from '@/features/guidedProtocol/types';
import {useMemo} from 'react';

export function useProtocolData(protocolId: string) {
    const {data: protocolVersion, isLoading, error} = useProtocolVersion(protocolId);

    const allSteps: ProtocolStep[] = useMemo(() => {
        if (!protocolVersion?.stepsData) return [];
        
        //converter objeto recebido em array em ordem dos passos:
        return Object.entries(protocolVersion.stepsData)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([, stepData]) => stepData);
    }, [protocolVersion]);

    return{
        protocolVersion,
        allSteps,
        loading: isLoading,
        error: error?.message || null,
        currentStep: protocolVersion ? 1 : 0, //inicia no passo 1 se tiver dados, senão 0
        totalSteps: allSteps.length,
    }
}