// Homepage. Fills the two native text controls during server rendering with the
// same headline and introduction the visitor shell shows, so search engines
// receive the page's real heading rather than an empty document.
const HEADLINE = 'Big days out. Brilliant discoveries.';
const INTRODUCTION = 'Find amazing places to visit across the UK – arcades, attractions, food, stays and more.';

$w.onReady(function () {
    try { $w('#srNativeGuideTitle').text = HEADLINE; } catch { /* control not on this template */ }
    try { $w('#srNativeGuideArticle').text = INTRODUCTION; } catch { /* control not on this template */ }
});
