const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let source=fs.readFileSync(path.join(root,'src/repairs/page-first-20261012.js'),'utf8');
for(const [marker,file] of [['WELCOME_DATA','page-welcome-20261012.json'],['PHOTO_DATA','category-photo-corrections-20261012.json']]){
  const data=JSON.parse(fs.readFileSync(path.join(root,'content',file),'utf8'));
  source=source.replace('/* '+marker+' */ {}',JSON.stringify(data));
}
fs.writeFileSync(path.join(root,'dist/sr-page-first-20261012.js'),source);
console.log('Built page introductions and original photograph delivery.');
