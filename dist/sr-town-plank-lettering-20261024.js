/* Owner-approved 24 Oct 2026: original art, closed plank gaps, outlined caps.
   Cosmetic only: original paragraph/title/photo/control nodes remain in place. */
(function () {
  'use strict';
  const VERSION = 'approved-planks-20261024';
  const ART = 'https://static.wixstatic.com/media/3a517e_07b6f0e7586d4f8ab7d8ab67ad6ea7b1~mv2.png';
  const FOLKESTONE = [
    ['Folkestone has reinvented itself', 'around Harbour Arm,'],
    ['the Creative Quarter,', 'independent food and arts'],
    ['while keeping the Leas,', 'Sunny Sands…']
  ];
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const css = `
@import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@900&display=swap');
.town-banner-sign[data-sr-approved-planks]{aspect-ratio:100 / var(--sr-plank-ratio,113.7)!important;height:auto!important}
main[data-sr-destination-restored]>.search-hero .town-banner-sign[data-sr-approved-planks]{height:auto!important;aspect-ratio:100 / var(--sr-plank-ratio,113.7)!important}
.town-banner-sign[data-sr-approved-planks]:after{display:none!important}
.town-banner-sign[data-sr-approved-planks] .town-banner-strapline-text{font-family:'Roboto Condensed',Arial,sans-serif!important;font-weight:900!important;text-transform:uppercase!important;font-size:min(var(--town-strap-size,4.5cqw),4.5cqw)!important;paint-order:stroke fill;-webkit-text-stroke:.12cqw #001b31}
.town-banner-sign[data-sr-approved-planks] .town-banner-description{left:0!important;top:62.7cqw!important;bottom:auto!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;transform:none!important;line-height:1.14!important;letter-spacing:0!important;text-align:center!important;font-family:'Roboto Condensed',Arial,sans-serif!important;font-weight:900!important;font-size:4.77cqw!important;color:white!important;text-transform:uppercase!important;text-shadow:none!important;-webkit-text-stroke:.28cqw #001b31;paint-order:stroke fill}
.town-banner-sign[data-sr-approved-planks] .sr-intro-plank{display:flex;position:relative;width:100%;height:17cqw;box-sizing:border-box;flex-direction:column;justify-content:center;align-items:center;background-image:url('${ART}');background-size:100% 921.7391304%;background-position:center 95.7671958%;background-repeat:no-repeat}
.town-banner-sign[data-sr-approved-planks] .sr-intro-plank-line{display:block;width:max-content;max-width:none;white-space:nowrap;font:inherit!important;line-height:1.14!important;letter-spacing:0!important}
`;
  const signatures = new WeakMap();
  function linesFor(text, width) {
    if (text === FOLKESTONE.flat().join(' ')) return FOLKESTONE;
    const fontSize = width * .0477;
    if (context) context.font = '900 ' + fontSize + 'px "Roboto Condensed", Arial, sans-serif';
    const measure = text => context ? context.measureText(text.toUpperCase()).width : text.length * fontSize * .58;
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (line && measure(next) > width * .827) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    const groups = [];
    for (let i = 0; i < lines.length; i += 2) groups.push(lines.slice(i, i + 2));
    return groups;
  }
  function apply(root) {
    const signs = root.querySelectorAll('main[data-sr-destination-restored] .town-banner-sign');
    if (!signs.length) return;
    if (!root.querySelector('style[data-sr-approved-plank-style]')) {
      const style = document.createElement('style');
      style.dataset.srApprovedPlankStyle = VERSION;
      style.textContent = css;
      (root.head || root).appendChild(style);
    }
    for (const sign of signs) {
      const paragraph = sign.querySelector('.town-banner-description');
      if (!paragraph) continue;
      const text = normalize(paragraph.textContent);
      const width = sign.getBoundingClientRect().width;
      if (!text || width < 100) continue;
      const signature = text + '|' + Math.round(width) + '|' + document.fonts.check('900 20px "Roboto Condensed"');
      if (signatures.get(paragraph) === signature && paragraph.querySelector('.sr-intro-plank')) continue;
      const groups = linesFor(text, width);
      if (normalize(groups.flat().join(' ')) !== text) continue;
      const fragment = document.createDocumentFragment();
      groups.forEach((group, index) => {
        const row = document.createElement('span');
        row.className = 'sr-intro-plank';
        group.forEach((line, i) => {
          const span = document.createElement('span');
          span.className = 'sr-intro-plank-line';
          span.textContent = line + (index === groups.length - 1 && i === group.length - 1 ? '' : ' ');
          row.appendChild(span);
        });
        fragment.appendChild(row);
      });
      paragraph.replaceChildren(fragment);
      sign.dataset.srApprovedPlanks = VERSION;
      sign.style.setProperty('--sr-plank-ratio', String(62.7 + groups.length * 17));
      signatures.set(paragraph, signature);
    }
  }
  let queued = false;
  function scan() {
    queued = false;
    const roots = [document];
    for (let i = 0; i < roots.length; i++) {
      apply(roots[i]);
      for (const element of roots[i].querySelectorAll('*')) if (element.shadowRoot) roots.push(element.shadowRoot);
    }
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(scan); } }
  addEventListener('resize', schedule, { passive: true });
  addEventListener('popstate', schedule);
  document.fonts.ready.then(schedule);
  setInterval(schedule, 1500);
  schedule();
})();
