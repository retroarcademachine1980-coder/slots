// node tiles.js <preview base url> slug ... : click every destination (.rg-grid) and category (.tc-grid) tile and print the list count after each
const { chromium } = require('playwright');
(async () => {
  const [base, ...slugs] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const count = () => p.evaluate(() => (document.body.innerText.match(/(\d+) places? found/) || [])[1] || 'none');
  for (const s of slugs) {
    try {
      await p.goto(base + s, { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(15000);
      const all = await count(); const out = [];
      for (const grid of ['.tc-grid', '.rg-grid']) {
        const labels = await p.evaluate((g) => [...document.querySelectorAll(g + ' button')].map((x) => x.innerText.trim()), grid);
        for (const l of labels) {
          await p.locator(grid + ' button', { hasText: l }).first().click(); await p.waitForTimeout(700);
          out.push(l + '=' + await count());
          if (grid === '.tc-grid') { await p.locator(grid + ' button', { hasText: l }).first().click(); await p.waitForTimeout(400); }
        }
      }
      console.log(s, 'all=' + all, out.join(', '));
    } catch (e) { console.log(s, 'ERR', e.message.slice(0, 120)); }
  }
  await b.close();
})();
