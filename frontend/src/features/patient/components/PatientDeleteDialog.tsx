import { toast } from 'sonner';

import ConfirmDialog from '@/components/ui/ConfirmDialog';
import HoldToConfirmButton from '@/components/ui/HoldToConfirmButton';
import { useDeletePatient } from '../api';

interface PatientDeleteDialogProps {
  patientId: string | number;
  patientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado após exclusão bem-sucedida. */
  onDeleted?: () => void;
}

/**
 * Confirmação de exclusão de paciente. Ação destrutiva → exige
 * "segurar para excluir" (prevenção de erros).
 */
export default function PatientDeleteDialog({
  patientId,
  patientName,
  open,
  onOpenChange,
  onDeleted,
}: PatientDeleteDialogProps) {
  const deletePatient = useDeletePatient();

  const handleConfirm = () => {
    deletePatient.mutate(patientId, {
      onSuccess: () => {
        toast.success('Paciente excluído.');
        onOpenChange(false);
        onDeleted?.();
      },
      onError: () => {
        toast.error('Não foi possível excluir o paciente.');
      },
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Excluir paciente"
      description={`Esta ação é permanente. Para excluir ${patientName}, segure o botão abaixo.`}
      isPending={deletePatient.isPending}
      onConfirm={handleConfirm}
      confirmSlot={
        <HoldToConfirmButton
          onConfirm={handleConfirm}
          disabled={deletePatient.isPending}
        >
          Segure para excluir
        </HoldToConfirmButton>
      }
    />
  );
}
