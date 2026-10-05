/* Spin Raiders link fix (5 Oct 2026)
   Several hub URLs (/arcade, /attractions, /places-to-stay, /classic-fruit-machines ...) return 404
   because their router index pages are not live. Until they are, point every link to them at the
   working equivalent (category search or the machine archive), and send anyone who lands on one
   of those 404s straight to the working page. */
(function () {
  'use strict';
  var S = '/search?q=';
  var MAP = {
    '/arcades': S + 'arcades', '/arcades-1': S + 'arcades', '/arcade': S + 'arcades',
    '/agc': S + 'adult%20gaming%20centres', '/arcade-bars': S + 'arcade%20bars',
    '/retro-video-games': '/retro-arcades',
    '/piers': S + 'piers', '/theme-parks': S + 'theme%20parks', '/family-fun': S + 'family%20fun',
    '/zoos': S + 'zoos', '/sea-life': S + 'sea%20life', '/outdoors': S + 'outdoors', '/tours': S + 'tours',
    '/hidden-gems': S + 'attractions', '/attractions': S + 'attractions', '/days-out': S + 'days%20out',
    '/places-to-stay': S + 'places%20to%20stay', '/holiday-parks': S + 'holiday%20parks',
    '/bowling': S + 'bowling', '/cinemas': S + 'cinemas', '/fishing-lakes': S + 'fishing%20lakes',
    '/museums': S + 'museums', '/historical-sites': S + 'historic%20sites', '/bingo-halls': S + 'bingo',
    '/services': S + 'service%20stations', '/offers': '/casino-offers', '/plan-a-trip': '/map',
    '/classic-fruit-machines': '/classic-fruit-machine-archive',
    '/classic-fruit-machine-families': '/classic-fruit-machine-archive',
    '/classic-fruit-machine-images': '/classic-fruit-machine-archive',
    '/classic-fruit-machine-archive-1': '/classic-fruit-machine-archive',
    '/fruit-machine-manufacturers': '/classic-fruit-machine-archive',
    '/classic-machine-archive-queue': '/classic-fruit-machine-archive',
    '/classic-machine-sightings': '/classic-fruit-machine-archive'
  };
  var HOST = /^(https?:)?\/\/(www\.)?spin-raiders\.com/i;

  function target(path) {
    path = (path || '').replace(/\/+$/, '') || '/';
    if (Object.prototype.hasOwnProperty.call(MAP, path)) return MAP[path];
    var food = path.match(/^\/food-and-drink\/([^\/]+)$/);
    if (food) return S + encodeURIComponent(decodeURIComponent(food[1]).replace(/-/g, ' '));
    return null;
  }
  function fixHref(href) {
    if (!href) return null;
    var rel = href.replace(HOST, '');
    if (rel.charAt(0) !== '/' || rel.charAt(1) === '/') return null;
    var m = rel.match(/^([^?#]*)/);
    return target(m[1]);
  }
  function sweep(root) {
    var links = root.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var to = fixHref(links[i].getAttribute('href'));
      if (to) links[i].setAttribute('href', to);
    }
    var all = root.querySelectorAll('*');
    for (var j = 0; j < all.length; j++) if (all[j].shadowRoot) sweep(all[j].shadowRoot);
  }

  /* Landed on one of the dead hubs: go to the working page instead. */
  var here = target(location.pathname);
  if (here) {
    var check = function () {
      var t = document.title || '';
      if (/404|not found/i.test(t) || document.querySelector('[data-testid*="404"], #SITE_404')) location.replace(here);
    };
    setTimeout(check, 400); setTimeout(check, 1500); setTimeout(check, 4000);
  }

  /* Catch clicks too, in case a renderer rewrites links after a sweep. */
  document.addEventListener('click', function (e) {
    var path = e.composedPath ? e.composedPath() : [];
    for (var i = 0; i < path.length; i++) {
      var a = path[i];
      if (a && a.tagName === 'A' && a.getAttribute) {
        var to = fixHref(a.getAttribute('href'));
        if (to) { a.setAttribute('href', to); }
        return;
      }
    }
  }, true);

  var runs = 0;
  var timer = setInterval(function () {
    try { sweep(document); } catch (err) {}
    if (++runs > 40) clearInterval(timer);
  }, 500);
  if (window.MutationObserver) {
    var pending = false;
    new MutationObserver(function () {
      if (pending) return; pending = true;
      setTimeout(function () { pending = false; try { sweep(document); } catch (err) {} }, 250);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
