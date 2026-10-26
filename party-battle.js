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
 const z=ZONES[zoneKey()]||ZONES.w1;const enemies=keys.slice(0,3).map((key,i)=>({...ENEMIES[key],key,slot:i,max:ENEMIES[key].hp,fed:0,caught:false,hitAt:0,attackAt:0}));
 const state={enemies,E:enemies[0],key:keys[0],tier:enemies[0].tier||z.tier,zone:z,hitT:0,hurtT:0,atkT:0,big:0,nums:[],combo:0,turn:0,t0:performance.now(),commandReady:false};
 Object.defineProperty(state,'fed',{get(){return this.E.fed},set(v){this.E.fed=v},enumerable:true});return state;
}
function livingAllies(){return companions().filter(m=>m.hp>0)}
async function healCompanion(amount,inBattle){const pool=(inBattle?companions():S.companions.owned).filter(m=>m.hp>0&&m.hp<m.maxHp);if(!pool.length){await sys('回復できる仲間がいません。戦闘不能は宿屋で復帰できます。');return false}setLog('<p>回復する仲間を選択</p>');const uid=await ask([...pool.map(m=>({label:htmlSafe(CD.species[m.id].name)+'<small>HP '+m.hp+'/'+m.maxHp+'</small>',value:m.uid})),{label:'Back',value:null}],{cancel:null});if(!uid)return false;const m=pool.find(m=>m.uid===uid),n=CR.heal(m,amount,CD.species);await sys(CD.species[m.id].name+'のHPが'+n+'回復！');return true}
function livingEnemies(){return B.enemies.filter(e=>e.hp>0&&!e.caught)}
function selectEnemy(enemy){if(!enemy||enemy.hp<=0||enemy.caught)return false;B.E=enemy;B.key=enemy.key;return true}
async function chooseBattleTarget(){
 document.body.dataset.battlePhase='target';
 setLog(battleEnemyList());
 const slot=await ask([...livingEnemies().map(e=>({label:`${String.fromCharCode(65+e.slot)} · ${htmlSafe(e.jp)}<small>HP ${e.hp}/${e.max}${e.hearts?' · '+heartText(e):''}</small>`,value:e.slot})),{label:'Back<small>もどる</small>',value:null}],{cancel:null});
 if(slot!==null)selectEnemy(B.enemies[slot]);
}
async function groupVictory(){
 const defeated=B.enemies.filter(e=>e.hp<=0&&!e.caught),exp=defeated.reduce((n,e)=>n+e.exp,0),gold=defeated.reduce((n,e)=>n+e.gold,0),allScouted=defeated.length===0;
 S.exp+=exp;S.gold+=gold;const oldHealth=new Map(companions().map(m=>[m.uid,{hp:m.hp,max:m.maxHp,mp:m.mp,maxMp:m.maxMp}]));CR.gain(S.companions,exp);for(const m of companions()){CR.health(m,CD.species);const old=oldHealth.get(m.uid);if(old.hp>0){m.hp=Math.min(m.maxHp,old.hp+m.maxHp-old.max);m.mp=Math.min(m.maxMp,old.mp+m.maxMp-old.maxMp)}}
 await beat(`<p class="en">${allScouted?'仲間になった！':'まものの群れに勝った！'}</p><p class="ja">${exp} EXP ・ ${gold} G</p>`,1100);
 while(S.exp>=need(S.lv)){const oh=maxHp(),om=maxMp();S.lv++;S.hp+=maxHp()-oh;S.mp+=maxMp()-om;await beat(`<p class="en">Level up! Lv.${S.lv}</p><p class="ja">仲間の能力は各個体のレベルで成長します。</p>`,1300)}
 endBattle();return allScouted?'scout':'win';
}
async function allyTarget(){document.body.dataset.battlePhase='target';
 setLog('<p>対象の仲間を選択</p>');const uid=await ask([...livingAllies().map(m=>({label:htmlSafe(CD.species[m.id].name)+'<small>HP '+m.hp+'/'+m.maxHp+'</small>',value:m.uid})),{label:'Back',value:null}],{cancel:null});return livingAllies().find(m=>m.uid===uid)||null;
}
function allyBuff(m,key){const b=B.buffs[m.uid];return b&&b[key]&&(key==='defense'?b[key].until>=B.turn:b[key].until>B.turn)?b[key].value:0}
function usefulSkill(ability,targets){return (ability.effects||[{effect:ability.effect}]).some(part=>part.self||targets.some(t=>{if(!t)return false;if(part.effect==='revive')return t.hp===0;if(t.hp<=0||t.caught)return false;if(['heal','allHeal'].includes(part.effect))return t.hp<(t.maxHp??t.max);const state=B.skillState[t.uid||'enemy:'+t.slot]||{};if(['cleanse','allCleanse'].includes(part.effect))return ['poison','burn','attackDown','defenseDown','sleep','stun','silence','blind'].some(k=>state[k]);if(part.effect==='dispel')return ['attackUp','defenseUp','shield','regen','guard','statusWard'].some(k=>state[k]);return true;}));}
function skillTargets(actor,ability,target){
 const kind=ability.target||({allDamage:'allEnemies',allHeal:'allAllies',heal:'ally',attackUp:'ally',defenseUp:'ally'}[ability.effect]||'enemy');
 return kind==='self'?[actor]:kind==='allEnemies'?livingEnemies():kind==='allAllies'?livingAllies():[target];
}
async function skillTarget(actor,ability,enemy){
 const kind=ability.target||({heal:'ally',attackUp:'ally',defenseUp:'ally'}[ability.effect]||'enemy');
 if(kind==='self')return actor;
 if(!['ally','fallenAlly'].includes(kind))return enemy;
 const pool=companions().filter(m=>kind==='fallenAlly'?m.hp===0:m.hp>0);
 if(!pool.length){await sys('対象になる仲間がいません');return null;}
 const uid=await ask([...pool.map(m=>({label:htmlSafe(CD.species[m.id].name)+'<small>HP '+m.hp+'/'+m.maxHp+'</small>',value:m.uid})),{label:'戻る',value:null}],{cancel:null});return pool.find(m=>m.uid===uid)||null;
}
async function showSkillEvents(events,name){
 const labels={damage:'ダメージ',heal:'HP回復',revive:'復活',shield:'盾',attackUp:'攻撃上昇',defenseUp:'防御上昇',attackDown:'攻撃低下',defenseDown:'弱体',poison:'毒',burn:'やけど',regen:'継続回復',cleanse:'状態回復',dispel:'強化解除',sleep:'眠り',stun:'しびれ',silence:'封印',blind:'暗闇',guard:'防御',statusWard:'状態防御',wardBlocked:'状態防御で防いだ',resist:'無効',recoil:'反動'};
 const lines=events.map(e=>{const t=e.target,n=t.jp||CD.species[t.id]?.name||'';if(e.kind==='damage'){t.hitAt=performance.now();if(t.uid)B.allyFx={uid:t.uid,t:t.hitAt,kind:'hurt'};else{B.fx={target:t.slot,k:'spl',t:t.hitAt};B.nums.push({slot:t.slot,v:e.value,t:t.hitAt});}}else if(t.uid)B.allyFx={uid:t.uid,t:performance.now(),kind:e.kind==='heal'||e.kind==='revive'?'heal':'buff'};if(e.kind==='revive'&&t.uid&&!B.acted.includes(t.uid))B.acted.push(t.uid);return htmlSafe(n)+'：'+(labels[e.kind]||e.kind)+(e.value>=1?' '+Math.round(e.value):'');});
 if(lines.length)await beat('<p>'+htmlSafe(name)+'</p><p>'+lines.join('<br>')+'</p>',650);
}
async function executeAbility(actor,ability,target,ok){
 B.skillState??={};const st=CR.stats(actor,CD.species),jobBonus=ability.command==='atk'&&S.job==='scribe'||ability.command==='skill'&&S.job==='sage'?1.4:ability.command==='lis'&&S.job==='hunter'?1.5:1;
 const mod=Math.max(.65,Math.min(1.4,1+SkillEffects.active(B.skillState,actor,'attackUp',B.turn)-SkillEffects.active(B.skillState,actor,'attackDown',B.turn)));
 // Elemental skills draw on 呪力 (magic); words, listening and physical skills on 攻撃.
 const magical=ability.command==='skill'&&typeof ElementResist!=='undefined'&&!!ElementResist.element(ability)&&Number.isFinite(st.magic);
 const attack=((magical?st.magic:st.attack)+(S.weapon?.v||0))*mod*jobBonus,targets=skillTargets(actor,ability,target);
 let resolved=ability;const parts=ability.effects||[{effect:ability.effect,power:ability.power}];if(parts.some(p=>['damage','allDamage','drain'].includes(p.effect))&&Math.random()<SkillEffects.active(B.skillState,actor,'blind',B.turn)){resolved={...ability,effects:parts.filter(p=>!['damage','allDamage','drain'].includes(p.effect))};await beat('<p>暗闇で攻撃が外れた</p>',450);}const events=SkillEffects.apply({actor,targets,ability:{...resolved,supportPower:st.attack},ok,attack,turn:B.turn,battle:B.skillState});
 if(typeof save==='function')save();
 await showSkillEvents(events,ability.name+(ok?'':'（不正解：効果50%）'));
}
async function enemySkill(enemy){
 if(enemy.boss||!enemy.companion||B.turn%3!==0||SkillEffects.active(B.skillState,enemy,'silence',B.turn))return false;
 const level=Math.min(99,Math.max(1,(enemy.tier||B.tier||1)*3));
 const maximum=CR.stats({id:enemy.companion,lv:level,plus:0},CD.species).mp;enemy.mp??=maximum;
 const abilities=CR.individualInnate({id:enemy.companion,lv:level},CD.species).filter(s=>s.level<=level&&s.cost<=enemy.mp&&s.target!=='fallenAlly');if(!abilities.length)return false;
 const ability=abilities[(B.turn/3-1)%abilities.length];let targets;
 if(ability.target==='self')targets=[enemy];else if(ability.target==='allAllies')targets=livingEnemies();else if(ability.target==='ally')targets=[livingEnemies().sort((a,b)=>a.hp/a.max-b.hp/b.max)[0]];else if(ability.target==='allEnemies')targets=livingAllies();else targets=[pick(livingAllies())];
 if(!targets.length)return false;enemy.mp-=ability.cost;
 const events=SkillEffects.apply({actor:enemy,targets,ability:{...ability,supportPower:enemy.atk},ok:true,attack:enemy.atk*Math.max(.65,Math.min(1.4,1+SkillEffects.active(B.skillState,enemy,'attackUp',B.turn)-SkillEffects.active(B.skillState,enemy,'attackDown',B.turn))),turn:B.turn,battle:B.skillState});if(typeof save==='function')save();await showSkillEvents(events,enemy.jp+'：'+ability.name);return true;
}
/* Turn order: fastest first, a ±10% roll each round; ties keep team order and allies before enemies.
   Enemies use their species' speed at the level they fight at (or an explicit spd). */
function enemySpeed(e){if(Number.isFinite(e.spd))return e.spd;const tier=e.tier||B.tier||1,lv=Math.min(99,tier*3+(e.boss?6:0)),id=e.companion||e.worldArt;
 return CD.species[id]?CR.stats({id,lv,plus:0},CD.species).speed:5+tier*3+(e.boss?4:0)}
function battleOrder(){const roll=()=>.9+Math.random()*.2;
 // Bosses with actions:2 act twice a round: a second turn at about 60% of their speed.
 const units=[...livingAllies().map((m,i)=>({ally:true,unit:m,i,id:m.uid,spd:CR.stats(m,CD.species).speed*roll()})),...livingEnemies().flatMap((e,i)=>Array.from({length:Math.max(1,e.actions||1)},(_,n)=>({ally:false,unit:e,i:100+i+n*10,id:'e'+e.slot+(n?':'+n:''),spd:enemySpeed(e)*roll()*(n?.6:1)})))];
 return units.sort((a,b)=>b.spd-a.spd||a.i-b.i)}
// One enemy's action. Enemies act on the round's next turn number, as when they all moved after the party.
async function enemyAct(enemy){B.turn++;try{
   if(SkillEffects.skip(B.skillState,enemy,B.turn))return;
   if(Math.random()<SkillEffects.active(B.skillState,enemy,'blind',B.turn))return;
   if(await enemySkill(enemy)){if(typeof save==='function')save();return;}
   const special=enemy.boss&&B.turn%3===0&&!SkillEffects.active(B.skillState,enemy,'silence',B.turn),targets=special?[...livingAllies()]:[pick(livingAllies())];
   for(const target of targets){if(!target||target.hp<=0)continue;
    const weakened=Math.max(.65,1-SkillEffects.active(B.skillState,enemy,'attackDown',B.turn));
    const defense=(CR.stats(target,CD.species).defense+(S.armor?.v||0));
    const damage=Math.max(1,Math.round((enemy.atk*weakened*(.85+Math.random()*.3)*(special?1.2:1)-defense*.4)/Math.sqrt(B.enemies.length)));
    enemy.attackAt=performance.now();SkillEffects.hurt(target,damage*(1+SkillEffects.active(B.skillState,target,'defenseDown',B.turn)),B.skillState,B.turn);B.allyFx={uid:target.uid,t:enemy.attackAt,kind:'hurt'};if(typeof save==='function')save();
    await beat('<p>'+htmlSafe(enemy.jp)+(special?'の全体攻撃！':'の攻撃！')+'</p><p>'+htmlSafe(CD.species[target.id].name)+'に '+damage+' ダメージ'+(target.hp===0?' · 戦闘不能':'')+'</p>',650);
    if(!livingAllies().length){await beat('<p>仲間が全員倒れてしまった…</p>',800);endBattle();return 'lose'}
   }
  }finally{if(B)B.turn--}}
/* Encounter transition: a flash, then bars sweep in from alternating sides and cover the screen; the battle is set up
   behind them and the returned function sweeps them away. Bosses flash red. Skipped where there is no real page. */
async function encounterFx(boss){if(typeof document?.createElement!=='function'||!document.body?.appendChild)return null;
 const o=document.createElement('div');o.id='encounterFx';if(boss)o.className='boss';o.innerHTML='<b></b>'+'<i></i>'.repeat(8);document.body.appendChild(o);
 await new Promise(r=>setTimeout(r,matchMedia?.('(prefers-reduced-motion: reduce)').matches?120:520));
 return ()=>{o.classList.add('out');setTimeout(()=>o.remove(),480)}}
async function partyBattle(key,options={}){
 CR.validate(S.companions,CD.species);
 const reveal=await encounterFx(!!ENEMIES[key]?.boss);
 if(!S.companions.team.length&&S.companions.owned.length)S.companions.team=[(S.companions.owned.find(m=>m.hp>0)||S.companions.owned[0]).uid];
 B=createGroupBattle(encounterKeys(key,options));B.acted=[];B.buffs={};B.skillState={};mode='battle';reveal?.();if(typeof RoamingMasters!=='undefined')RoamingMasters.attach(B,options);document.body.dataset.battlePhase='message';
 for(const e of B.enemies)if(e.companion&&!S.companions.seen.includes(e.companion))S.companions.seen.push(e.companion);
 await beat('<p class="en">'+B.enemies.map(e=>htmlSafe(e.jp)).join('・')+' が現れた！</p>',900);
 while(true){
  if(!livingAllies().length){endBattle();return 'lose'}
  if(!livingEnemies().length)return groupVictory();
  // Everyone acts in speed order each round (allies and enemies interleaved).
  B.order??=battleOrder();
  const next=B.order.find(x=>x.ally?x.unit.hp>0&&companions().includes(x.unit)&&!B.acted.includes(x.unit.uid):x.unit.hp>0&&!x.unit.caught&&!B.acted.includes(x.id));
  if(next&&!next.ally){B.acted.push(next.id);if(await enemyAct(next.unit)==='lose')return 'lose';continue}
  B.actor=next?.unit;
  if(B.actor){
   const skipped=SkillEffects.skip(B.skillState,B.actor,B.turn);if(skipped){B.acted.push(B.actor.uid);await beat('<p>状態異常で行動できない</p>',500);continue;}
   if(B.E.hp<=0||B.E.caught)selectEnemy(livingEnemies()[0]);const En=B.E;
   B.commandReady=true;document.body.dataset.battlePhase='command';setLog('<p class="sub">'+htmlSafe(CD.species[B.actor.id].name)+'の行動 · SP '+B.actor.mp+'/'+B.actor.maxMp+'</p>'+battleEnemyList());
   const cmd=await battleCommands();B.commandReady=false;document.body.dataset.battlePhase='message';if(cmd===null)continue;
   if(typeof cmd==='string'&&cmd.startsWith('select:')){selectEnemy(B.enemies[Number(cmd.slice(7))]);continue}
   if(cmd==='target'){await chooseBattleTarget();continue}
   if(cmd==='item'){document.body.dataset.battlePhase='item';if(!await itemMenu(true))continue}
   else if(cmd==='scout'){const result=await scout();if(result==='cancel')continue;if(result==='success'){En.caught=true;En.fed=0}}
   else if(cmd==='run'){if(Math.random()<.7){await beat('<p>うまく逃げられた！</p>',700);endBattle();return 'run'}await beat('<p>逃げられなかった！</p>',700)}
   else{
    const ability=cmd==='atk'?{name:'ことばの光',effect:'damage',power:1,cost:0}:cmd==='lis'?{name:'聴く呪文',effect:'damage',power:1.3,cost:0}:CR.known(B.actor,CD.species).find(s=>s.id===cmd);
    if(!ability||B.actor.hp<=0||B.actor.mp<ability.cost)continue;
    ability.command=['atk','lis'].includes(cmd)?cmd:'skill';if(ability.command==='skill'&&SkillEffects.active(B.skillState,B.actor,'silence',B.turn)){await sys('封印中は通常攻撃かリスニングを選べます');continue;}const target=await skillTarget(B.actor,ability,En);if(!target)continue;if(!usefulSkill(ability,skillTargets(B.actor,ability,target))){await sys('今は効果のある対象がいません');continue;}
    if(!['atk','lis'].includes(cmd)&&!CR.spend(B.actor,ability,CD.species))continue;
    if(typeof save==='function')save();
    document.body.dataset.battlePhase='question';const ok=await quiz(cmd==='atk'?qVocab(curTier()):cmd==='lis'?qListenAny(curTier()):bandQuestion(ability.level>=3),{battle:true});document.body.dataset.battlePhase='message';
    await executeAbility(B.actor,ability,target,ok);if(cmd==='lis'){const healed=CR.heal(B.actor,CR.effect(B.actor.maxHp*(S.job==='hunter'?.2:.12),ok),CD.species);if(typeof save==='function')save();await beat('<p>'+htmlSafe(CD.species[B.actor.id].name)+' HP +'+healed+'</p>',500)}
   }
   B.acted.push(B.actor.uid);if(typeof save==='function')save();continue;
  }
  B.turn++;
  const ticks=[...companions(),...B.enemies].flatMap(m=>SkillEffects.tick(B.skillState,m,B.turn));if(ticks.length){if(typeof save==='function')save();await showSkillEvents(ticks,'ターン終了');}
  B.acted=[];B.order=null;
 }
}
function normalizedCreature(id){return creatureCanvas(id)}   // the 256px painted canvas, drawn with smoothing
function partyPositions(count,W){return Array.from({length:count},(_,i)=>W*(i+1)/(count+1))}
function drawHpBar(x,y,w,h,hp,max,selected){
 ctx.fillStyle='#080a10';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.strokeStyle=selected?'#f9e4a0':'#e2e6ef';ctx.lineWidth=1;ctx.strokeRect(x-2,y-2,w+4,h+4);ctx.fillStyle='#383e48';ctx.fillRect(x,y,w,h);ctx.fillStyle=hp/max>.3?'#6fda88':'#f07869';ctx.fillRect(x,y,w*Math.max(0,hp/max),h);
}
function drawPartyBattle(now){
 const W=VIEW.w,H=VIEW.h;ctx.globalAlpha=1;if(!drawBattleBackdrop())flatBattleGround(B.zone.bg);
 const area=battleStageBounds(),positions=partyPositions(B.enemies.length,W),size=Math.max(24,Math.min(240,area.bottom-area.top,W/(B.enemies.length+1)*.86)),base=area.bottom,font=Math.max(10,Math.min(14,W/65));
 // A defeated enemy stays on screen for its last hit: slash, damage number and a burst, then fades away.
 for(const enemy of B.enemies){if(enemy.caught)continue;const gone=enemy.hp<=0,since=now-(enemy.hitAt||0);if(gone&&(!enemy.hitAt||since>1100))continue;const x=positions[enemy.slot],id=enemy.companion||enemy.worldArt,can=normalizedCreature(id)||enemyCanvas(enemy.key),motion=creatureMotion(id,now/1000+enemy.slot),attack=now-enemy.attackAt;
  const slide=enemy.attackAt&&attack<400?Math.sin(attack/400*Math.PI)*13:0,hit=now-enemy.hitAt<220&&enemy.hitAt>0;
  ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(x,base+2,size*.3,size*.055,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(Math.round(x+(hit?Math.sin(now*.08)*2:0)),Math.round(base+motion.dy));ctx.scale(motion.sx,motion.sy);ctx.globalAlpha=gone?Math.max(0,1-Math.max(0,since-350)/700):1;ctx.imageSmoothingEnabled=!!can.smooth;ctx.drawImage(can,-size/2+slide,-size,size,size);
  if(gone&&since<350){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55*(1-since/350);ctx.drawImage(can,-size/2+slide,-size,size,size);ctx.globalCompositeOperation='source-over'}ctx.restore();ctx.globalAlpha=1;
  if(gone){const t=Math.min(1,since/600);ctx.save();ctx.globalAlpha=1-t;ctx.strokeStyle='#ffe6a0';ctx.lineWidth=3;for(let k=0;k<10;k++){const a=k/10*Math.PI*2+enemy.slot,r1=size*(.12+t*.35),r2=r1+size*.12;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r1,base-size*.5+Math.sin(a)*r1);ctx.lineTo(x+Math.cos(a)*r2,base-size*.5+Math.sin(a)*r2);ctx.stroke()}ctx.restore()}
  const barW=Math.min(112,W/(B.enemies.length+1)-16),barY=base-size+motion.dy-11;drawHpBar(x-barW/2,barY,barW,6,enemy.hp,enemy.max,enemy===B.E);
  txt(String.fromCharCode(65+enemy.slot)+' '+enemy.jp,x,barY-6,font,'#fff','center');
  if(enemy===B.E&&!gone&&H>340){txt('▼',x,barY-24,12,'#ffe69c','center')}
  for(const n of B.nums){const t=(now-n.t)/850;if(n.slot!==enemy.slot||t<0||t>1)continue;txt(String(n.v),x,base-size*.5-t*24,22,'#ffe6a0','center')}
  if(B.fx?.target===enemy.slot&&now-B.fx.t<300){ctx.strokeStyle='#fff2b0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-size*.3,base-size*.8);ctx.lineTo(x+size*.3,base-size*.25);ctx.stroke()}
 }
 ctx.globalAlpha=1;updateBattleRoster();
}
function battleStageBounds(){
 const hud=document.getElementById('hud'),roster=document.getElementById('battleRoster'),panel=document.getElementById('panel');
 return {top:Math.max(hud.offsetTop+hud.offsetHeight,roster.offsetTop+roster.offsetHeight)+(VIEW.h<=340?42:54),bottom:panel.offsetTop-(VIEW.h<=340?6:14)};
}
let battleRosterCache='';
function updateBattleRoster(){const el=document.getElementById('battleRoster');if(!B||!S)return;const html=companions().map(m=>'<span class="'+(m.hp===0?'knocked':'')+' '+(B.allyFx?.uid===m.uid&&performance.now()-B.allyFx.t<500?'ally-'+B.allyFx.kind:'')+'"><img src="'+CD.species[m.id].img+'" alt=""><b>'+htmlSafe(CD.species[m.id].name)+'</b><small>'+(m.hp===0?'戦闘不能':B.actor?.uid===m.uid?'行動中':B.acted?.includes(m.uid)?'行動済':'待機')+' HP '+m.hp+'/'+m.maxHp+' · SP '+m.mp+'/'+m.maxMp+'</small><meter min="0" max="'+m.maxHp+'" value="'+m.hp+'"></meter></span>').join('');if(html!==battleRosterCache){el.innerHTML=html;battleRosterCache=html}}
function battleEnemyList(){
 const groups=[];for(const e of livingEnemies()){let g=groups.find(g=>g.key===e.key);if(!g){g={key:e.key,enemies:[]};groups.push(g)}g.enemies.push(e)}
 return '<ul class="battle-enemies">'+groups.map(g=>{const selected=g.enemies.includes(B.E),e=selected?B.E:g.enemies[0];return `<li><button type="button" class="enemy-choice ${selected?'selected':''}" aria-label="${htmlSafe(e.jp)}を選択" aria-pressed="${selected}" onclick="if(B.commandReady&&nav.done)nav.done('select:${e.slot}')"><span>${selected?'▶':'　'} ${htmlSafe(e.jp)}</span><span>${g.enemies.length}匹</span></button></li>`}).join('')+'</ul>';
}
async function battleCommands(){
 const cmd=await ask([{label:'呪文',value:'fight'},{label:'どうぐ',value:'item'},{label:CD.species[B.E.companion]?.fusionOnly&&!canScout(B.E)?'配合限定':'スカウト',value:'scout',disabled:!canScout(B.E)},{label:'にげる',value:'run',disabled:B.enemies.some(e=>e.boss)}]);if(cmd!=='fight')return cmd;
 document.body.dataset.battlePhase='actions';return ask([{label:(typeof elementTag==='function'?elementTag({command:'atk'}):'')+'ことばの光<small>SP 0 · 敵1体</small>',value:'atk'},{label:'聴く呪文<small>SP 0 · 聴解・自身回復</small>',value:'lis'},...CR.known(B.actor,CD.species).map(s=>({label:(typeof elementTag==='function'?elementTag(s):'')+htmlSafe(s.name)+'<small>SP '+s.cost+' · '+s.description+'</small>',value:s.id,disabled:B.actor.mp<s.cost})),{label:'対象を変更',value:'target'},{label:'戻る',value:null}],{cancel:null});
}
