# Category pages: implementation and remaining Wix work

Status: code prepared on a rebuild branch. Not connected, published or visually verified.
Original site: 517c2402-3182-4b3f-a2f1-be5611e7e22f.

## Editor template contract

Create/finish ONE native template before duplicating. Preserve the existing approved colours,
font choices and imagery. Set the title, unique intro, category hero image, SEO title and
description through the Wix editor. Do not substitute venue photos or generate venue reviews.

Required page controls:

| ID | Wix element | Purpose |
| --- | --- | --- |
| categorySearch | Text Input | Search within this category |
| townFilter | Text Input | Filter by town name, case-insensitive partial match |
| resultsStatus | Text | Loading, count, empty and error states |
| venueRepeater | Repeater | Venue cards |
| loadMore | Button | Next 24 matching venues |

Inside the repeater: venuePhoto (Image), venueName (Text), venueTown (Text),
venueDescription (Text), venueRating (Text), venueLink (Button).
Disconnect competing dataset bindings from these card controls. The backend handles their data.
Mark resultsStatus as a polite live region in Wix accessibility settings where supported.

Each category page's actual generated page-code file calls:

```js
import { mountCategoryPage } from 'public/category-page';
$w.onReady(() => mountCategoryPage($w));
```

Do not invent page IDs or create fake page-code files: new pages and their URLs must be
created in Wix, then their generated filenames synced into GitHub. The saved AGC draft
uses earlier placeholder IDs and needs finishing before adopting this contract.

## Membership and searches

The 19 exact URL slugs are in category-config.js. All results require pageReady,
directoryReady and cardReady to be true. Category OR rules are grouped under these gates.
Each search word must match a searchable field within that category. Queries are paginated
at source, rather than downloading the entire collection for each keystroke.

Existing global search must not bind categorySearch or townFilter. discovery-ui.js now
excludes those two IDs, retaining header search. Category input searches stay on their page;
site-wide town redirects remain a separate migration task.

The casino category matches venueType Casino, not a brand name containing Casino.
The bookmaker category additionally requires fruitMachines=true. It follows the current
24 September handover, which explicitly includes this page; resolve any later removal decision
before adding it to navigation. The £500 category requires jackpotMaximum exactly 500.
Pinball relies on explicit machineTypes tags or venueType; do not infer it from review prose.
VR and arcade bars rely on venueType because no dedicated boolean fields exist in the schema.
Audit coverage before launch. Ready flags do not themselves prove correct photos or word count.

Only publicRatingStatus exactly VERIFIED (case-insensitive) permits the public rating display.
Raider scores are not converted, rewritten or inferred. Other status spellings need explicit
verification before extending this rule. Card IDs retain the CMS ID (no invalid colon prefix).

## Deployment gates

1. Finish the template, save, confirm persistence, duplicate and set all 19 URLs.
2. Assign native H1, unique intro, suitable existing hero image and SEO fields to each page.
3. Connect actual page-code files to the shared module; verify mobile and keyboard operation.
4. Inspect the existing custom embeds: 337 saved, 160 enabled when audited. The shared frame
   hides SITE_HEADER; the early guard hides SITE_CONTAINER on selected routes. Plan and test
   each replacement before disabling its old renderer. Do not blanket-disable scripts.
5. Check initial cards, category search, town filter, no matches, errors and load-more in Wix.
   Empty Sandbox collections are not evidence of missing live records. Never sync empty Sandbox
   into Live. Verify the preview data source explicitly.
6. Review every shown record for the user's exact-photo and 120+ word publication requirements.
7. Publish only when the category template and bindings are verified. Main currently triggers
   the Publish Wix workflow automatically. This branch must not be merged prematurely.

Venue buttons intentionally retain /arcade-venues/<slug> until replacement venue routes work.
Do not swap these links to nonexistent /arcades/<town>/<venue> pages. Town/venue routing,
machine brand routes, food-and-drink pages, Nature & Outdoors, Holiday Parks, redirects,
navigation, structured data, Search Console and speed checks remain outstanding.

Masala & Malt target: /food-and-drink/grimsby/masala-and-malt. Preserve its existing query URL
and review. No redirect has been installed and the target is not yet live.

## Verification

Run `npm test` with Node 22. Tests exercise real filtering scenarios with an in-memory
Wix query substitute and overlapping frontend requests. They do not replace Wix integration QA.

References: https://dev.wix.com/docs/develop-websites/articles/wix-editor-elements/repeaters/the-lifecycle-of-repeated-items
and https://dev.wix.com/docs/develop-websites-sdk/code-your-site/best-practices/data/build-efficient-queries.
