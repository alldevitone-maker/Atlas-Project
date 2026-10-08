import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', testIgnore:'**/safari.spec.ts', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'] } } },
    { name: 'mobile-chromium', testIgnore:'**/safari.spec.ts', use: { ...devices['Pixel 7'], browserName: 'chromium', launchOptions: { args: ['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'] } } }
    ,{name:'desktop-webkit',testMatch:'**/safari.spec.ts',use:{...devices['Desktop Safari']}}
    ,{name:'mobile-webkit',testMatch:'**/safari.spec.ts',use:{...devices['iPhone 13']}}
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/',
    timeout: 60000,
    reuseExistingServer: !process.env.CI
  }
});
