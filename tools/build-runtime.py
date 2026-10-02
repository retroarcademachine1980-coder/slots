#!/usr/bin/env python3
"""Build the single maintained source, delivery bundles and explicit test entry."""
import json,pathlib,subprocess,sys
root=pathlib.Path(__file__).resolve().parent.parent
fingerprint=[arg for arg in sys.argv[1:] if arg.startswith('--fingerprint=')]
assert len(fingerprint)<=1 and len(fingerprint)==len(sys.argv[1:]), 'Only --fingerprint=<sha256> is supported'
subprocess.run(['node',str(root/'tools/build-browser-route-client.mjs')]+fingerprint,cwd=root,check=True)
subprocess.run(['node',str(root/'tools/build-browser-route-client.mjs'),'--release-manager-test']+fingerprint,cwd=root,check=True)
source=root/'src/runtime';manifest=json.loads((source/'manifest.json').read_text());seen=set();parts=[manifest['header']]
for module in manifest['modules']:
 assert module['id'] not in seen,'Duplicate runtime module identity';seen.add(module['id'])
 if module.get('generated'):
  body=(root/module['generated']).read_text().rstrip()+'\n\n'
 else:
  body=(source/module['file']).read_text()
  for embed in module.get('embeds',[]):
   assert body.count(embed['token'])==1,'Missing or duplicate embedded-module marker'
   raw=(source/embed['file']).read_text()
   if not embed['trailingNewline']:raw=raw.removesuffix('\n')
   body=body.replace(embed['token'],json.dumps(raw,ensure_ascii=False,separators=(',',':')))
 parts.append('/* [%d] %s */\n'%(module['number'],module['name'])+body)
(root/'dist/sr.js').write_text(''.join(parts))
(root/'dist/sr.min.css').write_text((source/'global.css').read_text())
subprocess.run([sys.executable,str(root/'tools/split-bundle.py')],cwd=root,check=True)
subprocess.run([sys.executable,str(root/'tools/build-test-runtime.py')],cwd=root,check=True)
subprocess.run(['node','--check',str(root/'dist/sr.js')],cwd=root,check=True)
print('Built',len(seen),'source modules; artwork and module execution order preserved')
