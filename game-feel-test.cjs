// Answer reveal, in-a-row badge and sound hooks (game-feel.js). Audio output is muted by test-quiet.cjs;
// GameSfx.log records which sounds were requested, so this checks the hooks, not what is heard.
const { chromium } = require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{const file=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html')));if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file))});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await require('./test-quiet.cjs')(chromium,{...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true});
 const errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}});page.on('pageerror',e=>errors.push(e.message));
  const external=[];page.on('request',r=>{if(/three(\.min)?\.js/.test(r.url()))external.push(r.url())});
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForTimeout(1200);
  assert.deepEqual(external,[]);assert.equal(await page.evaluate(()=>typeof THREE),'undefined');checks.push('The unused 3D library is no longer downloaded');
  assert.match(await page.evaluate(()=>OpeningArt.sources.join()),/title-0\.webp/);
  await page.waitForFunction(()=>document.getElementById('titleArt').dataset.artState==='ready',null,{timeout:8000});checks.push('Title art loads as WebP');
  await page.evaluate(()=>{S=newState();opt.auto=false;opt.waitAnswer=true;save()});await page.reload();await page.waitForTimeout(400);
  await page.getByRole('button',{name:/つづきから/}).click();await page.waitForTimeout(600);
  // A wrong answer: the pick turns red, the right choice green, and the result is recorded at once.
  await page.evaluate(()=>{window._Q=qVocab(1);run(async()=>{window._r1=await quiz(window._Q)})});
  await page.locator('#opts .opt').first().waitFor();await page.waitForTimeout(200);
  const wrong=await page.evaluate(()=>(window._Q.correct+1)%4);
  await page.locator('#opts .opt').nth(wrong).click();
  const marks=await page.evaluate(()=>({ok:[...document.querySelectorAll('#opts .opt')].findIndex(b=>b.classList.contains('ans-ok')),ng:[...document.querySelectorAll('#opts .opt')].findIndex(b=>b.classList.contains('ans-ng')),revealing:document.getElementById('opts').classList.contains('revealing'),wrong:S.stats.wrong,streak:quizStreak,correct:window._Q.correct}));
  assert.equal(marks.ok,marks.correct);assert.equal(marks.ng,wrong);assert.equal(marks.revealing,true);assert.equal(marks.wrong,1);assert.equal(marks.streak,0);
  assert.equal(await page.evaluate(()=>GameSfx.log.at(-1)),'wrong');checks.push('Wrong answer: pick marked red, right choice green, recorded immediately, miss sound requested');
  await page.getByRole('button',{name:/Next/}).click();await page.waitForFunction(()=>window._r1===false);
  assert.equal(await page.evaluate(()=>document.getElementById('opts').classList.contains('revealing')),false);
  // Two right answers in a row: the badge appears on the second.
  for(const n of [1,2]){
   await page.evaluate(()=>{window._Q=qVocab(1);window._r2=undefined;run(async()=>{window._r2=await quiz(window._Q)})});
   await page.locator('#opts .opt').first().waitFor();await page.waitForTimeout(200);
   await page.locator('#opts .opt').nth(await page.evaluate(()=>window._Q.correct)).click();
   assert.equal(await page.locator('#opts .opt.ans-ng').count(),0);assert.equal(await page.locator('#opts .opt.ans-ok').count(),1);
   await page.getByRole('button',{name:/Next/}).waitFor();
   assert.equal(await page.locator('#log .streak').count(),n===2?1:0);
   if(n===2)assert.match(await page.locator('#log .streak').textContent(),/2問連続/);
   assert.equal(await page.evaluate(()=>GameSfx.log.at(-1)),'correct');
   await page.getByRole('button',{name:/Next/}).click();await page.waitForFunction(()=>window._r2===true)}
  checks.push('Right answers: marked green, chime requested, 「2問連続！」 badge on the second in a row');
  // Keyboard number keys answer too, and are ignored during the reveal.
  await page.evaluate(()=>{window._Q=qVocab(1);run(async()=>{window._r3=await quiz(window._Q)})});
  await page.locator('#opts .opt').first().waitFor();await page.waitForTimeout(200);
  const right=await page.evaluate(()=>window._Q.correct),before=await page.evaluate(()=>S.stats.right);
  await page.keyboard.press('Digit'+(right+1));await page.keyboard.press('Digit'+((right+1)%4+1));await page.keyboard.press('Enter');
  await page.getByRole('button',{name:/Next/}).waitFor();assert.equal(await page.evaluate(()=>S.stats.right),before+1);assert.equal(await page.evaluate(()=>S.stats.wrong),1);
  await page.getByRole('button',{name:/Next/}).click();await page.waitForFunction(()=>window._r3===true);checks.push('An answer is counted once; extra key presses during the reveal are ignored');
  // Battle: hits, a defeat and the victory jingle follow the battle state.
  await page.evaluate(()=>{GameSfx.log.length=0;opt.waitAnswer=false;quiz=async()=>true;run(()=>battle('blot',{keys:['blot']}))});
  await page.waitForFunction(()=>!!B,null,{timeout:8000});
  for(let i=0;i<8&&await page.evaluate(()=>!!B);i++){
   await page.getByRole('button',{name:/呪文/}).waitFor({timeout:8000}).catch(()=>{});if(!await page.evaluate(()=>!!B))break;
   await page.waitForTimeout(180);await page.getByRole('button',{name:/呪文/}).click();await page.getByRole('button',{name:/ことばの光/}).waitFor();await page.waitForTimeout(180);await page.getByRole('button',{name:/ことばの光/}).click();
   await page.waitForFunction(()=>!B||B.commandReady,null,{timeout:10000})}
  await page.waitForFunction(()=>!B,null,{timeout:10000});
  const log=await page.evaluate(()=>[...GameSfx.log]);
  for(const name of ['encounter','hit','defeat','victory'])assert.ok(log.includes(name),name+' in '+log.join());
  assert.ok(log.indexOf('encounter')<log.indexOf('hit')&&log.indexOf('defeat')<log.indexOf('victory'));checks.push('Battle requests encounter, hit, defeat and victory sounds in order');
  // Sound names all resolve, and a muted 効果音 slider or a broken audio context never throws.
  assert.equal(await page.evaluate(()=>{Music.setVolume('sfx',0);return GameSfx.names.map(n=>GameSfx.play(n)).some(Boolean)}),false);
  assert.equal(await page.evaluate(()=>{Music.setVolume('sfx',.5);return GameSfx.names.every(n=>typeof GameSfx.play(n,{at:performance.now()+50,combo:9})==='boolean')&&GameSfx.play('nope')===false}),true);
  checks.push('効果音 at 0 plays nothing; every sound name can be requested without errors');
  assert.deepEqual(errors,[]);checks.push('No uncaught page errors');
  fs.mkdirSync('qa',{recursive:true});fs.writeFileSync('qa/game-feel-report.json',JSON.stringify({checks},null,2));console.log(JSON.stringify({checks},null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
