import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },

  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },

  build: {
    outDir: 'build',
    // Source maps stay out of production: extra weight, and they expose source.
    sourcemap: false,
    cssCodeSplit: true,
    // Inline anything under 4KB as a data URI — too small to justify a request.
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        /**
         * Manual chunking exists to stop one enormous vendor blob.
         *
         * React and the router are on the critical path for every route, so
         * they get their own long-cached chunk. The genuinely heavy libraries
         * are isolated so a visitor who never opens a demo page never
         * downloads the in-browser LLM runtime, Firebase, or Prism.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('@mlc-ai/web-llm')) return 'vendor-webllm';
          if (id.includes('firebase')) return 'vendor-firebase';
          if (
            id.includes('react-syntax-highlighter') ||
            id.includes('refractor') ||
            id.includes('prismjs') ||
            id.includes('highlight.js')
          )
            return 'vendor-highlight';
          if (id.includes('@calcom')) return 'vendor-cal';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('react-router') ||
            id.includes('scheduler')
          )
            return 'vendor-react';

          return 'vendor';
        },

        // Content-hashed filenames so assets can be cached immutably.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },
});
