const fs=require('node:fs'),path=require('node:path');
module.exports=async function({setup,fixture,pause,assert}){
 const snapshot=JSON.parse(fs.readFileSync(path.join(__dirname,'../../tests/fixtures/masala-public-sources.json'))),sources=snapshot.sources;
 const primary=sources.find(x=>x.collection==='FoodAndDrink'),original=sources.find(x=>x.collection==='NearbyAttractions');
 const url='/food-and-drink/masala-malt-grimsby',response=fixture(primary.collection,primary.row._id,url,primary.row);
 response.sourceGroup={groupId:'masala-originals',relation:'same-entity',primaryKey:primary.key,sourceKeys:sources.map(x=>x.key)};
 response.sourceRecords=sources.map(x=>({...x,row:{...x.row,_collection:x.collection}}));
 const c=setup(url,{[url]:response},{fetchQuery:()=>({dataItems:[]})});await pause();const root=c.root('sr-food-page');assert(root,'Final food owner mounted');
 const template=c.w.document.createElement('template');template.innerHTML=original.row.sourceFacts;
 const plain=x=>String(x||'').replace(/\s+/g,' ').trim(),review=plain(template.content.textContent),rendered=plain(root.textContent);
 assert(review.length>10000,'Fixture contains the complete first-hand review');assert(rendered.includes(review),'Entire original narrative appears without truncation');assert.equal(rendered.split(review).length-1,1,'Same source narrative is displayed once');
 const imageId=value=>(String(value).match(/media\/([^/?#]+)/)||[])[1];const expected=new Set([imageId(original.row.heroImage),...[...template.content.querySelectorAll('img')].map(img=>imageId(img.getAttribute('src')))].filter(Boolean)),actual=new Set([...root.querySelectorAll('img')].map(img=>imageId(img.getAttribute('src'))).filter(Boolean));for(const id of expected)assert(actual.has(id),'Original photograph preserved: '+id);
 for(const caption of template.content.querySelectorAll('figcaption'))assert(rendered.includes(plain(caption.textContent)),'Original photo caption preserved');
 const source=root.querySelector('[data-source-key="'+original.key+'"]');assert(source);assert(source.textContent.includes(original.row.sourceName),'Source attribution preserved');assert(source.textContent.includes(original.row.verifiedDate),'Original checked date preserved');assert(source.textContent.includes(original.row.raiderAssessmentDate),'Assessment date preserved');assert(source.textContent.includes('shown in the review above'),'Original source points to its displayed narrative');
 assert(!root.querySelector('a[href*="?collection="]'));assert(!/PRIVATE_OWNER|_owner|backupText/.test(rendered));c.close();
 return {reviewCharacters:original.row.sourceFacts.length,normalizedTextCharacters:review.length,originalPhotoCount:expected.size,sourceName:original.row.sourceName,sourceCheckedDate:original.row.verifiedDate};
};
