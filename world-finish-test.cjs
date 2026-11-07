// Visual finish: cache, map integrity, reduced motion and mobile rendering.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const types={'.css':'text/css','.js':'application/javascript','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const f=path.resolve('.'+decodeURIComponent(new URL(req.url,'http://l').pathname).replace(/\/$/,'/index.html'));if(!f.startsWith(process.cwd()+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end()}res.setHeader('Content-Type',types[path.extname(f)]||'text/html; charset=utf-8');fs.createReadStream(f).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await require('./test-quiet.cjs')(chromium,{channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{const p=await browser.newPage({viewport:{width:844,height:390},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForTimeout(1000);
 await p.evaluate(()=>{S=newState();opt.auto=false;mode='walk';warp('island',24+ISLE_OX,14,0);busy=false;window.__townHour=12;window.__townRain=0});await p.waitForTimeout(500);
 const result=await p.evaluate(()=>{const m=MAPS.island,before=JSON.stringify(m.rows),all=townBuildings(m),cells=m._town.cells;
 const checks={calm:TOWN_CALM,noWind:townWind(9000)===0,cache:townTile(',',m,40,14)===townTile(',',m,40,14)};
 const render=now=>{ctx.clearRect(0,0,VIEW.w,VIEW.h);drawTownGround(m,now,32,0,0,0,0,60,30,cells,1);drawTownAir(m,now,32,0,0,all,VIEW.w,VIEW.h,1);return ctx.canvas.toDataURL()};checks.staticAtmosphere=render(1000)===render(8000);
 for(let y=0;y<m.rows.length;y++)for(let x=0;x<m.rows[y].length;x++)townTile(tileAt(m,x,y),m,x,y);checks.mapIntact=before===JSON.stringify(m.rows);
 const sample={rows:['cccc','....'],ground:'green'},a=townTile('c',sample,0,0),b=townTile('c',sample,1,0);checks.stallJoins=a!==b;
 const start=performance.now();for(let i=0;i<30;i++)drawFlatWorld(1000+i*16);checks.msPerFrame=(performance.now()-start)/30;return checks});
 for(const [key,value] of Object.entries(result))if(key!=='msPerFrame')assert.equal(value,true,key);assert.deepEqual(errors,[]);fs.mkdirSync('qa/world-after',{recursive:true});await p.screenshot({path:'qa/world-after/town-mobile-reduced-motion.png'});console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
