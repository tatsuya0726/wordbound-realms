const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const server=http.createServer((req,res)=>{const f=path.resolve('.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(f));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.getByRole('button',{name:/はじめから/}).waitFor();
for(const patch of [{map:'missing'},{flags:[]},{items:null},{companions:{version:1}}]){
 await page.evaluate(patch=>localStorage.setItem(SAVE_KEY,JSON.stringify({S:{...newState(),...patch},opt})),patch);
 await page.reload();await page.getByRole('button',{name:/再読み込みを試す/}).waitFor();assert.equal(await page.getByRole('button',{name:/はじめから/}).count(),0);
 assert.equal(await page.evaluate(()=>mode),'title');assert.equal(await page.evaluate(()=>S),null);
}
await page.evaluate(()=>{const old=newState();old.gold=123;delete old.companions;delete old.worldV;delete old.hubV;localStorage.setItem(SAVE_KEY+'-previous',JSON.stringify({S:old,opt:{auto:false}}));localStorage.setItem(SAVE_KEY,'broken-json');});
await page.reload();await page.getByRole('button',{name:/前回の控えから復元/}).waitFor();assert.equal(await page.getByRole('button',{name:/はじめから/}).count(),0);
assert.equal(await page.evaluate(()=>{S=newState();return save();}),false);assert.equal(await page.evaluate(()=>localStorage.getItem(SAVE_KEY)),'broken-json');
async function click(name){const b=page.getByRole('button',{name:new RegExp(name)});await b.waitFor();await page.waitForTimeout(220);await b.click();}
fs.mkdirSync('qa/polish',{recursive:true});
async function visibleRecovery(label){
 const log=page.locator('#log');assert.equal(await log.isVisible(),true,label+' explanation visible');
 const result=await page.evaluate(()=>{const nodes=[...document.querySelectorAll('#log p,#opts button')].filter(n=>getComputedStyle(n).display!=='none');return nodes.map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent,visible:r.width>0&&r.height>0&&r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};});});
 assert.ok(result.length>=2);assert.ok(result.every(n=>n.visible),label+' text and controls fit: '+JSON.stringify(result));
 await page.screenshot({path:'qa/polish/recovery-'+label+'.png'});
}
for(const [name,width,height] of [['landscape',844,390],['portrait',390,844]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(200);
 await visibleRecovery(name+'-error');
 await click('前回の控えから復元');await visibleRecovery(name+'-confirm');
 assert.equal(await page.locator('#log .ja').isVisible(),true);
 await click('戻る');await page.getByRole('button',{name:/前回の控えから復元/}).waitFor();
}
await page.setViewportSize({width:844,height:390});
await click('前回の控えから復元');await click('戻る');await page.getByRole('button',{name:/前回の控えから復元/}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem(SAVE_KEY)),'broken-json');
await click('再読み込みを試す');await page.getByRole('button',{name:/前回の控えから復元/}).waitFor();
await click('前回の控えから復元');await click('控えから復元');await visibleRecovery('landscape-success');await click('Next ▼');assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('save-recovery')),false);await click('つづきから');await page.waitForFunction(()=>mode==='walk');
assert.equal(await page.evaluate(()=>S.gold),123);assert.equal(await page.evaluate(()=>localStorage.getItem(SAVE_KEY+'-unreadable')),'broken-json');assert.ok(await page.evaluate(()=>S.companions.owned.length>0));
const quota=await page.evaluate(()=>{const before=JSON.stringify(S),raw=localStorage.getItem(SAVE_KEY),setter=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('test quota');};try{return {save:save(),transaction:commitCompanionChange(s=>s.gold++),same:JSON.stringify(S)===before,raw:localStorage.getItem(SAVE_KEY)===raw,status:document.getElementById('saveStatus').textContent};}finally{Storage.prototype.setItem=setter;}});
assert.equal(quota.save,false);assert.equal(quota.transaction,false);assert.equal(quota.same,true);assert.equal(quota.raw,true);assert.match(quota.status,/保存できません/);assert.deepEqual(errors,[]);
console.log('PASS browser recovery: corrupt-save start blocked, rejected overwrite, cancel/retry, explicit restore, preserved original, historical save migration, quota rollback, failure status, no page errors');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
