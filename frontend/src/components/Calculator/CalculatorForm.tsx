import  UnitInput  from "@/components/ui/unitInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CalculatorFormData } from "@/types/calculator";

import { convertWeight } from "@/utils/conversions";

interface CalculatorFormProps {
    formData: CalculatorFormData
    onChange: (data: CalculatorFormData) => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
    loading: boolean
}

function CalculatorForm(props: CalculatorFormProps) {
    return (
        <form onSubmit={props.onSubmit} className="max-w-md mx-auto p-4 bg-white rounded shadow">
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Peso</label>
                <UnitInput
                    label="Peso"
                    value={props.formData.weight ?? ""}
                    placeholder="Digite o peso"
                    onChange={(value) => props.onChange({...props.formData, weight: parseFloat(value)})}
                    unit="kg"
                    units={["kg", "g"]}
                    onUnitChange={(unit) => {
                        if (props.formData.weight !== null) {
                            props.onChange({...props.formData, weight: convertWeight(props.formData.weight, unit as "kg" | "g")});
                        }
                    }}
                
                />
                <label className="text-sm font-medium text-foreground">Altura</label>
                <UnitInput
                    label="Altura"
                    value={props.formData.height ?? ""}
                    placeholder="Digite a altura"
                    onChange={(value) => props.onChange({...props.formData, height: parseFloat(value)})}
                    unit="cm"
                    units={["cm", "m"]}
                    onUnitChange={(unit) => console.log(unit)}
                />
                <label className="text-sm font-medium text-foreground">Idade</label>
                <Input
                    type="text"
                    value={props.formData.age_days ?? ""}
                    placeholder="Digite a idade em dias"
                    onChange={(e) => props.onChange({...props.formData, age_days: parseInt(e.target.value)})}
                />

                <Button type="submit">
                    {props.loading ? "Calculando..." : "Calcular"}
                </Button>
            </div>

        </form>
    );
}
export default CalculatorForm;