/* Town life (2026-10-26): small motion in the outdoor towns. The wind (swaying trees, bending grass, drifting leaves) was removed at the player's request; townWind stays at 0.
   Gusts rise and fall (townWind); trees sway with them (flat-world.js skews scenery marked sway), grass blades bend,
   water shimmers, the plaza fountain sprays, chimneys smoke, leaves and petals drift across the screen and cloud
   shadows slide over the ground. Drawn in two passes from drawFlatWorld: ground (under buildings and actors) and air
   (over everything). Reduced-motion users get the gentle parts only. */
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
 ctx.restore()}
