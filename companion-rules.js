/* Pure collection rules. Inventory and equipped UIDs are deliberately separate. */
const CompanionRules=(()=>{
 const starter='seedpod_mouse';
 function initial(){return {version:1,nextUid:2,owned:[{uid:'c1',id:starter,lv:1,xp:0}],team:['c1'],seen:[starter],breeds:0}}
 function validate(c,species){
  if(!c||c.version!==1||!Array.isArray(c.owned)||!Array.isArray(c.team)||!Array.isArray(c.seen)||!Number.isSafeInteger(c.nextUid)||c.nextUid<1)throw Error('仲間データの形式を確認できません');
  const ids=new Set();let max=0;
  for(const m of c.owned){if(!m||!species[m.id]||!/^c[1-9]\d*$/.test(m.uid)||ids.has(m.uid)||!Number.isInteger(m.lv)||m.lv<1||m.lv>99||!Number.isFinite(m.xp)||m.xp<0)throw Error('仲間の個体データが不正です');ids.add(m.uid);max=Math.max(max,Number(m.uid.slice(1)))}
  if(c.nextUid<=max||c.team.length>3||new Set(c.team).size!==c.team.length||c.team.some(id=>!ids.has(id))||c.seen.some(id=>!species[id]))throw Error('仲間の編成データが不正です');return c;
 }
 function add(c,id,species){if(!species[id])throw Error('未知の種族');const m={uid:'c'+c.nextUid++,id,lv:1,xp:0};c.owned.push(m);if(!c.seen.includes(id))c.seen.push(id);return m}
 function equip(c,uid){if(!c.owned.some(m=>m.uid===uid))throw Error('個体が見つかりません');if(c.team.includes(uid))c.team=c.team.filter(x=>x!==uid);else{if(c.team.length>=3)throw Error('同行は3体まで。先に1体を外してください');c.team.push(uid)}}
 function recipe(c,a,b,recipes){if(a===b)return null;const p=c.owned.find(m=>m.uid===a),q=c.owned.find(m=>m.uid===b);if(!p||!q)return null;return recipes.find(r=>r.parents[0]===p.id&&r.parents[1]===q.id||r.parents[1]===p.id&&r.parents[0]===q.id)||null}
 function breed(c,a,b,recipes,species){const r=recipe(c,a,b,recipes);if(!r)throw Error('この2体の配合はできません');const equipped=c.team.includes(a)||c.team.includes(b);c.owned=c.owned.filter(m=>m.uid!==a&&m.uid!==b);c.team=c.team.filter(id=>id!==a&&id!==b);const child=add(c,r.child,species);if(equipped&&c.team.length<3)c.team.push(child.uid);c.breeds=(c.breeds||0)+1;return child}
 function rate(fed,hp,max){return fed>0?Math.min(90,25+fed*15+Math.floor((1-hp/max)*35)):0}
 function effect(base,ok){return Math.max(1,Math.round(base*(ok?1:.5)))}
 function gain(c,xp){for(const m of c.owned.filter(m=>c.team.includes(m.uid))){m.xp+=xp;while(m.lv<99&&m.xp>=10*m.lv*m.lv)m.lv++}}
 return {initial,validate,add,equip,recipe,breed,rate,effect,gain};
})();
if(typeof module!=='undefined')module.exports=CompanionRules;