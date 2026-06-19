// Não conseguimos consertar o SW antigo já instalado remotamente, então
// detectamos o loop: se a página recarregar várias vezes em sequência num
// curto intervalo, removemos o SW e limpamos os caches uma única vez para o
// cliente se auto-recuperar com um carregamento limpo.

const KEY = 'sw-reload-guard'
const WINDOW_MS = 10_000
const MAX_RELOADS = 3

type GuardState = { count: number; first: number }

export function guardAgainstReloadLoop(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  const now = Date.now()
  let state: GuardState = { count: 0, first: now }
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as GuardState
      if (now - parsed.first <= WINDOW_MS) state = parsed
    }
  } catch {
    // sessionStorage indisponível ou corrompido — recomeça do zero.
  }

  state.count += 1

  if (state.count < MAX_RELOADS) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // ignora se o storage estiver cheio/bloqueado
    }
    return
  }

  // Loop detectado: zera o contador e faz a limpeza única.
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignora
  }

  void (async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      }
    } finally {
      window.location.reload()
    }
  })()
}
