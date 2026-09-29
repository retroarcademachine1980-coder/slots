/* Spin Raiders: responsive image quality; original artwork and brush lettering for town signs. */
(() => {
  'use strict';
  if (window.SR_IMAGE_QUALITY_V1) return;
  window.SR_IMAGE_QUALITY_V1 = true;
  const roots = new Set();
  const sources = new WeakMap();
  const backgrounds = new WeakMap();
  let pending = false;
  function improve(url, displayWidth) {
    if (!url || !url.includes('static.wixstatic.com/media/') || !url.includes('/v1/')) return url;
    return url.replace(/\/(fit|fill)\/([^/]+)\//, (whole, mode, args) => {
      const w = args.match(/(?:^|,)w_(\d+)/), h = args.match(/(?:^|,)h_(\d+)/);
      if (!w || !h) return whole;
      const original = Number(w[1]);
      if (displayWidth < 100 || original < 100) return whole;
      const wanted = Math.min(3000, Math.max(original, Math.ceil(displayWidth * Math.min(devicePixelRatio || 1, 2))));
      const height = Math.round(Number(h[1]) * wanted / original);
      let next = args.replace(/w_\d+/, 'w_' + wanted).replace(/h_\d+/, 'h_' + height);
      if (/(?:^|,)q_\d+/.test(next)) next = next.replace(/q_(\d+)/, (_, q) => 'q_' + Math.max(85, Number(q)));
      else next += ',q_85';
      return '/' + mode + '/' + next + '/';
    });
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; scan(); });
  }
  function register(root) {
    if (roots.has(root)) return;
    roots.add(root);
    new MutationObserver(schedule).observe(root, {childList:true,subtree:true});
  }
  function ensureTownFont() {
    if (document.getElementById('sr-town-brush-font')) return;
    const link = document.createElement('link');
    link.id = 'sr-town-brush-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Knewave&display=swap';
    link.addEventListener('load', () => {
      if (document.fonts) document.fonts.load('400 100px Knewave').then(schedule).catch(() => {});
    }, {once:true});
    document.head.appendChild(link);
  }
  function fitTownSign(sign) {
    const width = sign.clientWidth;
    if (!width) return;
    // Measure rendered text: short and long town names stay inside the same board.
    for (const [selector, size, available] of [
      ['.town-banner-explore', .215, .86],
      ['.town-banner-town', .16, .86],
      ['.town-banner-strapline-text', .047, .91]
    ]) {
      const line = sign.querySelector(selector);
      if (!line) continue;
      line.style.fontSize = (width * size) + 'px';
      const actual = line.scrollWidth;
      if (actual > width * available) line.style.fontSize = (width * size * width * available / actual) + 'px';
    }
  }
  const townBanners = new WeakSet();
  const townRequests = new Map();
  function townBanner(root) {
    const hero = root.querySelector('.search-hero');
    const S = window.SR_SEASIDE;
    if (!hero || townBanners.has(hero) || !S?.archiveQuery) return;
    const input = root.querySelector('#search-query');
    const query = (input?.value || '').trim();
    const locationPage = root.host.id === 'sr-location-directory';
    let term = query;
    try { term = window.SR_PARSE_PLACE_SEARCH?.(query)?.query || query; } catch {}
    const route = locationPage ? decodeURIComponent(location.pathname.split('/').filter(Boolean).at(-1) || '') : '';
    const slug = (route || term).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if (!slug || new URLSearchParams(location.search).has('favourites')) return;
    const photo = hero.querySelector('img');
    if (!photo) return;
    townBanners.add(hero);
    const originalDisplay = photo.style.display;
    photo.style.display = 'none';
    if (!townRequests.has(slug)) {
      townRequests.set(slug,S.archiveQuery({
        fields:['title','slug','heroImage','heroImageAlt','imageAltText'],
        filter:{slug:{$eq:slug}},paging:{limit:1}
      },null,false,'Locations').then(result=>result.dataItems?.[0]?.data || null).catch(error=>{
        townRequests.delete(slug);
        throw error;
      }));
    }
    townRequests.get(slug).then(record=>{
      if (!hero.isConnected) return;
      if (!record && !locationPage) { photo.style.display = originalDisplay; return; }
      ensureTownFont();
      hero.classList.add('town-photo-banner');
      const style = document.createElement('style');
      style.textContent = `
.town-photo-banner{background:#103958!important;min-height:620px;height:clamp(620px,40vw,740px);max-height:none!important;aspect-ratio:auto!important}
.town-photo-banner>img{object-fit:cover;object-position:center}
.town-photo-banner:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(0deg,#00172c88,transparent 40%)}
.town-banner-sign{position:absolute;z-index:1;top:6%;left:3%;width:37%;max-width:660px;aspect-ratio:1484/1060;container-type:inline-size;box-sizing:border-box;padding:0;color:white;transform:rotate(-7deg);transform-origin:center;background:transparent url("https://static.wixstatic.com/media/3a517e_07b6f0e7586d4f8ab7d8ab67ad6ea7b1~mv2.png/v1/fit/w_1484,h_1060,q_90,enc_auto/location-sign.webp") center/contain no-repeat;border:0;box-shadow:none;filter:drop-shadow(5px 8px 12px #00152366)}
.town-banner-title{position:absolute;top:11%;left:5%;width:90%;height:45%;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2cqw;margin:0!important;padding:0!important;text-align:center;font-family:'Knewave','Permanent Marker','Arial Black',Arial,sans-serif!important;font-weight:400!important;font-style:normal!important;line-height:1!important;text-transform:uppercase;text-shadow:2px 4px 1px #001523b3;letter-spacing:0!important}
.town-banner-title .town-banner-explore,.town-banner-title .town-banner-town{display:block;flex:none;width:max-content;max-width:none;white-space:nowrap;margin:0;padding:0;overflow-wrap:normal;line-height:1!important;font-family:inherit!important;font-weight:400!important;font-style:normal!important}
.town-banner-title .town-banner-explore{color:#fff;font-size:21.5cqw}
.town-banner-title .town-banner-town{color:#ffe21b;font-size:16cqw}
.town-banner-strapline{position:absolute;top:61%;left:4.5%;width:91%;height:13%;display:flex;justify-content:center;align-items:center;background:transparent!important;color:white;text-align:center;font-family:'Roboto Condensed','Barlow Condensed',Arial,sans-serif;font-weight:700;line-height:1;text-transform:uppercase;margin:0!important;padding:0!important;transform:rotate(-3.3deg)}
.town-banner-strapline .town-banner-strapline-text{display:block;width:max-content;white-space:nowrap;font-size:4.7cqw;line-height:1.1;margin:0;padding:0}
.town-banner-description{position:absolute;left:6%;top:78%;bottom:auto;width:88%;box-sizing:border-box;font-family:Arial,sans-serif!important;font-size:3.3cqw!important;font-weight:400!important;line-height:1.2!important;letter-spacing:0!important;margin:0!important;color:#fff;text-shadow:0 1px 2px #001523}
.town-photo-banner .hero-controls{z-index:2;bottom:4%;left:18%;width:66%}
@media(max-width:1100px) and (min-width:601px){.town-banner-sign{width:52%;max-width:520px}}
@media(max-width:600px){.town-photo-banner{display:block;height:570px;min-height:570px}.town-photo-banner>img{position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto;object-fit:cover}.town-banner-sign{top:32px;left:50%;width:84%;max-width:420px;padding:0;transform:translateX(-50%) rotate(-7deg)}.town-banner-description{top:calc(100% + 20px);left:0;width:100%;font-size:16px!important;line-height:1.35!important;transform:rotate(7deg);text-shadow:0 1px 3px #001523,0 1px 8px #001523}.town-photo-banner .hero-controls{position:absolute;left:4%;bottom:18px;width:92%;margin:0}}
`;
      root.appendChild(style);
      const sign = document.createElement('div');
      sign.className = 'town-banner-sign';
      const title = document.createElement('h2');
      title.className = 'town-banner-title';
      const explore = document.createElement('span');
      explore.className = 'town-banner-explore';
      explore.textContent = 'Explore';
      const town = document.createElement('span');
      town.className = 'town-banner-town';
      town.textContent = record?.title || query || term;
      title.append(explore, document.createTextNode(' '), town);
      const strapline = document.createElement('strong');
      strapline.className = 'town-banner-strapline';
      const straplineText = document.createElement('span');
      straplineText.className = 'town-banner-strapline-text';
      straplineText.textContent = 'Amazing places. Unforgettable days.';
      strapline.appendChild(straplineText);
      const description = document.createElement('p');
      description.className = 'town-banner-description';
      description.textContent = 'Search for towns, cities or attractions and discover arcades, theme parks, places to stay, great food and more \u2013 all in one place.';
      sign.append(title,strapline,description);
      hero.appendChild(sign);
      fitTownSign(sign);
      let src = record?.heroImage;
      if (typeof src === 'object') src = src?.url || src?.src;
      if (src) {
        src = S.img ? S.img(src) : src;
        if (/^https:\/\//.test(src)) {
          const match = src.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/?]+)(?:\/v1\/.*)?$/);
          if (match) src = match[1] + '/v1/fit/w_2560,h_1440,q_85,enc_auto/town.webp';
          photo.alt = record.heroImageAlt || record.imageAltText || record.title;
          photo.onerror = () => { photo.style.display = 'none'; };
          photo.src = src;
          photo.style.display = originalDisplay;
        }
      }
    }).catch(()=>{
      townBanners.delete(hero);
      if (!locationPage) photo.style.display = originalDisplay;
    });
  }
  function scan() {
    register(document);
    for (const root of roots) {
      if (root.host && !root.host.isConnected) { roots.delete(root); continue; }
      for (const host of root.querySelectorAll('*')) if (host.shadowRoot) register(host.shadowRoot);
      const owned = root.host && /^sr-|^raidertube/.test(root.host.id);
      if (!owned) continue;
      townBanner(root);
      for (const sign of root.querySelectorAll('.town-banner-sign')) fitTownSign(sign);
      if (root.querySelector('.search-hero') && !root.querySelector('#sr-search-banner-width')) {
        const style = document.createElement('style');
        style.id = 'sr-search-banner-width';
        style.textContent = '.search-hero{width:100%;min-width:100%;box-sizing:border-box}';
        root.appendChild(style);
      }
      for (const img of root.querySelectorAll('img')) {
        const width = img.getBoundingClientRect().width;
        if (!width || img.srcset) continue;
        const previous = sources.get(img);
        const base = previous && previous.result === img.src ? previous.base : img.src;
        const result = improve(base, width);
        if (result !== img.src) { sources.set(img,{base,result}); img.src = result; }
      }
      for (const el of root.querySelectorAll('[style*="background"],.hero,.hero-sign,.hero-post,.banner,.promo')) {
        const width = el.getBoundingClientRect().width;
        if (!width) continue;
        const bg = getComputedStyle(el).backgroundImage;
        const previous = backgrounds.get(el);
        const base = previous && previous.result === bg ? previous.base : bg;
        const result = base.replace(/url\(["']?([^"')]+)["']?\)/g, (_,url) => 'url("' + improve(url,width) + '")');
        if (result !== bg) { el.style.setProperty('background-image',result,'important'); backgrounds.set(el,{base,result}); }
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  if (document.fonts) document.fonts.addEventListener('loadingdone',schedule);
  addEventListener('resize',schedule,{passive:true});
  let attempts = 0;
  const startup = setInterval(() => { schedule(); if (++attempts >= 30) clearInterval(startup); },1000);
})();
