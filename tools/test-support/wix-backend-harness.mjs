import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const ROOT=path.resolve(new URL('../../src',import.meta.url).pathname);
export async function loadBackend(file,override={},capture={},manifestInput={}){
 const data=override;
 function query(collection){const filters=[];const q={};for(const method of ['limit','ascending','descending','contains','ne','or'])q[method]=()=>q;
  q.eq=(field,value)=>{if(field!=='featured')filters.push(row=>row[field]===value);return q;};
  q.hasSome=(field,values)=>{filters.push(row=>values.includes(row[field]));return q;};
  q.find=async()=>{if(data[collection] instanceof Error)throw data[collection];return {items:(data[collection]||[]).filter(row=>filters.every(f=>f(row))),hasNext:()=>false};};q.count=async()=>data[collection]?.length||0;return q;
 }
 const context=vm.createContext({console,URL,URLSearchParams,Date,Set,Map,Promise});const cache=new Map();
 const synthetic=(id,values)=>{const m=new vm.SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value);},{context,identifier:id});cache.set(id,m);return m;};
 synthetic('wix-data',{default:{query,get:async(c,id)=>{capture.gets ||= [];capture.gets.push(c+':'+id);if(data[c] instanceof Error)throw data[c];return(data[c]||[]).find(r=>r._id===id)}}});
 const seoCalls={links:[],title:[],metaTags:[],structuredData:[]};capture.seo=seoCalls;
 synthetic('wix-seo-frontend',{default:{links:[{rel:'author',href:'https://www.spin-raiders.com/about-us'}],setLinks:async value=>seoCalls.links.push(value),setTitle:async value=>seoCalls.title.push(value),setMetaTags:async value=>seoCalls.metaTags.push(value),setStructuredData:async value=>seoCalls.structuredData.push(value)}});
 synthetic('wix-router',{next:()=>({status:'next'}),ok:(page,data,head)=>({status:200,page,data,head}),notFound:()=>({status:404}),sendStatus:status=>({status:Number(status)}),redirect:(url,status)=>({status:Number(status),url}),WixRouterSitemapEntry:class {constructor(name){this.name=name;}}});
 synthetic('wix-web-module',{Permissions:{Anyone:'Anyone'},webMethod:(_permission,fn)=>fn});
 synthetic('public/routes/routeManifest.generated',{routeManifest:manifestInput});
 async function get(spec,ref){if(cache.has(spec))return cache.get(spec);let filename;
  if(spec.startsWith('backend/')||spec.startsWith('public/'))filename=path.join(ROOT,spec+'.js');
  else filename=path.resolve(path.dirname(ref),spec);
  if(cache.has(filename))return cache.get(filename);
  const pending=fs.readFile(filename,'utf8').then(source=>new vm.SourceTextModule(source,{context,identifier:filename}));cache.set(filename,pending);return pending;
 }
 const mod=await get(file,ROOT);await mod.link((s,r)=>get(s,r.identifier));await mod.evaluate();return mod.namespace;
}
