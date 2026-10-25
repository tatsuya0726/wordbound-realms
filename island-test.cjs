// Island hub checks: start on the enlarged island, doors and interiors, cats, churu, island level and terrain, warp gating,
// random warp floors to the boss, praise scouting, bookstore, arena, migration.
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
  const cont=async()=>{await p.reload();await p.waitForTimeout(300);await p.getByRole('button',{name:/つづきから/}).click();await p.waitForTimeout(700)};
  const walk=async(key,ms=330)=>{await p.keyboard.down(key);await p.waitForTimeout(ms);await p.keyboard.up(key);await p.waitForTimeout(450)};
  await p.evaluate(()=>{S=newState();opt.auto=false;save()});await cont();

  const start=await p.evaluate(()=>({map:S.map,inn:S.inn,goal:goal(),size:[MAPS.island.rows[0].length,MAPS.island.rows.length],kiki:MAPS.island.ents.find(e=>e.pal==='kiki'),nene:MAPS.i_hut.ents.find(e=>e.pal==='nene'),walk:WALK.has(tileAt(MAPS.island,S.x,S.y)),words:S.praise.known}));
  assert.equal(start.map,'island');assert.equal(start.inn,'island');assert(start.walk);assert.match(start.goal,/城/);assert.deepEqual(start.size,[56,34]);
  assert.deepEqual([start.kiki.x,start.kiki.y],[34,12]);assert(start.nene);assert.deepEqual(start.words,['cute','strong','kind']);
  await p.screenshot({path:'qa/island-start.png'});
  checks.push('New games start on the enlarged 56x34 island with three praise words; Kiki at the ranch, Nene in the breeding hut');

  // Every door and every person on the island can be reached on foot, before and after the island grows.
  const reachable=()=>p.evaluate(()=>{const m=MAPS.island,[sx,sy]=SPAWN.island,seen=new Set([sx+','+sy]),q=[[sx,sy]],live=m.ents.filter(e=>!e.cond||e.cond());
   while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(seen.has(k)||!WALK.has(tileAt(m,nx,ny))||live.some(e=>e.x===nx&&e.y===ny))continue;seen.add(k);q.push([nx,ny])}}
   const near=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has((x+dx)+','+(y+dy)));
   return [...Object.keys(m.doors).filter(k=>{const [x,y]=k.split(',').map(Number);return tileAt(m,x,y)!=='d'||!seen.has(x+','+(y+1))}),...live.filter(e=>!near(e.x,e.y)).map(e=>e.name||e.prop)]});
  assert.deepEqual(await reachable(),[]);

  // Walk into the castle door, meet the king inside, then walk out through the exit.
  await p.evaluate(()=>warp('island',24,9,0));await p.waitForTimeout(300);await walk('ArrowUp');
  assert.equal(await p.evaluate(()=>S.map),'i_castle');await p.screenshot({path:'qa/island-castle.png'});
  await drive(()=>run(()=>kingTalk()));
  assert.deepEqual(await p.evaluate(()=>[F().metKing,S.items.churu,S.praise.known.includes('brave')]),[1,2,true]);
  await p.evaluate(()=>{S.x=SPAWN.i_castle[0];S.y=SPAWN.i_castle[1];S.dir=2});await walk('ArrowDown');
  const out=await p.evaluate(()=>[S.map,S.x,S.y]);assert.deepEqual(out.slice(0,2),['island',24]);assert(out[2]>=9&&out[2]<=12);
  for(const id of ['i_shop','i_books','i_inn','i_house','i_hut','i_house2']){await p.evaluate(id=>warp(id,...SPAWN[id]),id);await p.waitForTimeout(350)}
  await p.screenshot({path:'qa/island-bookstore-room.png'});assert.deepEqual(errors,[]);
  checks.push('Doors lead into the castle, item shop, bookstore, inn, houses and breeding hut; the king gives the first praise word');

  await p.evaluate(()=>warp('island',...SPAWN.island));
  await drive(()=>run(()=>giveChuru('kiki')));
  assert.deepEqual(await p.evaluate(()=>[isle().kiki,S.items.churu]),[1,1]);
  checks.push('Giving churu to Kiki is counted');

  const cells=[[45,19],[6,5],[9,6],[36,8],[24,30]];
  const terrain=await p.evaluate(cells=>{const at=()=>cells.map(([x,y])=>tileAt(MAPS.island,x,y)),before=at();
   for(let i=0;i<14;i++)CR.add(S.companions,'pinecone_sparrow',CD.species);isle().nene=14;isle().arena.bronze=1;F().clear1=1;refreshIsland();
   return {before,after:at(),lv:islandLevel()}},cells);
  assert.deepEqual(terrain.before,['w','t','t','#','w']);assert.equal(terrain.lv,5);assert.deepEqual(terrain.after,['B','.','w',',','s']);
  await drive(()=>run(()=>checkIslandLevel()));assert.equal(await p.evaluate(()=>isle().seenLevel),5);
  assert.deepEqual(await reachable(),[]);
  await p.evaluate(()=>{warp('island',33,13,1)});await p.waitForTimeout(900);await p.screenshot({path:'qa/island-ranch.png'});
  checks.push('The island level builds the bridge, clears the forest for the hot spring and farm, opens the summit and (after the arena) the beach; everything stays reachable');

  // Chancellor: one new word per island level reached.
  const before=await p.evaluate(()=>S.praise.known.length);await drive(()=>run(()=>chancellorTalk()));
  assert(await p.evaluate(()=>S.praise.known.length)>before);
  // Bookstore: buying a book teaches its words.
  const book=await p.evaluate(async()=>{const old={ask,say,quiz};let q=[BOOKS[0],null];ask=async()=>q.shift();say=async()=>{};quiz=async()=>true;S.gold=500;
   try{await bookShop()}finally{Object.assign(window,old)}return [S.gold,BOOKS[0].words.every(knowsWord)]});
  assert.deepEqual(book,[500-Math.ceil(40*.8),true]);
  checks.push('The chancellor rewards island levels with words; the bookstore sells word books');

  const gates=await p.evaluate(()=>{F().clear1=0;const a=WARPS.map((w,i)=>warpOpen(w,i));F().clear1=1;const b=WARPS.map((w,i)=>warpOpen(w,i));F().clear2=F().clear3=F().won=1;const c=warpOpen(WARPS[4],4);isle().arena.silver=1;return {a,b,c,d:warpOpen(WARPS[4],4)}});
  assert.deepEqual(gates.a,[true,false,false,false,false]);assert.deepEqual(gates.b,[true,true,false,false,false]);assert.equal(gates.c,false);assert.equal(gates.d,true);
  checks.push('Each warp opens when the previous world boss falls; Dream Isle also needs the Silver Cup');

  // Warp floors: two random floors in the meadow, then the boss floor. A saved floor is rebuilt the same.
  await p.evaluate(()=>{F().clear1=0;startRift(0)});await p.waitForTimeout(500);
  const f1=await p.evaluate(()=>({map:S.map,jp:MAPS.rift.jp,chests:MAPS.rift.ents.filter(e=>e.chest).length,home:MAPS.rift.ents.some(e=>e.prop==='warp')}));
  assert.equal(f1.map,'rift');assert.match(f1.jp,/1\/2層/);assert(f1.chests>=1&&f1.home);const seen=await p.evaluate(()=>S.rift.seen.length);assert(seen>0&&seen<30*22/2,'fog of war reveals only the area around the hero');await p.screenshot({path:'qa/island-rift.png'});
  const toExit=async()=>{await p.evaluate(()=>{const y=MAPS.rift.rows.findIndex(r=>r.includes('E'));S.x=MAPS.rift.rows[y].indexOf('E');S.y=y;onArrive()});await drive(()=>{})};
  await toExit();
  const f2=await p.evaluate(()=>({map:S.map,floor:S.rift.floor,rows:MAPS.rift.rows.join('|')}));assert.deepEqual([f2.map,f2.floor],['rift',2]);
  await p.evaluate(()=>save());await cont();
  assert.deepEqual(await p.evaluate(()=>[S.map,MAPS.rift.rows.join('|')]),['rift',f2.rows]);
  await toExit();
  assert.deepEqual(await p.evaluate(()=>[S.map,S.x,S.y,S.rift]),['meadow',14,6,null]);
  checks.push('Warp floors are randomly built and hidden by fog of war until explored, carry chests and a gate home, survive save/load, and lead to the boss floor');

  // A world boss victory sets the clear flag, teaches words and brings the hero home.
  const words=await p.evaluate(()=>{window._battle=battle;battle=async()=>'win';return S.praise.known.length});
  await drive(()=>run(()=>worldBoss(0,'meadowking','Hi','やあ')));
  assert.deepEqual(await p.evaluate(()=>[F().clear1,S.map]),[1,'island']);assert(await p.evaluate(()=>S.praise.known.length)>words);
  checks.push('Beating a world boss marks the world cleared, teaches praise words and returns to the island');

  // Arena: three rounds, then the rank is recorded with rewards.
  const gold=await p.evaluate(()=>{let rounds=0;battle=async(k,o)=>{rounds++;window._rounds=rounds;return 'win'};delete isle().arena.bronze;return S.gold});
  await drive(()=>run(()=>arenaDesk()));
  const arena=await p.evaluate(()=>[window._rounds,!!isle().arena.bronze,S.gold]);
  assert.equal(arena[0],3);assert.equal(arena[1],true);assert(arena[2]>gold);
  await p.evaluate(()=>{battle=window._battle});
  checks.push('The arena runs three straight battles and records the cup with its reward');

  // Praise scouting in a real battle: two liked words win the mouse over.
  await p.evaluate(()=>{warp('meadow',...SPAWN.meadow);S.hp=maxHp();learnWords(['sweet']);window._owned=S.companions.owned.length;run(async()=>{window._scout=await battle('seedpod_mouse',{keys:['seedpod_mouse']})})});
  for(const word of ['cute','sweet']){await p.getByRole('button',{name:/スカウト/}).waitFor();await p.waitForTimeout(250);await p.getByRole('button',{name:/スカウト/}).click();
   await p.getByRole('button',{name:new RegExp('^'+word)}).waitFor();await p.waitForTimeout(200);if(word==='sweet')await p.screenshot({path:'qa/island-praise.png'});await p.getByRole('button',{name:new RegExp('^'+word)}).click()}
  for(let i=0;i<40&&await p.evaluate(()=>busy);i++){const n=p.getByRole('button',{name:/Next/});if(await n.count())await n.click().catch(()=>{});await p.waitForTimeout(200)}
  assert.deepEqual(await p.evaluate(()=>[window._scout,S.companions.owned.length-window._owned,S.praise.likes.seedpod_mouse.length]),['scout',1,1]);
  checks.push('Scouting is done by praising in English: the liked words fill the hearts and the monster joins');

  // Monsters live in town alongside the people and can be talked to.
  await p.evaluate(()=>warp('island',...SPAWN.island));const pets=await p.evaluate(()=>MAPS.island.ents.filter(e=>e.mon).length);assert(pets>=6);
  await p.evaluate(()=>{window._said='';const old=say;say=async(who,en,ja)=>{window._said=who+' '+ja;say=old};run(()=>MAPS.island.ents.find(e=>e.mon==='seedpod_mouse').talk())});await p.waitForTimeout(300);
  assert.match(await p.evaluate(()=>window._said),/タネチュー/);checks.push('Monsters live in the town with the people and can be talked to');
  const follow=await p.evaluate(async()=>{for(const id of ['pinecone_sparrow','lantern_moth','seedpod_mouse']){const m=CR.add(S.companions,id,CD.species);if(S.companions.team.length<3)CR.equip(S.companions,m.uid)}warp('island',20,18,1);await new Promise(r=>setTimeout(r,200));return followerPoses(performance.now()).map(f=>f.id).length});
  assert.equal(follow,3);await p.keyboard.down('ArrowRight');await p.waitForTimeout(700);await p.keyboard.up('ArrowRight');await p.waitForTimeout(300);
  assert(await p.evaluate(()=>{const f=followerPoses(performance.now());return f.every((m,i)=>m.x<S.x+.01&&(i===0||m.x<f[i-1].x+.01))}),'followers trail behind the hero in order');
  await p.screenshot({path:'qa/island-followers.png'});checks.push('Up to three team monsters follow the hero in a line');
  for(const id of ['island','meadow','sky','underground']){await p.evaluate(id=>warp(id,...SPAWN[id]),id);await p.waitForTimeout(400)}
  assert.deepEqual(errors,[]);checks.push('Island, meadow, sky and underground worlds render');

  // Old saves keep their progress and resume on the island, with words for the worlds already cleared.
  await p.evaluate(()=>{const s=newState();delete s.hubV;delete s.island;delete s.praise;s.map='port';s.x=12;s.y=14;s.flags={quest:1,shard1:1,won:1};localStorage.setItem(SAVE_KEY,JSON.stringify({S:s,opt}))});
  await cont();
  const mig=await p.evaluate(()=>({map:S.map,met:F().metKing,clear3:F().clear3,won:F().won,hub:S.hubV,inn:S.inn,words:S.praise.known.length}));
  assert.deepEqual(mig,{map:'island',met:1,clear3:1,won:1,hub:2,inn:'island',words:16});
  await p.evaluate(()=>{const s=newState();s.hubV=1;delete s.praise;s.map='island';s.x=17;s.y=14;s.inn='island';localStorage.setItem(SAVE_KEY,JSON.stringify({S:s,opt}))});
  await cont();
  assert.deepEqual(await p.evaluate(()=>[S.map,S.x,S.y,S.hubV]),['island',24,13,2]);
  checks.push('Older saves keep their flags, gain words for cleared worlds and resume on the plaza of the new island');
  assert.deepEqual(errors,[]);checks.push('No uncaught errors');
 }finally{fs.writeFileSync('qa/island-report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
