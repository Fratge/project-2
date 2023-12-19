import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/etudiants/2021/grosss/projet-2/',
  plugins: [react(), glsl()],
  build: {
    chunkSizeWarningLimit: 1000, // Ajustez la limite à 1000 KiB
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
