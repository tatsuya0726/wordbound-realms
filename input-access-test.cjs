/* Synthetic Gamepad API polling + real browser keyboard regression.
   Does not claim physical-controller, Bluetooth, or television hardware testing. */
const {chromium}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict'),http=require('http'),path=require('path');
(async()=>{
 const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const checks=[];
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<main><button id="one">First</button><button id="two">Second</button><button id="other">Toolbar</button><input id="text"><details><summary id="transcript">Transcript</summary><p>Listen again</p></details></main>');
  await page.evaluate(()=>{
   window.heldDir=-1;window.mode='walk';window.busy=false;window.KDIR={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};
   window.calls={a:0,b:0,other:0};window.nav={btns:[],i:0,done:null};
   window.hl=()=>{};window.navMove=d=>nav.i=(nav.i+d+nav.btns.length)%nav.btns.length;
   window.pressA=()=>{calls.a++;if(nav.done)nav.btns[nav.i].click()};window.pressB=()=>calls.b++;
   window.pads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>pads,configurable:true});
   window.raf=[];window.requestAnimationFrame=fn=>raf.push(fn);
   window.tick=n=>{const fn=raf.shift();if(fn)fn(n)};
   window.pad=(dir=-1,a=false,b=false)=>({index:0,connected:true,mapping:'standard',axes:[dir===1?.8:dir===3?-.8:0,dir===2?.8:dir===0?-.8:0],buttons:Array.from({length:16},(_,i)=>({pressed:i===0?a:i===1?b:false,value:0}))});
   document.getElementById('other').onclick=()=>calls.other++;
  });
  await page.addScriptTag({content:fs.readFileSync('accessible-input.js','utf8')});
  assert.deepEqual(await page.evaluate(()=>{const result=[];for(let d=-1;d<4;d++)result.push(AccessibleInput.direction(pad(d)));return result}),[-1,0,1,2,3]);
  assert.equal(await page.evaluate(()=>{const p=pad();p.axes=[.2,-.2];return AccessibleInput.direction(p)}),-1);
  checks.push('Analog deadzone and all four cardinal directions');
  assert.equal(await page.evaluate(()=>{const p=pad();p.buttons[14].pressed=true;return AccessibleInput.direction(p)}),3);
  checks.push('Standard D-pad decoder');
  assert.equal(await page.evaluate(()=>{pads=[pad(1)];tick(0);return heldDir}),-1);
  assert.equal(await page.evaluate(()=>{pads=[pad()];tick(10);pads=[pad(1)];tick(20);return heldDir}),1);
  assert.equal(await page.evaluate(()=>{pads=[];tick(30);return heldDir}),-1);
  checks.push('Connect while held requires neutral; movement releases on disconnect');
  await page.evaluate(()=>{pads=[pad()];tick(40);pads=[pad(-1,true)];tick(50);tick(60);tick(70)});
  assert.equal(await page.evaluate(()=>calls.a),1);
  await page.evaluate(()=>{pads=[pad()];tick(80);pads=[pad(-1,true)];tick(90)});
  assert.equal(await page.evaluate(()=>calls.a),2);
  checks.push('Confirm is edge-triggered and never repeats while held');
  await page.evaluate(()=>{pads=[pad()];tick(100);nav.btns=[document.getElementById('one'),document.getElementById('two')];nav.done=()=>{};tick(110);pads=[pad(2)];tick(120)});
  assert.equal(await page.evaluate(()=>nav.i),1);
  await page.evaluate(()=>tick(300));assert.equal(await page.evaluate(()=>nav.i),1);
  await page.evaluate(()=>tick(501));assert.equal(await page.evaluate(()=>nav.i),0);
  checks.push('Menu navigation initial delay and repeat cadence');
  await page.focus('#two');assert.equal(await page.evaluate(()=>nav.i),1);
  await page.keyboard.press('ArrowUp');assert.equal(await page.evaluate(()=>document.activeElement.id),'one');
  await page.focus('#other');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>calls.other),1);assert.equal(await page.evaluate(()=>calls.a),2);
  checks.push('Tab focus synchronizes selection; toolbar Enter does not activate game menu');
  await page.focus('#transcript');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.querySelector('details').open),true);
  assert.equal(await page.evaluate(()=>calls.a),2);
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>document.querySelector('details').open),false);
  assert.equal(await page.evaluate(()=>calls.a),2);
  checks.push('Transcript summary Enter/Space toggles disclosure without confirming a game choice');
  await page.focus('#text');await page.evaluate(()=>{pads=[pad()];tick(600);pads=[pad(2,true)];tick(610)});
  assert.equal(await page.evaluate(()=>calls.a),2);assert.equal(await page.evaluate(()=>heldDir),-1);
  checks.push('Text entry cannot move or confirm behind the form');
  await page.evaluate(()=>{document.activeElement.blur();nav.done=null;pads=[pad()];tick(700);tick(701);pads=[pad(3)];tick(710);window.dispatchEvent(new Event('blur'));tick(720)});
  assert.equal(await page.evaluate(()=>heldDir),-1);
  await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));tick(730)});assert.equal(await page.evaluate(()=>heldDir),-1);
  await page.evaluate(()=>{pads=[pad()];tick(740);pads=[pad(3)];tick(750)});assert.equal(await page.evaluate(()=>heldDir),3);
  checks.push('Blur stops movement; focus regain requires controller neutral');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));tick(751)});
  assert.equal(await page.evaluate(()=>heldDir),-1);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));tick(752)});
  assert.equal(await page.evaluate(()=>heldDir),-1);
  checks.push('Hidden document releases input and requires neutral on return');
  await page.evaluate(()=>{pads=[];tick(760);const dialog=document.createElement('section');dialog.setAttribute('aria-modal','true');dialog.innerHTML='<button id="close" data-do="close">Close</button><button id="dialogChoice">Choice</button>';document.body.append(dialog);document.getElementById('close').onclick=()=>dialog.remove();document.getElementById('close').focus();pads=[pad()];tick(770);tick(780);pads=[pad(2)];tick(790)});
  assert.equal(await page.evaluate(()=>document.activeElement.id),'dialogChoice');
  await page.evaluate(()=>{pads=[pad()];tick(800);pads=[pad(-1,false,true)];tick(810)});
  assert.equal(await page.locator('[aria-modal]').count(),0);
  checks.push('Controller navigates visible modal controls and closes with B');
  assert.deepEqual(errors,[]);checks.push('No uncaught browser errors in synthetic tests');
  const server=http.createServer((req,res)=>{
   const file=path.resolve('.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));
   if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
   res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'text/html; charset=utf-8');
   if(path.basename(file)==='index.html'){
    let html=fs.readFileSync(file,'utf8');
    if(!html.includes('src="accessible-input.js"'))html=html.replace('</html>','<script src="accessible-input.js"></script></html>');
    return res.end(html);
   }
   fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
   const game=await browser.newPage();game.on('pageerror',e=>errors.push(e.message));
   await game.goto('http://127.0.0.1:'+server.address().port);await game.waitForTimeout(500);
   await game.evaluate(()=>{nav.btns[nav.btns.length-1].focus()});
   assert.equal(await game.evaluate(()=>nav.i),await game.evaluate(()=>nav.btns.length-1));
   await game.keyboard.press('Enter');
   await game.locator('.profile-modal').waitFor();
   const name=game.locator('.profile-modal input');await name.fill('Input test');await game.keyboard.press('ArrowLeft');
   assert.equal(await name.inputValue(),'Input test');
   await game.keyboard.press('Escape');await game.locator('.profile-modal').waitFor({state:'detached'});
   await game.waitForTimeout(200);
   await game.evaluate(()=>{S=newState();opt.auto=false;save()});await game.reload();await game.waitForTimeout(300);
   await game.getByRole('button',{name:/つづきから/}).click();await game.waitForTimeout(500);
   await game.keyboard.down('ArrowRight');assert.equal(await game.evaluate(()=>heldDir),1);
   await game.keyboard.up('ArrowRight');assert.equal(await game.evaluate(()=>heldDir),-1);
   await game.evaluate(()=>run(openWorldAtlas));await game.locator('#atlas').waitFor({state:'visible'});
   await game.keyboard.press('ArrowLeft');assert.equal(await game.evaluate(()=>heldDir),-1);
   await game.keyboard.press('Escape');await game.locator('#atlas').waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);
   checks.push('Real game: focused title option opens profile; editable profile and Escape work; exploration arrows and atlas isolation remain intact');
  }finally{await new Promise(resolve=>server.close(resolve));}
  console.log(JSON.stringify({checks,hardware:'Synthetic Gamepad API samples only; physical hardware not tested'},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
