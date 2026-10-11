const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const pages = JSON.parse(fs.readFileSync(path.join(root, 'dist/sr-hub-native-pages-20261012.json'), 'utf8'));
const bridge = fs.readFileSync(path.join(root, 'dist/sr-hub-native-20261012.js'), 'utf8');

for (const entry of pages) {
  const fragment = fs.readFileSync(path.join(root, entry.file), 'utf8');
  test(entry.path + ' delivers specific prose and preserves a single guide after mounting', () => {
    const dom = new JSDOM('<html><body>' + fragment + '</body></html>', {url:'https://www.spin-raiders.com' + entry.path,runScripts:'outside-only'});
    const d = dom.window.document;
    const guide = d.querySelector('#sr-hub-native-guide');
    assert.ok(guide.textContent.split(/\s+/).filter(Boolean).length >= 500);
    assert.equal(d.querySelectorAll('h1').length, entry.heading ? 1 : 0);
    for (const a of guide.querySelectorAll('a')) assert.match(a.getAttribute('href'), /^\/[a-z0-9/-]+$/);
    const host = d.createElement('div'); host.id = 'sr-seaside-root';
    const outer = host.attachShadow({mode:'open'});
    const nested = d.createElement('div'); nested.id = 'sr-home-approved-20260921'; outer.append(nested);
    const inner = nested.attachShadow({mode:'open'});
    inner.innerHTML = '<main><header><h1 class="sr-only">' + entry.title + '</h1></header><section class="sr-hub-guide">Existing guide</section></main>';
    d.body.prepend(host);
    dom.window.eval(bridge);
    assert.equal(guide.parentElement, host);
    assert.equal(d.querySelector('#sr-hub-native-source'), null);
    assert.equal(inner.querySelector('.sr-hub-guide').textContent, '');
    assert.ok(inner.querySelector('.sr-hub-guide'), 'Leave the original renderer marker so it cannot append a duplicate guide.');
    const finalGuide = inner.querySelector('slot[name="sr-hub-guide"]').assignedElements({flatten:true});
    assert.equal(finalGuide[0], guide);
    if (entry.heading) {
      assert.equal(inner.querySelectorAll('h1').length, 0);
      assert.equal(d.querySelectorAll('h1').length, 1);
      const heading = d.querySelector('#sr-hub-native-heading');
      assert.ok(heading.classList.contains('sr-hub-visually-hidden'));
      assert.equal(inner.querySelector('slot[name="sr-hub-heading"]').assignedElements({flatten:true})[0], heading);
    } else assert.equal(inner.querySelectorAll('h1').length, 1);
    dom.window.eval(bridge);
    assert.equal(host.querySelectorAll('#sr-hub-native-guide').length, 1);
    dom.window.close();
  });
  test(entry.path + ' does not install generic category text into detail pages', () => {
    const dom = new JSDOM('<html><body>' + fragment + '</body></html>', {url:'https://www.spin-raiders.com' + entry.path + '/example',runScripts:'outside-only'});
    dom.window.eval(bridge);
    assert.equal(dom.window.document.querySelector('#sr-hub-native-source'), null);
    assert.equal(dom.window.document.querySelector('#sr-hub-native-guide'), null);
    dom.window.close();
  });
}
