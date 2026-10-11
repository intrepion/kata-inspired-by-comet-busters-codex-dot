import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',timeout:180000,expect:{timeout:10000},workers:1,use:{baseURL:'http://127.0.0.1:5180',headless:true,viewport:{width:1280,height:1000},screenshot:'only-on-failure'},webServer:{command:'npm run dev',url:'http://127.0.0.1:5180',reuseExistingServer:!process.env.CI,timeout:20000}});
