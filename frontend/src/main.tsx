/// <reference types="vite-plugin-pwa/client" />
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { UpdatePromptToast } from './components/UpdatePromptToast'
import { AuthProvider } from './features/auth'
import {
  startSyncListener,
  startProtocolAutoUpdate,
  startMedicationAutoDownload,
} from './lib/offline'
import { startReminderScheduler } from './lib/notifications'
import { guardAgainstReloadLoop } from './lib/swReloadGuard'
import './index.css'

// Deve rodar antes do registro do service worker (UpdatePromptToast).
guardAgainstReloadLoop()

startSyncListener()
startProtocolAutoUpdate()
startMedicationAutoDownload()
startReminderScheduler()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: false,
      networkMode: 'offlineFirst',
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <UpdatePromptToast />
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
