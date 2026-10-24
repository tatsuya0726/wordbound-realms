/* The world as painted in assets/world/surface.webp: a 64x36 overworld (world-map-data.js) plus the
   capital, villages, dungeons and side quests placed where they appear on the map.
   Loaded after world-ui.js; initWorldExpansion() runs from initGochamaze() once the core game is defined. */

/* Overworld tiles: ~ sea/river  ^ crag  n snow peak  M canyon  L lava rock  . grass  T forest  s sand  = road
   B bridge  u farmland.  Landmarks: V Komorebi  P Tidehaven  C Whispering Cave  G Elderwood  H Waterfall Shrine
   K Royal Capital  A Emberfoot  Y Ember Peak  R Sandstone Ruins  O Sunwell Oasis  X Tower of Silence  I lighthouse islet. */
const WORLD_PLACES={
 V:{map:'village',name:'こもれびの村'},P:{map:'port',name:'潮風の港'},C:{map:'cave',name:'ささやきの洞窟'},G:{map:'grove',name:'大樹の森'},
 H:{map:'shrine',name:'滝の祠'},K:{map:'castle',name:'王都ルミナ'},A:{map:'ashfield',name:'炎のふもと村'},Y:{map:'volcano',name:'炎の山'},
 R:{map:'ruins',name:'砂の遺跡'},O:{map:'oasis',name:'オアシスの町'},X:{map:'tower',name:'沈黙の塔'},I:{map:'lighthouse',name:'灯台の島'}};
const WORLD_LAYER={s:'sand',O:'sand',R:'sand',X:'sand',M:'sand',L:'ash',Y:'ash',n:'snow',u:'farm'};
const QUESTS=[
 {id:'harvest',name:'畑のことば',where:'こもれびの村の南の畑'},{id:'lostkid',name:'迷子のメイ',where:'大樹の森の入口'},
 {id:'elderwood',name:'大樹の試練',where:'大樹の森'},{id:'echo',name:'こだまの試練',where:'滝の祠'},
 {id:'knight',name:'騎士団長の試験',where:'王都ルミナ'},{id:'book',name:'失われた本',where:'王都の図書館 → 砂の遺跡'},
 {id:'ember',name:'炎の山のゴーレム',where:'炎のふもと村 → 炎の山'},{id:'lamp',name:'灯台のあかり',where:'灯台の島 → オアシス'},
 {id:'signs',name:'道しるべを読む',where:'世界各地の看板 5か所'}];

function worldZone(x,y){const t=tileAt(MAPS.world,x,y);
 if(t==='s'||t==='M')return 'desert';
 if(y<=13&&x>=40)return 'volcanic';
 if(x<=19&&y<=24)return 'forest';
 return x<=32?'w1':'w2'}
function questDone(id){return !!F()['q_'+id]}
function finishQuest(id){if(!F()['q_'+id]){F()['q_'+id]=1;save()}}
function visit(mid){F()['seen_'+mid]=1}
function placeTile(mid){const k=Object.keys(WORLD_PLACES).find(k=>WORLD_PLACES[k].map===mid);return k?WORLD_POI[k]:null}

/* ---------------- location maps ---------------- */
const NEW_MAPS={
 castle:{name:'Royal Capital Lumina',jp:'王都ルミナ',walls:'town',town:1,ground:'green',zone:null,exitTile:'K',rows:[
  "########################",
  "#t,,,,rrrrrrrrrrrr,,,,t#",
  "#,,,,,rrrrrrrrrrrr,,,,,#",
  "#,l,,,############,,,l,#",
  "#,,,,,#####dd#####,,,,,#",
  "#ff,,,,,,,,,,,,,,,,,,ff#",
  "#,,,rrrr,,,ww,,,rrrr,,,#",
  "#,,,####,,,ww,,,####,,,#",
  "#,,,#d##,,,,,,,,##d#,,,#",
  "#,l,,,,,,,l,,l,,,,,,,l,#",
  "#,kcccc,,,,,,,,,,,ccccb#",
  "#,,,,,,,,,,,,,,,,,,,,,,#",
  "#hhh,,,f,,,,,,,,f,,,hhh#",
  "#,,,,,,,,,,,,,,,,,,,,,,#",
  "#t,,,,,,,,,,,,,,,,,,,,t#",
  "##########EEEE##########"]},
 ashfield:{name:'Emberfoot',jp:'炎のふもと村',walls:'basalt',town:1,ground:'ash',exitTile:'A',rows:[
  "######################",
  "#,rrrr,,,,,,,,,,rrrr,#",
  "#,####,,,b,,k,,,####,#",
  "#,#d##,,,,,,,,,,##d#,#",
  "#,,,,,,,l,,,,l,,,,,,,#",
  "#k,,,,,,,,ww,,,,,,,,b#",
  "#,,,,,,,,,ww,,,,,,,,,#",
  "#,,rrrr,,,,,,,,rrrr,,#",
  "#,,####,,,,,,,,####,,#",
  "#,,##d#,,,,,,,,#d##,,#",
  "#,,,,,,,,,,,,,,,,,,,,#",
  "#,ccc,,,,,,,,,,,,ccc,#",
  "#b,,,,,,,,,,,,,,,,,,k#",
  "#########EEEE#########"]},
 oasis:{name:'Sunwell Oasis',jp:'オアシスの町',walls:'sand',town:1,ground:'sand',exitTile:'O',rows:[
  "######################",
  "#t,,,rrrr,,,,rrrr,,,t#",
  "#,,,,####,,,,####,,,,#",
  "#,,,,##d#,,,,#d##,,,,#",
  "#,t,,,,,,,,,,,,,,,,t,#",
  "#,,,,,,wwwwwww,,,,,,,#",
  "#,,t,,,wwwwwww,,,t,,,#",
  "#,,,,,,wwwwwww,,,,,,,#",
  "#,t,,,,,,,,,,,,,,,,t,#",
  "#,ccc,,,,,,,,,,,,ccc,#",
  "#,,,,,,,,,,,,,,,,,,,,#",
  "#k,,,b,,,,,,,,,,b,,,k#",
  "#########EEEE#########"]},
 lighthouse:{name:'Lighthouse Isle',jp:'灯台の島',walls:'town',ground:'coast',noExit:1,rows:[
  "wwwwwwwwwwwwwwwwwwww",
  "wwwww,,,,,,,,,,wwwww",
  "wwww,,,,,,,,,,,,wwww",
  "www,,,,,,##,,,,,,www",
  "www,,,,,,##,,,,,,www",
  "www,,t,,,,,,,,t,,www",
  "www,,,,,,,,,,,,,,www",
  "www,,,rrrr,,,,,,,www",
  "www,,,####,,,b,,,www",
  "www,,,#d##,,,,,,,www",
  "wwww,,,,,,,,,,,,wwww",
  "wwwww,,,,,,,,,,wwwww",
  "wwwwwwww,,,,wwwwwwww",
  "wwwwwwwwwwwwwwwwwwww"]},
 grove:{name:'Elderwood',jp:'大樹の森',walls:'hedge',ground:'green',zone:'forest',exitTile:'G',rows:[
  "########################",
  "#tttttttt,,,,,,tttttttt#",
  "#ttt,,,,,,,,,,,,,,,,ttt#",
  "#tt,,,,,,,,,,,,,,,,,,tt#",
  "#t,,,tt,,,,,,,,,,tt,,,t#",
  "#t,,,tt,,,,ff,,,,tt,,,t#",
  "#t,,,,,,,,,,,,,,,,,,,,t#",
  "#tt,,,f,,,tttt,,,f,,,tt#",
  "#t,,,,,,,,tttt,,,,,,,,t#",
  "#t,tt,,,,,,,,,,,,,,tt,t#",
  "#t,tt,,f,,,,,,,,f,,tt,t#",
  "#t,,,,,,,,,,,,,,,,,,,,t#",
  "#tt,,,,ttt,,,,ttt,,,,tt#",
  "#ttt,,,ttt,,,,ttt,,,ttt#",
  "#tttttttt,,,,,,tttttttt#",
  "#########EEEEEE#########"]},
 shrine:{name:'Waterfall Shrine',jp:'滝の祠',walls:'cave',ground:'stone',exitTile:'H',rows:[
  "####################",
  "#######wwwwww#######",
  "######,wwwwww,######",
  "#####,,,wwww,,,#####",
  "####,,,,,,,,,,,,####",
  "###,,,,,,,,,,,,,,###",
  "##,,,f,,,,,,,,f,,,##",
  "##,,,,,,,,,,,,,,,,##",
  "##,,f,,,,,,,,,,f,,##",
  "##,,,,,,,,,,,,,,,,##",
  "###,,,,,,,,,,,,,,###",
  "####,,,,,,,,,,,,####",
  "######,,,,,,,,######",
  "########EEEE########"]},
 ruins:{name:'Sandstone Ruins',jp:'砂の遺跡',walls:'sand',ground:'sand',zone:'ruins',torches:1,exitTile:'R',rows:[
  "####################",
  "#oooooo#####oooooo##",
  "#oooooo#ooo#oooooo##",
  "#oo##oo#ooo#oo##oo##",
  "#oo##oooooooooo##oo#",
  "#ooooooo####oooooooo",
  "####oooo####oooo####",
  "#oooooooooooooooooo#",
  "#oo####oooooo####oo#",
  "#oo####oooooo####oo#",
  "#oooooooooooooooooo#",
  "#ooooo##oooooo##ooo#",
  "####oo##oooooo##oo##",
  "#oooooooooooooooooo#",
  "#oooooooooooooooooo#",
  "#########EE#########"]},
 volcano:{name:'Ember Peak',jp:'炎の山',walls:'basalt',ground:'ash',zone:'volcano',torches:1,lava:1,exitTile:'Y',rows:[
  "####################",
  "#######oooooo#######",
  "#####ooooooooooo####",
  "####oovvoooovvoooo##",
  "###ooovvoooovvoooo##",
  "##oooooooooooooooo##",
  "##ooovvvooooovvvoo##",
  "#oooovvvooooovvvooo#",
  "#oooooooooooooooooo#",
  "#oovvoooooooooovvoo#",
  "#oovvooooooooooovvo#",
  "#oooooooovvoooooooo#",
  "##ooooooovvooooooo##",
  "###oooooooooooooo###",
  "####oooooooooooo####",
  "#########EE#########"]}};
const NEW_LOOK={
 castle:{bg:'#a9c7e0',fog:['#c3d6e6',20,46],hemi:['#e6f1ff','#6b6a52',.48],sun:['#fff0cf',1.3,[-6,9,5]],tint:'#ffffff',base:'#4a5a42',warm:1},
 ashfield:{bg:'#7a5048',fog:['#9a6a58',16,40],hemi:['#ffd8c0','#4a2a20',.42],sun:['#ffb37a',1.15,[-6,7,5]],tint:'#fff0e2',base:'#3a2a26',warm:1},
 oasis:{bg:'#e8cf9c',fog:['#f0d8a8',20,46],hemi:['#fff3d4','#8a6a3a',.5],sun:['#fff0c0',1.35,[-5,10,4]],tint:'#fffaf0',base:'#b08a50',warm:1},
 lighthouse:{bg:'#8fc4e6',fog:['#b4d8ee',18,44],hemi:['#e4f4ff','#4a6a7a',.5],sun:['#fff6e0',1.25,[-5,9,6]],tint:'#ffffff',base:'#2a5fb8'},
 grove:{bg:'#1f3a2a',fog:['#2e5038',10,30],hemi:['#c8f2c0','#24402a',.55],sun:['#f4ffd0',.75,[-4,10,3]],tint:'#f4fff0',base:'#183020'},
 shrine:{bg:'#26404c',fog:['#3c5c68',10,30],hemi:['#cfefff','#2a3a40',.55],sun:['#e0f4ff',.6,[-3,10,3]],tint:'#eef8ff',base:'#16262c',torch:['#9fe8ff',1.4,8]},
 ruins:{bg:'#2a1c10',fog:['#3a2814',9,22],hemi:['#f0d0a0','#3a2814',.58],sun:['#ffd8a0',.5,[-3,9,4]],tint:'#fff0dc',base:'#000',torch:['#ffb060',2.2,9]},
 volcano:{bg:'#1a0806',fog:['#3a120a',8,22],hemi:['#ffb090','#3a1008',.55],sun:['#ff9a6a',.55,[-3,9,4]],tint:'#ffe8dc',base:'#000',torch:['#ff7030',2.8,10]}};
const NEW_SPAWN={castle:[11,14,0],ashfield:[10,12,0],oasis:[10,11,0],lighthouse:[9,10,0],grove:[11,14,0],shrine:[9,12,0],ruins:[9,14,0],volcano:[9,14,0]};
const NEW_INNS={castle:[12,12],ashfield:[11,11],oasis:[10,10]};

/* ---------------- enemies, items ---------------- */
function addWorldEnemies(){
 Object.assign(ENEMIES,{
  sphinx:{name:'Sand Sphinx',jp:'砂のスフィンクス',hp:150,atk:20,exp:90,gold:120,spr:'golem',pal:{1:'#c8a060',A:'#ffe080'},boss:1,tier:2,skill:'Riddle of Sand',worldArt:'thunder_feather_owlet'},
  embergolem:{name:'Ember Golem',jp:'溶岩ゴーレム',hp:230,atk:27,exp:140,gold:160,spr:'golem',pal:{1:'#8a3a20',A:'#ffb040'},boss:1,tier:3,skill:'Magma Fist',worldArt:'sprout_ear_mole'}});
 Object.assign(ZONES,{
  forest:{tier:1,foes:['blot','bat','imp','gremlin'],bg:'plains'},
  desert:{tier:2,foes:['gremlin','knight','wisp'],bg:'coast'},
  volcanic:{tier:3,foes:['golem','shade','knight'],bg:'cave'},
  ruins:{tier:2,foes:['knight','gremlin','shade'],bg:'cave'},
  volcano:{tier:3,foes:['golem','shade','wisp2'],bg:'cave'}});
 Object.assign(ITEM,{
  steel:{id:'steel',n:'Steel Axe 鋼の斧',d:'ATK+16',p:260,kind:'weapon',v:16},ironmail:{id:'ironmail',n:'Iron Mail 鉄のよろい',d:'DEF+11',p:240,kind:'armor',v:11},
  silver:{id:'silver',n:'Silver Sword 銀の剣',d:'ATK+20',p:420,kind:'weapon',v:20},mythril:{id:'mythril',n:'Mythril Mail ミスリルの鎧',d:'DEF+15',p:390,kind:'armor',v:15}});
}
function equip(slot,name,v){if(S[slot].v<v){S[slot]={n:name,v};return true}return false}

/* ---------------- 3D looks ---------------- */
function addWorldLooks(){
 WALLP.basalt={side:(p,r)=>pRock(p,r,['#3a2a26','#221614','#54403a']),top:(p,r)=>{pRock(p,r,['#2e2220','#1c1210','#46342e']);for(let k=0;k<4;k++)p(Math.floor(r()*16),Math.floor(r()*16),'#ff7a30')}};
 WALLP.sand={side:(p,r)=>pBricks(p,r,'#c49a62','#8a6a40','#dcb67e'),top:(p,r)=>pFill(p,r,'#d8b47a','#c8a46a','#e6c48c')};
 WALLP.hedge={side:(p,r)=>pRock(p,r,['#2f6a34','#1e4a24','#4a8a44']),top:(p,r)=>pRock(p,r,['#3f8a3a','#2a6a2e','#5aa04a'])};
 Object.assign(MAPLOOK,NEW_LOOK);
 Object.assign(THEME,{castle:{roof:'#4a6aa8'},ashfield:{roof:'#7a3a2a'},oasis:{roof:'#c47a3a'},lighthouse:{roof:'#b5453a'}});
}
/* Overworld terrain beyond grass/forest/crags: snow peaks, canyon mesas, lava, farmland, palms and the landmarks. */
function buildWorldDetails(sc,m,W,H,at,out){
 const o=new THREE.Object3D(),col=new THREE.Color(),snow=[],mesa=[],lava=[],farm=[],palm=[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=at(x,y);
  if(c==='n')snow.push([x,y]);if(c==='M')mesa.push([x,y]);if(c==='L')lava.push([x,y]);if(c==='u')farm.push([x,y]);
  if(c==='s'&&hash(x,y)%11===0&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>at(x+dx,y+dy)!=='~'))palm.push([x,y])}
 const inst=(geo,mat,list,fn)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,mat,list.length);list.forEach((p,i)=>{fn(p,i,im);o.updateMatrix();im.setMatrixAt(i,o.matrix)});im.castShadow=im.receiveShadow=true;sc.add(im);return im};
 inst(new THREE.ConeGeometry(.7,1.7,6),new THREE.MeshStandardMaterial({color:'#ffffff',flatShading:true,roughness:.9}),snow,([x,y],i,im)=>{const r=srand(hash(x,y)+21),s=.9+r()*.4;o.position.set(x+(r()-.5)*.2,.85*s*1.2,y);o.rotation.set(0,r()*6,0);o.scale.set(s,s*1.2,s);im.setColorAt(i,col.setHSL(.6,.12+r()*.1,.86+r()*.1))});
 inst(new THREE.CylinderGeometry(.48,.58,1,7),new THREE.MeshStandardMaterial({color:'#ffffff',flatShading:true,roughness:1}),mesa,([x,y],i,im)=>{const r=srand(hash(x,y)+23),h=.6+r()*.9;o.position.set(x,h/2,y);o.rotation.set(0,r()*6,0);o.scale.set(1,h,1);im.setColorAt(i,col.setHSL(.06+r()*.03,.5,.42+r()*.12))});
 inst(new THREE.ConeGeometry(.62,1,6),new THREE.MeshStandardMaterial({color:'#ffffff',flatShading:true,roughness:1,emissive:'#5a1404',emissiveIntensity:.6}),lava,([x,y],i,im)=>{const r=srand(hash(x,y)+25),h=.7+r()*.8;o.position.set(x,h/2,y);o.rotation.set(0,r()*6,0);o.scale.set(1,h,1);im.setColorAt(i,col.setHSL(.02,.35,.2+r()*.08))});
 inst(new THREE.BoxGeometry(.9,.1,.16),stdMat('crop',{color:'#9ab84a'}),farm.flatMap(([x,y])=>[[x,y-.28],[x,y],[x,y+.28]]),([x,y])=>{o.position.set(x,.05,y);o.rotation.set(0,0,0);o.scale.set(1,1,1)});
 inst(new THREE.CylinderGeometry(.04,.07,.9,6),stdMat('palmtrunk',{color:'#8a6a40'}),palm,([x,y])=>{o.position.set(x,.45,y);o.rotation.set(0,0,.1);o.scale.set(1,1,1)});
 inst(new THREE.ConeGeometry(.5,.25,6),stdMat('palmleaf',{color:'#4a9a3a',flatShading:true}),palm,([x,y])=>{o.position.set(x+.05,.95,y);o.rotation.set(0,hash(x,y),0);o.scale.set(1,1,1)});
 // the volcano's glowing crater and smoke
 const crater=new THREE.Mesh(new THREE.ConeGeometry(2.6,3.4,9,1,true),new THREE.MeshStandardMaterial({color:'#3a1a14',flatShading:true,roughness:1}));crater.position.set(55.5,1.7,8);add(sc,crater);
 const glow=new THREE.Mesh(new THREE.CircleGeometry(.9,16),new THREE.MeshBasicMaterial({color:'#ff6a1a'}));glow.rotation.x=-Math.PI/2;glow.position.set(55.5,3.35,8);sc.add(glow);
 const pl=new THREE.PointLight('#ff6a2a',1.4,9,1.6);pl.position.set(55.5,4,8.5);sc.add(pl);
 const smoke=[];for(let i=0;i<7;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.45,8,6),new THREE.MeshStandardMaterial({color:'#6a6466',transparent:true,opacity:.5,roughness:1}));sc.add(s);smoke.push(s)}
 out.anim.push(t=>{smoke.forEach((s,i)=>{const k=((t*.00012)+i/7)%1;s.position.set(55.5+k*2.2,3.6+k*4,8-k);s.scale.setScalar(.6+k*1.8);s.material.opacity=.55*(1-k)});pl.intensity=1.2+Math.sin(t*.004)*.3});
 // landmarks
 for(const [k,[x,y]] of Object.entries(WORLD_POI)){
  if(k==='K'){const stone=stdMat('castleStone',{color:'#d8d4c8'}),roof=stdMat('castleRoof',{color:'#3a5aa8',flatShading:true});
   const keep=new THREE.Mesh(new THREE.BoxGeometry(1.3,1.2,1),stone);keep.position.set(x,.6,y-.2);add(sc,keep);
   for(const [dx,dz,h] of [[-.75,.3,1.6],[.75,.3,1.6],[-.6,-.6,1.9],[.6,-.6,1.9],[0,-.3,2.4]]){const tw=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,h,8),stone);tw.position.set(x+dx,h/2,y+dz);add(sc,tw);
    const cn=new THREE.Mesh(new THREE.ConeGeometry(.28,.6,8),roof);cn.position.set(x+dx,h+.3,y+dz);add(sc,cn)}
   const flag=new THREE.Mesh(new THREE.PlaneGeometry(.3,.18),new THREE.MeshBasicMaterial({color:'#d83a3a',side:THREE.DoubleSide}));flag.position.set(x+.15,3.25,y-.3);sc.add(flag);out.anim.push(t=>{flag.rotation.y=Math.sin(t*.003)*.4})}
  if(k==='A'){miniHouse(sc,x-.25,y+.1,.42,'#7a3a2a');miniHouse(sc,x+.25,y-.2,.36,'#5a2a1a')}
  if(k==='O'){miniHouse(sc,x-.25,y-.15,.38,'#c47a3a');const pond=new THREE.Mesh(new THREE.CircleGeometry(.35,14),new THREE.MeshStandardMaterial({color:'#3ab0d0',roughness:.2}));pond.rotation.x=-Math.PI/2;pond.position.set(x+.25,.03,y+.2);sc.add(pond)}
  if(k==='R'||k==='X'){const sand=stdMat('ruinStone',{color:k==='X'?'#8a7ab0':'#c8a46a',flatShading:true});
   for(const [dx,dz,h] of k==='X'?[[0,0,2.6]]:[[-.35,-.2,1],[.35,-.2,1.2],[-.35,.3,.7],[.35,.3,.6]]){const b=new THREE.Mesh(new THREE.BoxGeometry(k==='X'?.6:.36,h,k==='X'?.6:.36),sand);b.position.set(x+dx,h/2,y+dz);add(sc,b)}
   if(k==='X'){const top=new THREE.Mesh(new THREE.ConeGeometry(.5,.8,4),stdMat('twr',{color:'#9a6ad0',flatShading:true}));top.position.set(x,3,y);add(sc,top);const l=new THREE.PointLight('#b080ff',.8,4,1.8);l.position.set(x,2.4,y+.6);sc.add(l)}}
  if(k==='G'){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.4,1.6,8),stdMat('bigtrunk',{color:'#5a3a22'}));trunk.position.set(x,.8,y);add(sc,trunk);
   for(const [dx,dy,dz,s] of [[0,2,0,1.1],[-.6,1.7,.2,.75],[.6,1.75,-.1,.8],[0,2.5,-.1,.7]]){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(s,0),new THREE.MeshStandardMaterial({color:'#3a8a3a',flatShading:true}));c.position.set(x+dx,dy,y+dz);add(sc,c)}}
  if(k==='H'){const fall=new THREE.Mesh(new THREE.PlaneGeometry(.8,2.2),new THREE.MeshStandardMaterial({color:'#bfe8ff',emissive:'#5aa8d0',emissiveIntensity:.4,transparent:true,opacity:.85}));fall.position.set(x+.9,1.1,y-.6);sc.add(fall);
   const shrine=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.4),stdMat('shrineWood',{color:'#a83a2a'}));shrine.position.set(x,.25,y);add(sc,shrine);
   const r=new THREE.Mesh(new THREE.ConeGeometry(.45,.35,4),stdMat('shrineRoof',{color:'#3a3a40',flatShading:true}));r.rotation.y=Math.PI/4;r.position.set(x,.68,y);add(sc,r)}
  if(k==='Y'){const gate=new THREE.Mesh(new THREE.CircleGeometry(.32,16,0,Math.PI),new THREE.MeshBasicMaterial({color:'#ff7a2a'}));gate.position.set(x,0,y+.5);sc.add(gate)}
  if(k==='I'){const tw=new THREE.Mesh(new THREE.CylinderGeometry(.18,.26,2,10),stdMat('lightTower',{color:'#f4f0e8'}));tw.position.set(x,1,y);add(sc,tw);
   const band=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.25,10),stdMat('lightBand',{color:'#c83a3a'}));band.position.set(x,1.3,y);sc.add(band);
   const lamp=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),new THREE.MeshBasicMaterial({color:'#fff2a0'}));lamp.position.set(x,2.15,y);sc.add(lamp);
   out.anim.push(()=>{lamp.visible=!!(S&&F().q_lamp)})}}
}
/* Per-location decoration: lava pools, the great tree, the waterfall and the lighthouse tower. */
function decorateLocation(sc,mid,m,out){
 const at=(x,y)=>tileAt(m,x,y),W=m.rows[0].length,H=m.rows.length;
 if(m.lava){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(at(x,y)==='v'){const q=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#ff5a14'}));q.rotation.x=-Math.PI/2;q.position.set(x,-.04,y);sc.add(q);out.anim.push(t=>{q.material.color.setHSL(.04+Math.sin(t*.002+x+y)*.015,1,.5)})}}
 if(mid==='grove'){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.3,4.5,10),stdMat('bigtrunk',{color:'#5a3a22'}));trunk.position.set(11.5,2.25,7.5);add(sc,trunk);
  for(const [dx,dy,dz,s] of [[0,5.2,0,2.6],[-2,4.4,.5,1.8],[2,4.5,-.3,1.9],[0,6.4,-.2,1.6],[1.2,5.6,1.2,1.4]]){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),new THREE.MeshStandardMaterial({color:'#3f8f3a',flatShading:true,roughness:.95}));c.position.set(11.5+dx,dy,7.5+dz);add(sc,c)}
  const motes=[];for(let i=0;i<24;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),new THREE.MeshBasicMaterial({color:'#e8ffb0'}));sc.add(s);motes.push(s)}
  out.anim.push(t=>motes.forEach((s,i)=>s.position.set(11.5+Math.sin(t*.0004+i*1.7)*(3+i%4),1+((t*.0003+i/24)%1)*4,8+Math.cos(t*.0005+i)*4)))}
 if(mid==='shrine'){const fall=new THREE.Mesh(new THREE.PlaneGeometry(6,4),new THREE.MeshStandardMaterial({color:'#cfefff',emissive:'#5ab0e0',emissiveIntensity:.45,transparent:true,opacity:.8}));fall.position.set(9.5,2,0.6);sc.add(fall);
  out.anim.push(t=>{fall.material.emissiveIntensity=.4+Math.sin(t*.006)*.08})}
 if(mid==='lighthouse'){const tw=new THREE.Mesh(new THREE.CylinderGeometry(.75,1,5,14),stdMat('lightTower',{color:'#f4f0e8'}));tw.position.set(9.5,2.5,3.5);add(sc,tw);
  for(const hy of [1.4,3.2]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.86,.86,.45,14),stdMat('lightBand',{color:'#c83a3a'}));b.position.set(9.5,hy,3.5);sc.add(b)}
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.55,12,10),new THREE.MeshStandardMaterial({color:'#fff2a0',emissive:'#ffcc40',emissiveIntensity:0}));lamp.position.set(9.5,5.4,3.5);sc.add(lamp);
  const l=new THREE.PointLight('#ffd060',0,14,1.4);l.position.set(9.5,5.6,4.2);sc.add(l);
  out.anim.push(t=>{const on=!!(S&&F().q_lamp);lamp.material.emissiveIntensity=on?1.4+Math.sin(t*.004)*.2:0;l.intensity=on?1.4:0})}
}

/* ---------------- events ---------------- */
// Field signposts: read an English sign; five read signs complete the 'signs' quest.
const SIGNS=[
 {x:23,y:15,en:"Komorebi Village. Welcome, traveler!",ja:"こもれびの村。旅人よ、ようこそ！"},
 {x:34,y:15,en:"The Great Bridge. Keep to the right.",ja:"大橋。右側を通ってください。"},
 {x:38,y:12,en:"North: the Royal Capital. Please show your manners.",ja:"北：王都。礼儀正しくね。"},
 {x:46,y:17,en:"Danger! The desert is very hot. Bring water.",ja:"危険！砂漠はとても暑い。水を持っていこう。"},
 {x:21,y:23,en:"Tidehaven Port. Boats leave every morning.",ja:"潮風の港。船は毎朝出ます。"},
 {x:17,y:13,en:"Elderwood. Do not cut the trees.",ja:"大樹の森。木を切らないでください。"},
 {x:44,y:15,en:"Emberfoot. Hot springs are open all day.",ja:"炎のふもと村。温泉は一日中開いています。"}];
async function readSign(i){const s=SIGNS[i];await say('看板',s.en,s.ja);
 if(!F()['sign'+i]){F()['sign'+i]=1;const n=SIGNS.filter((_,k)=>F()['sign'+k]).length;
  if(n>=5&&!questDone('signs')){finishQuest('signs');S.gold+=100;S.items.ether++;await sys('道しるべを5か所読んだ！ 100ゴールドとエーテルを手に入れた。')}
  else if(n<5)await sys(`道しるべ ${n} / 5`)}}

async function farmerTalk(){const n='Farmer Dan';
 if(questDone('harvest')){await say(n,"The crops love your words. Come back at harvest time!","作物も君のことばが好きみたいだ。収穫のころにまたおいで！");return}
 await say(n,"The birds took my seed bags... and I forgot the names of things!","鳥に種袋を取られて…物の名前まで忘れちまった！");
 if(!await yesno(n,"Can you help me remember three words?","3つのことばを思い出すのを手伝ってくれるかい？","Sure!","Later."))return;
 let c=0;for(let i=0;i<3;i++)if(await quiz(qVocab(1)))c++;
 if(c>=2){finishQuest('harvest');S.items.herb+=3;S.items.berry+=2;await say(n,"Now I remember! Take these, with thanks.","思い出した！ありがとう、これを持っていきな。");await sys('薬草×3と木の実×2を手に入れた！')}
 else await say(n,"Hmm, still foggy. Let's try again later.",`${c}問正解。まだぼんやりしてるなあ。またあとで頼むよ。`)}
async function lostKid(){const n='Little Mei';
 if(questDone('lostkid')){await say(n,"Thank you! I'm not lost anymore.","ありがとう！もう迷子じゃないよ。");return}
 await say(n,"I'm lost... Which way is my village?","迷子になっちゃった…わたしの村はどっち？");
 setLog(dialogHtml(n,"Komorebi Village is ... of the forest.","こもれびの村は森の…どっち？"));
 const v=await ask([{label:'east',value:1},{label:'north',value:0},{label:'under',value:0}]);
 if(v){finishQuest('lostkid');S.gold+=40;await say(n,"East! Thank you! Here, my lucky coins.","東だね！ありがとう！ラッキーコインをあげる。");await sys('40ゴールドを手に入れた。')}
 else await say(n,"Hmm... I don't think that's right.","うーん…ちがう気がする。")}
async function wanderingMerchant(){await shop('Wandering Merchant',[ITEM.herb,ITEM.ether])}
async function bard(){const n='Bard Lio';
 await say(n,"Listen to my song and tell me what it means!","歌を聞いて、意味を当ててごらん！");
 const ok=await quiz(qListen(2,null,'meaning'));
 if(ok){S.gold+=15;await say(n,"You have a musician's ear! Fifteen gold.","音楽家の耳だね！15ゴールド。")}else await say(n,"Listen to the rhythm next time.","次はリズムを聞いてみて。")}
async function fisher(){const n='Old Fisher';
 await say(n,"The lake is quiet today. Do you know these words?","今日の湖は静かだ。このことばはわかるかい？");
 const ok=await quiz(qVocab(2));if(ok&&!F().fisherGift){F().fisherGift=1;S.items.ether++;await say(n,"Good! Take this ether I fished up.","いいね！釣り上げたエーテルをあげよう。")}
 else await say(n,ok?"Nicely done.":"The fish didn't bite that time.",ok?"見事だ。":"今回は食いつかなかったな。")}
async function hermit(){const n='Snow Hermit';
 await say(n,"Few come up the mountain. Answer, and I'll warm you.","山を登ってくる者は少ない。答えたら温めてやろう。");
 const ok=await quiz(qGrammar(2));if(ok){S.hp=maxHp();await say(n,"Warm words, warm heart. Your strength is restored.","温かいことばは心も温める。体力が戻ったぞ。")}
 else await say(n,"Think about the rule again.","規則をもう一度考えてごらん。")}
function chestAt(map,x,y,id,reward){E(map,{x,y,chest:id,cond:()=>!F()[id],talk:async()=>{F()[id]=1;await reward()}})}

function addWorldEvents(){
 const W='world';
 SIGNS.forEach((s,i)=>E(W,{x:s.x,y:s.y,prop:'sign',talk:()=>readSign(i)}));
 E(W,{x:25,y:22,pal:'granny',name:'Farmer Dan',talk:farmerTalk});
 E(W,{x:18,y:14,pal:'child',name:'Little Mei',talk:lostKid});
 E(W,{x:40,y:15,pal:'shop',name:'Merchant',talk:wanderingMerchant});
 E(W,{x:36,y:13,pal:'tourist',name:'Bard',talk:bard});
 E(W,{x:37,y:19,pal:'sailor',name:'Fisher',talk:fisher});
 E(W,{x:25,y:7,pal:'elder',name:'Hermit',talk:hermit});
 E(W,{x:33,y:16,pal:'guard',name:'Bridge Guard',cond:()=>!F().bridgeOpen,talk:bridgeGuard});
 E(W,{x:32,y:15,pal:'guard',name:'Bridge Guard',cond:()=>F().bridgeOpen,talk:async()=>{await say('Bridge Guard',"You passed the trial. The road east is open.","試練は合格だ。東への道は開いている。")}});
 chestAt(W,13,23,'wc1',async()=>{S.gold+=60;await sys('宝箱を開けた！ 60ゴールドを手に入れた。')});
 chestAt(W,60,16,'wc2',async()=>{S.items.ether+=2;await sys('宝箱を開けた！ エーテル×2を手に入れた。')});
 chestAt(W,40,29,'wc3',async()=>{S.items.herb+=3;S.gold+=80;await sys('宝箱を開けた！ 薬草×3と80ゴールドを手に入れた。')});
 chestAt(W,44,22,'wc4',async()=>{S.items.berry+=3;await sys('砂に埋もれた荷車から木の実×3を見つけた！')});

 // --- Royal Capital Lumina
 const C='castle';
 E(C,{x:11,y:5,pal:'elder',name:'King Alder',talk:async()=>{const n='King Alder',done=QUESTS.filter(q=>questDone(q.id)).length;
  await say(n,"Welcome to Lumina, young traveler. The Word Crystal must be restored.","ルミナへようこそ、若き旅人よ。言葉の水晶を取り戻さねばならぬ。");
  if(!F().shard2)await say(n,"Our royal scholar Lexa guards a shard. Prove your words to her.","王宮の学者レクサがかけらを守っている。彼女にことばの力を示すのだ。");
  if(done>=5&&!F().kingReward){F().kingReward=1;equip('weapon','Royal Blade 王家の剣',30);S.gold+=300;save();await say(n,"You have helped many people. Take the Royal Blade.","多くの民を助けてくれたな。王家の剣を授けよう。");await sys('王家の剣（ATK+30）と300ゴールドを手に入れた！')}
  else if(!F().kingReward)await sys(`人助けの記録 ${done} / 5 （5つで王から褒美）`)}});
 E(C,{x:14,y:5,pal:'scholar',name:'Lexa',talk:scholarDuel});
 E(C,{x:6,y:9,pal:'scholar',name:'Librarian',talk:async()=>{const n='Librarian Ora';
  if(questDone('book')){await say(n,"The Book of Words is safe again. Thank you!","言葉の書は無事に戻ったわ。ありがとう！");return}
  if(F().hasBook){F().hasBook=0;finishQuest('book');S.items.ether+=3;S.gold+=150;await say(n,"My book! You found it in the ruins!","私の本！遺跡で見つけてくれたのね！");await sys('エーテル×3と150ゴールドを手に入れた！');return}
  await say(n,"Our Book of Words was stolen and hidden in the Sandstone Ruins.","言葉の書が盗まれて、砂の遺跡に隠されたの。");
  await say(n,"A sphinx guards it. Please bring it back.","スフィンクスが守っているわ。どうか取り戻して。");F().bookQuest=1}});
 E(C,{x:21,y:8,pal:'guard',name:'Captain Rhea',talk:async()=>{const n='Captain Rhea';
  if(questDone('knight')){await say(n,"Stand tall, knight of words!","胸を張れ、ことばの騎士よ！");return}
  await say(n,"Knights must speak clearly. Pass my grammar test: four questions, three correct.","騎士ははっきり話さねばならん。文法試験だ。4問中3問正解せよ。");
  if(!await yesno(n,"Ready?","準備はいいか？","Ready!","Not yet."))return;
  let c=0;for(const t of [2,2,2,3])if(await quiz(qGrammar(t)))c++;
  if(c>=3){finishQuest('knight');const up=equip('armor','Knight Shield 騎士の盾',12);await say(n,"Well done! Take this shield.","見事だ！この盾を授けよう。");await sys(up?'騎士の盾（DEF+12）を装備した！':'騎士の盾をもらったが、今の防具のほうが強い。300ゴールドに換えてもらった。');if(!up)S.gold+=300}
  else await say(n,`${c} of 4. Train and return.`,`4問中${c}問。鍛えて出直せ。`)}});
 E(C,{x:4,y:9,pal:'shop',name:'Royal Merchant',talk:()=>shop('Royal Merchant',[ITEM.herb,ITEM.ether,ITEM.silver,ITEM.mythril])});
 E(C,{x:18,y:9,pal:'inn',name:'Innkeeper',talk:()=>inn('Innkeeper Mara',15,'castle')});
 E(C,{x:12,y:11,pal:'girl',name:'Fortune Teller',talk:async()=>{const n='Fortune Teller Sia';
  await say(n,"Listen to the stars. If you understand them, I'll tell your fortune.","星の声を聞いて。わかったら運勢を教えてあげる。");
  const ok=await quiz(qListen(2));await say(n,ok?"Your road is bright. Look for the lighthouse and the oasis.":"The stars are cloudy today.",ok?"道は明るいわ。灯台とオアシスを探してみて。":"今日は星がくもっているわ。");if(ok)S.mp=maxMp()}});
 E(C,{x:8,y:13,pal:'child',name:'Page Boy',talk:async()=>{const n='Page Tim';
  await say(n,"Let's play a sound game!","音のゲームしよう！");let c=0;for(let i=0;i<2;i++)if(await quiz(qMinimal()))c++;S.gold+=c*5;await say(n,`${c} correct! ${c*5} gold for you.`,`${c}問正解！${c*5}ゴールド！`)}});

 // --- Emberfoot
 const A='ashfield';
 E(A,{x:11,y:4,pal:'elder',name:'Chief Brann',talk:async()=>{const n='Chief Brann';
  if(questDone('ember')){await say(n,"The mountain sleeps peacefully now. Thank you, hero.","山は穏やかに眠っておる。ありがとう、勇者よ。");return}
  if(F().emberWon){finishQuest('ember');equip('weapon','Flame Blade 炎の剣',28);S.gold+=200;save();await say(n,"You calmed the Ember Golem! Take our Flame Blade.","溶岩ゴーレムを鎮めたか！炎の剣を受け取ってくれ。");await sys('炎の剣（ATK+28）と200ゴールドを手に入れた！（今より強ければ装備）');return}
  await say(n,"An Ember Golem shakes Ember Peak every night.","毎晩、溶岩ゴーレムが炎の山を揺らしておる。");
  await say(n,"Its broken words burn like fire. Please calm it.","そいつの壊れた言葉は火のように燃える。どうか鎮めてくれ。");F().emberQuest=1}});
 E(A,{x:4,y:5,pal:'guard',name:'Blacksmith',talk:()=>shop('Blacksmith Hilda',[ITEM.steel,ITEM.ironmail,ITEM.herb])});
 E(A,{x:11,y:8,pal:'inn',name:'Hot Spring',talk:()=>inn('Hot Spring Keeper',10,'ashfield')});
 E(A,{x:16,y:6,pal:'child',name:'Miner Kid',talk:async()=>{const n='Miner Kip';
  await say(n,"I dig for words in the rocks! Try this one!","岩の中のことばを掘ってるんだ！これわかる？");const ok=await quiz(qVocab(2));if(ok&&!F().kipGift){F().kipGift=1;S.items.herb+=2}
  await say(n,ok?"You dug it up! Take some herbs.":"Dig deeper next time!",ok?"掘り当てたね！薬草あげる。":"次はもっと深く掘ろう！")}});

 // --- Sunwell Oasis
 const O='oasis';
 E(O,{x:3,y:8,pal:'shop',name:'Caravan Leader',talk:async()=>{const n='Caravan Leader Zara';
  if(F().lampQuest&&!F().lampOil&&!questDone('lamp')){await say(n,"Lamp oil for the lighthouse? Answer me in English and it's yours.","灯台の油？英語で答えたらあげるわ。");
   const ok=await quiz(qConvo(null,n));if(ok){F().lampOil=1;await sys('灯台の油を手に入れた！')}else await say(n,"Try again, friend.","もう一度どうぞ。");return}
  await shop(n,[ITEM.herb,ITEM.ether,ITEM.berry])}});
 E(O,{x:16,y:9,pal:'tourist',name:'Dancer',talk:async()=>{const n='Dancer Lila';await say(n,"Let's talk! Reply naturally.","おしゃべりしよう！自然に返事してね。");const ok=await quiz(qConvo(null,n));if(ok)S.gold+=10;await say(n,ok?"Lovely! Ten gold for your smile.":"Hmm, let's dance and try again!",ok?"すてき！笑顔に10ゴールド。":"うーん、踊ってもう一回！")}});
 E(O,{x:18,y:8,pal:'inn',name:'Inn',talk:()=>inn('Oasis Inn',14,'oasis')});
 E(O,{x:15,y:4,pal:'granny',name:'Water Priestess',talk:async()=>{const n='Priestess Nima';await say(n,"Listen to the water's voice.","水の声を聞きなさい。");const ok=await quiz(qListen(2,null,'meaning'));if(ok){S.hp=maxHp();S.mp=maxMp();await say(n,"The spring heals you.","泉があなたを癒やします。")}else await say(n,"Listen again, quietly.","静かにもう一度。")}});
 E(O,{x:6,y:4,pal:'sailor',name:'Desert Guide',talk:async()=>{await say('Desert Guide',"The Sandstone Ruins hide a sphinx. It loves riddles.","砂の遺跡にはスフィンクスがいる。なぞなぞが大好きだ。");await say('Desert Guide',"The Tower of Silence stands at the far south-east.","沈黙の塔は南東の果てにある。")}});

 // --- Lighthouse Isle (by boat from Tidehaven)
 const L='lighthouse';
 E(L,{x:12,y:6,pal:'elder',name:'Keeper Pell',talk:async()=>{const n='Keeper Pell';
  if(questDone('lamp')){await say(n,"The light guides every ship home. Thank you.","明かりがすべての船を導いておる。ありがとう。");return}
  if(F().lampOil){finishQuest('lamp');S.gold+=200;S.items.ether+=2;save();await say(n,"Oil! Now the lamp can shine again!","油だ！これでまた灯せる！");await sys('灯台に明かりがともった！ 200ゴールドとエーテル×2を手に入れた。');return}
  await say(n,"My lamp went dark. I need oil from the oasis caravan.","明かりが消えてしまった。オアシスの隊商の油が必要なんじゃ。");F().lampQuest=1}});
 E(L,{x:6,y:5,pal:'girl',name:'Fisher Girl',talk:async()=>{const n='Fisher Girl Ami';await say(n,"Sea words! Do you know this one?","海のことば！これわかる？");const ok=await quiz(qVocab(2));if(ok)S.gold+=8;await say(n,ok?"Yes! Eight gold for you.":"Close!",ok?"正解！8ゴールド。":"おしい！")}});
 E(L,{x:8,y:12,pal:'sailor',name:'Boatman',talk:async()=>{if(await yesno('Boatman',"Back to Tidehaven?","潮風の港へ戻る？","Yes.","Not yet."))warp('port',...SPAWN.port)}});
 chestAt(L,15,3,'lh1',async()=>{S.items.ether++;S.gold+=50;await sys('宝箱を開けた！ エーテルと50ゴールドを手に入れた。')});
 E('port',{x:7,y:12,pal:'sailor',name:'Boatman',talk:async()=>{if(await yesno('Boatman',"To Lighthouse Isle?","灯台の島へ行くかい？","Yes, please.","Not now."))warp('lighthouse',...NEW_SPAWN.lighthouse)}});
 E('port',{x:12,y:4,pal:'tourist',name:'Assistant',talk:async()=>{await say("Lexa's Assistant","Scholar Lexa moved to the Royal Capital, across the great bridge.","学者レクサは大橋の向こうの王都へ移ったわ。")}});

 // --- Elderwood
 const G='grove';
 E(G,{x:11,y:9,pal:'ghost',name:'Elder Tree',talk:async()=>{const n='Spirit of the Elder Tree';
  if(questDone('elderwood')){await say(n,"The forest remembers you, child of words.","森はあなたを覚えているわ、ことばの子よ。");S.hp=maxHp();S.mp=maxMp();await sys('HPとMPが全回復した。');return}
  await say(n,"Every leaf here is a word. Show me five, and I will bless you.","ここの葉はすべてことば。5つ見せてくれたら祝福しましょう。");
  if(!await yesno(n,"Will you try? Four of five must be right.","挑戦する？5問中4問の正解が必要よ。","Yes.","Later."))return;
  let c=0;for(const t of [1,1,2,2,2])if(await quiz(qVocab(t)))c++;
  if(c>=4){finishQuest('elderwood');const up=equip('armor','Leaf Mail 葉の鎧',10);S.items.berry+=3;await say(n,"The leaves sing for you.","葉があなたのために歌っている。");await sys((up?'葉の鎧（DEF+10）を装備した！':'葉の鎧をもらった（今の防具のほうが強い）。')+' 木の実×3。')}
  else await say(n,"The leaves are still quiet.",`5問中${c}問。葉はまだ静か。`)}});
 E(G,{x:4,y:11,pal:'elder',name:'Forest Hermit',talk:async()=>{const n='Forest Hermit';await say(n,"Words grow like trees: slowly, but strong.","ことばは木のように育つ。ゆっくり、でも強く。");const ok=await quiz(qGrammar(1));if(ok)S.items.herb++;await say(n,ok?"Take this herb.":"Roots first, branches later.",ok?"この薬草を持っていきなさい。":"まず根から、枝はあとで。")}});
 chestAt(G,2,4,'gr1',async()=>{S.items.herb+=2;S.items.berry+=2;await sys('宝箱を開けた！ 薬草×2と木の実×2。')});
 chestAt(G,21,4,'gr2',async()=>{S.gold+=90;await sys('宝箱を開けた！ 90ゴールド。')});

 // --- Waterfall Shrine
 const H2='shrine';
 E(H2,{x:9,y:5,pal:'ghost',name:'Echo Spirit',talk:async()=>{const n='Echo Spirit';
  if(questDone('echo')){await say(n,"Your ears are clear as water.","あなたの耳は水のように澄んでいる。");return}
  await say(n,"The waterfall speaks. Hear three sentences without a mistake.","滝が語る。3つの文をまちがえずに聞きとりなさい。");
  let c=0;for(let i=0;i<3;i++)if(await quiz(qListen(2)))c++;
  if(c===3){finishQuest('echo');S.items.ether+=3;S.mp=maxMp();await say(n,"You hear the world truly.","あなたは世界の声を聞いている。");await sys('こだまの試練に合格！ エーテル×3。')}
  else await say(n,"The water is still noisy to you.",`3問中${c}問。もう一度耳をすまして。`)}});
 E(H2,{x:14,y:9,pal:'tourist',name:'Pilgrim',talk:async()=>{await say('Pilgrim',"Every year I come to listen to the falls. They never say the same thing twice.","毎年滝の声を聞きに来るの。同じことは二度と言わないのよ。")}});
 chestAt(H2,3,9,'sh1',async()=>{S.items.ether+=2;await sys('宝箱を開けた！ エーテル×2。')});

 // --- Sandstone Ruins: three tablets open the sphinx's chamber
 const R='ruins';
 [[3,2],[16,2],[9,7]].forEach(([x,y],i)=>E(R,{x,y,prop:'tablet',talk:async()=>{const id='tab'+i;
  if(F()[id]){await sys('石板はもう光っている。');return}
  await sys('古い石板に文が刻まれている。欠けたことばを補おう。');
  if(await quiz(qGrammar(2))){F()[id]=1;const n=[0,1,2].filter(k=>F()['tab'+k]).length;await sys(`石板が光った！（${n} / 3）`+(n===3?'<br>奥で石の扉が開く音がした。':''))}
  else await sys('石板は沈黙したままだ。')}}));
 E(R,{x:9,y:2,boss:'sphinx',cond:()=>!F().sphinxWon,talk:async()=>{const n='Sand Sphinx';
  if(![0,1,2].every(k=>F()['tab'+k])){await sys('石の扉が閉ざされている。3つの石板を光らせよう。');return}
  await say(n,"Answer my riddle with your strength!","我がなぞなぞに力で答えよ！");
  const r=await battle('sphinx');
  if(r==='win'){F().sphinxWon=1;S.gold+=100;if(F().bookQuest)F().hasBook=1;await say(n,"Clever... The book is yours.","賢いな…本はお前のものだ。");await sys('スフィンクスを鎮めた！'+(F().bookQuest?' 言葉の書を手に入れた。':''));save()}
  else if(r==='lose')await gameOver()}});
 chestAt(R,1,13,'ru1',async()=>{S.gold+=120;await sys('宝箱を開けた！ 120ゴールド。')});
 chestAt(R,18,13,'ru2',async()=>{S.items.ether+=2;S.items.herb+=2;await sys('宝箱を開けた！ エーテル×2と薬草×2。')});

 // --- Ember Peak
 const Y='volcano';
 E(Y,{x:9,y:1,boss:'embergolem',cond:()=>!F().emberWon,talk:async()=>{const n='Ember Golem';
  await say(n,"Burn... burn... words... burn...","燃える…燃える…ことば…燃える…");
  const r=await battle('embergolem');
  if(r==='win'){F().emberWon=1;await say('',"The golem cools into quiet stone.","ゴーレムは冷えて、静かな石になった。");await sys('溶岩ゴーレムを鎮めた！ 炎のふもと村の長に知らせよう。');save()}
  else if(r==='lose')await gameOver()}});
 chestAt(Y,2,8,'vo1',async()=>{S.gold+=150;await sys('宝箱を開けた！ 150ゴールド。')});
 chestAt(Y,17,8,'vo2',async()=>{S.items.ether+=3;await sys('宝箱を開けた！ エーテル×3。')});
}

/* Simple props for signs and tablets (rendered like chests). */
function propObject(sc,kind){const g=new THREE.Group();
 if(kind==='sign'){const post=new THREE.Mesh(new THREE.BoxGeometry(.08,.7,.08),stdMat('pole',{color:'#5a3a1e'}));post.position.y=.35;const board=new THREE.Mesh(new THREE.BoxGeometry(.62,.32,.05),stdMat('signBoard',{color:'#c89a5a'}));board.position.y=.62;g.add(post,board)}
 else{const slab=new THREE.Mesh(new THREE.BoxGeometry(.6,.8,.18),stdMat('tablet',{color:'#b89a6a',flatShading:true}));slab.position.y=.4;const glyph=new THREE.Mesh(new THREE.PlaneGeometry(.36,.4),new THREE.MeshBasicMaterial({color:'#ffe08a'}));glyph.position.set(0,.45,.1);g.add(slab,glyph);g.userData.glyph=glyph}
 g.traverse(q=>{q.castShadow=q.receiveShadow=true});sc.add(g);return g}

/* ---------------- story text updated for the new geography ---------------- */
function worldGoal(){const f=F();
 if(!f.quest)return '目の前の長老（Elder Orin）に話しかけよう。';
 if(!f.shard1)return '村の西、ささやきの洞窟で水晶のかけらを取り戻そう。';
 if(!f.bridgeOpen)return '村の東、大河にかかる大橋の番兵の文法テストに合格しよう。';
 if(!f.shard2)return '大橋を渡って北の王都ルミナへ。学者レクサに会おう。';
 if(!f.won)return '南東の砂漠の果て、沈黙の塔の最上階へ向かおう。';
 return null}

/* Saves made before the traced overworld stood on the old 40x26 map: put them at the village gate. */
function migrateWorld(savedVersion){
 if(!S||savedVersion>=2)return;
 if(S.map==='world'){const [x,y]=WORLD_POI.V;S.x=x;S.y=y+1;S.dir=2}
 S.worldV=2
}

function initWorldExpansion(){
 MAPS.world={name:'Gochamaze World',jp:'ごちゃまぜの大地',fill:'~',theme:{},rows:WORLD_ROWS,ents:MAPS.world.ents.filter(e=>!e.name||e.name!=='Bridge Guard')};
 for(const [id,m] of Object.entries(NEW_MAPS)){const pos=m.exitTile?WORLD_POI[m.exitTile]:null;
  MAPS[id]={...m,fill:m.rows[0][0],theme:{},rows:grid(m.rows,m.rows[0][0]),ents:[],exit:pos?['world',pos[0],pos[1]+1]:['port',...SPAWN.port.slice(0,2)]}}
 for(const [id,k] of [['village','V'],['port','P'],['cave','C'],['tower','X']]){const [x,y]=WORLD_POI[k];MAPS[id].exit=['world',x,y+1]}
 Object.assign(SPAWN,NEW_SPAWN);Object.assign(INNS,NEW_INNS);
 for(const c of ['K','A','O','R','G','H','Y','u'])WALK.add(c);
 MAPS.port.ents=MAPS.port.ents.filter(e=>e.name!=='Lexa');
 addWorldEnemies();addWorldLooks();addWorldEvents();
}
/* Entering a landmark from the overworld. */
const WORLD_GATES={
 X:()=>{if(!F().shard2)return run(()=>sys('塔の扉は不思議な力で閉ざされている……水晶のかけらが2つ必要なようだ。'));return warp('tower',...SPAWN.tower)},
 Y:()=>{if(!F().bridgeOpen)return;return warp('volcano',...SPAWN.volcano)}};
function enterPlace(t){const p=WORLD_PLACES[t];if(!p||t==='I')return false;if(WORLD_GATES[t]){WORLD_GATES[t]();return true}
 visit(p.map);warp(p.map,...SPAWN[p.map]);return true}
