import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Variante do botão de confirmação (ex: 'destructive'). */
  confirmVariant?: React.ComponentProps<typeof Button>['variant'];
  /** Estado de carregamento da ação confirmada. */
  isPending?: boolean;
  onConfirm: () => void;
  /**
   * Conteúdo customizado de confirmação (ex: HoldToConfirmButton). Quando
   * informado, substitui o botão de confirmação padrão.
   */
  confirmSlot?: React.ReactNode;
}

/**
 * Dialog genérico de confirmação (prevenção de erros). Reutiliza o `Dialog`
 * existente. Por padrão exibe Cancelar + Confirmar; passe `confirmSlot` para
 * usar um botão de confirmação customizado (ex: segurar para confirmar).
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'default',
  isPending = false,
  onConfirm,
  confirmSlot,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          {confirmSlot ?? (
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={isPending}
            >
              {confirmLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
