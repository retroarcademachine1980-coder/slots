/* Spin Raiders — "All arcades" browsable list on /arcade (2026-10-07).
   Family and seaside arcades, including ones with a separate 18+ area, so they appear
   in the arcade section as well as on the AGC page. 9 cards per page. */
(function () {
  if (window.__srArcadeAll) return; window.__srArcadeAll = 1;
  var PER = 9, tries = 0;
  var INCLUDE = /arcade|amusement|family|fec|pier|bowl|retro|pinball|video|free.?play/i;
  var PURE_AGC = /^\s*(adult gaming centre|adult arcade)\b(?![\s\S]*(amusement|family|pier|retro|classic amusements))/i;
  var ADULT_AREA = /adult|18\+|casino|slots area/i;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function root() {
    var a = document.getElementById('sr-seaside-root'); a = a && a.shadowRoot;
    var b = a && a.getElementById('sr-home-approved-20260921'); return b && b.shadowRoot;
  }
  function title(e) { return e.displayTitle || e.title || e.name || ''; }
  function town(e) { return e.locationName || e.destination || e.town || ''; }
  function photo(e) {
    var S = window.SR_PUBLIC_DIRECTORY.S;
    var t = S.safePhoto && S.safePhoto(Object.assign({}, e, { heroImage: e.heroImage || e.image }));
    return t ? S.fit(S.img(t), 640) : '';
  }
  function kind(e) {
    var v = String(e.venueType || '');
    if (/pier/i.test(v)) return 'Pier arcade';
    if (/bowl/i.test(v)) return 'Bowling & arcade';
    if (/retro|pinball|video|free.?play|bar|pub/i.test(v)) return 'Retro & arcade bars';
    return 'Family arcade';
  }
  function card(e, i) {
    var img = photo(e), adult = ADULT_AREA.test(String(e.venueType || ''));
    var badge = adult ? 'FAMILY + 18+ AREA' : kind(e).toUpperCase();
    return '<a class="card" href="' + esc(window.SR_PLACE_HREF(e)) + '">' +
      (img ? '<img src="' + esc(img) + '" alt="' + esc(e.exteriorImageAlt || e.imageAltText || e.imageAlt || title(e)) + '" loading="lazy">' : '<span class="sr-aa-nophoto">Photo being added</span>') +
      '<span class="badge b' + (i % 4) + '">' + esc(badge) + '</span><div class="card-copy"><h3>' + esc(title(e)) + '</h3><p>' + esc(town(e)) + '</p></div><span class="arrow" aria-hidden="true">→</span></a>';
  }
  var CSS = '.sr-aa .sr-aa-tools{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px}' +
    '.sr-aa .sr-aa-tools input,.sr-aa .sr-aa-tools select{font:inherit;font-size:15px;padding:10px 14px;border:1px solid #cfd6e4;border-radius:999px;background:#fff;color:inherit;min-width:0}' +
    '.sr-aa .sr-aa-tools input{flex:1 1 220px}.sr-aa .sr-aa-tools select{flex:0 1 220px}' +
    '.sr-aa .sr-aa-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:18px}' +
    '.sr-aa .sr-aa-grid .card{min-width:0}' +
    '.sr-aa .sr-aa-nophoto{display:flex;align-items:center;justify-content:center;position:absolute;inset:0;background:#eef2f8;color:#5a6680;font-size:14px}' +
    '.sr-aa .sr-aa-pages{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:22px 0 0}' +
    '.sr-aa .sr-aa-pages button{font:inherit;min-width:40px;padding:8px 12px;border-radius:999px;border:1px solid #cfd6e4;background:#fff;cursor:pointer;color:inherit}' +
    '.sr-aa .sr-aa-pages button[aria-current="page"]{background:#001b41;color:#fff;border-color:#001b41}' +
    '.sr-aa .sr-aa-count{margin:0 0 12px;opacity:.8}' +
    '@media(max-width:900px){.sr-aa .sr-aa-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}' +
    '@media(max-width:560px){.sr-aa .sr-aa-grid{grid-template-columns:1fr!important}}';
  function render(sr, rows) {
    if (sr.getElementById('sr-arcade-all')) return;
    var anchor = sr.querySelector('section.sr-hub-guide') || sr.querySelector('main .wrap .cpromos');
    if (!anchor) return;
    if (anchor.classList.contains('cpromos')) anchor = anchor.parentNode;
    var towns = Array.from(new Set(rows.map(town).filter(Boolean))).sort();
    var sec = document.createElement('section');
    sec.className = 'section wrap sr-aa'; sec.id = 'sr-arcade-all';
    sec.innerHTML = '<style>' + CSS + '</style><div class="heading"><div><h2>All arcades</h2><p>Family and seaside arcades across the UK – including the ones with a separate 18+ adult gaming area, which you’ll also find on our AGC page.</p></div><a class="outline" href="/agc">AGC venues →</a></div>' +
      '<div class="sr-aa-tools"><input type="search" placeholder="Search an arcade or town…" aria-label="Search arcades"><select data-t aria-label="Choose a town"><option value="">All locations</option>' + towns.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select>' +
      '<select data-k aria-label="Arcade type"><option value="">All arcade types</option><option>Family arcade</option><option value="adult">Family + 18+ area</option><option>Pier arcade</option><option>Bowling &amp; arcade</option><option>Retro &amp; arcade bars</option></select></div>' +
      '<p class="sr-aa-count" role="status"></p><div class="highlights sr-aa-grid"></div><nav class="sr-aa-pages" aria-label="Arcade pages"></nav>';
    anchor.parentNode.insertBefore(sec, anchor);
    var q = sec.querySelector('input'), st = sec.querySelector('[data-t]'), sk = sec.querySelector('[data-k]'),
      grid = sec.querySelector('.sr-aa-grid'), pages = sec.querySelector('.sr-aa-pages'), count = sec.querySelector('.sr-aa-count'), page = 1;
    function list() {
      var s = q.value.trim().toLowerCase(), t = st.value, k = sk.value;
      return rows.filter(function (e) {
        if (t && town(e) !== t) return false;
        if (k === 'adult' && !ADULT_AREA.test(String(e.venueType || ''))) return false;
        if (k && k !== 'adult' && kind(e) !== k) return false;
        if (s && (title(e) + ' ' + town(e) + ' ' + (e.venueType || '') + ' ' + (e.region || '')).toLowerCase().indexOf(s) < 0) return false;
        return true;
      });
    }
    function draw(scroll) {
      var l = list(), n = Math.max(1, Math.ceil(l.length / PER));
      if (page > n) page = n;
      count.textContent = l.length + (l.length === 1 ? ' arcade' : ' arcades') + ' found';
      grid.innerHTML = l.slice((page - 1) * PER, page * PER).map(card).join('') || '<p>No arcades match – try another town or clear the search.</p>';
      var h = '';
      if (n > 1) {
        if (page > 1) h += '<button data-p="' + (page - 1) + '">← Prev</button>';
        for (var i = Math.max(1, page - 2); i <= Math.min(n, page + 2); i++) h += '<button data-p="' + i + '"' + (i === page ? ' aria-current="page"' : '') + '>' + i + '</button>';
        if (page < n) h += '<button data-p="' + (page + 1) + '">Next →</button>';
      }
      pages.innerHTML = h;
      if (scroll) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    pages.addEventListener('click', function (ev) { var b = ev.target.closest('button[data-p]'); if (b) { page = +b.dataset.p; draw(true); } });
    q.addEventListener('input', function () { page = 1; draw(); });
    st.addEventListener('change', function () { page = 1; draw(); });
    sk.addEventListener('change', function () { page = 1; draw(); });
    draw();
    // Swap any featured card whose guide is unavailable for a live arcade with a photo.
    var feat = sr.querySelector('.highlights:not(.sr-aa-grid)');
    if (feat) {
      var used = Array.from(feat.querySelectorAll('a.card')).map(function (a) { return a.getAttribute('href'); });
      var spare = rows.filter(function (e) { return photo(e) && used.indexOf(window.SR_PLACE_HREF(e)) < 0 && /amusement|arcade/i.test(String(e.venueType || '')) && !/bowl|bar|pub|retro|pinball|video/i.test(String(e.venueType || '')); });
      feat.querySelectorAll('article.card[data-route-unavailable]').forEach(function (a, i) {
        var e = spare[i * 7 % Math.max(1, spare.length)]; if (!e) { a.remove(); return; }
        var w = document.createElement('div'); w.innerHTML = card(e, 2); a.replaceWith(w.firstChild);
      });
    }
  }
  function go() {
    var path = location.pathname.replace(/\/+$/, '');
    if (path !== '/arcade') return;
    var D = window.SR_PUBLIC_DIRECTORY && window.SR_PUBLIC_DIRECTORY.D, U = window.SR_ROUTE_UI, sr = root();
    if (!D || !U || !window.SR_PLACE_HREF || !sr || !sr.querySelector('main section.sr-hub-guide, main .cpromos')) { if (++tries < 300) setTimeout(go, 200); return; }
    var f = { $or: ['Amusement', 'Arcade', 'Family', 'Pier', 'Bowl', 'Retro', 'Pinball'].reduce(function (a, w) { return a.concat(['category', 'venueType', 'title', 'name'].map(function (k) { var o = {}; o[k] = { $contains: w }; return o; })); }, []) };
    Promise.resolve(D.rows('Venues', f)).then(function (rows) { return U.businessRows(rows, 'Venues'); }).then(function (rows) {
      var seen = {};
      rows = (rows || []).filter(function (e) {
        var v = String(e.venueType || '');
        if (!U.discoverable(e) || !U.ready(e) || !title(e)) return false;
        if (/airtastic|trampolin|soft play|ninja|clip ?n ?climb|jump|escape room|laser|kart/i.test(v + ' ' + title(e))) return false;
        if (!INCLUDE.test(v) || PURE_AGC.test(v) || /^(bingo|casino|service|holiday|holiday park|theme)$/i.test(v.trim())) return false;
        var k = U.key(e); if (seen[k]) return false; seen[k] = 1; return true;
      }).sort(function (a, b) { return (photo(b) ? 1 : 0) - (photo(a) ? 1 : 0) || title(a).localeCompare(title(b)); });
      if (rows.length) render(sr, rows);
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  var last = location.pathname;
  setInterval(function () { if (location.pathname !== last) { last = location.pathname; tries = 0; go(); } }, 800);
})();
