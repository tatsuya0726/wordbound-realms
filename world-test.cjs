// World expansion checks: traced overworld integrity, reachability, every new place renders, events, save migration.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),checks=[],errors=[];
 try{
  fs.mkdirSync('qa',{recursive:true});
  const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:'+server.address().port;await p.goto(url);await p.waitForTimeout(800);
  await p.evaluate(()=>{S=newState();opt.auto=false;save()});await p.reload();await p.waitForTimeout(300);
  await p.getByRole('button',{name:/つづきから|Continue/}).click();await p.waitForTimeout(700);

  const layout=await p.evaluate(()=>{const w=MAPS.world,bad=[];
   const walk=(m,x,y)=>WALK.has(tileAt(m,x,y));
   for(const [k,[x,y]] of Object.entries(WORLD_POI))if(k!=='I'&&!walk(w,x,y))bad.push('poi '+k);
   for(const [id,m] of Object.entries(MAPS)){if(!MAPLOOK[id])bad.push('look '+id);
    for(const e of m.ents.filter(e=>!e.cond||e.cond())){if(e.x<0||e.y<0||e.y>=m.rows.length||e.x>=m.rows[0].length)bad.push('out '+id+' '+(e.name||e.prop||e.chest||e.boss));
     const t=tileAt(m,e.x,e.y);if(!WALK.has(t)&&t!=='c')bad.push('ent '+id+' '+(e.name||e.prop||e.chest||e.boss)+' on '+t)}}
   for(const [id,[x,y]] of Object.entries(SPAWN))if(MAPS[id]&&!walk(MAPS[id],x,y))bad.push('spawn '+id);
   for(const [id,[x,y]] of Object.entries(INNS))if(!walk(MAPS[id],x,y))bad.push('inn '+id);
   // Reachability from the village gate on foot, with the great bridge closed and open.
   const reach=open=>{const [sx,sy]=WORLD_POI.V,seen=new Set([sx+','+sy]),q=[[sx,sy]];
    while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(seen.has(k))continue;
     const t=tileAt(w,nx,ny);if(!WALK.has(t)||(!open&&t==='B'))continue;seen.add(k);q.push([nx,ny])}}
    return Object.fromEntries(Object.entries(WORLD_POI).map(([k,[x,y]])=>[k,seen.has(x+','+y)]))};
   return {w:w.rows[0].length,h:w.rows.length,bad,closed:reach(false),open:reach(true)}});
  assert.equal(layout.w,64);assert.equal(layout.h,36);assert.deepEqual(layout.bad,[]);
  for(const k of ['V','P','C','G','H'])assert(layout.closed[k],'west '+k);
  for(const k of ['K','A','Y','R','O','X'])assert(!layout.closed[k],'gated '+k);
  for(const k of ['V','P','C','G','H','K','A','Y','R','O','X'])assert(layout.open[k],'reach '+k);
  checks.push('Overworld is 64x36, landmarks/NPCs/spawns sit on walkable tiles, the great bridge gates the east, every landmark is reachable');

  for(const id of ['castle','ashfield','oasis','lighthouse','grove','shrine','ruins','volcano','world']){
   await p.evaluate(id=>{const s=SPAWN[id]||[WORLD_POI.V[0],WORLD_POI.V[1]+1,2];warp(id,...s)},id);await p.waitForTimeout(450);
   if(['castle','grove','volcano','world'].includes(id))await p.screenshot({path:'qa/world-'+id+'.png'})}
  assert.deepEqual(errors,[]);checks.push('Every new place is drawn without errors');

  // Entering from the overworld, the bridge gate, and quest bookkeeping.
  const ev=await p.evaluate(async()=>{const r={};
   const [kx,ky]=WORLD_POI.K;warp('world',kx,ky+1,0);S.x=kx;S.y=ky;onArrive();r.castle=S.map;
   warp('world',...WORLD_POI.V,2);S.flags.q_harvest=1;S.flags.metKing=1;r.quests=QUESTS.filter(q=>questDone(q.id)).length;
   r.zone=(S.x=40,S.y=25,worldZone(40,25));r.goal=goal();return r});
  assert.equal(ev.castle,'castle');assert.equal(ev.quests,1);assert.equal(ev.zone,'desert');assert.match(ev.goal,/長老/);
  checks.push('Landmarks warp to their maps; side quests are tracked; desert encounters use the desert zone');

  // Atlas pins: discovered places appear on the painted map.
  await p.evaluate(()=>{S.flags.seen_castle=1;warp('world',...WORLD_POI.V,2);busy=false});await p.waitForTimeout(300);
  // The world map opens from Kiki and Nene's 相談 menu (the separate 世界地図 button was removed).
  await p.getByRole('button',{name:'キキとネネに相談'}).click();await p.getByRole('button',{name:/三層の世界地図/}).waitFor();await p.waitForTimeout(250);
  await p.getByRole('button',{name:/三層の世界地図/}).click();await p.locator('#atlas').waitFor();await p.waitForTimeout(500);
  const pins=await p.locator('#atlasMarks .atlas-mark').allTextContents();assert(pins.includes('王都ルミナ')&&pins.includes('こもれびの村'));
  assert.equal(await p.locator('#atlasMarks .atlas-here').count(),1);await p.screenshot({path:'qa/world-atlas.png'});
  await p.getByRole('button',{name:'王都ルミナ'}).click();await p.click('#atlasEnter');await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>S.map),'castle');checks.push('World map shows the hero and discovered places and travels to a picked place');

  // Old saves standing on the former 40x26 overworld are moved to the village gate.
  await p.evaluate(()=>{const s=newState();delete s.worldV;delete s.hubV;delete s.island;s.map='world';s.x=33;s.y=4;localStorage.setItem(SAVE_KEY,JSON.stringify({S:s,opt}))});
  await p.reload();await p.waitForTimeout(300);await p.getByRole('button',{name:/つづきから|Continue/}).click();await p.waitForTimeout(300);
  const mig=await p.evaluate(()=>[S.map,S.worldV,S.hubV]);assert.deepEqual(mig,['island',2,2]);
  checks.push('Saves from the old overworld resume safely (now on the island hub)');
  assert.deepEqual(errors,[]);checks.push('No uncaught errors');
 }finally{fs.writeFileSync('qa/world-report.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
