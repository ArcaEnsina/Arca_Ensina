# Offline Layer (`src/lib/offline/`)

IndexedDB-backed offline storage for Arca Ensina PWA.

## Schema (v2)

| Store           | PK          | Indexes                     | Purpose                         |
| --------------- | ----------- | --------------------------- | ------------------------------- |
| `protocols`     | `id`        | `by-slug` (unique), `by-category` | Cached protocolos clínicos |
| `bulas`         | `id`        | `by-category`               | Bulário offline (medicamentos da calculadora) |
| `syncQueue`     | auto-inc    | `by-status`                 | Operações pendentes de sync     |
| `patientSession`| `sessionId` | —                           | Sessão do paciente em andamento |

## DAOs

- **protocolCache** — CRUD de protocolos no IndexedDB
- **medicationCache** — CRUD de medicamentos (bulário) no IndexedDB
- **executionQueue** — fila de operações pendentes (enqueue/dequeue/markDone/markError)
- **patientSession** — sessão do paciente offline

## Sync

`syncOrchestrator` escuta o evento `online` do browser e processa a fila.
O dispatch real das operações será implementado na **story 3.5** (por ora, apenas loga no console).

## Errors

`OfflineResourceError` é lançado quando um recurso não está disponível offline.
`isOffline()` retorna `true` se o browser estiver offline.

## Known Gaps

- **Ícones PWA**: `icon-192.png`, `icon-512.png`, `icon-maskable.png` precisam ser adicionados em `public/`
- **`useProtocols` lista**: não tem fallback offline ainda (apenas detalhe por id/slug)
- **`syncOrchestrator`**: placeholder — dispatch real será implementado na **story 3.5**
