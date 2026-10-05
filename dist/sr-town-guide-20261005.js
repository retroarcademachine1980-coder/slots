/* Spin Raiders town guide panel (5 Oct 2026)
   Shows the town's written guide (Locations.overview, pageIntro, arcadeScene, visitorInfo)
   on /destination/<town> pages, above the results list. Content comes from the CMS record. */
(function () {
  'use strict';
  var m = (location.pathname || '').match(/^\/destination\/([^\/?#]+)\/?$/);
  if (!m) return;
  var slug = decodeURIComponent(m[1]).toLowerCase();
  var navPath = location.pathname;
  var ALLOWED = { H2: 1, H3: 1, P: 1, STRONG: 1, B: 1, EM: 1, I: 1, UL: 1, OL: 1, LI: 1, BR: 1, A: 1 };

  function clean(html) {
    var doc = new DOMParser().parseFromString('<div>' + String(html || '') + '</div>', 'text/html');
    var root = doc.body.firstChild;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) return;
        if (child.nodeType !== 1 || !ALLOWED[child.tagName]) {
          if (child.nodeType === 1 && !/^(SCRIPT|STYLE|IFRAME|OBJECT|IMG)$/.test(child.tagName)) {
            walk(child);
            while (child.firstChild) node.insertBefore(child.firstChild, child);
          }
          node.removeChild(child);
          return;
        }
        Array.prototype.slice.call(child.attributes).forEach(function (a) {
          var keep = child.tagName === 'A' && a.name === 'href' && /^\/(?!\/)/.test(a.value);
          if (!keep) child.removeAttribute(a.name);
        });
        if (child.tagName === 'A' && !child.getAttribute('href')) {
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          node.removeChild(child);
          return;
        }
        walk(child);
      });
    })(root);
    return root.innerHTML;
  }
  function text(v) { return String(v == null ? '' : v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function esc(v) { return text(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var CSS = '.sr-town-guide{margin:22px 0 26px;background:#fff;border:1px solid #d9e5ef;border-radius:16px;box-shadow:0 4px 18px #0b192c10;padding:clamp(18px,3vw,36px);font:500 16.5px/1.7 Inter,Arial,sans-serif;color:#243b55}' +
    '.sr-town-guide .kicker{display:inline-block;font:900 13px/1 "Roboto Condensed",Arial;letter-spacing:.16em;color:#1f63c6;margin-bottom:10px;text-transform:uppercase}' +
    '.sr-town-guide .intro{font:600 clamp(17px,1.4vw,20px)/1.6 Inter,Arial;color:#0b1f3a;margin:0 0 6px}' +
    '.sr-town-guide .body h2{margin:26px 0 8px;font:900 clamp(22px,2.1vw,30px)/1.1 "Roboto Condensed",Arial;color:#0b1f3a}' +
    '.sr-town-guide .body h3{margin:20px 0 6px;font:800 21px/1.15 "Roboto Condensed",Arial;color:#0b1f3a}' +
    '.sr-town-guide .body p{margin:0 0 14px}.sr-town-guide .body a{color:#1f63c6;text-decoration:underline}' +
    '.sr-town-guide .body ul{margin:0 0 14px;padding-left:22px}' +
    '.sr-town-guide .wrapbox{position:relative}.sr-town-guide.closed .wrapbox{max-height:520px;overflow:hidden}' +
    '.sr-town-guide.closed .wrapbox:after{content:"";position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(#fff0,#fff)}' +
    '.sr-town-guide .more{margin-top:14px;border:0;border-radius:999px;background:#1f63c6;color:#fff;padding:11px 22px;font:800 16px "Roboto Condensed",Arial;cursor:pointer}' +
    '.sr-town-guide .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:22px}' +
    '.sr-town-guide .fact{background:#f4f8fc;border:1px solid #dce7f2;border-radius:12px;padding:16px 18px}' +
    '.sr-town-guide .fact h3{margin:0 0 6px;font:900 19px "Roboto Condensed",Arial;color:#0b1f3a}.sr-town-guide .fact p{margin:0;font-size:15px;line-height:1.6}' +
    '@media(max-width:760px){.sr-town-guide{margin:16px 0;border-radius:12px}.sr-town-guide.closed .wrapbox{max-height:420px}}';

  function build(rec) {
    var overview = clean(rec.overview || '');
    var intro = text(rec.pageIntro || rec.raiderDestinationSummary || '');
    if (text(overview).split(' ').length < 60 && !intro) return null;
    var facts = '';
    if (text(rec.arcadeScene).length > 40) facts += '<div class="fact"><h3>The arcade scene</h3><p>' + esc(rec.arcadeScene) + '</p></div>';
    if (text(rec.visitorInfo).length > 40) facts += '<div class="fact"><h3>Getting around</h3><p>' + esc(rec.visitorInfo) + '</p></div>';
    var el = document.createElement('section');
    el.className = 'sr-town-guide closed';
    el.setAttribute('aria-label', 'About ' + text(rec.title));
    el.innerHTML = '<style>' + CSS + '</style>' +
      '<span class="kicker">' + esc(rec.heroKicker || ('Your guide to ' + text(rec.title))) + '</span>' +
      (intro ? '<p class="intro">' + esc(intro) + '</p>' : '') +
      '<div class="wrapbox"><div class="body">' + overview + '</div>' + (facts ? '<div class="facts">' + facts + '</div>' : '') + '</div>' +
      '<button class="more" type="button" aria-expanded="false">Read the full ' + esc(rec.title) + ' guide ↓</button>';
    var btn = el.querySelector('.more');
    btn.addEventListener('click', function () {
      var open = el.classList.toggle('closed') === false;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Show less ↑' : 'Read the full ' + text(rec.title) + ' guide ↓';
    });
    if (text(overview).split(' ').length < 160) { el.classList.remove('closed'); btn.remove(); }
    return el;
  }

  var record = null, asked = false, tries = 0, built = null, attempts = 0;
  function host() {
    var d = document.getElementById('sr-location-directory');
    var r = d && (d.shadowRoot || d);
    return r && r.querySelector('.results-heading') ? r : null;
  }
  function tick() {
    if (location.pathname !== navPath) return clearInterval(timer);
    if (++tries > 900) return clearInterval(timer);
    var S = window.SR_SEASIDE;
    if (!asked && S && typeof S.archiveQuery === 'function') {
      asked = true;
      attempts++;
      S.archiveQuery({
        fields: ['title', 'slug', 'overview', 'pageIntro', 'heroKicker', 'arcadeScene', 'visitorInfo', 'raiderDestinationSummary'],
        filter: { slug: { $eq: slug } },
        paging: { limit: 1, offset: 0 }
      }, null, false, 'Locations').then(function (q) {
        var d = (q && q.dataItems || [])[0];
        record = d ? d.data : false;
      }, function () {
        /* archive timed out or failed: try again a few times before giving up */
        if (attempts < 5) setTimeout(function () { asked = false; }, 1500 * attempts);
        else record = false;
      });
    }
    if (record === false) return clearInterval(timer);
    var r = host();
    if (!record || !r) return;
    if (r.querySelector('.sr-town-guide')) return;
    built = built || build(record);
    if (!built) return clearInterval(timer);
    r.querySelector('.results-heading').before(built);
  }
  var timer = setInterval(tick, 100);
})();
