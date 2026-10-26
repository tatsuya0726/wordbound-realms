// Rift worlds: eight new themed worlds behind the 異界の門, richer floors with obstacles and events, and bosses
// that are rare monsters under their own names with tough stats (rift-worlds.js, warp-floors.js).
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://l').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),checks=[],errors=[];
 try{const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(900);
  const r=await p.evaluate(()=>{S=newState();opt.auto=false;mode='walk';const out={};
   const gen=WARPS.map((w,i)=>[w,i]).filter(([w])=>w.gen);out.gen=gen.length;
   out.locked=!warpOpen(gen[0][0],gen[0][1]);F().dreamWon=1;out.firstOpen=warpOpen(gen[0][0],gen[0][1])&&!warpOpen(gen[1][0],gen[1][1]);
   out.gate=MAPS.island.ents.filter(e=>e.prop==='warp').map(e=>e.x+','+e.y);
   // Floors: every world builds valid floors with obstacles and events across many seeds; boss floors hold the boss.
   out.floors=[];for(const [w,i] of WARPS.map((w,i)=>[w,i]).filter(([w])=>w.floors)){let obst=0,ev=0;
    for(let s=1;s<=25;s++){const f=genFloor(i,1+s%3,s*7919);obst+=f.rows.join('').split('&').length-1;ev+=f.ents.filter(e=>e.kind==='event').length}out.floors.push([w.id,obst,ev])}
   out.bossFloors=gen.map(([w,i])=>{S.rift={w:i,floor:w.floors+1,seed:5,opened:[],seen:[]};buildRift(S.rift);const b=MAPS.rift.ents.find(e=>e.boss);return b&&ENEMIES[b.boss]?b.boss:null});
   // Bosses: real monsters, rarer than the regulars of their world, under the monster's own name.
   const SP=CD.species,rar=id=>CR.rarity(SP[id]);
   out.classic=[['meadowking','meadow'],['skyowl','sky'],['crystalmole','underground'],['nightmare','dream']].map(([k,z])=>{const e=ENEMIES[k],foes=ZONES[z].foes.map(f=>ENEMIES[f]?.companion||f).filter(id=>SP[id]);return {name:e.jp===SP[e.worldArt]?.name,rarer:rar(e.worldArt)>Math.max(...foes.map(rar))&&!foes.includes(e.worldArt),boss:WARPS.find(w=>w.id===z).boss===e.jp,hp:e.hp}});
   out.newBosses=gen.map(([w])=>{const e=ENEMIES['rwb_'+w.id],foes=ZONES['rw_'+w.id].foes.map(f=>ENEMIES[f].companion);return {r:rar(e.worldArt),name:e.jp===SP[e.worldArt].name,actions:e.actions,noScout:!e.companion,rarer:rar(e.worldArt)>Math.max(...foes.map(rar))&&!foes.includes(e.worldArt),hp:e.hp,foes:foes.length}});
   out.backdrops=[...gen.flatMap(([w])=>BACKDROPS['rw_'+w.id]),...gen.map(([w])=>BOSS_BACKDROP['rwb_'+w.id])];
   return out});
  assert.equal(r.gen,8);assert.ok(r.locked&&r.firstOpen);assert.ok(r.gate.includes('24,15'));assert.equal(r.gate.length,6);
  checks.push('Eight new worlds behind one 異界の門 (24,15); they open one by one after the dream island');
  for(const [id,obst,ev] of r.floors){assert.ok(obst>=10,id+' obstacles '+obst);assert.ok(ev>=20,id+' events '+ev)}
  checks.push('Every world builds valid floors with obstacles and 1–2 events per floor ('+r.floors.map(f=>f[0]).join(', ')+')');
  assert.ok(r.bossFloors.every(Boolean));checks.push('Each new world ends in a boss chamber');
  for(const c of r.classic){assert.ok(c.name&&c.rarer&&c.boss,JSON.stringify(c))}
  for(const b of r.newBosses){assert.ok(b.r>=9&&b.name&&b.actions===2&&b.noScout&&b.rarer&&b.hp>=1000&&b.foes>=8,JSON.stringify(b))}
  checks.push('Bosses are real monsters under their own names, rarer than the regulars of their world; new-world bosses are ★9–10, act twice and have 1000+ HP');
  for(const f of r.backdrops)assert.ok(fs.existsSync('assets/battle/'+f+'.webp'),f);checks.push(r.backdrops.length+' themed battle backdrops present');
  // A boss gets two turns a round.
  const turns=await p.evaluate(()=>{B=createGroupBattle(['rwb_lava']);const o=battleOrder().filter(x=>!x.ally).length;B=null;return o});assert.equal(turns,2);checks.push('Bosses take two turns a round');
  // Events: the spring heals the party; the tablet teaches a word or gives EXP; drawing every world raises no error.
  const ev=await p.evaluate(async()=>{const i=WARPS.findIndex(w=>w.id==='crypt');S.rift={w:i,floor:1,seed:9,opened:[],seen:[]};buildRift(S.rift);warp('rift',...SPAWN.rift);
   const old={sys,teachWords};let said='';sys=async t=>{said+=t};teachWords=async()=>{said+='[word]'};
   const m=S.companions.owned[0];m.hp=1;const spring=riftEventEntity({x:1,y:1,type:'spring'},0);await spring.talk();const healed=m.hp===m.maxHp&&S.rift.opened.includes('ev0');
   const tab=riftEventEntity({x:1,y:1,type:'tablet'},1);await tab.talk();sys=old.sys;teachWords=old.teachWords;return {healed,tablet:said.includes('石碑')||said.includes('[word]')}});
  assert.ok(ev.healed&&ev.tablet);checks.push('Floor events work (healing spring, ancient tablet)');
  for(const id of ['jungle','lava','snow','desert','sea','crypt','clock','astral','meadow','underground']){await p.evaluate(id=>{busy=false;startRift(WARPS.findIndex(w=>w.id===id))},id);await p.waitForTimeout(250)}
  assert.deepEqual(errors,[]);checks.push('Every world draws without errors');
 }finally{console.log(JSON.stringify({checks,errors},null,1));await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
