// Skill effects (skill-fx.js): every skill has a visual; casting and drawing every one raises no error,
// party help lights up roster cards, and damage numbers wait for the effect to land.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://l').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),checks=[],errors=[];
 try{const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(900);
  await p.evaluate(()=>{S=newState();opt.auto=false;mode='walk';for(const m of S.companions.owned){m.lv=99;CR.health(m,CD.species)}warp('meadow',...SPAWN.meadow);busy=false;run(()=>battle('seedpod_mouse',{keys:['sprout_ear_mole']}))});await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{const kinds={},ally=S.companions.owned[0],enemy=B.enemies[0],out={unknown:[]};
   for(const k of Object.values(SKILL_CATALOG)){const look=SkillFX.hitKind(k);kinds[look.kind]=(kinds[look.kind]||0)+1;if(!SkillFX.DRAW[look.kind])out.unknown.push(k.id);
    const parts=k.effects||[{effect:k.effect}],kind=parts[0].effect,toAlly=['ally','allAllies','self','fallenAlly'].includes(k.target);
    const evs=parts.map(p=>({target:toAlly?ally:enemy,kind:['damage','allDamage','drain'].includes(p.effect)?'damage':p.effect,value:5}));SkillFX.cast(k,evs,ally)}
   out.kinds=kinds;out.queued=SkillFX.active;out.cards=Object.keys(B.allyFxMap||{}).length;out.lead=SkillFX.cast(SKILL_CATALOG.ember,[{target:enemy,kind:'damage',value:5}],ally);return out});
  assert.deepEqual(r.unknown,[]);assert.ok(r.queued>100,String(r.queued));assert.ok(r.cards>=1);assert.ok(r.lead>=250);
  checks.push('Every skill ('+Object.values(r.kinds).reduce((a,b)=>a+b,0)+') maps to a drawn effect: '+Object.entries(r.kinds).map(([k,n])=>k+n).join(' '));
  await p.waitForTimeout(1600);assert.deepEqual(errors,[]);assert.equal(await p.evaluate(()=>SkillFX.active),0);
  checks.push('All queued effects play out and clear without errors; elemental shots delay the damage numbers until they land');
  const card=await p.evaluate(async()=>{const ally=S.companions.owned[0];SkillFX.cast(SKILL_CATALOG.sprout_heal,[{target:ally,kind:'heal',value:9}],ally);await new Promise(r=>setTimeout(r,120));updateBattleRoster();return document.querySelector('#battleRoster .ally-heal')!==null});
  assert.ok(card);checks.push('Healing lights the ally card in the roster');assert.deepEqual(errors,[]);checks.push('No uncaught errors');
 }finally{console.log(JSON.stringify({checks,errors},null,1));await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
