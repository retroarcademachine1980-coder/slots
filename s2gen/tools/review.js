// node review.js <out_dir> slug ... : read the live casino review layout (.cr-wrap) into review_<slug>.json
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [out, ...slugs] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const s of slugs) {
    await p.goto('https://www.spin-raiders.com/' + s, { waitUntil: 'load', timeout: 90000 });
    await p.waitForTimeout(10000);
    const d = await p.evaluate(() => {
      let w = null;
      const walk = (root) => root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) { const x = el.shadowRoot.querySelector('.cr-wrap'); if (x && !w) w = x; walk(el.shadowRoot); } });
      walk(document); if (!w) w = document.querySelector('.cr-wrap');
      if (!w) return null;
      const clean = (el) => { if (!el) return ''; const c = el.cloneNode(true); c.querySelectorAll('style,script,svg,img').forEach(x => x.remove()); return c.innerHTML.replace(/\s(class|style|data-[a-z-]+|aria-[a-z-]+)="[^"]*"/g, '').replace(/\s+/g, ' ').trim(); };
      const back = w.querySelector('.cr-back'); const logo = w.querySelector('.cr-logo');
      const grid = w.querySelector('.cr-grid');
      return {
        back: back ? [back.textContent.trim(), back.getAttribute('href')] : null,
        logo: logo ? { src: logo.getAttribute('src'), alt: logo.getAttribute('alt') || '' } : null,
        pills: [...w.querySelectorAll('.cr-meta .cr-pill')].map(x => x.textContent.trim()),
        h1: (w.querySelector('h1') || {}).textContent || '',
        offer: (w.querySelector('.cr-offer') || {}).textContent || '',
        buttons: [...w.querySelectorAll('.cr-actions a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href'), rel: a.getAttribute('rel') || '', red: a.classList.contains('red') })),
        main: grid ? clean(grid.querySelector('section')) : '',
        aside: grid ? clean(grid.querySelector('aside')) : '',
        cards: [...w.querySelectorAll(':scope > .cr-card')].map(clean),
        note: clean(w.querySelector('.cr-note')),
      };
    });
    if (d) { fs.writeFileSync(`${out}/review_${s}.json`, JSON.stringify(d)); console.log('ok', s, d.h1, d.buttons.length, d.cards.length); } else console.log('none', s);
  }
  await b.close();
})();
