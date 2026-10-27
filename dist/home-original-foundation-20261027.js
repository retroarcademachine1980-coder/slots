/* Keep the existing homepage skin and components; add the owner's review material. */
(function () {
  'use strict';
  var page = document, source = page.getElementById('sr-home-native-source');
  if (!source) return;
  var ignored = ['raidertube','sr','report','explore','view','place'];
  var query = new URLSearchParams(location.search);
  function homeRoute() { return !!page.defaultView && !!page.defaultView.location && page.defaultView.location.pathname === '/' && !ignored.some(function (key) { return query.has(key); }); }
  function reveal() { page.documentElement.removeAttribute('data-sr-home-foundation-pending'); }
  if (!homeRoute()) { source.remove(); reveal(); return; }
  var timer, observer, attempts = 0;
  function forward(host, name) {
    if (host.querySelector('slot[slot="'+name+'"]')) return;
    var slot = page.createElement('slot'); slot.name = name; slot.slot = name; host.appendChild(slot);
  }
  function mount() {
    if (!homeRoute() || !source.isConnected) return false;
    var host = page.getElementById('sr-seaside-root');
    var outer = host && host.shadowRoot;
    var home = outer && outer.querySelector('#sr-home-approved-20260921');
    var inner = home && home.shadowRoot;
    var existingGuide = inner && inner.querySelector('.home-guide');
    var existingValue = inner && inner.querySelector('.home-value');
    var guide = source.querySelector('#sr-home-native-guide');
    var value = source.querySelector('#sr-home-native-value');
    var main = inner && inner.querySelector('main');
    var shortcuts = inner && inner.querySelector('nav[aria-label="Choose your day out"]');
    if (!host || !main || !existingGuide || !existingValue || !guide || !value || !shortcuts || !inner.querySelector('nav[data-sr-hover-menu]')) return false;
    var kinds = ['arcades','destinations','attractions','food','hotels'];
    var picks = Array.from(existingGuide.querySelectorAll('.home-picks'));
    var targets = kinds.map(function (kind) { return source.querySelector('[data-sr-picks="'+kind+'"]'); });
    if (picks.length !== kinds.length || targets.some(function (target) { return !target; })) return false;
    var sections = Array.from(main.children);
    var highlights = sections.find(function (section) { var h = section.querySelector('h2'); return h && /highlights/i.test(h.textContent); });
    var destinations = sections.find(function (section) { var h = section.querySelector('h2'); return h && /Explore by\s+destination/i.test(h.textContent); });
    if (!highlights || !destinations) return false;
    // Retain the original icon strip, monthly cards, six destinations and planning panels.
    shortcuts.after(highlights);
    highlights.after(destinations);
    var waiting = page.createElement('div'); waiting.hidden = true; waiting.dataset.srPendingHomeCards = '1';
    picks.forEach(function (pick) { waiting.appendChild(pick); }); inner.appendChild(waiting);
    host.appendChild(guide); host.appendChild(value);
    forward(home,'sr-home-guide'); forward(home,'sr-home-value');
    var guideSlot = page.createElement('slot'); guideSlot.name = 'sr-home-guide';
    var valueSlot = page.createElement('slot'); valueSlot.name = 'sr-home-value';
    existingGuide.replaceWith(guideSlot); existingValue.replaceWith(valueSlot);
    destinations.after(guideSlot); guideSlot.after(valueSlot);
    source.remove(); clearInterval(timer); if (observer) observer.disconnect();
    Promise.resolve(window.SR_HOME_ROUTES_READY).then(function () {
      if (!homeRoute() || !host.isConnected || !guide.isConnected) { waiting.remove(); reveal(); return; }
      picks.forEach(function (pick,index) { targets[index].replaceChildren.apply(targets[index],Array.from(pick.childNodes)); });
      waiting.remove();
      var grid = highlights.querySelector('.highlights');
      if (grid && !grid.querySelector('[data-sr-owner-monthly="masala"]')) {
        var card = page.createElement('a'); card.className = 'card'; card.href = '/food-and-drink/masala-malt-grimsby'; card.dataset.srOwnerMonthly = 'masala';
        card.innerHTML = '<img src="https://static.wixstatic.com/media/3a517e_809ead30953140cc948d147392fd0498~mv2.jpg" alt="Masala n Malt, Grimsby" width="1536" height="710" loading="lazy"><span class="badge">RESTAURANT OF THE MONTH</span><div class="card-copy"><h3>Masala n Malt, Grimsby</h3><p>Our first Hidden Gem. Read Jamie’s full review · 4.9/5.</p><span class="arrow" aria-hidden="true">→</span></div>';
        grid.prepend(card);
        var style = page.createElement('style'); style.textContent = '@media(min-width:1100px){.highlights:has([data-sr-owner-monthly]){grid-template-columns:repeat(5,minmax(0,1fr))}}'; inner.appendChild(style);
        var note = highlights.querySelector('.heading p');
        if (note) note.textContent = 'Our October picks stay in the spotlight through November, with Masala n Malt as Restaurant of the Month.';
      }
      requestAnimationFrame(function () { requestAnimationFrame(reveal); });
    }, function () { waiting.remove(); reveal(); });
    return true;
  }
  function attempt() { mount(); }
  observer = new MutationObserver(attempt); observer.observe(page.body,{childList:true});
  timer = setInterval(function () { attempt(); if (++attempts >= 150) { clearInterval(timer); observer.disconnect(); reveal(); } },100);
  attempt();
})();
