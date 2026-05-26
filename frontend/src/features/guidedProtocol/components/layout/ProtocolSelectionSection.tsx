import { PatientCard } from "@/features/guidedProtocol/components/PatientCard";
import { ProtocolCard } from "@/features/guidedProtocol/components/ProtocolCard";

import { useProtocolSelection } from "@/features/guidedProtocol/hooks/useProtocolSelection";


function ProtocolSelectionSection() {
    const {
        selectedProtocol,
        selectedPatient,
        setSelectedProtocol,
    } = useProtocolSelection();

    function handleSwapProtocol() {
        setSelectedProtocol(null);
    }

    return(
        <div className="grid w-full grid-cols-2 gap-3 items-start">
            {selectedPatient && <PatientCard patient={selectedPatient} />}
            {selectedProtocol && <ProtocolCard protocol={selectedProtocol} onSwap={handleSwapProtocol} />}
        </div>
    );
}

export default ProtocolSelectionSection;