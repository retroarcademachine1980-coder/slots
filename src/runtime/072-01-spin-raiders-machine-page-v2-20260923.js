(function () {
  'use strict';
  window.SR_ARCHIVE_DETAIL = async function (record, {S, C, root, e: escape, photo, cardPhoto, current = () => true, setTitle = title => { document.title = title; }}) {
    const archive = '/classic-fruit-machines';
    const list = value => Array.isArray(value) ? value : typeof value === 'string' && value.trim().startsWith('[') ? (() => { try { const rows=JSON.parse(value);return Array.isArray(rows)?rows:[]; } catch { return []; } })() : value ? [value] : [];
    const text = value => C.text(value || '');
    const paragraphs = value => String(value || '').split(/\n\s*\n|<\/p\s*>|<br\s*\/?\s*>/i).map(text).filter(Boolean);
    const css = () => (window.SR_APPROVED_HOME_CSS || '') + (window.SR_SHELL?.css || '') + (window.SR_VENUE3_CSS || '') + (window.SR_ARCHIVE_DETAIL2_CSS || '');
    const header = () => window.SR_SHELL?.head(4) || '';
    const footer = () => window.SR_SHELL?.foot() || '';
    root.innerHTML = '<style>' + css() + '</style>' + header() + '<main class="wrap vm mw"><p role="status">Loading machine record…</p></main>' + footer();
    try {
      const resolved = record && typeof record === 'object' ? {status:200,collection:'ClassicFruitMachines',row:record} : await window.SR_CURRENT_ROUTE();
      if (!current()) return;
      const row = resolved.status === 200 && resolved.collection === 'ClassicFruitMachines' && window.SR_ROUTE_UI.ready(resolved.row) ? resolved.row : null;
      if (!row || !C.usable(row)) throw Error('Entry not found');
      const title = (text(row.title) || 'Classic fruit machine').split(/[—–]/)[0].trim();
      const maker = row.manufacturer || list(row.manufacturers)[0] || '';
      const year = C.year(row) || row.releaseYear || row.yearReleased || '';
      setTitle(title + (maker ? ' — ' + maker : '') + ' | Spin Raiders');
      const listingImages = new Set([row.cardImage,row.cardMarqueeImage,row.logoImage].filter(Boolean).map(value=>S.img(value)));
      const fullCard = row.fullCabinetImage && !listingImages.has(S.img(row.fullCabinetImage)) ? row.fullCabinetImage : '';
      const originalAndyPhotos = /andy.?capp/i.test(title + (row.slug || '')) ? ['a1d8c05b2e7c45aaaa2557775d745d50~mv2.png','841eb2043a8542e3b6be42fe9adae193~mv2.png','74bbf0474c6a47eea9392454d4943a2d~mv2.png','bfd99482d29f4513a2892e41c3042ae8~mv2.jpg'].map(id=>'https://static.wixstatic.com/media/3a517e_'+id) : [];
      const gallery = [...new Set([...originalAndyPhotos,row.heroImage,row.physical_cabinet_photo,row.originalGlassImage,row.featureGlassImage,row.reelsGlassImage,row.marqueeGlassImage,photo(row)].filter(Boolean).map(value=>S.img(value)))].filter(value=>value!==S.img(fullCard)&&!listingImages.has(value));
      const image = (url, alt, eager=false) => `<img src="${escape(S.fit ? S.fit(S.img(url),1400) : S.img(url))}" alt="${escape(alt)}"${eager?' fetchpriority="high"':' loading="lazy"'}>`;
      const alt = row.fullCabinetAltText || row.imageAltText || title + ' — machine card';
      const intro = text(row.shortDescription || row.seoDescription || row.cardSummary);
      const story = paragraphs(row.history || row.lore_review || row.variantNotes || row.description || row.photoEvidenceSummary);
      const gameplay = paragraphs(row.gameplay_guide || row.gameplay);
      const stakes = row.stakeOptions || row.stake || list(row.stakes).join(', ');
      const jackpot = row.jackpotVariant || row.maxJackpot || row.jackpot || list(row.jackpots).join(', ');
      const venues = list(row.sourceVenues).filter((value,index,items)=>items.findIndex(item=>String(item).split(',')[0]===String(value).split(',')[0])===index);
      const features = list(row.features).filter(Boolean);
      const facts = [['Manufacturer',maker],['Release year',year],['Machine type',row.machineType],['Stake options',stakes],['Jackpot',jackpot],['Payout',row.payoutPercentage],['Cabinet',row.cabinet],['Era',row.era||row.category],['Theme',row.theme],['Platform',row.platformTechnology||row.hardwarePlatform]].filter(([,value])=>value&&String(value).trim());
      const tags = [...new Set([row.category,row.era,row.machineType,row.cabinet,jackpot&&'Jackpot '+String(jackpot).split(' (')[0]].filter(Boolean))].slice(0,5);
      const saveKey = 'CFM:' + row._id;
      let saved=[];
      try { saved=JSON.parse(localStorage.getItem('sr-favs')||'[]'); if(!Array.isArray(saved))saved=[]; } catch {}
      let related=[];
      try {
        const response=await S.archiveQuery({fields:C.fields,filter:maker?{manufacturer:{$eq:maker},directoryReady:{$eq:true}}:{directoryReady:{$eq:true}},paging:{limit:60}});
        related=(response.dataItems||[]).map(item=>({...item.data,_id:item.id})).filter(item=>C.usable(item)&&window.SR_ROUTE_UI.discoverable(item)&&!item.canonicalMachineId&&item._id!==row._id&&cardPhoto(item));
        const preferred=list(row.relatedMachines).map(value=>text(value).toLowerCase());
        related.sort((a,b)=>Number(preferred.includes(text(b.title).toLowerCase()))-Number(preferred.includes(text(a.title).toLowerCase())));
        const seen=new Set();related=related.filter(item=>{const name=text(item.title).split(/[—–]/)[0].trim().toLowerCase();if(seen.has(name))return false;seen.add(name);return true;}).slice(0,6);
      } catch {}
      if(!current())return;
      const makerUrl=archive+(maker?'?maker='+encodeURIComponent(maker):'');
      const reportUrl='/?report=change&machine='+encodeURIComponent(row._id);
      const venueUrl=venues.length?'/search?q='+encodeURIComponent(String(venues[0]).split(',')[0]):window.SR_ROUTES.categoryPaths.arcades;
      root.innerHTML=`<style>${css()}</style>${header()}
<div class="crumb"><div class="wrap cr"><nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="${archive}">Classic Fruit Machines</a>${maker?` › <a href="${escape(makerUrl)}">${escape(maker)}</a>`:''} › <span>${escape(title)}</span></nav><a href="${archive}">Back to machines</a></div></div>
<section class="vh machine-heading"><div class="wrap vhc"><div class="vhl"><div><h1>${escape(title)}</h1><p class="addr">${escape([maker,year].filter(Boolean).join(' · '))}</p><div class="tags">${tags.map((tag,index)=>`<span class="t${index+1}">${escape(tag)}</span>`).join('')}</div></div></div><div class="vha"><button class="vb fav" data-save aria-pressed="${saved.includes(saveKey)}">${saved.includes(saveKey)?'Saved to favourites':'Add to favourites'}</button><button class="vb dir" data-share>Share</button></div></div></section>
<main class="wrap vm mw machine-detail">
${fullCard?`<figure class="machine-full-card" data-machine-full-card>${image(fullCard,alt,true)}</figure>`:''}
<div class="g2"><section class="about" id="overview"><h2>About ${escape(title)}</h2>${intro?'<p>'+escape(intro)+'</p>':''}${story.length?story.map(value=>'<p>'+escape(value)+'</p>').join(''):'<p>A full write-up has not been added to this record yet.</p>'}</section><section class="vcard machine-facts"><h2>Machine details</h2><dl>${facts.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(String(value))}</dd></div>`).join('')}</dl><p data-status role="status"></p></section></div>
<div class="g3"><section class="vcard" id="gameplay"><h2>How to play</h2>${gameplay.length?gameplay.map(value=>'<p>'+escape(value)+'</p>').join(''):'<p>A full gameplay guide has not been added yet. If you know how this machine plays, share your experience.</p>'}<a href="${reportUrl}">${gameplay.length?'Suggest an edit':'Share how it plays'} →</a></section><section class="vcard" id="features"><h2>Key features</h2>${features.length?'<ul>'+features.map(value=>'<li>'+escape(value)+'</li>').join('')+'</ul>':'<p>Further feature details have not been recorded yet.</p>'}</section><section class="vcard" id="where"><h2>Where to play</h2>${venues.length?`<p>${escape(title)} has been recorded at:</p><ul>${venues.map(value=>`<li><a href="/search?q=${encodeURIComponent(String(value).split(',')[0])}">${escape(value)}</a></li>`).join('')}</ul>`:`<p>We haven’t confirmed a venue with ${escape(title)} yet. Seen one? Let us know.</p>`}<a href="${escape(venueUrl)}">Find venues →</a></section></div>
${gallery.length?`<section class="vcard machine-gallery" id="gallery"><h2>Machine photographs</h2><div class="gal-main">${gallery.length>1?'<button class="ga ga-p" data-car="-1" aria-label="Previous photo">‹</button>':''}${image(gallery[0],title+' photo 1').replace('<img','<img id="gal-img"')}${gallery.length>1?'<button class="ga ga-n" data-car="1" aria-label="Next photo">›</button>':''}</div>${gallery.length>1?`<div class="gal-th">${gallery.map((url,index)=>`<button data-th="${index}" aria-pressed="${index===0}" aria-label="Photo ${index+1}">${image(url,title+' photo '+(index+1))}</button>`).join('')}</div>`:''}</section>`:''}
<section class="vcard machine-reviews" id="reviews"><h2>Player memories and reviews</h2><p>Have you played ${escape(title)}? Share your memories and tell other players what it’s like.</p><a href="/?report=review&machine=${encodeURIComponent(row._id)}">Write a review →</a></section>
${related.length?`<section class="near sim" id="similar"><div class="sh"><h2>Similar machines</h2><a href="${escape(makerUrl)}">View more machines →</a></div><div class="ng">${related.map(item=>{const name=text(item.title).split(/[—–]/)[0].trim();return `<a class="nc" href="${escape(window.SR_ROUTES.href(item))}">${image(cardPhoto(item),name+' fruit machine')}<div><b>${escape(name)}</b><small>${escape([item.manufacturer,C.year(item)||item.releaseYear].filter(Boolean).join(', '))}</small></div></a>`;}).join('')}</div></section>`:''}
</main>${footer()}`;
      window.SR_SHELL?.wire(root);
      let galleryIndex=0;
      const showPhoto=index=>{if(!gallery.length)return;galleryIndex=(index+gallery.length)%gallery.length;const target=root.getElementById('gal-img');if(target){target.src=S.fit?S.fit(S.img(gallery[galleryIndex]),1400):gallery[galleryIndex];target.alt=title+' photo '+(galleryIndex+1);}root.querySelectorAll('[data-th]').forEach((button,index)=>button.setAttribute('aria-pressed',String(index===galleryIndex)));};
      const status=value=>{if(current()){const node=root.querySelector('[data-status]');if(node)node.textContent=value;}};
      root.addEventListener('click',event=>{
        if(!current())return;const button=event.target.closest('button');if(!button)return;
        if(button.hasAttribute('data-car'))return showPhoto(galleryIndex+Number(button.dataset.car));
        if(button.hasAttribute('data-th'))return showPhoto(Number(button.dataset.th));
        if(button.hasAttribute('data-save')){
          const next=saved.includes(saveKey)?saved.filter(value=>value!==saveKey):[...saved,saveKey];
          try{localStorage.setItem('sr-favs',JSON.stringify(next));saved=next;button.textContent=saved.includes(saveKey)?'Saved to favourites':'Add to favourites';button.setAttribute('aria-pressed',String(saved.includes(saveKey)));}catch{status('Favourites could not be saved in this browser.');}
        }
        if(button.hasAttribute('data-share')){
          if(navigator.share)navigator.share({title:document.title,url:location.href}).catch(error=>{if(error.name!=='AbortError')status('Copy the link from your browser.');});
          else if(navigator.clipboard)navigator.clipboard.writeText(location.href).then(()=>status('Link copied'),()=>status('Copy the link from your browser.'));
          else status('Copy the link from your browser.');
        }
      });
    } catch(error) {
      if(!current())return;console.error('SR_ARCHIVE_DETAIL',error);
      root.innerHTML='<style>'+css()+'</style>'+header()+'<main class="wrap vm mw"><h1>Record unavailable</h1><p><a href="'+archive+'">Browse the archive →</a></p></main>'+footer();
    }
  };
})();
