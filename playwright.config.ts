import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4200',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Projekt 'setup' do uwierzytelniania
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Użyj zapisanego stanu sesji. To nas loguje!
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'], // Uruchom testy chromium PO zakończeniu setupu
    },
  ],

  /*
   * UWAGA: Uruchom serwer deweloperski RĘCZNIE przed testami:
   *
   * Terminal 1: npm start
   * Terminal 2: npx playwright test
   *
   * Automatyczne uruchamianie jest wyłączone, bo może powodować timeouty.
   */
  // webServer: {
  //   command: 'npm start',
  //   url: 'http://localhost:4200',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  //   stdout: 'pipe',
  //   stderr: 'pipe',
  // },
});
