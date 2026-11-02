import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('release identity can verify immutable Git bytes independently of Windows checkout filters', () => {
 const temporaryRoot=fs.mkdtempSync(path.join(os.tmpdir(),'sr-identity-'));
 const root=fs.realpathSync(temporaryRoot);
 const repository=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
 const compute=(...args)=>spawnSync(process.execPath,['tools/compute-release-identity.mjs','config/routes/manifest.json',...args],{cwd:root,encoding:'utf8'});
 const success=(...args)=>{const result=compute(...args);assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);};
 try {
  for(const directory of ['tools','src/runtime','config/routes','generated'])fs.mkdirSync(path.join(root,directory),{recursive:true});
  fs.copyFileSync(path.join(repository,'tools/compute-release-identity.mjs'),path.join(root,'tools/compute-release-identity.mjs'));
  fs.writeFileSync(path.join(root,'config/routes/manifest.json'),JSON.stringify({deploymentBlocked:false,owners:{}}));
  fs.writeFileSync(path.join(root,'src/runtime/manifest.json'),'{}\n');
  fs.writeFileSync(path.join(root,'src/example.js'),'export const value = 1;\n');
  git('init','--quiet');git('-c','core.autocrlf=false','add','--all');
  const tree=git('write-tree');
  const first=success('--git-tree='+tree),legacy=success();
  assert.equal(first.sourceFiles,2);
  const sourcePath=path.join(root,'src/example.js');
  fs.writeFileSync(sourcePath,'export const value = 1;\r\n');
  assert.deepEqual(success('--git-tree='+tree),first);
  assert.notEqual(success().releaseFingerprint,legacy.releaseFingerprint);
  const missing=git('mktree');
  const incomplete=compute('--git-tree='+missing);
  assert.notEqual(incomplete.status,0);assert.match(incomplete.stderr,/complete reconciled source inventory/);
  const mutable=compute('--git-tree=main');
  assert.notEqual(mutable.status,0);assert.match(mutable.stderr,/Only an exact/);
  const commit=git('-c','user.name=Source identity fixture','-c','user.email=fixture@example.invalid','commit-tree',tree,'-m','Fixture only');
  const wrongKind=compute('--git-tree='+commit);
  assert.notEqual(wrongKind.status,0);assert.match(wrongKind.stderr,/must be a Git tree/);
  success('--git-tree='+tree);
  const proof=JSON.parse(fs.readFileSync(path.join(root,'generated/release-source-digests.review.json'),'utf8'));
  assert.equal(proof.gitTree,tree);
  assert.deepEqual(proof.entries.map(entry=>entry.name),['src/example.js','src/runtime/manifest.json']);
  for(const entry of proof.entries){
   const blob=execFileSync('git',['show',tree+':'+entry.name],{cwd:root});
   assert.equal(entry.sha256,crypto.createHash('sha256').update(blob).digest('hex'));
  }
 }finally{
  // Only the fresh fixture created by this test may be removed.
  assert.equal(path.dirname(root),fs.realpathSync(os.tmpdir()));
  assert(path.basename(root).startsWith('sr-identity-'));
  fs.rmSync(root,{recursive:true,force:true});
 }
});
