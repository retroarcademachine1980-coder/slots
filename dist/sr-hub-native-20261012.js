/* Keep the existing category guide readable before and after its interactive layout loads. */
(function () {
  'use strict';
  var page = document;
  var source = page.getElementById('sr-hub-native-source');
  if (!source) return;
  var expected = source.getAttribute('data-sr-hub-path');
  var guide = source.querySelector('#sr-hub-native-guide');
  var heading = source.querySelector('#sr-hub-native-heading');
  var attempts = 0;
  var timer;
  var names = ['sr-extended-pages', 'sr-trip-pages', 'sr-approved-archive', 'sr-seaside-root'];

  function slot(name) {
    var element = page.createElement('slot');
    element.name = name;
    return element;
  }
  function forward(container, name) {
    if (container.querySelector('slot[slot="' + name + '"]')) return;
    var element = slot(name);
    element.slot = name;
    container.appendChild(element);
  }
  function mount() {
    if ((location.pathname.replace(/\/+$/, '') || '/') !== expected) {
      source.remove();
      guide.remove();
      if (heading) heading.remove();
      clearInterval(timer);
      return false;
    }
    for (var index = 0; index < names.length; index++) {
      var host = page.getElementById(names[index]);
      if (!host || !host.shadowRoot) continue;
      var nested = host.shadowRoot.querySelector('#sr-home-approved-20260921');
      var inner = nested && nested.shadowRoot || host.shadowRoot;
      var original = inner.querySelector('.sr-hub-guide');
      if (!original) continue;
      if (!original.querySelector('slot[name="sr-hub-guide"]')) {
        if (heading) {
          var oldHeading = inner.querySelector('main h1') || inner.querySelector('h1');
          if (!oldHeading) continue;
          var computed = getComputedStyle(oldHeading);
          ['font-family','font-size','font-weight','font-style','line-height','color','letter-spacing','text-shadow','text-align','margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left'].forEach(function (property) {
            heading.style.setProperty(property, computed.getPropertyValue(property));
          });
          heading.style.fontSize = 'clamp(30px,5vw,' + computed.fontSize + ')';
          if (oldHeading.classList.contains('sr-only')) heading.classList.add('sr-hub-visually-hidden');
          host.appendChild(heading);
          if (nested) forward(nested, 'sr-hub-heading');
          heading.slot = 'sr-hub-heading';
          var headingFrame = page.createElement('div');
          headingFrame.style.display = 'contents';
          headingFrame.appendChild(slot('sr-hub-heading'));
          oldHeading.replaceWith(headingFrame);
        }
        guide.slot = 'sr-hub-guide';
        host.appendChild(guide);
        if (nested) forward(nested, 'sr-hub-guide');
        original.style.display = 'contents';
        original.replaceChildren(slot('sr-hub-guide'));
        source.remove();
      }
      return true;
    }
    return false;
  }
  timer = setInterval(function () {
    mount();
    if (++attempts >= 160) clearInterval(timer);
  }, 250);
  mount();
})();
