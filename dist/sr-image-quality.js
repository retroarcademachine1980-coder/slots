/* Spin Raiders: responsive image quality; preserve the original footer artwork. */
(() => {
  'use strict';
  if (window.SR_IMAGE_QUALITY_V1) return;
  window.SR_IMAGE_QUALITY_V1 = true;
  const roots = new Set();
  const sources = new WeakMap();
  const backgrounds = new WeakMap();
  let pending = false;
  // Keep each crop and its proportions. Request enough pixels for its display size,
  // without increasing tiny UI assets or fetching full original photos for cards.
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
    townBanners.add(hero);
    const photo = hero.querySelector('img');
    if (!photo) return;
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
      hero.classList.add('town-photo-banner');
      const style = document.createElement('style');
      style.textContent = "\n.town-photo-banner{background:#103958!important;min-height:500px;height:clamp(500px,35vw,620px);max-height:none!important;aspect-ratio:auto!important}\n.town-photo-banner>img{object-fit:cover;object-position:center}\n.town-photo-banner:after{content:\"\";position:absolute;inset:0;pointer-events:none;background:linear-gradient(0deg,#00172c88,transparent 40%)}\n.town-banner-sign{position:absolute;z-index:1;top:7%;left:2%;width:39%;max-width:660px;box-sizing:border-box;padding:20px 22px 24px;color:white;transform:rotate(-3deg);background:repeating-linear-gradient(0deg,#062b42 0,#062b42 47px,#183e4e 49px,#062436 51px);border-top:5px solid #c79b39;border-bottom:4px solid #bb8a30;box-shadow:5px 8px 15px #00152366}\n.town-banner-title{margin:0;text-align:center;font-family:'Barlow Condensed','Roboto Condensed',Arial,sans-serif;font-size:clamp(42px,5vw,86px);font-weight:900;font-style:italic;line-height:.95;text-transform:uppercase;text-shadow:2px 3px #001523}\n.town-banner-title span{display:block;color:#ffdf28;overflow-wrap:anywhere}\n.town-banner-strapline{display:block;background:#ff007d;color:white;text-align:center;font-size:clamp(16px,1.8vw,29px);font-weight:800;line-height:1.15;text-transform:uppercase;margin:16px -30px 12px;padding:9px 10px}\n.town-banner-description{font-size:clamp(15px,1.35vw,22px);line-height:1.3;margin:0!important;color:white}\n.town-photo-banner .hero-controls{z-index:2;bottom:4%;left:18%;width:66%}\n@media(max-width:950px) and (min-width:601px){.town-banner-sign{width:52%}.town-banner-title{font-size:52px}.town-banner-description{font-size:18px}}\n@media(max-width:600px){.town-photo-banner{display:block;height:570px;min-height:570px}.town-photo-banner>img{position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto;object-fit:cover}.town-banner-sign{top:28px;left:6%;width:88%;padding:20px 18px}.town-banner-title{font-size:clamp(40px,11vw,60px)}.town-banner-strapline{font-size:20px;margin-left:-22px;margin-right:-22px}.town-banner-description{font-size:18px}.town-photo-banner .hero-controls{position:absolute;left:4%;bottom:18px;width:92%;margin:0}}\n";
      root.appendChild(style);
      const sign = document.createElement('div');
      sign.className = 'town-banner-sign';
      const title = document.createElement('h2');
      title.className = 'town-banner-title';
      title.appendChild(document.createTextNode('Explore '));
      const town = document.createElement('span');
      town.textContent = record?.title || query || term;
      title.appendChild(town);
      const strapline = document.createElement('strong');
      strapline.className = 'town-banner-strapline';
      strapline.textContent = 'Amazing places. Unforgettable days.';
      const description = document.createElement('p');
      description.className = 'town-banner-description';
      description.textContent = 'Search for towns, cities or attractions and discover arcades, theme parks, places to stay, great food and more – all in one place.';
      sign.append(title,strapline,description);
      hero.appendChild(sign);
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
  addEventListener('resize',schedule,{passive:true});
  // Also discover roots attached just after their host was inserted.
  let attempts = 0;
  const startup = setInterval(() => { schedule(); if (++attempts >= 30) clearInterval(startup); },1000);
})();
