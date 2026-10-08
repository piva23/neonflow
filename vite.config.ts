import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      fs: { allow: ['../..'] },
    },
    optimizeDeps: {
      include: [
        'firebase',
        'firebase/auth',
        'firebase/app',
        'firebase/firestore',
        'firebase/storage',
      ],
    },
    build: {
      rollOptions: {
        external: ['firebase', 'firebase/auth', 'firebase/app', 'firebase/firestore', 'firebase/storage'],
      },
    },
  };
});