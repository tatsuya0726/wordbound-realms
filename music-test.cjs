// Music: the town plays its song after the first tap, battle silences it, the BGM setting turns it off,
// and the settings Credits page lists every registered track with its composer and link.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://l').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true,args:['--autoplay-policy=no-user-gesture-required']}),checks=[],errors=[];
 try{const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(800);
  const tracks=await p.evaluate(()=>Object.entries(MUSIC_TRACKS));for(const [id,t] of tracks){assert.ok(fs.existsSync(t.file),id);assert.ok(t.title&&t.composer&&/^https:\/\//.test(t.site),id)}
  assert.ok(Object.values(await p.evaluate(()=>MAP_MUSIC)).every(id=>tracks.some(t=>t[0]===id)));
  checks.push('Every track has its file, title, composer and credit link; every map points at a registered track');
  await p.evaluate(()=>{S=newState();opt.auto=false;save()});await p.reload();await p.waitForTimeout(400);await p.getByRole('button',{name:/つづきから|Continue/}).click();await p.waitForTimeout(500);
  await p.evaluate(()=>{warp('island',...SPAWN.island);busy=false});await p.mouse.click(5,5);await p.waitForTimeout(1500);
  assert.equal(await p.evaluate(()=>Music.playing),'forgive');checks.push('The town plays Forgive after the first tap');
  await p.evaluate(()=>{run(()=>battle('seedpod_mouse',{keys:['seedpod_mouse']}))});await p.waitForTimeout(2500);assert.equal(await p.evaluate(()=>Music.playing),null);
  await p.evaluate(()=>{nav.done?.('run')});checks.push('Battle silences the town music');
  await p.evaluate(()=>{if(B)endBattle();warp('island',...SPAWN.island);busy=false;opt.bgm=0});await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>Music.playing),null);
  await p.evaluate(()=>{opt.bgm=1});await p.waitForTimeout(800);assert.equal(await p.evaluate(()=>Music.playing),'forgive');checks.push('BGM OFF stops it and turning it back on resumes');
  await p.evaluate(()=>{run(()=>showCredits())});await p.waitForTimeout(500);const credits=await p.locator('#log .credits').textContent();
  for(const [,t] of tracks){assert.ok(credits.includes('曲名「'+t.title+'」'));assert.ok(credits.includes('作曲 '+t.composer));assert.ok(credits.includes(t.site))}
  checks.push('Settings → クレジット shows 曲名「Forgive」 作曲 RYU ITO https://ryu110.com/');
  // Phones refuse play() outside a tap: before any tap the game must not keep retrying (that stalled frames).
  const strict=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true,args:['--autoplay-policy=user-gesture-required']});
  try{const q=await strict.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});q.on('pageerror',e=>errors.push(e.message));
   await q.addInitScript(()=>{window._plays=0;const o=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window._plays++;return o.call(this)}});
   await q.goto('http://127.0.0.1:'+server.address().port);await q.waitForTimeout(600);
   await q.evaluate(()=>{S=newState();opt.auto=false;mode='walk';warp('island',...SPAWN.island);busy=false});await q.waitForTimeout(3000);
   assert.equal(await q.evaluate(()=>window._plays),0);await q.touchscreen.tap(420,150);await q.waitForTimeout(1200);
   assert.equal(await q.evaluate(()=>Music.playing),'forgive');assert.ok(await q.evaluate(()=>window._plays)<=2);
  }finally{await strict.close()}
  checks.push('Before the first tap no play() is attempted; one tap starts the song (no retry loop)');
  assert.ok(fs.statSync('assets/bgm/forgive.mp3').size<3e6);checks.push('Town song is compressed (under 3 MB)');
  assert.deepEqual(errors,[]);checks.push('No uncaught errors');
 }finally{console.log(JSON.stringify({checks,errors},null,1));await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
