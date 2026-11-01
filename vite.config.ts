import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// BASE_PATH is the folder the site is served from: `/` locally, in tests and CI;
// `/bbb-prototype-kit/` on GitHub Pages (.github/workflows/deploy.yml).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
});
