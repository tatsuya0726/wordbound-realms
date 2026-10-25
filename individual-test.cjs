const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = __dirname;
const CR = require('./companion-rules.js');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'companion-data.js'),'utf8') + '\n' + fs.readFileSync(path.join(root,'companion-more.js'),'utf8') + '\n' + fs.readFileSync(path.join(root,'companion-rare.js'),'utf8') + '\n' + fs.readFileSync(path.join(root,'rarity-policy.js'),'utf8') + '\n' + fs.readFileSync(path.join(root,'roster-policy.js'),'utf8') + '\nthis.data=COMPANION_DATA;',ctx);
const D = ctx.data;
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name)}
function fresh(){const c=CR.initial();CR.validate(c,D.species);return c}
function roundtrip(c){const x=JSON.parse(JSON.stringify(c));CR.validate(x,D.species);return x}
function close(a,b){assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`)}

test('old individual migrates without replacing identity, experience, or species',()=>{
 const c=CR.initial(),m=c.owned[0];m.lv=4;m.xp=175;delete m.plus;delete m.hp;delete m.maxHp;delete m.mp;delete m.maxMp;
 CR.validate(c,D.species);assert.equal(m.uid,'c1');assert.equal(m.id,'seedpod_mouse');assert.equal(m.lv,4);assert.equal(m.xp,175);assert.equal(m.plus,0);
 assert.equal(m.hp,m.maxHp);assert.ok(m.maxHp>0);assert.equal(m.mp,m.maxMp);assert.ok(m.maxMp>0);
 assert.deepEqual(roundtrip(c),c);
});
test('missing/invalid plus sanitizes and finite HP/MP clamp to own maxima',()=>{
 const c=fresh(),m=c.owned[0];for(const plus of [-1,NaN,Infinity,1.5,'3',null,undefined]){m.plus=plus;CR.validate(c,D.species);assert.equal(m.plus,0)}
 m.hp=-9;m.mp=-3;CR.validate(c,D.species);assert.equal(m.hp,0);assert.equal(m.mp,0);
 m.hp=1e9;m.mp=1e9;m.maxHp=1;m.maxMp=1;CR.validate(c,D.species);assert.equal(m.hp,CR.stats(m,D.species).hp);assert.equal(m.mp,CR.stats(m,D.species).mp);
});
test('plus changes base stats only; no save or level-up compounding',()=>{
 const c=fresh(),m=c.owned[0],at=lv=>CR.stats({...m,lv},D.species);m.plus=0;const zero=at(1),growth0=at(6);m.plus=10;const boosted=at(1),growth10=at(6);
 for(const k of ['hp','mp','attack','defense']){assert.ok(boosted[k]>zero[k],k);close(growth10[k]-boosted[k],growth0[k]-zero[k]);}
 CR.health(m,D.species);const expected=CR.stats(m,D.species);for(let i=0;i<5;i++)CR.validate(c,D.species);assert.deepEqual(CR.stats(m,D.species),expected);assert.deepEqual(CR.stats(roundtrip(c).owned[0],D.species),expected);
});
test('KO persists through ordinary healing, swapping and reload; restoration revives reserves',()=>{
 const c=fresh(),m=c.owned[0],reserve=CR.add(c,'lotus_root_sproutling',D.species);m.hp=0;reserve.hp=1;
 assert.equal(CR.heal(m,40,D.species),0);assert.equal(m.hp,0);CR.equip(c,m.uid);CR.equip(c,reserve.uid);assert.equal(roundtrip(c).owned[0].hp,0);
 CR.restore(c,D.species);for(const x of c.owned){assert.equal(x.hp,x.maxHp);assert.equal(x.mp,x.maxMp)}
});
test('full party retains captured reserve with its own healthy resources',()=>{
 const c=fresh();for(const id of ['lotus_root_sproutling','pinecone_sparrow'])CR.equip(c,CR.add(c,id,D.species).uid);
 assert.equal(CR.recruit(c,'lantern_moth',D.species),true);const m=c.owned.at(-1);assert.equal(c.team.length,3);assert.equal(c.owned.length,4);assert.equal(m.plus,0);assert.equal(m.hp,m.maxHp);assert.equal(m.mp,m.maxMp);assert.ok(!c.team.includes(m.uid));
});
test('all 317 exact/family recipes consume only selected UIDs and produce plus 10 healthy offspring',()=>{
 assert.equal(D.recipes.length,317);
 for(const r of D.recipes){const c=fresh();c.owned=[];c.team=[];const parents=r.parents.map(p=>p[0]==='@'?Object.keys(D.species).find(id=>D.species[id].family===p.slice(1)):p).map(id=>CR.add(c,id,D.species));
  const spare=CR.add(c,parents[0].id,D.species);parents[0].plus=9;parents[1].plus=3;c.team=[parents[0].uid,spare.uid];
  const child=CR.breed(c,parents[0].uid,parents[1].uid,D.recipes,D.species);assert.equal(child.plus,10);assert.equal(child.hp,child.maxHp);assert.equal(child.mp,child.maxMp);assert.ok(c.owned.some(m=>m.uid===spare.uid));assert.ok(c.team.includes(child.uid));assert.ok(!c.owned.some(m=>parents.some(p=>m.uid===p.uid)));
  const saved=JSON.stringify(c);assert.throws(()=>CR.breed(c,parents[0].uid,parents[1].uid,D.recipes,D.species));assert.equal(JSON.stringify(c),saved);
 }
});
test('unrepresentable plus refuses breeding without consuming either parent',()=>{
 const c=fresh(),a=c.owned[0],b=CR.add(c,'lotus_root_sproutling',D.species);a.plus=Number.MAX_SAFE_INTEGER;const before=JSON.stringify(c);assert.throws(()=>CR.breed(c,a.uid,b.uid,D.recipes,D.species));assert.equal(JSON.stringify(c),before);
});
console.log('INDIVIDUAL BASE TESTS '+passed);
test('232 retained species have three valid skill slots with minimum learning gates',()=>{
 for(const id of Object.keys(D.species)){const abilities=CR.innate(id,D.species);assert.equal(abilities.length,3);assert.equal(new Set(abilities.map(s=>s.id)).size,3);assert.equal(abilities[0].level,1);for(const a of abilities){assert.ok(a.description);assert.ok(a.inheritLevel>=a.level+2);}for(const lv of [1,4,5,9,10])assert.equal(CR.known({id,lv},D.species).length,abilities.filter(s=>s.level<=lv).length);}
});
test('exact plus stats use only base multiplier; no resource multiplier on growth',()=>{
 const m={id:'seedpod_mouse',lv:6,plus:4},power=D.species[m.id].power,st=CR.stats(m,D.species);
 assert.equal(st.hp,Math.floor((24+power*4)*1.2)+20);assert.equal(st.mp,Math.floor((10+power*2)*1.2)+10);close(st.attack,(6+power)*1.2+6);close(st.defense,(2+power/2)*1.2+3);
});
test('inherit from both parents, preserve through later breeding and saves, keep innate skills separate',()=>{
 const c=fresh(),a=c.owned[0],b=CR.add(c,'lotus_root_sproutling',D.species);a.lv=12;b.lv=12;a.inherited=[0,1,2].map(i=>'native:'+a.id+':'+i);b.inherited=[0,1,2].map(i=>'native:'+b.id+':'+i);
 const inherited=[CR.innate(a.id,D.species)[2].id,CR.innate(b.id,D.species)[1].id];const options=CR.inheritOptions(a,b,D.species).map(s=>s.id);assert.ok(inherited.every(id=>options.includes(id)));
 const child=CR.breed(c,a.uid,b.uid,D.recipes,D.species,inherited);assert.deepEqual(child.inherited,inherited);assert.equal(CR.innate(child.id,D.species).length,3);assert.equal(CR.known(child,D.species).length,1);
 const saved=roundtrip(c);assert.deepEqual(saved.owned[0].inherited,inherited);saved.owned[0].lv=12;const mate=CR.add(saved,'lantern_moth',D.species);mate.lv=12;const next=CR.breed(saved,child.uid,mate.uid,D.recipes,D.species,inherited);assert.deepEqual(next.inherited,inherited);assert.equal(next.plus,2);assert.equal(next.hp,next.maxHp);assert.equal(next.mp,next.maxMp);
});
test('invalid/duplicate/too-many/unknown or unlearned inherited skills never consume parents',()=>{
 const c=fresh(),a=c.owned[0],b=CR.add(c,'lotus_root_sproutling',D.species),one=CR.known(a,D.species)[0].id,locked=CR.innate(a.id,D.species)[2].id;
 for(const bad of [[one,one],[one,one,one],['native:missing:0'],[locked],null]){const before=JSON.stringify(c);assert.throws(()=>CR.breed(c,a.uid,b.uid,D.recipes,D.species,bad));assert.equal(JSON.stringify(c),before)}
 const before=JSON.stringify(c);CR.inheritOptions(a,b,D.species);CR.recipe(c,a.uid,b.uid,D.recipes,D.species);assert.equal(JSON.stringify(c),before,'preview/cancel path must be read-only');
});
test('five inherited plus three native skills, cap six rejection, and next-generation retention',()=>{
 const c=fresh(),a=c.owned[0],b=CR.add(c,'lotus_root_sproutling',D.species);a.lv=12;b.lv=12;
 a.inherited=[0,1,2].map(i=>'native:'+a.id+':'+i);b.inherited=[0,1,2].map(i=>'native:'+b.id+':'+i);const all=CR.inheritOptions(a,b,D.species).filter(s=>s.id.startsWith('native:')).map(s=>s.id);assert.equal(all.length,6);const before=JSON.stringify(c);assert.throws(()=>CR.breed(c,a.uid,b.uid,D.recipes,D.species,all));assert.equal(JSON.stringify(c),before);
 const chosen=all.slice(0,5),child=CR.breed(c,a.uid,b.uid,D.recipes,D.species,chosen);assert.deepEqual(child.inherited,chosen);child.lv=12;assert.equal(CR.known(child,D.species).length,8);assert.equal(new Set(CR.known(child,D.species).map(s=>s.id)).size,8);
 const saved=roundtrip(c),m=saved.owned.find(m=>m.uid===child.uid),mate=CR.add(saved,'lantern_moth',D.species);mate.lv=12;assert.ok(chosen.every(id=>CR.inheritOptions(m,mate,D.species).some(s=>s.id===id)));
 const grand=CR.breed(saved,m.uid,mate.uid,D.recipes,D.species,chosen);grand.lv=12;assert.deepEqual(grand.inherited,chosen);assert.equal(CR.known(grand,D.species).length,8);assert.deepEqual(roundtrip(saved).owned.find(m=>m.uid===grand.uid).inherited,chosen);
});
test('offspring native skill IDs cannot be selected as inherited slots',()=>{
 const c=fresh(),a=c.owned[0],b=CR.add(c,'lotus_root_sproutling',D.species);const childId=CR.recipe(c,a.uid,b.uid,D.recipes,D.species).child,duplicate=CR.innate(childId,D.species)[0].id;a.inherited=[duplicate];a.lv=12;const before=JSON.stringify(c);assert.throws(()=>CR.breed(c,a.uid,b.uid,D.recipes,D.species,[duplicate]));assert.equal(JSON.stringify(c),before);
});
test('duplicate native/inherited IDs do not create duplicate usable skills',()=>{
 const c=fresh(),m=c.owned[0],id=CR.innate(m.id,D.species)[0].id;m.inherited=[id,id];CR.validate(c,D.species);assert.deepEqual(m.inherited,[id]);assert.equal(CR.known(m,D.species).filter(a=>a.id===id).length,1);
});
test('MP spends on living known skill only; exhausted, locked and dead actors preserve resources',()=>{
 const c=fresh(),m=c.owned[0],a=CR.innate(m.id,D.species)[0],before=m.mp;assert.equal(CR.spend(m,a,D.species),true);assert.equal(m.mp,before-a.cost);
 m.mp=a.cost-1;assert.equal(CR.spend(m,a,D.species),false);assert.equal(m.mp,a.cost-1);m.mp=m.maxMp;const locked=CR.innate(m.id,D.species)[2];assert.equal(CR.spend(m,locked,D.species),false);assert.equal(m.mp,m.maxMp);
 m.hp=0;assert.equal(CR.spend(m,a,D.species),false);assert.equal(m.mp,m.maxMp);
});
test('latent inherited skills remain saved at birth and unlock at Lv3/7/12 only',()=>{
 const c=fresh(),a=c.owned[0],b=CR.add(c,'lotus_root_sproutling',D.species);a.lv=12;b.lv=12;a.inherited=[0,1,2].map(i=>'native:'+a.id+':'+i);const selected=[...a.inherited],child=CR.breed(c,a.uid,b.uid,D.recipes,D.species,selected);assert.equal(child.lv,1);assert.deepEqual(child.inherited,selected);
 for(const [lv,count] of [[1,0],[2,0],[3,1],[6,1],[7,2],[11,2],[12,3]]){child.lv=lv;CR.health(child,D.species);const known=new Set(CR.known(child,D.species).map(s=>s.id));assert.equal(selected.filter(id=>known.has(id)).length,count);const loaded=roundtrip(c).owned.find(m=>m.uid===child.uid);assert.deepEqual(loaded.inherited,selected);assert.equal(selected.filter(id=>CR.known(loaded,D.species).some(s=>s.id===id)).length,count);
 for(const id of selected.filter(id=>!known.has(id))){const before=child.mp;assert.equal(CR.spend(child,CR.skill(id,D.species),D.species),false);assert.equal(child.mp,before)} }
 child.lv=2;const mate=CR.add(c,'lantern_moth',D.species);mate.lv=12;assert.ok(selected.every(id=>!CR.inheritOptions(child,mate,D.species).some(s=>s.id===id)));const before=JSON.stringify(c);assert.throws(()=>CR.breed(c,child.uid,mate.uid,D.recipes,D.species,[selected[0]]));assert.equal(JSON.stringify(c),before);
 child.lv=1;child.xp=0;c.team=[child.uid];CR.gain(c,1500);assert.ok(child.lv>=12);assert.ok(selected.every(id=>CR.known(child,D.species).some(s=>s.id===id)));assert.deepEqual(child.inherited,selected);assert.ok(selected.every(id=>CR.inheritOptions(child,mate,D.species).some(s=>s.id===id)));
});
console.log('INDIVIDUAL TESTS '+passed+' passed; 696 native skills, 317 recipe paths');
(async()=>{
 const c=fresh(),a=c.owned[0],b=CR.add(c,'lotus_root_sproutling',D.species),dead=CR.add(c,'pinecone_sparrow',D.species);c.team=[a.uid,b.uid,dead.uid];dead.hp=0;
 const enemies=[{slot:0,jp:'A',hp:1000,max:1000,caught:false},{slot:1,jp:'B',hp:1000,max:1000,caught:false},{slot:2,jp:'Caught',hp:1000,max:1000,caught:true}];
 const e={SkillEffects:require('./skill-effects.js'),CR,CD:D,S:{job:"none"},B:{turn:0,buffs:{},acted:[],enemies,nums:[]},companions:()=>c.owned.filter(m=>c.team.includes(m.uid)),performance:{now:()=>100},htmlSafe:x=>x,beat:async()=>{}};
 vm.createContext(e);vm.runInContext(fs.readFileSync(path.join(root,'party-battle.js'),'utf8'),e);
 const ability=(effect,power=1)=>({effect,power,name:effect,cost:0});
 await e.executeAbility(a,ability('damage'),enemies[0],true);const full=1000-enemies[0].hp;enemies[0].hp=1000;await e.executeAbility(a,ability('damage'),enemies[0],false);assert.equal(1000-enemies[0].hp,Math.max(1,Math.round(full*.5)));
 const prior=enemies.map(x=>x.hp);await e.executeAbility(a,ability('allDamage'),null,true);assert.ok(enemies[0].hp<prior[0]);assert.ok(enemies[1].hp<prior[1]);assert.equal(enemies[2].hp,prior[2]);
 a.hp=1;b.hp=1;await e.executeAbility(a,ability('heal'),b,true);assert.equal(a.hp,1);assert.ok(b.hp>1);const bh=b.hp;await e.executeAbility(a,ability('allHeal'),null,false);assert.ok(a.hp>1);assert.ok(b.hp>bh);assert.equal(dead.hp,0);
 const hp=a.hp;await e.executeAbility(a,ability('drain'),enemies[0],true);assert.ok(a.hp>hp);a.hp=1;enemies[0].hp=1;await e.executeAbility(a,ability('drain',100),enemies[0],true);assert.equal(a.hp,1,'HP1 victim cannot grant overkill healing');
 await e.executeAbility(a,ability('attackUp',.3),a,false);close(e.B.skillState[a.uid].attackUp.value,.15);await e.executeAbility(a,ability('defenseUp',.4),b,true);close(e.B.skillState[b.uid].defenseUp.value,.4);
 enemies[0].hp=100;await e.executeAbility(a,ability('attackDown',.3),enemies[0],false);close(e.B.skillState['enemy:0'].attackDown.value,.15);assert.equal(e.B.skillState['enemy:0'].attackDown.until,3);
 console.log('PASS effect execution: damage/half/all-target/caught-exclusion/heal/no-revive/drain/buff/debuff');
})().catch(err=>{console.error(err);process.exitCode=1});
(async()=>{
 function battleHarness({boss=false,hp=1000,attack=4}={}){
  const c=fresh();for(const id of ['lotus_root_sproutling','pinecone_sparrow'])CR.equip(c,CR.add(c,id,D.species).uid);
  let ticks=0;const records={commands:[],ended:0,lastBattle:null,quizzes:0,questions:[],beats:[]};const randomMath=Object.create(Math);randomMath.random=()=>0;
  const e={SkillEffects:require('./skill-effects.js'),CR,CD:D,S:{companions:c,exp:0,gold:20,lv:1,hp:34,mp:9},B:null,mode:'walk',document:{body:{dataset:{}}},ENEMIES:{dummy:{jp:'Enemy',name:'Enemy',hp,atk:attack,exp:7,gold:5,boss,companion:'lotus_root_sproutling'}},ZONES:{w1:{tier:1,bg:'grass',foes:['dummy']}},zoneKey:()=> 'w1',curTier:()=>1,performance:{now:()=>++ticks},Math:randomMath,pick:a=>a[0],htmlSafe:x=>x,heartText:()=>'',setLog:()=>{},qVocab:()=>({route:'vocab'}),bandQuestion:()=>({route:'band'}),qListenAny:()=>({route:'listen'}),need:()=>1000000,maxHp:()=>34,maxMp:()=>9,quiz:async q=>{records.quizzes++;records.questions.push(q.route);return e.correct!==false},beat:async html=>records.beats.push(html),sys:async()=>{},itemMenu:async()=>false,ask:async()=>null};
  e.companions=()=>e.S.companions.owned.filter(m=>e.S.companions.team.includes(m.uid));e.endBattle=()=>{records.ended++;records.lastBattle=e.B;e.B=null;e.mode='walk'};
  vm.createContext(e);vm.runInContext(fs.readFileSync(path.join(root,'companion-ui.js'),'utf8').match(/function companions\(\)[^\n]+/)[0],e);vm.runInContext(fs.readFileSync(path.join(root,'party-battle.js'),'utf8'),e);e.battleCommands=async()=>{records.commands.push({uid:e.B.actor.uid,turn:e.B.turn,acted:[...e.B.acted]});if(records.commands.length>30)throw Error('Battle loop guard');return e.command?e.command(records.commands.length):'run'};
  return {e,c,records,play:()=>e.partyBattle('dummy',{keys:['dummy']})};
 }
 {
  const h=battleHarness();h.c.owned[0].hp=0;assert.equal(await h.play(),'run');assert.equal(h.records.commands[0].uid,h.c.owned[1].uid);assert.equal(h.c.owned[0].hp,0);assert.equal(h.e.mode,'walk');assert.equal(h.e.B,null);
  console.log('PASS battle partial KO skips actor and successful flee returns to map');
 }
 {
  const h=battleHarness();h.c.owned.forEach(m=>m.hp=0);assert.equal(await h.play(),'lose');assert.equal(h.records.commands.length,0);assert.equal(h.e.mode,'walk');
  console.log('PASS battle starts with all KO and exits without issuing an action');
 }
 {
  const h=battleHarness();const old=h.c.owned.map(m=>m.hp);h.e.command=n=>n<=3?'atk':'run';assert.equal(await h.play(),'run');assert.deepEqual(h.records.commands.slice(0,3).map(x=>x.uid),h.c.team);assert.deepEqual(h.records.commands.slice(0,3).map(x=>x.turn),[0,0,0]);assert.equal(h.records.commands[3].turn,1);assert.ok(h.c.owned[0].hp<old[0]);assert.equal(h.c.owned[1].hp,old[1]);assert.equal(h.c.owned[2].hp,old[2]);assert.equal(h.records.quizzes,3);
  console.log('PASS battle each of three allies acts once before targeted enemy retaliation');
 }
 {
  const h=battleHarness({boss:true,attack:10000});h.e.command=n=>{if(n===1)h.e.B.turn=2;return 'atk'};assert.equal(await h.play(),'lose');assert.ok(h.c.owned.every(m=>m.hp===0));assert.equal(h.records.commands.length,3);assert.equal(h.records.lastBattle.turn,3);assert.equal(h.e.mode,'walk');
  console.log('PASS boss area attack damages every living ally and all-down is defeat');
 }
 {
  const h=battleHarness(),m=h.c.owned[0],skill=CR.known(m,D.species)[0];m.mp=0;h.e.command=n=>n===1?skill.id:'run';assert.equal(await h.play(),'run');assert.equal(h.records.commands[0].uid,h.records.commands[1].uid);assert.equal(h.records.commands[1].turn,0);assert.equal(h.records.commands[1].acted.length,0);assert.equal(m.mp,0);assert.equal(h.records.quizzes,0);
  console.log('PASS insufficient individual MP costs no action, MP, or question');
 }
 {
  const h=battleHarness(),m=h.c.owned[0],skill=CR.known(m,D.species)[0],mp=m.mp;h.e.command=n=>n===1?skill.id:'run';assert.equal(await h.play(),'run');assert.equal(m.mp,mp-skill.cost);assert.equal(h.records.quizzes,1);assert.equal(h.records.commands[1].uid,h.c.owned[1].uid);
  console.log('PASS skill spends actor MP once and moves to the next actor');
 }
 {
  const h=battleHarness();h.e.command=()=> 'scout';let joined=0;h.e.scout=async()=>{CR.recruit(h.c,h.e.B.E.companion,D.species);joined++;return 'success'};assert.equal(await h.play(),'scout');assert.equal(joined,1);assert.equal(h.c.owned.length,4);assert.equal(h.c.team.length,3);assert.equal(h.e.S.gold,20);assert.equal(h.e.S.exp,0);assert.equal(h.records.lastBattle.enemies[0].caught,true);assert.equal(h.e.mode,'walk');
  console.log('PASS successful scout preserves full party, adds reserve, skips kill rewards, returns to map');
 }
 {
  const h=battleHarness({hp:1});h.e.command=()=> 'atk';assert.equal(await h.play(),'win');assert.equal(h.e.S.gold,25);assert.equal(h.e.S.exp,7);assert.equal(h.records.quizzes,1);assert.equal(h.e.mode,'walk');assert.equal(h.records.ended,1);
  console.log('PASS victory rewards once and returns to map');
 }
 {
  const h=battleHarness();h.c.team.reverse();const order=[...h.c.team];h.e.command=n=>n<=3?'atk':'run';assert.equal(await h.play(),'run');assert.deepEqual(h.records.commands.slice(0,3).map(x=>x.uid),order);console.log('PASS actual companions() respects explicit reversed team order');
 }
 for(const correct of [true,false])for(const job of ['scribe','hunter']){
  const h=battleHarness(),actor=h.c.owned[0],others=h.c.owned.slice(1).map(m=>m.hp),mp=actor.mp;h.e.S.job=job;h.e.correct=correct;actor.hp=1;h.e.command=n=>n===1?'lis':'run';assert.equal(await h.play(),'run');assert.deepEqual(h.records.questions,['listen']);assert.equal(actor.mp,mp);assert.equal(actor.hp,1+CR.effect(actor.maxHp*(job==='hunter'?.2:.12),correct));assert.deepEqual(h.c.owned.slice(1).map(m=>m.hp),others);const expected=CR.effect(CR.stats(actor,D.species).attack*1.3*(job==='hunter'?1.5:1),correct);assert.equal(h.records.lastBattle.enemies[0].hp,1000-expected);console.log('PASS listening route, own recovery and damage '+job+' '+correct);
 }
 console.log('PARTY FLOW TESTS 13 passed');
})().catch(err=>{console.error(err);process.exitCode=1});

