import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'electron',
        'path',
        'fs',
        'url',
        'crypto',
        'node:crypto',
      ],
    },
  },
  resolve: {
    // Ensure .ts files are resolved
    extensions: ['.ts', '.js', '.json'],
  },
});
