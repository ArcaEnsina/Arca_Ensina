import { z } from 'zod';
import Decimal from 'decimal.js';

export const patientCreateSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  genero: z.enum(['M', 'F', 'O']),
  nomeResponsavel: z.string().optional(),
  cidade: z.string().optional(),
  telefone: z.string().min(10, 'Telefone inválido'),
  peso: z
    .string()
    .refine(
      (v) => {
        try {
          return new Decimal(v).gt(0);
        } catch {
          return false;
        }
      },
      'Peso deve ser maior que zero',
    ),
  altura: z
    .string()
    .refine(
      (v) => {
        try {
          return new Decimal(v).gt(0);
        } catch {
          return false;
        }
      },
      'Altura deve ser maior que zero',
    ),
  alergias: z.array(z.string()).default([]),
  sintomas: z.array(z.string()).default([]),
});

/** Output type (after defaults applied) */
export type PatientCreate = z.infer<typeof patientCreateSchema>;
/** Input type (before defaults — used by react-hook-form) */
export type PatientCreateInput = z.input<typeof patientCreateSchema>;
