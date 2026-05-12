//dados recebidos da lista de medicamentos
export interface Medication {
    id: number
    name: string
    category: string
    description: string
}

//dados recebidos do formulário de cálculo
export interface CalculatorFormData {
    weight: number | null
    height: number | null
    age_days: number | null
    medication_id: number | null
}

//niveis de warning
export type WarningLevel = 'BAIXO' | 'ALTO' | 'CRITICO'

// dados que o backend retorna após o cálculo
export interface CalculationResult {
    dosage_mg: number
    dosage_per_dose: number
    frequency_per_day: number
    volume_ml: number | null    // null se o medicamento não tem concentração
    warnings: WarningLevel[]
}

