import { X } from 'lucide-react'
import { useNavigate } from 'react-router'

import type { Notification } from '../types'

interface Props {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onClose?: () => void
}

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: Props) {
  const navigate = useNavigate()

  const handleNotificationClick = (n: Notification) => {
    onMarkAsRead(n.id)
    navigate(`/guided-protocol/${n.protocol_id}`)
    onClose?.()
  }

  return (
    <div
      role="dialog"
      aria-label="Central de notificações"
      className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-border bg-background shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-body-md font-semibold text-foreground">Notificações</span>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-caption text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      <ul className="max-h-96 divide-y divide-border overflow-y-auto">
        {notifications.length === 0 ? (
          <li className="px-4 py-8 text-center text-body-md text-muted-foreground">
            Nenhuma notificação
          </li>
        ) : (
          notifications.map((n) => (
            <li
              key={n.id}
              className="group flex items-start gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <button
                type="button"
                onClick={() => handleNotificationClick(n)}
                className="min-w-0 flex-1 text-left focus-visible:outline-none"
              >
                <p className="text-body-md font-medium text-foreground group-hover:text-primary transition-colors">
                  {n.protocol_title}
                </p>
                <p className="text-caption text-muted-foreground">
                  Versão {n.protocol_version_label} disponível
                </p>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead(n.id)
                }}
                className="shrink-0 rounded-full p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Dispensar notificação: ${n.protocol_title}`}
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}