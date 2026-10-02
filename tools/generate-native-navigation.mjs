import fs from 'node:fs';
import { NATIVE_STATIC_PATHS } from '../src/public/routes/nativeStaticPaths.js';
const dir='/workspace/shared/spin-raiders-release-preflight-20261002';
const pages=JSON.parse(fs.readFileSync(dir+'/isolated-r18-native-pages.json'));
const bindings=JSON.parse(fs.readFileSync(dir+'/all-custom-router-native-bindings.json'));
const paths={};
for(const [path,id] of Object.entries(NATIVE_STATIC_PATHS))if(pages[id])paths[path]=id;
for(const wrapper of bindings)for(const router of Object.values(wrapper)){
 if(['hotels','nearby-attractions'].includes(router.prefix))continue;
 const ids=Object.values(router.pages);if(ids.length!==1||!pages[ids[0]])throw Error('Unverified native router page');
 paths['/'+router.prefix]=ids[0];
}
const source='// Captured isolated Wix branch f37020b8 revision18 (not published or runtime acceptance).\n// Release gate must verify every final native root before promotion/redirect retirement.\nexport const NATIVE_STATIC_PATHS = Object.freeze('+JSON.stringify(paths,null,2)+');\n';
fs.writeFileSync(new URL('../src/public/routes/nativeStaticPaths.js',import.meta.url),source);
console.log('Captured '+Object.keys(paths).length+' exact static/index native bindings, readiness remains separately gated');
