const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const openings = JSON.parse(fs.readFileSync(path.join(root, 'content/guide-openings-20261012.json'), 'utf8'));
const target = path.join(root, 'dist/sr-days-out-experience-20261012.js');
let source = fs.readFileSync(target, 'utf8');
const foodSource = fs.readFileSync(path.join(root,'content/reel-plaice-guide-20261012.html'),'utf8');
source = source.replace(/var approvedGuides = (\{[^\n]+\});/, function(_,json) {
  const guides=JSON.parse(json);
  guides['/food-and-drink/reel-plaice-ayr']=foodSource;
  return 'var approvedGuides = ' + JSON.stringify(guides) + ';';
});
const beginning = '  // BEGIN GUIDE OPENINGS 20261012';
const ending = '  // END GUIDE OPENINGS 20261012';
const fragment = `${beginning}
  var guideOpeningsData = ${JSON.stringify(openings)};
  function livelyGuides(root) {
    var opening = guideOpeningsData[location.pathname.replace(/\\/+$/, '') || '/'];
    if (!opening) return;
    root.querySelectorAll('.sr-hub-guide').forEach(function(guide) {
      if (guide.dataset.srLivelyGuide === '20261012' && !guide.querySelector('h1')) return;
      guide.querySelectorAll('h1').forEach(function(old) {
        var heading = document.createElement('h2');
        Array.from(old.attributes).forEach(function(attribute) { heading.setAttribute(attribute.name,attribute.value); });
        heading.append.apply(heading,Array.from(old.childNodes));
        old.replaceWith(heading);
      });
      var heading = guide.querySelector('h2'), paragraph = guide.querySelector('p');
      if (!heading || !paragraph) return;
      heading.textContent = opening[0];
      paragraph.textContent = opening[1];
      guide.dataset.srLivelyGuide = '20261012';
    });
  }
${ending}`;
const start = source.indexOf(beginning);
if (start >= 0) {
  const end = source.indexOf(ending, start);
  if (end < 0) throw new Error('Unclosed guide opening block.');
  source = source.slice(0,start) + fragment + source.slice(end + ending.length);
} else source = source.replace('  var seen=new WeakSet()', fragment + '\n  var seen=new WeakSet()');
if (!source.includes('relatedCategories(r);livelyGuides(r);')) source = source.replace('relatedCategories(r);','relatedCategories(r);livelyGuides(r);');
if (!source.includes(fragment) || !source.includes('relatedCategories(r);livelyGuides(r);')) throw new Error('Guide integration failed.');
fs.writeFileSync(target,source);
console.log('Built ' + Object.keys(openings).length + ' category guide openings.');
