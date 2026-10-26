/* Skill variety (2026-10-26): multi-hit skills and gamble skills that rarely land but crit when they do.
   - hits [min,max]: strikes a random number of times (each strike shows its own number).
   - accuracy + crit: a single strike that lands only accuracy of the time (less after a wrong answer) and then
     deals crit × the damage as a 会心の一撃. Mechanics live in skill-effects.js.
   About half of the monsters swap one native skill (Lv5 or Lv10 slot) for one of these, chosen by family and
   rarity, so the catalog stays the same for saves (skill ids are stable; old ones remain learnable by inheritance).
   Loaded after strong-roster.js / pixel-art.js and before companion-rules.js. */
const VARIETY_SKILLS=[
 // id, name, category, cost, level, effect part, element, tags, description
 ['rapid_peck','れんぞくつつき','連撃',4,5,{power:.6,hits:[2,3]},null,['bird','wing'],'2〜3回攻撃（1回 攻撃値×0.6）'],
 ['frenzy_slash','みだれひっかき','連撃',5,5,{power:.5,hits:[2,4]},null,['claw','beast'],'2〜4回攻撃（1回 攻撃値×0.5）'],
 ['thorn_volley','とげの連射','連撃',5,5,{power:.5,hits:[2,4]},null,['plant','thorn'],'2〜4回攻撃（1回 攻撃値×0.5）'],
 ['ember_volley','ひばなの連弾','連撃',6,10,{power:.55,hits:[2,4]},'fire',['fire'],'火・2〜4回攻撃（1回 攻撃値×0.55）'],
 ['storm_blades','かまいたち乱舞','連撃',8,10,{power:.6,hits:[3,4]},'wind',['wind','wing'],'風・3〜4回攻撃（1回 攻撃値×0.6）'],
 ['meteor_flurry','流星れんだ','連撃',9,10,{power:.55,hits:[3,5]},'holy',['star','light'],'聖・3〜5回攻撃（1回 攻撃値×0.55）'],
 ['all_in_strike','渾身の一撃','一か八か',6,10,{power:1,accuracy:.5,crit:3.2},null,['beast','dragon'],'命中50%。当たれば会心で攻撃値×3.2'],
 ['skull_crusher','一角必殺','一か八か',8,10,{power:1,accuracy:.4,crit:4},null,['horn','beast'],'命中40%。当たれば会心で攻撃値×4'],
 ['shadow_assassin','闇討ち','一か八か',7,10,{power:1,accuracy:.55,crit:3},'dark',['shadow'],'闇・命中55%。当たれば会心で攻撃値×3'],
 ['glacier_gamble','氷河のひと突き','一か八か',8,10,{power:1,accuracy:.5,crit:3.4},'ice',['ice'],'氷・命中50%。当たれば会心で攻撃値×3.4']];
for(const [id,name,category,cost,level,part,element,themeTags,description] of VARIETY_SKILLS)
 SKILL_CATALOG[id]={id,name,category,target:'enemy',cost,level,inheritLevel:level+2,effects:[{effect:'damage',...part}],themeTags,description,effect:'damage',...part,...(element?{element}:{})};

// Which monsters learn them: [family, rarity range, slot (1 = Lv5, 2 = Lv10), skill].
const VARIETY_RULES=[['bird',[1,5],1,'rapid_peck'],['bird',[6,10],2,'storm_blades'],['beast',[1,5],1,'frenzy_slash'],['beast',[6,10],2,'skull_crusher'],
 ['insect',[1,6],1,'frenzy_slash'],['insect',[7,10],2,'all_in_strike'],['plant',[1,10],1,'thorn_volley'],['dragon',[1,4],1,'ember_volley'],['dragon',[5,10],2,'all_in_strike'],
 ['undead',[1,10],2,'shadow_assassin'],['demon',[1,10],2,'shadow_assassin'],['spirit',[6,10],2,'meteor_flurry'],['aquatic',[5,10],2,'glacier_gamble']];
(function assignVarietySkills(){const SP=COMPANION_DATA.species,h=s=>{let x=2166136261;for(const c of s)x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0};
 for(const [id,s] of Object.entries(SP)){const set=SPECIES_SKILLS[id];if(!Array.isArray(set)||set.length!==3||s.retired||h(id+':variety')%100>=55)continue;
  const r=s.rarity||1,rule=VARIETY_RULES.find(([f,[a,b]])=>f===s.family&&r>=a&&r<=b);if(!rule||set.includes(rule[3]))continue;
  const next=[...set];next[rule[2]]=rule[3];SPECIES_SKILLS[id]=next}})();
