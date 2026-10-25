/* Pure collection rules. Inventory and equipped UIDs are deliberately separate. */
const CompanionRules=(()=>{
 const starter='seedpod_mouse';
 const plusValue=m=>Number.isSafeInteger(m.plus)&&m.plus>=0?m.plus:0;
 const nextPlus=(a,b)=>{const n=Math.max(plusValue(a),plusValue(b));if(n>=Number.MAX_SAFE_INTEGER)throw Error('Plus value exceeds safe numeric range');return n+1};
 const baseBonus=(m,species)=>species[m.id].power*plusValue(m)*.05;
 const strength=(m,species)=>species[m.id].power+baseBonus(m,species)+m.lv*.6;
 const rarity=s=>s.rarity||({2:1,3:4,4:4,6:7,8:10}[s.power]||1);
 function partyPower(team,species,attack){return Math.min(attack*.65,team.reduce((n,m)=>n+species[m.id].power+m.lv*.6,0))+team.reduce((n,m)=>n+baseBonus(m,species),0)}

 function initial(){return {version:1,nextUid:2,owned:[{uid:'c1',id:starter,lv:1,xp:0,plus:0}],team:['c1'],seen:[starter],breeds:0}}
 function validate(c,species){
  if(!c||c.version!==1||!Array.isArray(c.owned)||!Array.isArray(c.team)||!Array.isArray(c.seen)||!Number.isSafeInteger(c.nextUid)||c.nextUid<1)throw Error('仲間データの形式を確認できません');
  c.registered=Array.isArray(c.registered)?[...new Set(c.registered.filter(id=>species[id]))]:[...new Set(c.owned.map(m=>m.id))];
  const ids=new Set();let max=0;
  for(const m of c.owned){if(!m||!species[m.id]||!/^c[1-9]\d*$/.test(m.uid)||ids.has(m.uid)||!Number.isInteger(m.lv)||m.lv<1||m.lv>99||!Number.isFinite(m.xp)||m.xp<0)throw Error('仲間の個体データが不正です');m.plus=plusValue(m);ids.add(m.uid);max=Math.max(max,Number(m.uid.slice(1)))}
  if(c.nextUid<=max||c.team.length>3||new Set(c.team).size!==c.team.length||c.team.some(id=>!ids.has(id))||c.seen.some(id=>!species[id]))throw Error('仲間の編成データが不正です');return c;
 }
 function add(c,id,species){if(!species[id])throw Error('未知の種族');const m={uid:'c'+c.nextUid++,id,lv:1,xp:0,plus:0};c.owned.push(m);if(!c.seen.includes(id))c.seen.push(id);return m}
 function recruit(c,id,species){validate(c,species);const fresh=!c.registered.includes(id);add(c,id,species);if(fresh)c.registered.push(id);return fresh}
 function equip(c,uid){if(!c.owned.some(m=>m.uid===uid))throw Error('個体が見つかりません');if(c.team.includes(uid))c.team=c.team.filter(x=>x!==uid);else{if(c.team.length>=3)throw Error('同行は3体まで。先に1体を外してください');c.team.push(uid)}}
 /* A recipe parent is a species id, or '@family' meaning any species of that family (species[id].family).
    Recipes naming both parents exactly win over family recipes. */
 function fits(spec,id,species){return spec===id||spec[0]==='@'&&!!species&&species[id]?.family===spec.slice(1)}
 function recipe(c,a,b,recipes,species){if(a===b)return null;const p=c.owned.find(m=>m.uid===a),q=c.owned.find(m=>m.uid===b);if(!p||!q)return null;
  const ok=r=>fits(r.parents[0],p.id,species)&&fits(r.parents[1],q.id,species)||fits(r.parents[1],p.id,species)&&fits(r.parents[0],q.id,species);
  return recipes.find(r=>!r.parents.some(s=>s[0]==='@')&&ok(r))||recipes.find(ok)||null}
 function breed(c,a,b,recipes,species){const r=recipe(c,a,b,recipes,species);if(!r)throw Error('この2体の配合はできません');const plus=nextPlus(c.owned.find(m=>m.uid===a),c.owned.find(m=>m.uid===b));const equipped=c.team.includes(a)||c.team.includes(b);c.owned=c.owned.filter(m=>m.uid!==a&&m.uid!==b);c.team=c.team.filter(id=>id!==a&&id!==b);const child=add(c,r.child,species);child.plus=plus;if(equipped&&c.team.length<3)c.team.push(child.uid);c.breeds=(c.breeds||0)+1;return child}
 function rate(fed,hp,max){return fed>0?Math.min(90,25+fed*15+Math.floor((1-hp/max)*35)):0}
 function effect(base,ok){return Math.max(1,Math.round(base*(ok?1:.5)))}
 function gain(c,xp){for(const m of c.owned.filter(m=>c.team.includes(m.uid))){m.xp+=xp;while(m.lv<99&&m.xp>=10*m.lv*m.lv)m.lv++}}
 return {initial,validate,add,equip,recipe,breed,rate,effect,gain,fits,plusValue,nextPlus,baseBonus,strength,rarity,partyPower,recruit};
})();
if(typeof module!=='undefined')module.exports=CompanionRules;