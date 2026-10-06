/* Spin Raiders site fixes (6 Oct 2026)
   1. Old /arcade-venues/<name> pages are duplicates of the real venue pages: keep them out of search results.
   2. Hub pages (/arcade, /zoos, /places-to-stay ...) are real router pages. Only while a hub still answers 404
      (before the site is republished) do links to it fall back to the matching search, so nobody hits a dead end.
      As soon as the hub page loads, links go straight to it. */
(function () {
  'use strict';
  var path = (location.pathname || '/').replace(/\/+$/, '') || '/';

  if (/^\/arcade-venues\//.test(path)) {
    var m = document.querySelector('meta[name="robots"]');
    if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m); }
    m.content = 'noindex, follow';
  }

  var S = '/search?q=';
  var HUBS = {
    '/arcade': S + 'arcades', '/agc': S + 'adult%20gaming%20centres', '/arcade-bars': S + 'arcade%20bars',
    '/retro-video-games': '/retro-arcades', '/piers': S + 'piers', '/theme-parks': S + 'theme%20parks',
    '/family-fun': S + 'family%20fun', '/zoos': S + 'zoos', '/sea-life': S + 'sea%20life', '/outdoors': S + 'outdoors',
    '/tours': S + 'tours', '/hidden-gems': S + 'attractions', '/attractions': S + 'attractions', '/days-out': S + 'days%20out',
    '/places-to-stay': S + 'places%20to%20stay', '/holiday-parks': S + 'holiday%20parks', '/bowling': S + 'bowling',
    '/cinemas': S + 'cinemas', '/fishing-lakes': S + 'fishing%20lakes', '/museums': S + 'museums',
    '/historical-sites': S + 'historic%20sites', '/bingo-halls': S + 'bingo', '/services': S + 'service%20stations',
    '/offers': '/casino-offers', '/plan-a-trip': '/map', '/classic-fruit-machines': '/classic-fruit-machine-archive'
  };
  /* Old addresses that never were pages: always send them to the real hub. */
  var ALIASES = { '/arcades': '/arcade', '/arcades-1': '/arcade', '/classic-fruit-machine-families': '/classic-fruit-machines',
    '/classic-fruit-machine-images': '/classic-fruit-machines', '/classic-fruit-machine-archive-1': '/classic-fruit-machine-archive',
    '/fruit-machine-manufacturers': '/classic-fruit-machines', '/classic-machine-archive-queue': '/classic-fruit-machines',
    '/classic-machine-sightings': '/classic-fruit-machines' };
  var HOST = /^(https?:)?\/\/(www\.)?spin-raiders\.com/i;
  var hubsLive = null;

  function target(p) {
    p = (p || '').replace(/\/+$/, '') || '/';
    if (Object.prototype.hasOwnProperty.call(ALIASES, p)) p = ALIASES[p];
    if (hubsLive === false && Object.prototype.hasOwnProperty.call(HUBS, p)) return HUBS[p];
    return p;
  }
  function fix(a) {
    var href = a.getAttribute('href');
    if (!href) return;
    var rel = href.replace(HOST, '');
    if (rel.charAt(0) !== '/' || rel.charAt(1) === '/') return;
    var mm = rel.match(/^([^?#]*)(.*)$/);
    var base = (mm[1].replace(/\/+$/, '') || '/');
    var to = target(base);
    if (to !== base) a.setAttribute('href', to + (to.indexOf('?') < 0 ? mm[2] : ''));
  }
  function sweep(root) {
    var links = root.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) fix(links[i]);
    var all = root.querySelectorAll('*');
    for (var j = 0; j < all.length; j++) if (all[j].shadowRoot) sweep(all[j].shadowRoot);
  }
  function start() {
    var runs = 0, timer = setInterval(function () { try { sweep(document); } catch (e) {} if (++runs > 40) clearInterval(timer); }, 500);
    if (window.MutationObserver) {
      var pending = false;
      new MutationObserver(function () {
        if (pending) return; pending = true;
        setTimeout(function () { pending = false; try { sweep(document); } catch (e) {} }, 250);
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
    document.addEventListener('click', function (e) {
      var p = e.composedPath ? e.composedPath() : [];
      for (var i = 0; i < p.length; i++) if (p[i] && p[i].tagName === 'A') { fix(p[i]); return; }
    }, true);
  }
  /* One cached probe tells us whether the hub pages are live yet. */
  var KEY = 'sr-hubs-live-v1';
  try { var c = sessionStorage.getItem(KEY); if (c) hubsLive = c === '1'; } catch (e) {}
  if (hubsLive === null) {
    fetch('/zoos', { method: 'GET', credentials: 'omit', cache: 'no-store' }).then(function (r) {
      hubsLive = r.status === 200;
    }).catch(function () { hubsLive = true; }).then(function () {
      try { sessionStorage.setItem(KEY, hubsLive ? '1' : '0'); } catch (e) {}
      try { sweep(document); } catch (e) {}
    });
  }
  start();
})();
