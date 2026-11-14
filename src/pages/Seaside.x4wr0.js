import { renderHubGuide } from 'public/native-guide-article';

// Fills the page's two guide text controls (srNativeGuideTitle, srNativeGuideArticle)
// during server rendering with this hub's own written guide.
$w.onReady(function () {
    return renderHubGuide({ select: $w, path: '/seaside' });
});
