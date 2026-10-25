/* Pure, bounded combat effects. Battle-only state never enters a gameplay save. */
const SkillEffects=(()=>{
 const supported=new Set(['damage','allDamage','drain','heal','allHeal','attackUp','allAttackUp','defenseUp','allDefenseUp','attackDown','allAttackDown','defenseDown','allDefenseDown','shield','allShield','regen','allRegen','poison','burn','damagePoison','damageBurn','damageWeaken','damageBreak','cleanse','allCleanse','healCleanse','dispel','revive','recoil','guard','statusWard','sleep','stun','silence','blind']);
 const key=m=>m.uid||'enemy:'+m.slot;
 const maximum=m=>m.maxHp??m.max;
 const state=(battle,m)=>battle[key(m)]??(battle[key(m)]={});
 const active=(battle,m,type,turn)=>{const x=state(battle,m)[type];return x&&x.until>=turn?x.value:0};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function status(battle,m,type,value,turn,duration){const s=state(battle,m),old=s[type];s[type]={value:Math.max(old&&old.until>=turn?old.value:0,value),until:Math.max(old&&old.until>=turn?old.until:0,turn+clamp(duration||3,1,3)),applied:turn};}
 function hurt(m,amount,battle,turn,direct=true){if(m.hp<=0||m.caught)return 0;const s=state(battle,m);amount*=1-active(battle,m,'guard',turn);amount/=1+active(battle,m,'defenseUp',turn);const shield=active(battle,m,'shield',turn),blocked=Math.min(shield,amount);if(blocked)s.shield.value-=blocked;const loss=Math.min(m.hp,Math.max(0,Math.round(amount-blocked)));m.hp-=loss;if(direct&&loss&&s.sleep){delete s.sleep;s.controlImmune={value:1,until:turn+2}}return loss;}
 function heal(m,n){if(m.hp<=0)return 0;const gain=Math.min(maximum(m)-m.hp,Math.max(0,Math.round(n)));m.hp+=gain;return gain;}
 const negatives=['poison','burn','attackDown','defenseDown','sleep','stun','silence','blind'];
 function cleanse(battle,m,fraction=1){const s=state(battle,m),keys=negatives.filter(k=>s[k]);for(const k of keys.slice(0,Math.ceil(keys.length*fraction)))delete s[k];}
 function apply({actor,targets,ability,ok,attack,turn,battle}){
  if(Array.isArray(ability.effects)){if(ability.effects.some(p=>!supported.has(p.effect)))throw Error('Unsupported compound skill');const blocked=new Set(),events=[];if(ability.effects.some(p=>negatives.includes(p.effect)))for(const t of targets)if(active(battle,t,'statusWard',turn)){delete state(battle,t).statusWard;blocked.add(t);events.push({target:t,kind:'wardBlocked',value:0});}return events.concat(ability.effects.flatMap(part=>apply({actor,targets:part.self?[actor]:negatives.includes(part.effect)?targets.filter(t=>!blocked.has(t)):targets,ability:{...ability,...part,effects:undefined},ok,attack:part.effect==='damage'||part.effect==='drain'?attack:(ability.supportPower??attack),turn,battle})));}
  if(!supported.has(ability.effect))throw Error('Unsupported skill effect '+ability.effect);
  if(actor.hp<=0)throw Error('Incapacitated actor');
  const k=ok?1:.5,p=ability.power,e=ability.effect,events=[];
  if(e==='recoil'){const n=Math.min(actor.hp-1,Math.round(maximum(actor)*clamp(p,0,.2)));actor.hp-=n;return [{target:actor,kind:'recoil',value:n}];}
  for(const t of targets){
   if(!t||t.caught||t.hp<=0&&e!=='revive')continue;
   const emit=(kind,value)=>events.push({target:t,kind,value});
   if(['damage','allDamage','drain','damagePoison','damageBurn','damageWeaken','damageBreak'].includes(e)){
    const resist=typeof ElementResist!=='undefined'?ElementResist.multiplier(t,ability):1;   // hidden elemental resistance (resistances.js)
    const raw=Math.max(1,Math.round(attack*p*k*(1+active(battle,t,'defenseDown',turn))*resist));const loss=hurt(t,raw,battle,turn);emit('damage',loss);
    if(e==='drain'){const n=heal(actor,Math.floor(loss*(ability.fraction??.5)));events.push({target:actor,kind:'heal',value:n});}
    if(t.hp>0&&e.startsWith('damage')&&e!=='damage'){const type={damagePoison:'poison',damageBurn:'burn',damageWeaken:'attackDown',damageBreak:'defenseDown'}[e];if(type){status(battle,t,type,(ability.magnitude??(type==='poison'||type==='burn'?.06:.2))*k,turn,ability.duration);emit(type,active(battle,t,type,turn));}}
   }else if(['heal','allHeal','healCleanse'].includes(e)){emit('heal',heal(t,(ability.fullHeal?maximum(t):Number.isFinite(ability.fixedHeal)?ability.fixedHeal:attack*p)*k));if(e==='healCleanse'){cleanse(battle,t,k);emit('cleanse',0);}}
   else if(e==='revive'){if(t.hp===0){t.hp=Math.max(1,Math.round(maximum(t)*clamp(p,.1,.5)*k));emit('revive',t.hp);}}
   else if(['cleanse','allCleanse'].includes(e)){if(ok||Math.random()<.5){cleanse(battle,t);emit('cleanse',0)}else emit('resist',0);}
   else if(e==='dispel'){if(ok||Math.random()<.5){const s=state(battle,t),types=['attackUp','defenseUp','shield','regen','guard','statusWard'].filter(v=>s[v]);for(const type of types)delete s[type];emit('dispel',0)}else emit('resist',0);}
   else{const type={allAttackUp:'attackUp',allDefenseUp:'defenseUp',allAttackDown:'attackDown',allDefenseDown:'defenseDown',allShield:'shield',allRegen:'regen'}[e]||e;
    const s=state(battle,t);
    if(negatives.includes(type)&&active(battle,t,'statusWard',turn)){delete s.statusWard;emit('wardBlocked',0);continue;}
    if(['sleep','stun'].includes(type)){if(t.boss||active(battle,t,'controlImmune',turn)||active(battle,t,'sleep',turn)||active(battle,t,'stun',turn)||Math.random()>=p*k){emit('resist',0);continue;}status(battle,t,type,1,turn,1);emit(type,1);continue;}
    if(type==='statusWard'){if(ok||Math.random()<.5){status(battle,t,type,1,turn,ability.duration);emit(type,1)}else emit('resist',0);continue;}
    if(type==='silence'&&!ok&&Math.random()>=.5){emit('resist',0);continue;}
    if(type==='silence'){status(battle,t,type,1,turn,ok?ability.duration:1);emit(type,1);continue;}
    const cap={attackUp:.4,defenseUp:.5,attackDown:.35,defenseDown:.25,shield:.4,regen:.15,poison:.1,burn:.1,guard:.4,blind:.25}[type];let value=clamp(p,0,cap)*k;
    if(ability.scale==='attack'&&['shield','regen','poison','burn'].includes(type)){value=Math.min(maximum(t)*cap,attack*p)*k;if(type!=='shield')value/=maximum(t);}
    else if(type==='shield')value=Math.round(maximum(t)*value);
    status(battle,t,type,value,turn,ability.duration);emit(type,value);}
  }return events;
 }
 function tick(battle,m,turn){const events=[],s=state(battle,m);if(m.hp>0&&!m.caught){for(const type of ['poison','burn']){const v=s[type]?.applied===turn?0:active(battle,m,type,turn);if(v){const n=hurt(m,Math.max(1,Math.round(maximum(m)*v)),battle,turn,false);events.push({target:m,kind:type,value:n});}}const regen=s.regen?.applied===turn?0:active(battle,m,'regen',turn);if(regen&&m.hp>0)events.push({target:m,kind:'heal',value:heal(m,maximum(m)*regen)});}for(const [type,x]of Object.entries(s))if(x.until<=turn)delete s[type];return events;}
 function skip(battle,m,turn){const s=state(battle,m);for(const type of ['sleep','stun'])if(active(battle,m,type,turn)){delete s[type];s.controlImmune={value:1,until:turn+2};return type;}return null;}
 return {supported,active,apply,hurt,tick,cleanse,skip};
})();
if(typeof module!=='undefined')module.exports=SkillEffects;
