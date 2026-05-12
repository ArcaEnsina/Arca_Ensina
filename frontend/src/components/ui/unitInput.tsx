import * as React from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type UnitInputProps = {
    label?: string;
    value: number | string;
    placeholder?: string;
    inputType?: React.HTMLInputTypeAttribute;
    onChange: (value: string) => void;
    unit: string;
    units: string[];
    onUnitChange: (unit: string) => void;
};

function UnitInput({
    label,
    value,
    placeholder,
    inputType = "text",
    onChange,
    unit,
    units,
    onUnitChange,
}: UnitInputProps) {
    return (
        <div className="flex flex-col gap-1">
            {label ? (
                <label className="text-sm font-medium text-foreground">{label}</label>
            ) : null}
            <div className="flex items-center gap-2">
                <Input
                    type={inputType}
                    value={value ?? ""}
                    placeholder={placeholder}
                    onChange={(e) => onChange(e.target.value)}
                />
                <Select value={unit} onValueChange={onUnitChange}>
                    <SelectTrigger className="min-w-24">
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                        {units.map((item) => (
                            <SelectItem key={item} value={item}>
                                {item}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

export default UnitInput;