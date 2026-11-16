// node scrape_run.mjs out_dir slug1 slug2 ...  — renders each live page in headless Chromium and saves scraped_<slug>.json,
// plus assets_raw_<slug>.json listing image urls (for sizes/crops) and svg icons by key
import { chromium } from 'playwright';
import fs from 'fs';
const [out, ...slugs] = process.argv.slice(2);
const fnSrc = fs.readFileSync(new URL('./scrape_fn.js', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
for (const slug of slugs) {
  try {
    await page.goto('https://www.spin-raiders.com/' + slug, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForFunction(() => document.getElementById('sr-seaside-root')?.shadowRoot?.getElementById('sr-home-approved-20260921')?.shadowRoot?.querySelector('.sr-page-intro, .chero'), null, { timeout: 60000 });
    const json = await page.evaluate(`(${fnSrc})()`);
    fs.writeFileSync(`${out}/scraped_${slug}.json`, json);
    const icons = await page.evaluate(() => {
      const R = document.getElementById('sr-seaside-root').shadowRoot.getElementById('sr-home-approved-20260921').shadowRoot;
      const o = {};
      R.querySelectorAll('.cgrid svg[data-sr-brand-icon]').forEach(s => { const c = s.cloneNode(true); const col = c.style.color; c.removeAttribute('style'); c.removeAttribute('class'); c.removeAttribute('aria-hidden'); c.removeAttribute('focusable'); let x = c.outerHTML.replace(/currentColor/g, col || '#102858'); if (!x.includes('xmlns=')) x = x.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'); o[s.dataset.srBrandIcon] = x; });
      return o;
    });
    fs.writeFileSync(`${out}/icons_${slug}.json`, JSON.stringify(icons));
    console.log('ok', slug, JSON.parse(json).blocks.map(b => b.type).join(','));
  } catch (e) { console.log('FAIL', slug, String(e).slice(0, 200)); }
}
await browser.close();
