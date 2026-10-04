/* Shared category/destination tile navigation repair, 29 September 2026. */
(function () {
  'use strict';
  if (window.SR_BROWSE_NAVIGATION_V1) return;
  window.SR_BROWSE_NAVIGATION_V1 = true;

  // Listen above the shadow roots so newly rendered pages and tiles work too.
  document.addEventListener('click', function (event) {
    const button = event.composedPath().find(function (node) {
      return node && node.matches && node.matches('button[data-topic],button[data-region]');
    });
    if (!button) return;
    const root = button.getRootNode();
    const results = root.querySelector('.results');
    const tile = button.closest('[data-activities],[data-regions]');
    if (!results || !root.querySelector('[data-results]')) return;

    // A browse tile starts a fresh selection. An old search, region or facility
    // filter must not silently cancel the category/destination just clicked.
    if (tile) {
      const clear = root.querySelector('button[data-clear]');
      if (clear) clear.click();
    }
    // Let the existing delegated handler apply the new selection first.
    queueMicrotask(function () {
      if (!results.isConnected) return;
      const heading = results.querySelector('h2');
      results.style.scrollMarginTop = '90px';
      results.scrollIntoView({ block: 'start', behavior: 'auto' });
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      const count = root.querySelector('[data-count]');
      if (count) {
        count.setAttribute('aria-live', 'polite');
        count.setAttribute('aria-atomic', 'true');
      }
    });
  }, true);
})();

