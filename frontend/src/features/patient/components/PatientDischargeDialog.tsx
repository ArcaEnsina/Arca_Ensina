import { toast } from 'sonner';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDischargePatient } from '../api';

interface PatientDischargeDialogProps {
  patientId: string | number;
  patientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado após a alta bem-sucedida. */
  onDischarged?: () => void;
}

/**
 * Confirmação de alta do paciente. Arquiva o paciente mantendo o histórico.
 */
export default function PatientDischargeDialog({
  patientId,
  patientName,
  open,
  onOpenChange,
  onDischarged,
}: PatientDischargeDialogProps) {
  const dischargePatient = useDischargePatient();

  const handleConfirm = () => {
    dischargePatient.mutate(patientId, {
      onSuccess: () => {
        toast.success('Alta registrada.');
        onOpenChange(false);
        onDischarged?.();
      },
      onError: () => {
        toast.error('Não foi possível dar alta ao paciente.');
      },
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Dar alta ao paciente"
      description={`Você irá dar alta para ${patientName}. O histórico é preservado, mas o paciente sai da lista de ativos. Deseja continuar?`}
      confirmLabel="Sim, dar alta"
      isPending={dischargePatient.isPending}
      onConfirm={handleConfirm}
    />
  );
}
