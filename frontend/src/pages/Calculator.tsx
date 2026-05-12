import React from 'react';
import { useParams } from 'react-router-dom';
import CalulatorForm from '@/components/Calculator/CalculatorForm';
import CalculatorResult from '@/components/Calculator/CalculatorResult';


function Calculator() {
    const { medicationId } = useParams();

    return (
        <div>
            <h2>Calculadora</h2>
            <CalulatorForm medicationId={medicationId} />
            <CalculatorResult />
        </div>
    )
}

export default Calculator;