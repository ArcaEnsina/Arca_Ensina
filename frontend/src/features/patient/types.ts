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
