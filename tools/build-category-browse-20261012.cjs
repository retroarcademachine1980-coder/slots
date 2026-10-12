const fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(base,'src/repairs/category-browse-20261012.js'),'utf8');
const discoveries=JSON.parse(fs.readFileSync(path.join(base,'content/hidden-gem-discoveries-20261012.json'),'utf8'));
if(!source.includes('/* DISCOVERY_DATA */ []'))throw Error('Category discovery marker missing');
fs.writeFileSync(path.join(base,'dist/sr-category-browse-20261012.js'),source.replace('/* DISCOVERY_DATA */ []',JSON.stringify(discoveries)));
console.log('Built category browsing and named discovery guides.');
