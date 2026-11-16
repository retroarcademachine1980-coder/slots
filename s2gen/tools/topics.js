// node topics.js <out_dir> slug ... : save the live "Explore by category" tiles (topic buttons with photo)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [out, ...slugs] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const s of slugs) {
    try {
      await p.goto('https://www.spin-raiders.com/' + s, { waitUntil: 'load', timeout: 90000 });
      await p.waitForTimeout(9000);
      for (let y = 0; y < 14000; y += 700) { await p.mouse.wheel(0, 700); await p.waitForTimeout(200); }
      await p.waitForTimeout(2000);
      const r = await p.evaluate(() => {
        let sec = null;
        const walk = (root) => root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) walk(el.shadowRoot); if (!sec && el.tagName === 'SECTION' && el.classList.contains('topic-section')) sec = el; });
        walk(document);
        if (!sec) return null;
        const h = sec.querySelector('h2'); const a = sec.querySelector('.heading a'); const note = sec.querySelector(':scope > p');
        const media = (src) => { const m = (src || '').match(/static\.wixstatic\.com\/media\/([^/?#]+)/); return m ? m[1] : ''; };
        const btns = [...sec.querySelectorAll('[data-topic]')].map(x => {
          const img = x.querySelector('img');
          return { town: x.getAttribute('data-topic'), label: (x.innerText || '').trim().replace(/\s+/g, ' '), uri: media(img && (img.currentSrc || img.src)), alt: img ? img.alt : '', w: img ? img.naturalWidth : 0, h: img ? img.naturalHeight : 0 };
        });
        return { title: h ? h.innerText.trim() : 'Explore by category', map: a ? [a.innerText.trim(), a.getAttribute('href')] : null, note: note ? note.innerText.trim() : '', height: Math.round(sec.getBoundingClientRect().height), buttons: btns };
      });
      if (r) { fs.writeFileSync(`${out}/topics_${s}.json`, JSON.stringify(r, null, 1)); console.log('regions', s, r.height, r.buttons.length, r.buttons.slice(0, 4).map(x => x.town + '|' + x.label + '|' + (x.uri ? 'img' : 'noimg')).join(' ; ')); }
      else console.log('none', s);
    } catch (e) { console.log('ERR', s, e.message.slice(0, 100)); }
  }
  await b.close();
})();
