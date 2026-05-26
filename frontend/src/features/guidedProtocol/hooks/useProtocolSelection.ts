//seleção de protocolos e paciente
import {useState} from 'react';
import type {Patient, Protocol} from '@/features/guidedProtocol/types';

export function useProtocolSelection() {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);

    const canStartProtocol = !!selectedPatient && !!selectedProtocol; //verifica se ambos estão selecionados

    return {
        selectedPatient,
        setSelectedPatient,
        selectedProtocol,
        setSelectedProtocol,
        canStartProtocol,
    };
}