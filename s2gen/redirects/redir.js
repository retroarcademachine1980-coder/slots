// Build old->new redirect list from the old route manifest, then check old is 404 and new is 200 on the live site.
const fs = require('fs');
const dir = '/tmp/slots/src/public/routes/routeManifest.generated';
let all = [];
for (const f of fs.readdirSync(dir)) { const t = fs.readFileSync(dir + '/' + f, 'utf8'); const m = t.match(/export const manifestPart = (\[.*\]);?\s*$/s); if (m) all = all.concat(JSON.parse(m[1])); }
const pre = { Venues: 'venue', NearbyAttractions: 'attraction', HotelGuides: 'hotel', ClassicFruitMachines: 'fruit-machine', AffiliateOffers: 'offer' };
const canon = {}; // key -> new path
const rows = [];
for (const r of all) if (r.path) {
  const c = String(r.key).split(':')[0]; const p = r.path.split('/').filter(Boolean);
  let to = null;
  if (p.length === 3 && pre[c]) to = '/' + pre[c] + '/' + p[1] + '-' + p[2];
  else if (p.length === 2 && pre[c] && p[0] !== pre[c]) to = '/' + pre[c] + '/' + p[1];
  if (to) { canon[r.key] = to; rows.push([r.path, to, 'canon']); } else canon[r.key] = r.path;
}
for (const r of all) if (r.from && canon[r.key] && r.from !== canon[r.key]) rows.push([r.from, canon[r.key], 'alias']);
const seen = new Set(); const out = [];
for (const x of rows) { const k = x[0].replace(/\/$/, '').toLowerCase(); if (seen.has(k)) continue; seen.add(k); out.push(x); }
fs.writeFileSync('/tmp/redir_all.json', JSON.stringify(out));
console.log('rows', out.length, 'canon', out.filter(x => x[2] === 'canon').length);
