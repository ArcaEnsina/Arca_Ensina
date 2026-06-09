import { isAxiosError } from 'axios'
import { listPending, markDone, markError, markRetry } from './executionQueue'
import api from '@/lib/api/client'

const BASE_RETRY_DELAY_MS = 2_000
// Janela máxima de backoff (NFR-REL-2): nunca desiste, só espaça.
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000

let onlineHandler: (() => void) | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let isProcessing = false

function retryDelay(retryCount: number): number {
  return Math.min(BASE_RETRY_DELAY_MS * 2 ** retryCount, MAX_RETRY_DELAY_MS)
}

/**
 * 4xx (exceto 408/429) não vai mudar de resultado num retry — parar.
 * Falha de rede, 5xx, 408 e 429 são transitórias — manter na fila.
 */
function isPermanentFailure(error: unknown): boolean {
  if (!isAxiosError(error) || !error.response) return false
  const status = error.response.status
  return status >= 400 && status < 500 && status !== 408 && status !== 429
}

async function processPendingQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  try {
    const now = Date.now()
    const due = (await listPending()).filter(
      (entry) => (entry.nextAttemptAt ?? 0) <= now,
    )
    if (due.length > 0) {
      console.log(`[sync] ${due.length} operações pendentes — processando…`)
    }

    for (const entry of due) {
      if (entry.id == null) continue
      try {
        if (entry.type === 'calculator.calculate') {
          await api.post('calculator/calculate/', entry.payload)
        } else {
          console.log(`[sync] tipo desconhecido ${entry.type}, ignorando`)
        }
        await markDone(entry.id)
      } catch (error) {
        if (isPermanentFailure(error)) {
          await markError(entry.id)
          console.warn(
            `[sync] falha permanente em ${entry.type} (id=${entry.id}) — removido da fila de retry`,
          )
        } else {
          const delay = retryDelay(entry.retryCount)
          await markRetry(entry.id, delay)
          console.warn(
            `[sync] erro transitório em ${entry.type} (id=${entry.id}) — nova tentativa em ${Math.round(delay / 1000)}s`,
          )
        }
      }
    }
  } finally {
    isProcessing = false
  }
  await scheduleNextRun()
}

/** Re-agenda o processamento para a entrada pendente mais próxima de vencer. */
async function scheduleNextRun(): Promise<void> {
  if (retryTimer || !onlineHandler || !navigator.onLine) return
  const pending = await listPending()
  if (pending.length === 0) return

  const nextAt = Math.min(...pending.map((entry) => entry.nextAttemptAt ?? 0))
  const delay = Math.max(nextAt - Date.now(), BASE_RETRY_DELAY_MS)
  retryTimer = setTimeout(() => {
    retryTimer = null
    void processPendingQueue()
  }, delay)
}

export function startSyncListener(): void {
  if (onlineHandler) return

  onlineHandler = () => {
    void processPendingQueue()
  }
  window.addEventListener('online', onlineHandler)

  // Entradas de sessões anteriores: descarrega já, sem esperar transição de rede.
  if (navigator.onLine) {
    void processPendingQueue()
  }
}

export function stopSyncListener(): void {
  if (!onlineHandler) return
  window.removeEventListener('online', onlineHandler)
  onlineHandler = null
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
}
