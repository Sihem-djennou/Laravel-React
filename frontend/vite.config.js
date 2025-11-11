import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,         // ✅ Force Vite to run on port 5173
    strictPort: true,  // ✅ Prevent Vite from switching ports automatically
  },
})
