import {useParams} from "react-router-dom";
import { useState, useEffect } from "react"
import type { Medication } from "../types/calculator"
import { getMedicationById } from "../services/calculatorServices"

export function useMedicationById() {
    const { medicationId } = useParams<{ medicationId: string }>()
    const [medication, setMedication] = useState<Medication | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchMedication() {
            if (!medicationId) {
                setError("ID inválido")
                setLoading(false)
                return
            }

            const id = Number(medicationId)
            if (Number.isNaN(id)) {
                setError("ID inválido")
                setLoading(false)
                return
            }

            try {
                const data = await getMedicationById(id)
                setMedication(data)
            } catch {
                setError("Erro ao buscar medicamento")
            } finally {
                setLoading(false)
            }
        }

        fetchMedication()
    }, [medicationId])

    return { medication, loading, error }
}
    
