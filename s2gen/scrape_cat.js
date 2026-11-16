// Run on a live spin-raiders.com category page (built-in browser). Returns a cat_<slug>.json config for gen_cat.py.
(async () => {
  await new Promise(r => setTimeout(r, 3500));
  const R = document.getElementById('sr-seaside-root').shadowRoot.getElementById('sr-home-approved-20260921').shadowRoot;
  const media = u => { const m = String(u || '').match(/media\/([^/]+?~mv2\.[a-z]+|[0-9a-f]{6}_[0-9a-f]{32}\.[a-z]+)/i); return m ? m[1] : null; };
  const crop = u => { const m = String(u || '').match(/\/crop\/x_(\d+),y_(\d+),w_(\d+),h_(\d+)/); return m ? { x: +m[1], y: +m[2], w: +m[3], h: +m[4] } : null; };
  const bgurl = el => { const b = getComputedStyle(el).backgroundImage; const m = b.match(/url\("?(.*?)"?\)/); return m ? m[1] : ''; };
  const imgOf = el => { const i = el.querySelector('img'); const u = i ? (i.getAttribute('src') || '') : bgurl(el); return { src: u, uri: media(u), crop: crop(u), alt: i ? i.alt : (el.getAttribute('aria-label') || '') }; };
  const txt = e => (e ? e.innerText.replace(/\s+/g, ' ').trim() : '');
  const blocks = [];
  const seen = new Set();
  const all = [...R.querySelectorAll('.chero, .sr-page-intro, .cgrid, section.section, section.wrap, .cpromo, .sr-category-library')];
  for (const el of all) {
    if ([...seen].some(s => s.contains(el))) continue;
    if (el.classList.contains('chero')) {
      const im = el.querySelector('img');
      blocks.push({ type: 'hero', src: im ? im.getAttribute('src') : '', uri: media(im && im.getAttribute('src')), alt: im ? im.alt : '',
        search_text: (el.querySelector('input') || {}).placeholder || '',
        towns: [...el.querySelectorAll('a')].map(a => [txt(a), a.getAttribute('href')]) });
    } else if (el.classList.contains('sr-page-intro')) {
      blocks.push({ type: 'intro', h1: txt(el.querySelector('h1')), intro: [...el.querySelectorAll('p')].map(txt).join(' ') });
    } else if (el.classList.contains('cgrid')) {
      blocks.push({ type: 'strip', items: [...el.querySelectorAll('a')].map(a => ({ label: txt(a.querySelector('span')) || txt(a), href: a.getAttribute('href'), key: (a.querySelector('svg') || {}).dataset?.srBrandIcon || '', on: a.classList.contains('on') })) });
    } else if (el.classList.contains('cpromo')) {
      const group = [...el.parentElement.querySelectorAll('.cpromo')]; seen.add(el.parentElement);
      blocks.push({ type: 'promos', items: group.map(p => ({ ...imgOf(p), href: p.getAttribute('href') })) });
    } else if (el.classList.contains('sr-category-library')) {
      blocks.push({ type: 'more', title: txt(el.querySelector('h2')), items: [...el.querySelectorAll('a')].map(a => [txt(a), a.getAttribute('href')]) });
    } else {
      seen.add(el);
      const h2 = txt(el.querySelector('h2'));
      const outline = el.querySelector('a.outline');
      const btn = outline ? [txt(outline), outline.getAttribute('href')] : null;
      const tiles = [...el.querySelectorAll('a.tile')];
      const cards = [...el.querySelectorAll('a.card')];
      const pager = el.querySelector('input') || el.querySelectorAll('button').length > 2;
      if (tiles.length) blocks.push({ type: 'tiles', title: h2, button: btn, items: tiles.map(a => ({ label: txt(a), href: a.getAttribute('href'), ...imgOf(a) })) });
      else if (cards.length && pager) blocks.push({ type: 'all', title: h2, button: btn, sample: cards.slice(0, 3).map(a => a.getAttribute('href')) });
      else if (cards.length) blocks.push({ type: 'featured', title: h2, button: btn, items: cards.map(a => { const lines = a.innerText.split('\n').map(s => s.trim()).filter(Boolean); const h3 = txt(a.querySelector('h3')); const i = lines.indexOf(h3); return { kicker: i > 0 ? lines[0] : '', title: h3, town: lines[i + 1] || '', text: lines.slice(i + 2).filter(s => s !== '→').join(' '), href: a.getAttribute('href'), ...imgOf(a) }; }) });
      else {
        const clone = el.cloneNode(true);
        clone.querySelectorAll('a.outline, button, script, style, svg, img').forEach(x => x.remove());
        let html = '';
        clone.querySelectorAll('h2,h3,p,li').forEach(x => { if (x.tagName === 'LI') { html += '<li><p>' + x.innerHTML.trim() + '</p></li>'; } else html += '<' + x.tagName.toLowerCase() + '>' + x.innerHTML.trim() + '</' + x.tagName.toLowerCase() + '>'; });
        html = html.replace(/(<li>.*?<\/li>)+/g, m => '<ul>' + m + '</ul>');
        blocks.push({ type: 'editorial', html });
      }
    }
  }
  return JSON.stringify({ slug: location.pathname.replace(/^\/|\/$/g, ''), title: document.title, seo_title: document.title, seo_description: (document.querySelector('meta[name=description]') || {}).content || '', blocks });
})()
