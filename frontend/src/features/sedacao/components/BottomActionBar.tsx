import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomActionBarProps {
  infoText: string;
  ctaText: string;
  onCta: () => void;
  disabled: boolean;
}

export function BottomActionBar({
  infoText,
  ctaText,
  onCta,
  disabled,
}: BottomActionBarProps) {
  return (
    <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t bg-white p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0" aria-hidden="true" />
        <span>{infoText}</span>
      </div>
      <Button
        size="lg"
        className="w-full md:w-auto"
        onClick={onCta}
        disabled={disabled}
      >
        {ctaText}
      </Button>
    </div>
  );
}
