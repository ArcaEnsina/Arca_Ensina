import type { Medication, CalculatorFormData, CalculationResult } from "../types/calculator"
import api from "../services/api"

export { getMedications, getMedicationById, calculate };

//buscar medicações via api
function getMedications(): Promise<Medication[]> {
    return api.get("/api/medications").then((response) => response.data);
}

//buscar id medicações:
function getMedicationById(id: number): Promise<Medication> {
    return api.get(`/api/medications/${id}`).then((response) => response.data);
}

//calcular dosagem via api
function calculate(data: CalculatorFormData): Promise<CalculationResult> {
    return api.post("/api/calculator/calculate", data).then((response) => response.data);
}