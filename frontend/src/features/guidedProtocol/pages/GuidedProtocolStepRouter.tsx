import { useParams, Navigate } from "react-router";
import GuidedProtocolStep2Page from "./GuidedProtocolStep2Page";
import GuidedProtocolStep3Page from "./GuidedProtocolStep3Page";
import GuidedProtocolStep4Page from "./GuidedProtocolStep4Page";
import GuidedProtocolStep5Page from "./GuidedProtocolStep5Page";
import GuidedProtocolStep6Page from "./GuidedProtocolStep6Page";

/**
 * Router dinâmico que rota para o componente correto baseado no stepNumber.
 * 
 * URL: /guided-protocol/:protocolId/step/:stepNumber?patientId=...
 * 
 * Mapeia:
 * - step 2 → GuidedProtocolStep2Page
 * - step 3 → GuidedProtocolStep3Page
 * - step 4 → GuidedProtocolStep4Page
 * - step 5 → GuidedProtocolStep5Page
 * - step 6 → GuidedProtocolStep6Page
 */
export default function GuidedProtocolStepRouter() {
  const { stepNumber } = useParams<{ stepNumber: string }>();

  const step = parseInt(stepNumber || "0", 10);

  // Validar step número
  if (step < 2 || step > 6) {
    return <Navigate to="/guided-protocol" replace />;
  }

  // Renderizar componente baseado no step number
  switch (step) {
    case 2:
      return <GuidedProtocolStep2Page />;
    case 3:
      return <GuidedProtocolStep3Page />;
    case 4:
      return <GuidedProtocolStep4Page />;
    case 5:
      return <GuidedProtocolStep5Page />;
    case 6:
      return <GuidedProtocolStep6Page />;
    default:
      return <Navigate to="/guided-protocol" replace />;
  }
}
