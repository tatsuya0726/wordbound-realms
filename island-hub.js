/* Island nation hub ("ことのは島"): the home base of a monster-master story.
   The king asks the hero to grow the nation with monsters befriended through warp points. Kiki keeps the ranch,
   Nene runs breeding; churu treats and more monsters raise the island level, which reshapes the island.
   Warp gates lead to other worlds; beating a world's boss opens the next gate. The arena holds 3-battle gauntlets.
   The castle, shops and houses have doors: walking into a door enters that building's interior map. */

const ISLAND_LEVELS=[0,12,30,55,85];            // score needed for Lv1..Lv5
const ISLE_W=56,ISLE_H=34;
/* Fixed places on the island. `doors` maps a door cell to the interior it opens. */
const ISLE={spawn:[24,13,0],kiki:[34,12],ranch:{x0:36,x1:42,y0:11,y1:15},spring:[9,6.5],arena:[50.5,17],
 doors:{'24,8':'i_castle','25,8':'i_castle','6,16':'i_shop','11,16':'i_books','6,21':'i_inn','11,21':'i_house','16,21':'i_hut','29,23':'i_house2'}};
const RANCH=ISLE.ranch;

/* Builds the island template. Digits are cells that change with progress:
   1 sea→bridge (Lv2)  2 forest→meadow (Lv3)  3 forest→hot spring (Lv3)  4 forest→farm (Lv3)  5 rock→path (Lv4)  6 sea→beach (arena bronze). */
function islandTemplate(){
 const W=ISLE_W,H=ISLE_H,g=Array.from({length:H},()=>Array(W).fill('w'));
 const put=(c,x0,y0,x1=x0,y1=y0)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(y>=1&&y<H-1&&x>=1&&x<W-1)g[y][x]=c};
 // Main island: a wobbly oval with trees along the shore.
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const dx=(x-24)/21,dy=(y-16)/12.8,d=dx*dx+dy*dy+((hash(x,y)%7)-3)*.012;if(d<1)g[y][x]=d>.84&&hash(x+3,y)%3===0?'t':'.'}
 put('.',18,3,30,10);put('.',5,4,16,11);put('.',32,3,41,7);put('.',33,9,44,17);put('.',3,13,21,23);put('.',48,15,53,23);
 // North-west forest with the hot spring and farm inside; north-east summit behind a rock wall.
 put('2',5,4,16,10);put('3',8,6,10,7);put('4',12,6,14,7);
 put('#',31,3,31,8);put('#',32,8,41,8);put('5',36,8,37,8);
 // Roads: plaza, castle forecourt, town streets, the east road to the bridge, the south road to the beach.
 put(',',15,10,34,16);put(',',22,9,27,9);put(',',5,11,16,11);put(',',4,17,20,17);put(',',4,22,22,22);put(',',20,17,20,22);
 put(',',22,16,22,28);put(',',22,19,44,19);put(',',29,19,29,24);put('1',45,19,47,19);put(',',48,19,50,19);
 // Ranch fence with a gate on the west side.
 for(let x=35;x<=43;x++){g[10][x]='F';g[16][x]='F'}for(let y=10;y<=16;y++){g[y][35]='F';g[y][43]='F'}put('.',36,11,42,15);g[13][35]='.';
 // Buildings: roof rows (r) over a wall row (#) holding the door (d).
 const house=(x0,y0,x1,y1,doors)=>{put('r',x0,y0,x1,y1-1);put('#',x0,y1,x1,y1);for(const x of doors)g[y1][x]='d'};
 house(20,4,29,8,[24,25]);put('#',20,7,29,7);   // castle: two wall rows
 house(5,14,8,16,[6]);house(10,14,13,16,[11]);house(5,19,8,21,[6]);house(10,19,13,21,[11]);house(15,19,18,21,[16]);house(28,21,31,23,[29]);
 house(49,16,52,18,[]);                          // arena hall
 // A lived-in town: villagers' homes (locked doors), the great tree, market stalls (c), a well (q),
 // barrels (b), crates (k) and an orchard south-east.
 house(34,20,37,22,[35]);house(39,20,42,22,[40]);
 put('G',25,24,27,26);put('Z',24,11,25,12);   // great tree, plaza fountain
 for(const [x,y] of [[16,11],[33,11],[16,13],[33,13]])g[y][x]='p';
 put('c',16,16,18,16);put('c',28,16,30,16);
 g[12][8]='q';g[16][4]='b';g[16][14]='k';g[21][19]='b';g[22][33]='k';g[18][27]='q';
 for(const y of [25,27])for(let x=30;x<=38;x+=2)if(g[y][x]!=='w')g[y][x]='t';
 // Mailboxes beside the doors and flower beds along the streets (x is a mailbox, f flowers).
 for(const [x,y] of [[9,16],[9,21],[14,21],[32,23]])g[y][x]='x';
 for(const [x,y] of [[5,18],[8,18],[10,18],[13,18],[5,23],[8,23],[10,23],[13,23],[15,23],[18,23],[27,24],[31,24]])if(g[y][x]==='.'||g[y][x]==='t')g[y][x]='f';
 for(const [x,y] of [[15,10],[34,10],[15,16],[34,16],[21,9],[28,9],[3,17],[21,23]])g[y][x]='l';
 // The south shallows become a beach after the bronze cup.
 for(let y=29;y<=31;y++)for(let x=9;x<=39;x++)if(g[y][x]==='w')g[y][x]='6';
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(g[y][x]==='.'&&hash(x+11,y+5)%13===0)g[y][x]='f';
 return g.map(r=>r.join(''))}
let ISLAND_TEMPLATE=null;   // built on first use (needs hash() from the main script)

/* Warp destinations, in order. `clear` is the flag set when that world's boss falls.
   `floors` random floors come before the boss floor; `bossSpawn` is where the boss floor starts. */
const WARPS=[
 {id:'meadow',name:'はじまりの草原',map:'meadow',spawn:[13,15,0],bossSpawn:[14,6,0],floors:2,clear:'clear1',gate:[18,14],boss:'草原の主'},
 {id:'sky',name:'空中庭園',map:'sky',spawn:[12,13,0],bossSpawn:[12,7,0],floors:3,clear:'clear2',gate:[21,12],boss:'空の王'},
 {id:'underground',name:'地底水晶庭',map:'underground',spawn:[12,13,0],bossSpawn:[12,7,0],floors:3,clear:'clear3',gate:[28,12],boss:'水晶の番人'},
 {id:'lumina',name:'ルミナ大陸',map:'village',spawn:[12,13,0],clear:'won',gate:[31,14],boss:'沈黙の王'},
 {id:'dream',name:'夢の島',map:'dream',spawn:[9,14,0],bossSpawn:[9,14,0],floors:3,clear:'dreamWon',gate:[26,16],boss:'悪夢の主',arena:'silver'}];
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
function realm(){if(!S)return '';if(S.map==='island'||MAPS[S.map]?.indoor)return '拠点';if(LUMINA_MAPS.has(S.map))return 'ルミナ大陸';return '異世界'}

function islandRows(){const lv=S?islandLevel():1,beach=S?!!isle().arena.bronze:false;ISLAND_TEMPLATE=ISLAND_TEMPLATE||islandTemplate();
 return ISLAND_TEMPLATE.map(r=>r.replace(/[1-6]/g,d=>({1:lv>=2?'B':'w',2:lv>=3?'.':'t',3:lv>=3?'w':'t',4:lv>=3?'u':'t',5:lv>=4?',':'#',6:beach?'s':'w'}[d])))}
/* Rebuild the island when its shape may have changed (level, beach) or when the ranch population changed. */
function refreshIsland(){MAPS.island.rows=islandRows();if(GL.scenes)delete GL.scenes.island}

/* Walking into a door enters the building. Returns true when a door was used. */
function enterDoor(m,x,y){const id=m.doors?.[x+','+y];if(!id)return false;warp(id,...SPAWN[id]);return true}

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

/* Interiors: a walled room of wooden floor with the exit at the bottom. Furniture letters:
   K bookshelf, n table, j bed, Y throne, g counter (talk across it), Q potted plant. */
const INDOOR_LOOK={bg:'#1b1510',fog:['#1b1510',16,34],hemi:['#fff0dc','#5a4434',.85],sun:['#ffe6c0',.55,[-3,9,4]],tint:'#fff6ea',base:'#140e0a',torch:['#ffc27a',1.2,8]};
function addInterior(id,o){const {w,h}=o,ex=Math.floor(w/2);
 const g=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x===0||y===0||x===w-1||y===h-1?'#':'o'));
 for(const [c,x0,y0,x1=x0,y1=y0] of o.put||[])for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)g[y][x]=c;
 g[h-1][ex]='E';
 const [dx,dy]=Object.keys(ISLE.doors).find(k=>ISLE.doors[k]===id).split(',').map(Number);
 MAPS[id]={name:o.name,jp:o.jp,fill:'#',theme:{},rows:g.map(r=>r.join('')),ents:[],walls:'town',ground:'wood',layerOf:()=>'wood',indoor:o,exit:['island',dx,dy+1]};
 SPAWN[id]=[ex,h-2,0];MAPLOOK[id]=o.look||INDOOR_LOOK}

function addIslandMaps(){
 MAPS.island={name:'Kotonoha Isle',jp:'ことのは島',fill:'w',theme:{},rows:islandRows(),ents:[],town:1,sea:1,walls:'cave',ground:'green',doors:ISLE.doors,buildHouse:islandBuilding,layerOf:c=>c==='s'?'sand':c==='u'?'farm':null};
 MAPS.meadow={name:'First Meadow',jp:'はじまりの草原',fill:'#',theme:{},rows:MEADOW_ROWS,ents:[],zone:'meadow',walls:'hedge',ground:'green',exit:['island',WARPS[0].gate[0],WARPS[0].gate[1]+1]};
 addInterior('i_castle',{name:'Kotonoha Castle',jp:'ことのは城',w:15,h:11,carpet:[7,2,7,9],look:{...INDOOR_LOOK,hemi:['#fff4e0','#6a4a3a',.95]},
  put:[['Y',7,1],['K',1,1,3,1],['K',11,1,13,1],['#',3,5],['#',11,5],['#',3,8],['#',11,8],['Q',1,9],['Q',13,9],['n',12,3]]});
 addInterior('i_shop',{name:'Item Shop',jp:'道具屋',w:9,h:7,put:[['g',2,2,6,2],['K',1,1,2,1],['K',6,1,7,1],['Q',1,5],['Q',7,5]]});
 addInterior('i_books',{name:'Bookstore',jp:'本屋',w:9,h:7,put:[['g',3,2,5,2],['K',1,1,2,1],['K',6,1,7,1],['K',1,3,1,4],['K',7,3,7,4],['n',6,4]]});
 addInterior('i_inn',{name:'Inn',jp:'宿屋',w:11,h:8,put:[['g',3,2,7,2],['j',1,4],['j',1,5],['j',9,4],['j',9,5],['n',8,6],['Q',1,1]]});
 addInterior('i_house',{name:'Granny Ume\'s House',jp:'ウメばあさんの家',w:9,h:7,put:[['j',7,1],['n',4,2],['Q',1,1],['K',1,4]]});
 addInterior('i_hut',{name:'Breeding Hall',jp:'配合の館',w:9,h:7,put:[['n',2,1],['n',6,1],['Q',1,5],['Q',7,5]]});
 addInterior('i_house2',{name:'Old Sailor\'s House',jp:'老水夫の家',w:9,h:7,put:[['K',1,1,2,1],['j',7,1],['n',3,3],['Q',7,5]]});
 Object.assign(MAPLOOK,{
  island:{bg:'#7fc4e8',fog:['#bfe4f2',22,52],hemi:['#eaf8ff','#4a7a5a',.5],sun:['#fff2d4',1.3,[-6,10,5]],tint:'#ffffff',base:'#2a6fb8'},
  meadow:{bg:'#9fd0e8',fog:['#cfe8d8',20,46],hemi:['#effff0','#4a7a4a',.5],sun:['#fff4d8',1.25,[-6,9,5]],tint:'#ffffff',base:'#3f7f36'}});
 THEME.island={roof:'#c8553f'};
 Object.assign(SPAWN,{island:ISLE.spawn,meadow:WARPS[0].spawn,sky:WARPS[1].spawn,underground:WARPS[2].spawn});INNS.island=[6,22];INNS.i_inn=[5,5];
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
 E(I,{x:ISLE.kiki[0],y:ISLE.kiki[1],pal:'kiki',scale:.82,name:'Kiki',talk:kikiTalk});
 E(I,{x:21,y:15,prop:'sign',talk:islandBoard});
 E(I,{x:22,y:9,pal:'guard',name:'Castle Guard',talk:async()=>{await say('Castle Guard',"The king is waiting inside the castle. Walk through the door!","王様は城の中でお待ちだ。扉から中へどうぞ！")}});
 E(I,{x:27,y:9,pal:'guard',name:'Castle Guard',talk:async()=>{await say('Castle Guard',"Shops and houses have doors too. Visit the bookstore for new words.","店や家にも入れるぞ。新しい言葉は本屋で手に入る。")}});
 E(I,{x:38,y:20,pal:'sailor',name:'Fisher',talk:async()=>{await say('Fisher Gil',"Monsters love kind words. Find out what each one likes!","モンスターは褒められるのが大好きさ。相手ごとに好きな言葉がちがうんだ。");
  await sys('戦闘で木の実をあげると、そのモンスターが好きな言葉のヒントがわかる。')}});
 E(I,{x:50,y:20,pal:'guard',name:'Arena',cond:()=>islandLevel()>=2,talk:arenaDesk});
 E(I,{x:9,y:8,pal:'granny',name:'Hot Spring',cond:()=>islandLevel()>=3,talk:async()=>{S.hp=maxHp();S.mp=maxMp();await say('Hot Spring Keeper',"Relax in the hot spring. You look refreshed!","温泉でゆっくりしていって。すっきりした顔ね！");await sys('HPとMPが全回復した。')}});
 E(I,{x:13,y:8,pal:'granny',name:'Farmer',cond:()=>islandLevel()>=3,talk:async()=>{const n='Farmer Ken';
  if(F().farmDay===S.stats.right+S.stats.wrong){await say(n,"The berries need more time to grow. Answer some questions on your journey!","木の実はまだ育ち中。旅で問題に答えてきてね！");return}
  F().farmDay=S.stats.right+S.stats.wrong;S.items.berry+=2;await say(n,"Fresh berries from the island farm!","島の畑でとれた木の実だよ！");await sys('木の実×2を手に入れた。')}});
 E(I,{x:37,y:5,pal:'scholar',name:'Sage',cond:()=>islandLevel()>=4,talk:async()=>{const n='Summit Sage';
  await say(n,"From here you can see the whole island. It has grown so much!","ここから島全体が見える。ずいぶん大きくなったものだ。");
  if(!F().sageWord){F().sageWord=1;await teachWords([randomUnknownWord(),randomUnknownWord()].filter(Boolean),'山頂の賢者')}
  if(islandLevel()>=5&&!F().summitGift){F().summitGift=1;S.items.ether+=5;S.items.churu=(S.items.churu||0)+5;save();await sys('島レベル5の記念！ エーテル×5とチュール×5を手に入れた。')}
  else await sys(`島レベル ${islandLevel()} ・ スコア ${islandScore()}`)}});
 E(I,{x:24,y:30,pal:'sailor',name:'Beach Trader',cond:()=>!!isle().arena.bronze,talk:async()=>{const n='Beach Trader';
  if(!F().beachGift){F().beachGift=1;S.items.churu=(S.items.churu||0)+2;await say(n,"Welcome to the new beach! A gift for the arena hero.","新しい浜辺へようこそ！闘技場の英雄に贈り物だ。");await sys('チュール×2を手に入れた。');return}
  await shop(n,[ITEM.churu,ITEM.ether,ITEM.berry])}});
 WARPS.forEach((w,i)=>E(I,{x:w.gate[0],y:w.gate[1],prop:'warp',warp:i,talk:()=>useGate(i)}));
 // Townsfolk. Those with `wander` stroll a few steps around their home spot.
 const folk=(x,y,pal,name,en,ja,wander=2)=>E(I,{x,y,hx:x,hy:y,pal,name,wander,talk:async()=>{await say(name,en,ja)}});
 folk(17,15,'shop','Flower Seller',"Fresh flowers from the island! Monsters love them too.","島の花はいかが？モンスターも花が大好きなのよ。",0);
 folk(29,15,'sailor','Fish Seller',"Today's catch! The sea around our island is rich.","今日の水揚げだ！この島のまわりの海は豊かだぞ。",0);
 folk(12,18,'girl','Mina',"The bookstore sells new praise words. I love reading!","本屋さんで新しい褒め言葉が買えるよ。わたし、本が大好き！");
 folk(19,13,'granny','Old Hana',"When I was young, this island had only one house.","わたしが若いころは、この島に家が一軒しかなかったのよ。");
 folk(31,11,'scholar','Scholar Teo',"Each warp world has its own monsters. Write down what they like!","ワープの先の世界には、それぞれのモンスターがいる。好みをメモしておこう！");
 folk(26,21,'tourist','Traveler Aya',"The great tree is older than the kingdom itself.","この大樹は、王国よりも古いんですって。");
 folk(36,24,'sailor','Farmer Jiro',"The orchard gives sweet fruit every season.","果樹園は季節ごとに甘い実をつけるんだ。");
 folk(8,13,'guard','Watchman Ken',"I keep watch over the town. All is peaceful today.","町の見回りをしている。今日も平和だ。");
 // Monsters live in town with the people. They wander like the townsfolk and can be talked to.
 const pet=(x,y,mon,name,en,ja,wander=2)=>E(I,{x,y,hx:x,hy:y,mon,name,wander,talk:async()=>{await say(name+'（'+CD.species[mon].name+'）',en,ja)}});
 pet(18,18,'seedpod_mouse','Chu',"Squeak! I help Mia carry the herbs every morning!","チュー！ 毎朝ミアさんの薬草運びを手伝ってるんだ！");
 pet(23,14,'pinecone_sparrow','Piyo',"Tweet! The fountain water is the best on the island.","ピピッ！ 噴水の水は島でいちばんおいしいよ。");
 pet(14,17,'silk_leaf_caterpillar','Shiru',"I like the quiet of the bookstore. Words are tasty.","本屋さんの静かなところが好き。言葉っておいしいの。");
 pet(10,23,'lotus_root_sproutling','Hasu',"Granny Ume waters me with the flowers. So kind!","ウメばあさんが花といっしょに水をくれるの。やさしいよね！");
 pet(28,20,'sprout_ear_mole','Mogu',"Mogu mogu. I dig the soil for the orchard.","モグモグ。果樹園の土を耕してるんだ。");
 pet(30,13,'lantern_moth','Tomo',"At night I light the plaza. The children like it.","夜は広場を照らしてるの。子どもたちが喜ぶんだ。");
 pet(24,23,'thunder_feather_owlet','Raiho',"Hoo. I have watched this island from the great tree for years.","ホウ。大樹の上から、長いことこの島を見守っておる。",1);
 pet(37,14,'seedpod_mouse','Tane',"Kiki is strict but kind. I like the ranch!","キキはきびしいけどやさしいよ。牧場が大好き！",1);
 // Interiors
 E('i_castle',{x:7,y:2,pal:'elder',name:'King Oswin',talk:kingTalk});
 E('i_castle',{x:5,y:7,pal:'guard',name:'Royal Guard',talk:async()=>{await say('Royal Guard',"Long live the king! Our island grows with every monster friend.","王様ばんざい！仲間のモンスターが増えるたびに島は大きくなる。")}});
 E('i_castle',{x:9,y:7,pal:'guard',name:'Royal Guard',talk:async()=>{await say('Royal Guard',"The arena is on the east islet. A bridge will be built when the island grows.","闘技場は東の小島だ。島が育てば橋がかかる。")}});
 E('i_castle',{x:3,y:3,pal:'scholar',name:'Chancellor',talk:chancellorTalk});
 E('i_shop',{x:4,y:1,pal:'shop',name:'Mia',talk:()=>shop('Shopkeeper Mia',[ITEM.churu,ITEM.herb,ITEM.ether])});
 E('i_books',{x:4,y:1,pal:'tourist',name:'Bookseller',talk:bookShop});
 E('i_books',{x:2,y:4,pal:'girl',name:'Reader',talk:async()=>{const n='Reader Sora';
  await say(n,"Words are like keys. The right word opens a monster's heart.","言葉はカギみたいなもの。ぴったりの言葉がモンスターの心をひらくの。");
  if(!F().soraWord){F().soraWord=1;await teachWords(['sweet'],'ソラ')}}});
 E('i_inn',{x:5,y:1,pal:'inn',name:'Tom',talk:()=>inn('Innkeeper Tom',6,'i_inn')});
 E('i_house',{x:2,y:2,pal:'granny',name:'Granny Ume',talk:grannyTalk});
 E('i_hut',{x:4,y:2,pal:'nene',scale:.82,name:'Nene',talk:neneTalk});
 E('i_house2',{x:5,y:2,pal:'sailor',name:'Old Sailor',talk:sailorTalk});
 // Each world gets a gate home near where you arrive.
 E('meadow',{x:12,y:15,prop:'warp',home:1,talk:goHome});
 E('sky',{x:10,y:13,prop:'warp',home:1,talk:goHome});E('underground',{x:10,y:13,prop:'warp',home:1,talk:goHome});
 E('village',{x:10,y:13,prop:'warp',home:1,talk:goHome});E('dream',{x:7,y:14,prop:'warp',home:1,talk:goHome});
 // Meadow
 E('meadow',{x:16,y:13,pal:'scholar',name:'Researcher',talk:async()=>{const n='Researcher Lily';
  await say(n,"Wild monsters join you when you praise them with words they like!","野生のモンスターは、好きな言葉で褒めると仲間になってくれるの！");
  await say(n,"Choose Scout in battle, then say a word. Wrong words make them grumpy.","戦闘でスカウトを選んで言葉をかけてね。好みじゃない言葉ばかりだと怒っちゃうよ。");
  if(!F().lilyGift){F().lilyGift=1;S.items.berry+=3;await sys('木の実×3を受け取った。木の実をあげると、好きな言葉のヒントがわかる。')}}});
 E('meadow',{x:14,y:2,boss:'meadowking',cond:()=>!F().clear1,talk:()=>worldBoss(0,'meadowking',"Grrr... who walks in my meadow?","グルル…わしの草原を歩くのは誰じゃ？")});
 E('sky',{x:14,y:3,boss:'skyowl',cond:()=>!F().clear2,talk:()=>worldBoss(1,'skyowl',"The sky belongs to me. Show me your words!","空はわたしのもの。ことばの力を見せてみよ！")});
 E('underground',{x:14,y:3,boss:'crystalmole',cond:()=>!F().clear3,talk:()=>worldBoss(2,'crystalmole',"Only clear words may pass the crystal.","澄んだことばだけが水晶を通れる。")});
}

async function kingTalk(){const n='King Oswin';
 if(!F().metKing){F().metKing=1;
  await say(n,"Welcome, young one. I can feel it: you have the gift of a Monster Master.","よく来た、若者よ。そなたにはモンスターマスターの素質を感じる。");
  await say(n,"Our island is small. With monsters as friends, it can grow.","我が島は小さい。モンスターが仲間になれば、もっと大きくなれる。");
  await say(n,"Use the warp points in the square. Befriend monsters in other worlds and bring them home.","広場のワープポイントを使い、異世界でモンスターを仲間にして連れ帰ってほしい。");
  await say(n,"Monsters will not follow just anyone. Praise them in English with words they love.","モンスターは誰にでもついてくるわけではない。英語で、相手が喜ぶ言葉をかけて褒めるのだ。");
  await say(n,"Kiki keeps our ranch, and Nene runs the breeding hut. They love churu!","キキは牧場、ネネは配合小屋を任されておる。二匹ともチュールが大好物だ。");
  S.items.churu=(S.items.churu||0)+2;save();await sys('チュール×2を受け取った。');await teachWords(['brave'],'王様');return}
 const lv=islandLevel(),clears=WARPS.filter(w=>F()[w.clear]).length;
 if(lv>=5&&isle().arena.gold&&!F().crown){F().crown=1;S.gold+=1000;save();await say(n,"Our island has become a great nation. You are our champion!","島は立派な国になった。そなたこそ我らのチャンピオンだ！");await sys('王から1000ゴールドを授かった！');return}
 await say(n,`The island is level ${lv}. ${clears} worlds have been set free.`,`島はレベル${lv}。解放した異世界は${clears}つだ。`)}

/* The chancellor rewards each new island level with a praise word. */
async function chancellorTalk(){const n='Chancellor Fumi',f=F(),lv=islandLevel();
 await say(n,"Words are the treasure of our nation. Collect them all!","言葉こそ我が国の宝。すべて集めてみせよ！");
 if((f.chancLv||1)<lv){const words=[];for(let l=(f.chancLv||1)+1;l<=lv;l++){const w=randomUnknownWord();if(w&&!words.includes(w))words.push(w)}f.chancLv=lv;
  if(words.length){await teachWords(words,'島レベルのお祝い');return}}
 await sys(`褒め言葉 ${praise().known.length} / ${PRAISE.length} ・ 島レベルが上がるたびに、大臣から新しい言葉がもらえる。`)}
async function grannyTalk(){const n='Granny Ume';
 if(F().umeWord){await say(n,"Kind words make everyone smile. Monsters too.","やさしい言葉は、みんなを笑顔にするのさ。モンスターもね。");return}
 await say(n,"Can you read this word for me? My eyes are getting old.","この言葉を読んでくれるかい？ 目が悪くなってねえ。");
 if(await quiz(qVocab(1))){F().umeWord=1;await say(n,"Thank you, dear. Let me teach you a gentle word.","ありがとうねえ。お礼にやさしい言葉を教えてあげよう。");await teachWords(['gentle',randomUnknownWord(1)].filter(Boolean),'ウメばあさん')}
 else await say(n,"Hmm, not quite. Come back and try again.","おや、ちょっとちがうねえ。また来ておくれ。")}
async function sailorTalk(){const n='Old Sailor';
 await say(n,"I sailed every sea. Each world beyond the warp has its own monsters.","わしはあらゆる海を渡った。ワープの向こうの世界には、それぞれのモンスターがおる。");
 await say(n,"Go deeper, floor by floor, and the boss will be waiting at the end.","一層ずつ奥へ進めば、最後にボスが待っておる。");
 if(F().clear1&&!F().sailorWord){F().sailorWord=1;await teachWords(['quick',randomUnknownWord()].filter(Boolean),'老水夫')}}

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
 await sys(`<b>ことのは島 Lv.${lv}</b>（スコア ${islandScore()}${need?` ・ 次まで ${need}`:''}）<br>モンスター ${S.companions.owned.length}体 ・ チュール キキ${isle().kiki}/ネネ${isle().nene} ・ 異世界 ${clears}/${WARPS.length} ・ 闘技場 ${ARENA.filter(a=>isle().arena[a.id]).length}/${ARENA.length}<br>北：城 ・ 西：道具屋・本屋・宿屋 ・ 東：牧場・闘技場`)}

const LEVEL_NEWS={2:'東の小島に橋がかかり、闘技場へ行けるようになった！',3:'北西の森が開かれ、温泉と畑ができた！',4:'北東の岩がくずされ、山頂への道が通じた！',5:'島が大きな国になった！ 山頂の賢者を訪ねよう。'};
async function checkIslandLevel(){const lv=islandLevel(),i=isle();if(lv<=i.seenLevel)return;
 for(let l=i.seenLevel+1;l<=lv;l++){await sys(`<b>島レベルが ${l} になった！</b><br>${LEVEL_NEWS[l]}<br>城の大臣から新しい言葉がもらえる。`)}
 i.seenLevel=lv;refreshIsland();save()}

async function useGate(i){const w=WARPS[i];
 if(!warpOpen(w,i)){const prev=WARPS[i-1];await sys(`ワープポイントは眠っている。`+(prev&&!F()[prev.clear]?`<br>「${prev.name}」の${prev.boss}を倒そう。`:'')+(w.arena&&!isle().arena[w.arena]?'<br>闘技場のシルバー杯で優勝しよう。':''));return}
 if(!w.floors){if(!await yesno('ワープポイント',`To ${w.name}?`,`「${w.name}」へワープする？${F()[w.clear]?'（クリア済み）':''}`,'ワープする','やめる'))return;visit(w.map);warp(w.map,...w.spawn);return}
 setLog(dialogHtml('ワープポイント',`To ${w.name}?`,`「${w.name}」へワープする？ ${w.floors}層を進むとボスの間に出る。${F()[w.clear]?'（クリア済み）':''}`));
 const v=await ask([{label:`1層から探索<small>ランダムな${w.floors}層 → ボスの間</small>`,value:'floors'},...(F()[w.clear]?[{label:'最深部へ直行<small>クリア済みの世界</small>',value:'deep'}]:[]),{label:'やめる',value:null}],{cancel:null});
 if(!v)return;visit(w.map);
 if(v==='deep'){warp(w.map,...w.bossSpawn);return}
 startRift(i)}
async function goHome(){if(!await yesno('ワープポイント','Return to the island?','ことのは島へ帰る？','帰る','まだいる'))return;returnToIsland();await checkIslandLevel()}
function returnToIsland(gateIndex){const w=WARPS[gateIndex??(S.map==='rift'?S.rift?.w:WARPS.findIndex(w=>w.map===S.map))]||WARPS[0];S.rift=null;refreshIsland();warp('island',w.gate[0],w.gate[1]+1,2)}

async function worldBoss(i,key,en,ja){const w=WARPS[i];await say(w.boss,en,ja);
 const r=await battle(key);
 if(r==='win'){F()[w.clear]=1;S.gold+=100*(i+1);S.items.churu=(S.items.churu||0)+2;save();
  await sys(`◆ ${w.name}のボスを倒した！ ${100*(i+1)}ゴールドとチュール×2。`+(WARPS[i+1]?`<br>島のワープポイント「${WARPS[i+1].name}」が目を覚ました。`:''));
  await teachWords([randomUnknownWord(),randomUnknownWord()].filter(Boolean),w.boss);
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
 if(first)await teachWords([randomUnknownWord()].filter(Boolean),a.rival);
 refreshIsland();if(first&&a.id==='bronze'){warp('island',S.x,S.y,S.dir)}await checkIslandLevel()}

/* ---------------- island decoration: warp gates, ranch monsters, steam, castle towers ---------------- */
function warpProp(sc,e){const g=new THREE.Group(),open=e.home||e.rift||warpOpen(WARPS[e.warp],e.warp),col=e.home||e.rift?'#7ef0ff':['#9ad870','#9ad0ff','#7ef0e0','#ffd27a','#e0a0ff'][e.warp];
 const base=new THREE.Mesh(new THREE.CylinderGeometry(.46,.5,.12,20),stdMat('warpBase',{color:'#c8c4b8'}));base.position.y=.06;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.05,8,28),new THREE.MeshStandardMaterial({color:col,emissive:open?col:'#000',emissiveIntensity:open?1.1:0}));ring.rotation.x=Math.PI/2;ring.position.y=.14;
 g.add(base,ring);if(open){const beam=new THREE.Mesh(new THREE.CylinderGeometry(.3,.34,1.6,16,1,true),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));beam.position.y=.9;g.add(beam);g.userData.beam=beam}
 base.receiveShadow=true;sc.add(g);return g}
function decorateIsland(sc,mid,m,out){
 if(m.indoor)return decorateInterior(sc,mid,m,out);
 if(mid==='rift')return decorateRift(sc,m,out);
 if(mid!=='island')return;
 // Monsters from the ranch roam inside the fence.
 const owned=S?S.companions.owned.slice(0,14):[];const walkers=owned.map((mon,i)=>{const can=creatureCanvas(mon.id);if(!can)return null;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:sprTex(can),alphaTest:.4}));const s=AIRBORNE_SPECIES.has(mon.id)?.7:.85;sp.scale.set(s,s,1);sp.center.set(.5,0);sc.add(sp);
  return {sp,fly:AIRBORNE_SPECIES.has(mon.id),seed:i*2.17+1}}).filter(Boolean);
 out.anim.push(t=>{walkers.forEach(w=>{const k=t*.00018+w.seed;const x=RANCH.x0+(RANCH.x1-RANCH.x0)*(.5+.5*Math.sin(k*1.3+w.seed));const z=RANCH.y0+(RANCH.y1-RANCH.y0)*(.5+.5*Math.sin(k*.9+w.seed*1.7));
  w.sp.position.set(x,w.fly?.35+Math.sin(t*.004+w.seed)*.1:0,z);w.sp.material.rotation=0})});
 // Wooden deck and railings on the bridge to the arena.
 const deck=GB(),rail=GB();for(let y=0;y<m.rows.length;y++)for(let x=0;x<m.rows[y].length;x++)if(m.rows[y][x]==='B'){box(deck,null,x-.5,.0,y-.48,x+.5,.06,y+.48);for(const z of [y-.46,y+.46]){box(rail,null,x-.5,.32,z-.03,x+.5,.38,z+.03);box(rail,null,x-.04,0,z-.04,x+.04,.38,z+.04)}}
 if(deck.p.length){sc.add(meshOf(deck,stdMat('deck',{map:texOf(tile16('pl',pPlanks),true)})));sc.add(meshOf(rail,stdMat('pole',{color:'#5a3a1e'})))}
 // Castle towers with flags at the four corners.
 const stone=stdMat('castleStone',{color:'#d8d2c2'}),cone=stdMat('castleRoof',{color:'#c8553f',flatShading:true});
 for(const [x,z] of [[19.6,4.2],[29.4,4.2],[19.6,8.2],[29.4,8.2]]){const t=new THREE.Mesh(new THREE.CylinderGeometry(.55,.62,3.2,10),stone);t.position.set(x,1.6,z);add(sc,t);
  const r=new THREE.Mesh(new THREE.ConeGeometry(.75,1.3,10),cone);r.position.set(x,3.85,z);add(sc,r);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(.45,.26),new THREE.MeshBasicMaterial({color:'#3a7ad8',side:THREE.DoubleSide}));fl.position.set(x+.24,4.75,z);sc.add(fl);out.anim.push(t=>{fl.rotation.y=Math.sin(t*.003+x)*.5})}
 // Steam over the hot spring.
 if(islandLevel()>=3){const puffs=[];for(let i=0;i<8;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.35,depthWrite:false}));sc.add(p);puffs.push(p)}
  out.anim.push(t=>puffs.forEach((p,i)=>{const k=((t*.0003)+i/8)%1;p.position.set(ISLE.spring[0]+Math.sin(i*2.3)*.8,.3+k*1.6,ISLE.spring[1]+Math.cos(i*1.7)*.5);p.material.opacity=.4*(1-k);p.scale.setScalar(.6+k*1.4)}))}
 // A banner over the arena and festival lanterns at Lv5.
 if(islandLevel()>=2){const flag=new THREE.Mesh(new THREE.PlaneGeometry(.6,.36),new THREE.MeshBasicMaterial({color:'#e8b84a',side:THREE.DoubleSide}));flag.position.set(ISLE.arena[0],3.3,ISLE.arena[1]);sc.add(flag);out.anim.push(t=>{flag.rotation.y=Math.sin(t*.003)*.5})}
 if(islandLevel()>=5){strand(sc,[15,2.6,10],[34,2.6,10],.6,60);strand(sc,[15,2.6,16],[34,2.6,16],.6,60)}
}
/* Furniture for interiors, built from the letters in the room rows. */
function decorateInterior(sc,mid,m,out){
 const wood=stdMat('inWood',{map:texOf(tile16('pl',pPlanks),true),color:'#e8c49a'}),dark=stdMat('inDark',{color:'#5a3a22'}),cloth=stdMat('inCloth',{color:'#f4eee0'});
 const W=m.rows[0].length,H=m.rows.length,books=['#c84a3a','#3a6ac8','#e8b84a','#4a9a5a','#8a4ac8'];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=m.rows[y][x];
  if(c==='K'){const b=new THREE.Mesh(new THREE.BoxGeometry(.92,1.5,.5),wood);b.position.set(x,.75,y-.15);add(sc,b);
   for(let s=0;s<3;s++)for(let k=0;k<5;k++){const bk=new THREE.Mesh(new THREE.BoxGeometry(.13,.3,.08),stdMat('book'+k,{color:books[(k+s+x)%5]}));bk.position.set(x-.3+k*.15,.32+s*.42,y+.12);sc.add(bk)}}
  if(c==='n'){const t=new THREE.Mesh(new THREE.BoxGeometry(.85,.08,.7),wood);t.position.set(x,.62,y);add(sc,t);for(const [dx,dz] of [[-.35,-.28],[.35,-.28],[-.35,.28],[.35,.28]]){const l=new THREE.Mesh(new THREE.BoxGeometry(.06,.6,.06),dark);l.position.set(x+dx,.3,y+dz);sc.add(l)}
   const cup=new THREE.Mesh(new THREE.CylinderGeometry(.07,.06,.14,10),stdMat('inCup',{color:'#f0e0c0'}));cup.position.set(x+.15,.73,y);sc.add(cup);
   const can=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.2,8),new THREE.MeshStandardMaterial({color:'#fff4d0',emissive:'#ffb050',emissiveIntensity:.8}));can.position.set(x-.2,.76,y);sc.add(can)}
  if(c==='j'){const f=new THREE.Mesh(new THREE.BoxGeometry(.9,.35,.95),dark);f.position.set(x,.18,y);add(sc,f);const s=new THREE.Mesh(new THREE.BoxGeometry(.82,.1,.88),cloth);s.position.set(x,.4,y);sc.add(s);
   const bl=new THREE.Mesh(new THREE.BoxGeometry(.84,.06,.55),stdMat('inBlanket',{color:'#c84a5a'}));bl.position.set(x,.47,y+.15);sc.add(bl);const p=new THREE.Mesh(new THREE.BoxGeometry(.5,.1,.22),cloth);p.position.set(x,.5,y-.3);sc.add(p)}
  if(c==='Y'){const gold=stdMat('inGold',{color:'#e8c050',metalness:.5,roughness:.4}),red=stdMat('inRed',{color:'#b8303a'});
   const seat=new THREE.Mesh(new THREE.BoxGeometry(.9,.5,.8),gold);seat.position.set(x,.25,y);add(sc,seat);const back=new THREE.Mesh(new THREE.BoxGeometry(.9,1.6,.15),gold);back.position.set(x,1.05,y-.35);add(sc,back);
   const cu=new THREE.Mesh(new THREE.BoxGeometry(.7,.1,.6),red);cu.position.set(x,.55,y);sc.add(cu);const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.12),new THREE.MeshStandardMaterial({color:'#7ef0ff',emissive:'#30a0c0',emissiveIntensity:.9}));gem.position.set(x,1.7,y-.3);sc.add(gem)}
  if(c==='g'){const b=new THREE.Mesh(new THREE.BoxGeometry(1,.85,.7),wood);b.position.set(x,.43,y);add(sc,b);const top=new THREE.Mesh(new THREE.BoxGeometry(1.04,.06,.76),dark);top.position.set(x,.88,y);sc.add(top);
   if((x+y)%2){const jar=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.22,10),stdMat('inJar'+x%3,{color:['#7ac0e8','#e88a5a','#9ad870'][x%3],roughness:.3}));jar.position.set(x,1.02,y);sc.add(jar)}}
  if(c==='Q'){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.22,.16,.4,10),stdMat('inPot',{color:'#b86a3a'}));pot.position.set(x,.2,y);add(sc,pot);const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.38,0),stdMat('inLeaf',{color:'#4a9a4a',flatShading:true}));leaf.position.set(x,.72,y);add(sc,leaf)}}
 const cp=m.indoor.carpet;if(cp){const rug=new THREE.Mesh(new THREE.PlaneGeometry(cp[2]-cp[0]+1.2,cp[3]-cp[1]+1),new THREE.MeshStandardMaterial({color:'#a82a36',roughness:1}));rug.rotation.x=-Math.PI/2;rug.position.set((cp[0]+cp[2])/2,.012,(cp[1]+cp[3])/2);rug.receiveShadow=true;sc.add(rug)}
 if(mid==='i_castle')for(const x of [5,9]){const ban=new THREE.Mesh(new THREE.PlaneGeometry(.7,1.3),new THREE.MeshStandardMaterial({color:'#3a5ac8',side:THREE.DoubleSide}));ban.position.set(x,1.4,.53);sc.add(ban)}
 const l=new THREE.PointLight('#ffd2a0',1,Math.max(W,H)*1.2,1.6);l.position.set(W/2,2.4,H/2);sc.add(l)}

/* ---------------- goals, journal, migration ---------------- */
function hubGoal(){const f=F();
 if(!f.metKing)return '北の城に入って、王様（King Oswin）に話しかけよう。';
 if(S.map==='rift'&&S.rift)return `${WARPS[S.rift.w].name} ${S.rift.floor}層。光る出口を探して奥へ進もう（全${WARPS[S.rift.w].floors}層）。`;
 if(LUMINA_MAPS.has(S.map)&&!f.won)return worldGoal();
 const i=WARPS.findIndex((w,k)=>!f[w.clear]&&warpOpen(w,k));
 if(i>=0)return i===3?'ワープポイント「ルミナ大陸」へ。'+worldGoal():`ワープポイントから「${WARPS[i].name}」へ。${WARPS[i].floors}層を進み、${WARPS[i].boss}を倒そう。`;
 const a=ARENA.find(a=>a.need()&&!isle().arena[a.id]);if(a)return `闘技場の${a.name}で優勝しよう。`;
 const blocked=WARPS.findIndex((w,k)=>!f[w.clear]);if(blocked>=0)return `「${WARPS[blocked].name}」へ行くには闘技場のシルバー杯で優勝しよう。`;
 return islandLevel()<5?'チュールをあげたり仲間を増やしたりして、島をレベル5まで発展させよう。':'島は大きな国になった！ 王様に報告しよう。'}
function hubJournal(){const f=F(),i=isle();
 return `<p class="progress-note">ことのは島 Lv.${islandLevel()} ・ スコア ${islandScore()} ・ 褒め言葉 ${praise().known.length}/${PRAISE.length}</p><ol class="journal-list">${WARPS.map((w,k)=>`<li class="${f[w.clear]?'complete':warpOpen(w,k)?'current':''}">${f[w.clear]?'◆':warpOpen(w,k)?'▸':'◇'} ${w.name}<small> ${w.floors?w.floors+'層 ・ ':''}ボス：${w.boss}</small></li>`).join('')}</ol>`+
  `<p class="progress-note">闘技場</p><ul class="journal-list">${ARENA.map(a=>`<li class="${i.arena[a.id]?'complete':''}">${i.arena[a.id]?'◆':'◇'} ${a.name}<small> ${a.rival}</small></li>`).join('')}</ul>`}
/* Saves from before the island: keep everything, start them on the island with the king already met.
   hubV 2 enlarged the island, so island positions from v1 are reset to the plaza. Everyone gets the praise word book. */
function migrateHub(savedVersion){
 if(!S)return;const v=savedVersion||0;
 if(v<1){isle();F().metKing=1;if(F().won){F().clear1=F().clear2=F().clear3=1}S.map='island';S.inn='island'}
 if(v<2){if(S.map==='island'){[S.x,S.y]=ISLE.spawn;S.dir=0}if(!INNS[S.inn])S.inn='island';
  // Words for progress already made, so older saves can keep scouting.
  const p=praise();if(F().metKing)learnWords(['brave']);const books=WARPS.filter(w=>F()[w.clear]).length;BOOKS.slice(0,books).forEach(b=>learnWords(b.words))}
 S.hubV=2;restoreRift();refreshIsland()}

/* Wandering townsfolk: every so often one steps to a free neighbouring tile within its range of home.
   They never stand in front of a door or next to a warp gate, so no entrance gets blocked. */
function islandWander(){if(!S||S.map!=='island'||mode!=='walk'||busy)return;const m=MAPS.island;
 for(const e of m.ents){if(!e.wander||Math.random()<.55)continue;const d=Math.floor(Math.random()*4),nx=e.x+DX[d],ny=e.y+DY[d];
  if(Math.abs(nx-e.hx)>e.wander||Math.abs(ny-e.hy)>e.wander)continue;const t=tileAt(m,nx,ny);
  if(!WALK.has(t)||t==='B'||tileAt(m,nx,ny-1)==='d'||(nx===S.x&&ny===S.y)||entityAt(nx,ny)||m.ents.some(o=>o.prop==='warp'&&Math.abs(o.x-nx)+Math.abs(o.y-ny)<=1))continue;
  e.x=nx;e.y=ny;e.face=d}}
function initIslandHub(){addIslandMaps();addIslandEvents();addRiftMap();setInterval(islandWander,900)}

/* ---------------- island buildings: each has its own look ---------------- */
function signTex(text,bg='#6b4426',fg='#fff2c8'){const key='sign:'+text+bg;if(ART_CACHE.has(key))return ART_CACHE.get(key);
 const c=document.createElement('canvas');c.width=256;c.height=96;const x=c.getContext('2d');x.fillStyle=bg;x.beginPath();x.roundRect(4,4,248,88,14);x.fill();x.strokeStyle='#e8c070';x.lineWidth=5;x.stroke();
 x.fillStyle=fg;x.font='bold 46px "DotGothic16", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,50);const t=new THREE.CanvasTexture(c);ART_CACHE.set(key,t);return t}
function signBoard(sc,text,x,y,z,w=1.3,bg){const s=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.375),new THREE.MeshStandardMaterial({map:signTex(text,bg),roughness:.8,emissive:'#ffffff',emissiveMap:signTex(text,bg),emissiveIntensity:.25}));s.position.set(x,y,z);sc.add(s);return s}
function doorPanel(sc,x,z,col='#6b4220',w=.7,h=1.15){const d=new THREE.Mesh(new THREE.PlaneGeometry(w,h),stdMat('door'+col,{color:col}));d.position.set(x,h/2,z);sc.add(d);
 const k=new THREE.Mesh(new THREE.SphereGeometry(.04,6,5),stdMat('knob',{color:'#e8c050',metalness:.5}));k.position.set(x+w*.3,h*.48,z+.02);sc.add(k)}
function lantern(sc,x,y,z,col='#ffb860'){const l=new THREE.Mesh(new THREE.BoxGeometry(.18,.24,.18),new THREE.MeshStandardMaterial({color:'#ffe2a0',emissive:col,emissiveIntensity:1.2}));l.position.set(x,y,z);sc.add(l);const p=new THREE.PointLight(col,.6,4,1.8);p.position.set(x,y,z+.3);sc.add(p)}
function awning(sc,x0,x1,z,col){const X0=x0-.55,X1=x1+.55,g=GB();quad(g,[X0,1.45,z+.75],[X1,1.45,z+.75],[X1,1.75,z+.05],[X0,1.75,z+.05],[0,0,X1-X0,1]);
 sc.add(meshOf(g,stdMat('aw'+col,{map:texOf(stripeCanvas(col),true),side:THREE.DoubleSide})))}
function islandBuilding(sc,hs,roof,seed){
 const door=hs.doors.length?ISLE.doors[(hs.x0+hs.doors[0])+','+hs.z1]:'arena',cx=(hs.x0+hs.x1)/2,cz=(hs.z0+hs.z1)/2,w=hs.x1-hs.x0+1,d=hs.z1-hs.z0+1,front=hs.z1+.51;
 const plaster=c=>stdMat('pl'+c,{color:c,roughness:1});
 if(door==='i_castle'){const stone=stdMat('castleWall',{map:texOf(tile16('wstown',WALLP.town.side),true),color:'#efe8d8'});
  const body=new THREE.Mesh(new THREE.BoxGeometry(w-.1,2.6,d-.1),stone);body.position.set(cx,1.3,cz);add(sc,body);
  for(let x=hs.x0;x<=hs.x1;x+=1)for(const z of [hs.z0-.42,hs.z1+.42]){const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.4,.3),stone);m.position.set(x,2.8,z);add(sc,m)}
  const keep=new THREE.Mesh(new THREE.BoxGeometry(4,2.2,2.6),stone);keep.position.set(cx,3.7,hs.z0+1.4);add(sc,keep);
  const kr=new THREE.Mesh(new THREE.ConeGeometry(2.6,1.8,4),stdMat('castleRoof',{color:'#c8553f',flatShading:true}));kr.rotation.y=Math.PI/4;kr.scale.set(1,1,.7);kr.position.set(cx,5.7,hs.z0+1.4);add(sc,kr);
  const gate=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.7),stdMat('castleGate',{color:'#4a2c16'}));gate.position.set(cx,.85,front);sc.add(gate);
  const arch=new THREE.Mesh(new THREE.CircleGeometry(1.05,20,0,Math.PI),stdMat('castleGate',{}));arch.position.set(cx,1.7,front);sc.add(arch);
  for(const x of [hs.x0+1,hs.x1-1,hs.x0+3,hs.x1-3]){const win=new THREE.Mesh(new THREE.PlaneGeometry(.35,.55),new THREE.MeshStandardMaterial({color:'#ffe2a0',emissive:'#ffb050',emissiveIntensity:.8}));win.position.set(x,1.8,front);sc.add(win)}
  for(const x of [cx-1.6,cx+1.6]){const ban=new THREE.Mesh(new THREE.PlaneGeometry(.55,1.2),new THREE.MeshStandardMaterial({color:'#2f5ac8',side:THREE.DoubleSide}));ban.position.set(x,1.65,front+.01);sc.add(ban);
   const em=new THREE.Mesh(new THREE.CircleGeometry(.14,12),new THREE.MeshBasicMaterial({color:'#f0c850'}));em.position.set(x,1.8,front+.02);sc.add(em)}
  lantern(sc,cx-1.25,1.5,front+.15);lantern(sc,cx+1.25,1.5,front+.15);return}
 if(door==='i_hut'){const r=Math.min(w,d)/2+.15;
  const body=new THREE.Mesh(new THREE.CylinderGeometry(r,r+.1,1.6,20),plaster('#efe6f6'));body.scale.x=w/d;body.position.set(cx,.8,cz);add(sc,body);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(r+.15,20,10,0,Math.PI*2,0,Math.PI/2),stdMat('hutDome',{color:'#8a5ac8',roughness:.6}));dome.scale.x=w/d;dome.position.set(cx,1.6,cz);add(sc,dome);
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.32),new THREE.MeshStandardMaterial({color:'#ffb0f0',emissive:'#e050c0',emissiveIntensity:1}));gem.position.set(cx,3.45,cz);sc.add(gem);
  const gl=new THREE.PointLight('#f080e0',.9,6,1.8);gl.position.set(cx,3.2,cz+1);sc.add(gl);
  const face=cz+r+.04;for(const x of [hs.x0+.5,hs.x1-.5]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.6,8),plaster('#d8c8ee'));p.position.set(x,.8,face-.2);sc.add(p)}
  doorPanel(sc,hs.x0+hs.doors[0],face,'#5a3a7a');signBoard(sc,'配合の館',cx+.9,1.25,face+.05,1.3,'#5a3a8a');return}
 if(door==='arena'){const r=Math.min(w,d)/2+.2,sand=plaster('#e4d2a8');
  const ring=new THREE.Mesh(new THREE.CylinderGeometry(r,r+.15,2.1,24,1,true),stdMat('arenaWall',{color:'#e4d2a8',side:THREE.DoubleSide}));ring.scale.x=w/d;ring.position.set(cx,1.05,cz);add(sc,ring);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.12,6,24),sand);rim.rotation.x=Math.PI/2;rim.scale.x=w/d;rim.position.set(cx,2.1,cz);add(sc,rim);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,ar=new THREE.Mesh(new THREE.PlaneGeometry(.35,.7),stdMat('arenaArch',{color:'#5a4026',side:THREE.DoubleSide}));ar.position.set(cx+Math.sin(a)*(r+.02)*w/d,.9,cz+Math.cos(a)*(r+.02));ar.rotation.y=a;sc.add(ar)}
  const fl=new THREE.Mesh(new THREE.CircleGeometry(r-.05,24),plaster('#c8a46a'));fl.rotation.x=-Math.PI/2;fl.scale.x=w/d;fl.position.set(cx,.03,cz);sc.add(fl);
  signBoard(sc,'闘技場',cx,2.55,cz+r+.25,1.4,'#8a2a2a');return}
 // Gabled shops and homes, each with its own roof colour, sign and trimmings.
 const look={i_shop:['#d8a040','道具屋','#2a6a3a'],i_books:['#3a6ab8','本屋','#2a3a7a'],i_inn:['#b8403a','宿屋 INN','#7a2a2a'],i_house:['#5a8a4a'],i_house2:['#5a7088']}[door]||[roof];
 legacyBuildHouse(sc,hs,look[0],seed+3);
 if(door==='i_house2'){const ch=new THREE.Mesh(new THREE.BoxGeometry(.35,1.1,.35),stdMat('chimney',{color:'#7a5a4a'}));ch.position.set(hs.x1-.4,2.9,cz-.3);add(sc,ch)}
 if(look[1]){signBoard(sc,look[1],cx,2.05,front+.12,Math.min(1.9,w*.45),look[2]);lantern(sc,hs.x0+hs.doors[0]+.6,1.35,front+.1)}
 if(door==='i_shop'){awning(sc,hs.x0,hs.x1,hs.z1+.1,'#3a8a4a');for(const [x,col] of [[hs.x0+.1,'#d84a4a'],[hs.x1-.1,'#4a7ad8']]){const b=new THREE.Mesh(new THREE.CylinderGeometry(.2,.18,.45,10),stdMat('crate'+col,{color:col}));b.position.set(x,.23,front+.35);add(sc,b)}}
 if(door==='i_books'){for(let k=0;k<4;k++){const bk=new THREE.Mesh(new THREE.BoxGeometry(.4,.1,.3),stdMat('bk'+k,{color:['#c84a3a','#3a6ac8','#e8b84a','#4a9a5a'][k]}));bk.position.set(hs.x1-.2,.06+k*.1,front+.3);bk.rotation.y=k*.3;sc.add(bk)}}
 if(door==='i_inn'){lantern(sc,hs.x1-.3,1.35,front+.1)}
 if(door==='i_house'){for(let k=0;k<5;k++){const f=new THREE.Mesh(new THREE.SphereGeometry(.09,6,5),new THREE.MeshStandardMaterial({color:['#ff8ab0','#ffe07a','#ffffff'][k%3]}));f.position.set(hs.x0+.2+k*.18,.25,front+.25);sc.add(f)}}}
