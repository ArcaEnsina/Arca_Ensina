import { CloudCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CacheStatusIndicatorProps {
  isCached: boolean
  className?: string
}

export function CacheStatusIndicator({
  isCached,
  className,
}: CacheStatusIndicatorProps) {
  if (!isCached) return null
  return (
    <span
      aria-label="Salvo no aparelho para uso offline"
      className={cn(
        'inline-flex items-center gap-0.5',
        'text-caption font-medium text-success',
        className,
      )}
    >
      <CloudCheck size={12} aria-hidden />
    </span>
  )
}
