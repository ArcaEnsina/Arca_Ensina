import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Rotas servidas pelo Django (proxy do Caddy) — o service worker NAO
        // deve responder com o index.html do SPA para elas, senao /admin/ etc.
        // caem no CatchAll do React Router e redirecionam para /dashboard.
        navigateFallbackDenylist: [
          /^\/admin/,
          /^\/api/,
          /^\/static/,
          /^\/schema/,
          /^\/docs/,
        ],
        runtimeCaching: [
          {
            urlPattern: /\/_assets\//,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/api\/v1\/medications\//,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "medications-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /\/api\/v1\/protocols\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "protocols-api",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
