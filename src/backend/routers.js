// Router hooks for dynamic pages.
//
// Classic fruit machine pages (/classic-fruit-machine-archive-1/<slug>):
// machines switched off in the CMS (ClassicFruitMachines.active === false) are left out of the sitemap, so Google stops
// finding "Record unavailable" pages while their photos are being added. Nothing is deleted: switch a machine back on
// (active = true) and it returns to the sitemap automatically on the next sitemap read (within 10 minutes).
//
// Wix names dynamic-page hooks <hook>_<prefix>; the prefix here contains dashes, so the same function is exported under
// the identifier spellings Wix may use for it. Unused exports are harmless.

import wixData from 'wix-data';

const CACHE_MS = 10 * 60 * 1000;
let cache = { at: 0, slugs: null };

async function switchedOffSlugs() {
  if (cache.slugs && Date.now() - cache.at < CACHE_MS) return cache.slugs;
  const slugs = new Set();
  let res = await wixData.query('ClassicFruitMachines').eq('active', false).limit(1000).find({ suppressAuth: true });
  for (;;) {
    for (const item of res.items) if (item.slug) slugs.add(String(item.slug).toLowerCase());
    if (!res.hasNext()) break;
    res = await res.next();
  }
  cache = { at: Date.now(), slugs };
  return slugs;
}

function entrySlug(entry) {
  const url = String((entry && entry.url) || '').split(/[?#]/)[0].replace(/\/+$/, '');
  try { return decodeURIComponent(url.split('/').pop() || '').toLowerCase(); } catch (e) { return ''; }
}

async function machineSitemap(sitemapEntries) {
  try {
    const off = await switchedOffSlugs();
    return sitemapEntries.filter(entry => !off.has(entrySlug(entry)));
  } catch (e) {
    console.error('machine sitemap filter failed, leaving sitemap unchanged', e);
    return sitemapEntries;
  }
}

export const afterSitemap_classic_fruit_machine_archive_1 = machineSitemap;
export const afterSitemap_classicFruitMachineArchive1 = machineSitemap;
export const afterSitemap_ClassicFruitMachineArchive1 = machineSitemap;
