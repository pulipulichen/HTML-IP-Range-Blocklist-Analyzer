import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 3 * 60 * 1000,
  testDir: 'e2e',
  outputDir: 'playwright-report-videos',
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    // video: 'retain-on-failure',
    video: 'on',
  },
  outputDir: 'test-results',
});
