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
    function townName(slug) { return slug.split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' '); }
    function load(slug) {
      if (!cache[slug]) cache[slug] = fetch(BASE + encodeURIComponent(slug) + '.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      return cache[slug];
    }
    function build(root, path, data) {
      if (root.querySelector('.sr-more-explore')) return;
      var parts = path.split('/'), slug = parts[3];
      var wrap = root.querySelector('.wrap'); var body = wrap && wrap.querySelector('.body');
      if (!wrap || !body) return;
      var town = (root.querySelector('.hero') && (root.querySelector('.hero').textContent.match(/⌖\s*([^\n]+)/) || [])[1]) || townName(slug);
      var items = ((data && data.items) || []).filter(function (x) { return x.p !== path; });
      var cats = CATS.filter(function (c) { return c[1] !== '/' + parts[1]; });
      var html = '<style>.sr-more-explore{margin:28px 0 8px;font-family:inherit}.sr-more-explore h2{font-size:1.35rem;margin:0 0 12px;color:#0b2545}.sr-more-explore .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:22px}.sr-more-explore a.pl{display:block;background:#fff;border:1px solid #dbe4ef;border-radius:12px;padding:12px 14px;text-decoration:none;color:#0b2545}.sr-more-explore a.pl:hover{border-color:#1d6fe0}.sr-more-explore a.pl b{display:block;font-size:.98rem;line-height:1.25}.sr-more-explore a.pl span{display:block;font-size:.8rem;color:#5b6b80;margin-top:3px}.sr-more-explore .chips{display:flex;flex-wrap:wrap;gap:8px}.sr-more-explore .chips a{background:#0b2545;color:#fff;border-radius:999px;padding:8px 14px;font-size:.88rem;font-weight:600;text-decoration:none}.sr-more-explore .chips a.town{background:#facc15;color:#0b2545}</style>';
      html += '<section class="sr-more-explore" aria-label="More to explore">';
      if (items.length) {
        html += '<h2>More to explore in ' + esc(town) + '</h2><div class="grid">';
        items.slice(0, 9).forEach(function (x) { html += '<a class="pl" href="' + esc(x.p) + '"><b>' + esc(x.t) + '</b><span>' + esc(x.c) + '</span></a>'; });
        html += '</div>';
      }
      html += '<h2>Explore more days out</h2><div class="chips">';
      if (data && data.d) html += '<a class="town" href="' + esc(data.d) + '">All of ' + esc(town) + ' →</a>';
      cats.forEach(function (c) { html += '<a href="' + c[1] + '">' + esc(c[0]) + '</a>'; });
      html += '</div></section>';
      body.insertAdjacentHTML('afterend', html);
    }
    function tick() {
      var host = document.getElementById('sr-place-page');
      if (!host || !host.shadowRoot) return;
      var path = location.pathname.replace(/\/+$/, '');
      var parts = path.split('/');
      if (parts.length < 4) return;
      var root = host.shadowRoot;
      if (root.querySelector('.sr-more-explore')) return;
      if (!root.querySelector('.wrap .body')) return;
      load(parts[3]).then(function (data) { build(root, path, data); });
    }
    setInterval(tick, 700);
    tick();
  } catch (e) { console.warn('SR more-explore failed', e); }
})();
