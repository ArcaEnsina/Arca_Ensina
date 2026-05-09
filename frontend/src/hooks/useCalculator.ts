import { useState } from "react"
import type { CalculatorFormData, CalculationResult } from "../types/calculator"
import { calculate } from "../services/calculatorServices"


export function useCalculator() {
    //estado inicial do formulario
    const [formData, setFormData] = useState<CalculatorFormData>({
        weight: null,
        age_days: null,
        medication_id: null,
    })

    //estado inicial do resultado do calculo
    const [result, setResult] = useState<CalculationResult | null>(null)

    //estado de carregamento 
    const [loading, setLoading] = useState<boolean>(false)

    //estado do erro
    const [error, setError] = useState<string | null>(null)

    //função para buscar os dados do formulario e chamar a funcao do calculo
    async function handleCalculate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const calculationResult = await calculate(formData)
            setResult(calculationResult)
        }
         catch (err) {
            setError("Erro ao calcular a medicação.")
        } finally {
            setLoading(false)
        }
    }

    return {
        formData,
        setFormData,
        result,
        loading,
        error,
        handleCalculate
    }
}