import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// BASE_PATH is the folder the site is served from: `/` by default (locally, in
// tests, CI and on Vercel). Set it, e.g. `/prototype/`, to host under a subfolder.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
});
