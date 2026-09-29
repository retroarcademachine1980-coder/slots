/* Spin Raiders: responsive image quality and independent footer icons. */
(() => {
  'use strict';
  if (window.SR_IMAGE_QUALITY_V1) return;
  window.SR_IMAGE_QUALITY_V1 = true;
  const paths = {
    compass: '<circle cx="24" cy="24" r="17"/><path d="m24 2 4 18 18 4-18 4-4 18-4-18-18-4 18-4Z"/>',
    pin: '<path d="M24 44S9 28 9 18a15 15 0 0 1 30 0c0 10-15 26-15 26Z"/><circle cx="24" cy="18" r="5"/>',
    book: '<path d="M24 12C18 7 10 7 4 10v29c7-3 14-2 20 3 6-5 13-6 20-3V10c-6-3-14-3-20 2Zm0 0v30M10 17h8m-8 7h8m12-7h8m-8 7h8"/>',
    bulb: '<path d="M17 33c0-7-7-9-7-18a14 14 0 0 1 28 0c0 9-7 11-7 18ZM18 39h12m-10 5h8M24 7v4m-8 4 3 2"/>',
    people: '<circle cx="14" cy="9" r="5"/><circle cx="34" cy="9" r="5"/><path d="M4 31v-8a10 10 0 0 1 20 0v8M10 23v21m8-21v21m6-13v-8a10 10 0 0 1 20 0v8M30 23v21m8-21v21"/>'
  };
  const icon = name => '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
  const footer = '<a class="sr-quality-brand" href="/" aria-label="Spin Raiders home">' + icon('compass') + '<span>SPIN RAIDERS<small>PUTTING GREAT PLACES BACK ON THE MAP</small></span></a><ul class="sr-quality-values">' + [['pin','Real places'],['book','Honest guides'],['bulb','Great tips'],['people','For all ages']].map(([key,label]) => '<li>' + icon(key) + '<span>' + label + '</span></li>').join('') + '</ul><p class="sr-quality-motto">Same brilliant country.<br>More to discover.</p>';
  const css = `.footer.sr-quality-footer{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:space-between!important;flex-wrap:wrap!important;gap:32px!important;width:100%!important;min-height:190px!important;height:auto!important;aspect-ratio:auto!important;padding:40px max(24px,calc((100% - 1440px)/2))!important;background:linear-gradient(115deg,#07374b,#092b47)!important;color:white!important;font-family:Arial,sans-serif!important;overflow:visible!important}.sr-quality-brand{display:flex!important;align-items:center!important;gap:16px!important;color:white!important;text-decoration:none!important;position:static!important;min-width:0}.sr-quality-brand>svg{width:62px!important;height:62px!important;flex:none;color:#00cbe8}.sr-quality-brand>span{font-size:clamp(22px,2vw,34px)!important;font-weight:800!important;line-height:1.1!important}.sr-quality-brand small{display:block!important;color:#00cbe8!important;font-size:10px!important;letter-spacing:1.6px!important;margin-top:10px!important;line-height:1.5!important}.sr-quality-values{display:grid!important;grid-template-columns:repeat(4,minmax(85px,1fr))!important;gap:24px!important;list-style:none!important;padding:0!important;margin:0!important}.sr-quality-values li{display:flex!important;flex-direction:column!important;align-items:center!important;gap:12px!important;text-align:center!important;white-space:nowrap!important;font-size:14px!important;line-height:1.3!important}.sr-quality-values svg{display:block!important;width:40px!important;height:40px!important;flex:none}.sr-quality-motto{font-size:18px!important;line-height:1.55!important;margin:0!important;color:white!important}@media(max-width:900px){.footer.sr-quality-footer{justify-content:center!important;text-align:center!important;padding:28px 20px!important;gap:28px!important}.sr-quality-brand{justify-content:center!important}.sr-quality-values{width:100%!important;gap:14px!important}.sr-quality-motto{width:100%!important}}@media(max-width:390px){.sr-quality-values{grid-template-columns:repeat(2,1fr)!important;gap:24px!important}.sr-quality-brand small{font-size:8px!important;letter-spacing:1px!important}}`;
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
  function scan() {
    register(document);
    for (const root of roots) {
      if (root.host && !root.host.isConnected) { roots.delete(root); continue; }
      for (const host of root.querySelectorAll('*')) if (host.shadowRoot) register(host.shadowRoot);
      const owned = root.host && /^sr-|^raidertube/.test(root.host.id);
      if (!owned) continue;
      if (!root.querySelector('#sr-image-quality-style')) {
        const style = document.createElement('style');
        style.id = 'sr-image-quality-style'; style.textContent = css; root.append(style);
      }
      for (const el of root.querySelectorAll('.footer')) {
        if (!el.classList.contains('sr-quality-footer')) {
          el.classList.add('sr-quality-footer'); el.removeAttribute('style'); el.innerHTML = footer;
        }
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
        if (!width || el.classList.contains('sr-quality-footer')) continue;
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
