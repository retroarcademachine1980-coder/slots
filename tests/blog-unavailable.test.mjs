import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {JSDOM} from 'jsdom';
const after=fs.readFileSync(new URL('../dist/sr.js',import.meta.url),'utf8').split(/(?=\/\* \[\d+\])/).find(s=>s.startsWith('/* [120]'));
assert(after,'Missing compiled blog renderer');
async function setup(source,{body=null,title='',feed=true,failedFeed=false,path='/post/missing-family-guide'}={}){
const native=(title?'<h1 data-hook="post-title">'+title+'</h1>':'')+(body===null?'':'<div data-hook="post-description">'+body+'</div>');
const w=new JSDOM('<!doctype html><head><title>Post | Spin Raiders</title><meta name="description" content="Explore Post on Spin Raiders."></head><body><main id="native">'+native+'</main></body>',{url:'https://www.spin-raiders.com'+path,runScripts:'outside-only'}).window;
let tick,ready=[],timers=0;w.setInterval=fn=>{tick=fn;return 1};w.clearInterval=()=>{};w.setTimeout=()=>++timers;w.clearTimeout=()=>{};
w.fetch=async()=>{if(failedFeed)throw Error('Feed temporarily unavailable');return {text:async()=>feed?'<rss><channel><item><title>Genuine family visit</title><link>https://www.spin-raiders.com/post/real-family-visit</link><description>A genuine excerpt.</description><pubDate>Tue, 03 Nov 2026 07:00:00 GMT</pubDate></item></channel></rss>':'<rss><channel></channel></rss>'}};
w.SR_APPROVED_HOME_CSS=' ';w.SR_BLOG2_CSS=' ';w.SR_GI=()=>'';w.SR_LI=()=>'';w.SR_SHELL={head:()=>'<header>Original tourism header</header>',foot:()=>'<footer>Original footer</footer>',own:()=>{},wire:()=>{}};w.SR_ROUTE_HTML={prepare:async s=>s};w.SR_RUNTIME={ready:(kind,url)=>ready.push({kind,url})};w.eval(source);
for(let i=0;i<165;i++){await new Promise(r=>setImmediate(r));await tick();}
return {w,root:w.document.querySelector('#sr-shell-page')?.shadowRoot,ready,close:()=>w.close()};
}
await test('compiled blog renderer fails clearly and preserves genuine articles',async()=>{
const checks=[];
for(const options of [{name:'missing native article',body:null},{name:'empty native body',body:'',title:'Genuine family visit',path:'/post/real-family-visit'},{name:'missing identity',body:'<p>Unidentified content.</p>',feed:false},{name:'feed failure plus absent article',body:null,failedFeed:true}]){
const f=await setup(after,options);try{assert.equal(f.root.querySelector('h1').textContent,'This article could not be loaded');assert.equal(f.root.querySelector('article'),null);assert.equal(f.root.querySelectorAll('a[href="/blog"]').length,1);assert.equal(f.root.querySelectorAll('a[href="/days-out"]').length,1);assert(f.root.querySelector('button[data-blog-retry]'));assert(!f.root.textContent.includes('Explore Post'));assert(!f.root.textContent.includes('By Spin Raiders'));assert(!f.root.querySelector('[data-copy]'));assert.equal(f.w.document.title,'Article unavailable | Spin Raiders');assert(f.ready.some(x=>x.kind==='article'));checks.push({name:options.name,pass:true});}finally{f.close();}}
for(const options of [{name:'real written article and photograph',title:'Our day with the boys',body:'<p>We had a brilliant time with the boys.</p><p>The popcorn, drinks and chocolate were £50.</p><figure><img src="https://static.wixstatic.com/media/ownphoto~mv2.jpg" alt="Jamie’s own family photograph"><figcaption>Existing caption.</figcaption></figure>'},{name:'real article despite feed failure',title:'Our genuine review',body:'<p>Actual visit and verdict.</p>',failedFeed:true},{name:'verified feed identity with native body',path:'/post/real-family-visit',body:'<p>Actual full article text.</p>'},{name:'genuine video article',title:'Our filmed day',body:'<iframe src="https://www.youtube.com/embed/realvideo"></iframe>'}]){
const f=await setup(after,options);try{assert(f.root.querySelector('article'));assert(!f.root.querySelector('#sr-article-unavailable'));assert(f.root.querySelector('[data-copy]'));assert.match(f.root.querySelector('article').textContent,/Our|Genuine/);if(options.name.includes('photograph')){assert.match(f.root.querySelector('.ar').textContent,/£50/);assert.match(f.root.querySelector('.ar img').alt,/Jamie/);assert.match(f.root.querySelector('figcaption').textContent,/Existing caption/);}checks.push({name:options.name,pass:true});}finally{f.close();}}
assert.equal(checks.length,8);
});
