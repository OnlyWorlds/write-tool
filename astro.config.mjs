// @ts-check
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static', 
  base: '/browse-tool/', 
  integrations: [react()]
});
