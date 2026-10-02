#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.join(__dirname, '..');
const maintained = fs.readFileSync(path.join(root, 'src/runtime/114-01-spin-raiders-seo-dom-cleanup-20260918.js'), 'utf8');
const built = fs.readFileSync(path.join(root, 'dist/sr.js'), 'utf8').split(/(?=\/\* \[\d+\])/).find(block => block.startsWith('/* [114]'));
assert.ok(built, 'Actual built module 114 is present');
const sources = process.argv.includes('--source-only') ? [['maintained', maintained]] : [['maintained', maintained], ['built', built]];
let passed = 0;

for (const [name, code] of sources) {
  const errors = [], timers = [], observers = [], frames = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', error => errors.push(error.message));
  vc.on('warn', (...args) => errors.push(args.join(' ')));
  const dom = new JSDOM(`<!doctype html><html><head><style>
    body, #PAGES_CONTAINER { background-color: rgb(255,255,255); }
    .section-underlay { background-color: rgb(14,14,22); }
    #jm2fd h1, #jm2fd p, #jm2fd span, #jm2fd a { color: rgb(255,255,255); }
  </style></head><body><main id="PAGES_CONTAINER"><div id="jm2fd">
    <section id="comp-lunurbxu"><div class="section-underlay"></div><div class="section-content">
      <div id="comp-lh9py7mb"><h1><span>Terms and Conditions</span></h1></div>
    </div></section>
    <section id="comp-lunurbxu1"><div class="section-underlay"></div><div class="section-content">
      <div id="comp-kgh4szbz"><p><span>Native Terms text remains unchanged.</span></p><p><a href="/privacy-policy">Privacy policy</a></p></div>
    </div></section>
  </div><div id="z00kr" style="background-color:rgb(255,255,255)"><p>Existing scoped contrast target</p></div></main></body></html>`, {
    url: 'https://www.spin-raiders.com/terms?rc=test-site', runScripts: 'outside-only', virtualConsole: vc
  });
  const w = dom.window, document = w.document;
  try {
    w.setInterval = fn => { timers.push(fn); return timers.length; };
    w.clearInterval = () => {};
    w.setTimeout = fn => { timers.push(fn); return timers.length; };
    w.requestAnimationFrame = fn => { frames.push(fn); return frames.length; };
    w.MutationObserver = class { constructor(callback) { observers.push(callback); } observe() {} disconnect() {} };
    const terms = document.getElementById('jm2fd');
    const before = terms.outerHTML;
    const textNodes = [...terms.querySelectorAll('h1,p,span,a')];
    for (const node of textNodes) assert.equal(w.getComputedStyle(node).color, 'rgb(255, 255, 255)', 'Native text starts white');
    assert.equal(w.getComputedStyle(document.getElementById('PAGES_CONTAINER')).backgroundColor, 'rgb(255, 255, 255)');
    for (const node of terms.querySelectorAll('.section-underlay')) assert.equal(w.getComputedStyle(node).backgroundColor, 'rgb(14, 14, 22)');
    w.eval(code);
    assert.equal(timers.length, 1, 'Actual cleanup startup registered its interval');
    function unchanged(stage) {
      assert.equal(terms.outerHTML, before, name + ': native Terms markup/style must survive ' + stage);
      for (const node of textNodes) {
        assert.equal(node.style.getPropertyValue('color'), '', 'Runtime must not add an inline text colour');
        assert.equal(w.getComputedStyle(node).color, 'rgb(255, 255, 255)', name + ': authored white text must survive ' + stage);
      }
      for (const node of terms.querySelectorAll('.section-underlay')) assert.equal(w.getComputedStyle(node).backgroundColor, 'rgb(14, 14, 22)');
      assert.deepEqual(errors, []);
    }
    timers[0](); unchanged('initial cleanup');
    assert.equal(document.getElementById('z00kr').style.color, 'rgb(17, 17, 17)', 'Existing unrelated contrast target retains its behavior');
    passed++; console.log('PASS ' + name + ': white native Terms text survives a dark sibling underlay with white ancestors');
    w.dispatchEvent(new w.Event('pageshow')); unchanged('pageshow');
    observers[0]([]); while (frames.length) frames.shift()(); unchanged('native mutation');
    w.dispatchEvent(new w.PopStateEvent('popstate')); timers[timers.length - 1](); unchanged('Back/Forward');
    for (let index = 0; index < 25; index++) timers[0](); unchanged('repeated cleanup');
    passed++; console.log('PASS ' + name + ': repeated native cleanup and Back/Forward preserve native legal markup and colours');
  } finally { w.close(); }
}
console.log('PASS ' + passed + ' native-style preservation checks; local DOM coverage only');
