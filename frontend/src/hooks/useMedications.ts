import { useState, useEffect } from "react"
import type { Medication } from "../types/calculator"
import { getMedications } from "../services/calculatorServices"

export function useMedications() {
    const [medications, setMedications] = useState<Medication[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        //listar medicações
        async function fetchMedications() {
            setError(null)
            try {
                const meds = await getMedications()
                setMedications(meds)
            }
                catch (err) {
                setError("Erro ao carregar as medicações.")
            }
                finally {
                setLoading(false)
            }
        }
        fetchMedications()
    }, [])

    return {
        medications,
        loading,
        error
    }
}