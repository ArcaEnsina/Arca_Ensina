import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InfoBannerProps {
  children: ReactNode;
  className?: string;
}

export function InfoBanner({ children, className }: InfoBannerProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl bg-arca-blue-50 p-4',
        className,
      )}
    >
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-arca-blue-600 text-sm font-bold italic text-arca-blue-600"
        aria-hidden="true"
      >
        i
      </span>
      <div className="text-body-md whitespace-pre-line leading-relaxed text-arca-blue-900/80">
        {children}
      </div>
    </div>
  );
}
