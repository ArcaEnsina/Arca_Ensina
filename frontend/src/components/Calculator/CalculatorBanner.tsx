import MedicationBadge from "../Medications/MedicationBadge";

function CalculatorBanner() {
    return (
        <div>
            <section>
                <MedicationBadge name="pill" />
                <MedicationBadge name="tablets" />
                <MedicationBadge name="pills-bottle" />
                <MedicationBadge name="syringe" />
            </section>
        </div>
    );
}

export default CalculatorBanner;