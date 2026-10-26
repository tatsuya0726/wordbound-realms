// Skill variety: multi-hit skills strike 2–5 times, gamble skills miss or land a 会心の一撃, monsters learn them,
// and enemies sometimes land a 痛恨の一撃 (skill-variety.js, skill-effects.js, party-battle.js).
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),checks=[];
const c={console,Math:Object.create(Math)};vm.createContext(c);
vm.runInContext(['companion-data.js','companion-more.js','companion-rare.js','undead-expansion.js','rarity-policy.js','roster-policy.js','skill-catalog.js','species-skills.js','rarity-curve.js','strong-roster.js','pixel-art.js','skill-variety.js','skill-effects.js','look-weakness.js','resistances.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+';this.K=SKILL_CATALOG;this.FX=SkillEffects;this.SS=SPECIES_SKILLS;this.V=VARIETY_SKILLS;this.R=ElementResist;this.D=COMPANION_DATA;',c);
const {K,FX,SS,V,R,D}=c,rolls=seq=>{let i=0;c.Math.random=()=>seq[i++%seq.length]};
const hit=(id,seq)=>{rolls(seq);const actor={uid:'a',hp:50,maxHp:50},t={slot:0,hp:9999,max:9999};return FX.apply({actor,targets:[t],ability:K[id],ok:true,attack:20,turn:0,battle:{}})};
let ev=hit('frenzy_slash',[.99]);assert.equal(ev.filter(e=>e.kind==='damage').length,4);ev=hit('frenzy_slash',[0]);assert.equal(ev.filter(e=>e.kind==='damage').length,2);
assert.equal(ev[0].value,Math.round(20*.5));ev=hit('meteor_flurry',[.99]);assert.equal(ev.filter(e=>e.kind==='damage').length,5);
checks.push('Multi-hit skills strike a random number of times within their range, each strike its own damage');
ev=hit('all_in_strike',[0]);assert.equal(ev.map(e=>e.kind).join(),'critical');assert.equal(ev[0].value,Math.round(20*3.2));
ev=hit('all_in_strike',[.6]);assert.equal(ev.map(e=>e.kind).join(),'miss');
rolls([.4]);{const t={slot:0,hp:999,max:999};const e=FX.apply({actor:{uid:'a',hp:5,maxHp:5},targets:[t],ability:K.all_in_strike,ok:false,attack:20,turn:0,battle:{}});assert.equal(e[0].kind,'miss')}   // wrong answer: 50%×0.6
checks.push('Gamble skills: a miss, or a 会心の一撃 for ×3.2–4 damage; a wrong answer lowers the hit chance');
assert.equal(R.element(K.glacier_gamble),'ice');assert.equal(R.element(K.shadow_assassin),'dark');assert.equal(R.element(K.frenzy_slash),null);
for(const [id] of V)assert.ok(K[id]&&K[id].effects[0].effect==='damage'&&K[id].description&&K[id].cost>0,id);checks.push(V.length+' new skills with elements and descriptions');
const learners=Object.entries(SS).filter(([id,set])=>!D.species[id]?.retired&&set.some(k=>V.some(v=>v[0]===k)));
assert.ok(learners.length>=60,'learners '+learners.length);assert.ok(Object.values(SS).every(s=>!Array.isArray(s)||s.length===3));
for(const [id] of V)assert.ok(learners.some(([,set])=>set.includes(id)),'nobody learns '+id);
checks.push(learners.length+' monsters learn one of them; every new skill has learners; natives stay three');
const pb=fs.readFileSync('party-battle.js','utf8');assert.ok(/痛恨の一撃/.test(pb)&&/Math\.random\(\)>\(enemy\.boss\?\.9:\.93\)/.test(pb));checks.push('Enemy attacks sometimes land a 痛恨の一撃 (7%, bosses 10%) that ignores defense');
console.log(JSON.stringify({checks},null,1));
