import { blankGuideControls } from 'public/native-guide-article';

// This hub already carries its own readable guide and heading in the page, so the
// two pasted guide controls are kept blank rather than repeating that text.
$w.onReady(function () {
    return blankGuideControls($w);
});
