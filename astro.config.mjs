import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ['devserver-main--ds-astro-platform-starter.netlifystg.app'],
    },
  },
  integrations: [react()],
  adapter: netlify(),
});
