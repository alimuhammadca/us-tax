// Capture the Help Central pop-up (separate WebView page under /help/) as its own numbered screen, then close it.
// Usage: node helpcap.mjs <slug>
import { chromium } from 'file:///C:/us-tax/us-tax-be/e2e/node_modules/@playwright/test/index.mjs';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
const ROOT='C:/us-tax/ux-research/hrblock-2025', STATE=ROOT+'/tools/state.json';
const slug=(process.argv[2]||'help').toLowerCase().replace(/[^a-z0-9-]+/g,'-');
const urlRe=new RegExp((process.argv.find(a=>a.startsWith('--url='))||'--url=/help/').slice(6),'i');
const prefix=(process.argv.find(a=>a.startsWith('--prefix='))||'--prefix=help-').slice(9);
const closeClass=(process.argv.find(a=>a.startsWith('--close='))||'--close=Help Central 2025').slice(8);
const b=await chromium.connectOverCDP('http://localhost:9223');
let page=null; for(let i=0;i<20 && !page;i++){ page=b.contexts()[0].pages().find(p=>urlRe.test(p.url())); if(!page) await new Promise(r=>setTimeout(r,500)); }
if(!page){ console.log('NO HELP PAGE'); process.exit(1); }
await new Promise(r=>setTimeout(r,1200));
const info=await page.evaluate(()=>{ const c=s=>(s||'').replace(/\s+/g,' ').trim(); return { url:location.href, title:c(document.title), text:c(document.body?.innerText), links:[...document.querySelectorAll('a')].map(a=>({t:c(a.innerText),h:(a.getAttribute('href')||'').slice(0,120)})).filter(l=>l.t) }; });
const st=JSON.parse(readFileSync(STATE,'utf8')); st.n++; writeFileSync(STATE,JSON.stringify(st));
const base=`${ROOT}/screens/${String(st.n).padStart(3,'0')}-${prefix}${slug}`;
const exp=await page.evaluate(()=>{let n=0;for(const el of document.querySelectorAll('body *')){const cs=getComputedStyle(el);if((cs.overflowY==='auto'||cs.overflowY==='scroll')&&el.scrollHeight>el.clientHeight+5){el.style.overflow='visible';el.style.height='auto';el.style.maxHeight='none';n++;}}document.body.style.overflow='visible';document.documentElement.style.overflow='visible';return n;}).catch(()=>0);
try{ await page.screenshot({path:base+'.png',fullPage:true}); }catch(e){}
writeFileSync(base+'.json',JSON.stringify({n:st.n,slug:prefix+slug,type:(prefix==='help-'?'Help pop-up':'Report window'),...info},null,1));
console.log(`== ${st.n} ${prefix}${slug}\nURL ${info.url}\nTEXT ${info.text.slice(0,1500)}\nLINKS ${info.links.map(l=>l.t+' -> '+l.h).join(' ; ').slice(0,600)}`);
if(!process.argv.includes('--keep')) execSync(`powershell -ExecutionPolicy Bypass -File ${ROOT}/tools/closewin.ps1 -Class "${closeClass}"`);
process.exit(0);
