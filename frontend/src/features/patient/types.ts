export type Gender = 'M' | 'F' | 'O';

export interface Patient {
  id: string;
  nome: string;
  dataNascimento: string;
  genero: Gender;
  nomeResponsavel?: string;
  cidade?: string;
  telefone: string;
  peso: string; // Decimal string
  altura: string; // Decimal string
  alergias: string[];
  sintomas: string[];
}

export interface Symptom {
  id: string;
  descricao: string;
}

export interface ProtocolHistoryEvent {
  id: string;
  type: 'guided_protocol' | 'sedation_conversion';
  timestamp: string;
  title: string;
  status: string;
  protocolVersion?: string;
  details: Record<string, unknown>;
}

export interface ProtocolSuggestion {
  id: string;
  title: string;
  cid: string;
  specialty: string;
  type: 'guiado' | 'painel' | null;
  score: number;
  matchedSymptoms: string[];
  reasons: string[];
}
