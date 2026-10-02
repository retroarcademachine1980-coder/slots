import { INDEX_ROUTES } from '../src/public/routes/indexRoutes.js';
import fs from 'node:fs';
import {ROUTES} from '../src/public/routes/canonicalRoutes.js';
const bindings=JSON.parse(fs.readFileSync('/workspace/shared/spin-raiders-release-preflight-20261002/all-custom-router-native-bindings.json'));
let source="// Generated ONLY from captured isolated native handler names. Not deployed.\nimport { canonicalRouter, canonicalSitemap } from 'backend/nativeRoutingService';\n\n";
const summaries=[];
for(const wrapped of bindings){for(const [id,router]of Object.entries(wrapped)){
 const all={...ROUTES,...INDEX_ROUTES};
 const kind=Object.keys(all).find(kind=>all[kind].prefix==='/'+router.prefix && (all[kind].fields.length || Object.hasOwn(INDEX_ROUTES,kind))),cfg=JSON.parse(router.config);
 const legacy=['hotels','nearby-attractions'].includes(router.prefix);
 if((!kind&&!legacy)||!/^\w+_Router$/.test(cfg.routerFunctionName)||!/^\w+_SiteMap$/.test(cfg.siteMapFunctionName))throw Error('Unverified native binding');
 if(legacy){source+=`export async function ${cfg.routerFunctionName}(request) { return legacyPathRouter('/${router.prefix}', request); }\n`;source+=`export function ${cfg.siteMapFunctionName}() { return []; }\n\n`;}
 else{source+=`export async function ${cfg.routerFunctionName}(request) { return canonicalRouter('${kind}', request); }\n`;source+=`export async function ${cfg.siteMapFunctionName}() { return canonicalSitemap('${kind}'); }\n\n`;}
 summaries.push({kind:kind||null,routeRole:legacy?'legacy-alias':'canonical',routerId:id,prefix:router.prefix,pageId:Object.values(router.pages)[0],pageName:router.prefix+'-page',routerFunctionName:cfg.routerFunctionName,siteMapFunctionName:cfg.siteMapFunctionName,status:'isolated-shell-only'});
}}
source += "// Dynamic hook spellings follow the documented prefix convention; invocation is a native test gate.\n";
source += "import { foodBeforeRouter, foodCustomizeQuery, foodAfterRouter } from 'backend/dynamicRoutingService';\n";
source += "import { legacyPathRouter } from 'backend/legacyRoutingService';\n";
source += "export function food_and_drink_beforeRouter(request) { return foodBeforeRouter(request); }\n";
source += "export function food_and_drink_customizeQuery(request, route, query) { return foodCustomizeQuery(request, route, query); }\n";
source += "export function food_and_drink_afterRouter(request, response) { return foodAfterRouter(request, response); }\n";
for(const prefix of ['arcade-venues','classic-fruit-machine-archive','classic-fruit-machine-archive-1']) {
 const name=prefix.replace(/-/g,'_');
 source += `export function ${name}_beforeRouter(request) { return legacyPathRouter('/${prefix}', request); }\n`;
}
const root=new URL('../',import.meta.url);fs.writeFileSync(new URL('src/backend/routers.js',root),source);fs.writeFileSync(new URL('docs/captured-native-handlers.json',root),JSON.stringify(summaries,null,2)+'\n');
console.log('Generated '+summaries.length+' exact router/sitemap pairs; native runtime verification pending');
