/* Warp floors: after warping, a few randomly built floors lead to the boss floor of that world.
   Each floor is rooms joined by corridors, with treasure chests and a gate home. The glowing exit (E) goes deeper.
   The current floor is kept in S.rift {w, floor, seed, opened} so a saved game rebuilds the same floor. */
const RIFT_STYLE={
 meadow:{walls:'hedge',ground:'green',zone:'meadow',look:'meadow',jp:'草原の迷い道',trees:1},
 sky:{walls:'town',ground:'sky',zone:'sky',look:'sky',jp:'雲の回廊'},
 underground:{walls:'cave',ground:'deep',zone:'underground',look:'underground',jp:'水晶の坑道'},
 dream:{walls:'dream',ground:'sky',zone:'dream',look:'dream',jp:'まどろみの回廊'}};
const RIFT_W=30,RIFT_H=22;

/* Builds one floor from a seed. Every chest, the gate home and the exit are checked to be reachable. */
function genFloor(wi,floor,seed){const st=RIFT_STYLE[WARPS[wi].id],r=srand(seed),W=RIFT_W,H=RIFT_H;
 for(let attempt=0;attempt<40;attempt++){
  const g=Array.from({length:H},()=>Array(W).fill('#')),rooms=[];
  for(let t=0;t<90&&rooms.length<7;t++){const w=4+Math.floor(r()*5),h=3+Math.floor(r()*4),x=1+Math.floor(r()*(W-w-2)),y=1+Math.floor(r()*(H-h-2));
   if(rooms.some(o=>x<o.x+o.w+1&&x+w+1>o.x&&y<o.y+o.h+1&&y+h+1>o.y))continue;
   rooms.push({x,y,w,h,cx:x+Math.floor(w/2),cy:y+Math.floor(h/2)})}
  if(rooms.length<4)continue;
  for(const o of rooms)for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++)g[y][x]='.';
  const dig=(x,y)=>{if(g[y][x]==='#')g[y][x]=','};
  for(let i=1;i<rooms.length;i++){const a=rooms[i-1],b=rooms[i];let x=a.cx,y=a.cy;
   const hx=()=>{while(x!==b.cx){x+=Math.sign(b.cx-x);dig(x,y)}},vy=()=>{while(y!==b.cy){y+=Math.sign(b.cy-y);dig(x,y)}};
   if(r()<.5){hx();vy()}else{vy();hx()}}
  const walk=(x,y)=>g[y]&&WALK.has(g[y][x]);
  const bfs=(sx,sy,blocked)=>{const d=new Map([[sx+','+sy,0]]),q=[[sx,sy]];while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(d.has(k)||!walk(nx,ny)||blocked.has(k))continue;d.set(k,d.get(x+','+y)+1);q.push([nx,ny])}}return d};
  const start=rooms[0],dist=bfs(start.cx,start.cy,new Set());
  const exitRoom=rooms.slice(1).sort((a,b)=>(dist.get(b.cx+','+b.cy)||0)-(dist.get(a.cx+','+a.cy)||0))[0];
  g[exitRoom.cy][exitRoom.cx]='E';
  // Decoration: flowers everywhere, a few trees inside the larger meadow rooms.
  for(const o of rooms)for(let y=o.y;y<o.y+o.h;y++)for(let x=o.x;x<o.x+o.w;x++){if(g[y][x]!=='.')continue;const v=r();
   if(st.trees&&o!==start&&o!==exitRoom&&x!==o.cx&&y!==o.cy&&v<.08)g[y][x]='t';else if(v>.93)g[y][x]='f'}
  const ents=[{x:start.x,y:start.y,kind:'home'}];
  const others=rooms.filter(o=>o!==start&&o!==exitRoom);
  for(const o of others.slice(0,1+(floor>1?1:0)+(r()<.4?1:0)))ents.push({x:o.x+o.w-1,y:o.y,kind:'chest'});
  const blocked=new Set(ents.map(e=>e.x+','+e.y)),reach=bfs(start.cx,start.cy,blocked);
  const near=e=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>reach.has((e.x+dx)+','+(e.y+dy)));
  if(!reach.has(exitRoom.cx+','+exitRoom.cy)||!ents.every(e=>walk(e.x,e.y)&&near(e))||blocked.has(start.cx+','+start.cy))continue;
  return {rows:g.map(r=>r.join('')),start:[start.cx,start.cy],exit:[exitRoom.cx,exitRoom.cy],ents,rooms}}
 throw Error('Could not build a warp floor')}

function riftChest(key){return async()=>{const R=S.rift;if(!R)return;const wi=R.w;R.opened.push(key);const v=Math.random(),word=randomUnknownWord(wi>=1?2:1);
 if(word&&v<.45){await sys('宝箱を開けた！ 中には古い言葉の巻物が入っていた。');await teachWords([word],'宝箱');return}
 if(v<.65){S.items.berry+=2;await sys('宝箱を開けた！ 木の実×2を手に入れた。');return}
 if(v<.82){S.items.herb+=2;await sys('宝箱を開けた！ 薬草×2を手に入れた。');return}
 if(v<.92){S.items.churu=(S.items.churu||0)+1;await sys('宝箱を開けた！ チュールを手に入れた。');return}
 const gold=30*(wi+1);S.gold+=gold;await sys(`宝箱を開けた！ ${gold}ゴールドを手に入れた。`)}}

/* Installs the floor described by R (or a placeholder floor before any game is loaded) as MAPS.rift. */
function buildRift(R){const w=WARPS[R.w],st=RIFT_STYLE[w.id],f=genFloor(R.w,R.floor,R.seed);
 MAPS.rift={name:'Warp Floor',jp:`${st.jp} ${R.floor}/${w.floors}層`,fill:'#',theme:{},rows:f.rows,zone:st.zone,walls:st.walls,ground:st.ground,exit:['island',...w.gate],onExit:nextRiftFloor,rooms:f.rooms,
  ents:f.ents.map((e,i)=>e.kind==='home'?{x:e.x,y:e.y,prop:'warp',rift:1,talk:goHome}:{x:e.x,y:e.y,chest:'rift'+i,cond:()=>!!S?.rift&&!S.rift.opened.includes('rift'+i),talk:riftChest('rift'+i)})};
 MAPLOOK.rift=MAPLOOK[st.look];SPAWN.rift=[...f.start,0];if(GL.scenes)delete GL.scenes.rift}
function addRiftMap(){buildRift({w:0,floor:1,seed:1})}
function newRiftSeed(){return Math.floor(Math.random()*1e9)}
function startRift(i){S.rift={w:i,floor:1,seed:newRiftSeed(),opened:[],seen:[]};buildRift(S.rift);warp('rift',...SPAWN.rift);supportToast(`キキ：${WARPS[i].floors}層を抜けるとボスの間だよ。光る出口を探そう！`)}
async function nextRiftFloor(){const R=S.rift;if(!R)return returnToIsland();const w=WARPS[R.w];
 if(R.floor<w.floors){R.floor++;R.seed=newRiftSeed();R.opened=[];R.seen=[];buildRift(R);warp('rift',...SPAWN.rift);await sys(`${RIFT_STYLE[w.id].jp} ${R.floor}層へ進んだ。（全${w.floors}層）`);return}
 S.rift=null;warp(w.map,...w.bossSpawn);await sys(F()[w.clear]?`${w.name}の最深部に出た。`:`<b>ボスの間</b><br>強い気配がする……${w.boss}が待っている。`)}
/* A saved game standing on a warp floor rebuilds it; a broken record sends the hero home. */
function restoreRift(){if(S.map!=='rift')return;
 if(S.rift&&WARPS[S.rift.w]?.floors){try{buildRift(S.rift);if(!WALK.has(tileAt(MAPS.rift,S.x,S.y)))[S.x,S.y]=SPAWN.rift;return}catch(e){}}
 S.rift=null;S.map='island';[S.x,S.y]=ISLE.spawn}
/* Fog of war: unexplored cells stay covered in darkness. Walking reveals the cells around the hero and the whole room
   the hero steps into, so the exit and the chests have to be found. Revealed cells are kept in S.rift.seen. */
function decorateRift(sc,m,out){const W=m.rows[0].length,H=m.rows.length,seen=new Set(S?.rift?.seen||[]);
 const fog=new THREE.InstancedMesh(new THREE.BoxGeometry(1.04,.1,1.04),new THREE.MeshBasicMaterial({color:'#06080c'}),W*H),o=new THREE.Object3D();
 const setCell=(i,cover)=>{o.position.set(i%W,1.4,Math.floor(i/W));o.scale.setScalar(cover?1:0);o.updateMatrix();fog.setMatrixAt(i,o.matrix)};
 for(let i=0;i<W*H;i++)setCell(i,!seen.has(i));sc.add(fog);
 // The exit glows once it has been found.
 const ey=m.rows.findIndex(r=>r.includes('E')),ex=m.rows[ey].indexOf('E'),glow=new THREE.Group();
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.06,8,28),new THREE.MeshStandardMaterial({color:'#ffe27a',emissive:'#ffc040',emissiveIntensity:1.2}));ring.rotation.x=Math.PI/2;ring.position.y=.08;
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.32,.4,1.2,16,1,true),new THREE.MeshBasicMaterial({color:'#ffe9a0',transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false}));beam.position.y=.6;
 const l=new THREE.PointLight('#ffd070',1,6,1.8);l.position.y=1.2;glow.add(ring,beam,l);glow.position.set(ex,0,ey);sc.add(glow);
 let last='';
 out.anim.push(t=>{beam.material.opacity=.18+Math.sin(t/300)*.08;ring.rotation.z=t*.001;glow.visible=seen.has(ey*W+ex);
  if(!S||S.map!=='rift'||!S.rift)return;const k=S.x+','+S.y;if(k===last)return;last=k;let changed=false;
  const reveal=(x,y)=>{if(x<0||y<0||x>=W||y>=H)return;const i=y*W+x;if(seen.has(i))return;seen.add(i);setCell(i,false);changed=true};
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(Math.abs(dx)+Math.abs(dy)<=3)reveal(S.x+dx,S.y+dy);
  const room=(m.rooms||[]).find(r=>S.x>=r.x&&S.x<r.x+r.w&&S.y>=r.y&&S.y<r.y+r.h);
  if(room)for(let y=room.y-1;y<=room.y+room.h;y++)for(let x=room.x-1;x<=room.x+room.w;x++)reveal(x,y);
  if(changed){fog.instanceMatrix.needsUpdate=true;S.rift.seen=[...seen]}})}