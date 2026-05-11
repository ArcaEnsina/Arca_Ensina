import * as React from 'react';
import { useState } from 'react';
import { Input } from "@/components/ui/input"
import UnitInput from "@/components/ui/unitInput"

function CalculatorForm(props: any) {
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [ageDays, setAgeDays] = useState<number | null>(null);

  return (
    <div>
      <Input label="Peso" type="number" value={weight ?? ''} placeholder="Digite o peso" onChange={(e) => setWeight(parseFloat(e.target.value))} />
      {/* Formulário para entrada de dados */}
    </div>
  );
}
export default CalculatorForm;