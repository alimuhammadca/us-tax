import { chromium } from 'file:///C:/us-tax/us-tax-be/e2e/node_modules/@playwright/test/index.mjs';
const b = await chromium.connectOverCDP('http://localhost:9223');
for (const [i,p] of b.contexts()[0].pages().entries()) { let t=''; try { t = await p.evaluate(()=>(document.body?document.body.innerText:'').replace(/\s+/g,' ').slice(0,300)); } catch(e) { t='ERR '+e.message.slice(0,60); } console.log(i, p.url(), '::', t); }
process.exit(0);
