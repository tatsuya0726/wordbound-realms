const CR=CompanionRules,CD=COMPANION_DATA;
const creatureImages={};
for(const [id,s] of Object.entries(CD.species)){const im=new Image();im.src=s.img;creatureImages[id]=im}
const bands=[...new Set(CD.questions.map(q=>q.learning_level))];
function htmlSafe(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function companions(){return S.companions.owned.filter(m=>S.companions.team.includes(m.uid))}
function companionPower(){return Math.min(atk()*.65,companions().reduce((sum,m)=>sum+CD.species[m.id].power+m.lv*.6,0))}
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
  setLog(`<p class="en">Companion Ranch</p><p class="sub">仲間 ${S.companions.owned.length}体 · 同行 ${S.companions.team.length}/3<br>同行中の仲間は連携攻撃に参加し、勝利で育ちます。HP・MPは旅人と共有です。</p>`);
  const choice=await ask([{label:'Team<small>同行する仲間を選ぶ</small>',value:'team'},{label:'Breed<small>配合 · 親2体を消費</small>',value:'breed'},{label:'Collection<small>図鑑・生息地・レシピ</small>',value:'dex'},{label:'Back<small>もどる</small>',value:null}],{cancel:null});
  if(!choice)return;
  if(choice==='team'){
   setLog('<p class="en">Choose your companions</p><p class="sub">最大3体。同じ種類でも個体IDごとに選べます。選択すると同行／待機を切り替えます。</p>');
   const uid=await ask([...S.companions.owned.map(m=>({label:monsterCard(m),value:m.uid,disabled:!S.companions.team.includes(m.uid)&&S.companions.team.length>=3})),{label:'Back',value:null}],{cancel:null});
   if(uid&&!commitCompanionChange(s=>CR.equip(s.companions,uid)))await sys('変更できませんでした。保存容量・編成を確認してください。');
  }
  if(choice==='breed')await breeding();
  if(choice==='dex'){
   const habitats={seedpod_mouse:'草原',lotus_root_sproutling:'草原',silk_leaf_caterpillar:'草原・洞窟',pinecone_sparrow:'草原・東の地方',sprout_ear_mole:'洞窟・配合',lantern_moth:'東の地方・配合',thunder_feather_owlet:'夢の島・配合',ancient_forest_stag:'配合限定'};
   setLog(`<p class="en">Field Guide</p><p class="sub">発見 ${S.companions.seen.length}/8種 · 配合 ${S.companions.breeds||0}回</p>${Object.entries(CD.species).map(([id,s])=>`<div class="creature"><img src="${s.img}" alt=""><div>${s.name}<small>${habitats[id]} · ${S.companions.owned.filter(m=>m.id===id).length}体所有</small></div></div>`).join('')}<p class="en">Breeding recipes</p>${CD.recipes.map(r=>`<p class="sub">${r.parents.map(id=>CD.species[id].name).join(' ＋ ')} → ${CD.species[r.child].name}</p>`).join('')}`);await next();
  }
 }
}
async function breeding(){
 if(!['village','port'].includes(S.map)){await sys('配合は村か港町で行えます。町に戻ってメニューの「仲間と配合」を開こう。');return}
 const owned=S.companions.owned;
 if(owned.length<2){await sys('配合には2体必要です。野生の仲間に道具の木の実を与えてから、スカウトしよう。');return}
 setLog('<p class="en">Choose the first parent</p><p class="sub">親になる1体目を選択。確定するまでは消費しません。</p>');
 const a=await ask([...owned.map(m=>({label:monsterCard(m),value:m.uid})),{label:'Cancel',value:null}],{cancel:null});if(!a)return;
 setLog('<p class="en">Choose the second parent</p><p class="sub">組み合わせがある仲間だけを選べます。</p>');
 const b=await ask([...owned.filter(m=>m.uid!==a).map(m=>({label:monsterCard(m),value:m.uid,disabled:!CR.recipe(S.companions,a,m.uid,CD.recipes)})),{label:'Cancel',value:null}],{cancel:null});if(!b)return;
 const recipe=CR.recipe(S.companions,a,b,CD.recipes);if(!recipe)return;
 const parents=[a,b].map(uid=>owned.find(m=>m.uid===uid));
 setLog(`<p class="en">A new companion</p>${parents.map(monsterCard).join('')}<p class="progress-note">→ ${CD.species[recipe.child].name} Lv.1</p><p class="ng">確定すると親の2個体は消えます。</p><p class="sub">新しい個体はLv.1から育ちます。同行中の親がいた場合は、空いた枠に子が入ります。</p>`);
 const confirm=await ask([{label:'Cancel<small>配合しない</small>',value:false},{label:'Breed<small>この2個体を消費して配合</small>',value:true}],{cancel:false});
 if(!confirm)return;
 const done=commitCompanionChange(s=>CR.breed(s.companions,a,b,CD.recipes,CD.species));
 await sys(done?`${CD.species[recipe.child].name}が生まれた！ セーブしました。`:'保存できなかったため配合を取り消しました。親は消費していません。');
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
function scoutRate(){return B&&B.E.companion?CR.rate(B.fed||0,B.E.hp,B.E.max):0}
async function feed(){
 if(!B.E.companion||CD.species[B.E.companion].fusionOnly){await sys('この敵はスカウトできません。木の実は消費しません。');return false}
 if(!S.items.berry)return false;S.items.berry--;B.fed=Math.min(3,(B.fed||0)+1);
 const rate=scoutRate(),reaction=rate>=75?'仲間になりたそうにこちらを見ている。':rate>=55?'うれしそうに食べ、こちらに近づいてきた。':rate>=35?'興味を持って、ゆっくり食べている。':'こちらを警戒しながら食べている。';
 await beat(`<p class="en">You offer a berry.</p><p class="ja">${reaction}</p><p class="sub">次にScoutを選ぶと抽選します。現在の成功率 ${rate}％。</p>`,1600);return true;
}
async function scout(){
 if(!B.E.companion||!B.fed||CD.species[B.E.companion].fusionOnly)return 'cancel';
 const rate=scoutRate();
 setLog(`<p class="en">Scout ${B.E.jp}?</p><p class="big">${rate}％</p><p class="sub">成功率は表示どおりです。失敗すると反撃を受け、再挑戦にはもう一度餌が必要です。満員でも牧場に迎えられます。</p>`);
 const ok=await ask([{label:'Cancel',value:false},{label:`Scout · ${rate}％で抽選`,value:true}],{cancel:false});if(!ok)return 'cancel';
 B.fed=0;const success=Math.random()<rate/100;
 if(!success){await beat('<p class="ja">仲間にはならなかった。もう一度餌をあげてみよう。</p>',1200);return 'fail'}
 const id=B.E.companion;
 if(!commitCompanionChange(s=>CR.add(s.companions,id,CD.species))){await sys('保存できなかったため加入を取り消しました。保存容量を確認してください。');return 'fail'}
 await sys(`${CD.species[id].name}が牧場の仲間に加わった！ メニューで同行にできます。`);return 'success';
}
function creatureCanvas(id,flat=false){
 const im=creatureImages[id];if(!im||!im.complete||!im.naturalWidth)return null;
 const key='companion:'+id+':'+flat;if(SPRC.has(key))return SPRC.get(key);
 const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 const source=document.createElement('canvas');source.width=im.width;source.height=im.height;const sx=source.getContext('2d',{willReadFrequently:true});sx.drawImage(im,0,0);const data=sx.getImageData(0,0,im.width,im.height).data;let left=im.width,top=im.height,right=-1,bottom=-1;
 for(let y=0;y<im.height;y++)for(let px=0;px<im.width;px++)if(data[(y*im.width+px)*4+3]>32){left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 if(right<left)return null;const w=right-left+1,h=bottom-top+1,scale=96/Math.max(w,h);x.drawImage(im,left,top,w,h,(96-w*scale)/2,96-h*scale,w*scale,h*scale);
 if(flat){x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,96,96)}SPRC.set(key,c);return c;
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