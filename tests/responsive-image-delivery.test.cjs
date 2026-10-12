const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const script = fs.readFileSync(path.join(__dirname,'../dist/sr-image-quality-20261012.js'),'utf8');
function setup(html='') {
  const dom = new JSDOM('<body>' + html + '</body>',{url:'https://www.spin-raiders.com/',runScripts:'outside-only',pretendToBeVisual:true});
  const frames=[];
  dom.window.requestAnimationFrame=callback=>{frames.push(callback);return frames.length;};
  dom.window.setInterval=()=>1;
  function flush(){let count=0;while(frames.length&&count++<20)frames.shift()();assert.ok(count<20,'Image updates must settle.');}
  function start(){dom.window.eval(script);dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));flush();}
  return {dom,frames,flush,start};
}
function imageSize(image,width,height,sourceWidth,sourceHeight,top=0) {
  image.getBoundingClientRect=()=>({width,height,top,left:0,right:width,bottom:top+height});
  Object.defineProperty(image,'naturalWidth',{value:sourceWidth,writable:true,configurable:true});
  Object.defineProperty(image,'naturalHeight',{value:sourceHeight,writable:true,configurable:true});
}
test('Wide venue photographs retain enough pixels for a tall cover crop without downloading 1200px for every card',()=>{
  const {dom,start}=setup();const host=dom.window.document.createElement('div');host.id='sr-seaside-root';dom.window.document.body.append(host);
  const root=host.attachShadow({mode:'open'});root.innerHTML='<img style="object-fit:cover" src="https://static.wixstatic.com/media/real-photo~mv2.png/v1/fit/w_1200,h_1000,q_90/file.webp">';
  const image=root.querySelector('img');imageSize(image,310,295,1200,675);start();
  assert.equal(image.sizes,'525px');assert.match(image.src,/w_640,h_533,q_82,enc_auto/);assert.ok(image.srcset.includes('2560w'));assert.equal(image.decoding,'async');assert.equal(image.width,1200);assert.equal(image.height,675);
  dom.window.close();
});
test('Readable light-DOM homepage photos receive retina variants while unrelated app images remain untouched',()=>{
  const {dom,start}=setup('<section data-sr-native-home><img loading="lazy" style="object-fit:cover" src="https://static.wixstatic.com/media/town~mv2.webp/v1/fill/w_480,h_340,al_c,q_55,enc_avif/town.webp"></section><aside><img src="https://static.wixstatic.com/media/unrelated.jpg/v1/fit/w_350,h_350,q_50/pic.webp"></aside>');
  Object.defineProperty(dom.window,'devicePixelRatio',{value:2});const image=dom.window.document.querySelector('section img'),unrelated=dom.window.document.querySelector('aside img');imageSize(image,300,212,480,340,1500);imageSize(unrelated,350,350,350,350);const original=unrelated.src;start();
  assert.match(image.src,/fill\/w_640,h_453,al_c,q_82,enc_auto/);assert.equal(image.getAttribute('loading'),'lazy');assert.equal(unrelated.src,original);assert.equal(unrelated.srcset,'');dom.window.close();
});
test('Banner artwork stays at high quality and is loaded eagerly',()=>{
  const {dom,start}=setup();const host=dom.window.document.createElement('div');host.id='sr-seaside-root';dom.window.document.body.append(host);const root=host.attachShadow({mode:'open'});root.innerHTML='<section class="chero"><img src="https://static.wixstatic.com/media/banner~mv2.webp/v1/fit/w_1400,h_1400,q_85,enc_auto/file.webp"></section>';const image=root.querySelector('img');imageSize(image,1348,449,1400,466);start();assert.match(image.src,/q_88,enc_auto/);assert.equal(image.loading,'eager');assert.equal(image.getAttribute('fetchpriority'),'high');assert.equal(image.width,1400);assert.equal(image.height,466);dom.window.close();
});
test('A photograph loaded after the first scan corrects its cover-crop pixel requirement',()=>{
  const {dom,start,flush}=setup('<section data-sr-native-home><img style="object-fit:cover" src="https://static.wixstatic.com/media/shop~mv2.jpg/v1/fit/w_1400,h_1400,q_85,enc_auto/photo.webp"></section>');const image=dom.window.document.querySelector('img');imageSize(image,310,295,0,0);start();image.naturalWidth=1400;image.naturalHeight=647;image.dispatchEvent(new dom.window.Event('load'));flush();assert.match(image.src,/w_640,/);assert.ok(Number.parseInt(image.sizes)>630);dom.window.close();
});
test('Existing author-provided responsive images keep their source set',()=>{
  const {dom,start}=setup('<section data-sr-native-home><img src="https://static.wixstatic.com/media/photo.jpg" srcset="small.jpg 320w, large.jpg 1280w" sizes="50vw"></section>');const image=dom.window.document.querySelector('img');imageSize(image,300,200,1200,800);start();assert.equal(image.srcset,'small.jpg 320w, large.jpg 1280w');assert.equal(image.sizes,'50vw');dom.window.close();
});
