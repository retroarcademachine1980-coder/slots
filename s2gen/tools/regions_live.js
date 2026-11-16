// node regions_live.js slug ... : click each live "Explore by destination" tile and print the places the live list then shows
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const s of process.argv.slice(2)) {
    try {
      await p.goto('https://www.spin-raiders.com/' + s, { waitUntil: 'load', timeout: 90000 });
      await p.waitForTimeout(9000);
      for (let y = 0; y < 9000; y += 700) { await p.mouse.wheel(0, 700); await p.waitForTimeout(150); }
      const towns = await p.evaluate(() => { const o = []; const walk = (r) => r.querySelectorAll('*').forEach(el => { if (el.shadowRoot) walk(el.shadowRoot); if (el.matches && el.matches('section.regions [data-region]')) o.push(el.getAttribute('data-region')); }); walk(document); return o; });
      const out = [];
      for (const t of towns) {
        await p.evaluate((t) => { let hit = null; const walk = (r) => r.querySelectorAll('*').forEach(el => { if (el.shadowRoot) walk(el.shadowRoot); if (!hit && el.getAttribute && el.getAttribute('data-region') === t) hit = el; }); walk(document); if (hit) hit.click(); }, t);
        await p.waitForTimeout(1500);
        const r = await p.evaluate(() => {
          const txt = []; const walk = (r) => r.querySelectorAll('*').forEach(el => { if (el.shadowRoot) walk(el.shadowRoot); }); walk(document);
          const all = (root, acc) => { root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) all(el.shadowRoot, acc); if (/found|result|showing/i.test(el.childNodes.length === 1 && el.textContent || '') && el.textContent.length < 60) acc.push(el.textContent.trim()); }); return acc; };
          return all(document, []).slice(0, 3);
        });
        out.push(t + ' => ' + r.join(' / '));
      }
      console.log('## ' + s); out.forEach(x => console.log('   ' + x));
    } catch (e) { console.log('## ' + s + ' ERR ' + e.message.slice(0, 100)); }
  }
  await b.close();
})();
