import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for E2E testing.
 * 
 * Key design decisions:
 * - Chromium only: Reduces CI time while covering the most common browser
 * - Single worker in CI: Prioritizes stability and reproducibility
 * - Preview URL testing: E2E tests run against Vercel preview deployments
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  // Run tests in files in parallel
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 1 : undefined,
  
  // Test timeout - longer for dynamic Next.js content
  timeout: 60000,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    // In CI, this comes from the Vercel deployment_status event
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Bypass Vercel deployment protection in CI
    // Only sends header when VERCEL_AUTOMATION_BYPASS_SECRET is set
    ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET && {
      extraHTTPHeaders: {
        'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      },
    }),
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'test-results/',
})
