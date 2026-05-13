import { useEffect } from 'react';
import CalculatorForm from '@/components/Calculator/CalculatorForm';
import CalculatorResult from '@/components/Calculator/CalculatorResult';
import { useCalculator } from '@/hooks/useCalculator';
import { useMedicationById } from '@/hooks/useMedicationsById';

function Calculator() {
    const { medication, loading: loadingMed, error: errorMed } = useMedicationById();
    const { formData, setFormData, result, loading, error, handleCalculate } = useCalculator();

    useEffect(() => {
        if (medication) {
            setFormData(prev => ({...prev, medication_id: medication.id }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [medication])

    if (loadingMed) return <p>Carregando medicamento...</p>
    if (errorMed) return <p>{errorMed}</p>
    if (!medication) return null

    return (
        <div>
            <h1 className="text-2xl font-bold">Calculadora</h1>
            <h2 className="text-xl font-semibold text-blue-500">{medication.name}</h2>
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