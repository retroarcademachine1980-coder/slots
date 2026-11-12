import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { createNativeRouter } from '../src/public/routes/nativeRouterAdapter.js';
import { createRouteContext } from '../src/public/routes/canonicalRoutes.js';
import { categoryGuideArticle } from '../src/public/routes/categoryGuideArticles.js';
import { renderNativeGuide } from '../src/public/native-guide-article.js';

// Independent hashes of the recovered, rendered public guide articles (12 Nov).
const captured=[
 ['/attractions','attraction','attractions-page.zwesd.js','2ea3dd8d075548de2b1a62a8b55c2cde4d00826d8ae403cecb5654a16d6e24e1'],
 ['/historical-sites','historicSite','historical-sites-page.g1li4.js','499e01788f7aa222abed64c267aa698f07e4a2c79b71ca224b4c07501c1a4617'],
 ['/tours','tour','tours-page.yqik8.js','1c99d589b7d79756d17eab12b884fd0dc15335bd574684f8d1e528c617c17caa'],
 ['/museums','museum','museums-page.dn097.js','d39c9e3a7bccd3a9d013f0545641341cfbcab1f4655387b1b4c977c74090f04d'],
 ['/zoos','zoo','zoos-page.di2hv.js','5d018b0147d4083f3a35d8c06f79df3b2904b62449708f69713995a5d762e2e9'],
 ['/bowling','bowling','bowling-page.zll98.js','afdf56c9eb0da45246d698f2fea5057e701897cbf85b91b62d14802f5d673065'],
 ['/sea-life','seaLife','sea-life-page.ornf4.js','6854dbdb167e9c9fc9158a89ac805c5932dcecbb8738835a09dff8c637c5ea37'],
 ['/cinemas','cinema','cinemas-page.u20u0.js','54b6f937d269ed53cf383b7f7a43af0a9c28c64ce3c4f94757000e4f0880e0a1']
];
const manifest=JSON.parse(await fs.readFile(new URL('../config/routes/manifest.json',import.meta.url))),context=createRouteContext(manifest);
for(const [path,kind,file,hash] of captured)test(path+' delivers its actual complete public article through the native page lifecycle',async()=>{
 const before=JSON.stringify(context.landings[path]);let reads=0;
 const router=createNativeRouter({context,manifest,ok:(page,data,head)=>({page,data,head}),readById:()=>{reads++;throw Error('Category must not borrow a venue');},sendStatus:s=>({status:s})});
 const response=await router.canonical(path),article=response.data.metadata.articleHtml;
 assert.equal(createHash('sha256').update(article).digest('hex'),hash);
 assert.equal(response.data.metadata.introduction,context.landings[path].seo.description);
 assert.equal(response.head.title,context.landings[path].seo.title);
 assert.equal(reads,0);assert.equal(JSON.stringify(context.landings[path]),before);
 const elements={'#srNativeGuideTitle':{},'#srNativeGuideArticle':{},'#srNativeGuideBody':{}},deps={'wix-location-frontend':{default:{prefix:path.slice(1),path:[]}},'wix-window-frontend':{getRouterData:()=>response.data},'backend/canonicalPages.web':{getCanonicalPage:async()=>{throw Error('Unexpected detail request');}},'public/native-guide-article':{renderNativeGuide}};
 let handler;const sandbox=vm.createContext({$w:Object.assign(id=>elements[id],{onReady:fn=>{handler=fn;}})}),source=await fs.readFile(new URL('../src/pages/'+file,import.meta.url),'utf8'),module=new vm.SourceTextModule(source,{context:sandbox});
 await module.link(spec=>new vm.SyntheticModule(Object.keys(deps[spec]),function(){for(const[k,v]of Object.entries(deps[spec]))this.setExport(k,v);},{context:sandbox}));await module.evaluate();await handler();
 assert.equal(elements['#srNativeGuideTitle'].text,response.data.metadata.sourceTitle);
 assert.equal(elements[kind==='seaLife'?'#srNativeGuideBody':'#srNativeGuideArticle'].html,article);
 assert.equal(categoryGuideArticle(path,kind+'-wrong'),null);
});
test('category copy is never selected for a different path or a venue detail',()=>{
 assert.equal(categoryGuideArticle('/attractions/fixture/york','attraction'),null);
 assert.equal(categoryGuideArticle('/unknown','attraction'),null);
 assert.equal(categoryGuideArticle('/ATTRACTIONS','attraction'),null);
});
