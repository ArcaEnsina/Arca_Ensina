import { isAxiosError } from 'axios'

export class OfflineResourceError extends Error {
  constructor(resource: string) {
    super(`Recurso "${resource}" não disponível offline`)
    this.name = 'OfflineResourceError'
  }
}

export function isOffline(): boolean {
  return !navigator.onLine
}

export function isOfflineError(err: unknown): boolean {
  return (
    isOffline() ||
    (isAxiosError(err) && (!err.response || err.code === 'ERR_NETWORK'))
  )
}

