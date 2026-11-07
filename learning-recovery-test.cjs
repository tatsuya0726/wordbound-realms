const {chromium}=require('playwright');
const assert=require('assert/strict'),fs=require('fs'),http=require('http'),path=require('path');
const root=process.cwd();
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(file))});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const checks=[];try{
 browser=await require('./test-quiet.cjs')(chromium,{headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof ANNOUNCE!=='undefined');
 const result=await page.evaluate(()=>{S=newState();return ANNOUNCE.map(a=>{const key='l:'+a.en;const q=qFromKey(key);record(q,false);const before=reviewList().some(([k])=>k===key);record(q,true);record(q,true);return {key,answer:q.choices[q.correct],expected:a.a[0],before,after:reviewList().some(([k])=>k===key),text:q.say};})});
 assert.equal(result.length,3);for(const r of result){assert.equal(r.answer,r.expected);assert.equal(r.before,true);assert.equal(r.after,false);assert.equal(r.key,'l:'+r.text)}checks.push('All three announcements reconstruct, preserve correct answers, and graduate after two correct reviews');
 assert.equal(await page.evaluate(()=>qFromKey('l:unknown-deleted-content')),null);
 for(const kind of ['listen','minimal','announcement']){
  await page.reload();await page.waitForFunction(()=>typeof ANNOUNCE!=='undefined');
  const expected=await page.evaluate(kind=>{S=newState();mode='walk';busy=true;document.body.classList.remove('title-menu');speechSynthesis.getVoices=()=>[];speechSynthesis.speak=()=>{throw Error('Simulated unavailable speech service')};const q=kind==='listen'?qListen(1):kind==='minimal'?qMinimal():qFromKey('l:'+ANNOUNCE[0].en);window.__auditQuiz=quiz(q);return q.say},kind);
  const transcript=page.locator('.listening-transcript');await transcript.waitFor();assert.equal(await transcript.getAttribute('open'),null);await transcript.locator('summary').click();assert.equal(await transcript.locator('p').innerText(),expected);await page.waitForTimeout(200);assert.equal(await page.locator('#opts button').count()>0,true);
 }checks.push('Listening, minimal-pair and announcement prompts offer opt-in transcripts when voices are absent and speech throws');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,errors},null,2));
 }finally{await browser?.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
