export class OfflineResourceError extends Error {
  constructor(resource: string) {
    super(`Recurso "${resource}" não disponível offline`)
    this.name = 'OfflineResourceError'
  }
}

export function isOffline(): boolean {
  return !navigator.onLine
}
