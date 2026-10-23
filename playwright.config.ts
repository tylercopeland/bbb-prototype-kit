import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;
const port = 4173;

// Outside CI, use a pre-installed Chromium when one is present (set
// CHROMIUM_EXECUTABLE, or the shared /opt/pw-browsers/chromium link) instead
// of downloading the exact build this Playwright version wants.
const localChromium = process.env.CHROMIUM_EXECUTABLE ?? '/opt/pw-browsers/chromium';
const executablePath = !CI && existsSync(localChromium) ? localChromium : undefined;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } }],
  webServer: {
    command: `npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
