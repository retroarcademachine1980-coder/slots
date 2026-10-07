/* Spin Raiders: search helper (2026-10-06).
   1) Rewrites common phrasings ("hotels in york", "fish and chips", "things to do in whitby").
   2) When a search finds no places, corrects typos against the site's own place/town names
      ("blakpool" -> "blackpool") and shows "Showing results for ...". Read-only. */
(function () {
  try {
    if (window.__srSearchAssist) return; window.__srSearchAssist = true;
    if (!/^\/search\/?$/.test(location.pathname)) return;
    var me = document.currentScript && document.currentScript.src;
    var VOCAB_URL = me ? me.replace(/sr-search-assist-[^\/]*$/, 'search-vocab-20261006.json') : null;
    var P = new URLSearchParams(location.search);
    var q0 = (P.get('q') || '').trim();
    if (!q0) return;
    var KEEP = /^(near|nearby|nearest|closest|close|around|local|here|food|eat|burgers?|chippy|chippie|chips|fish|pizzas?|pizzeria|cafes?|coffee|pubs?|bars?|inns?|curry|indian|chinese|thai|sushi|kebabs?|takeaways?|carvery|roast|breakfast|brunch|desserts?|museums?|bowling|cinemas?|arcades?|amusements|agcs?|bingo|casinos?|golf|zoos?|aquariums?|castles?|piers?|beach|beaches|hotels?|parks?|play|trampoline|karting|escape|laser|retro|pinball|stay|things|places)$/;
    var ALIAS = { skeggy: 'skegness', saint: 'st', gt: 'great', yarmuth: 'yarmouth', brid: 'bridlington', scarbados: 'scarborough', 'b&b': 'places to stay', bnb: 'places to stay' };
    function phrase(q) {
      var s = ' ' + q.toLowerCase().replace(/\s+/g, ' ').trim() + ' ';
      s = s.replace(/ fish (and|n|'n') chips /g, ' fish & chips ').replace(/ food and drink /g, ' food & drink ').replace(/ bed and breakfasts? /g, ' places to stay ');
      s = s.replace(/ (hotels?|accommodation|guest ?houses?|b ?& ?b'?s?|bnbs?|holiday lets?|holiday cottages?|cottages|somewhere to stay|where to stay) /g, ' places to stay ');
      s = s.replace(/^ (things|stuff|what) to do (in|at|near(?! me)|around(?! me)) /, ' ').replace(/^ (days? out|attractions|places to visit) (in|at|near(?! me)|around(?! me)) /, ' ');
      s = s.replace(/ places to stay (in|at|near(?! me)|around(?! me)) /g, ' places to stay ');
      return s.trim();
    }
    if (!P.get('sf')) {
      var p1 = phrase(q0);
      if (p1 && p1 !== q0.toLowerCase().replace(/\s+/g, ' ').trim()) {
        P.set('q', p1); P.set('sf', '1'); P.set('from', q0);
        location.replace('/search?' + P.toString()); return;
      }
    }
    function dist(a, b, max) {
      if (Math.abs(a.length - b.length) > max) return max + 1;
      var d = []; for (var i = 0; i <= a.length; i++) { d[i] = [i]; }
      for (var j = 1; j <= b.length; j++) d[0][j] = j;
      for (i = 1; i <= a.length; i++) {
        var best = 99;
        for (j = 1; j <= b.length; j++) {
          var c = a[i - 1] === b[j - 1] ? 0 : 1;
          d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
          if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
          if (d[i][j] < best) best = d[i][j];
        }
        if (best > max) return max + 1;
      }
      return d[a.length][b.length];
    }
    function correct(q, V) {
      var words = q.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9& ]+/g, ' ').split(/\s+/).filter(Boolean);
      var out = [], changed = false;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (KEEP.test(w)) { out.push(w); continue; }
        if (ALIAS[w]) { out.push(ALIAS[w]); changed = true; continue; }
        if (i + 1 < words.length && V[w + words[i + 1]] && !(V[w] && V[words[i + 1]])) { out.push(w + words[i + 1]); i++; changed = true; continue; }
        if (w.length < 4 || V[w] || w === '&') { out.push(w); continue; }
        var split = null;
        for (var sp = 3; sp <= w.length - 3 && !split; sp++) if (V[w.slice(0, sp)] > 3 && V[w.slice(sp)] > 3) split = w.slice(0, sp) + ' ' + w.slice(sp);
        if (split) { out.push(split); changed = true; continue; }
        var max = w.length >= 8 ? 2 : 1, best = null, bd = 9, bf = 0;
        for (var k in V) {
          if (Math.abs(k.length - w.length) > max) continue;
          var dd = dist(w, k, max);
          if (dd <= max && (dd < bd || (dd === bd && V[k] > bf))) { best = k; bd = dd; bf = V[k]; }
        }
        if (best) { out.push(best); changed = true; } else out.push(w);
      }
      return changed ? out.join(' ') : null;
    }
    function deep(sel) {
      var found = null;
      (function walk(r) { if (found) return; var x = r.querySelector(sel); if (x) { found = x; return; } var all = r.querySelectorAll('*'); for (var i = 0; i < all.length && !found; i++) if (all[i].shadowRoot) walk(all[i].shadowRoot); })(document);
      return found;
    }
    function noPlaces() {
      var e = deep('.empty h2');
      return e && /No matching places/i.test(e.textContent);
    }
    function banner() {
      var from = P.get('from'); if (!from || !P.get('sf')) return;
      var h = deep('[data-message]') || deep('h2');
      if (!h || h.parentNode.querySelector('.sr-sf-note')) return;
      var d = document.createElement('p'); d.className = 'sr-sf-note';
      d.style.cssText = 'margin:6px 0 10px;font-size:.95rem;color:#334155';
      var a = document.createElement('a'); a.href = '/search?q=' + encodeURIComponent(from) + '&sf=0'; a.textContent = from; a.style.cssText = 'color:#1d6fe0;font-weight:600';
      d.appendChild(document.createTextNode('Showing results for “' + (P.get('q') || '') + '”. Search instead for '));
      d.appendChild(a);
      h.parentNode.insertBefore(d, h.nextSibling);
    }
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      banner();
      if (P.get('sf')) { if (tries > 40) clearInterval(t); return; }
      if (tries > 40) { clearInterval(t); return; }
      if (!noPlaces() || !VOCAB_URL) return;
      clearInterval(t);
      fetch(VOCAB_URL).then(function (r) { return r.json(); }).then(function (V) {
        var c = correct(q0, V);
        if (c && c !== q0.toLowerCase()) { P.set('q', c); P.set('sf', '1'); P.set('from', q0); location.replace('/search?' + P.toString()); }
      }).catch(function () {});
    }, 500);
  } catch (e) { console.warn('SR search assist failed', e); }
})();
