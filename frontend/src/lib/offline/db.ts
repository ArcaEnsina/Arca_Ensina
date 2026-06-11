import { openDB, type DBSchema } from 'idb'

const DB_NAME = 'arca-offline'
const DB_VERSION = 5

export interface ArcaDB extends DBSchema {
  protocols: {
    key: string
    value: {
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
      downloaded_at: number
    }
    indexes: { 'by-specialty': string }
  }
  bulas: {
    key: number
    value: {
      id: number
      name: string
      category: string
      description: string
      updatedAt: number
    }
    indexes: { 'by-category': string }
  }
  syncQueue: {
    key: number
    value: {
      id?: number
      type: string
      payload: unknown
      status: 'pending' | 'done' | 'error'
      createdAt: number
      retryCount: number
      nextAttemptAt?: number
    }
    indexes: { 'by-status': string }
  }
  patientSession: {
    key: string
    value: {
      sessionId: string
      patientId: string
      data: unknown
      createdAt: number
    }
  }
  medicationDetails: {
    key: number
    value: {
      id: number
      [key: string]: unknown
      updatedAt?: number
    }
  }
  guidedExecutionStates: {
    key: string
    value: {
      clientUuid: string
      currentStepKey: string
      history: Array<{
        stepKey: string
        stepType: string
        title: string
        values: Record<string, unknown>
        answeredAt: string
        loopCount?: number
      }>
      values: Record<string, unknown>
      protocolVersionId: string
      protocolId: string
      patientName: string
      patientId?: string
      status: 'em_andamento' | 'concluido' | 'abandonado'
      updatedAt: string
    }
    indexes: { 'by-status': string }
  }
}

export async function getDB() {
  return openDB<ArcaDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('protocols', { keyPath: 'id' })

        const bulaStore = db.createObjectStore('bulas', { keyPath: 'id' })
        bulaStore.createIndex('by-category', 'category')

        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
        queueStore.createIndex('by-status', 'status')

        db.createObjectStore('patientSession', { keyPath: 'sessionId' })
      }

      if (oldVersion < 2) {
        db.deleteObjectStore('bulas')
        const bulaStore = db.createObjectStore('bulas', { keyPath: 'id' })
        bulaStore.createIndex('by-category', 'category')
      }

      if (oldVersion < 3) {
        db.deleteObjectStore('protocols')
        const protocolStore = db.createObjectStore('protocols', { keyPath: 'id' })
        protocolStore.createIndex('by-specialty', 'specialty')
      }

      if (oldVersion < 4) {
        db.createObjectStore('medicationDetails', { keyPath: 'id' })
      }

      if (oldVersion < 5) {
        const execStore = db.createObjectStore('guidedExecutionStates', { keyPath: 'clientUuid' })
        execStore.createIndex('by-status', 'status')
      }
    },
  })
}
