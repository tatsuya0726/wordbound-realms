// Screen mode setting: 自動 / スマホ / TV / PC is remembered per device, applies on load, and changes controls and camera.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),checks=[],errors=[];
 try{
  const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(600);
  assert.equal(await p.evaluate(()=>document.body.dataset.screen),'auto');
  const seq=await p.evaluate(()=>[cycleScreenMode(),cycleScreenMode(),cycleScreenMode(),cycleScreenMode()]);
  assert.deepEqual(seq,['phone','tv','pc','auto']);checks.push('The setting cycles 自動 → スマホ → TV → PC → 自動');
  await p.evaluate(()=>{S=newState();opt.auto=false;save()});await p.reload();await p.waitForTimeout(300);await p.getByRole('button',{name:/つづきから/}).click();await p.waitForTimeout(600);
  const look=await p.evaluate(()=>Object.fromEntries(['auto','phone','tv','pc'].map(m=>{setScreenMode(m);return [m,{pad:getComputedStyle(document.getElementById('pad')).display,tile:screenTileFactor()}]})));
  assert.equal(look.pc.pad,'none');assert.equal(look.tv.pad,'none');assert.notEqual(look.phone.pad,'none');
  assert(look.pc.tile<look.auto.tile&&look.phone.tile>look.auto.tile);checks.push('PC and TV hide the touch controls; phone keeps them; PC shows more map, phone a closer view');
  await p.evaluate(()=>setScreenMode('tv'));await p.reload();await p.waitForTimeout(500);
  assert.equal(await p.evaluate(()=>document.body.dataset.screen),'tv');checks.push('The choice is remembered on the device and applies from the title screen');
  await p.getByRole('button',{name:/つづきから/}).click();await p.waitForTimeout(600);
  await p.evaluate(()=>run(settings));await p.getByRole('button',{name:/画面モード: TV/}).waitFor();checks.push('Settings shows the current screen mode');
  await p.evaluate(()=>{localStorage.removeItem('wordbound-screen')});
  assert.deepEqual(errors,[]);checks.push('No uncaught errors');
 }finally{console.log(JSON.stringify({checks,errors},null,2));await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
