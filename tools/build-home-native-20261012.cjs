const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const root = path.resolve(__dirname, '..');
const renderer = fs.readFileSync(path.join(root, 'src/runtime/099-01-spin-raiders-front-page-renderer-v5-20260923.js'), 'utf8');
const styleSource = fs.readFileSync(path.join(root, 'src/runtime/052-01-spin-raiders-front-page-styles-v5-20260923.js'), 'utf8');
const styleLiteral = styleSource.match(/window\.SR_APPROVED_HOME_CSS=("(?:\\.|[^"\\])*")/)[1];
const originalCSS = JSON.parse(styleLiteral);

function extract(start, end) {
  const from = renderer.indexOf(start);
  const to = renderer.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error('The production template changed; review the extraction.');
  return renderer.slice(from, to);
}

let guide = extract('<section class="section wrap home-guide">', '</section>\\n<section') + '</section>';
guide = guide.replace('<section class="section wrap home-guide">', '<section id="sr-home-native-guide" data-sr-native-home slot="sr-home-guide" class="section wrap home-guide">');
guide = guide.replace('<h2>You search it. <em>We show you it.</em></h2>', '<h1>UK days out. <em>All under one roof.</em></h1>');
for (const kind of ['arcades', 'attractions', 'food', 'hotels']) guide = guide.replace('${P("' + kind + '")}', '');
const destinationStart = guide.indexOf('${$.filter');
const destinationEnd = guide.indexOf('</div><a class="home-more" href="/days-out">', destinationStart);
if (destinationStart < 0 || destinationEnd < 0) throw new Error('Missing production destination cards.');
const destinations = [
  ['skegness', 'Skegness', '89bd10a9088945cdbb81c3578d88dd20~mv2.webp', 'Traditional fun'],
  ['southport', 'Southport', 'a1e264880a0c4160ab30060e0aa0ff07~mv2.png', 'Coastal charm'],
  ['great-yarmouth', 'Great Yarmouth', 'a74df586e37c42cd869bc13672ca13d7~mv2.webp', 'Seaside classics'],
].map(([slug, title, image, badge]) => '<a class="dest" href="/destination/' + slug + '"><img src="https://static.wixstatic.com/media/3a517e_' + image + '/v1/fill/w_480,h_340,al_c,q_55,enc_avif/' + slug + '.webp" alt="' + title + '" loading="lazy"><div><h3>' + title + '</h3><p>' + badge + '</p></div></a>').join('');
guide = guide.slice(0, destinationStart) + destinations + guide.slice(destinationEnd);
guide = guide.replace('${g("search")}', '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 6 6"/></svg>');

let value = extract('<section class="home-value">', '</div></section>\\n<div class="promos">') + '</div></section>';
value = value.replace('<section class="home-value">', '<section id="sr-home-native-value" data-sr-native-home slot="sr-home-value" class="home-value">');
if ((guide + value).includes('${')) throw new Error('Unresolved production-template expression.');
const fragment = '<div id="sr-home-native-source">' + guide + value + '</div>';
if (fragment.length > 14000) throw new Error('Leave space for the stylesheet and bridge within the Wix embed limit.');

const scope = ':where([data-sr-native-home])';
const css = postcss.parse(originalCSS);
css.walkRules(rule => {
  if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
  rule.selectors = rule.selectors.flatMap(selector => {
    selector = selector.replace(/\.home-guide h2/g, '.home-guide :is(h1,h2)');
    if (selector === ':host') return [scope];
    if (selector === '*') return [scope, scope + ' *'];
    return /^[.\[:#]/.test(selector) ? [scope + selector, scope + ' ' + selector] : [scope + ' ' + selector];
  });
});
css.append({ selector: '#sr-home-native-source > .home-value', nodes: [{ prop: 'width', value: 'min(1376px,calc(100% - 32px))' }, { prop: 'margin', value: '24px auto' }] });
css.append({ selector: scope + '.home-guide .home-about-grid>article:has(.home-picks:empty)', nodes: [{ prop: 'display', value: 'block' }] });
css.append({ selector: 'body:has(#sr-home-native-source) #SITE_CONTAINER', nodes: [{ prop: 'display', value: 'none!important' }] });

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/sr-home-native-20261012.html'), fragment + '\n');
fs.writeFileSync(path.join(root, 'dist/sr-home-native-20261012.css'), css.toString() + '\n');
console.log(JSON.stringify({ fragmentCharacters: fragment.length, stylesheetCharacters: css.toString().length }));
