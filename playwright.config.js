import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(process.env.CI
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  webServer: [
    {
      command: 'node tools/serve.js',
      url: 'http://127.0.0.1:3000/index.html',
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
    {
      command: 'node examples/ssr-server.js --port 3333',
      url: 'http://127.0.0.1:3333/?hydrate=0',
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
  ],
});
