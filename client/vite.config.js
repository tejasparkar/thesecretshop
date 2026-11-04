import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // VITE_BASE is the sub-path the site is served from, e.g. /thesecretshop/ on GitHub Pages.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
