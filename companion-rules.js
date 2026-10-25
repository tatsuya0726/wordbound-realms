/* Pure collection rules. Inventory and equipped UIDs are deliberately separate. */
const CompanionRules=(()=>{
 const starter='seedpod_mouse';
 const catalog=typeof SKILL_CATALOG!=='undefined'?SKILL_CATALOG:typeof require!=='undefined'?require('./skill-catalog'):{};
 const assignments=typeof SPECIES_SKILLS!=='undefined'?SPECIES_SKILLS:typeof require!=='undefined'?require('./species-skills'):{};
 const plusValue=m=>Number.isSafeInteger(m.plus)&&m.plus>=0?m.plus:0;
 const nextPlus=(a,b)=>{const n=Math.max(plusValue(a),plusValue(b));if(n>=Number.MAX_SAFE_INTEGER)throw Error('Plus value exceeds safe numeric range');return n+1};
 const baseBonus=(m,species)=>species[m.id].power*plusValue(m)*.05;
 const strength=(m,species)=>species[m.id].power+baseBonus(m,species)+m.lv*.6;
 const rarity=s=>s.rarity||({2:1,3:4,4:4,6:7,8:10}[s.power]||1);
 function partyPower(team,species,attack){return Math.min(attack*.65,team.reduce((n,m)=>n+species[m.id].power+m.lv*.6,0))+team.reduce((n,m)=>n+baseBonus(m,species),0)}

 function stats(m,species){const power=species[m.id].power,k=1+plusValue(m)*.05,l=m.lv-1;return {hp:Math.floor((24+power*4)*k)+l*4,mp:Math.floor((10+power*2)*k)+l*2,attack:(6+power)*k+l*1.2,defense:(2+power/2)*k+l*.6}}
 function health(m,species){const st=stats(m,species);m.maxMp=st.mp;m.mp=Number.isFinite(m.mp)?Math.max(0,Math.min(st.mp,Math.floor(m.mp))):st.mp;m.inherited=Array.isArray(m.inherited)?[...new Set(m.inherited.filter(id=>skill(id,species)))]:[];if(m.inherited.length>5)throw Error('Inherited skill plan exceeds five slots');m.maxHp=st.hp;m.hp=Number.isFinite(m.hp)?Math.max(0,Math.min(st.hp,Math.floor(m.hp))):st.hp;return m}
 function heal(m,amount,species,revive=false){health(m,species);if(m.hp===0&&!revive)return 0;const before=m.hp;m.hp=Math.min(m.maxHp,m.hp+amount);return m.hp-before}
 function restore(c,species){for(const m of c.owned){health(m,species);m.hp=m.maxHp;m.mp=m.maxMp}}

 // Species-specific identities, with family effect vocabulary. No new art or species IDs.
 const patterns={
 beast:[['牙のことば','damage',3,1.4],['勇気の咆哮','attackUp',4,.3],['生命の鼓動','drain',6,1.5]],
 bird:[['風の便り','damage',3,1.3],['羽根の守り','defenseUp',4,.35],['嵐の歌','allDamage',7,1.1]],
 insect:[['糸の呪文','attackDown',3,.3],['殻の結界','defenseUp',4,.4],['群れのささやき','allDamage',7,1.15]],
 plant:[['芽吹き','heal',3,1.5],['根の槍','damage',4,1.6],['花園の歌','allHeal',7,1.1]],
 dragon:[['火花の呪文','damage',4,1.6],['竜鱗の結界','defenseUp',4,.4],['竜の息吹','allDamage',8,1.35]],
 undead:[['魂の灯火','drain',4,1.15],['骨の結界','defenseUp',4,.4],['静かな夜の歌','attackDown',6,.55]],
 spirit:[['光の灯','heal',3,1.4],['まどろみの霧','attackDown',4,.4],['魂のこだま','drain',7,1.6]],
 reptile:[['水紋の牙','damage',3,1.4],['甲羅の守り','defenseUp',4,.4],['冷たいまなざし','attackDown',5,.45]],
 aquatic:[['潮の祈り','heal',3,1.4],['波の歌','allDamage',5,.9],['海の恵み','allHeal',7,1.2]]};
 const effectNames={damage:'敵1体に攻撃',allDamage:'敵全体に攻撃',heal:'味方1体のHP回復（蘇生なし）',allHeal:'生存味方全員のHP回復',drain:'敵1体に攻撃・与ダメージの半分を自身回復',attackUp:'味方1体の攻撃強化・3ラウンド',defenseUp:'味方1体の防御強化・3ラウンド',attackDown:'敵1体の攻撃低下・3ラウンド'};
 function innate(id,species){if(assignments[id])return assignments[id].map((key,i)=>({...skill(key,species),source:id,level:Math.max(catalog[key].level,[1,5,10][i]),inheritLevel:Math.max(catalog[key].inheritLevel,Math.max(catalog[key].level,[1,5,10][i])+2)}));return [0,1,2].map(i=>skill('native:'+id+':'+i,species))}
 function skill(id,species){if(catalog[id])return {...catalog[id],source:null};return legacySkill(id,species)}
 function legacySkill(id,species){if(typeof id!=='string')return null;const match=/^native:([a-z0-9_]+):([0-2])$/.exec(id);if(!match||!species[match[1]])return null;const source=match[1],i=Number(match[2]),s=species[source],row=(patterns[s.family]||patterns.beast)[i];return {id,source,name:s.name+'・'+row[0],effect:row[1],cost:row[2],power:row[3],level:[1,5,10][i],inheritLevel:[3,7,12][i],description:effectNames[row[1]]}}

 const seriesKey=s=>s?.series||s?.id;
 function evolve(s,lv,inherited=false){if(!s?.series)return s;const gate=inherited?'inheritLevel':'level';const stages=Object.values(catalog).filter(x=>x.series===s.series&&x.stage>=s.stage&&lv>=Math.max(s[gate],x[gate])).sort((a,b)=>b.stage-a.stage);const stage=stages[0];return stage?{...s,...stage,source:s.source,planId:s.planId||s.id,level:Math.max(s.level,stage.level),inheritLevel:Math.max(s.inheritLevel,stage.inheritLevel)}:s;}
 function individualInnate(m,species){return innate(m.id,species).map(s=>evolve(s,m.lv));}
 function planned(m,species){return (m.inherited||[]).map(id=>{const s=skill(id,species);if(!s)return null;const saved=m.inheritedLevels?.[id];return evolve({...s,source:species[m.inheritedSources?.[id]]?m.inheritedSources[id]:s.source,inheritLevel:Math.max(s.inheritLevel,Number.isInteger(saved)&&saved<=101?saved:0)},m.lv,true);}).filter(Boolean)}
 function known(m,species){const found=new Map();for(const s of [...individualInnate(m,species).filter(s=>m.lv>=s.level),...planned(m,species).filter(s=>m.lv>=s.inheritLevel)]){const key=seriesKey(s),old=found.get(key);if(!old||(s.stage||0)>(old.stage||0))found.set(key,s);}return [...found.values()]}
 function inheritOptions(a,b,species){const found=new Map();for(const s of [...known(a,species),...known(b,species)]){const old=found.get(seriesKey(s));found.set(seriesKey(s),{...(old&&(old.stage||0)>(s.stage||0)?old:s),inheritLevel:Math.max(s.inheritLevel,old?.inheritLevel||0)});}return [...found.values()]}
 function spend(m,ability,species){health(m,species);const canonical=ability&&known(m,species).find(s=>s.id===ability.id);if(m.hp<=0||!canonical||m.mp<canonical.cost)return false;m.mp-=canonical.cost;return true}

 function initial(){return {version:1,nextUid:2,owned:[{uid:'c1',id:starter,lv:1,xp:0,plus:0}],team:['c1'],seen:[starter],breeds:0}}
 function validate(c,species){
  if(!c||c.version!==1||!Array.isArray(c.owned)||!Array.isArray(c.team)||!Array.isArray(c.seen)||!Number.isSafeInteger(c.nextUid)||c.nextUid<1)throw Error('仲間データの形式を確認できません');
  c.registered=Array.isArray(c.registered)?[...new Set(c.registered.filter(id=>species[id]))]:[...new Set(c.owned.map(m=>m.id))];
  const ids=new Set();let max=0;
  for(const m of c.owned){if(!m||!species[m.id]||!/^c[1-9]\d*$/.test(m.uid)||ids.has(m.uid)||!Number.isInteger(m.lv)||m.lv<1||m.lv>99||!Number.isFinite(m.xp)||m.xp<0)throw Error('仲間の個体データが不正です');m.plus=plusValue(m);health(m,species);ids.add(m.uid);max=Math.max(max,Number(m.uid.slice(1)))}
  if(c.nextUid<=max||c.team.length>3||new Set(c.team).size!==c.team.length||c.team.some(id=>!ids.has(id))||c.seen.some(id=>!species[id]))throw Error('仲間の編成データが不正です');return c;
 }
 function add(c,id,species){if(!species[id])throw Error('未知の種族');const m={uid:'c'+c.nextUid++,id,lv:1,xp:0,plus:0};health(m,species);c.owned.push(m);if(!c.seen.includes(id))c.seen.push(id);return m}
 function recruit(c,id,species){if(species[id]?.retired)throw Error("この種は新規加入対象外です");if(!species[id]||species[id].fusionOnly||rarity(species[id])>=7)throw Error("この種は配合限定です");validate(c,species);const fresh=!c.registered.includes(id);add(c,id,species);if(fresh)c.registered.push(id);return fresh}
 function equip(c,uid){if(!c.owned.some(m=>m.uid===uid))throw Error('個体が見つかりません');if(c.team.includes(uid))c.team=c.team.filter(x=>x!==uid);else{if(c.team.length>=3)throw Error('同行は3体まで。先に1体を外してください');c.team.push(uid)}}
 /* A recipe parent is a species id, or '@family' meaning any species of that family (species[id].family).
    Recipes naming both parents exactly win over family recipes. */
 function fits(spec,id,species){return spec===id||spec[0]==='@'&&!!species&&species[id]?.family===spec.slice(1)}
 function recipe(c,a,b,recipes,species){if(a===b)return null;const p=c.owned.find(m=>m.uid===a),q=c.owned.find(m=>m.uid===b);if(!p||!q)return null;
  const ok=r=>!species[r.child]?.retired&&(fits(r.parents[0],p.id,species)&&fits(r.parents[1],q.id,species)||fits(r.parents[1],p.id,species)&&fits(r.parents[0],q.id,species));
  return recipes.find(r=>!r.parents.some(s=>s[0]==='@')&&ok(r))||recipes.find(ok)||null}
 function breed(c,a,b,recipes,species,inherited=[]){const r=recipe(c,a,b,recipes,species);if(!r)throw Error('この2体の配合はできません');const pa=c.owned.find(m=>m.uid===a),pb=c.owned.find(m=>m.uid===b),allowed=inheritOptions(pa,pb,species).map(s=>s.id);if(!Array.isArray(inherited)||inherited.length>5||new Set(inherited.map(id=>seriesKey(skill(id,species)))).size!==inherited.length||inherited.some(id=>!allowed.includes(id)||innate(r.child,species).some(k=>seriesKey(k)===seriesKey(skill(id,species)))))throw Error('Invalid inherited skills');const plus=nextPlus(c.owned.find(m=>m.uid===a),c.owned.find(m=>m.uid===b));const equipped=c.team.includes(a)||c.team.includes(b);c.owned=c.owned.filter(m=>m.uid!==a&&m.uid!==b);c.team=c.team.filter(id=>id!==a&&id!==b);const child=add(c,r.child,species);child.plus=plus;child.inherited=[...inherited];child.inheritedSources=Object.fromEntries(inherited.map(id=>[id,inheritOptions(pa,pb,species).find(s=>s.id===id)?.source||pa.id]));child.inheritedLevels=Object.fromEntries(inherited.map(id=>[id,Math.max(...inheritOptions(pa,pb,species).filter(s=>s.id===id).map(s=>s.inheritLevel))]));health(child,species);child.hp=child.maxHp;child.mp=child.maxMp;if(equipped&&c.team.length<3)c.team.push(child.uid);c.breeds=(c.breeds||0)+1;return child}
 function rate(fed,hp,max){return fed>0?Math.min(90,25+fed*15+Math.floor((1-hp/max)*35)):0}
 function effect(base,ok){return Math.max(1,Math.round(base*(ok?1:.5)))}
 function gain(c,xp){for(const m of c.owned.filter(m=>c.team.includes(m.uid))){m.xp+=xp;while(m.lv<99&&m.xp>=10*m.lv*m.lv)m.lv++}}
 return {initial,validate,add,equip,recipe,breed,rate,effect,gain,fits,plusValue,nextPlus,baseBonus,strength,rarity,partyPower,recruit,stats,health,heal,restore,innate,skill,planned,known,inheritOptions,spend,evolve,individualInnate,seriesKey};
})();
if(typeof module!=='undefined')module.exports=CompanionRules;