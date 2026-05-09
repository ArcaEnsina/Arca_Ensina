import type { Medication, CalculatorFormData, CalculationResult } from "../types/calculator"
import api from "../services/api"

export { getMedications, calculate };

//buscar medicações via api
function getMedications(): Promise<Medication[]> {
    return api.get("/api/medications").then((response) => response.data);
}

//calcular dosagem via api
function calculate(data: CalculatorFormData): Promise<CalculationResult> {
    return api.post("/api/calculator/calculate", data).then((response) => response.data);
}