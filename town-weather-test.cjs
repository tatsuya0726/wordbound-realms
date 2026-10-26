// Town colour and weather: houses differ in roof and wall colour, market stalls and bunting brighten the plaza,
// the day turns through evening and night (lit windows and lamps) and showers fall, with no page errors.
// Screenshots go to $SHOT_DIR when it is set.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://l').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const checks=[],errors=[],shots=process.env.SHOT_DIR;
 const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(1000);
  await p.evaluate(()=>{S=newState();opt.auto=false;mode='walk';warp('island',24+ISLE_OX,14,0);busy=false});await p.waitForTimeout(800);
  const info=await p.evaluate(()=>{const m=MAPS.island,all=townBuildings(m);all.forEach(x=>townBuildingCanvas(x,m));const b=all.filter(b=>b.kind==='house'||b.kind==='house2');
   const stalls=[[18,10],[19,10],[30,10],[31,10]].map(([x,y])=>[x+ISLE_OX,y]);return {roofs:new Set(b.map(x=>x.roof)).size,walls:new Set(townBuildings(m).filter(x=>x.wall).map(x=>x.wall)).size,
    stalls:stalls.every(([x,y])=>tileAt(m,x,y)==='c'),free:stalls.every(([x,y])=>!m.ents.some(e=>e.x===x&&e.y===y)),bunting:townBuntingLines(m).length}});
  assert.ok(info.roofs>=3&&info.walls>=3,JSON.stringify(info));assert.ok(info.stalls&&info.free,JSON.stringify(info));assert.ok(info.bunting>=2,JSON.stringify(info));
  checks.push(`Homes use ${info.roofs} roof and ${info.walls} wall colours; 2 new market stalls on free plaza cells; ${info.bunting} bunting lines between lamps`);
  const c=await p.evaluate(()=>{const out=[];for(const h of [12,18,23,5.5]){window.__townHour=h;out.push(townClock())}window.__townHour=12;window.__townRain=1;out.push(townClock());return out});
  assert.equal(c[0].dark,0);assert.ok(c[1].eve>.8);assert.equal(c[2].dark,1);assert.ok(c[3].eve>.4);assert.equal(c[4].rain,1);
  const auto=await p.evaluate(()=>{delete window.__townHour;delete window.__townRain;const real=Date.now,hours=new Set(),rains=[];for(let t=0;t<TOWN_DAY_MS*3;t+=TOWN_DAY_MS/48){Date.now=()=>1.7e12+t;const k=townClock();hours.add(townPhaseName(k));rains.push(k.rain)}Date.now=real;return {phases:[...hours],rain:rains.some(r=>r>.9),dry:rains.some(r=>r===0)}});
  assert.ok(['昼','夕方','夜'].every(x=>auto.phases.includes(x))&&auto.rain&&auto.dry,JSON.stringify(auto));
  checks.push('The clock turns day, evening, night and morning by itself and showers come and go ('+auto.phases.join('・')+')');
  const mean=async()=>p.evaluate(()=>{const c=ctx.canvas,d=ctx.getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=40)s+=d[i]+d[i+1]+d[i+2];return s/(d.length/40)/3});
  const look={};for(const [name,h,r] of [['day',12,0],['evening',18,0],['night',23,0],['rain',12,1]]){await p.evaluate(([h,r])=>{window.__townHour=h;window.__townRain=r},[h,r]);await p.waitForTimeout(500);look[name]=await mean();if(shots)await p.screenshot({path:path.join(shots,'town-'+name+'.png')})}
  if(shots){await p.evaluate(()=>{warp('island',11+ISLE_OX,17,0);busy=false;window.__townHour=19.5;window.__townRain=0});await p.waitForTimeout(500);await p.screenshot({path:path.join(shots,'town-houses-dusk.png')});await p.evaluate(()=>{window.__townHour=12});await p.waitForTimeout(300);await p.screenshot({path:path.join(shots,'town-houses-day.png')})}
  assert.ok(look.night<look.day*.6&&look.evening<look.day&&look.rain<look.day,JSON.stringify(look));
  checks.push('Night and rain darken the screen, evening warms it (mean brightness '+Object.entries(look).map(([k,v])=>k+' '+Math.round(v)).join(', ')+')');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close()}
 console.log(checks.map(c=>'✓ '+c).join('\n'));
})().catch(e=>{console.error(e);process.exit(1)});
