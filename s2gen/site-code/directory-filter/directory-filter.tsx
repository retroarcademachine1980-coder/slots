// Directory filter: the same Category / Region-town / Facilities / sort / search panel as the live
// spin-raiders.com category pages. Loads the page's collection once, filters it with the live site's
// own matching rules, and hands the matching ids to the page's CMS list.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { items as dataItems } from '@wix/data';

const SLOTS = 20;
const FACILITIES = ['parking', 'wifi', 'dogFriendly', 'disabledAccess', 'familyFriendly'];
const FACILITY_NAMES = ['Parking', 'Wi-Fi', 'Dog friendly', 'Accessible entrance', 'Family friendly'];
const PATTERNS: Record<string, string> = {
  Beaches: 'beach', Cocktails: 'cocktails?', Pinball: 'pinball', 'Retro Games': 'retro|classic arcade|video games?',
  'Social Gaming': 'social gaming|games bar|gaming bar|shuffleboard|darts|beer pong|karaoke|arcade bar',
  'Live Events': 'live (?:music|events?|entertainment)|watch parties|f1 screenings?|dj sets?',
  Countryside: 'countryside|country park|mountain|moorland|heathland|country estate',
  Viewpoints: 'viewpoint|view point|lookout|viewing platform|panoramic|summit',
  'Places to Stay': 'hotel|stay|accommodation|holiday', 'Days Out': 'attraction|day out', 'Short Breaks': 'hotel|holiday|break',
  'Eat & Drink': 'food|drink|pub|restaurant|cafe', 'Family Fun': 'family|attraction', 'Tours & Experiences': 'tour|experience',
  'Food & Drink': 'food|drink|pub|restaurant|cafe', 'Walking & Hiking': 'walk|hiking|trail', 'Parks & Gardens': 'garden|park',
  'Forests & Woodlands': 'forest|woodland', Wildlife: 'wildlife|zoo|nature', 'National Parks': 'national park',
  'Nature Reserves': 'reserve', 'Water Activities': 'water|lake|boat', 'Family Friendly': 'family',
  'Independent AGCs': '^(?![\\s\\S]*(?:merkur|admiral|luxury leisure|quicksilver|cashino|game nation))[\\s\\S]*adult gaming',
  'Independent Arcades': 'arcade', 'Classic Machines': 'classic|retro|fruit', 'Modern Slots': 'adult gaming|slots',
  'Classic Arcades': 'classic|retro', 'Pier Arcades': 'pier', 'Bowling & Arcade': 'bowl',
  'Theme Parks': 'theme park|pleasure beach|adventure park|alton towers|thorpe park|legoland|drayton manor|chessington|paultons|flamingo land|lightwater|gulliver|fantasy island|m&d|funfair|rides',
  Arcades: 'arcade|amusement', 'Seaside Stays': 'hotel|guest house', 'Family Hotels': 'hotel', 'All Services': 'service', 'Machine Archive': 'classic|fruit',
};
type Row = Record<string, any>;
const str = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').join(' ') : typeof v === 'string' ? v : '');
// Same text the live site searches: name, category, venue type and place.
const haystack = (r: Row) => [r.displayTitle || r.title || r.name, r.category, r.venueType, r.locationName, r.destination, r.region, r.county, r.manufacturer, r.era].filter(Boolean).map(str).join(' ').toLowerCase();
const FEATURE_TOPIC = /^(?:Cocktails|Pinball|Social Gaming|Live Events|Retro Games|Walking & Hiking|Nature Reserves|Forests & Woodlands|Parks & Gardens|Countryside|Water Activities|Viewpoints)$/;
function topicMatch(r: Row, t: string): boolean {
  if (/^All /.test(t)) return true;
  const details = FEATURE_TOPIC.test(t) ? [r.shortDescription, str(r.features), str(r.facilities)].filter((v) => typeof v === 'string').join(' ') : '';
  if (t === 'Cocktails' && /\b(?:no|without)\s+(?:\w+\s+){0,2}cocktails?\b|\bcocktails?\s+(?:are\s+)?(?:not|unavailable)\b/i.test(details)) return false;
  const src = PATTERNS[t] || t.replace(/s$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(src, 'i').test(haystack(r) + ' ' + details);
}
function facilityMatch(r: Row, f: string): boolean {
  if (f === 'parking') return r.parking === true || r.parkingAvailable === true || r.freeParking === true;
  if (f === 'wifi') return r.wifi === true || r.freeWifi === true;
  return r[f] === true;
}

export interface CardImage { name: string; uri: string; width: number; height: number; alt: string; type: string; url: string }
export interface Card { title: string; town: string; rating: string; image: CardImage; link: { href: string; target: '_self' } }
export interface DirectoryFilterContextType {
  pageItems: Card[];
  countText: string; pageText: string; query: string; town: string; sortValue: string;
  toggleTopic: (t: string) => void;
  toggleFacility: (f: string) => void;
  setTown: (t: string) => void;
  setQuery: (q: string) => void;
  setSort: (s: string) => void;
  clearAll: () => void;
  prevPage: () => void;
  nextPage: () => void;
  topicLabel0: string;
  topicLabel1: string;
  topicLabel2: string;
  topicLabel3: string;
  topicLabel4: string;
  topicLabel5: string;
  topicLabel6: string;
  topicLabel7: string;
  topicLabel8: string;
  topicLabel9: string;
  topicLabel10: string;
  topicLabel11: string;
  topicLabel12: string;
  topicLabel13: string;
  topicLabel14: string;
  topicLabel15: string;
  topicLabel16: string;
  topicLabel17: string;
  topicLabel18: string;
  topicLabel19: string;
  facilityLabel0: string;
  facilityLabel1: string;
  facilityLabel2: string;
  facilityLabel3: string;
  facilityLabel4: string;
}
function wixImage(v: unknown, alt: string): CardImage {
  const fallback = '3a517e_c00db68d44ed453e96b9547639584056~mv2.jpg';
  let uri = fallback, w = 2752, h = 1100;
  if (typeof v === 'string') {
    const m = v.match(/^wix:image:\/\/v1\/([^/#]+)[^#]*(?:#originWidth=(\d+)&originHeight=(\d+))?/);
    if (m) { uri = m[1]; w = Number(m[2]) || 1200; h = Number(m[3]) || 800; }
    else { const u = v.match(/static\.wixstatic\.com\/media\/([^/?#]+)/); if (u) { uri = u[1]; w = 1200; h = 800; } }
  } else if (v && typeof v === 'object' && typeof (v as Row).uri === 'string') { uri = (v as Row).uri; w = (v as Row).width || 1200; h = (v as Row).height || 800; }
  return { name: 'card', uri, width: w, height: h, alt, type: 'Builder.Image', url: `https://static.wixstatic.com/media/${uri}` };
}
const toCard = (prefix: string, tf: string) => (r: Row): Card => {
  const n = typeof r.publicReviewCount === 'number' ? r.publicReviewCount : 0;
  const rating = typeof r.publicRating === 'number' && r.publicRating > 0 ? `★ ${r.publicRating.toFixed(1)}${n ? ` (${n.toLocaleString('en-GB')} reviews)` : ''}` : 'No public rating yet.';
  return { title: String(r.title || ''), town: String(r[tf] || r.locationName || r.town || ''), rating, image: wixImage(r.cardImage || r.heroImage, String(r.title || '')), link: { href: `${prefix}/${r._slug || r.slug || ''}`, target: '_self' } };
};

export interface DirectoryFilterProviderProps {
  children?: ReactNode; collection: string; baseField?: string; words?: string; topics?: string; townField?: string; noun?: string; itemPrefix?: string; pageSize?: number; readyField?: string;
}
const Ctx = createContext<DirectoryFilterContextType | undefined>(undefined);
Ctx.displayName = 'DirectoryFilterContext';
export function useDirectoryFilter(): DirectoryFilterContextType {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDirectoryFilter must be used within DirectoryFilter');
  return c;
}

function DirectoryFilterProvider({ children, collection, baseField, words, topics, townField, noun, itemPrefix, pageSize, readyField }: DirectoryFilterProviderProps): ReactNode {
  const topicList = useMemo(() => (topics || '').split('|').map((s) => s.trim()).filter(Boolean).slice(0, SLOTS), [topics]);
  const tf = townField || 'town';
  const [rows, setRows] = useState<Row[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [fac, setFac] = useState<string[]>([]);
  const [town, setTown] = useState('');
  const [query, setQuery] = useState('');
  const [sortValue, setSortValue] = useState('name');
  const [page, setPage] = useState(1);
  const per = pageSize && pageSize > 0 ? pageSize : 6;

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const all: Row[] = [];
        let res = await dataItems.query(collection).limit(1000).find();
        all.push(...res.items);
        while (res.hasNext() && all.length < 5000) { res = await res.next(); all.push(...res.items); }
        // The live page lists every item whose name, category or venue type mentions one of its words.
        const ws = (words || '').split('|').map((w) => w.trim().toLowerCase()).filter(Boolean);
        const seen = new Set<string>();
        const keep = all.filter((r) => {
          if (baseField && (r[baseField] === undefined || r[baseField] === null || r[baseField] === '' || r[baseField] === false)) return false;
          if (readyField && r[readyField] !== true) return false;
          if (ws.length) { const t = [r.category, r.venueType, r.title, r.name].map(str).join(' ').toLowerCase(); if (!ws.some((w) => t.includes(w))) return false; }
          const k = String(r.title || r._id).toLowerCase() + '|' + str(r.locationName || r.town).toLowerCase();
          if (seen.has(k)) return false; seen.add(k); return true;
        });
        if (live) setRows(keep);
      } catch { if (live) setRows(null); }
    })();
    return () => { live = false; };
  }, [collection, baseField, words, readyField]);

  const matched = useMemo(() => {
    if (!rows) return null;
    const qwords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((r) => qwords.every((w) => haystack(r).includes(w)) && (!town || r[tf] === town) && (!picked.length || picked.some((t) => topicMatch(r, t))) && fac.every((f) => facilityMatch(r, f)));
  }, [rows, query, town, picked, fac, tf]);

  const sorted = useMemo(() => {
    const list = [...(matched || [])];
    const rated = (r: Row) => (typeof r.publicRating === 'number' && r.publicRating > 0 ? r.publicRating : 0);
    list.sort((x, y) => (sortValue === 'rating' ? rated(y) - rated(x) : 0) || String(x.title || '').localeCompare(String(y.title || '')));
    return list;
  }, [matched, sortValue]);
  const pages = Math.max(1, Math.ceil(sorted.length / per));
  const cur = Math.min(page, pages);
  useEffect(() => { setPage(1); }, [query, town, picked, fac, sortValue]);
  const n = matched ? matched.length : rows ? rows.length : 0;
  const what = noun || 'places';
  const value = {
    pageItems: sorted.slice((cur - 1) * per, cur * per).map(toCard(itemPrefix || '', tf)),
    pageText: rows ? `Page ${cur} of ${pages}` : '',
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    nextPage: () => setPage((p) => Math.min(pages, p + 1)),
    countText: rows ? `${n} ${n === 1 ? what.replace(/s$/, '') : what} found` : '',
    query, town, sortValue,
    toggleTopic: (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t])),
    toggleFacility: (f: string) => setFac((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f])),
    setTown: (t: string) => setTown(t || ''),
    setQuery: (q: string) => setQuery(q || ''),
    setSort: (s: string) => setSortValue(s === 'rating' ? 'rating' : 'name'),
    clearAll: () => { setPicked([]); setFac([]); setTown(''); setQuery(''); },
  };
  const extra: Record<string, string> = {};
  for (let i = 0; i < SLOTS; i++) extra[`topicLabel${i}`] = topicList[i] ? `${picked.includes(topicList[i]) ? '☑' : '☐'}  ${topicList[i]}` : '';
  FACILITIES.forEach((f, i) => { extra[`facilityLabel${i}`] = `${fac.includes(f) ? '☑' : '☐'}  ${FACILITY_NAMES[i]}`; });
  const api = { ...value, ...extra } as DirectoryFilterContextType;
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
DirectoryFilterProvider.displayName = 'DirectoryFilterProvider';
export default DirectoryFilterProvider;
