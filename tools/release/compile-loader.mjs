import fs from 'node:fs';
import crypto from 'node:crypto';
import { minify } from 'terser';
import { parse } from 'acorn';
import { validateCandidateConfig } from './build-identity.mjs';
import { candidateAssets } from './runtime-loader.mjs';
const dir = new URL('.', import.meta.url);
const root = new URL('../../', dir);
const module = name => fs.readFileSync(new URL(name, dir),'utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const registry = fs.readFileSync(new URL('generated/runtime-ownership.js',root),'utf8');
async function candidateAsset(){
 const source=`(function(){${registry}\n${module('runtime-loader.mjs')}\nObject.defineProperty(window,'SR_CANDIDATE_BOOT',{value:async function(context){if(!['candidate-test','candidate-production'].includes(context.selection.runtime))throw Error('Invalid runtime');return startReleaseLoader({window,document,config:context.config,ownsRoute:loc=>window.SR_RUNTIME_OWNERSHIP.owns('https://www.spin-raiders.com'+loc.pathname+loc.search,{transitionalIndexInputs:context.config.transitionalIndexInputs!==false}),preservedBootstrap:()=>{throw Error('Wrong build')},readInputs:async()=>({}),select:async options=>{options.onCandidateNative();context.onTakeover();return context.selection;}});},writable:false,configurable:false});})();`;
 return (await minify(source,{compress:{passes:3},mangle:true,format:{inline_script:true}})).code;
}
if(process.argv[2]==='--asset-only'){
 if(!process.argv[3])throw Error('Provide asset output path');
 const code=await candidateAsset();fs.writeFileSync(process.argv[3],code);console.log(JSON.stringify({path:process.argv[3],bytes:Buffer.byteLength(code),sha256:crypto.createHash('sha256').update(code).digest('hex')}));process.exit(0);
}
const [configPath, outputPath, assetOutputPath] = process.argv.slice(2);
if (!configPath || !outputPath || !assetOutputPath) throw new Error('Usage: node compile-loader.mjs CONFIG.json INLINE.html CANDIDATE-ASSET.js');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
if (!validateCandidateConfig(config)) throw new Error('Candidate lacks immutable identity and local test authorization');
candidateAssets(config, 'candidate-test');
if (config.promotionApproved && !config.acceptanceEvidence) throw new Error('Production authorization lacks captured host acceptance');
const baseline = fs.readFileSync(new URL('fixtures/preserved-loader.html', dir), 'utf8');
const capturedHash = crypto.createHash('sha256').update(baseline).digest('hex');
if (capturedHash !== 'ce48a7e45eb1a1e8eb499e79194ece116774d80c7058f3714704d6e3d544d682') throw new Error('Preserved loader capture changed; independent review required');
const tags=[];
for (const match of baseline.replace(/<noscript>[\s\S]*?<\/noscript>/g,'').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>|<link\b([^>]*)>/g)) {
 const tag=match[3]===undefined?'script':'link', attrs={};
 for(const a of (match[3]??match[1]).matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[a[1]]=a[2]??'';
 tags.push({tag,attrs,text:match[2]||''});
}
const extract = (name, names) => {
 const text=fs.readFileSync(new URL(name,dir),'utf8'), ast=parse(text,{ecmaVersion:'latest',sourceType:'module'});
 return names.map(name=>{const node=ast.body.map(n=>n.declaration||n).find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);if(!node)throw Error('Missing shared primitive '+name);return text.slice(node.start,node.end)}).join('\n');
};
const pageRegistry = JSON.parse(fs.readFileSync(new URL('generated/loader-page-ownership.json',root),'utf8'));
delete pageRegistry.basis; delete pageRegistry.schemaVersion;
const primitives=extract('runtime-loader.mjs',['navigationKey','createFingerprintReader','createStatusView','loadResource','waitForNativeInputs']);
const prefixes = ['https://cdn.jsdelivr.net/gh/retroarcademachine1980-coder/slots@','https://static.wixstatic.com/media/3a517e_'];
const compactLiteral = value => { const i=prefixes.findIndex(p=>value.startsWith(p)); return i<0?JSON.stringify(value):`P${i}+${JSON.stringify(value.slice(prefixes[i].length))}`; };
const compactSource = source => {
 const edits=[];const walk=node=>{if(!node||typeof node!=='object')return;if(node.type==='Literal'&&typeof node.value==='string'&&prefixes.some(p=>node.value.startsWith(p)))edits.push({start:node.start,end:node.end,text:'('+compactLiteral(node.value)+')'});for(const [k,v]of Object.entries(node)){if(k==='start'||k==='end')continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}};
 walk(parse(source,{ecmaVersion:'latest'}));for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);return source;
};
const bootStatements=tags.map(spec=>spec.text?compactSource(spec.text):`put(${JSON.stringify(spec.tag)},{${Object.entries(spec.attrs).map(([k,v])=>JSON.stringify(k)+':'+compactLiteral(v)).join(',')}});`).join('\n');
const baselineBoot=`function preservedBootstrap(){const P0=${JSON.stringify(prefixes[0])},P1=${JSON.stringify(prefixes[1])};function put(tag,attrs){const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);document.head.appendChild(n)}${bootStatements}}`;
const compactPageRegistry='{'+Object.entries(pageRegistry).map(([key,value])=>JSON.stringify(key)+':'+(Array.isArray(value)&&value.length&&value.every(v=>typeof v==='string'&&!v.includes(','))?JSON.stringify(value.join(','))+'.split(",")':JSON.stringify(value))).join(',')+'}';
// Approval artifacts stay in the local release record; no private paths or report
// contents are embedded into the public page. These immutable booleans carry the
// compiler-validated gate, while exact build and API fingerprints remain public.
const runtimeConfig={...config,localTestEvidence:Boolean(config.localTestEvidence),acceptanceEvidence:Boolean(config.acceptanceEvidence)};
const inline=`(function(){const OWNER='release-loader';\n${module('build-identity.mjs')}\n${primitives}\n${module('inline-boot.mjs')}\n${baselineBoot}\nbootInline({window,document,config:${JSON.stringify(runtimeConfig)},pageRegistry:${compactPageRegistry},preservedBootstrap}).catch(()=>{});})();`;
const stripErrorDetails = source => {
 const edits=[];const walk=node=>{if(!node||typeof node!=='object')return;if(node.type==='NewExpression'&&node.callee?.name==='Error'&&node.arguments.length)edits.push({start:node.arguments[0].start,end:node.arguments.at(-1).end});for(const[k,v]of Object.entries(node)){if(k==='start'||k==='end')continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}};walk(parse(source,{ecmaVersion:'latest'}));for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+source.slice(edit.end);return source;
};
const inlineMin=await minify(stripErrorDetails(inline),{compress:{passes:3},mangle:{properties:{regex:/^(homePageId|searchPageId|excludedSearchView|homeExcludedKeys|allowedHomeExplore|allowedHomeViews|legacyRecordCollections|loading|failure|hold|clearStatus|release|sync|takeover)$/}},format:{inline_script:true}});
if(inlineMin.error)throw inlineMin.error;
const html='<script>'+inlineMin.code+'</script>\n<noscript><p>Spin Raiders needs JavaScript for interactive guides. Please enable JavaScript.</p></noscript>\n';
if(html.length>15000)throw Error(`Wix embed limit exceeded: ${html.length}/15000 characters`);
const assetMin={code:await candidateAsset()};
fs.writeFileSync(outputPath,html);fs.writeFileSync(assetOutputPath,assetMin.code);
console.log(JSON.stringify({outputPath,inlineCharacters:html.length,assetOutputPath,assetBytes:Buffer.byteLength(assetMin.code),promotionApproved:config.promotionApproved===true,baselineSha256:capturedHash},null,2));
