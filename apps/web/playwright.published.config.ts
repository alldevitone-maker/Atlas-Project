import {defineConfig,devices} from '@playwright/test';

if(process.env.CI && !process.env.ATLAS_PUBLISHED_URL)throw new Error('Published smoke requires the actual deployment URL');

export default defineConfig({
 testDir:'./e2e-published',timeout:30000,retries:process.env.CI ? 2 : 0,
 reporter:process.env.CI ? [['github'],['html',{open:'never'}]] : 'list',
 use:{baseURL:process.env.ATLAS_PUBLISHED_URL ?? 'http://127.0.0.1:4173/',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[
  {name:'published-desktop',use:{...devices['Desktop Chrome'],launchOptions:{args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']}}},
  {name:'published-mobile',use:{...devices['Pixel 7'],launchOptions:{args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']}}}
 ],
 webServer:process.env.ATLAS_PUBLISHED_URL ? undefined : {command:'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173/',reuseExistingServer:!process.env.CI}
});
