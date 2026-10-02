/** Exact native-page fallback projection of the same runtime ownership registry. */
import fs from 'node:fs';import {register} from 'node:module';
register('./wix-test-loader.mjs',import.meta.url);
const {RUNTIME_OWNERSHIP}=await import('../src/public/routes/runtimeOwnership.js');
const {NATIVE_STATIC_PATHS}=await import('../src/public/routes/nativeStaticPaths.js');
const snapshot=JSON.parse(fs.readFileSync('/workspace/shared/spin-raiders-release-preflight-20261002/isolated-r18-native-pages.json'));
const paths=Object.fromEntries(RUNTIME_OWNERSHIP.staticPaths.filter(path=>NATIVE_STATIC_PATHS[path]).map(path=>[path,NATIVE_STATIC_PATHS[path]]));
// Dynamic template IDs captured from exact saved native routes/pages, never inferred from a URL.
const dynamic={destination:'aa2s4',food:'mmbdr',hotel:'psc8e',blogPost:'s7ubj',legacyArcade:'hn63w',legacyMachine:'rby8l',legacyMachineIndex:'ij13e',legacyMachineList:'zgaq8'};
for(const id of [...Object.values(paths),...Object.values(dynamic)])if(!snapshot[id])throw Error('Native page absent from saved revision18: '+id);
const output={schemaVersion:1,basis:'isolated branch f37020b8 revision18, same runtime ownership registry',pageIds:[...new Set([...Object.values(paths),...Object.values(dynamic)])].sort(),homePageId:paths['/'],searchPageId:paths['/search'],excludedSearchView:RUNTIME_OWNERSHIP.excludedSearchView,homeExcludedKeys:['raidertube','sr','report','explore','view','place'],allowedHomeExplore:RUNTIME_OWNERSHIP.categoryKeys,allowedHomeViews:RUNTIME_OWNERSHIP.viewKeys,legacyRecordCollections:RUNTIME_OWNERSHIP.legacyCollections};
fs.writeFileSync(new URL('../generated/loader-page-ownership.json',import.meta.url),JSON.stringify(output,null,2)+'\n');console.log('Exact native fallback projection '+output.pageIds.length+' page IDs, '+JSON.stringify(output).length+' chars');
