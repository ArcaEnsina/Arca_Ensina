import { useEffect, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Medication = {
  id: string;
  name: string;
};

function MedicationsList() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMedications() {
      try {
        const res = await fetch('/api/v1/medications/');
        if (!res.ok) throw new Error('Network response was not ok');
        const data: Medication[] = await res.json();
        setMedications(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch (err) {
        console.error('Failed to fetch medications:', err);
      }
    }

    fetchMedications();
  }, []);

  return (
    <div>
        <h2>Lista de medicamentos</h2>
        <Select value={selectedId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedId(e.target.value)}>
          {medications.map((medication) => (
            <option key={medication.id} value={medication.id}>
              {medication.name}
            </option>
          ))}
        </Select>

        <Button onClick={() => { if (selectedId) navigate(`/calculator/${selectedId}`); }}>Adicionar</Button>
    </div>
  );
}

export default MedicationsList;