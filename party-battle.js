/* Group combat: one selected enemy alias keeps item/scout operations consistent. */
const AIRBORNE_SPECIES=new Set(['pinecone_sparrow','lantern_moth','thunder_feather_owlet']);
function creatureMotion(id,time){const flying=AIRBORNE_SPECIES.has(id);return {dy:flying?-10+Math.sin(time*3)*3:0,sx:1,sy:flying?1:1+Math.sin(time*2)*.008,alpha:1,flying}}
function encounterKeys(key,options={}){
 if(!ENEMIES[key])throw Error('Unknown enemy');
 if(ENEMIES[key].boss)return [key];
 if(options.keys){if(options.keys.length<1||options.keys.length>3||options.keys.some(k=>!ENEMIES[k]||ENEMIES[k].boss))throw Error('Encounter must contain 1–3 regular enemies');return [...options.keys]}
 const count=1+(Math.random()<.55?1:0)+(Math.random()<.25?1:0),pool=ZONES[zoneKey()].foes.filter(k=>!ENEMIES[k].boss);
 return [key,...Array.from({length:count-1},()=>pick(pool))];
}
function createGroupBattle(keys){
 const z=ZONES[zoneKey()];const enemies=keys.slice(0,3).map((key,i)=>({...ENEMIES[key],key,slot:i,max:ENEMIES[key].hp,fed:0,caught:false,hitAt:0,attackAt:0}));
 const state={enemies,E:enemies[0],key:keys[0],tier:enemies[0].tier||z.tier,zone:z,hitT:0,hurtT:0,atkT:0,big:0,nums:[],combo:0,turn:0,t0:performance.now(),commandReady:false};
 Object.defineProperty(state,'fed',{get(){return this.E.fed},set(v){this.E.fed=v},enumerable:true});return state;
}
function livingEnemies(){return B.enemies.filter(e=>e.hp>0&&!e.caught)}
function selectEnemy(enemy){if(!enemy||enemy.hp<=0||enemy.caught)return false;B.E=enemy;B.key=enemy.key;return true}
async function chooseBattleTarget(){
 setLog('<p class="en">どの敵をねらう？</p><p class="sub">木の実・スカウトも選んだ相手に使います。</p>');
 const slot=await ask([...livingEnemies().map(e=>({label:`${String.fromCharCode(65+e.slot)} · ${htmlSafe(e.jp)}<small>HP ${e.hp}/${e.max}${e.fed?' · 木の実を食べた':''}</small>`,value:e.slot})),{label:'Back<small>もどる</small>',value:null}],{cancel:null});
 if(slot!==null)selectEnemy(B.enemies[slot]);
}
async function groupVictory(){
 const defeated=B.enemies.filter(e=>e.hp<=0&&!e.caught),exp=defeated.reduce((n,e)=>n+e.exp,0),gold=defeated.reduce((n,e)=>n+e.gold,0),allScouted=defeated.length===0;
 S.exp+=exp;S.gold+=gold;CR.gain(S.companions,exp);
 await beat(`<p class="en">${allScouted?'仲間になった！':'まものの群れに勝った！'}</p><p class="ja">${exp} EXP ・ ${gold} G</p>`,1100);
 while(S.exp>=need(S.lv)){const oh=maxHp(),om=maxMp();S.lv++;S.hp+=maxHp()-oh;S.mp+=maxMp()-om;await beat(`<p class="en">Level up! Lv.${S.lv}</p><p class="ja">HPとMPが増えた！</p>`,1300)}
 endBattle();return allScouted?'scout':'win';
}
async function partyBattle(key,options={}){
 B=createGroupBattle(encounterKeys(key,options));mode='battle';
 for(const e of B.enemies)if(e.companion&&!S.companions.seen.includes(e.companion))S.companions.seen.push(e.companion);
 await beat(`<p class="en">${B.enemies.map(e=>htmlSafe(e.jp)).join('・')} が あらわれた！</p><p class="sub">相手を選んで、ことばの力でたたかおう。</p>`,1100);
 while(true){
  if(!livingEnemies().length)return groupVictory();
  if(B.E.hp<=0||B.E.caught)selectEnemy(livingEnemies()[0]);
  const En=B.E,t=curTier();B.commandReady=true;
  setLog(`<p class="en">どうする？</p><p class="sub">ねらう相手：${String.fromCharCode(65+En.slot)} ${htmlSafe(En.jp)}<br>${B.combo>1?B.combo+' COMBO · ':''}味方 ${companions().length||1} / 敵 ${livingEnemies().length}</p>`);
  const cmd=await ask([{label:'たたかう<small>Attack · 単語</small>',value:'atk'},{label:`じゅもん<small>Spell · MP ${spellCost()}</small>`,value:'spl',disabled:S.mp<spellCost()},{label:'こだま<small>Echo · 聴解と回復</small>',value:'lis'},{label:'どうぐ<small>Item · 薬草・木の実</small>',value:'item'},{label:`スカウト<small>Scout · ${En.companion?(B.fed?scoutRate()+'％':'先に木の実'):'対象外'}</small>`,value:'scout',disabled:!En.companion||!B.fed},...(livingEnemies().length>1?[{label:'あいてを選ぶ<small>Target · A / B / C</small>',value:'target'}]:[]),{label:'にげる<small>Run</small>',value:'run',disabled:B.enemies.some(e=>e.boss)}]);
  B.commandReady=false;
  if(cmd==='target'){await chooseBattleTarget();continue}
  if(cmd==='item'){if(!await itemMenu(true))continue}
  else if(cmd==='scout'){const result=await scout();if(result==='cancel')continue;if(result==='success'){En.caught=true;En.fed=0;if(!livingEnemies().length)return groupVictory()}}
  else if(cmd==='run'){if(Math.random()<.7){await beat('<p class="en">うまく にげきれた！</p>',800);endBattle();return 'run'}await beat('<p class="en">にげられなかった！</p>',800)}
  else{
   let q,mult=1;if(cmd==='atk')q=qVocab(t);if(cmd==='spl'){S.mp-=spellCost();q=bandQuestion(true);mult=1.8}if(cmd==='lis'){q=qListenAny(t);mult=1.3}
   const ok=await quiz(q,{battle:true});B.combo=ok?B.combo+1:0;
   const bonus=cmd==='atk'&&S.job==='scribe'||cmd==='spl'&&S.job==='sage'?1.4:cmd==='lis'&&S.job==='hunter'?1.5:1;
   const damage=CR.effect((atk()+companionPower())*(.9+Math.random()*.2)*mult*bonus*(1+Math.max(0,Math.min(B.combo-1,4))*.15),ok);
   En.hp=Math.max(0,En.hp-damage);En.hitAt=performance.now();B.hitT=En.hitAt;B.fx={target:En.slot,k:cmd,t:En.hitAt};B.nums.push({slot:En.slot,v:damage,t:En.hitAt});
   let recovery='';if(cmd==='lis'){const h=CR.effect(maxHp()*(S.job==='hunter'?.2:.12),ok);S.hp=Math.min(maxHp(),S.hp+h);recovery=` HPが${h}回復。`}
   await beat(`<p class="en">${htmlSafe(En.jp)}に ${damage} ダメージ！</p><p class="ja">${ok?'ことばの力が届いた！':'誤答でも50％の力で発動。'}${recovery}</p>`,950);
   if(!En.hp)await beat(`<p class="en">${htmlSafe(En.jp)}を たおした！</p>`,650);
   if(!livingEnemies().length)return groupVictory();
  }
  // Each living enemy acts; group scaling prevents a sudden 3x difficulty spike.
  B.turn++;for(const enemy of [...livingEnemies()]){
   const special=enemy.boss&&B.turn%3===0,scale=1/Math.sqrt(B.enemies.length),damage=Math.max(1,Math.round((enemy.atk*(.85+Math.random()*.3)*(special?1.6:1)-def()*.4)*scale));
   enemy.attackAt=performance.now();B.hurtT=enemy.attackAt;S.hp=Math.max(0,S.hp-damage);
   await beat(`<p class="en">${htmlSafe(enemy.jp)}の${special?'とくぎ':'こうげき'}！</p><p class="ja">${damage} ダメージを受けた。</p>`,750);
   if(!S.hp){await beat('<p class="en">力尽きてしまった……</p>',1000);endBattle();return 'lose'}
  }
 }
}
function normalizedCreature(id){return creatureCanvas(id)}
function partyPositions(count,W){return Array.from({length:count},(_,i)=>W*(i+1)/(count+1))}
function drawHpBar(x,y,w,h,hp,max,selected){
 ctx.fillStyle='#080a10';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.strokeStyle=selected?'#f9e4a0':'#e2e6ef';ctx.lineWidth=1;ctx.strokeRect(x-2,y-2,w+4,h+4);ctx.fillStyle='#383e48';ctx.fillRect(x,y,w,h);ctx.fillStyle=hp/max>.3?'#6fda88':'#f07869';ctx.fillRect(x,y,w*Math.max(0,hp/max),h);
}
function drawPartyBattle(now){
 const W=cv.width,H=cv.height,art=artBattleBackground(B.zone.bg);ctx.globalAlpha=1;ctx.imageSmoothingEnabled=false;if(art?.naturalWidth)imageCover(ctx,art,W,H);else{ctx.fillStyle='#223b32';ctx.fillRect(0,0,W,H)}
 const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#09101c22');shade.addColorStop(1,'#08121e66');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
 const positions=partyPositions(B.enemies.length,W),size=Math.min(132,H*.40,W/(B.enemies.length+1)*.86),base=H*.70,font=Math.max(10,Math.min(14,W/65));
 for(const enemy of B.enemies){if(enemy.hp<=0||enemy.caught)continue;const x=positions[enemy.slot],id=enemy.companion||enemy.worldArt,can=normalizedCreature(id)||enemyCanvas(enemy.key),motion=creatureMotion(id,now/1000+enemy.slot),attack=now-enemy.attackAt;
  const slide=enemy.attackAt&&attack<400?Math.sin(attack/400*Math.PI)*13:0,hit=now-enemy.hitAt<220&&enemy.hitAt>0;
  ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(x,base+2,size*.3,size*.055,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(Math.round(x+(hit?Math.sin(now*.08)*2:0)),Math.round(base+motion.dy));ctx.scale(motion.sx,motion.sy);ctx.globalAlpha=1;ctx.drawImage(can,-size/2+slide,-size,size,size);ctx.restore();
  const barW=Math.min(112,W/(B.enemies.length+1)-16),barY=base-size+motion.dy-11;drawHpBar(x-barW/2,barY,barW,6,enemy.hp,enemy.max,enemy===B.E);
  txt(String.fromCharCode(65+enemy.slot)+' '+enemy.jp,x,barY-6,font,'#fff','center');
  if(enemy===B.E){txt('▼',x,barY-24,12,'#ffe69c','center')}
  for(const n of B.nums){const t=(now-n.t)/850;if(n.slot!==enemy.slot||t<0||t>1)continue;txt(String(n.v),x,base-size*.5-t*24,22,'#ffe6a0','center')}
  if(B.fx?.target===enemy.slot&&now-B.fx.t<300){ctx.strokeStyle='#fff2b0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-size*.3,base-size*.8);ctx.lineTo(x+size*.3,base-size*.25);ctx.stroke()}
 }
 const allies=companions().slice(0,3),allyX=partyPositions(allies.length||1,W),allySize=Math.min(65,H*.27),allyBase=H-6;
 (allies.length?allies:[{id:'hero',lv:S.lv}]).forEach((m,i)=>{const can=m.id==='hero'?artCharacter('hero',0,0):normalizedCreature(m.id);if(!can)return;const motion=creatureMotion(m.id,now/1000+i);ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(allyX[i],allyBase,allySize*.3,3,0,0,7);ctx.fill();ctx.globalAlpha=1;ctx.drawImage(can,allyX[i]-allySize/2,allyBase-allySize+motion.dy*.5,allySize,allySize)});
 ctx.globalAlpha=1;updateBattleRoster();
}
let battleRosterCache='';
function updateBattleRoster(){const el=document.getElementById('battleRoster');if(!B||!S)return;const team=companions();const html=(team.length?team:[{id:'hero',lv:S.lv}]).slice(0,3).map(m=>`<span><b>${m.id==='hero'?'少年':CD.species[m.id].name}</b><small>Lv.${m.lv} · ${m.id==='hero'?'冒険者':'同行'}</small></span>`).join('');if(html!==battleRosterCache){el.innerHTML=html;battleRosterCache=html}}
