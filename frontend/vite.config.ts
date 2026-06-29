import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('react-router')) {
              return 'react';
            }
            if (id.includes('framer-motion') || id.includes('motion-utils')) {
              return 'motion';
            }
            if (id.includes('@tanstack')) {
              return 'query';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts';
            }
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
              return 'markdown';
            }
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
});