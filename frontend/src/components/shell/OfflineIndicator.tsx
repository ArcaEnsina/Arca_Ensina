import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-warning/90 text-neutral-950',
        'px-4 py-2 text-center',
        'text-caption font-medium',
        'backdrop-blur-sm',
        'animate-in slide-in-from-top duration-300',
      )}
    >
      <span className="inline-flex items-center gap-2">
        <WifiOff size={14} aria-hidden />
        Você está offline no momento, mas suas informações estão seguras no
        aparelho.
      </span>
    </div>
  )
}
