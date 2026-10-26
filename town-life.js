/* Town life (2026-10-26): small motion, colour and weather in the outdoor towns.
   The wind (swaying trees, bending grass, drifting leaves) was removed at the player's request; townWind stays at 0.
   Water shimmers, the plaza fountain sprays, chimneys smoke and cloud shadows slide over the ground. Bunting hangs
   between street lamps. A day passes every TOWN_DAY_MS: morning, day, evening glow, night with lit windows and lamps,
   and showers come and go (townClock). Drawn in two passes from drawFlatWorld: ground (under buildings and actors)
   and air (over everything). Reduced-motion users get the gentle parts only. */
const TOWN_LIFE_MAPS=new Set(['island','village','port']);
const TOWN_CALM=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function townLifeOn(){return typeof S!=='undefined'&&TOWN_LIFE_MAPS.has(S.map)}
// 0..1, slow gusts.
function townWind(now){return 0}   // wind removed (2026-10-26): trees, grass and smoke stay still
// Lean of one tree or blade at a spot: mostly downwind, with a little local flutter.
function townSway(x,y,now){const w=townWind(now);return w*.6+Math.sin(now/650+x*.9+y*.4)*.4*w}

function drawTownGround(m,now,tile,cx,cy,x0,y0,x1,y1,bcells,scale){if(!townLifeOn())return;
 ctx.save();ctx.lineCap='round';
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const ch=tileAt(m,x,y),px=x*tile-cx,py=y*tile-cy,h=hash(x+31,y+17);
  if(ch==='w'||ch==='~'){   // water: light streaks drifting with the current
   ctx.strokeStyle='rgba(235,250,255,.35)';ctx.lineWidth=Math.max(1,scale);
   for(let k=0;k<2;k++){const t=((now/(2600+k*900)+(h%97)/97+k*.5)%1),sx=px+t*tile,sy=py+tile*(.3+.4*k)+Math.sin(now/500+x+k)*scale;ctx.globalAlpha=Math.sin(t*Math.PI);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+6*scale,sy);ctx.stroke()}
   ctx.globalAlpha=1;continue}
  if(ch!=='.'||bcells.has(x+','+y)||h%4)continue;   // a quarter of the grass tiles get a tuft
  const lean=townSway(x,y,now)*4*scale;
  for(let k=0;k<3;k++){const bx=px+(6+((h>>(4+k*3))%20))*scale,by=py+tile-(4+k)*scale,len=(5+(h>>(10+k))%3)*scale;
   ctx.strokeStyle=k===1?'#8dbb6f':'#55864a';ctx.lineWidth=Math.max(1,scale*1.1);ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+lean*.3,by-len*.6,bx+lean,by-len);ctx.stroke()}}

 ctx.restore()}

/* Time of day and weather, the same in every town. One game day lasts TOWN_DAY_MS of real time.
   window.__townHour (0-24) and window.__townRain (0-1) pin them for tests. */
const TOWN_DAY_MS=12*60*1000,TOWN_RAIN_SLOT=4*60*1000;
function townClock(){const now=Date.now(),hour=typeof window.__townHour==='number'?window.__townHour:(now/TOWN_DAY_MS*24+9)%24;   // starts mid-morning
 const ramp=(a,b,h)=>Math.max(0,Math.min(1,(h-a)/(b-a)));
 const dark=hour<12?1-ramp(4,7,hour):ramp(17.5,20,hour);           // 0 by day, 1 at night
 const eve=Math.max(0,1-Math.abs(hour-18)/1.6)+Math.max(0,1-Math.abs(hour-5.5)/1.2)*.6;   // sunset and sunrise glow
 let rain=0;if(typeof window.__townRain==='number')rain=window.__townRain;
 else{const slot=Math.floor(now/TOWN_RAIN_SLOT),into=(now%TOWN_RAIN_SLOT)/TOWN_RAIN_SLOT;if(hash(slot,77)%3===0)rain=Math.min(1,into/.12,(1-into)/.12)}   // about one slot in three is a shower, easing in and out
 return {hour,dark,eve:Math.min(1,eve),rain:Math.max(0,rain)}}
function townPhaseName(c=townClock()){return c.rain>.5?'雨':c.dark>.6?'夜':c.eve>.4?(c.hour<12?'朝焼け':'夕方'):'昼'}

/* Triangle flags strung between neighbouring street lamps on the same row. */
function townBuntingLines(m){if(m._bunting?.rows===m.rows)return m._bunting.list;const lamps=[],list=[];
 for(let y=0;y<m.rows.length;y++)for(let x=0;x<m.rows[y].length;x++)if(tileAt(m,x,y)==='l')lamps.push([x,y]);
 for(const [x,y] of lamps){const next=lamps.filter(([a,b])=>b===y&&a>x).sort((p,q)=>p[0]-q[0])[0];if(next&&next[0]-x<=20)list.push([x,y,next[0],y])}
 m._bunting={rows:m.rows,list};return list}
function drawTownBunting(m,now,tile,cx,cy,scale){const cols=['#e84a5a','#f0c850','#4aa0e0','#7ac05a','#f08a40','#c070d8'];
 for(const [ax,ay,bx] of townBuntingLines(m)){const x0=(ax+.5)*tile-cx,x1=(bx+.5)*tile-cx,y=(ay-.05)*tile-cy,sag=tile*.55;if(x1<0||x0>ctx.canvas.width)continue;
  const at=t=>[x0+(x1-x0)*t,y+sag*4*t*(1-t)];ctx.strokeStyle='#5a4030';ctx.lineWidth=Math.max(1,scale);ctx.beginPath();for(let k=0;k<=24;k++){const [px,py]=at(k/24);k?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke();
  const n=Math.max(4,Math.round((bx-ax)*1.6));for(let k=1;k<n;k++){const [px,py]=at(k/n),s=4.5*scale;ctx.fillStyle=cols[(k+ax)%cols.length];ctx.beginPath();ctx.moveTo(px-s,py);ctx.lineTo(px+s,py);ctx.lineTo(px,py+s*1.9);ctx.closePath();ctx.fill()}}}

/* Evening glow, night, rain: one tint over the town, then warm lights for windows and lamps, then falling rain. */
function drawTownSky(m,now,tile,cx,cy,buildings,W,H,scale){const c=townClock();
 const mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);let col=[255,255,255];
 col=mix(col,[255,178,128],c.eve*.55*(1-c.dark*.5));col=mix(col,[70,86,160],c.dark*.74);col=mix(col,[150,158,178],c.rain*.45);
 if(col.some(v=>v<254)){ctx.globalAlpha=1;ctx.globalCompositeOperation='multiply';ctx.fillStyle=`rgb(${col.map(Math.round)})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over'}
 const lit=Math.max(0,(c.dark-.25)/.75)+c.rain*.25;
 if(lit>0){ctx.globalCompositeOperation='lighter';const flick=k=>.9+.1*Math.sin(now/170+k*3.1);
  const glow=(x,y,r,a)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,196,110,${a})`);g.addColorStop(1,'rgba(255,170,80,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)};
  const k=tile/32;
  for(const b of buildings){if(!['house','house2','shop','books','inn'].includes(b.kind))continue;const px=b.x0*tile-cx,py=b.y0*tile-cy,bh=b.h*tile;if(px>W||py>H||px+b.w*tile<0||py+bh<0)continue;
   for(let t=0;t<b.w;t++){if(b.doors.includes(t))continue;const wx=px+(t*32+16)*k,wy=py+bh-20*k;ctx.globalAlpha=Math.min(1,lit)*flick(t+b.x0);ctx.fillStyle='rgba(255,210,120,.85)';ctx.fillRect(px+(t*32+9)*k,py+bh-25*k,14*k,10*k);glow(wx,wy,tile*.9,.35)}}
  const x0=Math.floor(cx/tile)-1,y0=Math.floor(cy/tile)-1,x1=Math.ceil((cx+W)/tile)+1,y1=Math.ceil((cy+H)/tile)+1;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const ch=tileAt(m,x,y);ctx.globalAlpha=Math.min(1,lit)*flick(x+y);
   if(ch==='l'){const lx=x*tile-cx+16*k,ly=y*tile-cy+7*k;glow(lx,ly,tile*2.2,.55);glow(lx,ly,tile*.5,.6)}
   else if(ch==='c'&&tileAt(m,x-1,y)!=='c'){const lx=x*tile-cx+6*k,ly=y*tile-cy+9*k;glow(lx,ly,tile*1.6,.45);ctx.fillStyle='rgba(255,220,140,.9)';ctx.fillRect(lx-2*k,ly-2*k,4*k,5*k)}   // a lantern on each market stall
   else if(ch==='Z'&&tileAt(m,x-1,y)!=='Z'&&tileAt(m,x,y-1)!=='Z')glow(x*tile-cx+tile,y*tile-cy+tile*.8,tile*1.8,.22)}   // the fountain catches the light
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}
 if(c.rain>0)drawTownRain(now,W,H,scale,c.rain)}
function drawTownRain(now,W,H,scale,amount){const n=Math.round(W*H/5200*amount),fall=.9*scale,len=14*scale,slant=.22;
 ctx.strokeStyle='rgba(205,220,240,.55)';ctx.lineWidth=Math.max(1,scale*.8);ctx.beginPath();
 for(let i=0;i<n;i++){const sp=1+(i%5)*.12,y=((i*197.3+now*fall*sp)%(H+len*2))-len,x=((i*131.7)%(W+H*slant))-H*slant+y*slant;ctx.moveTo(x,y);ctx.lineTo(x-len*slant,y-len)}ctx.stroke();
 ctx.fillStyle='rgba(225,235,250,.5)';   // splashes ringing out where drops land
 for(let i=0;i<n/3;i++){const t=((now/420)+i*.37)%1,x=(i*263.9+Math.floor(now/420+i*.37)*71)%W,y=(i*151.3+Math.floor(now/420+i*.37)*53)%H;ctx.globalAlpha=(1-t)*.7*amount;ctx.beginPath();ctx.ellipse(x,y,(2+t*5)*scale,(1+t*2)*scale,0,0,Math.PI*2);ctx.fill()}
 ctx.globalAlpha=1}

function drawTownAir(m,now,tile,cx,cy,buildings,W,H,scale){if(!townLifeOn())return;const wind=townWind(now);ctx.save();
 for(const b of buildings){const px=b.x0*tile-cx,py=b.y0*tile-cy;if(px>W+tile||py>H+tile||px+b.w*tile<-tile||py+b.h*tile<-tile*2)continue;
  if(b.kind==='fountain'&&!TOWN_CALM){const fx=px+b.w*tile/2,fy=py+b.h*tile*.38;   // spray arcs falling back into the basin
   ctx.fillStyle='#dff4ff';for(let i=0;i<16;i++){const t=(now/950+i/16)%1,a=(i/16)*Math.PI*2,r=b.w*tile*.28*t;ctx.globalAlpha=.85*(1-t);
    ctx.fillRect(fx+Math.cos(a)*r+wind*t*6*scale,fy+Math.sin(a)*r*.45-Math.sin(t*Math.PI)*tile*.55,2*scale,2*scale)}}
  if(['house','house2','inn','shop','books'].includes(b.kind)&&hash(b.x0,b.y0)%2===0&&!TOWN_CALM){   // chimney smoke bending downwind
   const sx=px+b.w*tile*.72,sy=py+tile*.15;
   for(let i=0;i<5;i++){const t=(now/2400+i/5)%1;ctx.globalAlpha=.32*(1-t);ctx.fillStyle='#eef1f3';ctx.beginPath();
    ctx.arc(sx+t*tile*.9*wind+Math.sin(now/400+i)*2*scale,sy-t*tile*1.1,(2+t*5)*scale,0,Math.PI*2);ctx.fill()}}}
 // Cloud shadows drifting over the town.
 ctx.globalAlpha=1;
 for(let i=0;i<3;i++){const r=tile*(3+i),x=((now*.012*(1+i*.3)+i*W*.45)%(W+r*4))-r*2,y=H*(.2+i*.3)+Math.sin(now/9000+i)*tile;
  ctx.save();ctx.translate(x,y);ctx.scale(1.6,.8);const g=ctx.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,'rgba(20,40,50,.09)');g.addColorStop(.6,'rgba(20,40,50,.06)');g.addColorStop(1,'rgba(20,40,50,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.restore()}
 drawTownBunting(m,now,tile,cx,cy,scale);
 drawTownSky(m,now,tile,cx,cy,buildings,W,H,scale);
 ctx.restore()}
