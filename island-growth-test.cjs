// Island growth: the island map is 72 x 44; each of the 6 expansion projects waits for its event, the carpenter builds
// it for gold, and its land is joined to the town (every new resident can be reached on foot from the plaza).
// DEBUG「島をすべて解放」opens everything. With SHOT_DIR set, saves a picture of the whole island at its largest.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://l').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const checks=[],errors=[],shots=process.env.SHOT_DIR;
 const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(1000);
  await p.evaluate(()=>{S=newState();opt.auto=false;mode='walk';warp('island',24+ISLE_OX,14,0);busy=false});await p.waitForTimeout(400);
  const before=await p.evaluate(()=>({w:MAPS.island.rows[0].length,h:MAPS.island.rows.length,ready:ISLAND_PROJECTS.filter(p=>p.need()).length,ents:MAPS.island.ents.filter(e=>(!e.cond||e.cond())).length}));
  assert.deepEqual([before.w,before.h,before.ready],[88,44,0]);
  // The carpenter refuses a project whose event has not happened, then builds it once it has.
  const flow=await p.evaluate(async()=>{const said=[];window.say=async(n,en,ja)=>said.push(ja);window.sys=async t=>said.push(t);window.yesno=async()=>true;
   window.ask=async()=>'pier';await carpenterTalk();const refused=!islandBuilt('pier');
   isle().arena.bronze=1;refreshIsland();S.gold=50;await carpenterTalk();const poor=!islandBuilt('pier');
   S.gold=500;await carpenterTalk();return {refused,poor,built:islandBuilt('pier'),gold:S.gold,last:said.at(-1),bridge:MAPS.island.rows[33][24+ISLE_OX]}});
  assert.ok(flow.refused&&flow.poor&&flow.built&&flow.gold===300&&flow.bridge==='B'&&/島が広がった/.test(flow.last),JSON.stringify(flow));
  checks.push('The carpenter refuses before the event and without gold, then builds the pier for 200G and the bridge appears');
  await p.reload();await p.waitForTimeout(900);
  await p.evaluate(()=>{S=newState();opt.auto=false;mode='walk';warp('island',24+ISLE_OX,14,0);busy=false;debugUnlockIsland()});await p.waitForTimeout(300);
  const all=await p.evaluate(()=>{const m=MAPS.island,W=m.rows[0].length,H=m.rows.length,ents=m.ents.filter(e=>!e.cond||e.cond());
   const block=new Set(ents.filter(e=>!e.wander).map(e=>e.x+','+e.y)),seen=new Set([(24+ISLE_OX)+',14']),q=[[24+ISLE_OX,14]];
   while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(seen.has(k)||!WALK.has(tileAt(m,nx,ny))||block.has(k))continue;seen.add(k);q.push([nx,ny])}}
   const near=e=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has((e.x+dx)+','+(e.y+dy)));
   const growth=['Carpenter','Angler','Florist','Orchard Keeper','Market Merchant','Archaeologist','Festival Host','Miller','Village Chief','Shrine Maiden'];
   return {lv:islandLevel(),built:Object.keys(isle().built).length,cells:seen.size,land:m.rows.join('').replace(/[w]/g,'').length,
    unreachable:ents.filter(e=>(growth.includes(e.name)||e.name==='Arena'||e.name==='Beach Trader'||e.name==='Sage')&&!near(e)).map(e=>e.name),
    onBadTile:ents.filter(e=>growth.includes(e.name)&&!WALK.has(tileAt(m,e.x,e.y))).map(e=>e.name+' '+tileAt(m,e.x,e.y))}});
  const ISLAND_COUNT=await p.evaluate(()=>ISLAND_PROJECTS.length);assert.equal(all.lv,5);assert.equal(all.built,ISLAND_COUNT);assert.deepEqual(all.unreachable,[]);assert.deepEqual(all.onBadTile,[]);
  checks.push(`DEBUG unlock: island Lv.5, beach, all ${all.built} areas built; every new resident reachable on foot (${all.cells} walkable cells, ${all.land} land cells of 88x44)`);
  if(shots){const url=await p.evaluate(()=>{window.__townHour=12;window.__townRain=0;const c=ctx.canvas,m=MAPS.island,ow=c.width,oh=c.height,vw=VIEW.w,vh=VIEW.h,of=window.screenTileFactor;
    c.width=m.rows[0].length*32;c.height=m.rows.length*32;VIEW.w=c.width;VIEW.h=c.height;window.screenTileFactor=()=>1/Math.min(c.width/384,c.height/216);let url;
    try{drawFlatWorld(performance.now()+1e6);url=c.toDataURL('image/png')}finally{c.width=ow;c.height=oh;VIEW.w=vw;VIEW.h=vh;window.screenTileFactor=of}return url});
   fs.writeFileSync(path.join(shots,'island-max.png'),Buffer.from(url.split(',')[1],'base64'))}
  assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close()}
 console.log(checks.map(c=>'✓ '+c).join('\n'));
})().catch(e=>{console.error(e);process.exit(1)});
