/* Progressive delivery of the existing homepage guide, with its text in the initial HTML. */
(function () {
  'use strict';
  var page = document;
  var source = page.getElementById('sr-home-native-source');
  if (!source) return;
  var ignored = ['raidertube', 'sr', 'report', 'explore', 'view', 'place'];
  var query = new URLSearchParams(location.search);
  if (location.pathname !== '/' || ignored.some(function (key) { return query.has(key); })) {
    source.remove();
    return;
  }
  var pending = false;
  var attempts = 0;
  var timer;
  var observer;

  function forward(host, name) {
    if (host.querySelector('slot[slot="' + name + '"]')) return;
    var forwarding = page.createElement('slot');
    forwarding.name = name;
    forwarding.slot = name;
    host.appendChild(forwarding);
  }

  function mount() {
    if (location.pathname !== '/' || !source.isConnected) return false;
    var host = page.getElementById('sr-seaside-root');
    var outer = host && host.shadowRoot;
    var home = outer && outer.querySelector('#sr-home-approved-20260921');
    var inner = home && home.shadowRoot;
    var existingGuide = inner && inner.querySelector('.home-guide');
    var existingValue = inner && inner.querySelector('.home-value');
    var guide = source.querySelector('#sr-home-native-guide');
    var value = source.querySelector('#sr-home-native-value');
    if (!host || !inner || !existingGuide || !existingValue || !guide || !value) return false;

    var currentPicks = existingGuide.querySelectorAll('.home-picks');
    var nativePicks = source.querySelectorAll('.home-picks');
    if (currentPicks.length !== nativePicks.length) return false;
    var legacyKinds = ['arcades', 'destinations', 'attractions', 'food', 'hotels'];
    if (currentPicks.length !== legacyKinds.length) return false;
    currentPicks.forEach(function (picks, index) {
      var target = source.querySelector('[data-sr-picks="' + legacyKinds[index] + '"]');
      if (target) target.replaceChildren.apply(target, Array.from(picks.childNodes));
    });
    var destinationTips = {'/destination/skegness':'Beach, pier & fairground fun','/destination/southport':'A waterfront wander','/destination/great-yarmouth':'Explore the Golden Mile'};
    guide.querySelectorAll('[data-sr-picks="destinations"] a').forEach(function (card) {
      var caption = card.querySelector('p');
      if (caption && destinationTips[card.getAttribute('href')]) caption.textContent = destinationTips[card.getAttribute('href')];
    });
    var liveHighlights = Array.from(inner.querySelectorAll('main > section')).find(function (section) {
      var title = section.querySelector('h2');
      return title && /highlights/i.test(title.textContent);
    });
    var featured = guide.querySelector('#sr-monthly-highlights .highlights');
    if (liveHighlights && featured) {
      var offers = [], arcadeFeatures = [];
      liveHighlights.querySelectorAll('.highlights > .card').forEach(function (card) {
        var href = card.getAttribute('href') || '';
        var badge = card.querySelector('.badge');
        if (/^\/(arcade|agc)\//.test(href) || badge && /ARCADE/.test(badge.textContent)) arcadeFeatures.push(card);
        else offers.push(card);
      });
      if (offers.length) featured.replaceChildren.apply(featured, offers);
      var arcades = value.querySelector('[data-sr-picks="arcades"]');
      if (arcades) arcadeFeatures.forEach(function (card) { arcades.appendChild(card); });
      liveHighlights.remove();
    }
    host.appendChild(guide);
    host.appendChild(value);
    forward(home, 'sr-home-guide');
    forward(home, 'sr-home-value');
    var guideSlot = page.createElement('slot');
    guideSlot.name = 'sr-home-guide';
    var valueSlot = page.createElement('slot');
    valueSlot.name = 'sr-home-value';
    existingGuide.replaceWith(guideSlot);
    existingValue.replaceWith(valueSlot);
    // Destination cards already appear in the new discovery guide.
    inner.querySelectorAll('main > section.section.wrap').forEach(function (section) {
      var title = section.querySelector('h2');
      if (title && /Explore by destination/.test(title.textContent)) section.remove();
    });
    // The value slot was nested in the old destination section; keep it in the main flow.
    var main = inner.querySelector('main');
    if (main) main.appendChild(valueSlot);
    var shortcuts = inner.querySelector('nav[aria-label="Choose your day out"]');
    if (shortcuts) shortcuts.remove();
    var oldHeading = inner.querySelector('.hero > h1.sr-only');
    if (oldHeading) oldHeading.remove();
    source.remove();
    if (timer) clearInterval(timer);
    if (observer) observer.disconnect();
    return true;
  }

  function attempt() {
    if (pending) return;
    var host = page.getElementById('sr-seaside-root');
    var home = host && host.shadowRoot && host.shadowRoot.querySelector('#sr-home-approved-20260921');
    if (!home || !home.shadowRoot) return;
    pending = true;
    Promise.resolve(window.SR_HOME_ROUTES_READY).then(function () {
      pending = false;
      mount();
    }, function () {
      pending = false;
    });
  }

  observer = new MutationObserver(attempt);
  observer.observe(page.body, { childList: true });
  timer = setInterval(function () {
    attempt();
    if (++attempts >= 150) {
      clearInterval(timer);
      observer.disconnect();
    }
  }, 100);
  attempt();
})();
