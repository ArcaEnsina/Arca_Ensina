// metadados dos protocolos
//mapeia o protocolo, etapa e renderiza o componente da etapa

type ProtocolMeta = {
    totalSteps: number;
    firstStep: number;
    description: string;
}

type ProtocolMetaMap = {
    [protocolId: string]: ProtocolMeta;
}

export const PROTOCOL_META: ProtocolMetaMap = {
    dengue:{
        totalSteps: 6,
        firstStep: 2,
        description: "Protocolo para o manejo clínico de casos de dengue no ambiente hospitalar."
    }
}
//se um protocolo existe
export function protocolExists(protocolId: string): boolean {
  return protocolId in PROTOCOL_META;
}

//pegar os metadados de um protocolo
export function getProtocolMeta(protocolId: string): ProtocolMeta | null {
  if (!protocolExists(protocolId)) {
    return null;
  }
  return PROTOCOL_META[protocolId] ?? null;
}


//pegar o total de etapas de um protocolo
export function getTotalSteps(protocolId: string): number {
  const meta = getProtocolMeta(protocolId);
  return meta?.totalSteps ?? 0;
}

export default PROTOCOL_META;