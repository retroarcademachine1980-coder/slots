import { PUBLIC_DETAIL_FIELDS, PUBLIC_NESTED_FIELDS } from 'public/routes/publicDetailFields';
const PHOTO = PUBLIC_NESTED_FIELDS['gallery[]'];
const REFERENCE = PUBLIC_NESTED_FIELDS['evidenceSources[]'];
function primitive(value) { return value === null || ['string','boolean'].includes(typeof value) || typeof value === 'number' && Number.isFinite(value); }
function selectedObject(value, fields) {
  const out={}; for(const field of fields)if(Object.hasOwn(value,field)&&primitive(value[field]))out[field]=value[field]; return out;
}
function projectValue(field,value) {
  if(primitive(value))return value;
  if(value instanceof Date)return { $date:value.toISOString() };
  if(Array.isArray(value)){
    const fields=PUBLIC_NESTED_FIELDS[field+'[]'] || (/Gallery$/.test(field)?PHOTO:null);
    return value.map(item=>primitive(item)?item:fields&&item&&typeof item==='object'?selectedObject(item,fields):undefined).filter(item=>item!==undefined);
  }
  if(!value||typeof value!=='object')return undefined;
  if(Object.keys(value).length===1&&typeof value.$date==='string')return {$date:value.$date};
  if(field==='venuePhotoEvidence')return {items:projectValue('gallery',value.items||[])};
  if(field==='guideDetails'){
    const out=selectedObject(value,['kind','address','checked']);
    if(value.facts!==undefined)out.facts=projectValue('facts',value.facts);
    if(value.photos!==undefined)out.photos=projectValue('gallery',value.photos);
    return out;
  }
  const fields=PUBLIC_NESTED_FIELDS[field] || (/image|photo|glass/i.test(field)?PHOTO:['sourceAttributions','evidenceSources','downloadRefs','downloads'].includes(field)?REFERENCE:null);
  return fields?selectedObject(value,fields):undefined;
}
export function projectPublicDetail(collection,row,policy) {
  if(!row||typeof row!=='object')return null;
  const fields=collection==='Locations'?['_id','title','seoTitle','seoDescription','shortDescription','description','pageIntro','heroImage','mainImage','county','latitude','longitude','pageReady','directoryReady','guideReady']:PUBLIC_DETAIL_FIELDS;
  const denied=new Set(policy?.withheldFields||[]);
  if(policy?.offerActionsAllowed===false)for(const field of ['bookingUrl','affiliateUrl','offerUrl','outboundUrl','offerTitle','offerText','offerValidUntil','validUntil'])denied.add(field);
  const out={}; for(const field of fields)if(!denied.has(field)&&Object.hasOwn(row,field)){
    const value=projectValue(field,row[field]);if(value!==undefined)out[field]=value;
  }
  return out;
}
