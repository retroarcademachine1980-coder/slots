// Legacy record queries now redirect once; only current canonical routes render detail content.
const {execFileSync}=require('node:child_process'),path=require('node:path');
for(const suite of ['verify-incoming-alias.cjs','verify-canonical-details.cjs'])execFileSync(process.execPath,[path.join(__dirname,suite)],{stdio:'inherit'});
