import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PatientAllergyInputProps {
  value: string[];
  onChange: (v: string[]) => void;
}

export default function PatientAllergyInput({
  value,
  onChange,
}: PatientAllergyInputProps) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim();
    if (val && !value.includes(val)) {
      onChange([...value, val]);
    }
    setInput('');
  };

  const remove = (a: string) => {
    onChange(value.filter((x) => x !== a));
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="alergia-input"
        className="text-xs font-bold text-arca-blue-700 uppercase tracking-wider"
      >
        Alergias Conhecidas
      </label>
      <div className="flex gap-2">
        <Input
          id="alergia-input"
          placeholder="Adicionar alergia..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((a) => (
          <Badge
            key={a}
            variant="destructive"
            onClick={() => remove(a)}
            className="cursor-pointer"
          >
            {a} ×
          </Badge>
        ))}
      </div>
    </div>
  );
}
