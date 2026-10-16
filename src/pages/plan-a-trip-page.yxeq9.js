import { applyPageSeo } from 'public/seo';

$w.onReady(async function () {
    // The planner is a static tool page, without router data or a detail record.
    await applyPageSeo(['plan-a-trip']);
});
