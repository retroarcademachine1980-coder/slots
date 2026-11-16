// Town places: the live destination page's "Start with the fun" card and its list of things to do,
// places to eat and stay in the town, gathered from the attraction, venue, food and hotel collections.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { items as dataItems } from '@wix/data';

type Row = Record<string, any>;
const SOURCES: Array<[string, string]> = [['NearbyAttractions', '/attraction'], ['Venues', '/venue'], ['FoodAndDrink', '/food-and-drink'], ['HotelGuides', '/hotel']];
export interface CardImage { name: string; uri: string; width: number; height: number; alt: string; type: string; url: string }
export interface CardLink { href: string; target: '_self' }
export interface Card { title: string; town: string; rating: string; image: CardImage; link: CardLink }
export interface TownPlacesContextType {
  pageItems: Card[]; pageText: string; prevPage: () => void; nextPage: () => void; countText: string;
  welcome: string; funHeading: string; listHeading: string; planHeading: string;
  stopTitle: string; stopText: string; stopImage: CardImage; stopLink: CardLink;
}
function wixImage(v: unknown, alt: string): CardImage {
  let uri = '3a517e_c00db68d44ed453e96b9547639584056~mv2.jpg', w = 2752, h = 1100;
  if (typeof v === 'string') {
    const m = v.match(/^wix:image:\/\/v1\/([^/#]+)[^#]*(?:#originWidth=(\d+)&originHeight=(\d+))?/);
    if (m) { uri = m[1]; w = Number(m[2]) || 1200; h = Number(m[3]) || 800; }
    else { const u = v.match(/static\.wixstatic\.com\/media\/([^/?#]+)/); if (u) { uri = u[1]; w = 1200; h = 800; } }
  } else if (v && typeof v === 'object' && typeof (v as Row).uri === 'string') { uri = (v as Row).uri; w = (v as Row).width || 1200; h = (v as Row).height || 800; }
  return { name: 'card', uri, width: w, height: h, alt, type: 'Builder.Image', url: `https://static.wixstatic.com/media/${uri}` };
}
const placeOf = (r: Row) => String(r.town || r.locationName || r.destination || '');
const nameOf = (r: Row, town: string) => String(r.displayTitle || r.title || r.name || '').replace(new RegExp(`\\s+[-–]\\s+${town.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), '');
const ratingOf = (r: Row) => (typeof r.publicRating === 'number' && r.publicRating > 0 ? r.publicRating : 0);

const Ctx = createContext<TownPlacesContextType | undefined>(undefined);
Ctx.displayName = 'TownPlacesContext';
export function useTownPlaces(): TownPlacesContextType {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTownPlaces must be used within TownPlaces');
  return c;
}
export interface TownPlacesProviderProps { children?: ReactNode; town?: string; pageSize?: number }

function TownPlacesProvider({ children, town, pageSize }: TownPlacesProviderProps): ReactNode {
  const t = (town || '').trim();
  const [rows, setRows] = useState<Array<{ r: Row; prefix: string; c: string }> | null>(null);
  const [page, setPage] = useState(1);
  const per = pageSize && pageSize > 0 ? pageSize : 6;
  useEffect(() => {
    if (!t) { setRows([]); return; }
    let live = true;
    (async () => {
      const got: Array<{ r: Row; prefix: string; c: string }> = [];
      const seen = new Set<string>();
      for (const [c, prefix] of SOURCES) {
        for (const f of ['town', 'locationName']) {
          try {
            const res = await dataItems.query(c).eq(f, t).limit(100).find();
            for (const r of res.items) {
              if (r.directoryReady === false || seen.has(c + r._id)) continue;
              seen.add(c + r._id); got.push({ r, prefix, c });
            }
          } catch { /* field not in this collection */ }
        }
      }
      if (live) setRows(got);
    })();
    return () => { live = false; };
  }, [t]);
  const sorted = useMemo(() => [...(rows || [])].sort((a, b) => ratingOf(b.r) - ratingOf(a.r) || nameOf(a.r, t).localeCompare(nameOf(b.r, t))), [rows, t]);
  const stop = useMemo(() => sorted.find((x) => x.c === 'NearbyAttractions' && (x.r.cardImage || x.r.heroImage)) || sorted.find((x) => x.r.cardImage || x.r.heroImage), [sorted]);
  const pages = Math.max(1, Math.ceil(sorted.length / per));
  const cur = Math.min(page, pages);
  const n = sorted.length;
  const card = (x: { r: Row; prefix: string }): Card => {
    const k = typeof x.r.publicReviewCount === 'number' ? x.r.publicReviewCount : 0;
    const rt = ratingOf(x.r);
    return { title: `${nameOf(x.r, t)} →`, town: `⌖ ${placeOf(x.r)}${x.r.postcode ? `, ${x.r.postcode}` : ''}`, rating: rt ? `★ ${rt.toFixed(1)}${k ? ` (${k.toLocaleString('en-GB')} reviews)` : ''}` : 'No public rating yet.', image: wixImage(x.r.cardImage || x.r.heroImage, nameOf(x.r, t)), link: { href: `${x.prefix}/${x.r._slug || x.r.slug || ''}`, target: '_self' } };
  };
  const api: TownPlacesContextType = {
    pageItems: sorted.slice((cur - 1) * per, cur * per).map(card),
    pageText: rows && pages > 1 ? `Page ${cur} of ${pages}` : '',
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    nextPage: () => setPage((p) => Math.min(pages, p + 1)),
    countText: rows ? `${n} ${n === 1 ? 'result' : 'results'} found` : '',
    welcome: t ? `Welcome to ${t}` : '',
    funHeading: t ? `Start with the fun in ${t}` : '',
    listHeading: t ? `Things to do & Places to eat in ${t}` : '',
    planHeading: t ? `Plan more in ${t}` : '',
    stopTitle: stop ? nameOf(stop.r, t) : '',
    stopText: stop ? String(stop.r.shortDescription || stop.r.summary || '') : '',
    stopImage: wixImage(stop ? stop.r.cardImage || stop.r.heroImage : '', stop ? nameOf(stop.r, t) : ''),
    stopLink: { href: stop ? `${stop.prefix}/${stop.r._slug || stop.r.slug || ''}` : '/attractions', target: '_self' },
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
TownPlacesProvider.displayName = 'TownPlacesProvider';
export default TownPlacesProvider;
