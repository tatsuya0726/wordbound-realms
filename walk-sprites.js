/* Fixed 64px cells: rows down / left / right / up; columns step / idle / step. */
const WALK_IMAGES={},WALK_CACHE=new Map();
const WALK_EMPTY=document.createElement('canvas');WALK_EMPTY.width=WALK_EMPTY.height=64;
for(const id of ['boy','kiki','nene']){const im=new Image();im.src=`assets/walk/${id}.png`;WALK_IMAGES[id]=im}
function walkCanvas(id,dir=2,frame=0){
 const im=WALK_IMAGES[id];if(!im?.naturalWidth)return WALK_EMPTY;
 const row=[3,2,0,1][dir]??0,col=frame===0?1:frame===1?0:2,key=`${id}:${row}:${col}`;
 if(WALK_CACHE.has(key))return WALK_CACHE.get(key);
 const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(im,col*64,row*64,64,64,0,0,64,64);WALK_CACHE.set(key,c);return c;
}
function walkFrame(now,moving){return moving?[1,0,2,0][Math.floor(now/120)%4]:0}

let catTrail=[],catMap=null;
const CAT_POSES=['kiki','nene'].map(id=>({id,x:null,y:null,dir:2,moving:false}));
function sampleCatPoses(now){
 const hp=heroPos(now),last=catTrail[0];
 if(catMap!==S.map||last&&Math.hypot(hp.rx-last.x,hp.ry-last.y)>2){catTrail=[];catMap=S.map}
 if(!catTrail.length){
  catTrail.push({x:hp.rx,y:hp.ry,dir:S.dir});
  for(let step=1;step<=15;step++){const x=hp.rx-DX[S.dir]*step*.1,y=hp.ry-DY[S.dir]*step*.1,m=MAPS[S.map];if(!WALK.has(tileAt(m,Math.round(x),Math.round(y)))||m.ents.some(e=>e.x===Math.round(x)&&e.y===Math.round(y)))break;catTrail.push({x,y,dir:S.dir})}
 }
 if(Math.hypot(hp.rx-catTrail[0].x,hp.ry-catTrail[0].y)>.025){catTrail.unshift({x:hp.rx,y:hp.ry,dir:S.dir});if(catTrail.length>240)catTrail.length=240}
 CAT_POSES.forEach((cat,i)=>{
  let remaining=.7*(i+1),p=catTrail.at(-1);
  for(let j=1;j<catTrail.length;j++){const a=catTrail[j-1],b=catTrail[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d>=remaining){const f=remaining/d;p={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,dir:a.dir};break}remaining-=d}
  cat.moving=cat.x!==null&&Math.hypot(p.x-cat.x,p.y-cat.y)>.005;cat.x=p.x;cat.y=p.y;cat.dir=p.dir;
 });return CAT_POSES;
}
function addWalkingCats(sc,out){
 const cats=CAT_POSES.map(cat=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:sprTex(walkCanvas(cat.id)),alphaTest:.5,transparent:false}));sp.scale.set(.78,.78,1);sp.center.set(.5,0);sc.add(sp);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.24,16),new THREE.MeshBasicMaterial({color:'#142317',transparent:true,opacity:.28,depthWrite:false}));shadow.rotation.x=-Math.PI/2;sc.add(shadow);return {sp,shadow}});
 out.anim.push(now=>{if(!S)return;sampleCatPoses(now).forEach((cat,i)=>{const {sp,shadow}=cats[i];sp.visible=shadow.visible=mode!=='title';sp.position.set(cat.x,0,cat.y+.015);shadow.position.set(cat.x,.016,cat.y);sp.material.map=sprTex(walkCanvas(cat.id,cat.dir,walkFrame(now,cat.moving)))})});
}
