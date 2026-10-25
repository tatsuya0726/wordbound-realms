const CR=CompanionRules,CD=COMPANION_DATA;
const creatureImages={};
// The first eight species load up front; the rest (companion-more.js) load the first time they are drawn.
function creatureImage(id){let im=creatureImages[id];if(!im&&CD.species[id]){im=creatureImages[id]=new Image();im.src=CD.species[id].img}return im}
for(const id of Object.keys(CD.species).filter(id=>!CD.species[id].img.startsWith('assets/monsters/')))creatureImage(id);
const bands=[...new Set(CD.questions.map(q=>q.learning_level))];
function htmlSafe(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function rarityBadge(s){const n=CR.rarity(s);return `<span class="rarity-badge rarity-${n}" aria-label="レア度 ${n}">★${n}</span>`}
function companions(){return S.companions.team.map(uid=>S.companions.owned.find(m=>m.uid===uid)).filter(Boolean)}
function companionPower(){return CR.partyPower(companions(),CD.species,atk())}
function monsterCard(m){const s=CD.species[m.id];return `<div class="creature"><img src="${s.img}" alt=""><div>${s.name} <small>Lv.${m.lv} · ${m.uid}</small><br><span class="sub">${S.companions.team.includes(m.uid)?'同行中':'牧場で待機'} · EXP ${m.xp}</span></div></div>`}
function commitCompanionChange(change){
 const candidate=JSON.parse(JSON.stringify(S));
 try{change(candidate);CR.validate(candidate.companions,CD.species);localStorage.setItem(SAVE_KEY,JSON.stringify({S:candidate,opt}));S=candidate;$('#saveStatus').textContent='仲間データを保存しました';return true}
 catch(e){console.warn('Companion transaction cancelled',e);return false}
}
function migrateCompanions(){
 if(!S.companions){const original=localStorage.getItem(SAVE_KEY);if(original&&!localStorage.getItem(SAVE_KEY+'-before-companions'))localStorage.setItem(SAVE_KEY+'-before-companions',original);S.companions=CR.initial();S.items.berry=3}
 CR.validate(S.companions,CD.species);if(!Number.isFinite(S.items.berry))S.items.berry=0;
}
async function ranch(){
 while(true){
  setLog(`<p class="en">Companion Ranch</p><p class="sub">仲間 ${S.companions.owned.length}体 · 同行 ${S.companions.team.length}/3<br>同行中の仲間は連携攻撃に参加し、勝利で育ちます。HP・SPは個体別です。各仲間が順に行動します。</p>`);
  const choice=await ask([{label:'Team<small>同行する仲間を選ぶ</small>',value:'team'},{label:'Breed<small>配合 · 親2体を消費</small>',value:'breed'},{label:'Collection<small>図鑑・生息地・レシピ</small>',value:'dex'},{label:'Status<small>個体の能力・プラス値</small>',value:'status'},{label:'Back<small>もどる</small>',value:null}],{cancel:null});
  if(!choice)return;
  if(choice==='status')await companionStatus();
  if(choice==='team'){
   setLog('<p class="en">Choose your companions</p><p class="sub">最大3体。同じ種類でも個体IDごとに選べます。選択すると同行／待機を切り替えます。</p>');
   const uid=await ask([...S.companions.owned.map(m=>({label:monsterCard(m),value:m.uid,disabled:!S.companions.team.includes(m.uid)&&S.companions.team.length>=3})),{label:'Back',value:null}],{cancel:null});
   if(uid&&!commitCompanionChange(s=>CR.equip(s.companions,uid)))await sys('変更できませんでした。保存容量・編成を確認してください。');
  }
  if(choice==='breed')await breeding();
  if(choice==='dex')await openMonsterBook('dex');
 }
}
async function breeding(){
 if(!['village','port','island','i_hut'].includes(S.map)){await sys('配合はことのは島の配合小屋（ネネ）で行えます。');return}
 const owned=S.companions.owned;
 if(owned.length<2){await sys('配合には2体必要です。野生のモンスターを好きな言葉で褒めて、スカウトしよう。');return}
 setLog('<p class="en">Choose the first parent</p><p class="sub">親になる1体目を選択。確定するまでは消費しません。</p>');
 const a=await ask([...owned.map(m=>({label:monsterCard(m),value:m.uid})),{label:'Cancel',value:null}],{cancel:null});if(!a)return;
 setLog('<p class="en">Choose the second parent</p><p class="sub">組み合わせがある仲間だけを選べます。</p>');
 const b=await ask([...owned.filter(m=>m.uid!==a).map(m=>({label:monsterCard(m),value:m.uid,disabled:!CR.recipe(S.companions,a,m.uid,CD.recipes,CD.species)})),{label:'Cancel',value:null}],{cancel:null});if(!b)return;
 const recipe=CR.recipe(S.companions,a,b,CD.recipes,CD.species);if(!recipe)return;
 const parents=[a,b].map(uid=>owned.find(m=>m.uid===uid));
 const inherited=await chooseInheritedSkills(parents,recipe.child);if(inherited===null)return;
 setLog(`<p class="en">A new companion</p>${parents.map(monsterCard).join('')}<p class="sub">継承：${inherited.map(id=>skillDescription(CR.inheritOptions(...parents,CD.species).find(s=>s.id===id))).join('<br>')||'なし'}</p><p class="progress-note">→ ${CD.species[recipe.child].name} Lv.1 · ${rarityBadge(CD.species[recipe.child])}</p><p class="sub">プラス値 ${CR.nextPlus(...parents)} · 初期HP・SP・攻撃・防御 +${CR.nextPlus(...parents)*5}%（親の高い方＋1）</p><p class="ng">確定すると親の2個体は消えます。</p><p class="sub">新しい個体はLv.1から育ちます。同行中の親がいた場合は、空いた枠に子が入ります。</p>`);
 const confirm=await ask([{label:'Cancel<small>配合しない</small>',value:false},{label:'Breed<small>この2個体を消費して配合</small>',value:true}],{cancel:false});
 if(!confirm)return;
 const done=commitCompanionChange(s=>CR.breed(s.companions,a,b,CD.recipes,CD.species,inherited));
 await sys(done?`${rarityBadge(CD.species[recipe.child])} ${CD.species[recipe.child].name}が生まれた！ プラス値 ${CR.nextPlus(...parents)}。 セーブしました。`:'保存できなかったため配合を取り消しました。親は消費していません。');
}
function bandQuestion(challenge=false,id){
 let q=id?CD.questions.find(q=>q.id===id):null;
 if(!q){let pool=CD.questions.filter(q=>q.learning_level===bands[Number.isInteger(opt.band)&&opt.band>=0&&opt.band<bands.length?opt.band:0]);const preferred=pool.filter(q=>q.within_level_difficulty===(challenge?'challenge':'basic'));q=pick(preferred.length?preferred:pool)}
 const choices=shuffle(q.options),answer=q.answer;
 return {type:'grammar',label:'SPELL · '+q.learning_level,cls:'g',prompt:`<p class="en">${htmlSafe(q.prompt_en).replace(/\n/g,'<br>')}</p><p class="sub">${htmlSafe(q.cue_ja)}</p>`,choices,correct:choices.indexOf(answer),after:q.prompt_en.includes('____')?q.prompt_en.replace('____',answer):answer,explain:`<p class="en">${htmlSafe(answer)}</p><p class="tipline">${htmlSafe(q.explanation_ja)}</p>`,key:'band:'+q.id,en:q.prompt_en,ja:q.explanation_ja};
}
async function chooseBand(){
 setLog('<p class="en">Your learning level</p><p class="sub">呪文用の問題を選びます。学年は目安です。強い呪文も同じ帯から出題し、設定でいつでも変更できます。単語・聴解は従来の3段階を使います。</p>');
 const n=await ask([...bands.map((b,i)=>({label:b,value:i})),{label:'Back',value:null}],{cancel:null});if(n!==null)opt.band=n;
}
/* Scouting (praise words), berries and scout progress live in praise-words.js. */
function creatureCanvas(id,flat=false){
 const im=creatureImage(id);if(!im||!im.complete||!im.naturalWidth)return null;
 const key='companion:'+id+':'+flat;if(SPRC.has(key))return SPRC.get(key);
 // 256px keeps the painted creatures crisp when drawn large on high-density phones; c.smooth asks for linear sampling.
 const N=256,c=document.createElement('canvas');c.width=c.height=N;c.smooth=true;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
 const source=document.createElement('canvas');source.width=im.width;source.height=im.height;const sx=source.getContext('2d',{willReadFrequently:true});sx.drawImage(im,0,0);const data=sx.getImageData(0,0,im.width,im.height).data;let left=im.width,top=im.height,right=-1,bottom=-1;
 for(let y=0;y<im.height;y++)for(let px=0;px<im.width;px++)if(data[(y*im.width+px)*4+3]>32){left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 if(right<left)return null;const w=right-left+1,h=bottom-top+1,scale=N/Math.max(w,h);x.drawImage(im,left,top,w,h,(N-w*scale)/2,N-h*scale,w*scale,h*scale);
 if(flat){x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,N,N)}SPRC.set(key,c);return c;
}
function drawCompanions(now){
 companions().forEach((m,i)=>{const x=100+i*140,can=creatureCanvas(m.id),bob=Math.sin(now/400+i)*2;win(x-54,270,108,75);if(can)ctx.drawImage(can,x-24,272+bob,48,48);txt(CD.species[m.id].name,x,330,10,'#fff','center');txt('Lv.'+m.lv,x,342,9,'#ffd25e','center')});
}
function initCompanions(){
 const mapping={seedpod_mouse:[18,6,'w1'],lotus_root_sproutling:[20,6,'w1'],silk_leaf_caterpillar:[22,7,'cave'],pinecone_sparrow:[26,8,'w1'],sprout_ear_mole:[32,10,'cave'],lantern_moth:[42,15,'w2'],thunder_feather_owlet:[65,22,'dream']};
 for(const [id,[hp,attack,zone]] of Object.entries(mapping)){ENEMIES[id]={name:CD.species[id].name,jp:CD.species[id].name,companion:id,hp,atk:attack,exp:Math.round(hp/2),gold:Math.round(hp/3),spr:'wisp',pal:{1:'#9bd573',2:'#fff',E:'#142020'}};ZONES[zone].foes.push(id,id)}
 ZONES.w1.foes.push('silk_leaf_caterpillar');ZONES.w2.foes.push('pinecone_sparrow');
 ITEM.berry={id:'berry',n:'Berry 木の実',d:'野生の仲間に与えてスカウト',p:6,kind:'item'};
 E('village',{x:15,y:5,pal:'girl',name:'Kiki & Nene',talk:async()=>{
  setLog('<div class="cat-faces"><img src="assets/companions/kiki.webp" alt="キキ"><img src="assets/companions/nene.webp" alt="ネネ"></div>'+dialogHtml('Kiki & Nene','A new friend is waiting outside the village. Offer a berry, then ask it to join us!','村の外で新しい仲間が待っているよ。木の実をあげてから、スカウトしてみよう！'));await next();
  if(await yesno('Kiki','Would you like to practice a spell?','選んだ学習帯で呪文の練習をする？'))await quiz(bandQuestion());
 }});
}

function skillDescription(s){return htmlSafe(s.name)+' · SP '+s.cost+' · '+s.description+(s.seriesText?'［進化（最低Lv）：'+htmlSafe(s.seriesText)+'／継承は各段階Lv+2以降］':'')+'（元：'+htmlSafe(CD.species[s.source]?.name||'共通カタログ')+'・継承習得Lv.'+s.inheritLevel+'）'}
async function chooseInheritedSkills(parents,child){const pool=CR.inheritOptions(...parents,CD.species).filter(s=>!CR.innate(child,CD.species).some(k=>CR.seriesKey(k)===CR.seriesKey(s))),chosen=[];while(true){setLog('<p>継承する技を選択（最大5つ）</p><p class="sub">種の固有技3つは別に保持。親が習得済みの技から選び、子は必要レベルで覚え直します。選択中：'+chosen.map(id=>htmlSafe(CR.skill(id,CD.species).name)).join(' / ')+'</p>');const id=await ask([...pool.map(s=>({label:(chosen.includes(s.id)?'✓ ':'')+skillDescription(s),value:s.id,disabled:chosen.length>=5&&!chosen.includes(s.id)})),{label:'この内容で進む',value:'done'},{label:'配合をキャンセル',value:null}],{cancel:null});if(id===null)return null;if(id==='done')return chosen;const i=chosen.indexOf(id);if(i>=0)chosen.splice(i,1);else chosen.push(id)}}
async function companionStatus(){while(true){setLog('<p>個体ステータス</p>');const uid=await ask([...S.companions.owned.map(m=>({label:monsterCard(m),value:m.uid})),{label:'Back',value:null}],{cancel:null});if(!uid)return;const m=S.companions.owned.find(m=>m.uid===uid),s=CD.species[m.id],st=CR.stats(m,CD.species);CR.health(m,CD.species);
setLog('<div class="companion-status"><p class="en">'+htmlSafe(s.name)+'</p><p>'+rarityBadge(s)+' · '+(FAMILY_NAMES[s.family]||s.family)+(s.retired?' · 旧仲間（新規入手対象外）':'')+' · Lv.'+m.lv+' · '+m.uid+'</p><p>HP '+m.hp+'/'+m.maxHp+' · SP '+m.mp+'/'+m.maxMp+' · 攻撃 '+st.attack.toFixed(1)+' · 呪力 '+(st.magic??st.attack).toFixed(1)+' · 防御 '+st.defense.toFixed(1)+' · 素早さ '+(st.speed??0).toFixed(1)+'</p>'+(CR.growthText?'<p>成長：'+htmlSafe(CR.growthText(m.id,CD.species).join(' · '))+'</p>':'')+'<p>旅人の装備支援：攻撃 +'+(S.weapon?.v||0)+' · 防御 +'+(S.armor?.v||0)+'</p><p>プラス値 '+CR.plusValue(m)+'：初期能力 +'+CR.plusValue(m)*5+'%（成長分は除外）</p><p>固有技：'+CR.individualInnate(m,CD.species).map(k=>'Lv.'+k.level+' '+skillDescription(k)+(m.lv<k.level?'［未習得］':'')).join('<br>')+'</p><p>継承技：'+(CR.planned(m,CD.species).map(k=>{return skillDescription(k)+(m.lv<k.inheritLevel?'［未習得・予定］':'［習得済］')}).join('<br>')||'なし')+'</p></div>');await next();}}
