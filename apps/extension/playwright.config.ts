import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // one persistent Chromium with the extension at a time
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:5174', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm --filter playground dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
  },
});
