const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs');const assert=require('node:assert/strict');
const root=require('node:path').join(__dirname,'../dist/');
(async()=>{
for(const route of ['/?explore=zoos','/?explore=theme-parks','/?explore=food-drink','/?explore=hidden-gems','/?explore=places-to-stay','/?explore=nature-outdoors','/?explore=holiday-parks','/?explore=arcade-bars','/?view=agc','/destination-recommendations?view=offers']){
 const errors=[];const vc=new VirtualConsole();vc.on('warn',(...a)=>errors.push(a.join(' ')));vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<!doctype html><html><head></head><body><div id="SITE_CONTAINER"></div></body></html>',{url:'https://www.spin-raiders.com'+route,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window;w.matchMedia=()=>({matches:false,addEventListener(){}});w.fetch=async()=>{throw Error('Unexpected fetch')};w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
 w.eval(fs.readFileSync(root+'sr.core.min.js','utf8'));
 w.SR_PUBLIC_DIRECTORY.D.rows=async(coll)=>[{_collection:coll,_id:'test',title:'York Test Venue',locationName:'York',category:'Arcade Bar',heroImage:'https://static.wixstatic.com/media/photo.jpg'}];
 w.eval(fs.readFileSync(root+'sr.discovery.min.js','utf8'));
 await new Promise(r=>setTimeout(r,450));
 const extended=w.document.querySelector('#sr-extended-pages');
 const cat=w.document.querySelector('#sr-seaside-root')?.shadowRoot?.querySelector('#sr-home-approved-20260921')?.shadowRoot;
 assert(extended||cat,'missing page '+route);
 assert.equal(errors.length,0,route+' '+errors.join('\n'));
 if(extended){assert(w.document.querySelector('#sr-brand-header'),'missing header '+route);assert(w.document.querySelector('#sr-brand-footer'),'missing footer '+route)}
 dom.window.close();console.log('PASS '+route);
}
})().catch(e=>{console.error(e);process.exitCode=1});
