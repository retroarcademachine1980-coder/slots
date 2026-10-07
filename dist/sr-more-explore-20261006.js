/* Spin Raiders: "More to explore" block for attraction-style place pages (2026-10-06).
   Adds links to other places in the same town plus category links under the main text.
   Read-only: changes no CMS data, pictures or affiliate content. */
(function () {
  try {
    if (window.__srMoreExplore) return;
    window.__srMoreExplore = true;
    var me = document.currentScript && document.currentScript.src;
    var BASE = me ? me.replace(/sr-more-explore-[^\/]*$/, 'explore/') : null;
    if (!BASE) return;
    var CATS = [
      ['Arcades', '/arcade'], ['Theme parks', '/theme-parks'], ['Zoos & wildlife', '/zoos'],
      ['Aquariums', '/sea-life'], ['Museums', '/museums'], ['Historic sites', '/historical-sites'],
      ['Nature & outdoors', '/outdoors'], ['Beaches', '/beaches'], ['Piers', '/piers'],
      ['Bowling', '/bowling'], ['Cinemas', '/cinemas'], ['Tours', '/tours'],
      ['Places to stay', '/places-to-stay'], ['Food & drink', '/food-and-drink'], ['Plan a trip', '/plan-a-trip']
    ];
    var cache = {};
    function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function townName(slug) { return String(slug || '').split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' '); }
    function load(slug) {
      if (!cache[slug]) cache[slug] = fetch(BASE + encodeURIComponent(slug) + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      return cache[slug];
    }
    function build(root, path, data, anchor, where, slug) {
      if (root.querySelector('.sr-more-explore')) return;
      var parts = path.split('/');
      var body = anchor;
      if (!body) return;
      var town = (data && data.d) ? townName(data.d.split('/').pop()) : townName(slug);
      var items = ((data && data.items) || []).filter(function (x) { return x.p !== path; });
      var cats = CATS.filter(function (c) { return c[1] !== '/' + parts[1]; });
      var html = '<style>.sr-more-explore{margin:28px 0 8px;font-family:inherit}.sr-more-explore h2{font-size:1.35rem;margin:0 0 12px;color:#0b2545}.sr-more-explore .sr-me-grid{grid-auto-rows:auto!important;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:22px;align-items:start;align-content:start}.sr-more-explore a.pl{display:block;background:#fff;border:1px solid #dbe4ef;border-radius:12px;padding:12px 14px;text-decoration:none;color:#0b2545;height:auto!important;min-height:0!important}.sr-more-explore a.pl:hover{border-color:#1d6fe0}.sr-more-explore a.pl b{display:block;font-size:.98rem;line-height:1.25}.sr-more-explore a.pl span{display:block;font-size:.8rem;color:#5b6b80;margin-top:3px}.sr-more-explore .sr-me-chips{display:flex;flex-wrap:wrap;gap:8px}.sr-more-explore .sr-me-chips a{background:#0b2545;color:#fff;border-radius:999px;padding:8px 14px;font-size:.88rem;font-weight:600;text-decoration:none}.sr-more-explore .sr-me-chips a.town{background:#facc15;color:#0b2545}</style>';
      html += '<section class="sr-more-explore" aria-label="More to explore">';
      if (items.length) {
        html += '<h2>More to explore in ' + esc(town) + '</h2><div class="sr-me-grid">';
        items.slice(0, 9).forEach(function (x) { html += '<a class="pl" href="' + esc(x.p) + '"><b>' + esc(x.t) + '</b><span>' + esc(x.c) + '</span></a>'; });
        html += '</div>';
      }
      html += '<h2>Explore more days out</h2><div class="sr-me-chips">';
      if (data && data.d) html += '<a class="town" href="' + esc(data.d) + '">All of ' + esc(town) + ' →</a>';
      cats.forEach(function (c) { html += '<a href="' + c[1] + '">' + esc(c[0]) + '</a>'; });
      html += '</div></section>';
      body.insertAdjacentHTML(where || 'afterend', html);
    }
    function firstOk(slugs) {
      var i = 0;
      function next() { if (i >= slugs.length) return Promise.resolve(null); var sl = slugs[i++]; return load(sl).then(function (d) { return d ? d : next(); }); }
      return next();
    }
    function chipsOnly(root, anchor) {
      if (root.querySelector('.sr-more-explore')) return;
      build(root, location.pathname.replace(/\/+$/, ''), null, anchor, 'afterend', '');
    }
    function tick() {
      var path = location.pathname.replace(/\/+$/, '');
      var parts = path.split('/');
      var host, root, anchor;
      if ((host = document.getElementById('sr-place-page')) && host.shadowRoot) {
        root = host.shadowRoot; if (parts.length < 4 || root.querySelector('.sr-more-explore')) return;
        anchor = root.querySelector('.wrap .body'); if (!anchor) return;
        load(parts[3]).then(function (data) { build(root, path, data, anchor, 'afterend'); });
        return;
      }
      if ((host = document.getElementById('sr-shell-page')) && host.shadowRoot) {
        root = host.shadowRoot; if (parts.length !== 4 || root.querySelector('.sr-more-explore')) return;
        var main = root.querySelector('main.wrap'); if (!main || !root.querySelector('section.about')) return;
        var src = root.querySelector('.sr-source-records');
        var tgt = src && src.parentElement && src.parentElement.parentElement === main ? src.parentElement : null;
        load(parts[3]).then(function (data) { if (tgt) build(root, path, data, tgt, 'beforebegin'); else build(root, path, data, main, 'beforeend'); });
        return;
      }
      if ((host = document.getElementById('sr-food-page')) && host.shadowRoot) {
        root = host.shadowRoot; if (parts.length !== 3 || root.querySelector('.sr-more-explore')) return;
        var m2 = root.querySelector('.wrap main'); if (!m2) return;
        var w = parts[2].split('-'), cands = [];
        for (var k = Math.min(4, w.length - 1); k >= 1; k--) cands.push(w.slice(w.length - k).join('-'));
        firstOk(cands).then(function (data) { build(root, path, data, m2, 'beforeend'); });
        return;
      }
      if (path === '/classic-fruit-machines') {
        var all = document.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var sr = all[i].shadowRoot; if (!sr) continue;
          var g = sr.querySelector('section.sr-hub-guide');
          if (g) { chipsOnly(sr, g); return; }
        }
      }
    }
    setInterval(tick, 700);
    tick();
  } catch (e) { console.warn('SR more-explore failed', e); }
})();
