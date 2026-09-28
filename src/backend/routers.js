// Router hooks for dynamic pages.
//
// Classic fruit machine pages (/classic-fruit-machine-archive-1/<slug>):
// machines switched off in the CMS (ClassicFruitMachines.active === false) are left out of the sitemap, so Google stops
// finding "Record unavailable" pages while their photos are being added. Nothing is deleted: switch a machine back on
// (active = true) and it returns to the sitemap automatically on the next sitemap read (within 10 minutes).
//
// Wix names dynamic-page hooks <prefix>_<hook> (e.g. myRouter_afterSitemap); the prefix here contains dashes, so the same function is exported under
// the identifier spellings Wix may use for it. Unused exports are harmless.

import wixData from 'wix-data';

const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, slugs: null };

async function switchedOffSlugs() {
  if (cache.slugs && Date.now() - cache.at < CACHE_MS) return cache.slugs;
  const slugs = new Set();
  let res = await wixData.query('ClassicFruitMachines').eq('active', false).limit(1000).find({ suppressAuth: true });
  for (;;) {
    for (const item of res.items) {
      // The machine page URL is stored on the item by Wix (link-...-title), e.g. /classic-fruit-machine-archive-1/jungle-jive.
      const link = item['link-classic-fruit-machine-archive-1-title'];
      if (link) slugs.add(String(link).replace(/\/+$/, '').split('/').pop().toLowerCase());
    }
    if (!res.hasNext()) break;
    res = await res.next();
  }
  cache = { at: Date.now(), slugs };
  return slugs;
}

function entrySlug(entry) {
  const url = String((entry && entry.url) || '').split(/[?#]/)[0].replace(/\/+$/, '');
  try { return decodeURIComponent(url.split('/').pop() || '').toLowerCase().replace(/\s+/g, '-'); } catch (e) { return ''; }
}

// Wix calls afterSitemap(sitemapRequest, sitemapEntries); take whichever argument is the entry list.
async function machineSitemap(...args) {
  const sitemapEntries = args.find(Array.isArray) || [];
  try {
    const off = await switchedOffSlugs();
    return sitemapEntries.filter(entry => !off.has(entrySlug(entry)));
  } catch (e) {
    console.error('machine sitemap filter failed, leaving sitemap unchanged', e);
    return sitemapEntries;
  }
}

export const classic_fruit_machine_archive_1_afterSitemap = machineSitemap;
export const classicFruitMachineArchive1_afterSitemap = machineSitemap;
export const ClassicFruitMachineArchive1_afterSitemap = machineSitemap;
