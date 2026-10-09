const { chromium } = require('playwright');
const fs=require('fs'),http=require('http'),assert=require('assert/strict');
fs.mkdirSync('qa',{recursive:true});
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync('index.html'))});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),headless:true});
 const errors=[],checks=[];
 try{
 const page=await browser.newPage({viewport:{width:1366,height:900}});page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:'+server.address().port;
 await page.goto(url);await page.waitForTimeout(1800);
 await page.screenshot({path:'qa/01-title-desktop.png',fullPage:true});
 // Seed a pre-upgrade save: no streak or new option fields.
 await page.evaluate(()=>{const old=newState();old.job='sage';old.mp=1;old.notebook={'v:apple':{en:'apple',ja:'りんご',type:'vocab',r:0,w:1}};localStorage.setItem(SAVE_KEY,JSON.stringify({S:old,opt:{auto:false,sub:true,rate:.9,tier:0}}))});
 await page.reload();await page.waitForTimeout(350);await page.getByRole('button',{name:/Continue/}).click();
 await page.waitForTimeout(900);
 assert.equal(await page.evaluate(()=>opt.waitAnswer),true);checks.push('Existing save loads and receives new settings defaults');
 await page.screenshot({path:'qa/02-field-desktop.png',fullPage:true});
 // Use the actual command loop: a sage at 1 MP must be able to cast.
 await page.evaluate(()=>{run(()=>battle('blot'))});
 await page.getByRole('button',{name:/Spell/}).waitFor();
 assert.equal(await page.getByRole('button',{name:/Spell/}).isDisabled(),false);
 assert.match(await page.getByRole('button',{name:/Spell/}).textContent(),/MP 1/);
 await page.waitForTimeout(180);await page.getByRole('button',{name:/Spell/}).click();
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>S.mp),0);checks.push('Sage casts at 1 MP, spends exactly 1 MP');
 await page.screenshot({path:'qa/03-battle-grammar.png',fullPage:true});
 // Reset through a normal reload to the field save, then run notebook UI.
 await page.reload();await page.waitForTimeout(300);await page.getByRole('button',{name:/Continue/}).click();
 await page.getByRole('button',{name:'メニュー',exact:true}).click();
 await page.waitForTimeout(180);await page.getByRole('button',{name:/Notebook/}).click();
 await page.waitForTimeout(180);await page.screenshot({path:'qa/04-learning-notebook.png',fullPage:true});
 await page.getByRole('button',{name:/Review quiz/}).click();
 await page.waitForTimeout(200);
 // The apple prompt may be English or Japanese, answer the visible direction.
 const japanese=await page.locator('#log .big').textContent();
 await page.getByRole('button',{name:new RegExp(japanese==='apple'?'りんご':'apple')}).click();
 await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>S.notebook['v:apple'].streak),1);
 await page.getByRole('button',{name:/Next/}).click();await page.waitForTimeout(200);
 assert.match(await page.locator('#log').textContent(),/復習完了/);
 await page.getByRole('button',{name:/Next/}).click();await page.waitForTimeout(200);
 await page.getByRole('button',{name:/Review quiz/}).click();await page.waitForTimeout(200);
 const prompt2=await page.locator('#log .big').textContent();
 await page.getByRole('button',{name:new RegExp(prompt2==='apple'?'りんご':'apple')}).click();await page.waitForTimeout(200);
 await page.getByRole('button',{name:/Next/}).click();await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>reviewList().length),0);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).S.notebook['v:apple'].streak),2);
 checks.push('Notebook review UI: two correct answers graduate a weak word and persist progress');
 assert.equal(await page.evaluate(()=>{record(qVocab(1,VOCAB.find(v=>v[1]==='apple')),false);return reviewList().length}),1);checks.push('New mistake reopens a previously mastered word');
 assert.deepEqual(await page.evaluate(()=>{S.flags={won:1};S.map='village';const a=goal();S.map='dream';const b=goal();S.flags.dtrial1=1;const c=goal();S.flags.dtrial2=1;const d=goal();S.flags.dreamWon=1;return [a,b,c,d,goal()]}),[
 '第2章へ：村の長老オリンに話しかけ、夢の島へ進もう。','西の鏡の賢者（文法）と東のこだまの子（聴解）の試練に挑もう。','東のこだまの子のリスニング試験に合格しよう。','2つの試練に合格！ 島の北端で悪夢の主に挑もう。','夢の島もクリア！ 学習ノートで苦手を復習し、言葉の力を磨こう。']);checks.push('Chapter 2 goals cover entry, both trials and completion');
 await page.reload();await page.waitForTimeout(200);await page.getByRole('button',{name:/New Game/}).click();await page.waitForTimeout(200);
 assert.match(await page.locator('#log').textContent(),/上書き/);await page.getByRole('button',{name:/戻る/}).click();await page.waitForTimeout(200);
 assert.equal(await page.getByRole('button',{name:/Continue/}).isDisabled(),false);checks.push('New game requires overwrite confirmation, cancel preserves save');
 await page.getByRole('button',{name:/Continue/}).click();await page.waitForTimeout(500);
 await page.getByRole('button',{name:'メニュー',exact:true}).click();await page.waitForTimeout(180);await page.getByRole('button',{name:/Journal/}).click();await page.waitForTimeout(200);
 await page.screenshot({path:'qa/05-journal-desktop.png',fullPage:true});
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(url);await mobile.waitForTimeout(500);
 await mobile.evaluate(()=>{S=newState();opt.auto=false;save()});await mobile.reload();await mobile.waitForTimeout(250);await mobile.getByRole('button',{name:/Continue/}).click();await mobile.waitForTimeout(700);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await mobile.locator('#pad').isVisible(),true);
 await mobile.screenshot({path:'qa/06-field-mobile.png',fullPage:true});checks.push('390px touch layout: no horizontal overflow, directional controls visible');
 // Exercise fallback rendering without the external Three.js library.
 const fallback=await browser.newPage();await fallback.route('**/three.min.js',route=>route.abort());await fallback.goto(url);await fallback.waitForTimeout(400);
 assert.equal(await fallback.evaluate(()=>GL.ok),false);checks.push('Boot works without Three.js (2D fallback)');
 assert.deepEqual(errors,[]);checks.push('No uncaught page errors');
 const report={checks,errors,webgl:await page.evaluate(()=>GL.ok)};fs.writeFileSync('qa/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
