import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { getDB } from '@/lib/offline/db'

// Polyfill Radix UI DOM methods not available in jsdom
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// Mock navigator.onLine for offline tests
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  configurable: true,
  value: true,
})

// Clean up IndexedDB stores between tests
// Cannot use indexedDB.deleteDatabase() because idb caches connections
beforeEach(async () => {
  const db = await getDB()
  const storeNames = Array.from(db.objectStoreNames)
  const tx = db.transaction(storeNames, 'readwrite')
  for (const name of storeNames) {
    tx.objectStore(name).clear()
  }
  await tx.done
})
