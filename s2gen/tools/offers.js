// node offers.js <out_dir> slug : read the live casino offers page (featured cards, why/responsible, all offers) into offers_<slug>.json
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [out, slug] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('https://www.spin-raiders.com/' + slug, { waitUntil: 'load', timeout: 90000 });
  await p.waitForTimeout(12000);
  for (let y = 0; y < 9000; y += 700) { await p.mouse.wheel(0, 700); await p.waitForTimeout(200); }
  const d = await p.evaluate(() => {
    let R = null;
    const walk = (root) => root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) { if (!R && el.shadowRoot.querySelector('section.ch')) R = el.shadowRoot; walk(el.shadowRoot); } });
    walk(document); R = R || document;
    const t = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    const a = (el) => (el ? { text: t(el), href: el.getAttribute('href'), rel: el.getAttribute('rel') || '' } : null);
    const hero = R.querySelector('section.ch img');
    const secs = [...R.querySelectorAll('section.section.wrap')];
    const feat = secs.find(s => s.querySelector('.ocs'));
    const all = R.querySelector('section#all');
    return {
      hero: hero ? { src: hero.getAttribute('src'), alt: hero.getAttribute('alt'), w: +hero.getAttribute('width'), h: +hero.getAttribute('height') } : null,
      h1: t(R.querySelector('section.ch h1')),
      featTitle: feat ? t(feat.querySelector('h2')) : '', featText: feat ? t(feat.querySelector('.heading p')) : '',
      featured: feat ? [...feat.querySelectorAll('article.oc')].map(o => ({ badge: t(o.querySelector('.badge')), logo: (o.querySelector('.ol img') || {}).getAttribute?.('src'), alt: (o.querySelector('.ol img') || {}).getAttribute?.('alt'), title: t(o.querySelector('h3')), go: a(o.querySelector('a.button')), small: t(o.querySelector('small')), review: a(o.querySelector('a.rv')) })) : [],
      why: [...R.querySelectorAll('.why .wg span')].map(t), whyTitle: t(R.querySelector('.why h2')),
      resp: { title: t(R.querySelector('.resp h2')), text: t(R.querySelector('.resp p')), links: [...R.querySelectorAll('.resp a')].map(a) },
      allTitle: all ? t(all.querySelector('h2')) : '', allText: all ? t(all.querySelector('.heading p')) : '',
      offers: all ? [...all.querySelectorAll('article.or')].map(o => ({ logo: (o.querySelector('.ol img') || {}).getAttribute?.('src'), alt: (o.querySelector('.ol img') || {}).getAttribute?.('alt'), name: t(o.querySelector('h3')), offer: t(o.querySelector('.od > p')), bullets: [...o.querySelectorAll('.od li')].map(t), terms: t(o.querySelector('details p')), score: t(o.querySelector('.os b')), go: a(o.querySelector('.oa a.button')), review: a(o.querySelector('.oa a:not(.button)')), checked: t(o.querySelector('.oa small')) })) : [],
    };
  });
  fs.writeFileSync(`${out}/offers_${slug}.json`, JSON.stringify(d));
  console.log('ok', slug, d.featured.length, d.offers.length, d.offers.map(o => o.name + ' ' + (o.review && o.review.href)).join(' | '));
  await b.close();
})();
