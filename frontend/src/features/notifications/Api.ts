import api from '@/lib/api/client'

import type { Notification } from './types'

export async function fetchUnread(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>('notifications/', {
    params: { is_read: false },
  })
  return data
}

export async function markAsRead(id: string): Promise<void> {
  await api.patch(`notifications/${id}/`, { is_read: true })
}

export async function markAllAsRead(): Promise<void> {
  await api.post('notifications/mark_all_read/')
}