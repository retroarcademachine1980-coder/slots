/* Build a small initial view from the unchanged, approved public homepage markup. */
const fs=require('node:fs'),path=require('node:path'),postcss=require('postcss'),{JSDOM}=require('jsdom');
const capture=process.argv[2];if(!capture)throw Error('Pass the captured public homepage header, hero and styles JSON.');
const root=path.resolve(__dirname,'..'),model=JSON.parse(fs.readFileSync(capture,'utf8'));
const dom=new JSDOM(model.header+model.hero),d=dom.window.document;
for(const e of d.querySelectorAll('.sr-nav-panel,.tagline,[data-sr-browse]'))e.remove();
const links=Array.from(d.querySelectorAll('nav.menu .sr-nav-parent')).map(a=>({href:a.getAttribute('href'),text:a.textContent}));
if(links.length!==7||!links.some(a=>a.href==='/classic-fruit-machines'))throw Error('Unexpected approved navigation.');
const mobile=d.querySelector('nav[aria-label="Mobile"]');if(mobile){mobile.replaceChildren(...links.map(({href,text})=>{const a=d.createElement('a');a.href=href;a.textContent=text;return a;}));}
for(const e of d.querySelectorAll('*'))for(const a of e.getAttributeNames())if(a.startsWith('data-sr')||a==='aria-controls'||a==='aria-expanded')e.removeAttribute(a);
for(const img of d.querySelectorAll('img'))for(const a of ['srcset','sizes','style'])img.removeAttribute(a);
const search=d.querySelector('.nav-search');if(search){const a=d.createElement('a');a.className=search.className;a.href='/search';a.setAttribute('aria-label','Search');a.innerHTML=search.innerHTML;search.replaceWith(a);}
const header=d.querySelector('header'),hero=d.querySelector('.hero');if(!header||!hero||!hero.querySelector('.hero-search'))throw Error('The approved banner is missing.');
const fragment='<div id="sr-home-early" data-sr-native-home>'+header.outerHTML+hero.outerHTML+'</div>';
if(fragment.length>3800)throw Error('Initial homepage view exceeds its character budget.');
fs.writeFileSync(path.join(root,'content/home-early-20261012.html'),fragment+'\n');
const critical=postcss.root(),prefix='#sr-home-early';
function wanted(selector){return !/\.panel\b|\.tagline\b|\.dd\b/.test(selector)&&(/(^|[\s>+~,])(?:\.masthead|\.nav(?:\b|-)|\.brand\b|\.menu\b|\.button\b|\.hero(?:\b|-)|\.sky\b|\.quick\b|\.burger\b|\.sr-nav-)/.test(selector)||selector===':host'||selector==='*');}
function copy(node,target,kind){
 if(node.type==='rule'){
  if(node.parent?.type==='atrule'&&/keyframes$/.test(node.parent.name)){target.append(node.clone());return;}
  const selectors=node.selectors.filter(s=>kind==='hero'?wanted(s):!/(home-about-grid|home-picks|home-value|sr-discovery|sr-day-ideas)/.test(s)&&/(home-guide-intro|home-kicker|sr-featured-offers|highlights|heading|card-copy|\.card\b|\.badge\b|\.arrow\b|sr-affiliate-note|\.outline\b)/.test(s));
  if(!selectors.length)return;const cloned=node.clone();cloned.selectors=selectors.map(s=>kind==='hero'?(s===':host'?prefix:s==='*'?prefix+' *':prefix+' '+s):s);target.append(cloned);
 }else if(node.type==='atrule'&&node.name!=='import'){
  const group=node.clone({nodes:[]});for(const child of node.nodes||[])copy(child,group,kind);if(group.nodes?.length)target.append(group);
 }
}
for(const node of postcss.parse(model.css[0]).nodes)copy(node,critical,'hero');
for(const node of postcss.parse(fs.readFileSync(path.join(root,'dist/sr-home-native-20261012.css'),'utf8')).nodes)copy(node,critical,'guide');
critical.append(postcss.parse('#sr-home-early{display:block;background:#fff;color:#102744}body:has(#sr-home-early) #sr-seaside-root{display:none!important}#sr-home-native-source{display:block;background:#fff}#sr-home-native-source .home-guide{margin:0 auto;padding:28px 20px;max-width:1376px}#sr-home-native-source .home-guide-intro{margin-bottom:26px}#sr-home-native-source .home-guide-intro h1{font-size:clamp(31px,4vw,46px);line-height:1.1;color:#102744;margin:8px 0 12px}#sr-home-native-source .home-guide-intro p{font-size:18px;line-height:1.55;max-width:950px}#sr-home-early .nav-search{display:grid;place-items:center;text-decoration:none}'));
critical.append(postcss.parse('#sr-home-early .sr-nav-parent{display:inline-flex;align-items:center;gap:7px;text-decoration:none;color:#fff;font-size:15px;font-weight:800;padding:10px 0}#sr-home-early .sr-nav-group{display:block}'));
// Remove formatting only; preserve the original rules and media breakpoints.
critical.walk(n=>{n.raws.before='';n.raws.between=n.type==='decl'?':':'';if(n.type==='rule'||n.type==='atrule')n.raws.after='';});
let css=critical.toString();if(css.length>14800)throw Error('Review the critical stylesheet: '+css.length+' characters exceeds the embed budget.');
fs.writeFileSync(path.join(root,'dist/sr-home-critical-20261012.css'),css+'\n');
console.log(JSON.stringify({fragmentCharacters:fragment.length,criticalCharacters:css.length}));dom.window.close();
