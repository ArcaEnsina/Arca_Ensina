import * as React from "react"

import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select";

function UnitInput(props: any) {
    return (
        <div className="flex items-center">
            <Input label={props.label} type="number" value={props.value ?? ''} placeholder={props.placeholder} onChange={(e) => props.onChange(parseFloat(e.target.value))} />
            <Select value={props.unit} onChange={(e) => props.onUnitChange(e.target.value)}>
                {props.units.map((unit: string) => (
                    <option key={unit} value={unit}>{unit}</option>
                ))}
            </Select>
        </div>
    )
}
export default UnitInput;