import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pwa } from './vite.pwa.ts'

export default defineConfig({
  plugins: [react(), pwa()],
  worker: { format: 'es' },
})
