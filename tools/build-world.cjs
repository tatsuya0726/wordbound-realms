// Builds the 64x36 overworld traced from assets/world/surface.webp (1 tile = 25px of the painting).
// Run: node tools/build-world.cjs  -> writes world-map-data.js (WORLD_ROWS, WORLD_POI).
const fs=require('fs'),path=require('path');
const W=64,H=36,g=Array.from({length:H},()=>Array(W).fill('~'));
const hash=(x,y,s=0)=>{let h=(x*374761393+y*668265263+s*2147483)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296};
const noise=(x,y)=>Math.sin(x*.9+y*.3)*.5+Math.sin(y*1.3-x*.4)*.4+(hash(x,y,7)-.5)*.6;
const inE=(x,y,cx,cy,rx,ry,j=0)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1+j;
const set=(x,y,c)=>{if(x>=0&&y>=0&&x<W&&y<H)g[y][x]=c};
const at=(x,y)=>x>=0&&y>=0&&x<W&&y<H?g[y][x]:'~';
const land=c=>c!=='~';

// 1. Landmass: main body, south-east peninsula, the southern bay cut out, scattered islets.
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const n=noise(x,y)*.12;
 let L=inE(x,y,31.5,16.5,29.5,14.8,n)||inE(x,y,47.5,26,13.5,7.2,n);
 if(inE(x,y,22,29.5,10.5,5.2,-n)||(y>=31&&x>=11&&x<=33))L=false;
 if(L)set(x,y,'.')}
for(const [cx,cy,rx,ry] of [[24.5,29.6,1.8,1.2],[4,33,1.4,1],[14.5,32.6,1.3,.9],[38.5,32.4,1.4,1],[3,9,1.2,1.3],[60.5,3,1.6,1],[61,30,1,.9],[8.5,30.5,1.1,1]])
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(inE(x,y,cx,cy,rx,ry))set(x,y,'.');

// 2. Regions on land.
for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!land(at(x,y)))continue;const n=noise(x,y);
 const north=6.3+Math.sin(x*.45)*.8+n*.5;
 if(x>=15&&x<=49&&y<=north)set(x,y,y<=north-2.2?'n':'^');                          // snow range
 else if(x>=40&&y<=15.5-(x-40)*.05+n*.6&&!(x>=40&&x<=46&&y>=13))set(x,y,'^');        // north-east crags
 if(inE(x,y,11,14,9.5,9.8,n*.15)&&at(x,y)==='.')set(x,y,hash(x,y,3)<.18?'.':'T');      // great forest
 if(x<=4&&y>=8&&y<=27&&hash(x,y,5)<.55&&at(x,y)!=='~')set(x,y,'^');                   // western cliffs
 if(inE(x,y,49,25.5,13.5,9,n*.15)&&!['n'].includes(at(x,y))&&y>=16)set(x,y,'s');        // desert
}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){                                              // canyon walls and lone mesas
 if(at(x,y)!=='s')continue;const coast=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>at(x+dx,y+dy)==='~');
 if((coast&&hash(x,y,9)<.6)||hash(x,y,11)<.07)set(x,y,'M')}
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(at(x,y)==='.'&&x>20&&x<44&&hash(x,y,13)<.09)set(x,y,'T');   // copses
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(at(x,y)==='.'&&x>=44&&y<=14&&y>=4)set(x,y,'^');
for(let y=4;y<=12;y++)for(let x=50;x<=60;x++){const d=Math.hypot((x-55.5)/1.15,y-8);         // the volcano
 if(d<=1.3)set(x,y,'L');else if(d<=2.6&&land(at(x,y)))set(x,y,hash(x,y,17)<.45?'L':'^')}
for(let y=19;y<=21;y++)for(let x=23;x<=27;x++)set(x,y,'u');                                   // farm fields

// 3. The great river: glacier -> past the castle -> central lake -> southern bay.
const river=[[31,5],[31,8],[30,10],[31,12],[32,14],[33,16],[34,18],[33,20],[32,22],[31,24],[29,26]];
const line=(a,b,f)=>{let [x0,y0]=a;const [x1,y1]=b;const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++)f(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n))};
for(let i=1;i<river.length;i++)line(river[i-1],river[i],(x,y)=>{set(x,y,'~');if(at(x,y-1)!=='~'&&at(x+1,y-1)==='~')set(x,y-1,'~')});
for(let y=17;y<=19;y++)for(let x=33;x<=36;x++)if(inE(x,y,34.5,18,1.8,1.2))set(x,y,'~');   // central lake

// 4. Roads (L-shaped legs). Road over the river becomes a bridge.
const road=(pts)=>{for(let i=1;i<pts.length;i++){const [a,b]=[pts[i-1],pts[i]];
 line(a,[b[0],a[1]],(x,y)=>pave(x,y));line([b[0],a[1]],b,(x,y)=>pave(x,y))}};
const pave=(x,y)=>{const c=at(x,y);if(c==='~')set(x,y,'B');else if(!'BVPCXKAORGHY'.includes(c))set(x,y,c==='s'?'=':'=')};
const POI={V:[22,16],P:[20,24],C:[9,20],G:[12,12],H:[28,7],K:[36,9],A:[45,14],Y:[53,11],R:[47,19],O:[51,24],X:[56,27],I:[24,29]};
road([[22,16],[37,16],[37,10]]);               // village -> great bridge -> castle
road([[37,16],[45,16],[45,14]]);               // -> Emberfoot
road([[45,15],[49,15],[49,12],[53,12]]);       // -> volcano pass
road([[41,16],[41,19],[47,19]]);               // -> sandstone ruins
road([[47,20],[47,24],[51,24]]);               // -> oasis
road([[51,25],[56,25],[56,27]]);               // -> tower of silence
road([[22,17],[22,22],[20,22],[20,24]]);       // village -> port
road([[21,16],[15,16],[15,19],[9,19]]);        // -> whispering cave
road([[21,15],[16,15],[16,12],[12,12]]);       // -> great tree
road([[22,15],[22,9],[28,9],[28,7]]);          // -> waterfall shrine
for(let y=12;y<=15;y++)for(let x=43;x<=47;x++)if(at(x,y)==='^')set(x,y,'.');            // Emberfoot's clearing
road([[45,15],[49,15]]);
for(const [c,[x,y]] of Object.entries(POI))set(x,y,c);
// Keep every landmark reachable on foot (except the lighthouse islet, reached by boat).
for(const [c,[x,y]] of Object.entries(POI))for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]])if(c!=='I'&&['^','n','M','L','T'].includes(at(x+dx,y+dy))&&dy===1)set(x+dx,y+dy,'.');

const rows=g.map(r=>r.join(''));
console.log(rows.map((l,i)=>String(i).padStart(2)+' '+l).join('\n'));
const out=`/* Generated by tools/build-world.cjs from the painted world map (surface.webp, 25px per tile). */\nconst WORLD_ROWS=${JSON.stringify(rows,null,0).replace(/","/g,'",\n"')};\nconst WORLD_POI=${JSON.stringify(POI)};\n`;
fs.writeFileSync(path.join(__dirname,'..','world-map-data.js'),out);
