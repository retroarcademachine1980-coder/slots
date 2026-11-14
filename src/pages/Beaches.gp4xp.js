import { renderStaticHubGuide } from 'public/native-guide-article';

// Fills the page's two guide text controls during server rendering with the same
// beaches guide visitors see on this page.
$w.onReady(function () {
    return renderStaticHubGuide({ select: $w, path: '/beaches', title: 'Beaches in England and around the UK' });
});
