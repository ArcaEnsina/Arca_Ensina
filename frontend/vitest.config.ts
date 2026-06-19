import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // o módulo virtual do vite-plugin-pwa não existe nos testes (plugin não
      // carregado); aponta para um stub resolvível.
      'virtual:pwa-register/react': path.resolve(
        __dirname,
        './src/test/stubs/pwa-register-react.ts',
      ),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.test.ts'],
  },
})
