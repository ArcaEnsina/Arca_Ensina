import api from '@/lib/api/client'

import type { Notification } from './types'

interface PaginatedNotifications {
  results: Notification[]
}

function normalizeNotifications(
  data: Notification[] | PaginatedNotifications,
): Notification[] {
  if (Array.isArray(data)) {
    return data
  }

  return Array.isArray(data.results) ? data.results : []
}

export async function fetchUnread(): Promise<Notification[]> {
  const { data } = await api.get<Notification[] | PaginatedNotifications>(
    'notifications/',
    {
      params: { is_read: false },
    },
  )

  return normalizeNotifications(data)
}

export async function markAsRead(id: string): Promise<void> {
  await api.patch(`notifications/${id}/`, { is_read: true })
}

export async function markAllAsRead(): Promise<void> {
  await api.post('notifications/mark_all_read/')
}