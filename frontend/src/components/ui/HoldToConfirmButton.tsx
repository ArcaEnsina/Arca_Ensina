import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HoldToConfirmButtonProps {
  /** Disparado quando o usuário mantém o botão pressionado pelo tempo todo. */
  onConfirm: () => void;
  children: React.ReactNode;
  /** Duração do hold em ms (padrão 1500). */
  duration?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Botão "segure para confirmar" — prevenção de erros para ações destrutivas.
 * Ao pressionar (pointerdown), uma barra de progresso preenche em `duration`ms;
 * ao completar, dispara `onConfirm`. Soltar antes cancela.
 */
export default function HoldToConfirmButton({
  onConfirm,
  children,
  duration = 1500,
  disabled = false,
  className,
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = React.useState(0);
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number>(0);
  const firedRef = React.useRef(false);

  const stop = React.useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setProgress(0);
  }, []);

  React.useEffect(() => stop, [stop]);

  const start = React.useCallback(() => {
    if (disabled) return;
    firedRef.current = false;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const pct = Math.min((now - startRef.current) / duration, 1);
      setProgress(pct);
      if (pct >= 1) {
        if (!firedRef.current) {
          firedRef.current = true;
          onConfirm();
        }
        stop();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [disabled, duration, onConfirm, stop]);

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className={cn('relative overflow-hidden', className)}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-destructive/30 transition-none"
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative">{children}</span>
    </Button>
  );
}
