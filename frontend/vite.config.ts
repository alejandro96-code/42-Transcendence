import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite conexiones desde el host de Docker
    port: 3000,
    strictPort: true,
    open: false, // No abrir navegador automáticamente en Docker
    allowedHosts: ['localhost'],
    //allowedHosts: ['c4r8s6'],
    watch: {
      usePolling: true // Necesario para hot-reload en algunos sistemas
    }
  }
})
