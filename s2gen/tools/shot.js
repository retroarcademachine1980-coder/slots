// node shot.js <url> <out.png> [waitMs] : full-page screenshot at 1280 wide after scrolling to load everything
const { chromium } = require('playwright');
(async () => {
  const [url, out, wait] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  try { await p.goto(url, { waitUntil: 'load', timeout: 120000 }); } catch (e) { console.log('goto', e.message.slice(0, 80)); }
  await p.waitForTimeout(Number(wait || 9000));
  for (let y = 0; y < 9000; y += 700) { await p.mouse.wheel(0, 700); await p.waitForTimeout(250); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1500);
  await p.screenshot({ path: out, fullPage: true, type: 'png' });
  console.log('shot', out, await p.evaluate(() => document.body.scrollHeight));
  await b.close();
})();
