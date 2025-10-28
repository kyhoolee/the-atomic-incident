import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@scenes': path.resolve(__dirname, 'src/scenes'),
      '@systems': path.resolve(__dirname, 'src/systems'),
      '@gameplay': path.resolve(__dirname, 'src/gameplay'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@config': path.resolve(__dirname, 'src/config')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
