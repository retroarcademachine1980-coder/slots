const fs=require('fs');const G='packages/site-app/src/global/';
function rep(f,a,b,all){let s=fs.readFileSync(G+f,'utf8');const n=s.split(a).length-1;if(n<1||(!all&&n!==1))throw new Error(f+' x'+n+': '+a.slice(0,60));s=all?s.split(a).join(b):s.replace(a,()=>b);fs.writeFileSync(G+f,s);}
const L='https://www.spin-raiders.com';
// menu
const items=[['Days out','/days-out'],['Attractions','/attractions'],['Food & drink','/food-and-drink'],['Stays','/places-to-stay'],['Offers','/offers'],['Arcades','/arcade'],['Fruit machines','/classic-fruit-machines'],['Fuel prices','/plan-a-trip'],['Plan a day out →','/plan-a-trip']];
fs.writeFileSync(G+'menus/CUSTOM_MAIN_MENU.json',JSON.stringify({name:'Custom Main Menu',items:[{label:'Home',link:{target:'_self',href:'/'}},...items.map(([l,h],i)=>({label:l,link:{type:'ExternalLink',id:'dataItem-menu'+i,url:L+h,target:'_self'}}))]},null,4));
// header logo
let H=fs.readFileSync(G+'components/Header_mb7ogqqn/structure.jsx','utf8');
H=H.replace("mediaType={'svg'}","mediaType={'image'}");
const i0=H.indexOf('image={{',H.indexOf('<SiteLogo'));const i1=H.indexOf('a11y=',i0);
if(i0<0||i1<0)throw 'logo';
H=H.slice(0,i0)+"image={{ name: 'Spin Raiders logo', uri: '3a517e_5432348708874a9792a6d36b5f83321a~mv2.png', height: 116, alt: 'Spin Raiders, discover more of the UK', type: 'Builder.Image', width: 460 }}\n                    "+H.slice(i1);
fs.writeFileSync(G+'components/Header_mb7ogqqn/structure.jsx',H);
const HL='components/Header_mb7ogqqn/layout.css';
rep(HL,'width: 11.91%;\n    aspect-ratio: 1 / 0.19628935162340871;','width: --spx(230);\n    aspect-ratio: 1 / 0.2522;');
rep(HL,'margin-top: --spx(30.546875);\n    margin-bottom: --spx(30.546875);','margin-top: --spx(12);\n    margin-bottom: --spx(12);');
rep(HL,'width: --spx(280);','width: --spx(900);');
rep(HL,'margin-top: --spx(25.109);\n    margin-bottom: --spx(25.094);','margin-top: --spx(14);\n    margin-bottom: --spx(10);');
const HS='components/Header_mb7ogqqn/style.css';
rep(HS,'    --backgroundOverlayOpacity: 1;\n    --backgroundColor: var(--wst-base-1-color)','    --backgroundOverlayOpacity: 1;\n    --backgroundColor: var(--wst-base-2-color)');
rep(HS,'    background-color: var(--wst-base-1-color);\n    padding-inline-end: --spx(6);','    background-color: transparent;\n    padding-inline-end: --spx(6);');
rep(HS,'    text-transform: capitalize;\n    color: var(--wst-paragraph-2-color);\n    font: var(--wst-paragraph-2-font);','    text-transform: none;\n    color: var(--wst-base-1-color);\n    font: var(--wst-heading-6-font);');
rep(HS,'--fill: var(--wst-base-2-color);\n        --size: --spx(30)','--fill: var(--wst-base-1-color);\n        --size: --spx(30)');
rep(HS,'    --fill: #31190F\n}','    --fill: var(--wst-base-1-color)\n}');
// footer
const FS='components/Footer_kbgakgyt/structure.jsx';
let F=fs.readFileSync(G+FS,'utf8');
const links=[['About us','/about-us'],['Report a change','/report-a-change'],['Safer gambling','/safer-gambling'],['Privacy','/privacy-policy'],['Terms','/terms'],['Fuel prices','/plan-a-trip']].map(([l,h])=>`<a href="${L}${h}" target="_self">${l}</a>`).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
const html=`<p><span style="font-size:22px;"><strong>SPIN RAIDERS</strong></span></p><p>Putting great places back on the map. Real places · Honest guides · Great tips · For all ages.</p><p>${links}</p><p>&copy; 2026 Spin Raiders</p>`;
const a=F.indexOf("html: '"),b=F.indexOf("',\n",a);if(a<0||b<0)throw 'footer';
F=F.slice(0,a)+'html: '+JSON.stringify(html)+F.slice(b+1);fs.writeFileSync(G+FS,F);
const FST='components/Footer_kbgakgyt/style.css';
rep(FST,'    --backgroundColor: var(--wst-base-1-color);\n    --backgroundImage: none','    --backgroundColor: var(--wst-base-2-color);\n    --backgroundImage: none');
rep(FST,'    color: var(--wst-paragraph-3-color);','    color: var(--wst-base-1-color);');
rep('components/Footer_kbgakgyt/layout.css','width: 36.57%;','width: 90%;');
console.log('header/footer ok');
