// UX-research step tool for H&R Block 2025 (WebView2 over CDP on :9223).
// Usage:  node ux.mjs '<actions JSON>' <slug> [--nocap] [--full]
// Actions (array of arrays), executed in order with TRUSTED input (keyboard / real mouse):
//   ["fill", name, value]          click field, Ctrl+A, type value, Tab
//   ["radio", name, value]         focus + Space (realClick fallback). name may be "" -> match by value only
//   ["radioLabel", name, substr]   pick radio option of group <name> whose label contains substr
//   ["check", name]                ensure checked (focus+Space)
//   ["uncheck", name]
//   ["select", name, labelSubstr]  ArrowDown/Up to option (no selectOption)
//   ["click", cssSelector]         real mouse click on element center
//   ["clickText", text]            real mouse click on the smallest visible a/button/img/td whose text/alt/title contains text
//   ["next"] / ["back"]            right/left nav button
//   ["wait", ms]   ["key", "Enter"]
// After actions it captures screens/NNN-<slug>.png + .json and prints a compact summary.
import { chromium } from 'file:///C:/us-tax/us-tax-be/e2e/node_modules/@playwright/test/index.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
const ROOT = 'C:/us-tax/ux-research/hrblock-2025';
const STATE = ROOT + '/tools/state.json';
const actions = JSON.parse(process.argv[2] || '[]');
const slug = (process.argv[3] || 'screen').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
const nocap = process.argv.includes('--nocap');
const pause = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.connectOverCDP('http://localhost:9223');
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('tmpscreen')) || ctx.pages()[0];
const dialogs = [];
page.on('dialog', async d => { dialogs.push(d.type() + ': ' + d.message()); try { await d.accept(); } catch {} });

const bodyText = async () => (await page.evaluate(() => document.body ? document.body.innerText : '').catch(() => '')).replace(/\s+/g, ' ').trim();
async function waitChange(prev, ms = 15000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const t = await bodyText(); if (t && t !== prev) return true; await pause(300); } return false; }
async function settle(ms = 1500) { let last = await bodyText(); const t0 = Date.now(); while (Date.now() - t0 < ms) { await pause(250); const n = await bodyText(); if (n === last) return; last = n; } }
async function realClickSel(sel) {
  const box = await page.evaluate(s => { const el = document.querySelector(s); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return r.width > 0 ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null; }, sel);
  if (!box) return false;
  await page.mouse.move(box.x, box.y); await page.mouse.down(); await pause(60); await page.mouse.up(); return true;
}
async function realClickBox(box) { await page.mouse.move(box.x, box.y); await page.mouse.down(); await pause(60); await page.mouse.up(); }
const checked = sel => page.locator(sel).first().isChecked().catch(() => null);

async function doAction(a) {
  const [op, x, y] = a;
  if (op === 'fill') {
    const sel = `input[name="${x}"], textarea[name="${x}"]`;
    for (let i = 0; i < 4; i++) {
      await realClickSel(sel); await pause(120);
      await page.keyboard.press('Control+A'); await page.keyboard.press('Delete');
      await page.keyboard.type(String(y), { delay: 45 }); await page.keyboard.press('Tab'); await pause(300);
      const got = await page.evaluate(n => document.querySelector(`[name="${n}"]`)?.value ?? null, x);
      const norm = s => String(s ?? '').replace(/[^0-9a-z]/gi, '').toLowerCase();
      if (got === null) return 'fill ' + x + ' MISSING';
      if (norm(got) === norm(y) || norm(got).startsWith(norm(y))) return 'fill ' + x + '=' + got;
    }
    return 'fill ' + x + ' UNVERIFIED';
  }
  if (op === 'radio') {
    const sel = x ? `input[name="${x}"][value="${y}"]` : `input[type=radio][value="${y}"]`;
    for (let i = 0; i < 4; i++) {
      if (await checked(sel)) return 'radio ok ' + y;
      await page.locator(sel).first().focus().catch(() => {}); await pause(120); await page.keyboard.press('Space'); await pause(300);
      if (await checked(sel)) return 'radio ok ' + y;
      await realClickSel(sel); await pause(300);
    }
    return 'radio FAIL ' + y;
  }
  if (op === 'radioLabel') {
    const v = await page.evaluate(([n, s]) => { const L = e => ((e.closest('label')?.innerText) || (e.closest('td')?.nextElementSibling?.innerText) || (e.parentElement?.innerText) || '').toLowerCase(); const o = [...document.querySelectorAll(`input[type=radio][name="${n}"]`)].find(e => L(e).includes(s.toLowerCase())); return o ? o.value : null; }, [x, y]);
    if (v == null) return 'radioLabel NOTFOUND ' + y;
    return doAction(['radio', x, v]);
  }
  if (op === 'check' || op === 'uncheck') {
    const sel = `input[name="${x}"]`; const want = op === 'check';
    for (let i = 0; i < 5; i++) {
      if ((await checked(sel)) === want) return op + ' ok ' + x;
      await page.locator(sel).first().focus().catch(() => {}); await pause(120); await page.keyboard.press('Space'); await pause(300);
    }
    return op + ' FAIL ' + x;
  }
  if (op === 'select') {
    const sel = `select[name="${x}"]`;
    const meta = await page.evaluate(([n, l]) => { const e = document.querySelector(`select[name="${n}"]`); if (!e) return null; const L = String(l).toLowerCase(); let ti = [...e.options].findIndex(o => o.text.trim().toLowerCase() === L); if (ti < 0) ti = [...e.options].findIndex(o => o.text.trim().toLowerCase().startsWith(L)); if (ti < 0) ti = [...e.options].findIndex(o => o.text.toLowerCase().includes(L)); return { ti, n: e.options.length }; }, [x, y]);
    if (!meta || meta.ti < 0) return 'select NOTFOUND ' + x + ' ' + y;
    for (let att = 0; att < 3; att++) {
      await page.locator(sel).first().focus().catch(() => {}); await pause(120);
      let cur = await page.evaluate(n => document.querySelector(`select[name="${n}"]`).selectedIndex, x); let g = 0;
      while (cur !== meta.ti && g++ < meta.n + 3) { await page.keyboard.press(cur < meta.ti ? 'ArrowDown' : 'ArrowUp'); await pause(90); cur = await page.evaluate(n => document.querySelector(`select[name="${n}"]`).selectedIndex, x); }
      await page.keyboard.press('Tab'); await pause(300);
      cur = await page.evaluate(n => document.querySelector(`select[name="${n}"]`)?.selectedIndex, x);
      if (cur === meta.ti) return 'select ok ' + x + ' ' + y;
    }
    return 'select FAIL ' + x;
  }
  if (op === 'pwclick') { const p = await bodyText(); let ok = true; try { await page.locator(x).first().click({ force: true, timeout: 6000 }); } catch { ok = false; } await waitChange(p, y || 10000); await pause(500); return 'pwclick ' + x + ' ' + ok; }
  if (op === 'click') { const p = await bodyText(); const ok = await realClickSel(x); await waitChange(p, y || 6000); return 'click ' + x + ' ' + ok; }
  if (op === 'clickText') {
    const box = await page.evaluate(t => {
      const T = t.toLowerCase().replace(/\s+/g,' ');
      const els = [...document.querySelectorAll('a,button,img,input[type=button],input[type=submit],td,span,div,li')].filter(e => e.offsetParent || e.tagName === 'IMG');
      const txt = e => ((e.innerText || '') + ' ' + (e.getAttribute('alt') || '') + ' ' + (e.getAttribute('title') || '') + ' ' + (e.value || '')).replace(/\s+/g,' ').toLowerCase();
      const m = els.filter(e => txt(e).includes(T)).sort((a, b) => (a.innerText || '').length - (b.innerText || '').length)[0];
      if (!m) return null; m.scrollIntoView({ block: 'center' }); const r = m.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, x);
    if (!box) return 'clickText NOTFOUND ' + x;
    const p = await bodyText(); await realClickBox(box); await waitChange(p, y || 8000); return 'clickText ' + x;
  }
  if (op === 'next' || op === 'back') {
    const p = await bodyText();
    await page.evaluate(() => { document.activeElement?.blur?.(); }).catch(() => {});
    const sel = op === 'next' ? 'a.navbtnright img, a.navbtnright, [id="1"]' : 'a.navbtnleft img, a.navbtnleft, [id="2"]';
    let ok = await realClickSel(sel);
    const ch = await waitChange(p, x || 15000); await pause(500);
    return op + (ok ? '' : ' NOBTN') + (ch ? ' changed' : ' NOCHANGE');
  }
  if (op === 'wait') { await pause(x); return 'wait'; }
  if (op === 'key') { await page.keyboard.press(x); await pause(400); return 'key ' + x; }
  return 'unknown ' + op;
}

const results = [];
for (const a of actions) { try { results.push(await doAction(a)); } catch (e) { results.push('ERR ' + a[0] + ': ' + e.message.slice(0, 120)); } }
await settle(1200);

const info = await page.evaluate(() => {
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const vis = e => !!(e.offsetParent || e.getClientRects().length);
  const labelOf = e => {
    if (e.id) { const l = document.querySelector(`label[for="${CSS.escape(e.id)}"]`); if (l) return clean(l.innerText); }
    const lab = e.closest('label'); if (lab) return clean(lab.innerText);
    if (e.type === 'radio' || e.type === 'checkbox') { const n = e.closest('td')?.nextElementSibling; if (n) return clean(n.innerText).slice(0, 160); return clean(e.parentElement?.innerText).slice(0, 160); }
    const prev = e.closest('td')?.previousElementSibling; if (prev && clean(prev.innerText)) return clean(prev.innerText).slice(0, 160);
    return clean(e.closest('tr')?.innerText || e.getAttribute('title') || '').slice(0, 160);
  };
  const inputs = [...document.querySelectorAll('input,select,textarea')].filter(e => e.type !== 'hidden' && vis(e)).map(e => ({
    tag: e.tagName.toLowerCase(), type: e.type || '', name: e.getAttribute('name') || '', id: e.id || '', label: labelOf(e),
    value: e.tagName === 'SELECT' ? (e.options[e.selectedIndex]?.text || '') : (e.value || ''),
    checked: (e.type === 'radio' || e.type === 'checkbox') ? e.checked : undefined,
    maxlength: e.getAttribute('maxlength') || undefined,
    options: e.tagName === 'SELECT' ? [...e.options].slice(0, 60).map(o => o.text.trim()) : undefined,
  }));
  const buttons = [...document.querySelectorAll('a,button,input[type=button]')].filter(vis).map(e => ({
    name: e.getAttribute('name') || '', id: e.id || '', cls: e.className || '', text: clean(e.innerText || e.value || ''),
    img: [...e.querySelectorAll('img')].map(i => (i.getAttribute('alt') || i.getAttribute('title') || (i.getAttribute('src') || '').split('/').pop())).join(','),
    href: (e.getAttribute('href') || '').slice(0, 100), onclick: (e.getAttribute('onclick') || '').slice(0, 100),
  })).filter(b => b.text || b.img);
  const imgs = [...document.querySelectorAll('img')].filter(vis).map(i => ({ src: (i.getAttribute('src') || '').split('/').pop(), alt: i.getAttribute('alt') || '', title: i.getAttribute('title') || '', name: i.getAttribute('name') || '' }));
  const help = buttons.filter(b => /explain|learn more|what if|help|why|more info|tell me|what's this|how do i/i.test(b.text + ' ' + b.img));
  const title = clean(document.querySelector('#title')?.innerText || document.title || '');
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,.question,.heading')].filter(vis).map(h => clean(h.innerText)).filter(Boolean).slice(0, 20);
  const leftIcon = [...document.querySelectorAll('#leftcolumn img')].map(i => (i.getAttribute('src') || '').split('/').pop());
  const metas = { screenName: document.querySelector('meta[name*="creen"]')?.content || '', bodyClass: document.body?.className || '' };
  const css = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => (l.getAttribute('href') || '').split('/').slice(-2).join('/'));
  const errors = [...document.querySelectorAll('.error,.errortext,[class*=rror],[class*=alert]')].filter(vis).map(e => clean(e.innerText)).filter(Boolean).slice(0, 10);
  const topicLinks = [...document.querySelectorAll('a[href^="tc:"], a[href^="TC:"]')].map(a => ({ text: clean(a.innerText || a.getAttribute('title') || ''), href: a.getAttribute('href'), faq: !!a.closest('#faqs') }));
  const topics = [...new Set(topicLinks.map(l => (l.href.match(/TOPICHELP=([^,]+)/i) || [])[1]).filter(Boolean))];
  return { topics, topicLinks, url: location.href, title, headings, text: clean(document.body?.innerText || ''), inputs, buttons, imgs, help, leftIcon, metas, css, errors };
});

let n = 0;
if (!nocap) {
  const st = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : { n: 0 };
  n = st.n + 1; st.n = n; writeFileSync(STATE, JSON.stringify(st));
  const base = `${ROOT}/screens/${String(n).padStart(3, '0')}-${slug}`;
  // expand inner scroll containers so the full screen content is in the image, then restore styles
  const expanded = await page.evaluate(() => { const out = []; for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 5) { out.push(el); } } window.__uxExp = out.map(el => [el, el.getAttribute('style')]); if (out.length) { window.__uxExp.push([document.body, document.body.getAttribute('style')]); document.body.style.overflow = 'visible'; } for (const el of out) { el.style.overflow = 'visible'; el.style.height = 'auto'; el.style.maxHeight = 'none'; if (getComputedStyle(el).position === 'fixed') el.style.position = 'absolute'; } return out.length; }).catch(() => 0);
  try { await page.screenshot({ path: base + '.png', fullPage: true, timeout: 15000 }); } catch (e) { results.push('SHOT ERR ' + e.message.slice(0, 80)); }
  if (expanded) { results.push('expanded ' + expanded); await page.evaluate(() => { for (const [el, st] of (window.__uxExp || [])) { if (st === null) el.removeAttribute('style'); else el.setAttribute('style', st); } }).catch(() => {}); }
  writeFileSync(base + '.json', JSON.stringify({ n, slug, capturedAt: new Date().toISOString(), actionsBefore: actions, actionResults: results, dialogs, ...info }, null, 1));
}
// compact console summary
console.log(`== ${n ? String(n).padStart(3, '0') : '(nocap)'} ${slug} :: ${results.join(' | ')}${dialogs.length ? ' DIALOGS:' + dialogs.join(';') : ''}`);
console.log('TITLE: ' + info.title + '   TOPIC: ' + info.topics.join(','));
console.log('TEXT: ' + info.text.slice(0, process.argv.includes('--full') ? 6000 : 1400));
for (const i of info.inputs) console.log(`  [${i.type || i.tag}] ${i.name}${i.id ? '#' + i.id : ''} = "${String(i.value).slice(0, 30)}"${i.checked !== undefined ? (i.checked ? ' (X)' : ' ( )') : ''} :: ${i.label.slice(0, 90)}${i.options ? ' {' + i.options.slice(0, 12).join('|') + '}' : ''}`);
console.log('BTNS: ' + info.buttons.map(b => `${b.name || b.id}:${(b.text || b.img).slice(0, 30)}`).join(' ; ').slice(0, 900));
if (info.errors.length) console.log('ERRORS: ' + info.errors.join(' / '));

process.exit(0);
