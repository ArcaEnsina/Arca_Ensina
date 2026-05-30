import { PatientCard } from "@/features/guidedProtocol/components/shared/PatientCard";
import { ProtocolCard } from "@/features/guidedProtocol/components/shared/ProtocolCard";
import type { Patient } from "@/features/patient/types";
import type { Protocol } from "@/features/guidedProtocol/types";

interface ProtocolSelectionSectionProps {
    selectedProtocol: Protocol | null;
    selectedPatient: Patient | null;
    onSwapProtocol: () => void;
}

function ProtocolSelectionSection({
    selectedProtocol,
    selectedPatient,
    onSwapProtocol,
}: ProtocolSelectionSectionProps) {
    return(
        <div className="grid w-full grid-cols-2 gap-3 items-start">
            {selectedPatient && <PatientCard patient={selectedPatient} />}
            {selectedProtocol && <ProtocolCard protocol={selectedProtocol} onSwap={onSwapProtocol} />}
        </div>
    );
}

export default ProtocolSelectionSection;