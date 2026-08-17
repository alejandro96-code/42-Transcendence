import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SERVER_IP = process.env.SERVER_IP || 'localhost'

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 3000,
        strictPort: true,
        open: false,
        allowedHosts: ['localhost', SERVER_IP],
        watch: {
            usePolling: true
        }
    }
})