import api from '@/lib/api/client'
import * as medicationCache from './medicationCache'
import * as medicationDetailCache from './medicationDetailCache'
import type { Medication } from '@/features/calculator/types'

/**
 * Auto-download de medicamentos para uso offline.
 *
 * Como são poucos medicamentos, ao ficar online o app baixa TODOS já com o
 * schema rico (apresentações/regimes) e grava no IndexedDB. Assim a calculadora
 * funciona offline para qualquer medicamento, sem depender de abrir cada um
 * antes — e o cache é repopulado a cada abertura online (cobrindo expiração de
 * storage no celular).
 */

let running = false

export async function runMedicationDownload(): Promise<void> {
  if (running) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  running = true
  try {
    const { data } = await api.get<Medication[]>('medications/all/')
    if (!Array.isArray(data) || data.length === 0) return

    await medicationDetailCache.putDetails(data)

    // mantém o catálogo leve (store `bulas`) sincronizado para o fallback da lista
    const now = Date.now()
    await Promise.all(
      data.map((med) =>
        medicationCache.putMedication({
          id: med.id,
          name: med.name,
          category: med.category,
          description: med.description,
          updatedAt: now,
        }),
      ),
    )
  } catch {
    // sem rede / não autenticado — tenta na próxima reconexão
  } finally {
    running = false
  }
}

let listenerAttached = false

/**
 * Registra o auto-download: roda no boot (se online) e a cada reconexão.
 */
export function startMedicationAutoDownload(): void {
  if (listenerAttached) return
  listenerAttached = true
  window.addEventListener('online', () => {
    void runMedicationDownload()
  })
  if (navigator.onLine) {
    void runMedicationDownload()
  }
}
