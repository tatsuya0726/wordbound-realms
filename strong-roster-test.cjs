// Stronger roster, 魔王系 and hidden elemental resistances (strong-roster.js, resistances.js).
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const c={console};vm.createContext(c);
vm.runInContext(['companion-data.js','companion-more.js','companion-rare.js','undead-expansion.js','rarity-policy.js','roster-policy.js','skill-catalog.js','species-skills.js','rarity-curve.js','strong-roster.js','pixel-art.js','companion-rules.js','look-weakness.js','resistances.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+';this.D=COMPANION_DATA;this.R=ElementResist;this.CR=CompanionRules;this.LW=LOOK_WEAKNESS;this.L={WEAK_RETIRED,STRONG_SPECIES,DEMON_LORDS,DEMON_BOSSES,REPTILE_RETIRED,RARITY_ORDER,MISSING:RARITY_MISSING};',c);
const {D,R,CR,L,LW}=c,SP=D.species,active=Object.keys(SP).filter(id=>!SP[id].retired),checks=[];
for(const id of L.WEAK_RETIRED)assert.ok(SP[id].retired,id);
assert.ok(D.recipes.every(r=>[...r.parents,r.child].every(s=>s[0]==='@'||!SP[s].retired)));checks.push('16 weak-looking species retired from the wild and breeding');
for(const [id,,rarity,family] of L.STRONG_SPECIES){assert.ok(fs.existsSync(path.join('assets/monsters',id+'.webp')),id);assert.equal(SP[id].family,family);assert.equal(!!SP[id].fusionOnly,SP[id].rarity>=7);assert.equal(CR.innate(id,SP).length,3)}
checks.push('20 strong-looking species with art and three native skills');
for(const id of L.DEMON_LORDS){const s=SP[id];assert.equal(s.family,'demon');assert.equal(s.rarity,10);assert.ok(s.fusionOnly);
 const rs=D.recipes.filter(r=>r.child===id);assert.ok(rs.length>=2,id);assert.ok(rs.every(r=>r.parents.every(p=>p[0]==='@'||SP[p].rarity>=10)),id)}
checks.push('13 demon lords: ★10, not scoutable, bred only from ★10 parents (two ways each)');
assert.deepEqual(active.filter(id=>!D.recipes.some(r=>r.child===id)),[]);checks.push('Every active species has a breeding recipe');
const near=(a,b)=>Math.abs(a-b)<1e-9;
assert.ok(near(R.forSpecies('lotus_root_sproutling','fire'),1.5));                       // ★1 plant: fire ×1.5
assert.ok(near(R.forSpecies('cobalt_tusk_behemoth','thunder'),1.2));                       // ★10: still weak, ×1.2
assert.ok(R.forSpecies('pumice_pufferfish','thunder')>1.3);  // ★1 aquatic: thunder hurts
assert.ok(R.forSpecies('lotus_root_sproutling','ice')<1);                                // plants resist ice
for(const el of ['fire','ice','thunder','wind','dark'])assert.ok(R.forSpecies(L.DEMON_LORDS[0],el)<=.85);   // no weakness
assert.ok(R.forSpecies(L.DEMON_LORDS[0],'holy')>1);                                         // but 聖 gets through
assert.equal(R.multiplier({id:'lotus_root_sproutling'},{id:'quick_claw'}),1);                // physical moves have no element
assert.equal(R.element({id:'ember'}),'fire');assert.equal(R.element({command:'atk'}),'holy');assert.equal(R.element({id:'ember_tier3'}),'fire');
assert.deepEqual(Object.values(R.ELEMENTS),['火','氷','雷','風','闇','聖']);assert.ok(Object.values(R.SKILL_ELEMENT).every(e=>R.ELEMENTS[e]));
// Weaknesses come from each monster's look: every active non-demon monster has an entry with at least one weakness,
// no element is both weak and resisted, and every element is somebody's weakness (水 included).
const nonDemon=active.filter(id=>SP[id].family!=='demon');for(const id of nonDemon){const v=LW[SP[id].name];assert.ok(v&&/^[fwtadh]+\/[fwtadh]*$/.test(v),SP[id].name);const t=R.traits(id);assert.ok(t.weak.length>=1);assert.ok(!t.weak.some(e=>t.resist.includes(e)),SP[id].name)}
assert.equal(Object.keys(LW).length,nonDemon.length);
const count={};for(const id of nonDemon)for(const e of R.traits(id).weak)count[e]=(count[e]||0)+1;for(const e of Object.keys(R.ELEMENTS))assert.ok(count[e]>=10,e+' '+count[e]);
assert.ok(R.forSpecies('volcanic_gryphon','ice')>1.15&&R.forSpecies('volcanic_gryphon','fire')<.85);
assert.match(R.weakHtml('volcanic_gryphon'),/el-ice/);assert.equal(R.weakHtml(L.DEMON_LORDS[0]),'なし（聖が少し効く）');
checks.push('Weakness by look for all '+nonDemon.length+' monsters ('+Object.entries(count).map(([e,n])=>R.ELEMENTS[e]+n).join(' ')+'), shown in the bestiary');
assert.match(R.tag({id:'spark_tier2'}),/el-thunder.*雷/);assert.equal(R.tag({id:'quick_claw',effect:'damage'}),'<span class="el el-none" title="無属性">無</span>');assert.equal(R.tag({id:'sprout_heal',effect:'heal'}),'');
checks.push('Six elements 火氷雷風闇聖 shown on skills; a weakness hits ×1.5 at ★1 → ×1.2 at ★10; demon lords have no weakness but 聖 gets through');
// 爬虫類系 merged into ドラゴン系; weak-looking reptiles retired.
assert.equal(active.filter(id=>SP[id].family==='reptile').length,0);for(const id of L.REPTILE_RETIRED)assert.ok(SP[id].retired,id);
assert.ok(active.filter(id=>SP[id].family==='dragon').length<=40);assert.ok(D.recipes.every(r=>!r.parents.includes('@reptile')));
checks.push('Reptiles merged into dragons ('+active.filter(id=>SP[id].family==='dragon').length+'), weak-looking ones retired');
// Smooth rarity: every family climbs ★1..★10 in order of how strong the art looks.
assert.deepEqual([...L.MISSING],[]);const per={};for(const id of active)per[SP[id].rarity]=(per[SP[id].rarity]||0)+1;
for(let r=1;r<=10;r++)assert.ok(per[r]>=18,'★'+r+' '+per[r]);
for(const [f,names] of Object.entries(L.RARITY_ORDER)){const rs=names.map(n=>SP[active.find(id=>SP[id].name===n)].rarity);assert.equal(rs[0],1,f);assert.equal(rs.at(-1),10,f);for(let i=1;i<rs.length;i++){assert.ok(rs[i]>=rs[i-1]&&rs[i]-rs[i-1]<=1,f+' '+names[i])}}
assert.ok(active.every(id=>SP[id].family==='demon'||Object.values(L.RARITY_ORDER).flat().includes(SP[id].name)));
for(const id of active)assert.equal(!!SP[id].fusionOnly,SP[id].rarity>=7,id);
checks.push('Rarity spread smoothly ★1..★10 in every family ('+Object.values(per).join('/')+'), ★7+ breeding-only');
for(const r of D.recipes)for(const p of r.parents)if(p[0]!=='@')assert.ok(SP[p].rarity<=SP[r.child].rarity,p+' > '+r.child);
checks.push('No breeding parent outranks its child');
for(const [id,s] of Object.entries(SP))assert.ok(s.img==='assets/monsters/'+id+'.webp'&&fs.existsSync(s.img),id);checks.push('Every monster ('+Object.keys(SP).length+') uses its pixel-art image');
assert.equal(L.DEMON_BOSSES.length,3);checks.push('Three demon lords reign as post-clear bosses in later warp worlds');
console.log(JSON.stringify({checks},null,1));
