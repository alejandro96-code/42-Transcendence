import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SERVER_IP = process.env.SERVER_IP || 'localhost'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite conexiones desde el host de Docker
    port: 3000,
    strictPort: true,
    open: false, // No abrir navegador automáticamente en Docker
    allowedHosts: ['localhost', SERVER_IP],
    watch: {
      usePolling: true // Necesario para hot-reload en algunos sistemas
    }
  }
})
