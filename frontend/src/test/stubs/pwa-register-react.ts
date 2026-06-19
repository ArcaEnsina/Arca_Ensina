// Stub do módulo virtual `virtual:pwa-register/react` (vite-plugin-pwa) para os
// testes, onde o plugin do PWA não está carregado. Os testes que precisam de um
// comportamento específico sobrescrevem via `vi.mock`.
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (value: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (value: boolean) => void],
    updateServiceWorker: (_reloadPage?: boolean) => Promise.resolve(),
  }
}
