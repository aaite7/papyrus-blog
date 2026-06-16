import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    cssMinify: true,
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.warn'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
        },
      },
    },
  },
  server: {
    allowedHosts: ['.monkeycode-ai.online'],
    headers: {
      'X-DNS-Prefetch-Control': 'on',
      'X-Content-Type-Options': 'nosniff',
    },
  },
  assetsInclude: ['**/*.webp', '**/*.avif'],
});
