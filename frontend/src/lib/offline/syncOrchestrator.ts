import { listPending, markDone, markError } from './executionQueue'

let onlineHandler: (() => void) | null = null
let isProcessing = false

async function processPendingQueue(): Promise<void> {
  if (isProcessing) return
  isProcessing = true
  try {
    const pending = await listPending()
    if (pending.length === 0) return

    console.log(`[sync] ${pending.length} operações pendentes — processando…`)

    for (const entry of pending) {
      if (entry.id == null) continue
      try {
        // TODO: implementar dispatch real na story 3.5
        console.log(`[sync] processando ${entry.type}:`, entry.payload)
        await markDone(entry.id)
      } catch {
        await markError(entry.id)
        console.warn(`[sync] erro ao processar ${entry.type} (id=${entry.id})`)
      }
    }
  } finally {
    isProcessing = false
  }
}

export function startSyncListener(): void {
  if (onlineHandler) return

  onlineHandler = () => {
    void processPendingQueue()
  }
  window.addEventListener('online', onlineHandler)
}

export function stopSyncListener(): void {
  if (!onlineHandler) return
  window.removeEventListener('online', onlineHandler)
  onlineHandler = null
}
