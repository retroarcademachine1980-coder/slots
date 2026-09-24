import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = await readFile(new URL('../src/public/canonicalUrls.js', import.meta.url), 'utf8');
const { canonicalInternalUrl, STATIC_URL_CHANGES } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('maps only the exact prepared static addresses', () => {
    for (const [before, after] of Object.entries(STATIC_URL_CHANGES)) {
        assert.equal(canonicalInternalUrl(before), after);
        assert.equal(canonicalInternalUrl(before + '/?utm_source=menu#offers'), after + '?utm_source=menu#offers');
        assert.equal(canonicalInternalUrl(before + '-unrelated'), before + '-unrelated');
    }
});

test('preserves the town slug, query and fragment', () => {
    assert.equal(canonicalInternalUrl('/arcade-locations/blackpool?ref=home#offers'), '/destination/blackpool?ref=home#offers');
    assert.equal(canonicalInternalUrl('https://www.spin-raiders.com/arcade-locations/kings-lynn'), 'https://www.spin-raiders.com/destination/kings-lynn');
    assert.equal(canonicalInternalUrl('/destination/lincoln'), '/destination/lincoln');
});

test('leaves affiliate URLs and unprepared routes byte-for-byte intact', () => {
    const untouched = [
        'https://www.awin1.com/cread.php?awinmid=1&ued=https%3A%2F%2Fwww.spin-raiders.com%2Fgeneral-1',
        'https://partner.example/arcade-locations/blackpool?affiliate=123',
        '//partner.example/general-1',
        'https://spin-raiders.com.evil.example/general-1',
        '/arcade-venues/example', '/classic-fruit-machine-archive-1/example',
        '/destination-recommendations?view=offers', '/arcade-locations/',
        '/arcade-locations/blackpool/unknown', '', null
    ];
    for (const url of untouched) assert.equal(canonicalInternalUrl(url), url);
});
