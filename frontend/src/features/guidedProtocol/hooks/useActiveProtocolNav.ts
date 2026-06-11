import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { usePatientStore } from '@/features/patient/store';
import { useGuidedProtocolStore } from '../store';
import { buildResumeArgs, useActiveExecution } from './useActiveExecution';

const CATALOG_PATH = '/protocols/manual';

/**
 * Destino dinâmico da aba "Protocolos" do AppShell.
 *
 * Se o paciente selecionado tem um protocolo guiado em andamento, a aba retoma
 * a execução no passo atual (mesma semântica do card "Retomar protocolo" do
 * dashboard). Caso contrário, abre o catálogo de seleção manual.
 */
export function useActiveProtocolNav() {
  const navigate = useNavigate();
  const activePatient = usePatientStore((s) => s.activePatient);
  const primeResume = useGuidedProtocolStore((s) => s.primeResume);
  const { data } = useActiveExecution(activePatient?.id ?? null);

  const to = data ? `/guided-protocol/${data.protocolId}` : CATALOG_PATH;

  const go = useCallback(() => {
    if (data) {
      primeResume(buildResumeArgs(data));
      navigate(`/guided-protocol/${data.protocolId}`);
    } else {
      navigate(CATALOG_PATH);
    }
  }, [data, primeResume, navigate]);

  return { to, hasActive: !!data, go };
}
