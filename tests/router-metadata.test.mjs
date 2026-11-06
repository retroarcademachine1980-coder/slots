import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createNativeRouter } from '../src/public/routes/nativeRouterAdapter.js';

const manifest = JSON.parse(fs.readFileSync(new URL('../config/routes/manifest.json', import.meta.url), 'utf8'));
const pages = ['/cinemas', '/bowling', '/outdoors', '/piers'];

test('the four observed category failures send a standard description alongside social tags', async () => {
  for (const path of pages) {
    const landing = structuredClone(manifest.landings[path]);
    const original = structuredClone(landing);
    const router = createNativeRouter({
      context: { landings: { [path]: landing }, endpoints: manifest.endpoints },
      manifest,
      ok: (page, data, head) => ({ page, data, head }),
      sendStatus: status => ({ status })
    });
    const response = await router.canonical(path);
    const descriptions = response.head.metaTags.filter(tag => tag.name === 'description');
    assert.equal(descriptions.length, 1, path + ' requires one standard description');
    assert.equal(descriptions[0].content, original.seo.description);
    assert.deepEqual(response.head.metaTags.filter(tag => tag.name !== 'description'), original.seo.metaTags);
    assert.equal(response.head.title, original.seo.title);
    assert.deepEqual(response.head.links, original.seo.links);
    assert.equal(response.head.noIndex, original.seo.noIndex);
    assert.deepEqual(response.data, { view: 'index', route: { kind: landing.kind, path }, metadata: { ...(landing.metadata || {}), introduction: landing.seo.description || '' } });
    assert.deepEqual(landing, original, 'a request must not mutate the shared landing definition');
  }
});

test('explicit descriptions retain precedence and description-only landings get a standard tag', async () => {
  for (const explicit of [false, true]) {
    const path = '/cinemas', landing = structuredClone(manifest.landings[path]);
    if (explicit) landing.seo.metaTags.unshift({ name: 'description', content: 'A deliberately selected description.' });
    else delete landing.seo.metaTags;
    const router = createNativeRouter({ context: { landings: { [path]: landing }, endpoints: manifest.endpoints }, manifest, ok: (page, data, head) => ({ page, data, head }) });
    const response = await router.canonical(path);
    if (explicit) assert.equal(response.head, landing.seo);
    else {
      assert.deepEqual(response.head.metaTags, [{ name: 'description', content: landing.seo.description }]);
      const inverse = { ...response.head };delete inverse.metaTags;
      assert.deepEqual(inverse, landing.seo);
    }
  }
});
