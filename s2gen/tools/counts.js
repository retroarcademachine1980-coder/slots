// node counts.js slug ... : the list total ("N places found") on live and on the new preview
const { chromium } = require('playwright');
const PREV = process.env.PREV || 'https://012f531e-4b6f-4cd5-b56e-f5b55bcebec7--uxe1fb9ed790--52401.remote-machine.wix-code.com/';
async function found(p, url) {
  await p.goto(url, { waitUntil: 'load', timeout: 90000 });
  for (let k = 0; k < 30; k++) {
    await p.waitForTimeout(1000);
    const t = await p.evaluate(() => { let o = ''; const all = (root) => root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) all(el.shadowRoot); if (!o && el.childNodes.length === 1 && /^\s*\d+\s+(places?|venues?|results?)\s+found/i.test(el.textContent || '')) o = el.textContent.trim(); }); all(document); return o; });
    if (t) return t;
  }
  return 'none';
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const s of process.argv.slice(2)) {
    try { console.log(s, 'live:', await found(p, 'https://www.spin-raiders.com/' + s), '| new:', await found(p, PREV + s)); }
    catch (e) { console.log(s, 'ERR', e.message.slice(0, 100)); }
  }
  await b.close();
})();
