// Music (ABYSS DECK-style): the town song plays after the tap-to-start, battle silences it, it pauses as soon as the
// page is hidden (another app, lock screen) and resumes on return, the 音量設定 sliders and BGMを聞く work, and the
// Credits page lists every registered track.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://l').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
const setHidden=(p,hidden)=>p.evaluate(h=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>h});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>h?'hidden':'visible'});document.dispatchEvent(new Event('visibilitychange'))},hidden);
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const checks=[],errors=[];
 const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true,args:['--autoplay-policy=user-gesture-required']});
 try{const p=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.__skipTapStart=false;window._plays=0;const o=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window._plays++;return o.call(this)}});
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(1200);
  const tracks=await p.evaluate(()=>Object.entries(MUSIC_TRACKS));for(const [id,t] of tracks){assert.ok(fs.existsSync(t.file),id);assert.ok(t.title&&t.composer&&/^https:\/\//.test(t.site)&&t.gain>0&&t.gain<=1,id)}
  assert.ok(Object.values(await p.evaluate(()=>MAP_MUSIC)).every(id=>tracks.some(t=>t[0]===id)));assert.ok(fs.statSync('assets/bgm/forgive.mp3').size<3e6);
  checks.push('Every track has its file (compressed), title, composer, credit link and loudness trim; every map points at a registered track');
  assert.equal(await p.locator('#tapStart').count(),1);assert.equal(await p.evaluate(()=>window._plays),0);
  await p.locator('#tapStart').tap();await p.waitForTimeout(600);assert.equal(await p.locator('#tapStart').count(),0);
  await p.evaluate(()=>{S=newState();opt.auto=false;mode='walk';warp('island',...SPAWN.island);busy=false});await p.waitForTimeout(2200);
  assert.equal(await p.evaluate(()=>Music.playing),'forgive');let st=await p.evaluate(()=>Music.state);assert.ok(st.webAudio&&st.context==='running'&&st.time>0,JSON.stringify(st));
  assert.ok(await p.evaluate(()=>window._plays)<=2);
  checks.push('Tap-to-start, then the town song plays by itself through the BGM bus (no play() before the tap, no retry loop)');
  await setHidden(p,true);await p.waitForTimeout(400);st=await p.evaluate(()=>Music.state);assert.ok(st.paused,JSON.stringify(st));assert.equal(await p.evaluate(()=>Music.playing),null);
  await p.waitForTimeout(800);assert.ok((await p.evaluate(()=>Music.state)).paused);
  await setHidden(p,false);await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>Music.playing),'forgive');
  checks.push('Switching to another app (page hidden) pauses the music at once; coming back resumes it');
  await p.evaluate(()=>{run(()=>battle('seedpod_mouse',{keys:['seedpod_mouse']}))});await p.waitForTimeout(2600);assert.equal(await p.evaluate(()=>Music.playing),null);
  await p.evaluate(()=>{nav.done?.('run');if(B)endBattle();warp('island',...SPAWN.island);busy=false});await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>Music.playing),'forgive');
  checks.push('Battle silences the town song; returning to town brings it back');
  await p.evaluate(()=>{run(()=>openAudioSettings())});await p.waitForTimeout(300);assert.equal(await p.locator('#audioSettings input[type=range]').count(),2);
  await p.locator('#bgmVolume').fill('0');await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>Music.playing),null);
  await p.locator('#bgmVolume').fill('70');await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>Music.playing),'forgive');
  await p.locator('#audioClose').click();assert.equal(await p.locator('#audioSettings').count(),0);
  assert.equal(JSON.parse(await p.evaluate(()=>localStorage.getItem('wordbound-audio-prefs'))).bgm,.7);
  checks.push('音量設定: BGM and 効果音 sliders, 0% stops the song, the level is saved');
  await p.evaluate(()=>{run(()=>openMusicGallery())});await p.waitForTimeout(300);await p.locator('#musicGallery [data-track=forgive]').click();await p.waitForTimeout(800);
  assert.equal(await p.evaluate(()=>Music.playing),'forgive');assert.match(await p.locator('#musicGallery').textContent(),/Forgive.*作曲 RYU ITO/);
  await p.locator('#musicGallery .music-gallery-close').click();await p.waitForTimeout(800);assert.equal(await p.locator('#musicGallery').count(),0);assert.equal(await p.evaluate(()=>Music.playing),'forgive');
  checks.push('BGMを聞く lists and plays every song; closing returns to the scene music');
  await p.evaluate(()=>{run(()=>showCredits())});await p.waitForTimeout(500);const credits=await p.locator('#log .credits').textContent();
  for(const [,t] of tracks){assert.ok(credits.includes('曲名「'+t.title+'」'));assert.ok(credits.includes('作曲 '+t.composer));assert.ok(credits.includes(t.site))}
  checks.push('Settings → クレジット shows 曲名「Forgive」 作曲 RYU ITO https://ryu110.com/');
  assert.deepEqual(errors,[]);checks.push('No uncaught errors');
 }finally{console.log(JSON.stringify({checks,errors},null,1));await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
