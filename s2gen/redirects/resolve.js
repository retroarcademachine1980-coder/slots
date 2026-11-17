// Build the next redirect list: old sitemap addresses still 404, then old-site redirect sources, resolved to a working new page.
const fs = require('fs');
const all = JSON.parse(fs.readFileSync('/tmp/redir_all.json'));
const norm = p => decodeURIComponent(p).replace(/\/$/, '').toLowerCase();
const map = new Map();
for (const [f, t] of all) if (!map.has(norm(f))) map.set(norm(f), t);
const old = new Map();
for (const l of fs.readFileSync('/tmp/rd/oldredir.tsv', 'utf8').split('\n')) { const [f, t, g] = l.split('\t'); if (f && t && g === 'e') old.set(norm(f), t); }
const done = new Set(fs.readFileSync('/tmp/rd/done.tsv', 'utf8').split('\n').filter(Boolean).map(l => norm(l.split('\t')[0])));
const newPrefixes = /^\/(venue|attraction|hotel|fruit-machine|offer|destination|food-and-drink)\//;
const statics = { '/food-and-drink': '/where-to-eat', '/seaside-arcades': '/arcade', '/ticket-arcades': '/arcade', '/coin-pusher-arcades': '/arcade', '/wheelchair-friendly-arcades': '/arcade', '/dog-friendly-arcades': '/arcade', '/blackpool-arcades': '/destination/blackpool', '/retro-slots-blackpool': '/retro-arcades', '/classic-arcades': '/retro-arcades', '/arcade-venues': '/arcade', '/arcades': '/arcade', '/nearby-attractions': '/attractions', '/classic-fruit-machine-archive': '/classic-fruit-machines', '/classic-fruit-machine-archive-1': '/classic-fruit-machines', '/hotels': '/places-to-stay', '/where-to-eat-1': '/where-to-eat' };
function resolve(p, d = 0) {
  const n = norm(p);
  if (statics[n]) return statics[n];
  if (map.has(n)) return map.get(n);
  if (newPrefixes.test(n) && !/^\/food-and-drink\/[^/]+\/[^/]+$/.test(n)) return p; // already a new-style address
  if (old.has(n) && d < 4) return resolve(old.get(n), d + 1);
  return null;
}
const broken = fs.readFileSync('/tmp/rd/sm_chk.txt', 'utf8').split('\n').filter(l => l.startsWith('404 ')).map(l => l.slice(4));
const rows = [], seen = new Set(), miss = {};
const add = (f, tier) => { const n = norm(f); if (seen.has(n) || done.has(n)) return; seen.add(n); const t = resolve(f); if (!t || norm(t) === n) { const k = n.split('/')[1]; miss[k] = (miss[k] || 0) + 1; return; } rows.push([f, t, tier]); };
for (const f of broken) add(f, 'sitemap');
for (const s of Object.keys(statics)) add(s, 'static');
for (const f of old.keys()) add(f, 'oldredir');
fs.writeFileSync('/tmp/rd/next.tsv', rows.map(r => r.join('\t')).join('\n') + '\n');
const by = {}; for (const r of rows) by[r[2]] = (by[r[2]] || 0) + 1;
console.log('rows', rows.length, JSON.stringify(by), 'unresolved', JSON.stringify(miss));
