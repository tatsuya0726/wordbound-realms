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
function dexImg(id,known,cls=''){const s=CD.species[id];return `<img loading="lazy" class="dex-art ${known?'':'unknown'} ${cls}" src="${s.img}" alt="${known?s.name:'？？？'}">`}
function dexName(id){return dexSeen(id)||dexOwned(id)?CD.species[id].name:'？？？'}
let dexFamily="";
function dexHabitat(id){const info=DEX_INFO[id]||{};return CD.species[id].retired?'旧仲間（現在は新規入手できません）':CD.species[id].fusionOnly?(CR.rarity(CD.species[id])<=8?'配合／旅のマスター戦でスカウト（野生不可）':'配合限定（野生から加入不可）'):info.habitat||'？'}
function dexCards(only){const ids=Object.keys(DEX_INFO).filter(id=>CD.species[id]&&(only?id===only:dexFamily==='legacy'?CD.species[id].retired&&(dexOwned(id)||S.companions.registered?.includes(id)):!CD.species[id].retired&&(!dexFamily||CD.species[id].family===dexFamily)));
 return `<p class="dex-sum">発見 ${ids.filter(id=>dexSeen(id)||dexOwned(id)).length}/${ids.length} ・ 仲間 ${ids.filter(dexOwned).length}種 ・ 配合 ${S.companions.breeds||0}回</p><div class="dex-grid">`+
  ids.map((id,i)=>{const known=dexSeen(id)||dexOwned(id),info=DEX_INFO[id]||{},likes=(S.praise?.likes?.[id]||[]).map(t=>PRAISE_TAGS[t]).join('・');
   return `<article class="dex-card ${known?'':'locked'}"><span class="dex-no">No.${String(Object.keys(DEX_INFO).indexOf(id)+1).padStart(3,'0')}</span>${dexImg(id,known)}<h3>${dexName(id)}</h3><p class="dex-meta">${rarityBadge(CD.species[id])} · ${FAMILY_NAMES[CD.species[id].family]||CD.species[id].family}${CD.species[id].retired?" · 旧仲間":""}</p>${known?`<p class="dex-meta">生息地：${dexHabitat(id)}<br>好きな褒め言葉：${!CD.species[id].retired&&(!CD.species[id].fusionOnly||CR.rarity(CD.species[id])<=8)?likes||'？（木の実でわかる）':'スカウト不可'}<br>所持 ${dexOwned(id)}体</p>${info.eco?`<p class="dex-eco"><b>生態</b>${info.eco}</p>`:`<p class="dex-note">${info.note||''}</p>`}${info.quote?`<p class="dex-quote">「${info.quote}」</p>`:''}${dexRecipesOf(id).length?`<p class="dex-howto"><b>配合</b>${dexHowTo(id)}</p>`:''}`:`<p class="dex-meta">まだ出会っていない。<br>生息地：${dexHabitat(id)}</p>`}</article>`}).join('')+'</div>'}
/* ---- breeding table: one row per monster, listing every way to make it ---- */
const dexMet=id=>dexSeen(id)||dexOwned(id);
const dexSpecName=s=>s[0]==='@'?FAMILY_NAMES[s.slice(1)]+'のどれか':dexName(s);
function dexRecipesOf(id){return CD.recipes.filter(r=>r.child===id)}
/* True when two different owned monsters fit the recipe's two parents (a family parent accepts any member). */
function dexCanBreed(r){const own=S.companions.owned;
 return own.some(p=>CR.fits(r.parents[0],p.id,CD.species)&&own.some(q=>q.uid!==p.uid&&CR.fits(r.parents[1],q.id,CD.species)))}
function dexParent(s){if(s[0]==='@'){const f=s.slice(1);return `<figure class="dex-fam"><span>${FAMILY_NAMES[f]}</span><figcaption>${FAMILY_NAMES[f]}のどれか</figcaption></figure>`}
 return `<figure>${dexImg(s,dexMet(s))}<figcaption>${dexName(s)}</figcaption></figure>`}
/* Short text for the field-guide card: 「A ＋ B」 per recipe. */
function dexHowTo(id){return dexRecipesOf(id).map(r=>r.parents.map(dexSpecName).join(' ＋ ')).join('<br>')}
function dexRecipes(){const ids=Object.keys(DEX_INFO).filter(id=>CD.species[id]&&!CD.species[id].retired&&(!dexFamily||CD.species[id].family===dexFamily)&&dexRecipesOf(id).length);
 const rank=id=>(dexRecipesOf(id).some(dexCanBreed)?4:0)+(dexMet(id)?2:0)+(dexRecipesOf(id).some(r=>r.parents.every(s=>s[0]==='@'||dexMet(s)))?1:0);
 const order=ids.map((id,i)=>[id,i]).sort((p,q)=>rank(q[0])-rank(p[0])||p[1]-q[1]).map(p=>p[0]);
 return `<p class="dex-sum">全${ids.length}種に配合の作り方がある。「〇〇系のどれか」はその系統のモンスターなら何でもよい。親は消える。</p><div class="dex-recipes">`+
  order.map(id=>{const rs=dexRecipesOf(id),ready=rs.some(dexCanBreed);
   return `<div class="dex-recipe ${ready?'ready':''}"><figure class="dex-child">${dexImg(id,dexMet(id))}<figcaption>${dexName(id)}</figcaption></figure><div class="dex-ways">`+
    rs.map((r,k)=>`<div class="dex-way ${dexCanBreed(r)?'ready':''}"><span class="dex-wayno">${rs.length>1?'作り方'+(k+1):'作り方'}</span>${dexParent(r.parents[0])}<b>＋</b>${dexParent(r.parents[1])}${dexCanBreed(r)?'<span class="dex-tag">配合できる！</span>':''}</div>`).join('')+'</div></div>'}).join('')+'</div>'}function dexResidents(){const list=(MAPS.island?.ents||[]).filter(e=>e.art);
 return `<p class="dex-sum">ことのは島で暮らすモンスター ${list.filter(e=>F()['met_'+e.art]).length}/${list.length}（話しかけると記録される）</p><div class="dex-grid">`+
  list.map(e=>{const met=!!F()['met_'+e.art];return `<article class="dex-card ${met?'':'locked'}"><img class="dex-art ${met?'':'unknown'}" src="assets/town/${e.art}.png" alt=""><h3>${met?e.name:'？？？'}</h3><p class="dex-meta">${met?e.kind:'島のどこかにいる'}</p>${met?`<p class="dex-note">${e.job||''}</p>`:''}</article>`}).join('')+'</div>'}

/* Opens the book on a tab ('dex', 'recipes' or 'town') and resolves when it is closed. */
function openMonsterBook(tab='dex',newId=null){
 let host=document.getElementById('monsterBook');
 if(!host){host=document.createElement('section');host.id='monsterBook';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','モンスター図鑑');
  host.innerHTML='<header><nav><button type="button" data-tab="dex">図鑑</button><button type="button" data-tab="recipes">配合表</button><button type="button" data-tab="town">島の住人</button></nav><select id="dexFamily" aria-label="系統で絞り込み"></select><button type="button" id="dexClose">閉じる ×</button></header><div id="dexBody"></div>';
  document.getElementById('app').append(host)}
 const body=host.querySelector('#dexBody'),tabs=[...host.querySelectorAll('[data-tab]')];
 const show=t=>{tab=t;tabs.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));body.innerHTML=t==='recipes'?dexRecipes():t==='town'?dexResidents():dexCards(newId);body.scrollTop=0};
 const familySelect=host.querySelector('#dexFamily');familySelect.innerHTML='<option value="">全系統</option>'+Object.entries(FAMILY_NAMES).map(([id,name])=>'<option value="'+id+'">'+name+'</option>').join('')+'<option value="legacy">旧仲間</option>';familySelect.value=dexFamily;familySelect.hidden=!!newId;familySelect.onchange=()=>{dexFamily=familySelect.value;show(tab)};
 tabs.forEach(b=>{b.hidden=!!newId;b.onclick=()=>show(b.dataset.tab)});host.querySelector('#dexClose').textContent=newId?'図鑑に登録！ · 続ける':'閉じる ×';show(tab);host.hidden=false;dexOpen=true;heldDir=-1;
 return new Promise(resolve=>{const close=()=>{host.hidden=true;dexOpen=false;window.removeEventListener('keydown',key,true);resolve()};
  const key=e=>{if(e.target?.tagName==='SELECT')return;if(['Escape','KeyX','Backspace'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();close()}
   else if(!newId&&['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();const order=['dex','recipes','town'],k=order.indexOf(tab)+(/Right|KeyD/.test(e.code)?1:-1);show(order[(k+3)%3])}
   else if(['ArrowUp','ArrowDown','KeyW','KeyS'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();body.scrollBy({top:/Down|KeyS/.test(e.code)?160:-160,behavior:'smooth'})}
   else if(['Enter','KeyZ','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation()}};
  window.addEventListener('keydown',key,true);host.querySelector('#dexClose').onclick=close;host.querySelector('#dexClose').focus()})}
