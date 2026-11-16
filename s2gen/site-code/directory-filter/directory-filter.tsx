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
const haystack = (r: Row) => [r.title, r.town, r.locationName, r.category, r.routeCategory, r.brand, r.operator, r.shortDescription, r.unifiedSearchText, str(r.tags), str(r.features), str(r.facilities), str(r.searchKeywords)].map(str).join(' ').toLowerCase();
function topicMatch(r: Row, t: string): boolean {
  if (/^All /.test(t)) return true;
  const src = PATTERNS[t] || t.replace(/s$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(src, 'i').test(haystack(r));
}
function facilityMatch(r: Row, f: string): boolean {
  if (f === 'parking') return r.parking === true || r.parkingAvailable === true || r.freeParking === true;
  if (f === 'wifi') return r.wifi === true || r.freeWifi === true;
  return r[f] === true;
}

export interface DirectoryFilterContextType {
  filter: Record<string, unknown>;
  sort: Array<{ fieldName: string; order: 'ASC' | 'DESC' }>;
  countText: string; query: string; town: string; sortValue: string;
  townOptions: Array<{ label: string; value: string }>;
  [slot: string]: unknown;
}
export interface DirectoryFilterProviderProps {
  children?: ReactNode; collection: string; baseField?: string; topics?: string; townField?: string; noun?: string;
}
const Ctx = createContext<DirectoryFilterContextType | undefined>(undefined);
Ctx.displayName = 'DirectoryFilterContext';
export function useDirectoryFilter(): DirectoryFilterContextType {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDirectoryFilter must be used within DirectoryFilter');
  return c;
}

function DirectoryFilterProvider({ children, collection, baseField, topics, townField, noun }: DirectoryFilterProviderProps): ReactNode {
  const topicList = useMemo(() => (topics || '').split('|').map((s) => s.trim()).filter(Boolean).slice(0, SLOTS), [topics]);
  const tf = townField || 'town';
  const [rows, setRows] = useState<Row[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [fac, setFac] = useState<string[]>([]);
  const [town, setTown] = useState('');
  const [query, setQuery] = useState('');
  const [sortValue, setSortValue] = useState('name');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const all: Row[] = [];
        let res = await dataItems.query(collection).limit(1000).find();
        all.push(...res.items);
        while (res.hasNext() && all.length < 5000) { res = await res.next(); all.push(...res.items); }
        if (live) setRows(all.filter((r) => !baseField || (r[baseField] !== undefined && r[baseField] !== null && r[baseField] !== '')));
      } catch { if (live) setRows(null); }
    })();
    return () => { live = false; };
  }, [collection, baseField]);

  const matched = useMemo(() => {
    if (!rows) return null;
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((r) => words.every((w) => haystack(r).includes(w)) && (!town || r[tf] === town) && (!picked.length || picked.some((t) => topicMatch(r, t))) && fac.every((f) => facilityMatch(r, f)));
  }, [rows, query, town, picked, fac, tf]);

  const active = !!(query.trim() || town || picked.length || fac.length);
  const baseFilter: Record<string, unknown> = baseField ? { [baseField]: { $isNotEmpty: true } } : {};
  const filter = active && matched ? { _id: { $hasSome: matched.length ? matched.map((r) => r._id) : ['__none__'] } } : baseFilter;
  const n = matched ? matched.length : rows ? rows.length : 0;
  const what = noun || 'places';
  const value: DirectoryFilterContextType = {
    filter,
    sort: sortValue === 'rating' ? [{ fieldName: 'publicRating', order: 'DESC' }, { fieldName: 'title', order: 'ASC' }] : [{ fieldName: 'title', order: 'ASC' }],
    countText: rows ? `${n} ${n === 1 ? what.replace(/s$/, '') : what} found` : '',
    query, town, sortValue,
    townOptions: [{ label: 'All locations', value: '' }, ...Array.from(new Set((rows || []).map((r) => r[tf]).filter((t) => typeof t === 'string' && t))).sort().map((t) => ({ label: t as string, value: t as string }))],
    toggleTopic: (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t])),
    toggleFacility: (f: string) => setFac((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f])),
    setTown: (t: string) => setTown(t || ''),
    setQuery: (q: string) => setQuery(q || ''),
    setSort: (s: string) => setSortValue(s === 'rating' ? 'rating' : 'name'),
    clearAll: () => { setPicked([]); setFac([]); setTown(''); setQuery(''); },
  };
  for (let i = 0; i < SLOTS; i++) value[`topicLabel${i}`] = topicList[i] ? `${picked.includes(topicList[i]) ? '☑' : '☐'}  ${topicList[i]}` : '';
  FACILITIES.forEach((f, i) => { value[`facilityLabel${i}`] = `${fac.includes(f) ? '☑' : '☐'}  ${FACILITY_NAMES[i]}`; });
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
DirectoryFilterProvider.displayName = 'DirectoryFilterProvider';
export default DirectoryFilterProvider;
