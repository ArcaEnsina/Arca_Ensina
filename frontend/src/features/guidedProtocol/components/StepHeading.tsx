import { cn } from '@/lib/utils';

interface StepHeadingProps {
  title: string;
  description?: string;
  className?: string;
}

/** Consistent step title + description block used across every step type. */
export function StepHeading({ title, description, className }: StepHeadingProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <h2 className="text-display-sm text-arca-blue-900">{title}</h2>
      {description && (
        <p className="text-body-md whitespace-pre-line text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
