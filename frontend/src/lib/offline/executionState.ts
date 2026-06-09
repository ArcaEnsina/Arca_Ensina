import { getDB } from './db'

export interface ExecutionStateRecord {
  clientUuid: string
  currentStepKey: string
  history: Array<{
    stepKey: string
    stepType: string
    title: string
    values: Record<string, unknown>
    answeredAt: string
  }>
  values: Record<string, unknown>
  protocolVersionId: string
  protocolId: string
  patientName: string
  patientId?: string
  status: 'em_andamento' | 'concluido' | 'abandonado'
  updatedAt: string
}

/** Write-through save of execution state on every transition. */
export async function saveExecutionState(state: ExecutionStateRecord): Promise<void> {
  const db = await getDB()
  await db.put('guidedExecutionStates', {
    ...state,
    updatedAt: new Date().toISOString(),
  })
}

/** Restore execution state by clientUuid. Returns undefined if not found. */
export async function loadExecutionState(
  clientUuid: string,
): Promise<ExecutionStateRecord | undefined> {
  const db = await getDB()
  return db.get('guidedExecutionStates', clientUuid)
}

/** List all non-concluido execution states (active executions). */
export async function listActiveExecutions(): Promise<ExecutionStateRecord[]> {
  const db = await getDB()
  const all = await db.getAll('guidedExecutionStates')
  return all.filter((s) => s.status !== 'concluido')
}

/** Delete execution state after sync confirmed. */
export async function deleteExecutionState(clientUuid: string): Promise<void> {
  const db = await getDB()
  await db.delete('guidedExecutionStates', clientUuid)
}

/** Mark execution state as synced (keeps record but marks status). */
export async function markExecutionSynced(clientUuid: string): Promise<void> {
  const db = await getDB()
  const existing = await db.get('guidedExecutionStates', clientUuid)
  if (existing) {
    await db.put('guidedExecutionStates', {
      ...existing,
      updatedAt: new Date().toISOString(),
    })
  }
}
