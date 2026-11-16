// Spin Raiders trip builder and fuel price finder, rebuilt from the live spin-raiders.com planner:
// trip details, add places from the directory, a day-by-day itinerary, a driving route, estimated costs,
// save / share / print / export, and reported pump prices from the GOV.UK Fuel Finder feed.
import React, { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import clsx from 'clsx';
import { items as dataItems } from '@wix/data';
import styles from './trip-builder.module.css';
import type { TripBuilderProps } from './trip-builder.props';

type Row = Record<string, any>;
type Stop = { key: string; name: string; town: string; kind: string; link: string; image: string };
type Plan = {
  tripTitle: string; startDate: string; endDate: string; people: number; days: number; nights: number; rooms: number;
  dayStops: Stop[][]; hotel: number; food: number; activities: number; miles: number; other: number; from: string;
  train: number; bus: number; taxis: number; carHire: number; fuelType: string; mpg: number; fuelPrice: number;
};
type Station = { name: string; brand: string; postcode: string; address: string; town: string; lat: number; lng: number; price: number; when: string };

const FEED = 'https://cdn.jsdelivr.net/gh/retroarcademachine1980-coder/slots@main/dist/fuel-prices/';
const GRADES: Array<[string, string]> = [['E10', 'Petrol E10'], ['E5', 'Petrol E5'], ['B7S', 'Diesel B7'], ['B7P', 'Premium diesel B7']];
const SOURCES: Record<string, { c: string; prefix: string; kind: string }> = {
  NearbyAttractions: { c: 'NearbyAttractions', prefix: '/attraction', kind: 'Things to do' },
  Venues: { c: 'Venues', prefix: '/venue', kind: 'Arcade' },
  FoodAndDrink: { c: 'FoodAndDrink', prefix: '/food-and-drink', kind: 'Eat & drink' },
  HotelGuides: { c: 'HotelGuides', prefix: '/hotel', kind: 'Place to stay' },
  Locations: { c: 'Locations', prefix: '/destination', kind: 'Town' },
};
const CATS: Array<{ label: string; cols: string[]; word?: RegExp }> = [
  { label: 'All', cols: ['NearbyAttractions', 'Venues', 'FoodAndDrink', 'HotelGuides', 'Locations'] },
  { label: 'Places to Stay', cols: ['HotelGuides'] },
  { label: 'Eat & Drink', cols: ['FoodAndDrink'] },
  { label: 'Things to Do', cols: ['NearbyAttractions'] },
  { label: 'Arcades & Bowling', cols: ['Venues'] },
  { label: 'Towns', cols: ['Locations'] },
  { label: 'Cinemas', cols: ['NearbyAttractions', 'Venues'], word: /cinema/i },
  { label: 'Nature & Outdoors', cols: ['NearbyAttractions'], word: /park|garden|nature|walk|beach|country|wood|forest|lake|reserve/i },
  { label: 'Fishing Lakes', cols: ['NearbyAttractions', 'Venues'], word: /fish/i },
];
const MORE = [['Golf', /golf/i], ['Bowling', /bowl/i], ['Bingo', /bingo/i], ['Adult Gaming Centres', /adult gaming|agc/i], ['Casinos', /casino/i]] as Array<[string, RegExp]>;

const blank = (): Plan => ({ tripTitle: '', startDate: '', endDate: '', people: 1, days: 1, nights: 0, rooms: 1, dayStops: [[]], hotel: 0, food: 0, activities: 0, miles: 0, other: 0, from: '', train: 0, bus: 0, taxis: 0, carHire: 0, fuelType: 'Petrol', mpg: 40, fuelPrice: 0 });
const num = (v: string) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : 0; };
const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const str = (v: unknown) => (typeof v === 'string' ? v : '');
function photo(v: unknown): string {
  const s = str(v);
  const m = s.match(/^wix:image:\/\/v1\/([^/#]+)/);
  if (m) return `https://static.wixstatic.com/media/${m[1]}/v1/fill/w_160,h_110,q_80/p.webp`;
  return /^https:\/\/static\.wixstatic\.com\/media\//.test(s) ? s : '';
}
function readStore<T>(k: string, d: T): T { try { const v = window.localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } }
function writeStore(k: string, v: unknown): boolean { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
const ukDate = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' }); };

function FuelFinder({ start, onUse }: { start: string; onUse?: (price: number, grade: string) => void }) {
  const [place, setPlace] = useState(start);
  const [grade, setGrade] = useState('E10');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [feedNote, setFeedNote] = useState('');
  const [list, setList] = useState<Station[]>([]);
  async function find(q: string, g: string) {
    const raw = q.trim();
    if (!raw) { setMsg('Type a town or postcode district, such as Blackpool or FY1.'); return; }
    setBusy(true); setMsg('Looking up reported pump prices…'); setList([]);
    try {
      const pc = raw.toUpperCase().replace(/\s+/g, '').match(/^([A-Z]{1,2})(\d[A-Z\d]?)?$/);
      let areas: string[] = []; let townName = '';
      if (pc && pc[2]) areas = [pc[1]];
      else {
        const man = await (await fetch(FEED + 'manifest.json')).json();
        const hit = man.towns && man.towns[raw.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()];
        if (hit) { townName = String(hit[0]); areas = hit[1]; }
      }
      if (!areas.length) { setMsg(`No fuel stops are listed for “${raw}”. Try the postcode district, such as FY1.`); setBusy(false); return; }
      const files = await Promise.all(areas.slice(0, 4).map((a) => fetch(FEED + a + '.json').then((r) => r.json())));
      const out: Station[] = [];
      let published = '';
      for (const f of files) {
        published = f.publishedAt || published;
        for (const s of f.stations as any[]) {
          const p = s[8] && s[8][g];
          if (!p) continue;
          const okPlace = pc && pc[2] ? String(s[3]).toUpperCase().split(' ')[0] === pc[1] + pc[2] : String(s[5]).toUpperCase() === (townName || raw).toUpperCase();
          if (okPlace) out.push({ name: s[1], brand: s[2], postcode: s[3], address: s[4], town: s[5], lat: s[6], lng: s[7], price: Number(p[0]), when: p[1] });
        }
      }
      out.sort((a, b) => a.price - b.price);
      const label = (GRADES.find((x) => x[0] === g) || ['', g])[1];
      setList(out.slice(0, 8));
      setMsg(out.length ? `${label} · ${townName || raw.toUpperCase()} · ${out.length} matching fuel stops. Showing ${Math.min(8, out.length)} lowest listed prices for this search.` : `No ${label} prices are listed for “${raw}” right now.`);
      setFeedNote(published ? `Feed updated ${ukDate(published)} UK time. Station report dates are separate: a price is what the station last reported.` : '');
    } catch { setMsg('Fuel prices could not load just now. Please try again.'); }
    setBusy(false);
  }
  useEffect(() => { if (start) void find(start, 'E10'); }, [start]);
  return (
    <section className={clsx('fuel', styles.fuel)} id="fuel-prices">
      <h2 className={styles.h2}>Fuel for the journey</h2>
      <p className={styles.lead}>A little planning leaves more in the day-out budget. Compare reported pump prices by town or postcode district.</p>
      <form className={styles.fuelForm} onSubmit={(e) => { e.preventDefault(); void find(place, grade); }}>
        <label className={styles.field}>Town or postcode district<input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Blackpool or FY1" /></label>
        <label className={styles.field}>Fuel grade<select value={grade} onChange={(e) => setGrade(e.target.value)}>{GRADES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <button className={clsx(styles.button, styles.pink)} disabled={busy}>Find fuel prices</button>
      </form>
      {msg && <p className={styles.status} role="status">{msg}</p>}
      {feedNote && <p className={styles.small}>{feedNote}</p>}
      <div className={styles.fuelGrid}>
        {list.map((s) => (
          <article key={s.name + s.postcode} className={styles.fuelCard}>
            <h3>{s.name}</h3>
            <p>{s.address}, {s.town}, {s.postcode}</p>
            <strong>{s.price.toFixed(1)}p / litre</strong>
            <p className={styles.small}>Reported {ukDate(s.when)}</p>
            <div className={styles.row}>
              <a className={clsx(styles.button, styles.yellow)} href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noopener noreferrer">Directions ↗</a>
              {onUse && <button type="button" className={clsx(styles.button, styles.yellow)} onClick={() => onUse(s.price, grade)}>Use in my trip →</button>}
            </div>
          </article>
        ))}
      </div>
      <p className={styles.small}>Fuel price data from <a href="https://fuelcosts.co.uk/fuel-finder" target="_blank" rel="noopener noreferrer">FuelCosts.co.uk</a> and <a href="https://www.gov.uk/guidance/access-the-latest-fuel-prices-and-forecourt-data-via-api-or-email" target="_blank" rel="noopener noreferrer">UK Government Fuel Finder</a>. Contains public sector information licensed under the <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noopener noreferrer">Open Government Licence v3.0</a>.</p>
    </section>
  );
}

const TripBuilder: FC<TripBuilderProps> = ({ id, className, mode, town, direction }) => {
  const [plan, setPlan] = useState<Plan>(blank);
  const [day, setDay] = useState(0);
  const [cat, setCat] = useState(0);
  const [more, setMore] = useState('');
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Stop[]>([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState('');
  const set = <K extends keyof Plan>(k: K, v: Plan[K]) => setPlan((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (mode === 'fuel') return;
    try {
      const h = window.location.hash.match(/trip=([^&]+)/);
      if (h) { setPlan({ ...blank(), ...JSON.parse(decodeURIComponent(escape(window.atob(decodeURIComponent(h[1]))))) }); return; }
    } catch { /* bad link */ }
    const cur = readStore<Partial<Plan> | null>('sr-trip-current-v2', null);
    if (cur && Array.isArray(cur.dayStops)) setPlan({ ...blank(), ...cur });
  }, [mode]);
  useEffect(() => { if (mode !== 'fuel') writeStore('sr-trip-current-v2', plan); }, [plan, mode]);

  useEffect(() => {
    if (mode === 'fuel') return;
    let live = true;
    const t = setTimeout(async () => {
      setSearching(true);
      const c = CATS[cat];
      const word = more ? (MORE.find((m) => m[0] === more) || ['', /./])[1] : c.word;
      const cols = more ? ['NearbyAttractions', 'Venues'] : c.cols;
      const got: Stop[] = [];
      await Promise.all(cols.map(async (name) => {
        const src = SOURCES[name];
        try {
          let query = dataItems.query(src.c).limit(word ? 200 : 12);
          if (q.trim()) query = query.contains('title', q.trim());
          const res = await query.find();
          for (const r of res.items as Row[]) {
            if (r.directoryReady === false) continue;
            const hay = [r.title, r.category, r.venueType, r.shortDescription].map(str).join(' ');
            if (word && !word.test(hay)) continue;
            got.push({ key: name + ':' + r._id, name: String(r.displayTitle || r.title || r.name || ''), town: String(r.town || r.locationName || r.destination || ''), kind: src.kind, link: `${src.prefix}/${r._slug || r.slug || ''}`, image: photo(r.cardImage || r.heroImage) });
          }
        } catch { /* collection not readable */ }
      }));
      if (live) { setFound(got.slice(0, 24)); setSearching(false); }
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [q, cat, more, mode]);

  const allStops = plan.dayStops.flat();
  const route = useMemo(() => {
    const pts = allStops.map((s) => `${s.name}, ${s.town}`.replace(/, $/, ''));
    if (!pts.length) return '';
    const origin = plan.from.trim() || pts[0];
    const dest = pts[pts.length - 1];
    const way = (plan.from.trim() ? pts.slice(0, -1) : pts.slice(1, -1)).slice(0, 8);
    return `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}${way.length ? '&waypoints=' + encodeURIComponent(way.join('|')) : ''}`;
  }, [allStops, plan.from]);
  const mapQ = allStops.length ? `${allStops[0].name}, ${allStops[0].town}` : plan.from || 'United Kingdom';

  const litres = plan.mpg > 0 ? (plan.miles / plan.mpg) * 4.54609 : 0;
  const lines: Array<[string, number]> = [
    ['Hotel', plan.hotel * plan.rooms * plan.nights],
    ['Food', plan.food * plan.people * plan.days],
    ['Activities', plan.activities * plan.people * plan.days],
    ['Fuel', (litres * plan.fuelPrice) / 100],
    ['Trains', plan.train * plan.people],
    ['Buses & trams', plan.bus * plan.people],
    ['Taxis', plan.taxis],
    ['Car hire', plan.carHire],
    ['Other', plan.other],
  ];
  const total = lines.reduce((a, [, v]) => a + v, 0);

  function addStop(s: Stop) {
    setPlan((p) => { const d = p.dayStops.map((x) => x.slice()); const i = Math.min(day, d.length - 1); if (!d[i].some((x) => x.key === s.key)) d[i].push(s); return { ...p, dayStops: d }; });
    setStatus(`${s.name} added to Day ${day + 1}.`);
  }
  function moveStop(di: number, si: number, by: number) {
    setPlan((p) => { const d = p.dayStops.map((x) => x.slice()); const j = si + by; if (j < 0 || j >= d[di].length) return p; [d[di][si], d[di][j]] = [d[di][j], d[di][si]]; return { ...p, dayStops: d }; });
  }
  function removeStop(di: number, si: number) { setPlan((p) => { const d = p.dayStops.map((x) => x.slice()); d[di].splice(si, 1); return { ...p, dayStops: d }; }); }
  function addDay() { setPlan((p) => ({ ...p, dayStops: [...p.dayStops, []], days: Math.max(p.days, p.dayStops.length + 1) })); setDay(plan.dayStops.length); }
  function saveTrip() {
    const trips = readStore<Row[]>('sr-trips-v2', []);
    const idv = String(Date.now());
    const ok = writeStore('sr-trips-v2', [...trips.filter((t) => t.title !== (plan.tripTitle || 'My next adventure')), { id: idv, title: plan.tripTitle || 'My next adventure', startDate: plan.startDate, endDate: plan.endDate, updatedAt: new Date().toISOString(), plan }]);
    setStatus(ok ? 'Trip saved on this browser.' : 'This browser would not let the trip be saved.');
  }
  function shareTrip() {
    const link = `${window.location.origin}${window.location.pathname}#trip=${encodeURIComponent(window.btoa(unescape(encodeURIComponent(JSON.stringify(plan)))))}`;
    if (navigator.clipboard) navigator.clipboard.writeText(link).then(() => setStatus('Share link copied.'), () => setStatus(link));
    else setStatus(link);
  }
  function exportPlan() {
    const txt = [plan.tripTitle || 'My next adventure', plan.startDate && `${plan.startDate} to ${plan.endDate || plan.startDate}`, `${plan.people} people · ${plan.days} days · ${plan.nights} nights`, '',
      ...plan.dayStops.flatMap((d, i) => [`Day ${i + 1}`, ...(d.length ? d.map((s) => `- ${s.name}${s.town ? ' (' + s.town + ')' : ''} https://www.spin-raiders.com${s.link}`) : ['- nothing added yet']), '']),
      'Estimated costs', ...lines.filter(([, v]) => v > 0).map(([k, v]) => `${k}: ${gbp(v)}`), `Total: ${gbp(total)}`, route && `Driving route: ${route}`].filter((x) => typeof x === 'string' && x !== '').join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = (plan.tripTitle || 'trip-plan').replace(/[^\w-]+/g, '-') + '.txt'; a.click();
  }
  const numField = (label: string, k: keyof Plan, step = '1') => (
    <label className={styles.cost}>{label}<input type="number" min="0" step={step} value={String(plan[k])} onChange={(e) => set(k, num(e.target.value) as never)} /></label>
  );

  if (mode === 'fuel') return <div id={id} dir={direction} className={clsx('trip-builder', styles.root, className)}><FuelFinder start={town || ''} /></div>;
  return (
    <div id={id} dir={direction} className={clsx('trip-builder', styles.root, className)}>
      <header className={styles.hero}>
        <h1>TRIP BUILDER</h1>
        <p>Plan it. Save it. Live it.</p>
        <div className={styles.heroTags}><span>ARCADES</span><span>ATTRACTIONS</span><span>HOTELS</span><span>FOOD &amp; DRINK</span></div>
      </header>
      <ol className={styles.steps}>
        <li><b>1</b><span>Plan<small>Add places &amp; dates</small></span></li>
        <li><b>2</b><span>Build<small>Arrange your itinerary</small></span></li>
        <li><b>3</b><span>Review<small>Check your budget</small></span></li>
        <li><b>4</b><span>Save<small>Keep or share your trip</small></span></li>
      </ol>
      <section className={clsx(styles.panel, styles.details)}>
        <label className={clsx(styles.field, styles.wide)}>Trip name<input value={plan.tripTitle} placeholder="My next adventure" onChange={(e) => set('tripTitle', e.target.value)} /></label>
        <label className={styles.field}>Start date<input type="date" value={plan.startDate} onChange={(e) => set('startDate', e.target.value)} /></label>
        <label className={styles.field}>End date<input type="date" value={plan.endDate} onChange={(e) => set('endDate', e.target.value)} /></label>
        <label className={styles.field}>People<input type="number" min="1" value={plan.people} onChange={(e) => set('people', Math.max(1, num(e.target.value)))} /></label>
        <label className={styles.field}>Days<input type="number" min="1" value={plan.days} onChange={(e) => set('days', Math.max(1, num(e.target.value)))} /></label>
        <label className={styles.field}>Nights<input type="number" min="0" value={plan.nights} onChange={(e) => set('nights', num(e.target.value))} /></label>
        <label className={styles.field}>Rooms<input type="number" min="1" value={plan.rooms} onChange={(e) => set('rooms', Math.max(1, num(e.target.value)))} /></label>
      </section>
      <div className={styles.cols}>
        <section className={clsx(styles.panel, styles.add)}>
          <h2 className={styles.h3}>Add to Your Trip</h2>
          <input className={styles.search} value={q} placeholder="Search places, hotels, attractions…" aria-label="Search places" onChange={(e) => setQ(e.target.value)} />
          <div className={styles.cats}>{CATS.map((c, i) => <button key={c.label} type="button" className={clsx(styles.cat, i === cat && !more && styles.on)} onClick={() => { setCat(i); setMore(''); }}>{c.label}</button>)}</div>
          <label className={styles.field}>More categories<select value={more} onChange={(e) => setMore(e.target.value)}><option value="">Choose a category</option>{MORE.map(([m]) => <option key={m} value={m}>{m}</option>)}</select></label>
          <p className={styles.small}>Adding to Day {day + 1}</p>
          <ul className={styles.results}>
            {searching && <li className={styles.small}>Searching…</li>}
            {!searching && !found.length && <li className={styles.small}>No places match yet. Try another word.</li>}
            {found.map((s) => (
              <li key={s.key}>
                {s.image ? <img src={s.image} alt="" loading="lazy" /> : <span className={styles.noimg}>⌖</span>}
                <span><a href={s.link}>{s.name}</a><small>{s.kind}{s.town ? ' · ' + s.town : ''}</small></span>
                <button type="button" className={styles.plus} aria-label={`Add ${s.name}`} onClick={() => addStop(s)}>+</button>
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.itinerary}>
          <div className={styles.row}><h2 className={styles.h3}>Your Itinerary</h2><button type="button" className={clsx(styles.button, styles.white)} onClick={addDay}>+ Add day</button></div>
          {plan.dayStops.map((d, di) => (
            <div key={di} className={clsx(styles.day, di === day && styles.dayOn)} onClick={() => setDay(di)}>
              <h3>Day {di + 1}</h3>
              {!d.length && <p className={styles.small}>Add a place to start this day.</p>}
              <ol>{d.map((s, si) => (
                <li key={s.key}>
                  <span><a href={s.link}>{s.name}</a><small>{s.kind}{s.town ? ' · ' + s.town : ''}</small></span>
                  <span className={styles.ctrl}>
                    <button type="button" aria-label="Move up" onClick={() => moveStop(di, si, -1)}>↑</button>
                    <button type="button" aria-label="Move down" onClick={() => moveStop(di, si, 1)}>↓</button>
                    <button type="button" aria-label={`Remove ${s.name}`} onClick={() => removeStop(di, si)}>×</button>
                  </span>
                </li>
              ))}</ol>
            </div>
          ))}
        </section>
        <aside className={styles.aside}>
          <section className={styles.panel}>
            <h2 className={styles.h3}>Trip Map</h2>
            <iframe className={styles.map} title="Trip map" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(mapQ)}&output=embed`} />
            {route ? <a className={clsx(styles.button, styles.white)} href={route} target="_blank" rel="noopener noreferrer">Driving route ↗</a> : <p className={styles.small}>Add places to open a driving route.</p>}
            <p className={styles.small}>Open the driving route for current road distances and journey times.</p>
          </section>
          <section className={styles.panel}>
            <h2 className={styles.h3}>Estimated Costs</h2>
            <p className={styles.small}>Add your hotel and travel quotes. Fuel uses the price you enter or pick from the fuel finder below.</p>
            {numField('Hotel offer quote £ / room / night', 'hotel', '0.01')}
            {numField('Food £ / person / day', 'food', '0.01')}
            {numField('Activities £ / person / day', 'activities', '0.01')}
            {numField('Driving miles (whole trip)', 'miles')}
            {numField('Other costs £', 'other', '0.01')}
            <label className={styles.cost}>Travelling from (town or station)<input value={plan.from} placeholder="e.g. Grimsby" onChange={(e) => set('from', e.target.value)} /></label>
            {numField('Train tickets £ / person (whole trip)', 'train', '0.01')}
            {numField('Bus & tram fares £ / person (whole trip)', 'bus', '0.01')}
            {numField('Taxis £ / whole trip', 'taxis', '0.01')}
            {numField('Car hire £ / whole trip', 'carHire', '0.01')}
            <label className={styles.cost}>Fuel type<select value={plan.fuelType} onChange={(e) => set('fuelType', e.target.value)}><option>Petrol</option><option>Diesel</option></select></label>
            {numField('Vehicle MPG (UK)', 'mpg')}
            {numField('Fuel price p / litre', 'fuelPrice', '0.1')}
            <dl className={styles.totals}>
              {lines.filter(([, v]) => v > 0).map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{gbp(v)}</dd></React.Fragment>)}
              <dt className={styles.total}>Total</dt><dd className={styles.total}>{gbp(total)}</dd>
              <dt>Per person</dt><dd>{gbp(total / Math.max(1, plan.people))}</dd>
            </dl>
          </section>
          <button type="button" className={clsx(styles.button, styles.green, styles.full)} onClick={saveTrip}>▣ Save Trip</button>
          <div className={styles.row}>
            <button type="button" className={clsx(styles.button, styles.white)} onClick={shareTrip}>Share Trip</button>
            <button type="button" className={clsx(styles.button, styles.white)} onClick={() => window.print()}>Print / Save PDF</button>
            <button type="button" className={clsx(styles.button, styles.white)} onClick={exportPlan}>Export plan</button>
          </div>
          {status && <p className={styles.status} role="status">{status}</p>}
        </aside>
      </div>
      <FuelFinder start={town || ''} onUse={(p, g) => { setPlan((x) => ({ ...x, fuelPrice: p, fuelType: g.startsWith('B7') ? 'Diesel' : 'Petrol' })); setStatus(`Fuel price ${p.toFixed(1)}p added to your costs.`); }} />
    </div>
  );
};

export default TripBuilder;
