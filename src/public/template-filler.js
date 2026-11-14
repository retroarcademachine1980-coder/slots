// Some older pages were created from a Wix page template and still carry the
// template's stock wording ("Page Title", "This is a Paragraph..."). Visitors never
// see it, but it is in the page source. This puts the page's real name in the
// heading and blanks the rest of the stock wording. It never touches real text.
const FILLER = [
    /^Page Title$/, /^Section Title$/, /^Section Subtitle$/, /^Small Title$/,
    /^This is a Paragraph\./, /^Every website has a story/, /^I'm a paragraph\./, /^Heading \d$/,
];
function isFiller(value) {
    const text = String(value || '').trim();
    return FILLER.some(pattern => pattern.test(text));
}
export function replaceTemplateFiller(select, title) {
    let titled = false;
    let elements;
    try { elements = select('Text'); } catch { return false; }
    const count = Number(elements?.length) || 0;
    for (let index = 0; index < count; index++) {
        const element = elements[index];
        let current = '';
        try { current = element.text; } catch { continue; }
        if (!isFiller(current)) continue;
        let heading = false;
        try { heading = /<h1\b/i.test(element.html); } catch { /* treat as body text */ }
        if (heading && !titled && title) {
            try { element.text = title; titled = true; continue; } catch { /* fall through and blank it */ }
        }
        try { element.collapse(); } catch { /* not collapsible here */ }
        try { element.html = '<p> </p>'; } catch { /* keep going */ }
        try { element.text = ' '; } catch { /* leave as is */ }
    }
    return titled;
}
