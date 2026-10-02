'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ESLint}=require('eslint'),wix=require('@wix/eslint-plugin-cli'),plugin=require('./eslint-plugin-spin-raiders/index.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'sr-lint-policy-'));
fs.mkdirSync(path.join(root,'src/backend'),{recursive:true});fs.mkdirSync(path.join(root,'src/public'),{recursive:true});fs.mkdirSync(path.join(root,'src/pages'),{recursive:true});
fs.writeFileSync(path.join(root,'package.json'),'{}');
fs.writeFileSync(path.join(root,'src/backend/example.web.js'),'export const test = 1;');
fs.writeFileSync(path.join(root,'src/backend/private.js'),'export const test = 1;');
const engine=new ESLint({cwd:root,useEslintrc:false,plugins:{'@wix/cli':wix,'spin-raiders':plugin},overrideConfig:{parserOptions:{ecmaVersion:'latest',sourceType:'module'},plugins:['@wix/cli','spin-raiders'],rules:{'@wix/cli/no-invalid-backend-import':'error','@wix/cli/no-forbidden-relative-imports':'error','spin-raiders/no-extraneous-site-dependencies':'error','spin-raiders/no-relative-site-imports':'error'}}});
async function errors(source,file='backend/test.js'){return(await engine.lintText(source,{filePath:path.join(root,'src',file)}))[0].messages.filter(message=>message.severity===2);}
(async()=>{try{
 for(const name of ['wix-data','wix-fetch','wix-http-functions','wix-location-frontend','wix-router','wix-seo-frontend','wix-web-module','wix-window-frontend'])assert.equal((await errors(`import x from '${name}';export {x};`)).length,0,name);
 for(const name of ['wix-not-a-platform-module','wix-data/private','lodash'])assert((await errors(`import x from '${name}';export {x};`)).some(message=>message.ruleId==='spin-raiders/no-extraneous-site-dependencies'),name+' must not be exempt');
 assert.equal((await errors("import {test} from 'backend/example.web'; export {test};",'public/client.js')).length,0,'.web modules are supported');
 assert((await errors("import {test} from 'backend/private.js'; export {test};",'public/client.js')).some(message=>message.ruleId==='@wix/cli/no-invalid-backend-import'),'private backend import must still fail');
 assert((await errors("import {test} from '../backend/private.js'; export {test};",'pages/page.js')).some(message=>message.ruleId==='@wix/cli/no-forbidden-relative-imports'),'official relative-boundary guard stays enabled');
 assert((await errors("import {test} from './sibling.js'; export {test};",'public/client.js')).some(message=>message.ruleId==='spin-raiders/no-relative-site-imports'),'unsupported same-folder site imports must fail');
 assert(!fs.existsSync(path.join(root,'src/velo.dependencies.json')),'test must not invent site dependencies');
 console.log('PASS exact8 Velo built-ins; unknown/npm/subpath imports still rejected; public/private boundary and supported .web imports verified; no fabricated dependencies');
}finally{fs.rmSync(root,{recursive:true,force:true})}})().catch(error=>{console.error(error);process.exitCode=1});
