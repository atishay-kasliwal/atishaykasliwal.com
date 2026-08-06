import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
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
    /**
     * Emits build/.vite/manifest.json — the source-file → emitted-asset map
     * scripts/prerender.mjs reads to inject real <link rel="stylesheet"> tags
     * for the four code-split legacy routes (/resume, /art, /atriveo,
     * /highlights). Without it their CSS only reaches the page once the
     * browser executes the route's JS chunk, so on a throttled connection the
     * page painted unstyled and then reflowed hard the moment the stylesheet
     * arrived — measured at 0.38–0.41 CLS. SSR build does not need it.
     */
    manifest: !isSsrBuild,
    // The SSR pass would otherwise copy all of public/ into .ssr/ — hundreds of
    // images duplicated for a bundle that is only ever imported by Node.
    copyPublicDir: !isSsrBuild,
    cssCodeSplit: true,
    // Inline anything under 4KB as a data URI — too small to justify a request.
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,

    /**
     * The SSR bundle is consumed by scripts/prerender.mjs as a single module,
     * so it keeps rollup's defaults — a predictable `.ssr/entry-server.js`
     * entry point. Chunk splitting and content hashing exist for browser
     * caching and are meaningless (and actively unhelpful) here.
     */
    rollupOptions: isSsrBuild
      ? {}
      : {
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

          /**
           * React is deliberately NOT manually chunked.
           *
           * Forcing react, react-dom, scheduler, and react-router into one
           * chunk broke module initialisation order: react-dom evaluated
           * before react's export object existed, throwing "Cannot set
           * properties of undefined (setting 'Activity')" at runtime. That
           * killed hydration, so React discarded the prerendered HTML and
           * re-rendered the whole page from scratch — a ~0.27 CLS on every
           * route and the loss of every benefit prerendering was there to buy.
           *
           * Rollup already resolves this ordering correctly on its own. The
           * chunks above are safe because those libraries are leaves, imported
           * only by lazy routes; React is not.
           */
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
}));
