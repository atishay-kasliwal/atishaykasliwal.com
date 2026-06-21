import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    include: /\.(jsx?|tsx?)$/,
    loader: 'jsx',
  },
  build: {
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },
});
