// Spin Raiders top bar, rebuilt from the live site's mega menu (dist/sr-days-out-experience-20261104.js and
// sr-sitewide-fuel-navigation-20261028.js): seven menu groups with hover panels, Fuel prices, search and "Plan a day out".
import React, { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import clsx from 'clsx';
import styles from './mega-nav.module.css';
import type { MegaNavProps } from './mega-nav.props';

type L = [string, string];
type Group = { label: string; href: string; title: string; copy: string; all: L; sections: Array<[string, L[]]> };

const GROUPS: Group[] = [
  { label: 'Days out', href: '/days-out', title: 'Days out', all: ['All days out', '/days-out'], copy: 'Find your kind of day: sea air, a quieter escape or somewhere new.',
    sections: [['By the sea', [['Seaside', '/seaside'], ['Beaches', '/beaches'], ['Piers', '/piers']]], ['Open-air discoveries', [['Nature & outdoors', '/outdoors'], ['Fishing', '/fishing-lakes'], ['Hidden gems', '/hidden-gems']]], ['Plan & explore', [['Trip builder', '/plan-a-trip'], ['Raiders map', '/map'], ['Video vault', '/?raidertube=1']]]] },
  { label: 'Attractions', href: '/attractions', title: 'Attractions', all: ['All attractions', '/attractions'], copy: 'Pick the bit everyone is looking forward to, then build the day around it.',
    sections: [['Rides & wildlife', [['Theme parks', '/theme-parks'], ['Family fun', '/family-fun'], ['Zoos & wildlife', '/zoos'], ['Sea life', '/sea-life']]], ['Stories & discoveries', [['Museums', '/museums'], ['Historic places', '/historical-sites'], ['Tours & experiences', '/tours']]], ['Indoor fun', [['Cinemas', '/cinemas'], ['Bowling', '/bowling']]]] },
  { label: 'Food & drink', href: '/where-to-eat', title: 'Food & drink', all: ['Food & drink', '/where-to-eat'], copy: 'Make the food stop part of the day, from a quick bite to an evening out.',
    sections: [['Find a food stop', [['Food & drink guides', '/where-to-eat'], ['Arcade bars & clubs', '/arcade-bars']]], ['Make a day of it', [['Days out', '/days-out'], ['Seaside', '/seaside'], ['Places to stay', '/places-to-stay']]]] },
  { label: 'Stays', href: '/places-to-stay', title: 'Places to stay', all: ['All places to stay', '/places-to-stay'], copy: 'Find a base for your next short break and leave time to enjoy the evening.',
    sections: [['Places to stay', [['Hotel & stay guides', '/places-to-stay'], ['Holiday parks', '/holiday-parks']]], ['Explore around your stay', [['Days out', '/days-out'], ['Seaside', '/seaside'], ['Food & drink', '/where-to-eat']]]] },
  { label: 'Offers', href: '/offers', title: 'Offers', all: ['Amazing offers', '/offers'], copy: 'Browse current partner offers and read the details before choosing your dates.',
    sections: [['Days out & breaks', [['Amazing offers', '/offers'], ['Hotel guides', '/places-to-stay'], ['Food & drink guides', '/where-to-eat'], ['Attraction guides', '/attractions']]]] },
  { label: 'Arcades', href: '/arcade', title: 'Arcades', all: ['All arcades', '/arcade'], copy: 'Find a play stop that suits you, from seaside games to classic favourites.',
    sections: [['Arcade discoveries', [['Seaside arcades', '/seaside'], ['Retro video games', '/retro-video-games'], ['Classic fruit machine arcades', '/retro-arcades']]], ['Adult gaming', [['Adult gaming centres', '/agc'], ['Bingo', '/bingo-halls']]], ['The machine archive', [['Fruit Machine Archive', '/classic-fruit-machines'], ['Browse manufacturers', '/classic-fruit-machines#makers'], ['Browse eras & styles', '/classic-fruit-machines#eras']]]] },
  { label: 'Fruit machines', href: '/classic-fruit-machines', title: 'Fruit Machine Archive', all: ['Fruit Machine Archive', '/classic-fruit-machines'], copy: 'Explore the archive, choose a manufacturer and open each machine’s own story.',
    sections: [['Browse the archive', [['Browse manufacturers', '/classic-fruit-machines#makers'], ['Browse eras & styles', '/classic-fruit-machines#eras'], ['All machine descriptions', '/classic-fruit-machines#all-machines']]], ['Find classic games', [['Classic fruit machine arcades', '/retro-arcades'], ['Seaside arcades', '/seaside'], ['Retro video games', '/retro-video-games']]]] },
];

// Live showed a dated "Food & drink of the month" card in the Food & drink panel during October and November 2026.
const FOOD_PICK = { from: Date.parse('2026-10-01T00:00:00Z'), to: Date.parse('2026-12-01T00:00:00Z'),
  img: 'https://static.wixstatic.com/media/3a517e_809ead30953140cc948d147392fd0498~mv2.jpg/v1/fill/w_420,h_260,al_c,q_85,enc_auto/masala-malt.webp',
  alt: 'Masala & Malt restaurant in Abbeygate, Grimsby', link: ['Masala & Malt →', '/food-and-drink/masala-malt-grimsby'] as L, note: 'Grimsby · Food & Drink of the Month · Ad' };

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.searchSvg}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
);

const MegaNav: FC<MegaNavProps> = ({ id, className }) => {
  const [open, setOpen] = useState<number>(-1);
  const [mobile, setMobile] = useState(false);
  const [path, setPath] = useState('');
  const [now, setNow] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: 0, width: 0, top: 64 });
  useEffect(() => { setPath(window.location.pathname.replace(/\/$/, '')); setNow(Date.now()); }, []);
  useEffect(() => {
    const place = () => { const r = root.current?.getBoundingClientRect(); if (r) setEdge({ left: -r.left, width: document.documentElement.clientWidth, top: Math.round((root.current?.closest('header') || root.current)!.getBoundingClientRect().bottom) }); };
    place(); window.addEventListener('resize', place); return () => window.removeEventListener('resize', place);
  }, [open, mobile]);
  const food = now >= FOOD_PICK.from && now < FOOD_PICK.to;
  const fuel = /^\/destination\/[^/]+$/.test(path) ? path + '#fuel-prices' : '/plan-a-trip#fuel-prices';
  const a = (l: L, cls?: string) => <a key={l[0] + l[1]} href={l[1]} className={cls} aria-current={path && path === l[1] ? 'page' : undefined}>{l[0]}</a>;
  return (
    <div id={id} ref={root} className={clsx(styles.root, 'mega-nav', className)}>
      <nav className={styles.menu} aria-label="Main">
        {GROUPS.map((g, i) => {
          const cols = g.sections.length + (g.label === 'Food & drink' && food ? 1 : 0);
          return (
            <div key={g.label} className={clsx(styles.group, open === i && styles.open, i === GROUPS.length - 1 && styles.last)}
              onMouseEnter={() => setOpen(i)} onMouseLeave={() => setOpen(-1)} onFocus={() => setOpen(i)}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(-1); }}
              onKeyDown={(e) => { if (e.key === 'Escape') setOpen(-1); }}>
              <a href={g.href} className={styles.parent} aria-expanded={open === i} aria-controls={'sr-mega-menu-' + i}>{g.label}</a>
              <div id={'sr-mega-menu-' + i} role="region" aria-label={g.label + ' menu'} hidden={open !== i} className={styles.panel}
                style={{ left: edge.left, width: edge.width || undefined }}>
                <div className={styles.layout} style={{ ['--cols' as any]: String(cols) }}>
                  <div className={styles.intro}>
                    <p className={styles.kicker}>Explore Spin Raiders</p>
                    <h2>{g.title}</h2>
                    <p>{g.copy}</p>
                    {a([g.all[0] + ' →', g.all[1]], styles.allLink)}
                  </div>
                  {g.sections.map((s) => (
                    <section key={s[0]} className={styles.column}><h3>{s[0]}</h3>{s[1].map((l) => a(l))}</section>
                  ))}
                  {g.label === 'Food & drink' && food && (
                    <section className={styles.feature}>
                      <p>{new Date(now).getUTCMonth() === 9 ? 'October' : 'November'}’s food & drink pick</p>
                      <img src={FOOD_PICK.img} alt={FOOD_PICK.alt} loading="lazy" />
                      {a(FOOD_PICK.link, styles.featureLink)}
                      <small>{FOOD_PICK.note}</small>
                    </section>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <a href={fuel} className={styles.fuel}>Fuel prices</a>
      </nav>
      <a href="/search" className={styles.search} aria-label="Search"><SearchIcon /></a>
      <a href="/plan-a-trip" className={styles.cta}>Plan a day out →</a>
      <button type="button" className={styles.burger} aria-expanded={mobile} onClick={() => setMobile(!mobile)}>Menu ☰</button>
      {mobile && (
        <nav className={styles.mobile} aria-label="Mobile" style={{ top: edge.top }}>
          <a href={fuel} className={styles.mobileTop}>Fuel prices</a>
          <a href="/search" className={styles.mobileTop}>Search</a>
          {GROUPS.map((g) => (
            <details key={g.label}>
              <summary>{g.label}</summary>
              {a(g.all)}
              {g.sections.flatMap((s) => s[1]).filter((l, i, all) => l[1] !== g.all[1] && all.findIndex((x) => x[1] === l[1]) === i).map((l) => a(l))}
            </details>
          ))}
          <a href="/plan-a-trip" className={styles.mobileCta}>Plan a day out →</a>
        </nav>
      )}
    </div>
  );
};

export default MegaNav;
