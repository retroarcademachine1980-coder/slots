import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createNativeRouter } from '../src/public/routes/nativeRouterAdapter.js';
import { createRouteContext } from '../src/public/routes/canonicalRoutes.js';

const manifest = JSON.parse(fs.readFileSync(new URL('../config/routes/manifest.json', import.meta.url)));
const context = createRouteContext(manifest);
for (const [path, landing] of Object.entries(manifest.landings)) {
  test('reviewed landing '+path+' supplies its existing description in Wix HeadOptions', async () => {
    const before = structuredClone(landing);
    const router = createNativeRouter({ context, manifest,
      ok: (page, data, head) => ({ status: 200, page, data, head }),
      notFound: () => ({ status: 404 }), sendStatus: status => ({ status }),
      readById: () => { throw new Error('Landing must not invent or load a venue'); } });
    const response = await router.canonical(path);
    assert.equal(response.status, 200);
    assert.deepEqual(response.head.metaTags?.filter(tag => String(tag.name || '').toLowerCase() === 'description'),
      [{ name: 'description', content: landing.seo.description }]);
    assert.equal(response.page, landing.pageName);
    assert.equal(response.data.metadata.introduction, landing.seo.description);
    for (const [key,value] of Object.entries(landing.metadata || {})) assert.deepEqual(response.data.metadata[key], value);
    assert.equal(response.head.title, landing.seo.title);
    assert.deepEqual(response.head.links, landing.seo.links);
    assert.equal(response.head.noIndex, landing.seo.noIndex);
    assert.deepEqual(response.head.metaTags.filter(tag => String(tag.name || '').toLowerCase() !== 'description'), landing.seo.metaTags || []);
    assert.deepEqual(landing, before);
  });
}
