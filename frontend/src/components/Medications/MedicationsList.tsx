import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMedications } from '@/hooks/useMedications';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

function MedicationsList() {
  const [selectedId, setSelectedId] = useState<string>("");
  const navigate = useNavigate();
  const { medications} = useMedications()

  return (
    <div>
      <h2>Lista de medicamentos</h2>
      <Select value={selectedId} onValueChange={(value)=>setSelectedId((value))}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {medications.map((medication) => (
            <SelectItem key={medication.id} value={String(medication.id)}>
              {medication.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={() => { if (selectedId) navigate(`/calculator/calculate/${selectedId}`); }}>Calcular</Button>
    </div>
  );
}

export default MedicationsList;