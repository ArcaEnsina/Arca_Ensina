import api from '@/lib/api/client'

import type { Notification } from './types'

interface Paginated<T> {
  results: T[]
}

function isPaginated<T>(data: T[] | Paginated<T>): data is Paginated<T> {
  return !Array.isArray(data) && Array.isArray((data as Paginated<T>).results)
}

export async function fetchUnread(): Promise<Notification[]> {
  const { data } = await api.get<Notification[] | Paginated<Notification>>(
    'notifications/',
    { params: { is_read: false } },
  )
  return isPaginated(data) ? data.results : data
}

export async function markAsRead(id: string): Promise<void> {
  await api.patch(`notifications/${id}/`, { is_read: true })
}

export async function markAllAsRead(): Promise<void> {
  await api.post('notifications/mark_all_read/')
}
