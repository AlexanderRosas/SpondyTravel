import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 👇 AGREGA ESTA SECCIÓN 👇
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // El puerto donde corre tu FastAPI
        changeOrigin: true,
        secure: false,
      }
    }
  }
})