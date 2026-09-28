import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Em desenvolvimento, as chamadas /api são encaminhadas para o backend.
// Em produção, o próprio backend serve o build deste frontend (mesma origem).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
})
