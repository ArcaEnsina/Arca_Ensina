import { useCallback, useEffect, useState } from 'react'

import { fetchUnread, markAllAsRead, markAsRead } from '../api'
import type { Notification } from '../types'

const POLL_INTERVAL_MS = 30_000 

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await fetchUnread()
      setNotifications(data)
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    const id = setInterval(load, POLL_INTERVAL_MS)
    const timeoutId = setTimeout(load, 0)
    return () => {
      clearInterval(id)
      clearTimeout(timeoutId)
    }
  }, [load])

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setNotifications([])
    setIsOpen(false)
  }

  return {
    notifications,
    unreadCount: notifications.length,
    isOpen,
    setIsOpen,
    handleMarkAsRead,
    handleMarkAllAsRead,
  }
}