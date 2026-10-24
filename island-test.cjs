// Island hub checks: start on the island, stationed cats, churu, island level and terrain, warp gating, world bosses, arena, migration.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),checks=[],errors=[];
 try{
  fs.mkdirSync('qa',{recursive:true});
  const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:'+server.address().port;await p.goto(url);await p.waitForTimeout(800);
  // Clicks through dialogue and the first available choice until the running script finishes.
  const drive=async(fn,arg)=>{await p.evaluate(fn,arg);for(let i=0;i<80&&await p.evaluate(()=>busy);i++){const o=p.locator('#opts .opt:not([disabled])').first();if(await o.count())await o.click().catch(()=>{});else await p.locator('#log').click({force:true}).catch(()=>{});await p.waitForTimeout(120)}};
  await p.evaluate(()=>{S=newState();opt.auto=false;save()});await p.reload();await p.waitForTimeout(300);
  await p.getByRole('button',{name:/つづきから/}).click();await p.waitForTimeout(800);

  const start=await p.evaluate(()=>({map:S.map,inn:S.inn,goal:goal(),kiki:MAPS.island.ents.find(e=>e.pal==='kiki'),nene:MAPS.island.ents.find(e=>e.pal==='nene'),walk:WALK.has(tileAt(MAPS.island,S.x,S.y))}));
  assert.equal(start.map,'island');assert.equal(start.inn,'island');assert(start.walk);assert.match(start.goal,/王様/);
  assert.deepEqual([start.kiki.x,start.kiki.y],[27,9]);assert.deepEqual([start.nene.x,start.nene.y],[6,11]);
  await p.screenshot({path:'qa/island-start.png'});
  checks.push('New games start on Kotonoha Isle; Kiki is stationed at the ranch and Nene at the breeding hut');

  await drive(()=>run(()=>kingTalk()));
  assert.deepEqual(await p.evaluate(()=>[F().metKing,S.items.churu]),[1,2]);
  await drive(()=>run(()=>giveChuru('kiki')));
  assert.deepEqual(await p.evaluate(()=>[isle().kiki,S.items.churu]),[1,1]);
  checks.push('The king starts the quest with churu; giving churu to Kiki is counted');

  const terrain=await p.evaluate(()=>{const before=[tileAt(MAPS.island,30,16),tileAt(MAPS.island,12,3),tileAt(MAPS.island,5,4),tileAt(MAPS.island,15,21)];
   for(let i=0;i<14;i++)CR.add(S.companions,'pinecone_sparrow',CD.species);isle().nene=14;isle().arena.bronze=1;refreshIsland();
   return {before,after:[tileAt(MAPS.island,30,16),tileAt(MAPS.island,12,3),tileAt(MAPS.island,5,4),tileAt(MAPS.island,15,21)],lv:islandLevel()}});
  assert.deepEqual(terrain.before,['w','t','#','w']);assert.equal(terrain.lv,5);assert.deepEqual(terrain.after,['B','w',',','s']);
  await drive(()=>run(()=>checkIslandLevel()));assert.equal(await p.evaluate(()=>isle().seenLevel),5);
  await p.evaluate(()=>{S.x=26;S.y=11});await p.waitForTimeout(900);await p.screenshot({path:'qa/island-ranch.png'});
  checks.push('More monsters and churu raise the island level, which builds the bridge, clears the forest, opens the summit and (after the arena) the beach');

  const gates=await p.evaluate(()=>{const a=WARPS.map((w,i)=>warpOpen(w,i));F().clear1=1;const b=WARPS.map((w,i)=>warpOpen(w,i));F().clear2=F().clear3=F().won=1;const c=warpOpen(WARPS[4],4);isle().arena.silver=1;return {a,b,c,d:warpOpen(WARPS[4],4)}});
  assert.deepEqual(gates.a,[true,false,false,false,false]);assert.deepEqual(gates.b,[true,true,false,false,false]);assert.equal(gates.c,false);assert.equal(gates.d,true);
  checks.push('Each warp opens when the previous world boss falls; Dream Isle also needs the Silver Cup');

  // A world boss victory sets the clear flag and brings the hero home.
  await p.evaluate(()=>{F().clear1=0;warp('meadow',...SPAWN.meadow);window._battle=battle;battle=async()=>'win'});
  await drive(()=>run(()=>worldBoss(0,'meadowking','Hi','やあ')));
  assert.deepEqual(await p.evaluate(()=>[F().clear1,S.map]),[1,'island']);
  checks.push('Beating a world boss marks the world cleared and returns to the island');

  // Arena: three rounds, then the rank is recorded with rewards.
  const before=await p.evaluate(()=>{let rounds=0;battle=async(k,o)=>{rounds++;window._rounds=rounds;return 'win'};delete isle().arena.bronze;return S.gold});
  await drive(()=>run(()=>arenaDesk()));
  const arena=await p.evaluate(()=>[window._rounds,!!isle().arena.bronze,S.gold]);
  assert.equal(arena[0],3);assert.equal(arena[1],true);assert(arena[2]>before);
  await p.evaluate(()=>{battle=window._battle});
  checks.push('The arena runs three straight battles and records the cup with its reward');

  for(const id of ['island','meadow','sky','underground']){await p.evaluate(id=>warp(id,...SPAWN[id]),id);await p.waitForTimeout(400)}
  await p.screenshot({path:'qa/island-meadow.png'});assert.deepEqual(errors,[]);
  checks.push('Island, meadow, sky and underground worlds render');

  // Old saves keep their progress and resume on the island.
  await p.evaluate(()=>{const s=newState();delete s.hubV;delete s.island;s.map='port';s.x=12;s.y=14;s.flags={quest:1,shard1:1,won:1};localStorage.setItem(SAVE_KEY,JSON.stringify({S:s,opt}))});
  await p.reload();await p.waitForTimeout(300);await p.getByRole('button',{name:/つづきから/}).click();await p.waitForTimeout(400);
  const mig=await p.evaluate(()=>({map:S.map,met:F().metKing,clear3:F().clear3,won:F().won,hub:S.hubV,inn:S.inn}));
  assert.deepEqual(mig,{map:'island',met:1,clear3:1,won:1,hub:1,inn:'island'});
  checks.push('Saves from before the island keep their flags and resume on the island');
  assert.deepEqual(errors,[]);checks.push('No uncaught errors');
 }finally{fs.writeFileSync('qa/island-report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
