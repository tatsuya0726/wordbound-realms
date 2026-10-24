/* Town scenery for the flat renderer, in the spirit of GBA-era monster RPG towns:
   buildings are drawn as whole designed pieces over their footprint (castle, cottages, shops, breeding hall, arena),
   trees are two tiles tall with layered canopies, and grass, dirt roads, plaza stones, picket fences, flowers,
   rocks and mailboxes get richer tiles. Map rows stay the collision authority; only drawing changes here. */
const TOWN_CACHE=new Map();
function townCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 return [c,x,(col,a,b,ww,hh)=>{x.fillStyle=col;x.fillRect(a,b,ww,hh)}]}
function townEllipse(r,col,cx,cy,rx,ry){for(let yy=-ry;yy<=ry;yy++){const half=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));r(col,cx-half,cy+yy,half*2+1,1)}}

/* ---------------- buildings ---------------- */
/* Finds building rectangles: roof rows (r) over wall rows (#/d), as the 3D renderer did. Cached per rows array. */
function townBuildings(m){if(m._town?.rows===m.rows)return m._town.list;
 const W=m.rows[0].length,H=m.rows.length,at=(x,y)=>tileAt(m,x,y),used=new Set(),list=[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(at(x,y)!=='r'||used.has(x+','+y))continue;let x1=x;while(at(x1+1,y)==='r')x1++;let ye=y;while(at(x,ye+1)==='r')ye++;const roofRows=ye-y+1;
  const rowOK=yy=>{for(let k=x;k<=x1;k++)if(!'#d'.includes(at(k,yy)))return false;return true};while(rowOK(ye+1))ye++;
  for(let yy=y;yy<=ye;yy++)for(let xx=x;xx<=x1;xx++)used.add(xx+','+yy);
  const doors=[];for(let xx=x;xx<=x1;xx++)if(at(xx,ye)==='d')doors.push(xx-x);
  const id=m.doors&&doors.length?m.doors[(x+doors[0])+','+ye]:m===MAPS.island?'arena':null;
  list.push({x0:x,y0:y,x1,y1:ye,w:x1-x+1,h:ye-y+1,roofRows,doors,id,kind:townKind(m,id)})}
 m._town={rows:m.rows,list,cells:used};return list}
function townKind(m,id){return {i_castle:'castle',i_hut:'hall',arena:'arena',i_shop:'shop',i_books:'books',i_inn:'inn',i_house:'house',i_house2:'house2'}[id]||'house'}
const TOWN_LOOK={shop:{roof:'#3f8f6a',sign:'道具屋',signCol:'#2f6a8a',icon:'potion'},books:{roof:'#3d5f9e',sign:'本屋',signCol:'#6a3f2a',icon:'book'},inn:{roof:'#b0473f',sign:'宿屋',signCol:'#7a2f3a',icon:'bed'},
 house:{roof:'#b8663a'},house2:{roof:'#6d7f8f'}};
function townBuildingCanvas(b,m){const key='bld:'+b.kind+':'+b.w+':'+b.h+':'+b.roofRows+':'+b.doors.join(',')+':'+(m===MAPS.island?'':(THEME[S?.map]||{}).roof);
 if(TOWN_CACHE.has(key))return TOWN_CACHE.get(key);
 const c=b.kind==='castle'?drawCastle(b):b.kind==='hall'?drawHall(b):b.kind==='arena'?drawArena(b):drawHouse(b,m);TOWN_CACHE.set(key,c);return c}

/* Cottage / shop: tiled gable roof seen from above, cream timber wall, windows with flower boxes, wooden door. */
function drawHouse(b,m){const W=b.w*32,H=b.h*32,roofH=b.roofRows*32,[c,x,r]=townCanvas(W,H),look=TOWN_LOOK[b.kind]||{roof:(THEME[S?.map]||{}).roof||'#b8663a'};
 const roof=look.roof,dk=shadeHex(roof,.62),md=shadeHex(roof,.82),lt=shadeHex(roof,1.25);
 // Wall
 const wy=roofH-6;r('#5a4030',0,wy,W,H-wy);r('#f3e6c4',2,wy,W-4,H-wy-4);r('#d8c49a',2,H-8,W-4,4);r('#8a8478',0,H-4,W,4);r('#a7a092',2,H-4,W-4,1);
 for(let t=0;t<=b.w;t++){const px=Math.min(W-3,t*32);r('#7a5434',px,wy,3,H-wy-4)}
 r('#7a5434',0,wy+2,W,3);
 // Roof: overhanging eave, staggered shingles, ridge, gable ends.
 r(dk,0,0,W,roofH-2);r(roof,2,2,W-4,roofH-8);
 for(let y=6;y<roofH-8;y+=6){r(md,2,y,W-4,1);for(let a=(y/6)%2?4:10;a<W-4;a+=12)r(dk,a,y+1,1,4);for(let a=(y/6)%2?6:12;a<W-6;a+=12)r(lt,a,y+2,4,1)}
 r(lt,2,2,W-4,3);r(shadeHex(roof,1.45),4,3,W-8,1);r(dk,0,roofH-8,W,4);r('#3a2a22',0,roofH-4,W,2);
 r(dk,0,0,3,roofH-4);r(dk,W-3,0,3,roofH-4);
 if(b.kind==='house'||b.kind==='house2'){r('#7a4a3a',W-26,4,10,12);r('#9a6a52',W-25,4,8,3);r('#5a3428',W-26,15,10,2)}
 // Windows and door on the wall row.
 for(let t=0;t<b.w;t++){const px=t*32;if(b.doors.includes(t)){r('#4a3020',px+7,H-31,18,27);r('#8a5a34',px+9,H-29,14,25);r('#a8744a',px+10,H-28,4,23);r('#6a4226',px+15,H-29,1,25);r('#e8c060',px+19,H-17,2,2);r('#c8b890',px+6,H-4,20,2)}
  else{r('#5a4030',px+7,H-27,18,14);r('#ffffff',px+8,H-26,16,12);r('#6aa0d0',px+9,H-25,14,10);r('#a8d0f0',px+10,H-24,5,3);r('#ffffff',px+15,H-26,2,12);r('#ffffff',px+8,H-21,16,2);
   r('#6a4a30',px+6,H-13,20,3);for(let k=0;k<4;k++){r(['#e85a6a','#f0d050','#ffffff','#e85a6a'][k],px+8+k*5,H-15,3,3);r('#4a8a3a',px+9+k*5,H-13,2,1)}}}
 if(look.sign){const sx=(b.doors[0]??0)*32+16;r('#3a2a20',sx-21,roofH-15,42,15);r(look.signCol,sx-20,roofH-14,40,13);r(shadeHex(look.signCol,1.4),sx-20,roofH-14,40,2);drawSignIcon(r,look.icon,sx-6,roofH-13)}
 return c}
function drawSignIcon(r,icon,x,y){
 if(icon==='potion'){r('#f0f0f0',x+4,y,4,2);r('#80d0f0',x+2,y+2,8,8);r('#e05a7a',x+3,y+6,6,3);r('#ffffff',x+3,y+3,2,2)}
 if(icon==='book'){r('#f4ead0',x,y+1,6,9);r('#f4ead0',x+7,y+1,6,9);r('#3a2a20',x+6,y+1,1,10);for(let k=0;k<3;k++){r('#8a7a60',x+1,y+3+k*2,4,1);r('#8a7a60',x+8,y+3+k*2,4,1)}}
 if(icon==='bed'){r('#f4ead0',x,y+3,4,3);r('#4a7ad0',x+3,y+3,10,5);r('#c8a070',x,y+8,13,2);r('#c8a070',x,y+1,2,9)}}

/* Castle: slate roof between two round towers with red cones, crenellated stone front, great arched gate, banners. */
function drawCastle(b){const W=b.w*32,H=b.h*32,roofH=b.roofRows*32,[c,x,r]=townCanvas(W,H);
 const stone='#a9b0b4',sd='#7e878d',sl='#c9cfcf';
 const bricks=(x0,y0,w,h)=>{r(stone,x0,y0,w,h);for(let y=y0;y<y0+h;y+=8){r(sd,x0,y,w,1);for(let a=x0+((y-y0)/8%2?6:14);a<x0+w;a+=16)r(sd,a,y,1,8);r(sl,x0,y+1,w,1)}};
 // Back roof between the towers.
 r('#2c3a52',40,0,W-80,roofH-10);r('#4f6a9a',42,2,W-84,roofH-16);for(let y=8;y<roofH-16;y+=7){r('#3d5580',42,y,W-84,1);for(let a=48+(y%14?0:6);a<W-46;a+=12)r('#6d88b8',a,y+2,5,1)}
 r('#8aa4cc',42,2,W-84,3);
 // Front wall with battlements.
 bricks(24,roofH-14,W-48,H-roofH+14);
 for(let a=24;a<W-24;a+=12){r(sd,a,roofH-22,8,9);r(sl,a,roofH-22,8,2)}
 r('#5c666c',24,H-5,W-48,5);
 // Towers: rounded bodies with shading bands and pointed red roofs.
 for(const tx of [0,W-48]){r('#4e585e',tx,30,48,H-30);bricks(tx+2,32,44,H-36);r('#ffffff22',tx+6,34,6,H-40);r('#00000022',tx+36,34,8,H-40);
  for(let yy=0;yy<34;yy++){const half=Math.round(24*yy/34);r(yy<3?'#e8b050':'#8a2f2a',tx+24-half,yy,half*2,1);if(yy>=3)r('#c0503f',tx+24-half+1,yy,Math.max(1,half-1),1)}
  r('#5a3a20',tx+23,0,2,4);r('#3a6ad0',tx+25,0,8,5);r('#1e2a40',tx+20,44,8,14);r('#ffd88a',tx+21,45,6,6);r('#1e2a40',tx+20,72,8,12)}
 // Gate
 const gx=((b.doors[0]??Math.floor(b.w/2))*32+(b.doors.length>1?32:16)),gw=56,gh=46;r('#5c666c',gx-gw/2-4,H-gh-6,gw+8,gh+6);townEllipse(r,'#5c666c',gx,H-gh,gw/2+4,12);
 r('#4a2c16',gx-gw/2,H-gh,gw,gh);townEllipse(r,'#4a2c16',gx,H-gh,gw/2,10);for(let a=gx-gw/2+6;a<gx+gw/2;a+=8)r('#6a4224',a,H-gh-6,3,gh+6);r('#2a1a0c',gx-1,H-gh-8,2,gh+8);
 for(const sy of [H-36,H-18])for(let a=gx-gw/2+4;a<gx+gw/2;a+=10)r('#c8b070',a,sy,2,2);
 // Banners and windows
 for(const bx of [gx-gw/2-22,gx+gw/2+8]){r('#1e3a8a',bx,roofH-4,14,30);r('#2f5ac8',bx+1,roofH-4,12,28);r('#f0c850',bx+4,roofH+6,6,6);r('#2f5ac8',bx+1,roofH+24,5,4);r('#2f5ac8',bx+8,roofH+24,5,4)}
 for(const wx of [48,W-62,gx-gw/2-52,gx+gw/2+38])if(wx>44&&wx<W-58){r('#2a2a3a',wx,roofH+4,12,16);townEllipse(r,'#2a2a3a',wx+6,roofH+4,6,4);r('#ffd88a',wx+2,roofH+6,8,12)}
 return c}

/* Breeding hall: lavender round hall under a purple dome with a glowing crystal and an arched door. */
function drawHall(b){const W=b.w*32,H=b.h*32,[c,x,r]=townCanvas(W,H),cx=W/2;
 townEllipse(r,'#00000033',cx,H-8,W/2-4,8);
 r('#5a4070',10,40,W-20,H-46);r('#efe4f6',12,40,W-24,H-50);r('#d6c4e6',12,H-18,W-24,8);r('#b8a2d0',12,40,6,H-50);r('#ffffff',W-26,44,4,H-58);
 for(const px of [24,W-32]){r('#c8b0e0',px,42,8,H-52);r('#ffffff',px+1,42,2,H-52)}
 townEllipse(r,'#3a2458',cx,40,W/2-4,34);townEllipse(r,'#8a5ac8',cx,40,W/2-7,31);townEllipse(r,'#a87ae0',cx-12,30,W/4,18);townEllipse(r,'#c8a0f0',cx-18,22,12,7);
 r('#e8c060',12,56,W-24,3);for(let a=18;a<W-18;a+=14)r('#fff0a0',a,56,3,3);
 r('#5a3a7a',cx-1,0,2,10);townEllipse(r,'#e050c0',cx,6,6,7);townEllipse(r,'#ffb0f0',cx-1,5,3,4);r('#ffffff',cx-2,3,2,2);
 const dx=(b.doors[0]??1)*32+16;r('#3a2458',dx-11,H-34,22,30);townEllipse(r,'#3a2458',dx,H-34,11,7);r('#6a4a9a',dx-9,H-32,18,28);townEllipse(r,'#6a4a9a',dx,H-33,9,5);r('#e8c060',dx+4,H-18,2,2);
 for(const wx of [dx-32,dx+32])if(wx>16&&wx<W-16){townEllipse(r,'#5a4070',wx,H-26,6,6);townEllipse(r,'#ffb0f0',wx,H-26,4,4);r('#ffffff',wx-2,H-28,2,2)}
 for(const [sx,sy] of [[18,16],[W-22,20],[W-34,8]]){r('#fff0a0',sx,sy,1,5);r('#fff0a0',sx-2,sy+2,5,1)}
 return c}

/* Arena: an oval stadium seen from above, arches around the wall, sand floor and pennants. */
function drawArena(b){const W=b.w*32,H=b.h*32,[c,x,r]=townCanvas(W,H),cx=W/2,cy=H/2;
 townEllipse(r,'#00000033',cx,cy+6,W/2-2,H/2-4);townEllipse(r,'#7a5a34',cx,cy,W/2-2,H/2-2);townEllipse(r,'#d8c090',cx,cy,W/2-5,H/2-5);townEllipse(r,'#b89a68',cx,cy+2,W/2-16,H/2-16);townEllipse(r,'#e8d4a0',cx,cy+3,W/2-20,H/2-20);
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2,ax=Math.round(cx+Math.cos(a)*(W/2-10)),ay=Math.round(cy+Math.sin(a)*(H/2-10));r('#5a4026',ax-2,ay-2,4,5)}
 r('#c8b080',cx-20,cy+2,40,1);townEllipse(r,'#d8c490',cx,cy+3,10,6);
 for(const [fx,col] of [[14,'#e05050'],[W-18,'#3a6ad0'],[cx-2,'#f0c850']]){r('#4a3020',fx,2,2,14);r(col,fx+2,2,8,5)}
 return c}

/* ---------------- trees, ground and small props ---------------- */
/* Two-tile-tall tree: trunk on its own tile, layered canopy reaching into the tile above. Three varieties. */
function townTree(m,gx,gy){const kind=['deep','underground'].includes(m.ground||m.zone)?'crystal':(hash(gx,gy)%5===0?'pine':'round'),v=hash(gx+7,gy)%3,key='tree:'+kind+':'+v;
 if(TOWN_CACHE.has(key))return TOWN_CACHE.get(key);if(kind==='crystal'){const c=flatTile('t',m,gx,gy);TOWN_CACHE.set(key,c);return c}
 const [c,x,r]=townCanvas(32,48);townEllipse(r,'#00000040',16,44,12,3);
 r('#3a2818',13,32,7,14);r('#7a5434',14,32,5,13);r('#a07448',14,33,2,11);r('#5a3a22',18,34,1,11);
 if(kind==='pine'){for(let yy=0;yy<36;yy++){const half=Math.round(3+yy*.36)+(yy%9>6?-2:0);r('#1d3a26',16-half-1,yy,half*2+2,1);r(yy%9<3?'#4f9a4e':'#3a7a40',16-half,yy,half*2,1);r('#6fb860',16-half+1,yy,Math.max(1,Math.round(half*.5)),1)}return TOWN_CACHE.set(key,c),c}
 const g=[['#1f4a2a','#3d7f3c','#5aa64a','#86c868'],['#1f442e','#3a7444','#56985a','#80bc72'],['#284a22','#4a7f34','#6aa444','#9ccc68']][v];
 townEllipse(r,g[0],16,18,15,15);for(const [cx,cy,rx,ry] of [[9,20,8,8],[23,20,8,8],[16,12,10,9],[16,25,11,6]])townEllipse(r,g[1],cx,cy,rx,ry);
 for(const [cx,cy,rx,ry] of [[10,17,6,5],[21,15,6,5],[15,9,7,5]])townEllipse(r,g[2],cx,cy,rx,ry);
 for(const [cx,cy] of [[9,14],[19,11],[14,7],[24,18]]){r(g[3],cx,cy,3,2);r(g[3],cx+1,cy-1,1,1)}
 for(const [cx,cy] of [[6,25],[25,26],[16,29],[12,22]])r(g[0],cx,cy,3,2);
 TOWN_CACHE.set(key,c);return c}

/* Richer ground for outdoor green maps (island, meadow, Lumina towns). Returns null to fall back to the base tile. */
function townTile(ch,m,gx,gy){if(m.indoor||m===MAPS.world)return null;const green=(m.ground||'green')==='green'||m===MAPS.village||m===MAPS.port;if(!green)return null;
 const isPath=c=>c===','||c==='='||c==='E'||c==='d',plaza=m===MAPS.island&&gx>=15&&gx<=34&&gy>=9&&gy<=16;
 const mask=ch===','||ch==='F'?[[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>{const n=tileAt(m,gx+dx,gy+dy);return ch==='F'?(n==='F'?1:0):(isPath(n)||n==='l'?1:0)}).join(''):'';
 const key='tt:'+ch+':'+mask+':'+plaza+':'+(hash(gx,gy)%4);if(TOWN_CACHE.has(key))return TOWN_CACHE.get(key);
 const [c,x,r]=townCanvas(32,32),v=hash(gx,gy)%4;
 const grass=()=>{r('#7cc064',0,0,32,32);for(const [a,b] of [[3,5],[19,3],[11,14],[26,15],[4,24],[18,26]].map(([a,b])=>[(a+v*7)%29,(b+v*5)%29])){r('#5aa04e',a,b+1,1,2);r('#5aa04e',a+2,b+1,1,2);r('#9ad67a',a+1,b,1,2)}if(v===2){r('#a8dc84',8,20,2,1);r('#a8dc84',22,8,2,1)}};
 if(ch==='.')grass();
 else if(ch===','&&plaza){r('#cfc6b0',0,0,32,32);for(let y=0;y<32;y+=8)for(let a=(y%16?-8:0);a<32;a+=16){r('#b4aa92',a,y,16,1);r('#b4aa92',a,y,1,8);r('#e2dccb',a+2,y+2,10,1)}if(v===1){r('#a89e86',20,20,3,2)}}
 else if(ch===','){grass();const [up,rt,dn,lf]=mask.split('').map(Number);r('#e0c88e',lf?0:4,up?0:4,32-(lf?0:4)-(rt?0:4),32-(up?0:4)-(dn?0:4));
  if(!up)r('#c4aa70',lf?0:4,4,32-(lf?0:4)-(rt?0:4),1);if(!dn)r('#c4aa70',lf?0:4,27,32-(lf?0:4)-(rt?0:4),1);if(!lf)r('#c4aa70',4,up?0:4,1,32-(up?0:4)-(dn?0:4));if(!rt)r('#c4aa70',27,up?0:4,1,32-(up?0:4)-(dn?0:4));
  for(const [a,b] of [[7,9],[20,6],[13,21],[25,24]].map(([a,b])=>[(a+v*5)%22+5,(b+v*3)%22+5]))r('#c8ae78',a,b,2,1)}
 else if(ch==='f'){grass();for(const [a,b] of [[6,7],[20,16],[9,22]].slice(0,2+v%2)){r('#4a8a3a',a+1,b+4,1,3);r('#3a7a32',a-1,b+5,2,1);r('#e84a5a',a-1,b,5,3);r('#e84a5a',a,b-1,3,5);r('#f8d860',a+1,b+1,1,1);r('#ff8a9a',a,b,1,1)}}
 else if(ch==='F'){grass();const [up,rt,dn,lf]=mask.split('').map(Number),post=(a,b)=>{r('#7a7a70',a,b,6,16);r('#f4f4ec',a+1,b,4,15);r('#ffffff',a+1,b,2,1)};
  if(lf||rt||(!up&&!dn)){r('#7a7a70',0,12,32,4);r('#f4f4ec',0,12,32,3);r('#7a7a70',0,20,32,3);r('#f4f4ec',0,20,32,2);post(4,8);post(20,8)}
  if(up||dn){r('#7a7a70',13,up?0:8,6,dn?32-(up?0:8):24-(up?0:8));r('#f4f4ec',14,up?0:8,4,dn?32-(up?0:8):23-(up?0:8));post(13,10)}}
 else if(ch==='l'){grass();r('#00000033',10,28,12,3);r('#3a3836',14,10,4,20);r('#5a5652',15,10,1,20);r('#2c2a28',11,26,10,4);r('#2c2a28',10,2,12,10);r('#f8d878',12,4,8,6);r('#fff4c0',13,4,3,4);r('#2c2a28',13,0,6,2)}
 else if(ch==='w'){r('#4f8fd0',0,0,32,32);for(let y=2+v;y<32;y+=8)for(let a=(y%16?2:10);a<32;a+=16){r('#3f7cc0',a,y+2,10,1);r('#82b8ec',a+2,y,6,1);r('#82b8ec',a+1,y+1,2,1);r('#82b8ec',a+7,y+1,2,1)}if(v===1)r('#dceeff',22,6,2,1)}
 else if(ch==='x'){grass();r('#00000033',10,27,14,3);r('#5a4030',15,16,3,13);r('#3a2a20',8,6,17,11);r('#d84a4a',9,7,15,9);r('#f07a6a',9,7,15,2);r('#3a2a20',11,11,9,1);r('#f0c850',22,4,2,6);r('#e84a4a',22,4,4,3)}
 else return null;
 TOWN_CACHE.set(key,c);return c}
/* Island boulders where the base renderer would draw a brick wall. */
function townRock(m,gx,gy){const key='rock:'+(hash(gx,gy)%3);if(TOWN_CACHE.has(key))return TOWN_CACHE.get(key);
 const [c,x,r]=townCanvas(32,32),v=hash(gx,gy)%3;r('#7cc064',0,0,32,32);townEllipse(r,'#00000033',16,26,14,4);
 townEllipse(r,'#4a4a4e',16,17,14,12);townEllipse(r,'#8a8a8a',15,15,12,10);townEllipse(r,'#a8a8a6',13,12,8,6);r('#c8c8c4',10,9,4,2);r('#5a5a5e',18+v,18,6,1);r('#6a6a6e',8,21-v,5,1);
 TOWN_CACHE.set(key,c);return c}

/* Name plates over the island shops and halls, drawn crisp at screen resolution. */
const TOWN_PLATES={i_castle:'ことのは城',i_shop:'道具屋',i_books:'本屋',i_inn:'宿屋',i_hut:'配合の館',arena:'闘技場'};
function drawTownPlate(b,px,py,tile,scale){const text=TOWN_PLATES[b.id];if(!text)return;
 ctx.font=`bold ${Math.round(11*scale)}px "DotGothic16", sans-serif`;const tw=ctx.measureText(text).width+10*scale,cx=px+b.w*tile/2,y=py-4*scale;
 ctx.fillStyle='#1c2a34e6';ctx.fillRect(Math.round(cx-tw/2),Math.round(y-14*scale),Math.round(tw),Math.round(16*scale));ctx.fillStyle='#e8d8a0';ctx.fillRect(Math.round(cx-tw/2),Math.round(y+1*scale),Math.round(tw),Math.max(1,scale));
 ctx.fillStyle='#fff4d0';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,cx,y-6*scale);ctx.textAlign='left';ctx.textBaseline='alphabetic'}
