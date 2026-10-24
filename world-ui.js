/* Art, three-layer expeditions and support characters for Gochamaze Monster. */
const WORLD_ART={};
for(const key of ['surface','sky','underground','battle-grass','battle-cave','battle-sky','battle-town','battle-coast']){const im=new Image();im.src='assets/world/'+key+'.webp';WORLD_ART[key]=im}
const PEOPLE={};
for(const key of ['adventurer_male','adventurer_female','resident','travel_guide','blacksmith','breeding_guide','inn','item_shop']){const im=new Image();im.src='assets/people/'+key+'-standing.webp';PEOPLE[key]=im}
const PORTRAIT_ROLE={hero:'adventurer_male',elder:'travel_guide',shop:'item_shop',inn:'inn',girl:'adventurer_female',boy:'adventurer_male',granny:'resident',guard:'blacksmith',scholar:'breeding_guide',sailor:'adventurer_male',child:'resident',tourist:'adventurer_female',ghost:'travel_guide'};
const ART_CACHE=new Map(),PLACEHOLDER=document.createElement('canvas');PLACEHOLDER.width=PLACEHOLDER.height=128;
let atlasOpen=false,lastView='',toastUntil=0;
function artCharacter(role,dir,frame){
 if(role==='hero'||role==='boy'||role==='child')return walkCanvas('boy',dir,frame);
 if(role==='kiki'||role==='nene')return walkCanvas(role,dir,0);
 const im=PEOPLE[PORTRAIT_ROLE[role]||'resident'];if(!im?.naturalWidth)return PLACEHOLDER;
 const key=role+':'+(dir===3)+':'+frame;if(ART_CACHE.has(key))return ART_CACHE.get(key);
 // Painted portraits keep their source resolution and are sampled smoothly (c.smooth) instead of as pixel art.
 const N=320,c=document.createElement('canvas');c.width=c.height=N;c.smooth=true;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';const h=N*(frame===2?.94:.96),w=im.width/im.height*h;
 if(dir===3){x.translate(N,0);x.scale(-1,1)}x.drawImage(im,(N-w)/2,N-h,w,h);ART_CACHE.set(key,c);return c;
}
/* Bust portraits for conversations and shops (Drive: 街・人物素材/*_portrait.png). Children and the hero have none yet. */
const PORTRAIT_NAMES={travel_guide:'旅の案内人',item_shop:'道具屋',inn:'宿屋',adventurer_female:'冒険者',adventurer_male:'冒険者',resident:'村人',blacksmith:'鍛冶屋',breeding_guide:'育て屋'};
function showPortrait(role){
 const el=document.getElementById('portrait'),file=role&&!['hero','boy','child','ghost'].includes(role)?PORTRAIT_ROLE[role]:null;
 document.body.classList.toggle('with-portrait',!!file);
 if(!file){el.hidden=true;el.removeAttribute('src');return}
 el.src='assets/portraits/'+file+'.webp';el.alt=PORTRAIT_NAMES[file]||'';el.hidden=false;
}
function imageCover(x,im,w,h){if(!im?.naturalWidth)return;const scale=Math.max(w/im.width,h/im.height),sw=w/scale,sh=h/scale;x.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,0,0,w,h)}
function artBattleBackground(kind){return WORLD_ART[{plains:'battle-grass',cave:'battle-cave',coast:'battle-coast',tower:'battle-cave',dream:'battle-sky',sky:'battle-sky',underground:'battle-cave'}[kind]||'battle-grass']}
function drawGochamazeTitle(now){
 const W=VIEW.w,H=VIEW.h;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,t=reduced?0:now/1000;ctx.translate(-6+Math.sin(t*.12)*4,-4);ctx.scale(1.035,1.035);imageCover(ctx,WORLD_ART.surface,W,H);ctx.restore();
 const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#061c26e0');g.addColorStop(.5,'#123c3c50');g.addColorStop(1,'#071a2be0');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(let i=0;i<26;i++){const x=(i*127+Math.sin(t*.18+i)*15)%W,y=(i*43+Math.cos(t*.3+i)*10)%H;ctx.globalAlpha=.18+(1+Math.sin(t+i))*.22;ctx.fillStyle=i%3?'#ffe5a7':'#a8f4e5';ctx.fillRect(x,y,i%3?1.5:2.5,i%3?1.5:2.5)}ctx.globalAlpha=1;
}
const supportImages={};for(const id of ['kiki','nene']){const im=new Image();im.src='assets/walk/'+id+'-idle.png';supportImages[id]=im}
function syncWorldUI(){
 const view=atlasOpen?'atlas':mode==='title'||!S?'title':mode==='battle'?'battle':busy?'dialogue':'explore';
 if(lastView!==view){document.body.dataset.view=view;lastView=view;if(view!=='explore')resetStick();}
 if(S){if(document.body.dataset.place!==S.map)document.body.dataset.place=S.map;const label=realm()+' / '+MAPS[S.map].jp+(S.map==='island'?' Lv.'+islandLevel():'');const node=document.getElementById('locationChip');if(node.textContent!==label)node.textContent=label;}
 const toast=document.getElementById('supportToast');toast.hidden=view!=='explore'||performance.now()>toastUntil;
}
function supportToast(text){document.getElementById('supportToast').textContent=text;toastUntil=performance.now()+6500}
function supportDialogue(who,en,ja){const id=who==='キキ'?'kiki':'nene';return `<div class="support-scene"><img src="assets/walk/${id}-idle.png" alt="${who}"><div>${dialogHtml(who,en,ja)}</div></div>`}
async function supportCamp(){
 while(true){setLog(supportDialogue('キキ','We are always by your side. Where shall we go?','いつでも一緒だよ。案内・英語練習・世界地図を選んでね。'));
 const v=await ask([{label:'キキに道を聞く<small>次の目的・探索のヒント</small>',value:'hint'},{label:'ネネと英語練習<small>今の学習帯で復習</small>',value:'practice'},{label:'三層の世界地図<small>地上・空中・地下</small>',value:'atlas'},{label:'Back<small>冒険に戻る</small>',value:null}],{cancel:null});if(!v)return;
 if(v==='hint'){setLog(supportDialogue('キキ','One step at a time. Let us explore together.',goal()+'<br>世界地図から空中庭園・地底水晶庭も探索できるよ。金色の案内人に話しかけて、ことばの印を集めよう。'));await next()}
 if(v==='practice'){const ok=await quiz(bandQuestion());setLog(supportDialogue('ネネ',ok?'Wonderful! Your words are getting stronger.':'Mistakes help us learn. Let us try again!',ok?'その調子！覚えたことばは冒険でも力になるよ。':'間違えても大丈夫。解説を読んで、学習ノートでもう一度練習しよう。'));await next();save()}
 if(v==='atlas')await openWorldAtlas();
 }
}
const ATLAS_LAYERS={surface:{name:'地上世界',desc:'木々の村、草原、海の港。ことばの水晶を探す冒険の舞台。',map:'village',spawn:[13,9,0],action:'村へ戻る'},sky:{name:'空中世界',desc:'雲に浮かぶ庭園。キキと風のことばを集め、空の印を手に入れよう。',map:'sky',spawn:[12,13,0],action:'空中庭園を探索'},underground:{name:'地下世界',desc:'光る鉱石と水の庭。ネネと地底のことばを読み解こう。',map:'underground',spawn:[12,13,0],action:'地底水晶庭を探索'}};
async function openWorldAtlas(){
 if(mode!=='walk'||!S)return;atlasOpen=true;heldDir=-1;const host=document.getElementById('atlas');host.hidden=false;const previousFocus=document.activeElement;let selected=['sky','underground'].includes(S.map)?S.map:'surface';
 // On the surface layer, discovered places are pinned onto the painting; picking one makes it the travel target.
 let dest=null;const img=document.getElementById('atlasImage');let marks=document.getElementById('atlasMarks');
 if(!marks){marks=document.createElement('div');marks.id='atlasMarks';img.after(marks)}
 const pin=()=>{marks.innerHTML='';if(selected!=='surface'||!img.naturalWidth||!LUMINA_MAPS.has(S.map))return;
  const box=host.getBoundingClientRect(),k=Math.min(box.width/img.naturalWidth,box.height/img.naturalHeight),ox=(box.width-img.naturalWidth*k)/2,oy=(box.height-img.naturalHeight*k)/2,px=t=>(t+.5)*img.naturalWidth/WORLD_ROWS[0].length*k;
  const here=S.map==='world'?[S.x,S.y]:placeTile(S.map);
  for(const [t,p] of Object.entries(WORLD_PLACES)){if(t==='I'||!(p.map==='village'||F()['seen_'+p.map]))continue;const [x,y]=WORLD_POI[t];
   const b=document.createElement('button');b.type='button';b.className='atlas-mark'+(dest===t?' on':'');b.textContent=p.name;b.style.left=ox+px(x)+'px';b.style.top=oy+px(y)+'px';
   b.onclick=()=>{dest=t;document.getElementById('atlasName').textContent=p.name;document.getElementById('atlasDescription').textContent='';document.getElementById('atlasEnter').textContent='ここへ行く';pin()};marks.append(b)}
  if(here){const me=document.createElement('i');me.className='atlas-here';me.style.left=ox+px(here[0])+'px';me.style.top=oy+px(here[1])+'px';marks.append(me)}};
 img.onload=pin;window.addEventListener('resize',pin);
 const show=key=>{selected=key;dest=null;const l=ATLAS_LAYERS[key];img.src=WORLD_ART[key].src;img.alt=l.name+'の全体マップ';document.getElementById('atlasName').textContent=l.name;document.getElementById('atlasDescription').textContent=l.desc;document.getElementById('atlasEnter').textContent=l.action;const gate=key==='sky'?1:key==='underground'?2:-1;document.getElementById('atlasEnter').hidden=key==='surface'?!LUMINA_MAPS.has(S.map):!warpOpen(WARPS[gate],gate);host.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.layer===key)));pin()};
 show(selected);host.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>show(b.dataset.layer));
 await new Promise(resolve=>{const close=()=>{host.hidden=true;atlasOpen=false;document.removeEventListener('keydown',key,true);previousFocus?.focus();resolve()};const key=e=>{if(e.code==='Tab'){const buttons=[...host.querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}};document.addEventListener('keydown',key,true);document.getElementById('atlasClose').onclick=close;document.getElementById('atlasEnter').onclick=()=>{window.removeEventListener('resize',pin);if(dest){const mp=WORLD_PLACES[dest].map;warp(mp,...SPAWN[mp]);close();return}const l=ATLAS_LAYERS[selected];warp(l.map,...l.spawn);supportToast((selected==='underground'?'ネネ':'キキ')+'：'+(selected==='surface'?'村に帰ってきたよ。':'光る道をたどって、案内人に話しかけよう！'));close()};document.getElementById('atlasClose').focus()});
}
function expeditionMap(sky){
 const W=25,H=17,rows=Array.from({length:H},()=>Array(W).fill(sky?'~':'#'));
 const room=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)rows[y][x]='.'};
 room(9,10,15,14);room(3,6,8,10);room(16,5,21,9);room(9,2,15,6);room(6,9,12,10);room(12,8,18,9);room(12,5,13,11);for(let y=3;y<=13;y++)if(rows[y][12]==='.')rows[y][12]='=';for(let x=6;x<=18;x++)if(rows[9][x]==='.')rows[9][x]='=';for(const [x,y] of [[3,6],[8,6],[16,5],[21,5],[9,2],[15,2],[9,14],[15,14]])rows[y][x]='t';rows[14][12]='E';
 return {name:sky?'Aether Gardens':'Lumen Grotto',jp:sky?'空中庭園':'地底水晶庭',fill:sky?'~':'#',theme:{},exit:['village',13,9],zone:sky?'sky':'underground',rows:rows.map(r=>r.join('')),ents:[]};
}
async function expeditionTrial(sky){const flag=sky?'skySeal':'deepSeal',who=sky?'キキ':'ネネ';if(S.flags[flag]){setLog(supportDialogue(who,'You found the seal. Keep exploring with us!','ここの印はもう手に入れたよ。仲間を探しながら英語を磨こう！'));await next();return}
 setLog(supportDialogue(who,'Let your words open the way.','今の学習帯で3問練習しよう。2問正解すると、ことばの印と木の実3個がもらえるよ。'));await next();let correct=0;for(let i=0;i<3;i++)if(await quiz(bandQuestion()))correct++;
 if(correct>=2){S.flags[flag]=1;S.items.berry+=3;save();await sys((sky?'空':'地底')+'のことばの印を手に入れた！ 木の実×3。')}
 else{setLog(supportDialogue(who,'We can try again. I believe in you.','あと少し！学習ノートで復習して、また挑戦しよう。'));await next()}
}
function initGochamaze(){
 initWorldExpansion();
 MAPS.sky=expeditionMap(true);MAPS.underground=expeditionMap(false);
 ZONES.sky={tier:1,foes:['pinecone_sparrow','lantern_moth'],bg:'sky'};ZONES.underground={tier:1,foes:['sprout_ear_mole','silk_leaf_caterpillar'],bg:'underground'};
 MAPLOOK.sky={bg:'#adc9dc',fog:['#e1e9ea',20,48],hemi:['#eaffff','#567c77',.45],sun:['#fff4d4',.65,[-5,9,3]],tint:'#fff8e9',base:'#b6d2e3'};
 MAPLOOK.underground={bg:'#051d2a',fog:['#082c35',12,34],hemi:['#9be6de','#314050',.5],sun:['#c4d6ff',.4,[-3,8,3]],tint:'#ddffff',base:'#071b26',torch:['#77ebd9',2,9]};
 MAPLOOK.village={...MAPLOOK.village,bg:'#71a99b',fog:['#a5c3ab',20,48],hemi:['#dcffe6','#2b573e',.4],sun:['#ffe9a9',.65,[-7,9,5]],tint:'#fff7dc',base:'#3e6549'};
 MAPS.village.jp='こもれびの村';MAPS.village.name='Komorebi Village';MAPS.port.jp='潮風の港';MAPS.port.name='Tidehaven';THEME.village.roof='#3d8064';THEME.port.roof='#568494';
 E('sky',{x:12,y:3,pal:'scholar',name:'風の案内人',talk:()=>expeditionTrial(true)});E('underground',{x:12,y:3,pal:'elder',name:'水晶の案内人',talk:()=>expeditionTrial(false)});
 for(const id of ['sky','underground'])E(id,{x:6,y:8,pal:'shop',name:'旅の商人',talk:()=>shop('Wandering Merchant',[ITEM.herb,ITEM.ether])});
 // Existing story encounters retain their balance and flags, but use this world's creatures.
 const art={blot:'lotus_root_sproutling',bat:'lantern_moth',imp:'silk_leaf_caterpillar',knight:'sprout_ear_mole',wisp:'lantern_moth',gremlin:'seedpod_mouse',shade:'thunder_feather_owlet',golem:'ancient_forest_stag',wisp2:'lantern_moth',dreamling:'lotus_root_sproutling',mirrorknight:'pinecone_sparrow',nightmare:'thunder_feather_owlet',mumble:'ancient_forest_stag',silencer:'ancient_forest_stag'};
 for(const [key,id] of Object.entries(art))ENEMIES[key].worldArt=id;
 MAPS.village.ents=MAPS.village.ents.filter(e=>e.name!=='Kiki & Nene');
 document.getElementById('supportBtn').onclick=()=>{if(mode==='walk'&&!busy&&!anim)run(supportCamp)};
 document.getElementById('atlasBtn').onclick=()=>{if(mode==='walk'&&!busy&&!anim)run(openWorldAtlas)};
 initIslandHub();
 initJoystick();initFullscreen();
}
/* Phones: hide the browser toolbar. Android can enter fullscreen directly; iPhone Safari cannot,
   so the button explains Add to Home Screen, which launches full screen via the web app manifest. */
function initFullscreen(){
 const btn=document.getElementById('fullBtn'),root=document.documentElement;
 const installed=()=>matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches||navigator.standalone===true;
 const sync=()=>{btn.hidden=installed()||!!document.fullscreenElement||!matchMedia('(pointer: coarse)').matches};
 btn.onclick=async()=>{
  if(document.fullscreenEnabled&&root.requestFullscreen){try{await root.requestFullscreen({navigationUI:'hide'});await screen.orientation?.lock?.('landscape').catch(()=>{})}catch(e){}sync();return}
  supportToast('ネネ：iPhoneでは 共有ボタン →「ホーム画面に追加」から開くと、上のバーなしの全画面で遊べるよ。');
 };
 document.addEventListener('fullscreenchange',sync);sync();
}
let stickPointer=null,stickNavTime=0;
function resetStick(){heldDir=-1;stickPointer=null;const el=document.getElementById('joystick');if(el){el.classList.remove('active');document.getElementById('stick').style.transform='translate(0,0)'}}
function stickDirection(dx,dy,r){if(Math.hypot(dx,dy)<r*.18)return -1;return Math.abs(dx)>Math.abs(dy)?dx>0?1:3:dy>0?2:0}
function initJoystick(){
 const el=document.getElementById('joystick'),knob=document.getElementById('stick');
 const move=e=>{if(e.pointerId!==stickPointer)return;e.preventDefault();const b=el.getBoundingClientRect(),r=b.width*.28,dx=e.clientX-b.x-b.width/2,dy=e.clientY-b.y-b.height/2,l=Math.hypot(dx,dy),k=l>r?r/l:1;knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;const d=stickDirection(dx,dy,r);
 if(nav.done){heldDir=-1;if(d>=0&&performance.now()-stickNavTime>200){navMove(d===0||d===3?-1:1);stickNavTime=performance.now()}}else heldDir=mode==='walk'&&!busy?d:-1;};
 el.addEventListener('pointerdown',e=>{if(stickPointer!==null)return;stickPointer=e.pointerId;el.setPointerCapture(e.pointerId);el.classList.add('active');move(e)});el.addEventListener('pointermove',move);
 const end=e=>{if(e.pointerId===stickPointer)resetStick()};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);window.addEventListener('blur',resetStick);window.addEventListener('resize',resetStick);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetStick()});
}
function newGroundTile(mid,m,c,x,y){
 if(c==='~'||c==='v'||c==='w'&&mid!=='village')return null;
 const layer=mid==='world'?(WORLD_LAYER[c]||'green'):MAPS[mid]?.layerOf?.(c)||MAPS[mid]?.ground||(mid==='sky'?'sky': ['underground','cave','tower'].includes(mid)?'deep':mid==='dream'?'sky':mid==='port'?'coast':'green');
 const path=c==='='||c===','||c==='E'||c==='B',key='newground:'+layer+':'+path+':'+(hash(x,y)%4);if(ART_CACHE.has(key))return ART_CACHE.get(key);
 const can=document.createElement('canvas');can.width=can.height=64;const p=can.getContext('2d'),rnd=srand(strHash(key));
 const colors={green:['#477a55','#5c8b61','#7c9d6c'],sky:['#658b77','#799e87','#93ad8d'],deep:['#23494b','#326563','#467a77'],coast:['#b8b898','#cbcfb0','#e4d8ad'],sand:['#c8a46a','#d6b67c','#e2c48c'],ash:['#3e302c','#4e3c36','#62504a'],snow:['#d4dee8','#e4ecf2','#f4f8fc'],farm:['#6a5632','#7a663a','#5f8a3a'],stone:['#4a585c','#5a686c','#6a787c']}[layer];
 p.fillStyle=path?({deep:'#3b6565',green:'#b6ad83',sand:'#b08a58',ash:'#6a5a50',snow:'#c4ccd4',stone:'#7a8888'}[layer]||'#c2c3a4'):colors[0];p.fillRect(0,0,64,64);
 for(let i=0;i<85;i++){p.fillStyle=colors[i%3];p.globalAlpha=path?.15:.55;p.fillRect(rnd()*64,rnd()*64,1+rnd()*4,1+rnd()*3)}p.globalAlpha=1;
 if(path){p.strokeStyle=layer==='deep'?'#64a3a055':'#f3ead055';p.lineWidth=1;for(let row=0;row<3;row++)for(let col=0;col<3;col++){const px=col*24-(row%2)*12,py=row*24;p.beginPath();p.roundRect(px+1,py+1,22,21,5);p.stroke()}}
 else for(let i=0;i<9;i++){p.fillStyle=i%3===0?'#d5d7a2':colors[2];p.fillRect(rnd()*62,rnd()*62,2,2)}ART_CACHE.set(key,can);return can;
}
function buildGochamazeHouse(sc,hs,roof,seed){
 const w=hs.x1-hs.x0+1,d=hs.z1-hs.z0+1,cx=(hs.x0+hs.x1)/2,cz=(hs.z0+hs.z1)/2;
 const body=new THREE.Mesh(new THREE.BoxGeometry(w-.12,1.65,d-.12),new THREE.MeshStandardMaterial({color:'#ddd7ad',roughness:1}));body.position.set(cx,.825,cz);add(sc,body);
 const cap=new THREE.Mesh(new THREE.ConeGeometry(1,1.25,6),new THREE.MeshStandardMaterial({color:roof,roughness:.9,flatShading:true}));cap.scale.set(w*.72,1,d*.8);cap.rotation.y=Math.PI/6;cap.position.set(cx,2.15,cz);add(sc,cap);
 for(const side of [-1,1]){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.10,.13,1.7,7),new THREE.MeshStandardMaterial({color:'#556446'}));trunk.position.set(cx+side*(w/2-.15),.85,hs.z1+.47);add(sc,trunk)}
 for(let i=0;i<w;i++){const door=hs.doors.includes(i);const panel=new THREE.Mesh(new THREE.PlaneGeometry(door?.65:.48,door?1.15:.52),new THREE.MeshStandardMaterial({color:door?'#50674d':'#f7d89a',emissive:door?'#000000':'#d8a64c',emissiveIntensity:.6,side:THREE.DoubleSide}));panel.position.set(hs.x0+i,door?.58:1,hs.z1+.51);sc.add(panel);
 if(!door){const hoop=new THREE.Mesh(new THREE.TorusGeometry(.29,.045,5,16),new THREE.MeshStandardMaterial({color:'#6b7852'}));hoop.position.copy(panel.position);hoop.position.z+=.02;sc.add(hoop)}}
 const orb=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:'#fff0a4'}));orb.position.set(cx,2.85,cz);sc.add(orb);
}
function decorateGochamazeScene(sc,mid,m,out){
 if(mid==='village'||mid==='port'||m.town)townProps(sc,mid,m.rows[0].length,m.rows.length,(x,y)=>tileAt(m,x,y));
 else if(mid!=='sky'&&mid!=='underground'){const trees=[];for(let y=0;y<m.rows.length;y++)for(let x=0;x<m.rows[y].length;x++)if(m.rows[y][x]==='t')trees.push([x,y]);if(trees.length)treeSet(sc,trees,true)}
 decorateLocation(sc,mid,m,out);
 if(mid==='sky'){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#75a9bd');g.addColorStop(1,'#e7f3eb');x.fillStyle=g;x.fillRect(0,0,512,256);for(let i=0;i<18;i++){x.fillStyle='#ffffff55';x.beginPath();x.ellipse((i*97)%512,110+(i*31)%135,55,12,0,0,7);x.fill()}sc.background=new THREE.CanvasTexture(c);}
 if(mid==='sky'||mid==='underground'){
  const rockmat=new THREE.MeshStandardMaterial({color:mid==='sky'?'#729985':'#203e4d',flatShading:true,roughness:1});
  for(const [cx,cy,w,d] of [[12,12,7,5],[5.5,8,6,5],[18.5,7,6,5],[12,4,7,5],[9,9.5,6,2],[15,8.5,6,2],[12.5,8,2,7]]){const cliff=new THREE.Mesh(new THREE.BoxGeometry(w,1.2,d),rockmat);cliff.position.set(cx,-.65,cy);sc.add(cliff);if(w>2&&d>2){const tip=new THREE.Mesh(new THREE.ConeGeometry(w*.6,3,7),rockmat);tip.rotation.z=Math.PI;tip.scale.z=d/w;tip.position.set(cx,-2.5,cy);sc.add(tip)}}
  const trees=[];for(let y=0;y<m.rows.length;y++)for(let x=0;x<m.rows[y].length;x++)if(m.rows[y][x]==='t')trees.push([x,y]);treeSet(sc,trees,true);
  for(const [x,y] of [[10,11],[14,11],[4,9],[20,8]]){const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.35,.25,.3,10),new THREE.MeshStandardMaterial({color:'#b8bb97'}));bowl.position.set(x,.15,y);sc.add(bowl);for(let i=0;i<5;i++){const flower=new THREE.Mesh(new THREE.SphereGeometry(.12,6,5),new THREE.MeshStandardMaterial({color:['#f6c2cc','#dac5f2','#fff1b2'][i%3]}));flower.position.set(x+Math.sin(i*2)*.2,.35,y+Math.cos(i*2)*.2);sc.add(flower)}}
  const archMat=new THREE.MeshStandardMaterial({color:mid==='sky'?'#d4d4b2':'#548b91'});for(const dx of [-1.3,1.3]){const col=new THREE.Mesh(new THREE.CylinderGeometry(.15,.21,2.3,8),archMat);col.position.set(12+dx,1.15,2.5);sc.add(col)}const arch=new THREE.Mesh(new THREE.TorusGeometry(1.3,.17,6,20,Math.PI),archMat);arch.position.set(12,2.3,2.5);sc.add(arch);

  for(const [x,y] of [[4,6],[20,5],[9,3],[15,4]]){const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.7),new THREE.MeshStandardMaterial({color:mid==='sky'?'#c1f8cf':'#60e7e5',emissive:'#308d87',emissiveIntensity:.7,roughness:.2}));crystal.position.set(x,.9,y);sc.add(crystal);out.anim.push(t=>{crystal.rotation.y=t*.0004;crystal.position.y=.9+Math.sin(t/900+x)*.12})}
 }
 decorateIsland(sc,mid,m,out);
}
