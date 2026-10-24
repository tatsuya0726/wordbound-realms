/* Island nation hub ("ことのは島"): the home base of a monster-master story.
   The king asks the hero to grow the nation with monsters befriended through warp points. Kiki keeps the ranch,
   Nene runs breeding; churu treats and more monsters raise the island level, which reshapes the island.
   Warp gates lead to other worlds; beating a world's boss opens the next gate. The arena holds 3-battle gauntlets. */

const ISLAND_LEVELS=[0,12,30,55,85];            // score needed for Lv1..Lv5
/* Island template. Digits are cells that change with progress:
   1 sea→bridge (Lv2)  2 forest→meadow (Lv3)  3 forest→hot spring (Lv3)  4 forest→farm (Lv3)  5 rock→path (Lv4)  6 sea→beach (arena bronze). */
const ISLAND_TEMPLATE=[
 "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
 "wwww,,,wwwwwwwwwwwwwwwwwwwwwwwwwwwww",
 "www,,f,5ww222222rrrrrrrrr222wwwwwwww",
 "www,,,,5ww233322rrrrrrrrr2442wwwwwww",
 "wwww555www233322#########2442wwwwwww",
 "wwwww5,,,,222222####dd###2222,wwwwww",
 "wwww,,,,,,,,,,,,,,,,,,,,,,,,,,,wwwww",
 "www,rrrr,,l,,,,,,,,,,,,,,,l,FFFFFFFw",
 "www,rrrr,,,,,,,,,,,,,,,,,,,,F.....Fw",
 "www,####,,,,,,,,,,,,,,,,,,,,F.....Fw",
 "www,#d##,,,,,,,,,,,,,,,,,,,,......Fw",
 "www,,,,,,,,,,,,,,,,,,,,,,,,,F.....Fw",
 "www,,f,,,,,,,,,,,,,,,,,,,,,,F.....Fw",
 "www,,,,,,,,,,,,,,,,,,,,,,,,,FFFFFFFw",
 "wwww,rrrr,,,,,,,,,,,,,,,,,,,,wwwwwww",
 "wwww,####,ccc,,,,,,,,,,,,,,,,ww,,,,w",
 "wwww,#d##,,,,,,,,,,,,,,,,,,,,11,,,,w",
 "wwww,,,,,,,,,,,,,,,,,,,,,,,,,,w,rrrw",
 "wwwww,,f,,,,,,,,,,,,,,,,,,,,www,###w",
 "wwwwww,,,,,,,,,,,,,,,,,,,,,,www,#d#w",
 "wwwwwww6666666666666666666wwwwwwwwww",
 "wwwwwww6666666666666666666wwwwwwwwww",
 "wwwwwwwww666666666666666wwwwwwwwwwww",
 "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww"];
const RANCH={x0:29,x1:33,y0:8,y1:12};

/* Warp destinations, in order. `clear` is the flag set when that world's boss falls. */
const WARPS=[
 {id:'meadow',name:'はじまりの草原',map:'meadow',spawn:[13,15,0],clear:'clear1',gate:[14,9],boss:'草原の主'},
 {id:'sky',name:'空中庭園',map:'sky',spawn:[12,13,0],clear:'clear2',gate:[17,8],boss:'空の王'},
 {id:'underground',name:'地底水晶庭',map:'underground',spawn:[12,13,0],clear:'clear3',gate:[20,9],boss:'水晶の番人'},
 {id:'lumina',name:'ルミナ大陸',map:'village',spawn:[12,13,0],clear:'won',gate:[15,12],boss:'沈黙の王'},
 {id:'dream',name:'夢の島',map:'dream',spawn:[9,14,0],clear:'dreamWon',gate:[19,12],boss:'悪夢の主',arena:'silver'}];
const LUMINA_MAPS=new Set(['village','port','cave','tower','world','castle','ashfield','oasis','lighthouse','grove','shrine','ruins','volcano']);

/* Arena: three back-to-back battles against a foreign monster master. HP is not restored between rounds. */
const ARENA=[
 {id:'bronze',name:'ブロンズ杯',rival:'港の国のマスター・トモ',hp:26,atk:7,need:()=>islandLevel()>=2,needText:'島レベル2（橋の完成）',
  rounds:[['seedpod_mouse'],['lotus_root_sproutling','pinecone_sparrow'],['silk_leaf_caterpillar','seedpod_mouse','lotus_root_sproutling']],gold:150,churu:2,unlock:'南の浜辺が現れる'},
 {id:'silver',name:'シルバー杯',rival:'砂の国のマスター・リーア',hp:60,atk:14,need:()=>!!F().clear2,needText:'空中庭園のボスを倒す',
  rounds:[['lantern_moth','pinecone_sparrow'],['sprout_ear_mole','silk_leaf_caterpillar'],['thunder_feather_owlet','lantern_moth','sprout_ear_mole']],gold:300,churu:3,unlock:'夢の島へのワープが開く（ルミナ大陸クリア後）'},
 {id:'gold',name:'ゴールド杯',rival:'雪の国のチャンピオン・カイ',hp:110,atk:22,need:()=>!!F().won,needText:'ルミナ大陸の沈黙の王を倒す',
  rounds:[['thunder_feather_owlet','sprout_ear_mole'],['ancient_forest_stag','lantern_moth'],['ancient_forest_stag','thunder_feather_owlet','lotus_root_sproutling']],gold:600,churu:5,unlock:'チャンピオンの冠を授かる'}];

/* ---------------- state ---------------- */
function isle(){return S.island||(S.island={kiki:0,nene:0,seenLevel:1,arena:{}})}
function islandScore(){const i=isle(),clears=WARPS.filter(w=>F()[w.clear]).length,ranks=ARENA.filter(a=>i.arena[a.id]).length;
 return Math.min(S.companions.owned.length,15)*3+(i.kiki+i.nene)*2+clears*12+ranks*10}
function islandLevel(){const s=islandScore();let lv=1;ISLAND_LEVELS.forEach((need,i)=>{if(s>=need)lv=i+1});return lv}
function nextLevelNeed(){const lv=islandLevel();return lv>=ISLAND_LEVELS.length?null:ISLAND_LEVELS[lv]-islandScore()}
function warpOpen(w,i){if(i===0)return true;if(!F()[WARPS[i-1].clear])return false;if(w.arena&&!isle().arena[w.arena])return false;return true}
function realm(){if(!S)return '';if(S.map==='island')return '拠点';if(LUMINA_MAPS.has(S.map))return 'ルミナ大陸';return '異世界'}

/* Paved cells: the warp plaza, the castle forecourt and roads to the hut, ranch, shops, beach and bridge. Everything else is grass. */
function islandPaved(x,y){return (x>=11&&x<=24&&y>=6&&y<=13)||(y===6&&x>=4&&x<=30)||(y===11&&x>=4&&x<=11)||(y===10&&x>=24&&x<=28)||
 (x===17&&y>=13&&y<=19)||(y===16&&x>=5&&x<=28)||(x===6&&y>=11&&y<=16)||(x<=7&&y<=3)}
function islandRows(){const lv=S?islandLevel():1,beach=S?!!isle().arena.bronze:false;
 return ISLAND_TEMPLATE.map((r,y)=>[...r].map((c,x)=>c===','&&!islandPaved(x,y)?'.':c).join('').replace(/[1-6]/g,d=>({1:lv>=2?'B':'w',2:lv>=3?'.':'t',3:lv>=3?'w':'t',4:lv>=3?'u':'t',5:lv>=4?',':'#',6:beach?'s':'w'}[d])))}
/* Rebuild the island when its shape may have changed (level, beach) or when the ranch population changed. */
function refreshIsland(){MAPS.island.rows=islandRows();if(GL.scenes)delete GL.scenes.island}

/* ---------------- maps ---------------- */
const MEADOW_ROWS=[
 "############################",
 "#tt.....tt..........tt....t#",
 "#t.......f....,,,.....f....#",
 "#....tt......,,,,,......tt.#",
 "#....tt...f...,,,....f.....#",
 "#.........................t#",
 "#t...ww......f.........ff..#",
 "#...wwww...........tt......#",
 "#....ww....tt......tt...f..#",
 "#.f........tt..............#",
 "#.....................ww...#",
 "#..tt......f.........wwww..#",
 "#..tt...............t.ww...#",
 "#........,,,,,,,,..........#",
 "#t.....f,,,,,,,,,,f......tt#",
 "#tt.......,,,,,,,.......ttt#",
 "############################"];

function addIslandMaps(){
 MAPS.island={name:'Kotonoha Isle',jp:'ことのは島',fill:'w',theme:{},rows:islandRows(),ents:[],town:1,sea:1,walls:'cave',ground:'green',layerOf:c=>c==='s'?'sand':c==='u'?'farm':null};
 MAPS.meadow={name:'First Meadow',jp:'はじまりの草原',fill:'#',theme:{},rows:MEADOW_ROWS,ents:[],zone:'meadow',walls:'hedge',ground:'green',exit:['island',14,10]};
 Object.assign(MAPLOOK,{
  island:{bg:'#7fc4e8',fog:['#bfe4f2',22,52],hemi:['#eaf8ff','#4a7a5a',.5],sun:['#fff2d4',1.3,[-6,10,5]],tint:'#ffffff',base:'#2a6fb8'},
  meadow:{bg:'#9fd0e8',fog:['#cfe8d8',20,46],hemi:['#effff0','#4a7a4a',.5],sun:['#fff4d8',1.25,[-6,9,5]],tint:'#ffffff',base:'#3f7f36'}});
 THEME.island={roof:'#c8553f'};
 Object.assign(SPAWN,{island:[17,14,0],meadow:WARPS[0].spawn,sky:WARPS[1].spawn,underground:WARPS[2].spawn});INNS.island=[8,17];
 ZONES.meadow={tier:1,foes:['seedpod_mouse','lotus_root_sproutling','silk_leaf_caterpillar','pinecone_sparrow'],bg:'plains'};
 // Worlds now return to the island instead of the old village.
 for(const id of ['sky','underground','dream'])MAPS[id].exit=['island',WARPS.find(w=>w.map===id).gate[0],WARPS.find(w=>w.map===id).gate[1]+1];
 for(const c of ['s','u'])WALK.add(c);
 Object.assign(ENEMIES,{
  meadowking:{name:'Meadow Lord',jp:'草原の主',hp:70,atk:9,exp:45,gold:60,spr:'golem',pal:{1:'#6aa04a',A:'#ffe080'},boss:1,tier:1,skill:'Root Stomp',worldArt:'lotus_root_sproutling'},
  skyowl:{name:'Sky King',jp:'空の王',hp:115,atk:14,exp:80,gold:100,spr:'wisp',pal:{1:'#8ab8e8',2:'#fff',E:'#123'},boss:1,tier:2,skill:'Thunder Wing',worldArt:'thunder_feather_owlet'},
  crystalmole:{name:'Crystal Warden',jp:'水晶の番人',hp:150,atk:18,exp:110,gold:130,spr:'golem',pal:{1:'#5ac8d0',A:'#e0ffff'},boss:1,tier:2,skill:'Prism Crush',worldArt:'sprout_ear_mole'}});
 ITEM.churu={id:'churu',n:'Churu チュール',d:'キキとネネの大好物',p:20,kind:'item'};
 for(const rank of ARENA)for(const id of new Set(rank.rounds.flat())){const s=CD.species[id],k=1+(s.power-3)*.1;
  ENEMIES['ar_'+rank.id+'_'+id]={name:s.name,jp:s.name,hp:Math.round(rank.hp*k),atk:Math.round(rank.atk*k),exp:Math.round(rank.hp*.6),gold:Math.round(rank.hp*.4),spr:'wisp',pal:{1:'#9bd573',2:'#fff',E:'#142020'},worldArt:id}}
}

/* ---------------- people and events ---------------- */
function addIslandEvents(){
 const I='island';
 E(I,{x:19,y:6,pal:'elder',name:'King Oswin',talk:kingTalk});
 E(I,{x:27,y:9,pal:'kiki',scale:.82,name:'Kiki',talk:kikiTalk});
 E(I,{x:6,y:11,pal:'nene',scale:.82,name:'Nene',talk:neneTalk});
 E(I,{x:11,y:14,pal:'shop',name:'Mia',talk:()=>shop('Shopkeeper Mia',[ITEM.churu,ITEM.berry,ITEM.herb,ITEM.ether])});
 E(I,{x:7,y:17,pal:'inn',name:'Tom',talk:()=>inn('Innkeeper Tom',6,'island')});
 E(I,{x:17,y:13,prop:'sign',talk:islandBoard});
 E(I,{x:31,y:18,pal:'guard',name:'Arena',cond:()=>islandLevel()>=2,talk:arenaDesk});
 E(I,{x:14,y:5,pal:'granny',name:'Hot Spring',cond:()=>islandLevel()>=3,talk:async()=>{S.hp=maxHp();S.mp=maxMp();await say('Hot Spring Keeper',"Relax in the hot spring. You look refreshed!","温泉でゆっくりしていって。すっきりした顔ね！");await sys('HPとMPが全回復した。')}});
 E(I,{x:29,y:5,pal:'granny',name:'Farmer',cond:()=>islandLevel()>=3,talk:async()=>{const n='Farmer Ken';
  if(F().farmDay===S.stats.right+S.stats.wrong){await say(n,"The berries need more time to grow. Answer some questions on your journey!","木の実はまだ育ち中。旅で問題に答えてきてね！");return}
  F().farmDay=S.stats.right+S.stats.wrong;S.items.berry+=2;await say(n,"Fresh berries from the island farm!","島の畑でとれた木の実だよ！");await sys('木の実×2を手に入れた。')}});
 E(I,{x:5,y:2,pal:'scholar',name:'Sage',cond:()=>islandLevel()>=4,talk:async()=>{const n='Summit Sage';
  await say(n,"From here you can see the whole island. It has grown so much!","ここから島全体が見える。ずいぶん大きくなったものだ。");
  if(islandLevel()>=5&&!F().summitGift){F().summitGift=1;S.items.ether+=5;S.items.churu=(S.items.churu||0)+5;save();await sys('島レベル5の記念！ エーテル×5とチュール×5を手に入れた。')}
  else await sys(`島レベル ${islandLevel()} ・ スコア ${islandScore()}`)}});
 E(I,{x:15,y:21,pal:'sailor',name:'Beach Trader',cond:()=>!!isle().arena.bronze,talk:async()=>{const n='Beach Trader';
  if(!F().beachGift){F().beachGift=1;S.items.churu=(S.items.churu||0)+2;await say(n,"Welcome to the new beach! A gift for the arena hero.","新しい浜辺へようこそ！闘技場の英雄に贈り物だ。");await sys('チュール×2を手に入れた。');return}
  await shop(n,[ITEM.churu,ITEM.ether,ITEM.berry])}});
 WARPS.forEach((w,i)=>E(I,{x:w.gate[0],y:w.gate[1],prop:'warp',warp:i,talk:()=>useGate(i)}));
 // Each world gets a gate home near where you arrive.
 E('meadow',{x:12,y:15,prop:'warp',home:1,talk:goHome});
 E('sky',{x:10,y:13,prop:'warp',home:1,talk:goHome});E('underground',{x:10,y:13,prop:'warp',home:1,talk:goHome});
 E('village',{x:10,y:13,prop:'warp',home:1,talk:goHome});E('dream',{x:7,y:14,prop:'warp',home:1,talk:goHome});
 // Meadow
 E('meadow',{x:16,y:13,pal:'scholar',name:'Researcher',talk:async()=>{const n='Researcher Lily';
  await say(n,"Wild monsters live here. Give a berry, then scout them!","ここには野生のモンスターがいるの。木の実をあげてからスカウトしてね！");
  if(!F().lilyGift){F().lilyGift=1;S.items.berry+=3;await sys('木の実×3を受け取った。')}}});
 E('meadow',{x:14,y:2,boss:'meadowking',cond:()=>!F().clear1,talk:()=>worldBoss(0,'meadowking',"Grrr... who walks in my meadow?","グルル…わしの草原を歩くのは誰じゃ？")});
 E('sky',{x:14,y:3,boss:'skyowl',cond:()=>!F().clear2,talk:()=>worldBoss(1,'skyowl',"The sky belongs to me. Show me your words!","空はわたしのもの。ことばの力を見せてみよ！")});
 E('underground',{x:14,y:3,boss:'crystalmole',cond:()=>!F().clear3,talk:()=>worldBoss(2,'crystalmole',"Only clear words may pass the crystal.","澄んだことばだけが水晶を通れる。")});
}

async function kingTalk(){const n='King Oswin';
 if(!F().metKing){F().metKing=1;
  await say(n,"Welcome, young one. I can feel it: you have the gift of a Monster Master.","よく来た、若者よ。そなたにはモンスターマスターの素質を感じる。");
  await say(n,"Our island is small. With monsters as friends, it can grow.","我が島は小さい。モンスターが仲間になれば、もっと大きくなれる。");
  await say(n,"Use the warp points in the square. Befriend monsters in other worlds and bring them home.","広場のワープポイントを使い、異世界でモンスターを仲間にして連れ帰ってほしい。");
  await say(n,"Kiki keeps our ranch, and Nene runs the breeding hut. They love churu!","キキは牧場、ネネは配合小屋を任されておる。二匹ともチュールが大好物だ。");
  S.items.churu=(S.items.churu||0)+2;save();await sys('チュール×2を受け取った。');return}
 const lv=islandLevel(),clears=WARPS.filter(w=>F()[w.clear]).length;
 if(lv>=5&&isle().arena.gold&&!F().crown){F().crown=1;S.gold+=1000;save();await say(n,"Our island has become a great nation. You are our champion!","島は立派な国になった。そなたこそ我らのチャンピオンだ！");await sys('王から1000ゴールドを授かった！');return}
 await say(n,`The island is level ${lv}. ${clears} worlds have been set free.`,`島はレベル${lv}。解放した異世界は${clears}つだ。`)}

async function kikiTalk(){const n='キキ',i=isle(),owned=S.companions.owned.length;
 setLog(supportDialogue(n,'Welcome to the ranch!',`牧場には ${owned} 体のモンスターがいるよ。`));
 const v=await ask([{label:`チュールをあげる（${S.items.churu||0}）`,value:'churu',disabled:!(S.items.churu>0)},{label:'仲間の編成',value:'team'},{label:'図鑑',value:'dex'},{label:'もどる',value:null}],{cancel:null});
 if(v==='churu')return giveChuru('kiki');
 if(v==='team'||v==='dex')return ranch()}
async function neneTalk(){const n='ネネ';
 setLog(supportDialogue(n,'Let us make new friends together.',`配合はふたつの個体から新しいモンスターを生むよ。配合 ${S.companions.breeds||0} 回。`));
 const v=await ask([{label:`チュールをあげる（${S.items.churu||0}）`,value:'churu',disabled:!(S.items.churu>0)},{label:'配合する',value:'breed'},{label:'呪文の練習',value:'practice'},{label:'もどる',value:null}],{cancel:null});
 if(v==='churu')return giveChuru('nene');
 if(v==='breed')return breeding();
 if(v==='practice'){const ok=await quiz(bandQuestion());await sys(ok?'ネネ：その調子！':'ネネ：まちがえても大丈夫。')}}
const CHURU_GIFTS={3:['berry',3],6:['ether',2],10:['berry',5],15:['ether',4],20:['churu',3]};
async function giveChuru(cat){const i=isle(),who=cat==='kiki'?'キキ':'ネネ';S.items.churu--;i[cat]++;
 setLog(supportDialogue(who,'Purr... delicious!',`${who}は夢中で食べている！（${i[cat]}本目）`));await next();
 const g=CHURU_GIFTS[i[cat]];if(g){S.items[g[0]]=(S.items[g[0]]||0)+g[1];await sys(`${who}がお礼に${ITEM[g[0]].n.split(' ')[1]}×${g[1]}をくれた！`)}
 save();await checkIslandLevel()}

async function islandBoard(){const lv=islandLevel(),need=nextLevelNeed(),clears=WARPS.filter(w=>F()[w.clear]).length;
 await sys(`<b>ことのは島 Lv.${lv}</b>（スコア ${islandScore()}${need?` ・ 次まで ${need}`:''}）<br>モンスター ${S.companions.owned.length}体 ・ チュール キキ${isle().kiki}/ネネ${isle().nene} ・ 異世界 ${clears}/${WARPS.length} ・ 闘技場 ${ARENA.filter(a=>isle().arena[a.id]).length}/${ARENA.length}`)}

const LEVEL_NEWS={2:'東の小島に橋がかかり、闘技場へ行けるようになった！',3:'北の森が開かれ、温泉と畑ができた！',4:'北西の岩がくずされ、山頂への道が通じた！',5:'島が大きな国になった！ 山頂の賢者を訪ねよう。'};
async function checkIslandLevel(){const lv=islandLevel(),i=isle();if(lv<=i.seenLevel)return;
 for(let l=i.seenLevel+1;l<=lv;l++){await sys(`<b>島レベルが ${l} になった！</b><br>${LEVEL_NEWS[l]}`)}
 i.seenLevel=lv;refreshIsland();save()}

async function useGate(i){const w=WARPS[i];
 if(!warpOpen(w,i)){const prev=WARPS[i-1];await sys(`ワープポイントは眠っている。`+(prev&&!F()[prev.clear]?`<br>「${prev.name}」の${prev.boss}を倒そう。`:'')+(w.arena&&!isle().arena[w.arena]?'<br>闘技場のシルバー杯で優勝しよう。':''));return}
 if(!await yesno('ワープポイント',`To ${w.name}?`,`「${w.name}」へワープする？${F()[w.clear]?'（クリア済み）':''}`,'ワープする','やめる'))return;
 visit(w.map);warp(w.map,...w.spawn)}
async function goHome(){if(!await yesno('ワープポイント','Return to the island?','ことのは島へ帰る？','帰る','まだいる'))return;returnToIsland();await checkIslandLevel()}
function returnToIsland(gateIndex){const w=WARPS[gateIndex??WARPS.findIndex(w=>w.map===S.map)]||WARPS[0];refreshIsland();warp('island',w.gate[0],w.gate[1]+1,2)}

async function worldBoss(i,key,en,ja){const w=WARPS[i];await say(w.boss,en,ja);
 const r=await battle(key);
 if(r==='win'){F()[w.clear]=1;S.gold+=100*(i+1);S.items.churu=(S.items.churu||0)+2;save();
  await sys(`◆ ${w.name}のボスを倒した！ ${100*(i+1)}ゴールドとチュール×2。`+(WARPS[i+1]?`<br>島のワープポイント「${WARPS[i+1].name}」が目を覚ました。`:''));
  returnToIsland(i);await checkIslandLevel()}
 else if(r==='lose')await gameOver()}

async function arenaDesk(){const n='Arena Clerk',i=isle();
 await say(n,"Welcome to the island arena! Three battles in a row, no healing between rounds.","島の闘技場へようこそ！3連戦、途中で回復はできません。");
 const v=await ask([...ARENA.map(a=>({label:`${a.name}${i.arena[a.id]?' ◆':''}<small>${a.need()?a.rival:'条件：'+a.needText}</small>`,value:a.id,disabled:!a.need()})),{label:'やめる',value:null}],{cancel:null});
 if(!v)return;const a=ARENA.find(x=>x.id===v);
 if(!await yesno(n,`${a.name}: vs ${a.rival}. Ready?`,`${a.name}：${a.rival}と3連戦。準備はいい？`,'挑戦する','やめる'))return;
 for(let k=0;k<a.rounds.length;k++){
  await sys(`<b>${a.name} 第${k+1}戦</b><br>${a.rival}がモンスターを繰り出した！`);
  const r=await battle('ar_'+a.id+'_'+a.rounds[k][0],{keys:a.rounds[k].map(id=>'ar_'+a.id+'_'+id)});
  if(r==='lose')return gameOver();
  if(r!=='win'){await sys('試合を棄権した。');return}}
 const first=!i.arena[a.id];i.arena[a.id]=1;S.gold+=a.gold;S.items.churu=(S.items.churu||0)+a.churu;
 if(a.id==='gold'&&first)equip('weapon','Champion Crown 王者の冠',34);
 save();await say(a.rival,"You are strong. Your island must be proud of you.","強いな。島の人々もきっと誇りに思うだろう。");
 await sys(`<b>${a.name} 優勝！</b> ${a.gold}ゴールドとチュール×${a.churu}。`+(first?`<br>${a.unlock}`:''));
 refreshIsland();if(first&&a.id==='bronze'){warp('island',S.x,S.y,S.dir)}await checkIslandLevel()}

/* ---------------- island decoration: warp gates, ranch monsters, steam ---------------- */
function warpProp(sc,e){const g=new THREE.Group(),open=e.home||warpOpen(WARPS[e.warp],e.warp),col=e.home?'#7ef0ff':['#9ad870','#9ad0ff','#7ef0e0','#ffd27a','#e0a0ff'][e.warp];
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.46,.5,.12,20),stdMat('warpBase',{color:'#c8c4b8'}));base.position.y=.06;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.05,8,28),new THREE.MeshStandardMaterial({color:col,emissive:open?col:'#000',emissiveIntensity:open?1.1:0}));ring.rotation.x=Math.PI/2;ring.position.y=.14;
 g.add(base,ring);if(open){const beam=new THREE.Mesh(new THREE.CylinderGeometry(.3,.34,1.6,16,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));beam.position.y=.9;g.add(beam);g.userData.beam=beam}
 base.receiveShadow=true;sc.add(g);return g}
function decorateIsland(sc,mid,m,out){
 if(mid!=='island')return;
 // Monsters from the ranch roam inside the fence.
 const owned=S?S.companions.owned.slice(0,14):[];const walkers=owned.map((mon,i)=>{const can=creatureCanvas(mon.id);if(!can)return null;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:sprTex(can),alphaTest:.4}));const s=AIRBORNE_SPECIES.has(mon.id)?.7:.85;sp.scale.set(s,s,1);sp.center.set(.5,0);sc.add(sp);
  return {sp,fly:AIRBORNE_SPECIES.has(mon.id),seed:i*2.17+1}}).filter(Boolean);
 out.anim.push(t=>{walkers.forEach(w=>{const k=t*.00018+w.seed;const x=RANCH.x0+(RANCH.x1-RANCH.x0)*(.5+.5*Math.sin(k*1.3+w.seed));const z=RANCH.y0+(RANCH.y1-RANCH.y0)*(.5+.5*Math.sin(k*.9+w.seed*1.7));
  w.sp.position.set(x,w.fly?.35+Math.sin(t*.004+w.seed)*.1:0,z);w.sp.material.rotation=0})});
 // Steam over the hot spring.
 if(islandLevel()>=3){const puffs=[];for(let i=0;i<8;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.35,depthWrite:false}));sc.add(p);puffs.push(p)}
  out.anim.push(t=>puffs.forEach((p,i)=>{const k=((t*.0003)+i/8)%1;p.position.set(12+Math.sin(i*2.3)*.8,.3+k*1.6,3.5+Math.cos(i*1.7)*.5);p.material.opacity=.4*(1-k);p.scale.setScalar(.6+k*1.4)}))}
 // A banner over the arena and festival lanterns at Lv5.
 if(islandLevel()>=2){const flag=new THREE.Mesh(new THREE.PlaneGeometry(.6,.36),new THREE.MeshBasicMaterial({color:'#e8b84a',side:THREE.DoubleSide}));flag.position.set(33,3.3,18);sc.add(flag);out.anim.push(t=>{flag.rotation.y=Math.sin(t*.003)*.5})}
 if(islandLevel()>=5)strand(sc,[4,2.6,6.4],[31,2.6,6.4],.6,60);
}

/* ---------------- goals, journal, migration ---------------- */
function hubGoal(){const f=F();
 if(!f.metKing)return '城の前の王様（King Oswin）に話しかけよう。';
 if(LUMINA_MAPS.has(S.map)&&!f.won)return worldGoal();
 const i=WARPS.findIndex((w,k)=>!f[w.clear]&&warpOpen(w,k));
 if(i>=0)return i===3?'ワープポイント「ルミナ大陸」へ。'+worldGoal():`ワープポイントから「${WARPS[i].name}」へ。モンスターを仲間にして、${WARPS[i].boss}を倒そう。`;
 const a=ARENA.find(a=>a.need()&&!isle().arena[a.id]);if(a)return `闘技場の${a.name}で優勝しよう。`;
 const blocked=WARPS.findIndex((w,k)=>!f[w.clear]);if(blocked>=0)return `「${WARPS[blocked].name}」へ行くには闘技場のシルバー杯で優勝しよう。`;
 return islandLevel()<5?'チュールをあげたり仲間を増やしたりして、島をレベル5まで発展させよう。':'島は大きな国になった！ 王様に報告しよう。'}
function hubJournal(){const f=F(),i=isle();
 return `<p class="progress-note">ことのは島 Lv.${islandLevel()} ・ スコア ${islandScore()}</p><ol class="journal-list">${WARPS.map((w,k)=>`<li class="${f[w.clear]?'complete':warpOpen(w,k)?'current':''}">${f[w.clear]?'◆':warpOpen(w,k)?'▸':'◇'} ${w.name}<small> ボス：${w.boss}</small></li>`).join('')}</ol>`+
  `<p class="progress-note">闘技場</p><ul class="journal-list">${ARENA.map(a=>`<li class="${i.arena[a.id]?'complete':''}">${i.arena[a.id]?'◆':'◇'} ${a.name}<small> ${a.rival}</small></li>`).join('')}</ul>`}
/* Saves from before the island: keep everything, start them on the island with the king already met. */
function migrateHub(savedVersion){
 if(!S||savedVersion>=1)return;
 S.hubV=1;isle();F().metKing=1;
 if(F().won){F().clear1=F().clear2=F().clear3=1}
 S.map='island';[S.x,S.y]=SPAWN.island;S.dir=0;S.inn='island';
}

function initIslandHub(){addIslandMaps();addIslandEvents()}
