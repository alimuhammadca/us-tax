import { chromium } from 'file:///C:/us-tax/us-tax-be/e2e/node_modules/@playwright/test/index.mjs';
const b = await chromium.connectOverCDP('http://localhost:9223');
const page = b.contexts()[0].pages().find(p=>p.url().includes('tmpscreen'));
const code = process.argv[2];
console.log(JSON.stringify(await page.evaluate(new Function('return ('+code+')')), null, 1));
process.exit(0);
