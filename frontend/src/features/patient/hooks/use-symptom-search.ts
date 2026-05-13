import { useState, useMemo } from 'react';

interface UseSymptomSearchReturn {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filtered: string[];
  canAddCustom: boolean;
  customTerm: string;
}

export function useSymptomSearch(symptoms: string[]): UseSymptomSearchReturn {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return symptoms;
    const lower = searchTerm.toLowerCase();
    return symptoms.filter((s) => s.toLowerCase().includes(lower));
  }, [symptoms, searchTerm]);

  const trimmed = searchTerm.trim();
  const canAddCustom =
    trimmed !== '' &&
    !symptoms.some((s) => s.toLowerCase() === trimmed.toLowerCase());

  return {
    searchTerm,
    setSearchTerm,
    filtered,
    canAddCustom,
    customTerm: trimmed,
  };
}
