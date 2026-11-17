// All old addresses -> new page, for the not-found forwarder (covers what the 5,000 redirects can't).
const fs = require('fs');
const norm = p => { try { p = decodeURIComponent(p); } catch (e) {} return p.replace(/\/$/, '').toLowerCase(); };
const all = JSON.parse(fs.readFileSync('/tmp/redir_all.json'));
const map = new Map();
for (const [f, t] of all) if (!map.has(norm(f))) map.set(norm(f), t);
const old = new Map();
for (const l of fs.readFileSync('/tmp/rd/oldredir.tsv', 'utf8').split('\n')) { const [f, t, g] = l.split('\t'); if (f && t && g === 'e') old.set(norm(f), t); }
const out = new Map(map);
const newStyle = /^\/(venue|attraction|hotel|fruit-machine|offer|destination|food-and-drink)\/[^/]+$/;
function res(p, d) { const n = norm(p); if (map.has(n)) return map.get(n); if (newStyle.test(n)) return p; if (old.has(n) && d < 4) return res(old.get(n), d + 1); return null; }
for (const f of old.keys()) if (!out.has(f)) { const t = res(old.get(f), 0); if (t && norm(t) !== f) out.set(f, t); }
for (const l of fs.readFileSync('/tmp/rd/next.tsv', 'utf8').split('\n')) { const [f, t] = l.split('\t'); if (f && t && !out.has(norm(f))) out.set(norm(f), t); }
const rows = [...out.entries()].filter(([f, t]) => f && t && f.length < 250 && norm(t) !== f);
fs.writeFileSync('/tmp/rd/legacy.tsv', rows.map(r => r.join('\t')).join('\n') + '\n');
const seg = {}; for (const [f] of rows) { const k = f.split('/')[1]; seg[k] = (seg[k] || 0) + 1; }
console.log('rows', rows.length, JSON.stringify(Object.entries(seg).sort((a, b) => b[1] - a[1]).slice(0, 40)));
