import { z } from 'zod';
import Decimal from 'decimal.js';
import { normalizeDecimalInput } from '@/lib/decimal';

const positiveDecimal = (label: string) =>
  z
    .string()
    .min(1, `${label} obrigatório`)
    .refine(
      (v) => {
        try {
          return new Decimal(String(normalizeDecimalInput(v))).gt(0);
        } catch {
          return false;
        }
      },
      `${label} deve ser maior que zero`,
    );

export const sedationFormSchema = z.object({
  sourceDrugId: z.string().min(1, 'Medicamento de origem obrigatório'),
  targetDrugId: z.string().min(1, 'Medicamento de destino obrigatório'),
  route: z.string().min(1, 'Via de administração obrigatória'),
  currentDose: positiveDecimal('Dose atual'),
  patientWeight: positiveDecimal('Peso do paciente'),
});

export type SedationFormData = z.infer<typeof sedationFormSchema>;
