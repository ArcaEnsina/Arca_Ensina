export interface Notification {
  id: string
  is_read: boolean
  created_at: string
  title: string
  message: string
  target_type: string | null
  target_id: string | null
  protocol_id: number | null
  level: 'info' | 'warning' | 'error' | 'success'
}
