import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        proxy: {
            '/api': {
                target: 'https://scholarpath-myhe.onrender.com',
                changeOrigin: true
            },
          
        }
    }
})
