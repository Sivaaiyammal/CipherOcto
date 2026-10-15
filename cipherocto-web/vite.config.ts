import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Same-origin /api keeps the HttpOnly session cookie first-party in dev and preview.
  // Public policy pages (/<app>/privacy) are served by the API too.
  server: { proxy: { '/api': 'http://127.0.0.1:4000', '^/[a-z0-9-]+/privacy$': 'http://127.0.0.1:4000' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:4000', '^/[a-z0-9-]+/privacy$': 'http://127.0.0.1:4000' } },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
