import React from 'react';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import CalculatorForm from '@/components/Calculator/CalculatorForm';
import CalculatorResult from '@/components/Calculator/CalculatorResult';
import { useCalculator } from '@/hooks/useCalculator';
import { useMedicationById } from '@/hooks/useMedicationsById';

function Calculator() {
    const { id } = useParams<{ id: string }>();
    const { medication, loading: loadingMed, error: errorMed } = useMedicationById();
    const { formData, setFormData, result, loading, error, handleCalculate } = useCalculator();

    useEffect(() => {
        if (medication) {
            setFormData(prev => ({...prev, medication_id: medication.id }))
        }
        }, [medication])

    if (loadingMed) return <p>Carregando medicamento...</p>
    if (errorMed) return <p>{errorMed}</p>
    if (!medication) return null

    return (
        <div>
            <h2>Calculadora</h2>
            <h3>{medication.name}</h3>
            <p>{medication.category}</p>
            <p>{medication.description}</p>

            <CalculatorForm 
                formData={formData}
                onChange={setFormData}
                onSubmit={handleCalculate}
                loading={loading}
             />

             {result && <CalculatorResult result={result} warnings={result.warnings} />}
            {error && <p>{error}</p>}
            
        </div>
    )
}

export default Calculator;