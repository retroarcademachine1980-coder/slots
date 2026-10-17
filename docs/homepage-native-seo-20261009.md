# Spin Raiders homepage native SEO repair — 9 October 2026

STATUS: **PREPARED / NOT DEPLOYED**. Existing `www.spin-raiders.com` only. Do not create or switch websites. Do not edit affiliate pages or offers or remove the AdSense snippets.

## Confirmed production fault

Wix Custom Embed `a7b6db23-d37d-4400-b04c-85ec1b97e4a2` revision 109 pins `dist/sr.core-20261007.min.js` at GitHub commit `8da017418dfb62dacee3d29f82895e5c8b31353d`. The homepage renderer currently creates `#sr-seaside-root`, attaches one open Shadow DOM, then a second open Shadow DOM at `#sr-home-approved-20260921`. Its `<main>`, H1, H2 headings, paragraphs, cards and navigation are added by browser JavaScript. It then hides Wix's `#SITE_CONTAINER` with CSS. The original Wix homepage still exists underneath; it must not be made visible without cleaning/replacing it.

Independent SEO Check user screenshots, 9 October: **101 detected words, no H1, no headings, no paragraphs**; 38% page quality and 58% structure; ~980 KB HTML. This is a rendering/content mismatch, not missing SEO title/description (100%). The checker may not render the JavaScript shadow content. Googlebot can sometimes render JavaScript and Shadow DOM, so do not claim Google definitely sees zero content without Google rendered-HTML confirmation.

## Safest repair: native source of truth in the existing Wix Classic Editor

1. On **the existing homepage**, in Wix Classic Editor **test site / draft**, use native Text/Heading components; do **not** paste this HTML into an HTML iframe or a new custom-code overlay. Use `docs/homepage-native-seo-20261009.html` as the **copy and semantic hierarchy** to reproduce with native H1/H2/paragraph/link widgets. In particular, use one visible H1 and normal paragraph tags; don't use giant bold headings that are not semantic headings.
2. **Replace**, do not simply unhide, the old Wix casino-led homepage content under `#SITE_CONTAINER`. The casino affiliate section continues independently on its own page; the homepage must contain days-out text. Preserve all links, CMS collections, original media and the site identity.
3. **Coordinate the renderer change in the same test release**. The current runtime always hides `#SITE_CONTAINER` and displays the shadow-root design. Merely putting native text inside `#SITE_CONTAINER` while this is unchanged leaves the content invisible to visitors. Do not remove that hide rule first either: the old Wix page would reappear and create double navigation. Either move the approved appearance into native Wix layout with the planner UI attached in supported sections, or safely host the native editorial sections in their intended visible layout while retiring the duplicate JavaScript owner. Keep one visual page owner and one visible H1.
4. Only after a complete draft editor design exists, build a matching pinned runtime revision (do not update `main` only; current production loader is pinned to the earlier commit). **Do not modify, enable or duplicate AdSense, GTM, private-tracker and affiliate snippets**. Avoid site-wide scripts: these changes affect homepage only.
5. Test *before* publishing: desktop and mobile show exactly one navigation, one visible native H1, the same site/search/planner as before, no double content and no old casino homepage; all `/days-out`, `/places-to-stay`, `/offers`, `/food-and-drink`, `/arcade`, `/search` remain clean links. Check that every section contains real paragraphs.
6. Inspect the **initial HTML response without JavaScript**, then Google Search Console URL Inspection **View tested page / rendered HTML**. The native text should be present in the raw initial page and the rendered page; independent SEO Check should find H1, H2 and >400 words. Check canonical is `https://www.spin-raiders.com/` and no accidental `noindex`. Recheck mobile layout, route navigation, speed, analytics tracking and affiliate pages.
7. Publish the coordinated editor/runtime change **only** if all gates pass; keep rollback revision and prior loader pin on record. Follow with Search Console impressions/clicks, not just SEO-app scores. AdSense approval is not guaranteed.

### Scope and safety

- No new website, new page route, redirect, JavaScript URL fallback, app uninstall, logo/image replacement, offer removal or affiliate change.
- No invisible keyword-stuffed SEO copy, second homepage overlay, hidden on-load text, iframe-only content, or new all-pages custom embed.
- Preserve both established audience and genuine local-day-out usefulness. Text is UK English, not generic casino or US travel copy.
- `docs/homepage-native-seo-20261009.html` is an **editorial reference**, not a page deployed as HTML to another host.
- `tools/check-native-homepage-seo.py` is a **pre-publish diagnostic**, not a site mutation. It checks returned HTML for required native headings/text and honest coverage.

## Why this must be coordinated

The Wix REST connection can read and write SEO tags, CMS records and site-wide custom embeds, but its documented APIs **cannot modify Classic Editor canvas elements** on an existing page. A GitHub source-only change cannot create genuine native text/heading widgets in the Wix editor. This branch does not attempt an ineffective text-only JavaScript patch.