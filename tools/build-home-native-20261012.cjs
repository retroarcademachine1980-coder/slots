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

const authored = fs.readFileSync(path.join(root, 'content/home-discovery-20261012.html'), 'utf8');
const split = authored.indexOf('<section id="sr-home-native-value"');
if (split < 0) throw new Error('Missing trip-planning section');
const guide = authored.slice(0, split);
const value = authored.slice(split);
const heroPreload = '<link rel="preload" as="image" fetchpriority="high" href="https://static.wixstatic.com/media/3a517e_42651a2e3b284d329c0d12dcab45d1a0~mv2.webp/v1/fit/w_1400,h_788,al_c,q_85,enc_avif/hero.webp">';
const fragment = heroPreload + '<main id="sr-home-native-source">' + guide + value + '</main>';
if (fragment.length > 14000) throw new Error('Leave space for the stylesheet and bridge within the Wix embed limit.');

const scope = ':where([data-sr-native-home])';
const css = postcss.parse(originalCSS);
css.walkRules(rule => {
  if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
  rule.selectors = rule.selectors.flatMap(selector => {
    selector = selector.replace(/\.home-guide h2/g, '.home-guide :is(h1,h2)');
    selector = selector.replace(/(\.home-about-grid[^,]*?article[^,]*?)h3/g, '$1:is(h2,h3)');
    if (selector === ':host') return [scope];
    if (selector === '*') return [scope, scope + ' *'];
    return /^[.\[:#]/.test(selector) ? [scope + selector, scope + ' ' + selector] : [scope + ' ' + selector];
  });
});
css.append({ selector: '#sr-home-native-source > .home-value', nodes: [{ prop: 'width', value: 'min(1376px,calc(100% - 32px))' }, { prop: 'margin', value: '24px auto' }] });
css.append({ selector: scope + '.home-guide .home-about-grid>article:has(.home-picks:empty)', nodes: [{ prop: 'display', value: 'block' }] });
// In light DOM, Wix heading and paragraph colours override inherited card white.
css.append({ selector: '[data-sr-native-home] :is(.card-copy,.dest) :is(h3,p)', nodes: [{ prop: 'color', value: '#fff' }] });
css.append({ selector: 'body:has(#sr-home-native-source) #SITE_CONTAINER', nodes: [{ prop: 'display', value: 'none!important' }] });

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/sr-home-native-20261012.html'), fragment + '\n');
const discoveryCSS = fs.readFileSync(path.join(root, 'content/home-discovery-20261012.css'), 'utf8');
fs.writeFileSync(path.join(root, 'dist/sr-home-native-20261012.css'), css.toString() + '\n' + discoveryCSS);
console.log(JSON.stringify({ fragmentCharacters: fragment.length, stylesheetCharacters: css.toString().length }));
