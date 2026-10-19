import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API requests to the Express server during local development
    // This means fetch('/api/health') will transparently hit http://localhost:5000/api/health
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL
          ? new URL(process.env.VITE_API_BASE_URL).origin
          : 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
