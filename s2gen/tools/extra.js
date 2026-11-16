// node extra.js <out_dir> slug ... : save the HTML of live sections the block scraper skips (sr-named-discoveries)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [out, ...slugs] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const s of slugs) {
    await p.goto('https://www.spin-raiders.com/' + s, { waitUntil: 'load', timeout: 90000 });
    await p.waitForTimeout(9000);
    const html = await p.evaluate((cls) => {
      const got = [];
      const walk = (root) => root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) walk(el.shadowRoot); if (el.tagName === 'SECTION' && cls.some(c => el.classList.contains(c))) got.push(el); });
      walk(document);
      return got.map(el => { const c = el.cloneNode(true); c.querySelectorAll('style,script,svg,img,button').forEach(x => x.remove()); return c.innerHTML.replace(/<\/?(article|div|section)[^>]*>/g, ''); });
    }, (process.env.EXTRA_CLASS || 'sr-named-discoveries').split(','));
    if (html.length) { fs.writeFileSync(`${out}/extra_${s}.json`, JSON.stringify(html)); console.log('extra', s, html.map(h => h.length)); } else console.log('none', s);
  }
  await b.close();
})();
