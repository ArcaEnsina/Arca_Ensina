import { Bell } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

import NotificationPanel from './NotificationPanel'
import { useNotifications } from '../hooks/useNotifications'

interface Props {
  className?: string
}

export default function NotificationBell({ className }: Props) {
  const {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    handleMarkAsRead,
    handleMarkAllAsRead,
  } = useNotifications()

  const hasWarning = notifications.some((n) => n.level === 'warning')

  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [setIsOpen])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex size-11 items-center justify-center rounded-full border border-border bg-background',
          'transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
          'tablet:size-12',
        )}
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell size={20} className="text-foreground" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white',
              hasWarning ? 'bg-red-500' : 'bg-yellow-500',
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}