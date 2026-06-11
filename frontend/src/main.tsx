/// <reference types="vite-plugin-pwa/client" />
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { UpdatePromptToast } from './components/UpdatePromptToast'
import { AuthProvider } from './features/auth'
import { startSyncListener, startProtocolAutoUpdate } from './lib/offline'
import { startReminderScheduler } from './lib/notifications'
import './index.css'

startSyncListener()
startProtocolAutoUpdate()
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
