// Spin Raiders map and search, rebuilt from the live spin-raiders.com /map and /search pages.
// Both read the same directory collections; the map uses Leaflet and OpenStreetMap tiles like the live page.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import clsx from 'clsx';
import { items as dataItems } from '@wix/data';
import styles from './explorer.module.css';
import type { ExplorerProps } from './explorer.props';

type Row = Record<string, any>;
type Place = { key: string; c: string; name: string; town: string; kind: string; cat: string; link: string; image: string; rating: number; reviews: number; lat?: number; lng?: number; approx?: boolean; text: string };
const COLS: Array<[string, string]> = [['Venues', '/venue'], ['NearbyAttractions', '/attraction'], ['HotelGuides', '/hotel'], ['FoodAndDrink', '/food-and-drink'], ['Locations', '/destination']];
const MAPCATS: Array<[string, string, string]> = [
  ['seaside', 'Arcades (Seaside)', '#06a56b'], ['classic', 'Classic Arcades', '#ff8600'], ['agc', '18+ Adult Gaming (AGC)', '#ed1642'], ['merkur', '18+ Merkur', '#f7b500'],
  ['admiral', '18+ Admiral', '#063dc7'], ['casino', 'Other Casinos', '#9427d3'], ['bingo', 'Bingo', '#f7008b'], ['cinema', 'Cinemas', '#0659d9'], ['bowling', 'Bowling', '#008f68'],
  ['holiday', 'Holiday Parks', '#049967'], ['hotel', 'Hotels', '#7825cc'], ['attraction', 'Attractions', '#ff8200'], ['food', 'Food & Drink', '#ff6500'], ['service', 'Service Stations', '#008b67'], ['other', 'Other', '#506a85'],
];
// Same order of rules as the live map.
function mapCat(e: Row, c: string): string {
  const t = [e.category, e.venueType, e.title, e.brand, e.agcBrand].map((x) => (typeof x === 'string' ? x : '')).join(' ').toLowerCase();
  const cv = String(e.category || e.venueType || '').toLowerCase();
  if (c === 'FoodAndDrink') return 'food';
  if (/service station|motorway services|^services?$/.test(cv)) return 'service';
  if (c === 'HotelGuides') return 'hotel';
  if (/merkur/.test(t)) return 'merkur';
  if (/admiral/.test(t)) return 'admiral';
  if (/service station|motorway services/.test(t)) return 'service';
  if (/bingo/.test(t)) return 'bingo';
  if (/cinema/.test(t)) return 'cinema';
  if (/bowling/.test(t)) return 'bowling';
  if (/casino/.test(t)) return 'casino';
  if (/holiday park|caravan|camping/.test(t)) return 'holiday';
  if (/hotel|guest house|b&b|accommodation/.test(t)) return 'hotel';
  if (/restaurant|cafe|café|food|drink|pub|chippy/.test(t)) return 'food';
  if (/classic/.test(t)) return 'classic';
  if (/adult gaming|agc/.test(t)) return 'agc';
  if (c === 'Venues') return 'seaside';
  if (c === 'NearbyAttractions') return 'attraction';
  return 'other';
}
const SEARCHCATS: Array<[string, string, RegExp]> = [
  ['venues', 'Arcades & Venues', /^Venues$/], ['stays', 'Places to Stay', /hotel|holiday|caravan|guest house|stay/i], ['food', 'Eat & Drink', /food|drink|restaurant|cafe|café|pub/i],
  ['attractions', 'Attractions & Family Fun', /^NearbyAttractions$/], ['cinemas', 'Cinemas', /cinema/i], ['outdoors', 'Nature & Outdoors', /park|garden|nature|walk|beach|country|wood|forest|lake|reserve/i],
  ['fishing', 'Fishing Lakes', /fish/i], ['golf', 'Golf', /golf/i], ['bowling', 'Bowling', /bowl/i], ['bingo', 'Bingo', /bingo/i], ['agc', 'Adult Gaming Centres', /adult gaming|agc/i],
  ['casinos', 'Casinos', /casino/i], ['holiday', 'Holiday Parks', /holiday park|caravan/i], ['arcadebars', 'Arcade Bars', /arcade bar|games bar|gaming bar/i], ['theme', 'Theme Parks', /theme park|pleasure beach|adventure park/i],
  ['zoos', 'Zoos & Wildlife', /zoo|wildlife|safari/i], ['sealife', 'Sea Life & Aquariums', /sea life|aquarium/i], ['museums', 'Museums', /museum/i], ['towns', 'Towns', /^Locations$/],
];
const TABS = ['All Results', 'Places to Stay', 'Eat & Drink', 'Attractions & Family Fun', 'Cinemas', 'Nature & Outdoors', 'Fishing Lakes'];
const TABKEY: Record<string, string> = { 'Places to Stay': 'stays', 'Eat & Drink': 'food', 'Attractions & Family Fun': 'attractions', Cinemas: 'cinemas', 'Nature & Outdoors': 'outdoors', 'Fishing Lakes': 'fishing' };
const TOWNS: Array<[string, string]> = [['Blackpool', '/destination/blackpool'], ['Skegness', '/destination/skegness'], ['Great Yarmouth', '/destination/great-yarmouth'], ['Southend', '/destination/southend-on-sea'], ['Hotels', '/places-to-stay'], ['Arcades', '/arcade']];
const str = (v: unknown) => (typeof v === 'string' ? v : '');
function photo(v: unknown, w = 480): string {
  const s = str(v);
  const m = s.match(/^wix:image:\/\/v1\/([^/#]+)/) || s.match(/^https:\/\/static\.wixstatic\.com\/media\/([^/?#]+)/);
  return m ? `https://static.wixstatic.com/media/${m[1]}/v1/fill/w_${w},h_${Math.round(w * 0.66)},q_80/p.webp` : '';
}
function qparam(): string { try { return new URLSearchParams(window.location.search).get('q') || ''; } catch { return ''; } }

let cache: Promise<Place[]> | null = null;
function loadAll(): Promise<Place[]> {
  if (cache) return cache;
  cache = (async () => {
    const towns = new Map<string, [number, number]>();
    const out: Place[] = [];
    for (const [c, prefix] of COLS.slice().reverse()) {
      let res: any;
      try { res = await dataItems.query(c).limit(1000).find(); } catch { continue; }
      const rows: Row[] = [...res.items];
      while (res.hasNext() && rows.length < 6000) { res = await res.next(); rows.push(...res.items); }
      for (const r of rows) {
        if (r.directoryReady === false) continue;
        const name = String(r.displayTitle || r.title || r.name || '');
        if (!name) continue;
        const town = String(r.town || r.locationName || r.destination || (c === 'Locations' ? r.title : '') || '');
        let lat = typeof r.latitude === 'number' ? r.latitude : undefined; let lng = typeof r.longitude === 'number' ? r.longitude : undefined; let approx = false;
        if (c === 'Locations' && lat !== undefined && lng !== undefined) towns.set(name.toLowerCase(), [lat, lng]);
        if ((lat === undefined || lng === undefined) && towns.has(town.toLowerCase())) { [lat, lng] = towns.get(town.toLowerCase()) as [number, number]; approx = true; }
        const kind = c === 'Locations' ? 'Town' : String(r.category || r.venueType || (c === 'HotelGuides' ? 'Place to stay' : c === 'FoodAndDrink' ? 'Food & drink' : ''));
        out.push({ key: c + ':' + r._id, c, name, town, kind, cat: mapCat(r, c), link: `${prefix}/${r._slug || r.slug || ''}`, image: photo(r.cardImage || r.heroImage), rating: typeof r.publicRating === 'number' ? r.publicRating : 0, reviews: typeof r.publicReviewCount === 'number' ? r.publicReviewCount : 0, lat, lng, approx, text: [name, town, kind, r.region, r.county, r.shortDescription].map(str).join(' ').toLowerCase() });
      }
    }
    return out;
  })();
  return cache;
}
const matchWords = (p: Place, q: string) => q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => p.text.includes(w));
const searchCat = (p: Place, key: string) => { const c = SEARCHCATS.find((x) => x[0] === key); if (!c) return true; return c[2].test(p.c) || c[2].test(p.kind + ' ' + p.name); };

function SearchView() {
  const [all, setAll] = useState<Place[] | null>(null);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [sort, setSort] = useState('relevant');
  const [list, setList] = useState(false);
  const [page, setPage] = useState(1);
  useEffect(() => { const v = qparam(); setQ(v); setApplied(v); void loadAll().then(setAll, () => setAll([])); }, []);
  const hits = useMemo(() => {
    if (!all) return [];
    let h = all.filter((p) => (!applied || matchWords(p, applied)) && (!picked.length || picked.some((k) => searchCat(p, k))));
    if (sort === 'rating') h = [...h].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
    else if (sort === 'name') h = [...h].sort((a, b) => a.name.localeCompare(b.name));
    else if (applied) { const w = applied.toLowerCase(); h = [...h].sort((a, b) => Number(b.name.toLowerCase().includes(w)) - Number(a.name.toLowerCase().includes(w)) || Number(b.town.toLowerCase() === w) - Number(a.town.toLowerCase() === w)); }
    return h;
  }, [all, applied, picked, sort]);
  useEffect(() => setPage(1), [applied, picked, sort]);
  const per = 12; const pages = Math.max(1, Math.ceil(hits.length / per)); const cur = Math.min(page, pages);
  const go = (v: string) => { setApplied(v.trim()); try { window.history.replaceState(null, '', v.trim() ? `?q=${encodeURIComponent(v.trim())}` : window.location.pathname); } catch { /* ignore */ } };
  const tab = (t: string) => setPicked(TABKEY[t] ? [TABKEY[t]] : []);
  return (
    <div>
      <section className={styles.hero}>
        <h1 className={styles.heroH}>⌕ Search for a town, venue or attraction</h1>
        <form className={styles.searchBar} onSubmit={(e) => { e.preventDefault(); go(q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a town, venue or attraction…" aria-label="Search" />
          <button className={clsx(styles.button, styles.pink)}>Search →</button>
        </form>
        <div className={styles.chips}>{TOWNS.map(([t, u]) => <a key={t} href={u}>{t}</a>)}</div>
      </section>
      <div className={styles.tabs}>{TABS.map((t) => <button key={t} type="button" className={clsx(styles.tab, ((t === 'All Results' && !picked.length) || (picked.length === 1 && TABKEY[t] === picked[0])) && styles.tabOn)} onClick={() => tab(t)}>{t}</button>)}</div>
      <div className={styles.head}>
        <h1 className={styles.h1}>{applied ? `Search results for “${applied}”` : 'Search results for your next adventure'}</h1>
        <div className={styles.tools}>
          <label>Sort by <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="relevant">Most relevant</option><option value="rating">Highest rated</option><option value="name">Name A–Z</option></select></label>
          <button type="button" className={clsx(styles.tool, !list && styles.toolOn)} onClick={() => setList(false)}>▦ Grid</button>
          <button type="button" className={clsx(styles.tool, list && styles.toolOn)} onClick={() => setList(true)}>☷ List</button>
          <a className={clsx(styles.tool, styles.toolOn)} href={`/map${applied ? '?q=' + encodeURIComponent(applied) : ''}`}>◫ Show map</a>
        </div>
      </div>
      <div className={styles.body}>
        <aside className={styles.side}>
          <h2>Filter by</h2>
          {SEARCHCATS.map(([k, l]) => <label key={k} className={styles.check}><input type="checkbox" checked={picked.includes(k)} onChange={() => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))} />{l}</label>)}
          <button type="button" className={clsx(styles.button, styles.white)} onClick={() => { setPicked([]); setQ(''); go(''); }}>↻ Reset filters</button>
        </aside>
        <div className={styles.main}>
          <p className={styles.count} role="status">{all ? `${hits.length.toLocaleString('en-GB')} ${hits.length === 1 ? 'result' : 'results'} found` : 'Loading places…'}</p>
          <div className={list ? styles.list : styles.grid}>
            {hits.slice((cur - 1) * per, cur * per).map((p) => (
              <a key={p.key} href={p.link} className={styles.card}>
                {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span className={styles.noimg}>⌖</span>}
                <span className={styles.cardBody}><strong>{p.name} →</strong><small>⌖ {p.town || 'UK'}{p.kind ? ' · ' + p.kind : ''}</small><small>{p.rating ? `★ ${p.rating.toFixed(1)}${p.reviews ? ` (${p.reviews.toLocaleString('en-GB')} reviews)` : ''}` : 'No public rating yet.'}</small></span>
              </a>
            ))}
          </div>
          {pages > 1 && <div className={styles.pager}><button type="button" className={clsx(styles.button, styles.white)} onClick={() => setPage(Math.max(1, cur - 1))}>← Previous</button><span>Page {cur} of {pages}</span><button type="button" className={clsx(styles.button, styles.white)} onClick={() => setPage(Math.min(pages, cur + 1))}>Next →</button></div>}
        </div>
      </div>
    </div>
  );
}


const REPORT_TYPES = ['Machine changes', 'Ownership change', 'Add a venue', 'Venue closed or no longer exists', 'Incorrect details or photograph', 'Other change'];
function ReportView() {
  const qp = (k: string) => { try { return new URLSearchParams(window.location.search).get(k) || ''; } catch { return ''; } };
  const [f, setF] = useState({ reportType: '', venueName: '', pageUrl: '', details: '', contactEmail: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF((x) => ({ ...x, venueName: qp('venue'), pageUrl: qp('page') })); }, []);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    let last = 0; try { last = Number(window.localStorage.getItem('sr-report-last')) || 0; } catch { /* ignore */ }
    if (Date.now() - last < 60000) { setMsg('Your report has been sent. Please wait a minute before sending another.'); return; }
    setBusy(true); setMsg('Sending your report…');
    const v = Object.fromEntries(Object.entries(f).map(([k, x]) => [k, x.trim()])) as typeof f;
    try {
      await dataItems.insert('SpinRaidersChangeReports', { ...v, title: `${v.reportType} — ${v.venueName}`, submittedAt: new Date().toISOString(), status: 'NEW' });
      try { window.localStorage.setItem('sr-report-last', String(Date.now())); } catch { /* ignore */ }
      setF({ reportType: '', venueName: '', pageUrl: '', details: '', contactEmail: '' });
      setMsg('Thank you. Your report has been sent and will be reviewed before the directory is changed.');
    } catch { setMsg('The report could not be sent just now. Please try again.'); }
    setBusy(false);
  };
  return (
    <div className={styles.report}>
      <h1 className={styles.h1}>Help keep Spin Raiders <span className={styles.accent}>up to date</span></h1>
      <p className={styles.lead2}>Tell us about a machine change, a new venue, a new owner or a closure.</p>
      <form className={styles.reportForm} onSubmit={(e) => { void send(e); }}>
        <label>What would you like to report?<select required value={f.reportType} onChange={set('reportType')}><option value="">Choose a report type</option>{REPORT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label>Venue or machine name<input required maxLength={200} autoComplete="off" value={f.venueName} onChange={set('venueName')} /></label>
        <label>Relevant page or website<input type="url" maxLength={1500} placeholder="https://" value={f.pageUrl} onChange={set('pageUrl')} /></label>
        <label>What has changed?<textarea required minLength={15} maxLength={5000} rows={7} placeholder="Include the location, what changed and any supporting links." value={f.details} onChange={set('details')} /></label>
        <label>Your email (optional)<input type="email" maxLength={254} autoComplete="email" value={f.contactEmail} onChange={set('contactEmail')} /></label>
        <p className={styles.small}>Reports are reviewed before the directory is changed. Your email is only used if we need to follow up. <a href="/privacy-policy">Privacy policy</a></p>
        <button className={clsx(styles.button, styles.red)} disabled={busy}>Send report →</button>
        <p className={styles.count} role="status" aria-live="polite">{msg}</p>
      </form>
    </div>
  );
}

declare global { interface Window { L?: any } }
function loadLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((ok, bad) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.onload = () => ok(window.L); s.onerror = bad; document.head.appendChild(s);
  });
}
function MapView() {
  const box = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layer = useRef<any>(null);
  const [all, setAll] = useState<Place[] | null>(null);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [on, setOn] = useState<string[]>(MAPCATS.map((c) => c[0]));
  const [shown, setShown] = useState<string[]>(MAPCATS.map((c) => c[0]));
  const [failed, setFailed] = useState(false);
  const [here, setHere] = useState<[number, number] | null>(null);
  const [geoMsg, setGeoMsg] = useState('');
  useEffect(() => { const v = qparam(); setQ(v); setApplied(v); void loadAll().then(setAll, () => setAll([])); }, []);
  const pins = useMemo(() => (all || []).filter((p) => p.lat !== undefined && p.lng !== undefined && p.c !== 'Locations' && shown.includes(p.cat) && (!applied || matchWords(p, applied))), [all, shown, applied]);
  useEffect(() => {
    let live = true;
    loadLeaflet().then((L) => {
      if (!live || !box.current || mapRef.current) return;
      mapRef.current = L.map(box.current, { scrollWheelZoom: true }).setView([54.3, -2.6], 6);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(mapRef.current);
      layer.current = L.layerGroup().addTo(mapRef.current);
    }, () => setFailed(true));
    return () => { live = false; };
  }, []);
  useEffect(() => {
    const L = window.L; if (!L || !layer.current) return;
    layer.current.clearLayers();
    const colour = (c: string) => (MAPCATS.find((x) => x[0] === c) || MAPCATS[MAPCATS.length - 1])[2];
    const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] as string));
    for (const p of pins.slice(0, 4000)) {
      const m = L.circleMarker([p.lat, p.lng], { radius: 7, color: '#fff', weight: 2, fillColor: colour(p.cat), fillOpacity: 0.95 });
      m.bindPopup(`<strong>${esc(p.name)}</strong><br>${esc(p.town)}${p.kind ? ' · ' + esc(p.kind) : ''}${p.approx ? '<br><small>Pin shows the town centre.</small>' : ''}<br><a href="${esc(p.link)}">View details →</a>`);
      layer.current.addLayer(m);
    }
    if (applied && pins.length && mapRef.current) mapRef.current.fitBounds(pins.map((p) => [p.lat, p.lng]), { maxZoom: 13, padding: [30, 30] });
  }, [pins, applied, all]);
  const dist = (p: Place) => (here && p.lat !== undefined && p.lng !== undefined ? Math.hypot((p.lat - here[0]) * 69, (p.lng - here[1]) * 69 * Math.cos((here[0] * Math.PI) / 180)) : 0);
  const listed = useMemo(() => (here ? [...pins].sort((a, b) => dist(a) - dist(b)) : pins), [pins, here]);
  const locate = () => {
    if (!navigator.geolocation) { setGeoMsg('This browser cannot share your location.'); return; }
    setGeoMsg('Finding your location…');
    navigator.geolocation.getCurrentPosition((pos) => {
      const at: [number, number] = [pos.coords.latitude, pos.coords.longitude]; setHere(at); setGeoMsg('Showing places nearest to you. Distances are straight-line estimates.');
      if (mapRef.current) mapRef.current.setView(at, 12);
    }, () => setGeoMsg('Your location was not shared. Search for a town instead.'));
  };
  const fly = (p: Place) => { if (mapRef.current && p.lat !== undefined) { mapRef.current.setView([p.lat, p.lng], 14); } };
  return (
    <div className={styles.mapWrap}>
      <aside className={styles.mapSide}>
        <h1 className={styles.mapH}>Explore the UK Map</h1>
        <form className={styles.mapSearch} onSubmit={(e) => { e.preventDefault(); setApplied(q.trim()); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a town, venue or attraction…" aria-label="Search the map" />
          <button aria-label="Search">⌕</button>
        </form>
        <div className={styles.row}><strong>Categories</strong><button type="button" className={styles.link} onClick={() => setOn(MAPCATS.map((c) => c[0]))}>Select all</button></div>
        {MAPCATS.map(([k, l, col]) => <label key={k} className={styles.mapCat}><span className={styles.dot} style={{ background: col }} />{l}<input type="checkbox" checked={on.includes(k)} onChange={() => setOn((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))} /></label>)}
        <button type="button" className={clsx(styles.button, styles.full)} onClick={() => { setShown(on); setApplied(q.trim()); }}>Update Map ↻</button>
        <button type="button" className={clsx(styles.button, styles.white, styles.full)} onClick={() => { const a = MAPCATS.map((c) => c[0]); setOn(a); setShown(a); setQ(''); setApplied(''); if (mapRef.current) mapRef.current.setView([54.3, -2.6], 6); }}>Reset Filters</button>
        <button type="button" className={clsx(styles.button, styles.white, styles.full)} onClick={locate}>⌖ Use my location</button>
        {geoMsg && <p className={styles.small}>{geoMsg}</p>}
        <p className={styles.count} role="status">{all ? `${pins.length.toLocaleString('en-GB')} places on the map` : 'Loading places…'}</p>
        <div className={styles.mapList}>{listed.slice(0, 200).map((p) => <button key={p.key} type="button" onClick={() => fly(p)}><strong>{p.name}</strong><small>{p.town}{here ? ` · ${dist(p).toFixed(1)} miles` : ''}</small></button>)}</div>
      </aside>
      <div className={styles.mapBox}>
        <div ref={box} className={styles.leaflet} />
        {failed && <p className={styles.status}>The map could not load. The list of places still works.</p>}
      </div>
    </div>
  );
}

const Explorer: FC<ExplorerProps> = ({ id, className, mode, direction }) => (
  <div id={id} dir={direction} className={clsx('explorer', styles.root, className)}>
    {mode === 'map' ? <MapView /> : mode === 'report' ? <ReportView /> : <SearchView />}
  </div>
);

export default Explorer;
