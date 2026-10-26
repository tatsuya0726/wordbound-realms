/* Monster Book: a full-screen 図鑑 (every companion species: seen/owned, habitat, favourite praise, notes),
   a 配合表 (every breeding recipe with parent and child art, and whether you can breed it now),
   and 島の住人 (the strong monsters living on the island, filled in as you talk to them). */
const DEX_INFO={
 seedpod_mouse:{habitat:'はじまりの草原',note:'種のさやを耳にしたネズミ。すばしこく、草原をちょこまか走り回る。'},
 lotus_root_sproutling:{habitat:'はじまりの草原',note:'レンコンの体から芽を出す小さな精。日なたぼっこが大好き。'},
 silk_leaf_caterpillar:{habitat:'草原・地底水晶庭',note:'絹のような葉をまとうイモムシ。つやつやの体が自慢。'},
 pinecone_sparrow:{habitat:'草原・空中庭園',note:'松ぼっくりの羽を持つスズメ。胸を張って空をかける。'},
 sprout_ear_mole:{habitat:'地底水晶庭・配合',note:'芽の耳で地中の音を聞くモグラ。考えごとが好きな知恵者。'},
 lantern_moth:{habitat:'空中庭園・配合',note:'灯りをまとう蛾。夜の空をやわらかく照らす。'},
 thunder_feather_owlet:{habitat:'夢の島・配合',note:'雷の羽を持つ子フクロウ。鋭い目で何でも見抜く。'},
 ancient_forest_stag:{habitat:'配合でのみ生まれる',note:'古い森の力を宿す大鹿。配合でしか出会えない伝説の存在。'}};
let dexOpen=false;
function dexSeen(id){return S.companions.seen.includes(id)}
function dexOwned(id){return S.companions.owned.filter(m=>m.id===id).length}
// Lists use 160px thumbnails (assets/monsters/thumb); only the detail page ('full') loads the 256px art. Hundreds of full-size
// images in the breeding table ran iPhone Safari out of memory and reloaded the page.
function dexImg(id,known,cls=''){const s=CD.species[id];return `<img loading="lazy" decoding="async" class="dex-art ${known?'':'unknown'} ${cls}" src="${cls.includes('full')?s.img:'assets/monsters/thumb/'+id+'.webp'}" alt="${known?s.name:'？？？'}">`}
function dexName(id){return dexSeen(id)||dexOwned(id)?CD.species[id].name:'？？？'}
let dexFamily="";
function dexHabitat(id){const info=DEX_INFO[id]||{};return CD.species[id].retired?'旧仲間（現在は新規入手できません）':CD.species[id].fusionOnly?(CR.rarity(CD.species[id])<=8?'配合／旅のマスター戦でスカウト（野生不可）':'配合限定（野生から加入不可）'):info.habitat||'？'}
function dexCards(){
 const ids=Object.keys(DEX_INFO).filter(id=>CD.species[id]&&(dexFamily==='legacy'?CD.species[id].retired&&(dexOwned(id)||S.companions.registered?.includes(id)):!CD.species[id].retired&&(!dexFamily||CD.species[id].family===dexFamily)));
 // Lowest rarity first; same rarity keeps the bestiary's own order.
 return '<div class="dex-compact-grid">'+dexByRarity(ids).map(id=>{const known=dexSeen(id)||dexOwned(id);return `<button type="button" class="dex-tile ${known?'':'locked'}" data-species="${id}" aria-label="${htmlSafe(dexName(id))}の詳細">${dexImg(id,known)}<span class="dex-tile-name">${htmlSafe(dexName(id))}</span>${rarityBadge(CD.species[id])}<span class="dex-habitat">${htmlSafe(dexHabitat(id))}</span></button>`}).join('')+'</div>';
}
/* Detail page: fits one screen — a large picture on the left; name, ecology, likes, the three native skills
   and every way to breed it (with the parents' pictures) on the right. */
const dexByRarity=ids=>ids.map((id,i)=>[id,i]).sort((p,q)=>CR.rarity(CD.species[p[0]])-CR.rarity(CD.species[q[0]])||p[1]-q[1]).map(p=>p[0]);
function dexDetailParent(s){if(s[0]==='@'){const f=s.slice(1);return `<span class="dex-dp"><span class="dex-dp-fam">${htmlSafe(FAMILY_NAMES[f]||f)}</span><b>${htmlSafe(FAMILY_NAMES[f]||f)}のどれか</b></span>`}
 return `<span class="dex-dp">${dexImg(s,dexMet(s))}<b>${htmlSafe(dexName(s))}</b></span>`}
function dexDetail(id){
 const species=CD.species[id],known=dexSeen(id)||dexOwned(id),info=DEX_INFO[id]||{};
 if(!species)return '';
 const skills=known?CR.innate(id,CD.species):[],recipes=dexRecipesOf(id);
 // One representative recipe keeps the page on one screen: one you can breed now, else one with two named parents.
 const rep=recipes.find(dexCanBreed)||recipes.find(r=>r.parents.every(p=>p[0]!=='@'))||recipes[0],shown=rep?[rep]:[];
 const likes=!species.retired&&(!species.fusionOnly||CR.rarity(species)<=8)?htmlSafe((S.praise?.likes?.[id]||[]).map(t=>PRAISE_TAGS[t]).join('・')||'？（木の実でわかる）'):'スカウト不可';
 const breed=recipes.length?`<h3>配合</h3><div class="dex-detail-recipes">${shown.map(r=>`<div class="dex-dr ${dexCanBreed(r)?'ready':''}">${dexDetailParent(r.parents[0])}<i>＋</i>${dexDetailParent(r.parents[1])}</div>`).join('')}${recipes.length>1?`<p class="dex-more">ほかに${recipes.length-1}通りの作り方があります（配合表で見られます）</p>`:''}</div>`:'';
 return `<article class="dex-detail"><div class="dex-detail-art">${dexImg(id,known,'full')}</div><div class="dex-detail-main">
  <header class="dex-detail-head"><h2>${htmlSafe(dexName(id))}</h2>${rarityBadge(species)}${known?`<span class="dex-chip">${htmlSafe(FAMILY_NAMES[species.family]||species.family)}</span><span class="dex-chip">所持 ${dexOwned(id)}</span>`:''}${species.retired?'<span class="dex-chip">旧図鑑</span>':''}</header>
  <p class="dex-detail-habitat">${htmlSafe(dexHabitat(id))}</p>
  ${known?`<p class="dex-detail-eco">${htmlSafe(info.eco||info.note||'')}</p>${info.quote?`<p class="dex-detail-quote">「${htmlSafe(info.quote)}」</p>`:''}<p class="dex-detail-likes">好きな褒め言葉：${likes}${typeof ElementResist!=='undefined'?` ／ 弱点：${ElementResist.weakHtml(id)}`:''}</p>${CR.growthText?`<p class="dex-detail-growth">成長：${htmlSafe(CR.growthText(id,CD.species).join(' · '))}</p>`:''}
  <h3>固有技</h3><ul class="dex-native-skills">${skills.map(k=>`<li><strong title="${htmlSafe(k.seriesText||'')}">${(typeof elementTag==='function'?elementTag(k):'')}${htmlSafe(k.name)}</strong><span>Lv.${k.level} · SP ${k.cost}</span><em>${htmlSafe(k.description)}</em></li>`).join('')}</ul>`:'<p class="dex-detail-eco">まだ出会っていない。</p>'}
  ${breed}</div></article>`;
}

/* ---- breeding table: one row per monster, listing every way to make it ---- */
const dexMet=id=>dexSeen(id)||dexOwned(id);
const dexSpecName=s=>s[0]==='@'?FAMILY_NAMES[s.slice(1)]+'のどれか':dexName(s);
function dexRecipesOf(id){return CD.recipes.filter(r=>r.child===id)}
/* True when two different owned monsters fit the recipe's two parents (a family parent accepts any member).
   Counts owned monsters per species and family once per party change, so the whole table (hundreds of recipes,
   hundreds of monsters with every monster owned) stays fast on phones instead of comparing every pair. */
let dexOwnCount=null;
function dexFitCount(spec){const own=S.companions.owned,key=own.length+':'+own.map(m=>m.uid).join(',');
 if(dexOwnCount?.key!==key){const sp={},fam={};for(const m of own){sp[m.id]=(sp[m.id]||0)+1;const f=CD.species[m.id]?.family;if(f)fam[f]=(fam[f]||0)+1}dexOwnCount={key,sp,fam}}
 return spec[0]==='@'?dexOwnCount.fam[spec.slice(1)]||0:dexOwnCount.sp[spec]||0}
function dexCanBreed(r){const [a,b]=r.parents,na=dexFitCount(a),nb=dexFitCount(b);if(!na||!nb)return false;if(na>1||nb>1)return true;
 // One candidate each: they must be two different monsters.
 const own=S.companions.owned,p=own.find(m=>CR.fits(a,m.id,CD.species)),q=own.find(m=>CR.fits(b,m.id,CD.species));return p.uid!==q.uid}
function dexParent(s){if(s[0]==='@'){const f=s.slice(1);return `<figure class="dex-fam"><span>${FAMILY_NAMES[f]}</span><figcaption>${FAMILY_NAMES[f]}のどれか</figcaption></figure>`}
 return `<figure>${dexImg(s,dexMet(s))}<figcaption>${dexName(s)}</figcaption></figure>`}
/* Short text for the field-guide card: 「A ＋ B」 per recipe. */
function dexHowTo(id){return dexRecipesOf(id).map(r=>r.parents.map(dexSpecName).join(' ＋ ')).join('<br>')}
function dexRecipes(){const ids=Object.keys(DEX_INFO).filter(id=>CD.species[id]&&!CD.species[id].retired&&(!dexFamily||CD.species[id].family===dexFamily)&&dexRecipesOf(id).length);
 const rank=id=>(dexRecipesOf(id).some(dexCanBreed)?4:0)+(dexMet(id)?2:0)+(dexRecipesOf(id).some(r=>r.parents.every(s=>s[0]==='@'||dexMet(s)))?1:0);
 const order=dexByRarity(ids).map((id,i)=>[id,i,rank(id)]).sort((p,q)=>q[2]-p[2]||p[1]-q[1]).map(p=>p[0]);   // rank once per monster, not per comparison
 return `<p class="dex-sum">全${ids.length}種に配合の作り方がある。「〇〇系のどれか」はその系統のモンスターなら何でもよい。親は消える。</p><div class="dex-recipes">`+
  order.map(id=>{const rs=dexRecipesOf(id),ready=rs.some(dexCanBreed);
   return `<div class="dex-recipe ${ready?'ready':''}"><figure class="dex-child">${dexImg(id,dexMet(id))}<figcaption>${dexName(id)}</figcaption></figure><div class="dex-ways">`+
    rs.map((r,k)=>`<div class="dex-way ${dexCanBreed(r)?'ready':''}"><span class="dex-wayno">${rs.length>1?'作り方'+(k+1):'作り方'}</span>${dexParent(r.parents[0])}<b>＋</b>${dexParent(r.parents[1])}${dexCanBreed(r)?'<span class="dex-tag">配合できる！</span>':''}</div>`).join('')+'</div></div>'}).join('')+'</div>'}function dexResidents(){const list=(MAPS.island?.ents||[]).filter(e=>e.art);
 return `<p class="dex-sum">ことのは島で暮らすモンスター ${list.filter(e=>F()['met_'+e.art]).length}/${list.length}（話しかけると記録される）</p><div class="dex-grid">`+
  list.map(e=>{const met=!!F()['met_'+e.art];return `<article class="dex-card ${met?'':'locked'}"><img class="dex-art ${met?'':'unknown'}" src="assets/town/${e.art}.png" alt=""><h3>${met?e.name:'？？？'}</h3><p class="dex-meta">${met?e.kind:'島のどこかにいる'}</p>${met?`<p class="dex-note">${e.job||''}</p>`:''}</article>`}).join('')+'</div>'}

/* Long lists start with their first rows and add more as the reader scrolls near the end, so a phone never lays out and
   decodes the whole table at once. Enough rows are added up front to restore a saved scroll position. */
function dexChunk(body,scrollTo=0){const list=body.querySelector('.dex-recipes, .dex-compact-grid');if(!list)return;const step=list.classList.contains('dex-recipes')?24:60;
 const rest=[...list.children].slice(step);if(!rest.length)return;rest.forEach(n=>n.remove());
 const more=document.createElement('div');more.className='dex-more-sentinel';more.style.height='1px';list.after(more);
 const add=()=>{rest.splice(0,step).forEach(n=>list.append(n));if(!rest.length){io.disconnect();more.remove()}};
 const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))add()},{root:body,rootMargin:'600px'});
 while(rest.length&&body.scrollHeight<scrollTo+body.clientHeight*2)add();if(rest.length)io.observe(more)}
/* Opens the book on a tab ('dex', 'recipes' or 'town') and resolves when it is closed. */
let dexSession=null;
const dexScroll={dex:0,recipes:0,town:0};
function openMonsterBook(tab='dex',newId=null){
 if(dexOpen&&dexSession)return dexSession;
 let host=document.getElementById('monsterBook');
 if(!host){host=document.createElement('section');host.id='monsterBook';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','モンスター図鑑');
  host.innerHTML='<header><nav><button type="button" data-tab="dex">図鑑</button><button type="button" data-tab="recipes">配合表</button><button type="button" data-tab="town">島の住人</button></nav><select id="dexFamily" aria-label="系統で絞り込み"></select><button type="button" id="dexBack" hidden>一覧へ戻る</button><button type="button" id="dexClose">閉じる ×</button></header><div id="dexBody"></div>';document.getElementById('app').append(host)}
 const body=host.querySelector('#dexBody'),tabs=[...host.querySelectorAll('[data-tab]')],familySelect=host.querySelector('#dexFamily'),back=host.querySelector('#dexBack'),closeButton=host.querySelector('#dexClose');
 const previousFocus=document.activeElement,scrolls=newId?{dex:0,recipes:0,town:0}:dexScroll;let detail=newId,selected=null;
 const render=()=>{tabs.forEach(b=>{b.hidden=!!newId;b.setAttribute('aria-selected',String(b.dataset.tab===tab))});familySelect.hidden=!!detail;back.hidden=!detail||!!newId;body.innerHTML=detail?dexDetail(detail):tab==='recipes'?dexRecipes():tab==='town'?dexResidents():dexCards();if(!detail)dexChunk(body,scrolls[tab]);body.scrollTop=detail?0:scrolls[tab];};
 const returnToList=()=>{detail=null;render();const item=[...body.querySelectorAll('[data-species]')].find(b=>b.dataset.species===selected);item?.focus({preventScroll:true})};
 body.onclick=e=>{const tile=e.target.closest('[data-species]');if(!tile||!body.contains(tile))return;scrolls[tab]=body.scrollTop;selected=tile.dataset.species;detail=selected;render();back.focus()};
 familySelect.innerHTML='<option value="">全系統</option>'+Object.entries(FAMILY_NAMES).map(([id,name])=>'<option value="'+id+'">'+name+'</option>').join('')+'<option value="legacy">旧図鑑</option>';familySelect.value=dexFamily;familySelect.onchange=()=>{dexFamily=familySelect.value;scrolls[tab]=0;render()};
 tabs.forEach(b=>b.onclick=()=>{if(!detail)scrolls[tab]=body.scrollTop;detail=null;tab=b.dataset.tab;render()});back.onclick=returnToList;closeButton.textContent=newId?'図鑑に登録！ · 続ける':'閉じる ×';
 host.hidden=false;dexOpen=true;heldDir=-1;render();closeButton.focus();
 dexSession=new Promise(resolve=>{const close=()=>{if(!detail)scrolls[tab]=body.scrollTop;host.hidden=true;dexOpen=false;dexSession=null;window.removeEventListener('keydown',key,true);heldDir=-1;previousFocus?.isConnected&&previousFocus.focus({preventScroll:true});resolve()};
  const key=e=>{if(e.code==='Tab'){const items=[...host.querySelectorAll('button,select')].filter(b=>!b.disabled&&b.getClientRects().length);const i=items.indexOf(document.activeElement);e.preventDefault();e.stopImmediatePropagation();items[(i+(e.shiftKey?-1:1)+items.length)%items.length]?.focus();return}if(e.target?.tagName==='SELECT'){e.stopImmediatePropagation();return;}if(['Escape','KeyX','Backspace'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(detail&&!newId)returnToList();else close()}
   else if(['ArrowUp','ArrowDown','KeyW','KeyS'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();body.scrollBy({top:/Down|KeyS/.test(e.code)?140:-140,behavior:'auto'})}
   else if(['Enter','Space'].includes(e.code)){e.stopImmediatePropagation();/* Native button activation remains available. */}
   else if(['KeyZ','ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(e.code==='KeyZ'&&e.target?.tagName==='BUTTON')e.target.click()}};
  window.addEventListener('keydown',key,true);closeButton.onclick=close;});return dexSession;
}
