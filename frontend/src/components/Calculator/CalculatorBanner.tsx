import MedicationBadge from "../Medications/MedicationBadge";

function CalculatorBanner() {
    return (
        <div className="flex flex-col gap-3 items-center bg-gray-300 px-6 py-8 rounded-lg h-full justify-center">
            <section className="flex">
                <MedicationBadge name="pill" />
                <MedicationBadge name="tablets" />
                <MedicationBadge name="pills-bottle" />
                <MedicationBadge name="syringe" />
            </section>
            <section>
                <p className="bg-blue-500 text-white p-2 rounded-full">Calculadora de Medicamentos</p>
            </section>
        </div>
    );
}

export default CalculatorBanner;