import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { muthuEmbedProxyPlugin } from './src/renderer/embed-proxy-plugin';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react(), muthuEmbedProxyPlugin()],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  server: {
    // Allow the embed proxy to reach external sites during standalone preview
    proxy: {},
  },
});
