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
function dexImg(id,known,cls=''){const s=CD.species[id];return `<img class="dex-art ${known?'':'unknown'} ${cls}" src="${s.img}" alt="${known?s.name:'？？？'}">`}
function dexName(id){return dexSeen(id)||dexOwned(id)?CD.species[id].name:'？？？'}
function dexCards(){const ids=Object.keys(DEX_INFO).filter(id=>CD.species[id]);
 return `<p class="dex-sum">発見 ${ids.filter(id=>dexSeen(id)||dexOwned(id)).length}/${ids.length} ・ 仲間 ${ids.filter(dexOwned).length}種 ・ 配合 ${S.companions.breeds||0}回</p><div class="dex-grid">`+
  ids.map((id,i)=>{const known=dexSeen(id)||dexOwned(id),info=DEX_INFO[id]||{},likes=(S.praise?.likes?.[id]||[]).map(t=>PRAISE_TAGS[t]).join('・');
   return `<article class="dex-card ${known?'':'locked'}"><span class="dex-no">No.${String(i+1).padStart(3,'0')}</span>${dexImg(id,known)}<h3>${dexName(id)}</h3>${known?`<p class="dex-meta">生息地：${info.habitat||'？'}<br>好きな褒め言葉：${LIKES[id]?likes||'？（木の実でわかる）':'スカウト不可'}<br>所持 ${dexOwned(id)}体</p><p class="dex-note">${info.note||''}</p>`:`<p class="dex-meta">まだ出会っていない。<br>生息地：${info.habitat||'？'}</p>`}</article>`}).join('')+'</div>'}
function dexRecipes(){return `<p class="dex-sum">ネネの配合の館で、親2体から新しいモンスターが生まれる。親は消える。</p><div class="dex-recipes">`+
 CD.recipes.map(r=>{const [a,b]=r.parents,can=dexOwned(a)&&dexOwned(b)&&(a!==b||dexOwned(a)>1),childKnown=dexSeen(r.child)||dexOwned(r.child);
  return `<div class="dex-recipe ${can?'ready':''}"><figure>${dexImg(a,dexSeen(a)||dexOwned(a))}<figcaption>${dexName(a)}</figcaption></figure><b>＋</b><figure>${dexImg(b,dexSeen(b)||dexOwned(b))}<figcaption>${dexName(b)}</figcaption></figure><b>→</b><figure>${dexImg(r.child,childKnown)}<figcaption>${childKnown?CD.species[r.child].name:'？？？'}</figcaption></figure><span class="dex-tag">${can?'配合できる！':'親がそろっていない'}</span></div>`}).join('')+'</div>'}
function dexResidents(){const list=(MAPS.island?.ents||[]).filter(e=>e.art);
 return `<p class="dex-sum">ことのは島で暮らすモンスター ${list.filter(e=>F()['met_'+e.art]).length}/${list.length}（話しかけると記録される）</p><div class="dex-grid">`+
  list.map(e=>{const met=!!F()['met_'+e.art];return `<article class="dex-card ${met?'':'locked'}"><img class="dex-art ${met?'':'unknown'}" src="assets/town/${e.art}.png" alt=""><h3>${met?e.name:'？？？'}</h3><p class="dex-meta">${met?e.kind:'島のどこかにいる'}</p>${met?`<p class="dex-note">${e.job||''}</p>`:''}</article>`}).join('')+'</div>'}

/* Opens the book on a tab ('dex', 'recipes' or 'town') and resolves when it is closed. */
function openMonsterBook(tab='dex'){
 let host=document.getElementById('monsterBook');
 if(!host){host=document.createElement('section');host.id='monsterBook';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','モンスター図鑑');
  host.innerHTML='<header><nav><button type="button" data-tab="dex">図鑑</button><button type="button" data-tab="recipes">配合表</button><button type="button" data-tab="town">島の住人</button></nav><button type="button" id="dexClose">閉じる ×</button></header><div id="dexBody"></div>';
  document.getElementById('app').append(host)}
 const body=host.querySelector('#dexBody'),tabs=[...host.querySelectorAll('[data-tab]')];
 const show=t=>{tab=t;tabs.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));body.innerHTML=t==='recipes'?dexRecipes():t==='town'?dexResidents():dexCards();body.scrollTop=0};
 tabs.forEach(b=>b.onclick=()=>show(b.dataset.tab));show(tab);host.hidden=false;dexOpen=true;heldDir=-1;
 return new Promise(resolve=>{const close=()=>{host.hidden=true;dexOpen=false;window.removeEventListener('keydown',key,true);resolve()};
  const key=e=>{if(['Escape','KeyX','Backspace'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();close()}
   else if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();const order=['dex','recipes','town'],k=order.indexOf(tab)+(/Right|KeyD/.test(e.code)?1:-1);show(order[(k+3)%3])}
   else if(['ArrowUp','ArrowDown','KeyW','KeyS'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();body.scrollBy({top:/Down|KeyS/.test(e.code)?160:-160,behavior:'smooth'})}
   else if(['Enter','KeyZ','Space'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation()}};
  window.addEventListener('keydown',key,true);host.querySelector('#dexClose').onclick=close;host.querySelector('#dexClose').focus()})}
