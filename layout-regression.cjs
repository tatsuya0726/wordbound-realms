// Layout regression: choice lists never squeeze two-line choices (monster cards, scout words) into each other,
// long lists pin their back choice, and battles open with the encounter transition.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://l').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
const spills=`(()=>{const bad=[];for(const o of document.querySelectorAll('#opts .opt')){if(o.classList.contains('sticky-back'))continue;const r=o.getBoundingClientRect();for(const c of o.querySelectorAll('*')){const q=c.getBoundingClientRect();if(q.height&&(q.bottom>r.bottom+2||q.top<r.top-2))bad.push(o.textContent.trim().slice(0,20))}}return [...new Set(bad)]})()`;
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),checks=[],errors=[];
 try{const p=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(900);
  await p.evaluate(()=>{S=newState();opt.auto=false;learnWords(['sweet','brave','fast','cute','strong','smart','gentle']);for(const id of ['silk_leaf_caterpillar','thunder_feather_owlet','tiny_moss_pangolin','clover_cheek_hamster','lotus_root_sproutling','autumn_red_panda','acorn_tail_squirrel'])CR.add(S.companions,id,CD.species);save()});
  await p.reload();await p.waitForTimeout(400);await p.getByRole('button',{name:/つづきから|Continue/}).click();await p.waitForTimeout(600);
  await p.evaluate(()=>{warp('i_hut',...(SPAWN.i_hut||[5,5]));busy=false;run(()=>breeding())});await p.waitForTimeout(900);
  assert.deepEqual(await p.evaluate(spills),[]);assert.equal(await p.locator('#opts .opt.sticky-back').count(),1);
  const stuck=await p.evaluate(async()=>{const o=document.getElementById('opts');o.scrollTop=0;const a=document.querySelector('.sticky-back').getBoundingClientRect().bottom;return Math.abs(a-o.getBoundingClientRect().bottom)<20});assert.ok(stuck);
  checks.push('Breeding list: monster cards keep their two lines inside their own card; Cancel stays pinned at the bottom');
  await p.evaluate(()=>{nav.done?.(null);warp('meadow',...SPAWN.meadow);busy=false;run(()=>battle('seedpod_mouse',{keys:['seedpod_mouse']}))});
  await p.waitForTimeout(250);assert.equal(await p.locator('#encounterFx').count(),1);await p.waitForTimeout(1600);assert.equal(await p.locator('#encounterFx').count(),0);
  checks.push('Encounters open with the transition overlay, which clears once the battle is shown');
  for(let k=0;k<20&&!(await p.locator('#opts .opt',{hasText:'スカウト'}).count());k++)await p.waitForTimeout(300);
  await p.waitForTimeout(400);await p.locator('#opts .opt',{hasText:'スカウト'}).first().click();await p.waitForTimeout(700);
  assert.deepEqual(await p.evaluate(spills),[]);assert.ok(await p.locator('#opts .opt',{hasText:'sweet'}).count());
  checks.push('Scout words: each English word and its Japanese meaning stay in the same choice');
  assert.deepEqual(errors,[]);checks.push('No uncaught errors');
 }finally{console.log(JSON.stringify({checks,errors},null,1));await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});

