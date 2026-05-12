import type { CalculationResult, WarningLevel } from "@/types/calculator";

//oq ele recebbe
interface CalculatorResultProps {
    result: CalculationResult
    warnings: WarningLevel[]
}
function CalculatorResult(props: CalculatorResultProps) {
    //funcao auxiliar para mostrar a frequencia mais bonita
    function frequencyLabel(freq: number): string {
        const labels: Record<number, string> = {
            1: "1x ao dia (24/24h)",
            2: "2x ao dia (12/12h)",
            3: "3x ao dia (8/8h)",
            4: "4x ao dia (6/6h)",
            6: "6x ao dia (4/4h)",
        }
        return labels[freq] ?? `${freq}x ao dia`
    }

    const frequencyText = frequencyLabel(props.result.frequency_per_day);

    return (
        <div>
            <p>Resultado: Dose diária é {props.result.dosage_mg} mg, {props.result.dosage_per_dose} mg por dose, a cada {frequencyText}.</p>
            {props.warnings.map((w) => (
                <div key={w} className={`warning warning-${w.toLowerCase()}`}>
                    {w === "BAIXO" && "Dose abaixo do mínimo recomendado"}
                    {w === "ALTO" && "Dose acima do máximo recomendado"}
                    {w === "CRITICO" && "Dose acima do teto absoluto — revise a prescrição"}
                </div>
            ))}

            {props.result.volume_ml !== null && (
                <p>{props.result.volume_ml} ml por dose</p>
            )}
        </div>
    )
}

export default CalculatorResult;