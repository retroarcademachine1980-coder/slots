import { replaceTemplateFiller } from 'public/template-filler';

// Puts this page's real name in its heading and blanks the stock template wording
// during server rendering.
$w.onReady(function () {
    replaceTemplateFiller($w, 'Ticket Arcades');
});
