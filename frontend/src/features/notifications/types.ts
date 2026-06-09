export interface Notification {
  id: string
  is_read: boolean
  created_at: string
  title: string
  message: string
  target_type: string | null
  target_id: string | null
}