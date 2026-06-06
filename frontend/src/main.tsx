/// <reference types="vite-plugin-pwa/client" />
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRegisterSW } from 'virtual:pwa-register/react'
import App from './App'
import { AuthProvider } from './features/auth'
import { startSyncListener } from './lib/offline'
import './index.css'

startSyncListener()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: false,
      networkMode: 'offlineFirst',
    },
  },
})

// eslint-disable-next-line react-refresh/only-export-components
function SWRegistration() {
  useRegisterSW()
  return null
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SWRegistration />
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
