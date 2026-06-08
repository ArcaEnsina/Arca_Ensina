import { X } from 'lucide-react'

import type { Notification } from '../types'

interface Props {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
}

export default function NotificationPanel({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: Props) {
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
              className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body-md font-medium text-foreground">{n.protocol_title}</p>
                <p className="text-caption text-muted-foreground">
                  Versão {n.protocol_version_label} disponível
                </p>
              </div>
              <button
                type="button"
                onClick={() => onMarkAsRead(n.id)}
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