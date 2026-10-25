import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // One jsdom per worker, shared across test files: creating it per file was a
      // third of the run (20 s → 7 s for 26 files). setup.ts cleans the DOM after
      // every test, so files do not see each other's render trees.
      isolate: false,
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
      exclude: ['e2e/**', 'node_modules/**'],
    },
  }),
);
