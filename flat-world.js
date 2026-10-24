/* Flat pixel renderer. Map rows and game rules remain the sole collision authority. */
const FLAT_CACHE=new Map();
// Approved sheets are registered here after cell/alpha/anchor QA. Empty means authored fallback.
const FLAT_NPC_SHEETS={ghost:'assets/walk/npc/ghost64-v1.png',scholar:'assets/walk/npc/scholar64-v1.png',elder:'assets/walk/npc/elder64-v1.png',sailor:'assets/walk/npc/sailor64-v1.png',item_shop:'assets/walk/npc/mint64.png',inn:'assets/walk/npc/hanna64-v2.png',guard:'assets/walk/npc/guard64-v2.png',granny:'assets/walk/npc/granny64-v1.png',girl:'assets/walk/npc/tourist64-v1.png',tourist:'assets/walk/npc/tourist64-v1.png'};
const FLAT_NPC_IMAGES={};
for(const [role,src] of Object.entries(FLAT_NPC_SHEETS)){const im=new Image();im.src=src;FLAT_NPC_IMAGES[role]=im;}
function flatSheetCharacter(role,dir,frame){
 const id=FLAT_NPC_SHEETS[role]?role:FLAT_NPCS[role]?role:PORTRAIT_ROLE[role]||role,im=FLAT_NPC_IMAGES[id];
 if(!im?.naturalWidth)return null;
 const cell=im.naturalWidth/3;
 if(!Number.isInteger(cell)||cell<1||im.naturalHeight!==cell*4)return null;
 const row=[3,2,0,1][dir]??0,col=frame===0?1:frame===1?0:2,key='sheet:'+id+':'+cell+':'+row+':'+col;
 if(FLAT_CACHE.has(key))return FLAT_CACHE.get(key);
 const c=document.createElement('canvas');c.width=c.height=cell;
 const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 x.drawImage(im,col*cell,row*cell,cell,cell,0,0,cell,cell);
 FLAT_CACHE.set(key,c);return c;
}

const FLAT_NPCS={
 item_shop:['#397b68','#d8b874','#70452e','apron'],inn:['#a45a65','#f3d4a0','#794430','apron'],
 blacksmith:['#536781','#b78861','#44373b','hammer'],breeding_guide:['#8767a6','#e9c1a1','#59416a','hat'],
 travel_guide:['#5b8567','#e5b380','#8d633e','hat'],resident:['#d29445','#e8bb89','#654434','cap'],
 adventurer_male:['#527eaa','#e2af81','#67492f','sword'],adventurer_female:['#a76883','#edc3a0','#82543b','bow'],
 guard:['#798fa6','#d9af86','#49454e','helmet'],elder:['#a76564','#e7bb8f','#d8d6bf','crown']};
function flatNPC(role,dir=2,frame=0){
 const sheet=flatSheetCharacter(role,dir,frame);if(sheet)return sheet;
 const key='npc:'+role+':'+dir+':'+frame;if(FLAT_CACHE.has(key))return FLAT_CACHE.get(key);
 const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');
 const spec=FLAT_NPCS[role]||FLAT_NPCS[PORTRAIT_ROLE[role]]||FLAT_NPCS.resident;
 const [coat,skin,hair,prop]=spec,ink='#263440',light='#f5e5b9';
 const r=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};
 // One authored chibi silhouette. No illustration squash or CSS aspect distortion.
 r(ink,10,27,5,4);r(ink,18,27,5,4);r('#655448',11,28+(frame===1?1:0),4,2);r('#655448',18,28+(frame===2?1:0),4,2);
 r(ink,9,16,15,13);r(coat,10,17,13,10);r(light,15,17,3,10);r(ink,6,18,4,8);r(skin,7,20,3,5);r(ink,23,18,4,8);r(skin,23,20,3,5);
 r(ink,8,3,17,14);r(hair,9,3,15,12);r(skin,10,7,13,9);r('#c58b68',10,14,13,2);r(hair,9,4,15,4);r(hair,9,7,3,4);
 if(dir===0){r(hair,10,7,13,9);r(coat,12,18,9,8)}else{r(ink,dir===3?11:13,10,2,2);if(dir===2)r(ink,20,10,2,2);r('#8b594d',16,14,3,1)}
 if(prop==='apron'){r(light,12,21,9,7);r('#c8af88',13,23,7,1)}
 if(['hat','cap','helmet','crown'].includes(prop)){const col=prop==='crown'?'#e7bd58':prop==='helmet'?'#bac9cd':coat;r(ink,7,4,19,3);r(col,8,3,17,3);r(col,11,0,11,4);if(prop==='crown'){r(col,10,0,2,3);r(col,22,0,2,3);r('#b95e55',15,2,2,2)}}
 if(prop==='hammer'){r('#704b36',25,16,2,13);r(ink,22,15,8,5);r('#a8b8bc',23,16,6,3)}
 if(prop==='sword'){r('#bccdce',26,16,2,12);r('#d5af5a',24,24,6,2)}
 if(prop==='bow'){r('#bd8b54',27,15,2,12);r('#e7d9b0',25,16,1,10)}
 FLAT_CACHE.set(key,c);return c;
}
function flatSprite(source,key,size=32){
 if(!source||!(source.width||source.naturalWidth))return source;
 if(source===WALK_EMPTY)return source;
 const k='sprite:'+key+':'+size;if(FLAT_CACHE.has(k))return FLAT_CACHE.get(k);
 const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(source,0,0,size,size);c.smooth=false;FLAT_CACHE.set(k,c);return c;
}
function flatCharacter(role,dir=2,frame=0){
 return ['hero','boy','child','kiki','nene'].includes(role)?walkCanvas(role==='hero'||role==='child'?'boy':role,dir,frame):flatNPC(role,dir,frame);
}
function flatTile(ch,m,gx=0,gy=0){
 const region=(m===MAPS.world?WORLD_LAYER[ch]:m.layerOf?.(ch))||m.ground||m.zone||'',interior=!!m.indoor,roof=(m===MAPS.island&&gx<15&&gy>12)?(gx<10?'#a65f4d':'#547f91'):'#7a6297';
 const join=(ch==='g'||ch==='c'||ch==='j'||(ch==='#'&&m.walls==='hedge'))?[-1,1].map(dx=>tileAt(m,gx+dx,gy)===ch?1:0).join('')+[-1,1].map(dy=>tileAt(m,gx,gy+dy)===ch?1:0).join(''):'';
 const key='tile:'+join+':'+ch+':'+region+':'+interior+':'+(m===MAPS.world)+':'+(m===MAPS.sky)+':'+m.walls+':'+roof+':'+((gx+gy)%3);if(FLAT_CACHE.has(key))return FLAT_CACHE.get(key);
 const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const r=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};
 const palette={green:['#6d9b62','#5a8654','#92b77a'],sky:['#8ba99a','#76988a','#b5c4a2'],deep:['#435768','#364858','#6b7f8d'],underground:['#435768','#364858','#6b7f8d'],sand:['#cbb77e','#b49c69','#e5ce9b'],coast:['#b8ba91','#9eaa81','#d7d5af'],ash:['#645f68','#57535f','#8e8182'],stone:['#86928e','#707e7d','#a6b1a4'],snow:['#d9e4de','#bcced0','#edf0dc']}[region]||['#6d9b62','#5a8654','#92b77a'];const [grass,grassDark,grassLight]=palette;
 r(grass,0,0,32,32);for(const [a,b] of [[4,8],[19,23],[27,5]]){r(grassDark,a,b,3,1);r(grassLight,a+2,b-2,1,2)}
 if('~,w'.includes(ch)&&ch!==','){r('#427994',0,0,32,32);r('#5897af',3,7,10,2);r('#77b4c4',7,9,6,1);r('#5897af',19,22,10,2)}
 if(',=sBoEd'.includes(ch)||interior){const wood=interior||ch==='B',base=wood?'#9f805b':'#aaa995';r(base,0,0,32,32);if(wood){for(let y=0;y<32;y+=8){r('#8d7152',0,y,32,1);r('#ad8e65',0,y+1,32,1);r('#8d7152',(y%16?24:9),y,1,8);r('#947755',3+(y%16),y+5,8,1)}}else{for(let y=0;y<32;y+=16){r('#9d9e8d',0,y,32,1);for(let a=(y%32?2:18);a<32;a+=32){r('#9d9e8d',a,y,1,16);r('#b4b29c',a+2,y+2,9,1)}}r('#a3a48f',6,11,2,1);r('#b4b29c',24,26,3,1)}}
 if(ch==='s'){r('#cfba85',0,0,32,32);r('#bca272',5,8,3,1);r('#e4d0a1',19,23,5,1)}
 if(ch==='o'&&!interior){r(['deep','cave','underground'].includes(region)?'#64687b':'#a6a0a2',0,0,32,32);r('#858292',3,7,6,1);r('#858292',22,25,4,1)}
 if(ch==='~'&&(region==='sky'||m===MAPS.sky)){r('#819fb8',0,0,32,32);const cloud=(cx,cy,rx,ry,col)=>{for(let yy=-ry;yy<=ry;yy++){const half=Math.floor(rx*Math.sqrt(1-yy*yy/(ry*ry)));r(col,cx-half,cy+yy,half*2+1,1)}};if((gx+gy)%3!==1){cloud(12,19,15,6,'#a7becd');cloud(9,15,10,6,'#d2dfe2');cloud(21,15,10,4,'#d2dfe2');cloud(13,12,8,5,'#e4e9e5')}else{cloud(24,27,12,4,'#9bb5c8')}}

 if(ch==='u'){r('#77583e',0,0,32,32);for(let y=3;y<32;y+=8){r('#b69760',0,y,32,2);for(let a=3;a<32;a+=8){r('#4b7849',a,y-2,4,3);r('#80aa60',a+1,y-3,2,2)}}}
 if(ch==='f'){r('#ecd68c',7,10,3,3);r('#d17d8a',24,23,3,3);r('#e7e6be',22,5,3,3)}
 if(ch==='r'){r(roof,0,0,32,32);for(let y=0;y<32;y+=8){r('#514857',0,y+7,32,1);r('#b99aa5',0,y,32,1);for(let a=(y%16?4:-4);a<32;a+=8){r('#67566c',a,y+2,1,5);r('#95798f',a+1,y+1,5,1)}}}
 if(ch==='#'||'^nM'.includes(ch)){const hedge=m.walls==='hedge';r(hedge?'#355c47':'#626e76',0,0,32,32);r(hedge?'#60885b':'#9ca7a7',1,1,30,7);r(hedge?'#7da86b':'#bdc4bb',2,2,27,2);r(hedge?'#416b4d':'#79878d',1,10,30,20);r('#45565e',0,29,32,3);for(let yy=9;yy<29;yy+=9){r('#53656b',0,yy,32,1);r('#53656b',yy%2?10:24,yy,1,9)}}
 if(ch==='#'&&m.walls==='hedge'){r('#314e40',0,0,32,32);for(const [cx,cy,rad]of [[6,8,9],[22,8,11],[14,21,12],[29,25,8]])for(let yy=-rad;yy<=rad;yy++){const half=Math.floor(Math.sqrt(rad*rad-yy*yy));r(yy<-rad/3?'#73955c':yy>rad/3?'#416b4d':'#5c8452',cx-half,cy+yy,half*2+1,1)}if(tileAt(m,gx,gy-1)!=='#')r('#8fa56b',4,1,22,1);if(tileAt(m,gx,gy+1)!=='#')r('#314e40',3,30,26,2);if(tileAt(m,gx-1,gy)!=='#')r('#314e40',0,6,2,21);if(tileAt(m,gx+1,gy)!=='#')r('#314e40',30,5,2,23);r('#94ab6c',8,6,3,2);r('#75985b',22,18,4,2)}

 if('^nM'.includes(ch)){r(grass,0,0,32,32);const rock=ch==='n'?'#c8d4d5':ch==='M'?'#a58b68':'#74878b';r('#41555e',2,12,28,18);r(rock,5,7,22,22);r(rock,10,3,12,7);r(ch==='n'?'#f0eee3':'#a1aaa0',11,4,9,8);r('#596d74',20,12,6,16);r('#89988e',6,19,8,3)}
 if(ch==='#'&&['sand','basalt','dream'].includes(m.walls)){const colors={sand:['#a48b69','#c8ad83','#e0c69b','#887453'],basalt:['#403c4c','#5d5667','#84717a','#302d3b'],dream:['#665a81','#9282a2','#b8a4bd','#4e466a']}[m.walls];r(colors[0],0,0,32,32);r(colors[1],1,1,30,28);r(colors[2],2,2,28,3);r(colors[3],0,29,32,3);for(let y=8;y<29;y+=10){r(colors[0],0,y,32,1);r(colors[0],y%3?10:24,y,1,10)}}
 if(ch==='d'){r('#4a3e37',4,1,24,31);r('#d4c39d',3,0,26,3);r('#7c5c42',7,4,18,27);r('#b28c5f',8,5,2,24);r('#ebc85c',21,17,2,2)}
 if('tTh'.includes(ch)){r('#3b4f3b',13,21,7,10);r('#866543',14,23,4,8);r('#a38154',14,23,1,6);const crown=(col,cx,cy,rx,ry)=>{for(let yy=-ry;yy<=ry;yy++){const half=Math.floor(rx*Math.sqrt(1-yy*yy/(ry*ry)));r(col,cx-half,cy+yy,half*2+1,1)}};crown('#31533e',16,15,14,12);crown('#4f784a',15,13,13,11);crown('#6a9056',12,10,10,8);crown('#789b5b',10,8,6,4);r('#94ad68',8,6,4,2);r('#456b43',20,15,5,3);r('#5d844e',7,18,4,2);r('#3a603f',15,23,7,2)}

 if('tTh'.includes(ch)&&['deep','underground'].includes(region)){r(grass,0,0,32,32);r('#263f51',4,24,25,6);for(let yy=0;yy<22;yy++){const half=yy<7?Math.floor(yy/2)+1:5;r('#6599ac',16-half,4+yy,half*2,1);r('#a4d0d4',16-half,4+yy,Math.max(1,half-1),1)}r('#507d97',5,15,7,12);r('#8eb9c6',5,16,3,10);r('#567e9f',23,17,5,10);r('#9bc8d2',23,18,2,8)}
 if(ch==='F'){r('#614b38',1,7,5,25);r('#b59b6a',2,6,3,24);r('#614b38',26,7,5,25);r('#b59b6a',27,6,3,24);r('#c3a675',2,12,28,4);r('#8f744d',2,16,28,2)}
 if(ch==='l'){r('#4b483e',14,8,4,22);r('#413b37',10,2,12,12);r('#f0ca74',12,4,8,7);r('#fff0ac',13,4,3,5)}
 if(ch==='L'||ch==='v'){r('#874d3c',0,0,32,32);r('#e09a50',3,5,21,3);r('#f3c368',8,8,16,2);r('#c56b3f',11,22,20,5)}
 if(m!==MAPS.world&&'KnjYgQc bkpq'.replaceAll(' ','').includes(ch)){const book=ch==='K',bed=ch==='j';r('#4d4036',2,3,28,27);r('#ad865c',3,4,26,23);r('#d4b184',4,5,24,3);r('#71573e',3,26,26,3);if(book){for(let yy=9;yy<25;yy+=8){for(let a=5;a<27;a+=5)r(['#b65c58','#567e99','#e0b668'][a%3],a,yy,3,6);r('#5f4e3d',4,yy+6,24,2)}}else if(bed){r('#e7dcc0',5,6,22,7);r('#718c99',5,14,22,10)}else{r(ch==='Q'?'#659756':'#d9b884',10,9,12,10)}}
 if(m===MAPS.world&&Object.hasOwn(WORLD_POI,ch)){
  r('#a9aa88',0,0,32,32);r('#354c4e',5,8,22,21);r('#d9c99e',7,11,18,16);r('#665176',4,7,24,9);r('#ad85a1',7,5,18,3);r('#3e4049',14,20,5,9);
  if(['C','G','H'].includes(ch)){r('#667f68',2,6,28,21);r('#344b4a',10,16,12,14);r('#819a78',6,5,18,6)}
  if(['Y','X','I'].includes(ch)){r('#bab9a5',9,4,14,25);r('#6a6281',8,3,16,6);r('#383f4f',14,21,5,8);r('#e4ce78',14,10,4,5)}
 }
 if(ch==='b'){r('#483c32',7,3,18,27);r('#aa8052',6,6,20,21);r('#d3ac76',9,4,14,3);r('#5f665f',6,9,20,3);r('#5f665f',6,22,20,3);r('#77563b',10,12,1,10);r('#77563b',21,12,1,10)}
 if(ch==='k'){r('#493d32',3,4,26,25);r('#b28d61',4,5,24,23);r('#d5b77e',5,6,22,2);r('#74563b',6,10,20,2);r('#74563b',6,20,20,2);r('#74563b',9,6,2,22);r('#74563b',21,6,2,22)}
 if(ch==='q'){r('#435660',4,5,24,23);r('#acb8a7',5,5,22,20);r('#5d777e',9,8,14,13);r('#80b5bd',11,11,10,9);r('#d5cfaf',5,5,22,3);r('#6b7b78',4,25,24,3)}
 if(ch==='p'||ch==='Q'){r('#4b644a',7,5,18,16);r('#88a66d',10,4,11,7);r('#75553d',10,21,12,8);r('#c49b69',9,20,14,3)}
 if(m!==MAPS.world&&ch==='n'){r('#71573e',6,7,20,18);r('#c49d6e',7,6,18,18);r('#e0bf8c',8,7,16,2);r('#567986',11,11,7,9);r('#ead7ac',12,12,5,1);r('#eee2bf',20,13,3,4);r('#b5a27b',23,14,2,2)}
 if(ch==='Y'&&m!==MAPS.world){r('#624d36',5,2,22,27);r('#d2af65',6,1,20,4);r('#d2af65',6,3,3,25);r('#d2af65',23,3,3,25);r('#824e5b',10,6,12,19);r('#b47976',11,7,10,3);r('#d2af65',3,18,6,3);r('#d2af65',23,18,6,3);r('#b47976',10,21,12,3)}
 if(ch==='g'||ch==='c'){r('#75563d',1,7,30,21);r('#b89362',1,5,30,18);r('#dfb97c',2,5,28,3);r('#8c6846',2,23,28,3);r('#6a8059',5,11,7,5);r('#89a16b',6,10,5,3);r('#d3b76d',18,11,8,5);r('#e5cc8d',20,10,4,2)}
 if(ch==='g'||ch==='c'){const left=tileAt(m,gx-1,gy)===ch,right=tileAt(m,gx+1,gy)===ch,a=left?0:2,b=right?32:30;r('#a68157',0,0,32,32);r('#6b503a',a,7,b-a,23);r('#aa845b',a+1,8,b-a-2,20);r('#d5b17b',a,5,b-a,13);r('#e7c892',a+1,6,b-a-2,2);r('#8e6a48',a,18,b-a,2);if((gx+gy)%3===0){r('#5c8580',8,9,5,7);r('#b7cfaa',9,8,3,2);r('#9f5f53',19,10,6,6);r('#e3c594',20,9,4,2)}else{r('#4e6e87',9,10,12,6);r('#dccca3',10,10,10,1);r('#7392a1',10,14,10,1)}}
 if(ch==='j'){const above=tileAt(m,gx,gy-1)==='j',below=tileAt(m,gx,gy+1)==='j';r('#a68157',0,0,32,32);r('#604a38',3,above?0:2,26,below?32:30);r('#c19c69',4,above?0:3,24,below?32:28);r('#547b8d',6,above?0:12,20,below?32:17);r('#7295a2',7,above?0:13,3,below?32:15);if(!above){r('#ecdcbc',6,5,20,7);r('#fcf0d4',8,6,16,3)}if(!below){r('#8ba9ae',6,26,20,2);r('#d8b783',4,29,24,2)}}
 if(ch==='E'){r('#364e54',4,4,24,24);r('#e8c779',6,6,20,20);r('#447481',8,8,16,16);r('#b6decc',11,11,10,2);r('#b6decc',10,15,12,2);r('#b6decc',9,19,14,2)}
 FLAT_CACHE.set(key,c);return c;
}
function flatProp(e){
 const locked=e.warp!==undefined&&!warpOpen(WARPS[e.warp],e.warp);const key='prop:'+e.prop+':'+!!e.chest+':'+e.warp+':'+locked;if(FLAT_CACHE.has(key))return FLAT_CACHE.get(key);
 const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const r=(col,a,b,w,h)=>{x.fillStyle=col;x.fillRect(a,b,w,h)};
 if(e.prop==='warp'){const accent=locked?'#737e88':['#a5c78b','#b6cee5','#8cc9c3','#e6bd87','#c4a3cf'][e.warp]||'#a9d4cf';for(let yy=-12;yy<=12;yy++){const half=Math.floor(Math.sqrt(144-yy*yy));r('#354b59',16-half,16+yy,half*2+1,1)}for(let yy=-9;yy<=9;yy++){const half=Math.floor(Math.sqrt(81-yy*yy));r(accent,16-half,16+yy,half*2+1,1)}for(let yy=-7;yy<=7;yy++){const half=Math.floor(Math.sqrt(49-yy*yy));r('#345c75',16-half,16+yy,half*2+1,1)}r(accent,15,10,3,13);r(accent,10,15,13,3);r('#d4d5b1',15,15,3,3);if(locked){r('#303d48',12,13,9,9);r('#b6b6a3',14,10,5,5);r('#303d48',15,11,3,4);r('#b6b6a3',16,17,1,3)}}else if(e.prop==='tablet'){r('#3c4e57',5,2,22,29);r('#9baaa2',6,3,20,26);r('#c8cbb7',8,4,16,3);r('#647d7d',10,10,12,2);r('#647d7d',10,15,8,2);r('#647d7d',10,20,11,2);r('#6d817c',6,27,20,2)}else if(e.chest){r('#403c35',3,10,26,20);r('#a76d3e',4,11,24,17);r('#d8b369',4,12,24,3);r('#e8c86c',14,16,4,6)}else{r('#644c37',14,17,4,14);r('#453f36',3,4,26,17);r('#d2b681',4,5,24,14);r('#8d7656',7,9,18,2);r('#8d7656',7,13,12,2)}
 FLAT_CACHE.set(key,c);return c;
}
function flatReveal(m){
 if(S.map!=='rift'||!S.rift)return null;const W=m.rows[0].length,H=m.rows.length,seen=new Set(S.rift.seen||[]);
 const add=(x,y)=>{if(x>=0&&y>=0&&x<W&&y<H)seen.add(y*W+x)};
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(Math.abs(dx)+Math.abs(dy)<=3)add(S.x+dx,S.y+dy);
 const room=(m.rooms||[]).find(r=>S.x>=r.x&&S.x<r.x+r.w&&S.y>=r.y&&S.y<r.y+r.h);if(room)for(let y=room.y-1;y<=room.y+room.h;y++)for(let x=room.x-1;x<=room.x+room.w;x++)add(x,y);
 if(seen.size!==(S.rift.seen||[]).length)S.rift.seen=[...seen];return seen;
}
function drawFlatWorld(now){
 const m=MAPS[S.map],hp=heroPos(now),W=VIEW.w,H=VIEW.h,scale=Math.max(1,Math.floor(Math.min(W/512,H/288))),tile=32*scale;
 const mw=m.rows[0].length,mh=m.rows.length;
 const camera=(wanted,world,view)=>Math.round(world<=view?(world-view)/2:Math.max(0,Math.min(world-view,wanted)));
 const cx=camera((hp.rx+.5)*tile-W/2,mw*tile,W),cy=camera((hp.ry+.5)*tile-H*.52,mh*tile,H),seen=flatReveal(m);
 const scenery=[];const visible=(x,y)=>!seen||seen.has(y*mw+x);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#283f49';ctx.fillRect(0,0,W,H);
 const x0=Math.floor(cx/tile),y0=Math.floor(cy/tile),x1=Math.ceil((cx+W)/tile),y1=Math.ceil((cy+H)/tile);
 // Buildings are drawn whole by flat-town.js; their cells only get ground here.
 const buildings=townBuildings(m),bcells=m._town.cells,ground=(x,y)=>townTile(m===MAPS.island&&x>=15&&x<=34&&y>=9&&y<=16?',':'.',m,x,y)||flatTile('.',m,x,y);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const px=x*tile-cx,py=y*tile-cy;if((m.fill==='#'&&(x<0||y<0||y>=m.rows.length||x>=mw))||!visible(x,y)){ctx.fillStyle='#24343e';ctx.fillRect(px,py,tile,tile);continue;}const ch=tileAt(m,x,y);
  if(bcells.has(x+','+y)){ctx.drawImage(ground(x,y),px,py,tile,tile);continue}
  if('tTh'.includes(ch)){ctx.drawImage(ground(x,y),px,py,tile,tile);if(!m.ents.some(e=>e.x===x&&e.y===y&&(!e.cond||e.cond()))){const tree=townTree(m,x,y),tall=tree.height>32;scenery.push({x,y,depth:y+.85,offset:tall?-.6:-.3,h:tall?1.5:1,canvas:tree})}}
  else if(ch==='#'&&m===MAPS.island)ctx.drawImage(townRock(m,x,y),px,py,tile,tile);
  else ctx.drawImage(townTile(ch,m,x,y)||flatTile(ch,m,x,y),px,py,tile,tile);
 if(ch==='w'||ch==='~'){ctx.fillStyle=m===MAPS.sky?'#516a69':'#aebd8e';const n=[[0,-1],[1,0],[0,1],[-1,0]];n.forEach(([dx,dy],i)=>{const a=tileAt(m,x+dx,y+dy);if(a!=='w'&&a!=='~'){const z=(m===MAPS.sky?4:2)*scale;ctx.fillRect(px+(i===1?tile-z:0),py+(i===2?tile-z:0),i%2?z:tile,i%2?tile:z)}})}
 if(ch==='#'&&m.doors&&tileAt(m,x,y+1)!=='#'&&tileAt(m,x,y-1)==='r'){ctx.fillStyle='#d9c6a2';ctx.fillRect(px+9*scale,py+8*scale,14*scale,16*scale);ctx.fillStyle='#4c6b78';ctx.fillRect(px+11*scale,py+10*scale,10*scale,11*scale);ctx.fillStyle='#d9c6a2';ctx.fillRect(px+15*scale,py+10*scale,2*scale,11*scale)}
}
 for(const b of buildings){const px=b.x0*tile-cx,py=b.y0*tile-cy;if(px>W||py>H||px+b.w*tile<0||py+b.h*tile<0)continue;const up=b.kind==='greattree'?1:0;ctx.drawImage(townBuildingCanvas(b,m),px,py-up*tile,b.w*tile,(b.h+up)*tile);if(m===MAPS.island)drawTownPlate(b,px,py,tile,scale)}
 const actors=m.ents.filter(e=>(!e.cond||e.cond())&&visible(e.x,e.y)).map(e=>({x:e.x,y:e.y,canvas:e.prop||e.chest?flatProp(e):e.mon?flatSprite(creatureCanvas(e.mon),'monster:'+e.mon):e.boss?flatSprite(enemyCanvas(e.boss),'boss:'+e.boss):flatCharacter(e.pal||'resident',e.face??2,e.pal==='ghost'?[0,1,0,2][Math.floor(now/300)%4]:0)}));
 if(S.map==='island')for(const [i,mon] of (S.companions?.owned||[]).slice(0,14).entries()){const k=now*.00018+i*2.17+1;actors.push({x:RANCH.x0+(RANCH.x1-RANCH.x0)*(.5+.5*Math.sin(k*1.3+i)),y:RANCH.y0+(RANCH.y1-RANCH.y0)*(.5+.5*Math.sin(k*.9+i*1.7)),canvas:flatSprite(creatureCanvas(mon.id),'monster:'+mon.id)});}
 actors.push({x:hp.rx,y:hp.ry,canvas:flatCharacter('hero',S.dir,walkFrame(now,hp.walking))});
 actors.push(...scenery);actors.sort((a,b)=>(a.depth??a.y+.74)-(b.depth??b.y+.74));for(const a of actors){if(a.canvas)ctx.drawImage(a.canvas,Math.round(a.x*tile-cx),Math.round((a.y+(a.offset??-.2))*tile-cy),tile,Math.round(tile*(a.h||1)))}
 const fa=1-(now-fadeT)/220;if(fa>0){ctx.fillStyle=`rgba(20,30,38,${fa})`;ctx.fillRect(0,0,W,H)}
}
function flatBattleGround(kind){
 const cell=32* Math.max(1,Math.floor(Math.min(VIEW.w/512,VIEW.h/288)));ctx.imageSmoothingEnabled=false;
 const m={ground:['cave','tower','underground'].includes(kind)?'deep':kind==='sky'?'sky':'green'};
 for(let y=0;y<VIEW.h;y+=cell)for(let x=0;x<VIEW.w;x+=cell)ctx.drawImage(flatTile((x/cell+y/cell)%7===0?'f':'.',m,x/cell,y/cell),x,y,cell,cell);
}

function flatAtlas(key){const m=MAPS[key==='surface'?'world':key],k='atlas:'+key;if(FLAT_CACHE.has(k))return FLAT_CACHE.get(k);const c=document.createElement('canvas');c.width=m.rows[0].length*32;c.height=m.rows.length*32;const x=c.getContext('2d');for(let j=0;j<m.rows.length;j++)for(let i=0;i<m.rows[j].length;i++)x.drawImage(flatTile(m.rows[j][i],m,i,j),i*32,j*32);const url=c.toDataURL();FLAT_CACHE.set(k,url);return url}

function flatPortrait(role){const source=flatNPC(role,2,0),size=source.width,key='portrait:'+role+':'+size+':'+!!flatSheetCharacter(role,2,0);if(FLAT_CACHE.has(key))return FLAT_CACHE.get(key);const c=document.createElement('canvas');c.width=c.height=size*.75;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(source,size*.125,0,size*.75,size*.75,0,0,c.width,c.height);const url=c.toDataURL();FLAT_CACHE.set(key,url);return url}
