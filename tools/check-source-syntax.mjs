import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
let count=0;const root=path.resolve(new URL('../src',import.meta.url).pathname);
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){if(entry.name!=='runtime')walk(file);}else if(entry.name.endsWith('.js')){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status){process.stderr.write(result.stderr);process.exit(result.status);}count++;}}}
walk(root);console.log('Syntax checked '+count+' source files; runtime bundles are checked separately after assembly');
