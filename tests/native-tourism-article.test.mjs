import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { nativeGuideContent, renderNativeGuide } from '../src/public/native-guide-article.js';

const kinds = [['attraction','attractions','attractions-page.zwesd.js'],['historicSite','historical-sites','historical-sites-page.g1li4.js'],['tour','tours','tours-page.yqik8.js']];
function fixture(kind='attraction', prefix='attractions') {
    return { status:200, view:'detail', collection:'NearbyAttractions', route:{kind,path:'/'+prefix+'/fixture/york',key:'NearbyAttractions:fixture'}, record:{_id:'fixture',title:'Original attraction',sourceFacts:'<h2>Original full guide</h2><p>Existing practical choices and photographs.</p>',fullDescription:'Original shorter guide.'} };
}
for(const [kind,prefix,file] of kinds) {
    test(kind+' keeps the full existing guide and validates its native page wrapper',async()=>{
        const data=fixture(kind,prefix),before=JSON.stringify(data);
        assert.equal(nativeGuideContent(data,data.route.path,kind).bodyHtml,data.record.sourceFacts);
        assert.equal(JSON.stringify(data),before);
        const elements={'#srNativeGuideTitle':{},'#srNativeGuideArticle':{}},deps={'wix-location-frontend':{default:{prefix,path:['fixture','york']}},'wix-window-frontend':{getRouterData:()=>data},'backend/canonicalPages.web':{getCanonicalPage:async()=>{throw Error('Unexpected lookup');}},'public/native-guide-article':{renderNativeGuide}};
        let handler;const context=vm.createContext({$w:Object.assign(id=>elements[id],{onReady:fn=>{handler=fn;}})}),source=await fs.readFile(new URL('../src/pages/'+file,import.meta.url),'utf8'),module=new vm.SourceTextModule(source,{context});
        await module.link(spec=>new vm.SyntheticModule(Object.keys(deps[spec]),function(){for(const [k,v]of Object.entries(deps[spec]))this.setExport(k,v);},{context}));await module.evaluate();assert.equal(await handler(),true);assert.equal(elements['#srNativeGuideTitle'].text,data.record.title);assert.equal(elements['#srNativeGuideArticle'].html,data.record.sourceFacts);
    });
}
test('tourism native content rejects identity/path/kind/collection/status mismatches and offer substitution',()=>{
    for(const change of [d=>{d.route.key='NearbyAttractions:other';},d=>{d.record._id='other';},d=>{d.route.path+='-other';},d=>{d.route.kind='tour';},d=>{d.collection='AffiliateOffers';},d=>{d.status=503;},d=>{d.view='index';}]){const d=fixture();change(d);assert.equal(nativeGuideContent(d,'/attractions/fixture/york','attraction'),null);}
    assert.equal(nativeGuideContent(fixture(),'/attractions/fixture/york','unsupported'),null);
});
test('venue review beats its short source note, while ordinary text is escaped',()=>{
    const d=fixture();d.collection='Venues';d.route.key='Venues:fixture';d.record.sourceFacts='Source checked.';d.record.detailedReview='Fish & chips < £10\nNext line.\n\nNext paragraph.';
    assert.equal(nativeGuideContent(d,d.route.path,'attraction').bodyHtml,'<p>Fish &amp; chips &lt; £10<br>Next line.</p>\n<p>Next paragraph.</p>');
});
test('all three category landings keep their own original introduction without borrowing a venue',async()=>{
    for(const[kind,prefix]of kinds){const d={status:200,view:'index',route:{kind,path:'/'+prefix},metadata:{sourceTitle:'Original '+prefix,introduction:'Original category & visitor choices.'}};assert.equal(await renderNativeGuide({select:()=>({}),path:d.route.path,kind,routerData:d,load:async()=>{throw Error('Unexpected detail request');}}),true);assert.equal(nativeGuideContent(d,'/wrong',kind),null);}
});
test('initial tourism rendering awaits its exact fallback and never overwrites on failure',async()=>{
    const elements={'#srNativeGuideTitle':{text:'Existing title'},'#srNativeGuideArticle':{html:'Existing article'}};let release,finished=false;const pending=new Promise(resolve=>{release=resolve;});const operation=renderNativeGuide({select:id=>elements[id],path:'/attractions/fixture/york',kind:'attraction',load:async()=>await pending}).then(v=>{finished=true;return v;});await Promise.resolve();assert.equal(finished,false);release(fixture());assert.equal(await operation,true);
    const before=JSON.stringify(elements);assert.equal(await renderNativeGuide({select:id=>elements[id],path:'/attractions/fixture/york',kind:'attraction',load:async()=>{throw Error('Unavailable');}}),false);assert.equal(JSON.stringify(elements),before);
});
test('missing either native control preserves the original heading',async()=>{
    const title={text:'Existing heading'},d=fixture();assert.equal(await renderNativeGuide({select:id=>id==='#srNativeGuideTitle'?title:undefined,path:d.route.path,kind:'attraction',routerData:d,load:async()=>{throw Error('Unexpected fetch');}}),false);assert.equal(title.text,'Existing heading');
});
