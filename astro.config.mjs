// @ts-check
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  base: '/write-tool',
  integrations: [react(), tailwind()],
  vite: {
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..']
      }
    },
    cacheDir: './.vite',
    optimizeDeps: {
      exclude: ['@astrojs/react', '@astrojs/tailwind']
    }
  }
});