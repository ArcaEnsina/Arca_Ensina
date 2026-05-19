import CalculatorInfoAndForm from "@/components/Calculator/CalculatorInfoAndForm";
import CalculatorBanner from "@/components/Calculator/CalculatorBanner";

function Calculator() {
    

    return (
        <div className="p-4 flex">
            <CalculatorBanner />
            <CalculatorInfoAndForm />
        </div>
    )
}

export default Calculator;