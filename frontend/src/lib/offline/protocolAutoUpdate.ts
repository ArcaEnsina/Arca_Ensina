import api from '@/lib/api/client'
import * as protocolCache from './protocolCache'
import { listActiveExecutions } from './executionState'
import { notify } from '@/lib/notifications'
import type { CachedProtocol } from './protocolCache'

/**
 * Auto-atualização de protocolos baixados.
 *
 * Quando o usuário está online e NÃO está no meio da execução de nenhum
 * protocolo, cada protocolo baixado é comparado com a versão atual no
 * servidor; se houver versão mais nova, o cache é atualizado automaticamente
 * e o usuário é avisado por notificação.
 */

interface ServerProtocol {
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
  current_version: {
    id: string
    protocol_type: 'guiado' | 'painel'
    steps_data: Record<string, unknown> | null
    panel_data: Record<string, unknown> | null
    version_number: number
  } | null
  versions_count: number
  created_at: string
  updated_at: string
  version: number
}

function toCached(data: ServerProtocol): CachedProtocol {
  return {
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
  }
}

function notifyProtocolUpdated(protocol: CachedProtocol): void {
  notify({
    title: 'Protocolo atualizado',
    body:
      `"${protocol.title}" atualizado para a versão ` +
      `${protocol.current_version?.version_number ?? '?'}.`,
    tag: `protocol-update-${protocol.id}`,
  })
}

function hasNewerVersion(cached: CachedProtocol, server: ServerProtocol): boolean {
  const cachedVn = cached.current_version?.version_number ?? 0
  const serverVn = server.current_version?.version_number ?? 0
  if (serverVn !== cachedVn) return serverVn > cachedVn
  // Mesmo version_number mas o protocolo em si mudou (metadados, etc.)
  return server.updated_at !== cached.updated_at
}

let running = false

/**
 * Atualiza protocolos baixados para a versão mais nova no servidor.
 * No-op quando offline ou quando há execução de protocolo em andamento.
 * Retorna os protocolos que foram atualizados.
 */
export async function runProtocolAutoUpdate(): Promise<CachedProtocol[]> {
  if (running) return []
  if (typeof navigator !== 'undefined' && !navigator.onLine) return []

  running = true
  try {
    // Nunca trocar a versão de um protocolo debaixo de uma execução ativa
    const active = await listActiveExecutions()
    if (active.some((s) => s.status === 'em_andamento')) return []

    const cached = await protocolCache.listCached()
    if (cached.length === 0) return []

    const updated: CachedProtocol[] = []
    for (const local of cached) {
      try {
        const { data } = await api.get<ServerProtocol>(`protocols/${local.id}/`)
        if (hasNewerVersion(local, data)) {
          const fresh = toCached(data)
          await protocolCache.putProtocol(fresh)
          notifyProtocolUpdated(fresh)
          updated.push(fresh)
        }
      } catch {
        // Sem rede / não autenticado / protocolo removido — tenta na próxima
      }
    }
    return updated
  } finally {
    running = false
  }
}

let listenerAttached = false

/**
 * Registra a auto-atualização: roda no boot (se online) e a cada reconexão.
 */
export function startProtocolAutoUpdate(): void {
  if (listenerAttached) return
  listenerAttached = true
  window.addEventListener('online', () => {
    void runProtocolAutoUpdate()
  })
  if (navigator.onLine) {
    void runProtocolAutoUpdate()
  }
}
