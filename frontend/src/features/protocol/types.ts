export interface ProtocolVersion {
  id: string
  protocol: string
  protocol_title: string
  version_number: number
  protocol_type: 'guiado' | 'painel'
  steps_data: Record<string, unknown> | null
  panel_data: Record<string, unknown> | null
  metadata: Record<string, unknown>
  created_by: string | null
  is_current: boolean
  created_at: string
  updated_at: string | null
  version: number
}

export interface Protocol {
  id: string
  title: string
  cid: string
  specialty: string
  author: string
  tags: string[]
  age_range_min: number | null
  age_range_max: number | null
  gender_applicable: 'M' | 'F' | null
  is_active: boolean
  current_version: ProtocolVersion | null
  versions_count: number
  created_at: string
  updated_at: string
  version: number
}

export interface ProtocolListItem {
  id: string
  title: string
  cid: string
  specialty: string
  author: string
  tags: string[]
  gender_applicable: 'M' | 'F' | null
  is_active: boolean
  current_version_type: 'guiado' | 'painel' | null
  created_at: string
  updated_at: string
  version: number
}
