// node sweep.js slug ... : list live section headings (with section class/id) missing from the new preview page
const { chromium } = require('playwright');
const PREV = process.env.PREV || 'https://012f531e-4b6f-4cd5-b56e-f5b55bcebec7--uxe1fb9ed790--52401.remote-machine.wix-code.com/';
const norm = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
async function heads(p, url) {
  await p.goto(url, { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(8000);
  for (let k = 0; k < 2 && !(await p.evaluate(() => document.body.innerText.trim().length)); k++) { await p.reload({ waitUntil: 'load', timeout: 90000 }); await p.waitForTimeout(15000); }
  for (let y = 0; y < 16000; y += 800) { await p.mouse.wheel(0, 800); await p.waitForTimeout(150); }
  await p.waitForTimeout(1500);
  return p.evaluate(() => {
    const out = [];
    const walk = (root) => root.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) walk(el.shadowRoot);
      if (/^H[1-3]$/.test(el.tagName)) {
        const t = (el.innerText || el.textContent || '').trim();
        if (!t) return;
        const s = el.closest('section');
        const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        const vis = b.width > 2 && b.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0;
        out.push({ t, tag: el.tagName, vis, sec: s ? (s.id || '') + '|' + [...s.classList].join(' ') : '' });
      }
    });
    walk(document);
    return out;
  });
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const s of process.argv.slice(2)) {
    try {
      const live = await heads(p, 'https://www.spin-raiders.com/' + s);
      const neu = await heads(p, PREV + s);
      const txt = norm(await p.evaluate(() => { let t = document.body.innerText; const walk = (r) => r.querySelectorAll('*').forEach(el => { if (el.shadowRoot) { t += ' ' + el.shadowRoot.textContent; walk(el.shadowRoot); } }); walk(document); return t; }));
      const seen = new Set();
      const miss = live.filter(h => h.vis).filter(h => { const n = norm(h.t); if (!n || seen.has(n) || /sr-mega-column|wixui-section/.test(h.sec) || h.sec === '') { seen.add(n); return false; } seen.add(n); return !txt.includes(n); });
      console.log(`## ${s} live=${live.length} new=${neu.length} missing=${miss.length}`);
      miss.forEach(h => console.log(`   - ${h.tag} "${h.t.slice(0, 70)}" [${h.sec.slice(0, 80)}]`));
    } catch (e) { console.log(`## ${s} ERROR ${e.message.slice(0, 120)}`); }
  }
  await b.close();
})();
