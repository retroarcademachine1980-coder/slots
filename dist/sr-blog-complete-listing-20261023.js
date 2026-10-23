/* Existing blog discovery repair: read published Wix posts, retaining the approved page and controls. */
(() => {
  'use strict';
  if (window.SR_COMPLETE_BLOG_LISTING_20261023) return;
  window.SR_COMPLETE_BLOG_LISTING_20261023 = true;
  const installed = new WeakMap(), waiting = new WeakSet(), observed = new WeakSet();
  let cataloguePromise, loadedAt = 0, queued = false;
  const isListing = () => /^\/blog(?:\/?$|\/categories\/[^/]+\/?$|\/page\/\d+\/?$)/.test(location.pathname);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug = text => String(text).toLowerCase().replace(/&/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const icon = () => window.SR_LI ? window.SR_LI('arr') : '→';
  function postPath(value) {
    try { const url = new URL(value, location.origin); return url.origin === location.origin && /^\/post\/[^/?#]+\/?$/.test(url.pathname) ? url.pathname.replace(/\/$/,'') : ''; }
    catch (_) { return ''; }
  }
  function photo(post) {
    if (post.media?.displayed === false) return '';
    const id = post.media?.wixMedia?.image?.id || '';
    return /^[a-z0-9_~.-]+$/i.test(id) ? id : '';
  }
  const image = (post,w,h) => post.image ? 'https://static.wixstatic.com/media/'+post.image+'/v1/fill/w_'+w+',h_'+h+',al_c,q_85,enc_auto/article.webp' : '';
  const date = post => new Date(post.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  function picture(post,w,h,eager=false) {
    const src=image(post,w,h);
    return src ? '<img src="'+esc(src)+'" alt="" loading="'+(eager?'eager':'lazy')+'">' : '<span class="sr-blog-text-cover" aria-hidden="true">'+esc(post.title)+'</span>';
  }
  function card(post,index) {
    return '<a class="cd" href="'+esc(post.path)+'"><div class="ph">'+(index===0?'<span class="tag">FEATURED</span>':'')+picture(post,index===0?900:560,index===0?640:350,index<3)+'</div><div class="bd"><time>'+esc(date(post))+'</time><h3>'+esc(post.title)+'</h3><p>'+esc(post.excerpt)+'</p><span class="rm">Read more '+icon()+'</span></div></a>';
  }
  function row(post) {
    return '<a class="rw" href="'+esc(post.path)+'">'+picture(post,240,190)+'<div><h3>'+esc(post.title)+'</h3><span class="dt">'+esc(date(post))+'</span><p>'+esc(post.excerpt)+'</p></div></a>';
  }
  async function catalogue() {
    if (cataloguePromise && Date.now()-loadedAt<300000) return cataloguePromise;
    loadedAt=Date.now();
    cataloguePromise=(async () => {
      const tokenResponse=await fetch('https://www.wixapis.com/oauth2/token',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({clientId:'5296d1b3-888a-4d2e-bdd2-a8a8dd0018d8',grantType:'anonymous'})
      });
      if (!tokenResponse.ok) throw new Error('Public blog connection unavailable');
      const token=await tokenResponse.json();
      if (!token.access_token) throw new Error('Public blog connection unavailable');
      const read=async url => {
        const response=await fetch(url,{headers:{Authorization:token.access_token},cache:'no-store'});
        if (!response.ok) throw new Error('Published blog list unavailable');
        return response.json();
      };
      const posts=[]; let total=Infinity;
      for(let offset=0;offset<total;offset+=100) {
        if(offset>=10000) throw new Error('Blog list exceeds validated paging limit');
        const page=await read('https://www.wixapis.com/v3/posts?paging.limit=100&paging.offset='+offset+'&fieldsets=URL');
        if(!Array.isArray(page.posts)||!Number.isInteger(page.metaData?.total)) throw new Error('Invalid published blog list');
        if(total!==Infinity&&total!==page.metaData.total) throw new Error('Published list changed during paging');
        total=page.metaData.total;
        if(!page.posts.length&&offset<total) throw new Error('Incomplete published blog list');
        posts.push(...page.posts);
      }
      if(posts.length!==total||new Set(posts.map(p=>p.id)).size!==total) throw new Error('Incomplete published blog list');
      const categories=await read('https://www.wixapis.com/blog/v3/categories?paging.limit=100&fieldsets=URL');
      if(!Array.isArray(categories.categories)) throw new Error('Invalid blog categories');
      if((categories.metaData?.total||categories.categories.length)>categories.categories.length) throw new Error('Incomplete blog categories');
      const names=new Map(categories.categories.map(c=>[c.id,c.label]));
      const normalized=posts.map(p=>({id:p.id,title:String(p.title||''),excerpt:String(p.excerpt||''),path:postPath(p.url?.path||''),image:photo(p),date:p.firstPublishedDate,categories:(p.categoryIds||[]).map(id=>names.get(id)).filter(Boolean)}));
      if(normalized.some(p=>!p.path||!p.title||!Number.isFinite(new Date(p.date).getTime()))) throw new Error('Invalid published article record');
      return {posts:normalized,categories:categories.categories.map(c=>String(c.label||'')).filter(Boolean)};
    })();
    return cataloguePromise;
  }
  function install(root,data) {
    const main=root.querySelector('main.bl'), form=main?.querySelector('.sf'), input=form?.querySelector('input');
    const featured=main?.querySelector('.ft'), rows=main?.querySelector('.rl'), pages=main?.querySelector('.pg');
    if(!form||!input||!featured||!rows||!pages) return;
    installed.get(root)?.dispose?.();
    const events=new AbortController();
    installed.set(root,{form,dispose:()=>events.abort()});
    const initial=location.pathname.match(/^\/blog\/categories\/([^/]+)/)?.[1];
    let category=data.categories.find(c=>slug(c)===initial)||'', query=input.value.trim(), page=1;
    const counts=new Map(data.categories.map(name=>[name,data.posts.filter(p=>p.categories.includes(name)).length]));
    const style=document.createElement('style');style.dataset.srCompleteBlogStyle='1';
    style.textContent='.bl .pg{flex-wrap:wrap}.sr-blog-text-cover{display:flex;align-items:center;justify-content:center;box-sizing:border-box;min-height:100%;padding:22px;background:#e7f7ff;color:#073b63;font-weight:800;text-align:center}.bl .bm{scroll-margin-top:100px}';
    root.append(style);
    main.querySelectorAll('[data-c=""] small').forEach(s=>s.textContent=String(data.posts.length)+(s.closest('.ct')?' articles':''));
    const nav=main.querySelector('.bcat'), tiles=main.querySelector('.ct'), popular=main.querySelector('.cl');
    data.categories.filter(name=>counts.get(name)>0).forEach(name=>{
      if(nav&&!Array.from(nav.querySelectorAll('[data-c]')).some(b=>b.dataset.c===name)){
        const button=document.createElement('button');button.dataset.c=name;button.append(name+' ');
        const count=document.createElement('small');count.textContent=counts.get(name);button.append(count);nav.append(button);
      }
      if(tiles&&!Array.from(tiles.querySelectorAll('[data-c]')).some(b=>b.dataset.c===name)){
        const post=data.posts.find(p=>p.categories.includes(name)&&p.image);
        const button=document.createElement('button');button.dataset.c=name;
        button.innerHTML='<div class="ph">'+(post?picture(post,320,200):'<span class="sr-blog-text-cover">'+esc(name)+'</span>')+'</div><b>'+esc(name)+' →</b><small>'+counts.get(name)+' articles</small>';tiles.append(button);
      }
      if(popular&&!Array.from(popular.querySelectorAll('[data-c]')).some(b=>b.dataset.c===name)){
        const button=document.createElement('button');button.dataset.c=name;button.innerHTML='<span>'+esc(name)+'</span><i>'+counts.get(name)+'</i> →';popular.append(button);
      }
    });
    function render() {
      const term=query.toLocaleLowerCase();
      const matches=data.posts.filter(p=>(!category||p.categories.includes(category))&&(!term||(p.title+' '+p.excerpt+' '+p.categories.join(' ')).toLocaleLowerCase().includes(term)));
      main.querySelector('.fh').textContent=query?'Results for “'+query+'”':category||'Featured Blog Posts';
      main.querySelector('.fp').textContent=matches.length+' published '+(matches.length===1?'article':'articles')+(category?' in '+category:'')+'.';
      main.querySelectorAll('.bcat [data-c]').forEach(b=>{b.classList.toggle('on',b.dataset.c===category);b.setAttribute('aria-pressed',String(b.dataset.c===category));});
      featured.innerHTML=matches.length?matches.slice(0,5).map(card).join(''):'<div class="emp">No published articles match this search. <button class="lk" data-c="">Show all posts</button></div>';
      const more=matches.slice(5), last=Math.max(1,Math.ceil(more.length/6));page=Math.min(page,last);
      const recent=main.querySelector('#recent');if(recent)recent.hidden=!more.length;
      rows.innerHTML=more.slice((page-1)*6,page*6).map(row).join('');
      const shown=[...new Set([1,page-1,page,page+1,last].filter(n=>n>=1&&n<=last))].sort((a,b)=>a-b);
      const controls=shown.map((n,i)=>(i&&n>shown[i-1]+1?'<span aria-hidden="true">…</span>':'')+'<button data-p="'+n+'"'+(n===page?' class="on" aria-current="page"':'')+'>'+n+'</button>').join('');
      pages.innerHTML=last>1?'<button data-p="'+(page-1)+'" aria-label="Previous page"'+(page===1?' disabled':'')+'>‹</button>'+controls+'<button data-p="'+(page+1)+'" aria-label="Next page"'+(page===last?' disabled':'')+'>›</button>':'';
    }
    root.addEventListener('submit',event=>{
      if(event.target!==form)return;
      event.preventDefault();event.stopImmediatePropagation();query=input.value.trim();category='';page=1;render();main.querySelector('.bm')?.scrollIntoView?.({behavior:'smooth'});
    },{capture:true,signal:events.signal});
    root.addEventListener('input',event=>{
      if(event.target===input&&!input.value.trim()&&query){event.stopImmediatePropagation();query='';page=1;render();}
    },{capture:true,signal:events.signal});
    root.addEventListener('click',event=>{
      const button=event.target.closest?.('button');if(!button||!main.contains(button))return;
      if(button.hasAttribute('data-c')||button.hasAttribute('data-go')){
        event.preventDefault();event.stopImmediatePropagation();category=button.dataset.c||'';query='';input.value='';page=1;render();
        history.replaceState(history.state,'',category?'/blog/categories/'+slug(category):'/blog');
        window.SR_RUNTIME?.ready?.('blog',location.pathname+location.search);
        main.querySelector('.bm')?.scrollIntoView?.({behavior:'smooth'});
      }else if(button.hasAttribute('data-p')){
        event.preventDefault();event.stopImmediatePropagation();if(button.disabled)return;page=Number(button.dataset.p);render();main.querySelector('#recent')?.scrollIntoView?.({behavior:'smooth'});
      }
    },{capture:true,signal:events.signal});
    render();
    main.dataset.srCompleteBlogCount=String(data.posts.length);
  }
  function scan() {
    queued=false;if(!isListing())return;
    const root=document.getElementById('sr-shell-page')?.shadowRoot;
    if(!root)return;
    if(!observed.has(root)){observed.add(root);new MutationObserver(schedule).observe(root,{childList:true,subtree:true});}
    const form=root.querySelector('main.bl .sf');
    if(!form||installed.get(root)?.form===form||waiting.has(root))return;
    waiting.add(root);
    catalogue().then(data=>{
      if(isListing()&&root.host.isConnected)install(root,data);
    }).catch(()=>{
      if(!isListing()||!root.host.isConnected)return;
      installed.set(root,{form});
      const intro=root.querySelector('.fp');if(intro)intro.textContent='The full article list could not load just now. Showing the latest posts.';
    }).finally(()=>waiting.delete(root));
  }
  function schedule(){if(!queued){queued=true;setTimeout(scan,0);}}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  addEventListener('sr:navigation',schedule);addEventListener('popstate',schedule);schedule();
})();