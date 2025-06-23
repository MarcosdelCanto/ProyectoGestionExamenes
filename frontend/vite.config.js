// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // --- AÑADE ESTA NUEVA REGLA PARA SOCKET.IO ---
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true, // La clave 'ws: true' habilita el proxy para WebSockets
      },
    },
  },
});
