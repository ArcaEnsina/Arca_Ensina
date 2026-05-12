import {useParams} from "react-router-dom";
import { useState, useEffect } from "react"
import type { Medication } from "../types/calculator"
import { getMedicationById } from "../services/calculatorServices"

export function useMedicationById() {
    const { id } = useParams<{ id: string }>()
    const [medication, setMedication] = useState<Medication | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchMedication() {
            if (!id) {
                setError("ID inválido")
                setLoading(false)
                return
            }

            const medicationId = Number(id)
            if (Number.isNaN(medicationId)) {
                setError("ID inválido")
                setLoading(false)
                return
            }

            try {
                const data = await getMedicationById(medicationId)
                setMedication(data)
            } catch {
                setError("Erro ao buscar medicamento")
            } finally {
                setLoading(false)
            }
        }

        fetchMedication()
    }, [id])

    return { medication, loading, error }
}
    
