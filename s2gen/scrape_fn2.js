(async () => {
  await new Promise(r => setTimeout(r, 2500));
  const R = document.getElementById('sr-extended-pages').shadowRoot;
  const media = u => { const m = String(u || '').match(/media\/([^/]+?~mv2\.[a-z]+)/i); return m ? m[1] : null; };
  const txt = e => (e ? e.innerText.replace(/\s+/g, ' ').trim() : '');
  const blocks = [];
  const hero = R.querySelector('section.hero');
  if (hero && hero.querySelector('img')) {
    const im = hero.querySelector('img'); const ps = [...hero.querySelectorAll('p')]; const inp = hero.querySelector('input');
    blocks.push({ type: 'hero3', src: im.src, uri: media(im.src), alt: im.alt || '', title: txt(hero.querySelector('h1')), desc: txt(hero.querySelector('.sr-first-description')) || txt(ps[0]), h2: txt(hero.querySelector('h2')), sub: txt(ps.find(p => !p.classList.contains('sr-first-description'))), badge: /18\+/.test(hero.innerText) || !!hero.querySelector('[data-sr-brand-icon=adult]'), search: inp ? inp.placeholder : '' });
  } else if (hero) {
    const bgi = getComputedStyle(hero.querySelector('.hero-image') || hero).backgroundImage;
    const m = bgi.match(/url\("?(.*?)"?\)/);
    const ps = [...hero.querySelectorAll('p')];
    blocks.push({ type: 'hero2', src: m ? m[1] : '', uri: media(m && m[1]), title: txt(hero.querySelector('h1')), desc: txt(hero.querySelector('.sr-first-description')) || txt(ps[0]), pill: txt(hero.querySelector('h2')), sub: txt(ps[ps.length - 1] === hero.querySelector('.sr-first-description') ? null : ps[ps.length - 1]) });
  }
  const ib = [...R.querySelectorAll('button')].filter(b => b.querySelector('svg[data-sr-brand-icon]') && !b.closest('aside') && !b.closest('section.topic-section'));
  if (ib.length) blocks.push({ type: 'iconbtns', items: ib.map(b => ({ label: txt(b), key: b.querySelector('svg').dataset.srBrandIcon })) });
  const cards = R.querySelectorAll('article.card');
  if (cards.length) { const h = [...R.querySelectorAll('h2')].find(x => /featured|all|places|venues|destinations/i.test(x.innerText)) || null; blocks.push({ type: 'all', title: txt(h) || 'Places to visit', button: null, sample: [...cards].slice(0, 3).map(c => c.querySelector('a')?.getAttribute('href')) }); }
  const topic = R.querySelector('section.topic-section');
  if (topic) { const items = [...topic.querySelectorAll('button, a')].filter(b => b.querySelector('img')).map(b => ({ label: txt(b.querySelector('strong')) || txt(b), href: b.getAttribute('href') || null, src: b.querySelector('img').getAttribute('src'), uri: media(b.querySelector('img').getAttribute('src')), alt: b.querySelector('img').alt, crop: null })); if (items.length) blocks.push({ type: 'tiles', title: txt(topic.querySelector('h2')), button: null, items }); }
  const trip = R.querySelector('section.trip-strip');
  if (trip) { const a = trip.querySelector('a'); blocks.push({ type: 'cta', title: txt(trip.querySelector('h2')), text: txt(trip.querySelector('p')), button: a ? [txt(a), a.getAttribute('href')] : null }); }
  for (const s of R.querySelectorAll('section.section')) {
    const clone = s.cloneNode(true); clone.querySelectorAll('button, script, style, svg, img').forEach(x => x.remove());
    let html = ''; clone.querySelectorAll('h2,h3,p,li').forEach(x => { if (x.tagName !== 'LI' && x.parentElement && x.parentElement.tagName === 'LI') return; if (x.tagName === 'LI') html += '<li><p>' + x.innerHTML.trim() + '</p></li>'; else html += '<' + x.tagName.toLowerCase() + '>' + x.innerHTML.trim() + '</' + x.tagName.toLowerCase() + '>'; });
    html = html.replace(/(<li>.*?<\/li>)+/g, m => '<ul>' + m + '</ul>');
    if (html) blocks.push({ type: 'editorial', html });
  }
  return JSON.stringify({ slug: location.pathname.replace(/^\/|\/$/g, ''), title: document.title, seo_description: (document.querySelector('meta[name=description]') || {}).content || '', blocks });
})
