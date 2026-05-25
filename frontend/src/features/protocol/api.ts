import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api/client'
import { protocolCache, isOffline } from '@/lib/offline'
import type { Protocol, ProtocolListItem } from './types'

export function useProtocols() {
  return useQuery<ProtocolListItem[]>({
    queryKey: ['protocols'],
    queryFn: async () => {
      const { data } = await api.get<ProtocolListItem[]>('protocols/')
      return data
    },
    networkMode: 'offlineFirst',
  })
}

export function useProtocol(id: string) {
  return useQuery<Protocol>({
    queryKey: ['protocols', id],
    queryFn: async () => {
      try {
        const { data } = await api.get<Protocol>(`protocols/${id}/`)
        await protocolCache.putProtocol({
          id: data.id,
          title: data.title,
          cid: data.cid,
          specialty: data.specialty,
          author: data.author,
          tags: data.tags,
          age_range_min: data.age_range_min,
          age_range_max: data.age_range_max,
          gender_applicable: data.gender_applicable,
          is_active: data.is_active,
          current_version: data.current_version
            ? {
                id: data.current_version.id,
                protocol_type: data.current_version.protocol_type,
                steps_data: data.current_version.steps_data,
                panel_data: data.current_version.panel_data,
                version_number: data.current_version.version_number,
              }
            : null,
          versions_count: data.versions_count,
          created_at: data.created_at,
          updated_at: data.updated_at,
          version: data.version,
          downloaded_at: Date.now(),
        })
        return data
      } catch (err) {
        if (isOffline()) {
          const cached = await protocolCache.getProtocol(id)
          if (cached) {
            return cached as Protocol
          }
        }
        throw err
      }
    },
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000,
  })
}

export function useDownloadProtocol() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.get<Protocol>(`protocols/${id}/`)
      await protocolCache.putProtocol({
        id: data.id,
        title: data.title,
        cid: data.cid,
        specialty: data.specialty,
        author: data.author,
        tags: data.tags,
        age_range_min: data.age_range_min,
        age_range_max: data.age_range_max,
        gender_applicable: data.gender_applicable,
        is_active: data.is_active,
        current_version: data.current_version
          ? {
              id: data.current_version.id,
              protocol_type: data.current_version.protocol_type,
              steps_data: data.current_version.steps_data,
              panel_data: data.current_version.panel_data,
              version_number: data.current_version.version_number,
            }
          : null,
        versions_count: data.versions_count,
        created_at: data.created_at,
        updated_at: data.updated_at,
        version: data.version,
        downloaded_at: Date.now(),
      })
      return data
    },
  })
}
