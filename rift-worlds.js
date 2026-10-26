/* Rift worlds (2026-10-26): richer warp dungeons, events, eight new worlds and real-monster bosses.
   - Every warp floor is drawn with its world's own tileset (riftTile): textured ground, walls with a lit top and a
     front face, and tall obstacles (&) such as crystals, coral, gravestones or gears (riftObject). Animated layers
     (drawRiftGround / drawRiftAir) add glowing lava, caustics, embers, snow, bubbles, fog and a torch-light
     vignette in dark worlds.
   - Floors hold events (riftEvent): a healing spring, an old tablet that teaches a word, a lost monster with an
     English question, a treasure chest that turns out to be a monster, and a strong monster that can be challenged.
   - Eight new worlds, themed on the battle backdrops. Their warp gates stand in the alcoves of the 転移回廊 under
     the castle (stairs in the castle hall), each behind a sealed door. Door N opens when 闘技場 cup N (異界杯) is won;
     cup N+1 opens once world N is cleared. Each world has 3 random floors and a deepest chamber with its boss.
   - Bosses are existing monsters under their own names, rarer than anything met at that point, with tough stats
     (most act twice a round). The four original world bosses use the same rule.
   Loaded after warp-floors.js and battle-backdrops.js; initRiftWorlds() runs after the enemy tables exist. */

/* ---------- worlds ---------- */
// [id, name, boss species name, battle backdrops, boss backdrop, regular monsters (names)]
const RIFT_WORLDS=[
 ['jungle','古代樹の密林','竹神チクセン',['broad_birds_nest_fern_fallen_trunk_rainforest_grass','black_bamboo_celadon_grass_glade','jungle_pyramid_ruins','banyan_root_curtain_ruin_court','cobalt_blue_marble_fruit_laterite_roots_rainforest_grass'],'broken_jungle_reservoir_dome',
  'カカオカマキリ,トゲランカマキリ,コケハグルマムシ,ウツボドラゴン,ザクロヒドラ,セイバーパンサー,ナガユビアイアイ,オオハシルビー,ヴァイオホーン,ハリモグラタイタン'],
 ['lava','灼熱の溶岩洞','火山のグリフォン',['ash_buried_pine_lava_river_clearing','basalt_overhang_volcanic_vista','black_bronze_lava_draperies_lateral_molten_river','broken_lava_tube_shelter_bluehour_cascade','braided_crimson_lava_clinker_slope_starlit_basalt'],'bronze_curtain_volcanic_fortress',
  'サラヴェント,鳴竜ブラスカ,ホムラコカトリス,イカリドラゴン,バザルガ,クレナイキメラ,ヨロイトキ,地掘竜ドグラム,スミコガネ'],
 ['snow','氷晶の雪嶺','ヒョウガマンタ',['aurora_snow_mountain_pass','aurora_hoarfrost_open_grassland','aurora_frosted_driftwood_northern_beach','frozen_lake_clearing_blizzard','behind_frozen_waterfall_ledge'],'frozen_mountain_pass_fortress_gate',
  'コオリオヒョウ,スノウレガリア,フリジット,アウレリア,ルナレッタ,ツキヨフクロウ,シモハンマー,シモバナガ'],
 ['desert','砂に眠る宮殿','スナドケイテイ',['ancient_desert_stepwell_twilight','black_saltpan_rose_mesa_bluehour_desert','blueblack_ventifact_peach_dawn_desert','adobe_qanat_vent_collars_crescent_desert_twilight','black_dendrite_cream_limestone_moonlit_desert'],'cobalt_vault_sand_buried_palace_hall',
  'タテアゴアリジゴク,ムチサソリン,ネフェルカ,ルーンセンザン,ショキカンドリ,ヒスイサボテ,冠蛇ヴァスラ,シャベルバジリスク,カガミスフィンクス'],
 ['sea','深海の熱水溝','シンエンレヴィアタン',['burgundy_red_algae_basalt_cobalt_underwater_shelf','bronze_sheen_manganese_nodules_lavender_clay_cream_sediment_blue_basalt_calcite_abyss_plain','cold_kelp_burning_stone_trench_blue_hour_coast','amber_kelp_stormwrack_silver_beach'],'collapsed_bronze_oval_vessel_turquoise_glass_lining_cream_marble_plum_panels_abyss',
  'チョウチンアンコ,スミグモイカ,ヴェルダコ,鋼顎ダンクレア,紅拳ルビゼン,サイスシャーク,カンムリミノカサゴ,クリオネビ'],
 ['crypt','封印の地下墓所','冥王グレイヴァル',['unmarked_granite_sarcophagi_amber_lamp_crypt','misty_mountain_cairn_cemetery','moonlit_haunted_marsh','ancient_aqueduct_cistern'],'ancient_sealed_sarcophagus_crypt',
  'ベルゴー,ラグス,コフィラム,シグモ,デュラゼル,レクシオン,ガルベロス,ヴェスパル,ノクティル,モルグ'],
 ['clock','時計塔の機関部','ロズオルゴ',['clock_tower_mechanism_twilight','bronze_pendulum_oak_gear_underground_vault','brass_orrery_verdigris_gears_wine_plaster_dungeon','alchemist_tower_laboratory'],'abandoned_clockwork_forge',
  'ゼンマイゴーレム,コケハグルマムシ,ルリガーゴイル,朱窯ガラド,クロノシェル,ミズガネプル,ブレードスタッグ,ジシャクアルマ'],
 ['astral','星界のテラス','黒晶アズラント',['astral_void_terrace','blue_agapanthus_ceramic_moonlit_skygarden','cobalt_star_flowers_green_gabbro_lemon_larch_tarn_grass'],'celestial_observatory_interior',
  'ホシクラゲ,夜絹のソレイユ,月鏡トリム,リュウセイオウ,天蛇セラフィス,コガネアラシキリン,夢獣ミラルナ,ニッショクロック,オパールセラフ']];
// Under-castle warp hall: 8 alcoves, gate at the back, sealed door at the mouth. [x, gate y, door y, return y].
const VAULT_ALCOVES=[[3,1,3,2],[8,1,3,2],[13,1,3,2],[18,1,3,2],[3,9,7,8],[8,9,7,8],[13,9,7,8],[18,9,7,8]];
const VAULT_STAIRS=[13,5];   // in the castle hall
// The original world bosses become real monsters too, each rarer than every regular of its world and not one of them:
// [enemy key, species name, hp, atk, actions per round].
const CLASSIC_BOSSES=[['meadowking','ゴルボア',170,12,1],['skyowl','ヨロイコトドリ',290,15,2],['crystalmole','コハクサイガオウ',400,19,2],['nightmare','鏡判ヴァルディス',720,29,2]];
const FIRST_RIFT_WORLD=WARPS.length;
RIFT_WORLDS.forEach(([id,name,boss],k)=>{const [x,gy,,ry]=VAULT_ALCOVES[k];
 WARPS.push({id,name,map:'rift',gen:true,floors:3,clear:'rw_'+id,gate:[x,gy],returnTo:['i_vault',x,ry],arena:'ik'+(k+1),boss,spawn:[0,0,0],bossSpawn:[0,0,0]});
 RIFT_STYLE[id]={walls:'rift',ground:'deep',zone:'rw_'+id,look:['jungle','snow','astral'].includes(id)?'dream':'underground',jp:name}});
const riftSpeciesId=name=>Object.keys(COMPANION_DATA.species).find(id=>COMPANION_DATA.species[id].name===name&&!COMPANION_DATA.species[id].retired);

/* ---------- 異界杯: eight arena cups that unseal the vault doors one by one ---------- */
const IKAI_CUPS=[['プラチナ杯','密林の狩人・ガロ'],['ミスリル杯','火山の武人・ホムラ'],['オリハルコン杯','雪原の詩人・シズク'],['星銀杯','砂の王子・アシュール'],
 ['竜鱗杯','深海の船長・マリナ'],['冥王杯','墓守の魔導士・ノクス'],['時の杯','時計職人・クロノ'],['星界杯','星詠みの賢者・ステラ']];
RIFT_WORLDS.forEach(([id,name,,,,foes],k)=>{const ids=foes.split(',').map(riftSpeciesId).filter(Boolean).sort((a,b)=>(COMPANION_DATA.species[a].rarity||1)-(COMPANION_DATA.species[b].rarity||1)),[cup,rival]=IKAI_CUPS[k],prev=RIFT_WORLDS[k-1];
 ARENA.push({id:'ik'+(k+1),name:'異界杯・'+cup,rival,hp:170+45*k,atk:30+4*k,rounds:[ids.slice(0,2),ids.slice(2,5),ids.slice(-3)],gold:800+200*k,churu:3+k,
  need:()=>k===0?!!(F().dreamWon&&isle().arena.gold):!!(isle().arena['ik'+k]&&F()['rw_'+prev[0]]),
  needText:k===0?'夢の島をクリアし、ゴールド杯で優勝':`異界杯・${IKAI_CUPS[k-1][0]}で優勝し「${prev[1]}」をクリア`,
  unlock:`城の地下・転移回廊の扉「${name}」の封印が解けた`})});

/* ---------- look of each world ---------- */
// g: ground [base, dark, light, accent]; w: wall [cap, capLight, face, faceDark, trim]; top: wall-top fill (darker
// than any floor so walls read clearly); obj: obstacle kinds;
// fx: animated particles; dark: torch-light vignette strength.
const RIFT_THEMES={
 meadow:{top:'#24402b',g:['#5f8f4f','#4c7a42','#86b26a','#e7d27a'],w:['#3f6e48','#6f9c5e','#4a6d43','#33533a','#8fb26c'],obj:['bush','rock','stump'],fx:'petals',dark:0},
 sky:{top:'#6c8290',g:['#a9bfc7','#8ea7b2','#d4e2e3','#f2e3a6'],w:['#c9d6dc','#eef5f5','#8ea4b0','#6e8592','#e8d48c'],obj:['cloudpillar','urn'],fx:'clouds',dark:0},
 underground:{top:'#121a22',g:['#3c4a58','#2f3b48','#58697a','#7ee6e0'],w:['#4a5a6a','#6e8494','#334250','#232f3a','#7ee6e0'],obj:['crystal','rock'],fx:'sparkle',dark:.45},
 dream:{top:'#251e3a',g:['#5b4f7a','#4a3f66','#7d6d9e','#f0b8e8'],w:['#7b6b9e','#a596c4','#57497a','#3f345c','#f0c8ff'],obj:['orb','crystal'],fx:'bubbles',dark:.2},
 jungle:{top:'#1c2814',g:['#4c5d33','#3b4a28','#6b7f45','#c9a24a'],w:['#3c5a2f','#62874a','#5b5a3e','#3f3f2b','#7fae55'],obj:['fern','mushroom','stump'],fx:'fireflies',dark:.25},
 lava:{top:'#141012',g:['#3b3036','#2b2329','#57474c','#ff7a2a'],w:['#4a3c40','#6c5a5c','#2f2629','#1f1a1c','#ff8a3a'],obj:['lavarock','obsidian'],fx:'embers',dark:.35,lava:1},
 snow:{top:'#7f9db3',g:['#dfe8ee','#bfd0dc','#f7fbfd','#9fd4ff'],w:['#e9f2f7','#ffffff','#a9c4d6','#86a6bd','#bfe6ff'],obj:['icespike','snowpine'],fx:'snow',dark:0},
 desert:{top:'#5e4529',g:['#d5b67c','#bf9e66','#e9cf98','#b5793f'],w:['#c79f63','#e4c58a','#a87f4b','#86633a','#e2b84a'],obj:['pillar','statue'],fx:'sand',dark:0},
 sea:{top:'#152a35',g:['#3e6474','#2f5262','#5b8796','#ffb38a'],w:['#3f5d6c','#5f8494','#7a4f63','#5a3a4b','#ff8f9a'],obj:['coral','clam','kelp'],fx:'bubbles',dark:.4,caustics:1},
 crypt:{top:'#17171c',g:['#4a4a52','#3a3a42','#63636c','#c9b98a'],w:['#55555e','#75757e','#3d3d46','#2a2a31','#9a8f6a'],obj:['grave','urn'],fx:'wisps',dark:.55},
 clock:{top:'#1e1915',g:['#6a5a48','#56493a','#8a7660','#e2b84a'],w:['#5a5047','#7c6f62','#3f3833','#2b2622','#d7a944'],obj:['gear','pipe'],fx:'dust',dark:.3},
 astral:{top:'#0c0b1c',g:['#2a2850','#1f1d3e','#3d3a6c','#ffe9a3'],w:['#3a3768','#5b57a0','#26244a','#191734','#ffe9a3'],obj:['starshard','orb'],fx:'stars',dark:.15}};
const riftTheme=m=>RIFT_THEMES[m.riftTheme]||RIFT_THEMES.underground;
const RIFT_ART=new Map();
function riftCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;return [c,x,(col,a,b,ww,hh)=>{x.fillStyle=col;x.fillRect(a,b,ww,hh)}]}
const riftHash=(x,y,s=0)=>{let h=(x*374761393+y*668265263+s*2246822519)|0;h=(h^(h>>>13))*1274126177|0;return (h^(h>>>16))>>>0};
function riftDisc(r,col,cx,cy,rx,ry){for(let yy=-ry;yy<=ry;yy++){const half=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));r(col,cx-half,cy+yy,half*2+1,1)}}

/* Ground (and corridors, flowers, exit) for one cell. */
function riftGround(m,gx,gy,path){const t=riftTheme(m),id=m.riftTheme,v=riftHash(gx,gy)%8,key='g:'+id+':'+v+':'+!!path;if(RIFT_ART.has(key))return RIFT_ART.get(key);
 const [c,x,r]=riftCanvas(32,32),[base,dk,lt,ac]=t.g,h=k=>riftHash(gx%5,gy%7,k);
 r(path?dk:base,0,0,32,32);
 for(let k=0;k<9;k++){const hx=h(k)%30,hy=h(k+20)%30;r(k%2?dk:lt,hx,hy,2,1)}   // speckle
 if(id==='meadow'){for(let k=0;k<5;k++){const a=h(k+40)%28,b=4+h(k+50)%24;r('#3f6b39',a,b,1,3);r('#9cc77a',a+1,b-1,1,2)}if(v===2){r('#f2d36b',9,20,2,2);r('#e889a6',22,9,2,2)}}
 if(id==='sky'){r(lt,0,0,32,2);r(dk,0,15,32,1);r(dk,15,0,1,15);r(dk,7,16,1,16);if(v===3)r('#ffffff',12,22,6,2)}
 if(id==='underground'){if(v<2){r('#5ad2d6',8+v*12,10,2,4);r('#bff7f2',8+v*12,10,1,2)}}
 if(id==='dream'){for(let k=0;k<3;k++)r('#e8c7ff',h(k+60)%30,h(k+61)%30,1,1);if(v===1){r('#8a7ab6',6,6,20,1);r('#8a7ab6',6,25,20,1)}}
 if(id==='jungle'){for(let k=0;k<4;k++){const a=h(k+70)%26,b=h(k+71)%26;r(k%2?'#7a6a3a':'#5f7d3a',a,b,4,2);r('#8fb055',a+1,b,2,1)}if(v===4){r('#6b4b2c',0,20,32,2);r('#86603a',0,20,32,1)}}
 if(id==='lava'){if(v<2){let a=3+h(82)%24,b=4+h(83)%10;for(let s=0;s<5;s++){r('#7a2a14',a,b,2,3);r(s%3?'#ff7a2a':'#ffb04a',a,b+1,1,2);a+=(h(84+s)%3)-1;b+=3;if(b>29)break}}r('#6a5a5e',h(80)%28,h(81)%28,3,2)}
 if(id==='snow'){r('#c9dbe8',h(90)%20,h(91)%20,10,4);r('#ffffff',h(92)%28,h(93)%28,2,2);if(v===5){r('#a6d8f2',6,8,18,10);r('#d8f1ff',8,9,10,2)}}
 if(id==='desert'){if(!path){r(dk,0,15,32,1);r(dk,15,0,1,15);r(dk,(gy%2?7:23),16,1,16);r(lt,1,1,13,1);r(lt,17,17,13,1)}r('#e8cf96',h(95)%24,h(96)%24,8,2);if(v===6){r('#a8743f',10,20,5,3);r('#c98f52',11,20,3,1)}}
 if(id==='sea'){for(let k=0;k<3;k++){const b=6+k*9+(v%3);r(lt,2+k*3,b,14,1);r(lt,16-k*2,b+3,12,1)}if(v===2){r('#f4d7c4',10,20,4,3);r('#d9a48e',11,21,2,1)}if(v===6){r('#3f8a5a',22,8,2,10);r('#5fae6f',23,6,1,6)}}
 if(id==='crypt'){r(dk,0,0,32,1);r(dk,0,16,32,1);r(dk,(gy%2?10:22),0,1,16);r(dk,(gy%2?4:16),16,1,16);if(v===1){r('#2c2c33',6,8,9,1);r('#2c2c33',14,8,1,6)}if(v===4){r('#d8d2bf',17,23,8,2);r('#d8d2bf',16,22,2,4);r('#d8d2bf',24,22,2,4)}}
 if(id==='clock'){r(dk,0,15,32,2);r(dk,15,0,2,32);for(const [a,b] of [[2,2],[28,2],[2,28],[28,28],[18,2],[18,28]])r(ac,a,b,2,2);if(v===3){riftDisc(r,'#4a3e33',16,16,7,7);riftDisc(r,'#8a7660',16,16,4,4);r(ac,15,15,2,2)}}
 if(id==='astral'){for(let k=0;k<4;k++)r(k?'#9fa0ff':'#ffe9a3',h(k+100)%31,h(k+101)%31,1,1);if(v===2){for(let a=0;a<24;a++){const ang=a/24*Math.PI*2;r('#5c58b0',16+Math.round(Math.cos(ang)*10),16+Math.round(Math.sin(ang)*10),1,1)}}}
 RIFT_ART.set(key,c);return c}

/* Wall cell: a lit top cap, and a front face where the cell below is open. */
function riftWall(m,gx,gy){const t=riftTheme(m),id=m.riftTheme,wall=(x,y)=>{const ch=tileAt(m,x,y);return ch==='#'||ch===undefined},face=!wall(gx,gy+1),l=!wall(gx-1,gy),rr=!wall(gx+1,gy),up=!wall(gx,gy-1),v=riftHash(gx,gy)%6;
 const key='w:'+id+':'+face+l+rr+up+':'+v;if(RIFT_ART.has(key))return RIFT_ART.get(key);
 const [c,x,r]=riftCanvas(32,32),[cap,capL,fc,fcD,trim]=t.w,top=face?12:32,dark=t.top||fcD;
 // Wall mass: a dark top with faint texture, lit rims where it meets open floor, and a front face below.
 r(dark,0,0,32,top);for(let k=0;k<6;k++)r(k%2?fcD:'#ffffff14',riftHash(gx,gy,k)%28,2+riftHash(gx,gy,k+9)%Math.max(4,top-4),3,1);
 if(up){r(cap,0,0,32,4);r(capL,0,0,32,1)}if(l){r(cap,0,0,3,top);r(capL,0,0,1,top)}if(rr){r(cap,29,0,3,top);r(capL,31,0,1,top)}
 if(face){r(cap,0,6,32,6);r(capL,0,6,32,1)}
 if(face){r(fc,0,12,32,20);r(fcD,0,29,32,3);r(trim,0,12,32,1);
  if(id==='jungle'){for(let a=2;a<32;a+=7){r('#3f6e35',a,12,2,8+(a*7)%10);r('#7fae55',a,12,1,4)}r('#4f4a33',0,22,32,1)}
  else if(id==='lava'){for(let a=4;a<32;a+=9){r(fcD,a,13,1,16)}r('#ff7a2a',6+v*3,18,1,8);r('#ffb04a',6+v*3,20,1,3)}
  else if(id==='snow'){for(let a=1;a<32;a+=5)r('#d8f1ff',a,12,2,3+(a*3)%6);r('#ffffff',0,12,32,1)}
  else if(id==='desert'){for(let yy=16;yy<29;yy+=6){r(fcD,0,yy,32,1);r(fcD,(yy%12?8:20),yy-5,1,5)}r(trim,0,13,32,2)}
  else if(id==='sea'){for(let k=0;k<4;k++){const a=3+k*8;r('#ff8f9a',a,14+(k%2)*5,3,2);r('#ffd0a8',a+1,13+(k%2)*5,1,1)}r('#2f5262',0,26,32,3)}
  else if(id==='crypt'){for(let yy=16;yy<29;yy+=6){r(fcD,0,yy,32,1);r(fcD,(yy%12?6:18),yy-5,1,5)}if(v===2){r('#1d1d22',12,15,8,10);r('#d8d2bf',14,18,4,4);r('#2a2a31',15,20,1,1);r('#2a2a31',17,20,1,1)}if(v===4){r('#e9d38a',15,15,2,4);r('#ffb04a',15,14,2,1)}r('#4f6b45',0,13,32,1)}
  else if(id==='clock'){r(trim,0,14,32,1);r(trim,0,26,32,1);for(const a of [3,13,23])r('#8a7a6a',a,18,3,3);if(v===3){riftDisc(r,'#2b2622',16,21,6,6);riftDisc(r,trim,16,21,4,4);riftDisc(r,'#2b2622',16,21,2,2)}}
  else if(id==='astral'){for(let k=0;k<5;k++)r(k%2?'#ffe9a3':'#9fa0ff',riftHash(gx,gy,k+30)%30,14+riftHash(gx,gy,k+40)%14,1,1);r(trim,0,13,32,1)}
  else if(id==='meadow'){for(let a=1;a<32;a+=4)r('#5c8452',a,12,3,6);r('#33533a',0,20,32,9)}
  else if(id==='sky'){r('#e8d48c',0,14,32,2);for(let a=4;a<32;a+=8)r(fcD,a,17,2,11)}
  else if(id==='underground'){r('#7ee6e0',5+v*4,16,2,7);r('#c9fffb',5+v*4,16,1,3)}
  else if(id==='dream'){for(let a=3;a<32;a+=9){riftDisc(r,'#9b86c9',a,20,3,3);r('#f0c8ff',a,19,1,1)}}}
 if(face&&l)r(fcD,0,12,2,20);if(face&&rr)r(fcD,30,12,2,20);
 RIFT_ART.set(key,c);return c}

/* Exit: a glowing ring on the ground (the light is animated in drawRiftGround). */
function riftExit(m,gx,gy){const key='e:'+m.riftTheme;if(RIFT_ART.has(key))return RIFT_ART.get(key);const [c,x,r]=riftCanvas(32,32);x.drawImage(riftGround(m,gx,gy),0,0);
 riftDisc(r,'#3a2a10',16,17,13,9);riftDisc(r,'#ffd27a',16,16,12,8);riftDisc(r,'#7a5a20',16,16,9,6);riftDisc(r,'#fff2b0',16,16,6,4);RIFT_ART.set(key,c);return c}

function riftTile(ch,m,gx,gy){if(!m.riftTheme)return null;
 if(ch==='#')return riftWall(m,gx,gy);if(ch==='E')return riftExit(m,gx,gy);
 if(ch==='.'||ch==='o'||ch==='&')return riftGround(m,gx,gy,false);if(ch===',')return riftGround(m,gx,gy,true);
 if(ch==='f'){const key='f:'+m.riftTheme+':'+riftHash(gx,gy)%3;if(RIFT_ART.has(key))return RIFT_ART.get(key);const [c,x,r]=riftCanvas(32,32);x.drawImage(riftGround(m,gx,gy),0,0);const ac=riftTheme(m).g[3],v=riftHash(gx,gy)%3;
  // small glowing details: flowers, crystals, mushrooms, shells, stars…
  for(let k=0;k<3;k++){const a=5+k*9+v,b=8+((k*11+v*5)%16);r('#00000033',a,b+4,4,1);r(ac,a,b,3,3);r('#ffffffaa',a,b,1,1)}RIFT_ART.set(key,c);return c}
 return null}

/* Tall obstacles (&): 32×48 art drawn as scenery so actors pass behind them. */
function riftObject(m,gx,gy){const t=riftTheme(m),kind=t.obj[riftHash(gx,gy,3)%t.obj.length],key='o:'+m.riftTheme+':'+kind;if(RIFT_ART.has(key))return RIFT_ART.get(key);
 const [c,x,r]=riftCanvas(32,48),d=(col,cx,cy,rx,ry)=>riftDisc(r,col,cx,cy,rx,ry),ac=t.g[3];
 d('#00000044',16,44,12,3);
 const k={
  bush:()=>{d('#2f5a36',16,34,13,10);d('#4f7c45',15,31,11,8);d('#6f9c5e',12,28,6,4);r('#e889a6',20,30,2,2);r('#f2d36b',9,34,2,2)},
  rock:()=>{d('#4a5560',16,36,12,8);d('#6d7b86',15,33,10,6);r('#8e9ba5',10,30,6,2)},
  stump:()=>{r('#5a3e28',8,28,16,16);r('#7a5636',9,28,14,14);d('#b08a5a',16,28,8,3);d('#8a6a42',16,28,5,2);r('#4f7c45',6,40,6,4)},
  cloudpillar:()=>{r('#9fb2bd',10,12,12,32);r('#d4e2e3',11,12,4,32);d('#eef5f5',16,12,9,4);d('#ffffff',13,40,10,4)},
  urn:()=>{d('#7a5a3a',16,34,9,10);r('#9a7a4e',12,22,8,8);r(ac,11,22,10,2);d('#b08a5a',13,32,3,5)},
  crystal:()=>{for(const [a,hh,col] of [[10,26,'#3fb2b6'],[17,36,'#7ee6e0'],[23,22,'#5ad2d6']]){r(col,a-3,44-hh,6,hh);r('#d6fffb',a-3,44-hh,2,hh-4);r('#ffffff',a-1,44-hh,1,3)}},
  orb:()=>{r('#3f345c',14,30,4,14);d('#f0c8ff',16,22,8,8);d('#ffffff',13,19,3,3);d('#c7a0f0',16,26,6,2)},
  fern:()=>{for(let k=0;k<7;k++){const ang=-Math.PI*(.15+k*.11);for(let s=0;s<16;s++){const px=16+Math.cos(ang)*s*1.05,py=42+Math.sin(ang)*s*1.6;r(s%3?'#4f7c3a':'#7fae55',Math.round(px),Math.round(py),2,2)}}},
  mushroom:()=>{r('#e8dcc0',13,28,6,16);d('#b8452f',16,26,13,7);d('#d9603f',15,24,11,5);for(const [a,b] of [[9,24],[19,22],[24,26],[14,21]])r('#fff2e0',a,b,3,2)},
  lavarock:()=>{d('#2b2329',16,36,13,8);r('#3b3036',8,20,16,20);r('#57474c',10,16,10,8);r('#ff7a2a',13,24,2,12);r('#ffd27a',13,26,1,4);r('#ff7a2a',19,30,1,6)},
  obsidian:()=>{for(const [a,hh] of [[10,24],[16,34],[22,20]]){r('#1a1418',a-3,44-hh,6,hh);r('#4a3a50',a-3,44-hh,2,hh);r('#ff8a3a',a,44-hh+4,1,3)}},
  icespike:()=>{for(const [a,hh] of [[9,22],[16,36],[23,26]]){for(let yy=0;yy<hh;yy++){const w=Math.max(1,Math.round(5*(yy/hh)));r(yy%5?'#a9d8f0':'#ffffff',a-w,44-hh+yy,w*2,1)}}r('#ffffff',15,10,1,6)},
  snowpine:()=>{r('#5a4030',14,36,4,8);for(let k=0;k<4;k++){d('#2f5a4a',16,14+k*7,5+k*2,4);d('#ffffff',16,12+k*7,4+k*2,2)}},
  pillar:()=>{r('#a87f4b',9,8,14,36);r('#e4c58a',10,8,4,36);r('#86633a',20,8,3,36);r('#e2b84a',7,6,18,4);r('#e2b84a',7,40,18,4);r('#86633a',8,22,16,2)},
  statue:()=>{r('#a87f4b',8,34,16,10);r('#e2b84a',8,34,16,2);d('#c79f63',16,22,7,9);d('#e4c58a',15,14,5,5);r('#3d8fb0',14,13,1,1);r('#3d8fb0',17,13,1,1)},
  coral:()=>{for(const [a,col] of [[9,'#ff8f9a'],[16,'#ffb38a'],[23,'#e86a8a']]){r(col,a-1,20,3,24);for(let k=0;k<4;k++)r(col,a+(k%2?2:-4),22+k*5,4,2)}},
  clam:()=>{d('#7a4f63',16,38,13,6);d('#c98aa0',16,33,12,7);r('#f8f2ea',14,32,4,4);r('#ffffff',14,32,2,2)},
  kelp:()=>{for(const a of [10,16,22])for(let yy=6;yy<44;yy++)r(yy%6<3?'#3f8a5a':'#5fae6f',a+Math.round(Math.sin(yy/4+a)*2),yy,2,1)},
  grave:()=>{r('#55555e',9,16,14,28);d('#55555e',16,17,7,5);r('#75757e',10,16,4,28);r('#2a2a31',13,24,6,1);r('#2a2a31',15,21,2,7);r('#4f6b45',8,42,16,2)},
  gear:()=>{d('#3f3833',16,26,13,13);for(let k=0;k<8;k++){const a=k/8*Math.PI*2;r('#3f3833',16+Math.round(Math.cos(a)*13)-2,26+Math.round(Math.sin(a)*13)-2,5,5)}d('#d7a944',16,26,9,9);d('#8a7a6a',16,26,4,4);r('#3f3833',14,38,4,6)},
  pipe:()=>{r('#7c6f62',8,6,6,38);r('#a0907a',8,6,2,38);r('#7c6f62',8,10,18,6);r('#d7a944',6,14,10,3);r('#d7a944',22,8,6,10);d('#e9e2d0',25,6,3,3)},
  starshard:()=>{for(const [a,hh,col] of [[10,22,'#5b57a0'],[17,34,'#9fa0ff'],[24,18,'#7c78d0']]){for(let yy=0;yy<hh;yy++){const w=Math.max(1,Math.round(4*Math.sin(yy/hh*Math.PI)));r(col,a-w,44-hh+yy-6,w*2,1)}}r('#ffe9a3',16,8,2,2);r('#ffffff',16,9,1,1)}}[kind];
 k?.();RIFT_ART.set(key,c);return c}

/* Event objects on the floor. */
function riftEventCanvas(kind,m){const key='ev:'+kind+':'+(m?.riftTheme||'');if(RIFT_ART.has(key))return RIFT_ART.get(key);const [c,x,r]=riftCanvas(32,32),d=(col,cx,cy,rx,ry)=>riftDisc(r,col,cx,cy,rx,ry);
 if(kind==='spring'){d('#3c5560',16,20,14,9);d('#6fb8d0',16,19,12,7);d('#bfeaf5',13,17,5,2);r('#ffffff',20,20,2,1);r('#8a8f96',3,14,4,10);r('#8a8f96',25,14,4,10)}
 if(kind==='tablet'){r('#4a4a52',7,4,18,26);d('#63636c',16,6,9,4);r('#6f6f78',8,6,4,24);for(let y=11;y<26;y+=4)r('#c9b98a',11,y,10,1);r('#9fe3ff',15,8,2,2)}
 if(kind==='stairs'){r('#3a3028',2,2,28,28);for(let i=0;i<5;i++){r(['#8a7a68','#7a6a58'][i%2],4+i*2,4+i*5,24-i*4,5);r('#2a221c',4+i*2,8+i*5,24-i*4,1)}r('#1a1612',12,26,8,4)}
 if(kind==='vaultdoor'){r('#2a2420',2,0,28,32);r('#5a4a3a',4,2,24,30);r('#7a6a52',5,3,10,28);r('#7a6a52',17,3,10,28);for(const y of [8,20])r('#3a3028',4,y,24,2);riftDisc(r,'#9fe3ff',16,16,5,5);riftDisc(r,'#2a4a6a',16,16,3,3);r('#d8f6ff',15,13,2,6)}
 if(kind==='altar'){r('#5a4a3a',5,18,22,12);r('#8a7660',4,16,24,4);d('#ffd27a',16,10,4,6);r('#fff2b0',15,8,2,4)}
 RIFT_ART.set(key,c);return c}

/* ---------- animated layers ---------- */
function drawRiftGround(m,now,tile,cx,cy,x0,y0,x1,y1,visible,scale){if(!m.riftTheme)return;const t=riftTheme(m);ctx.save();
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(!visible(x,y))continue;const ch=tileAt(m,x,y),px=x*tile-cx,py=y*tile-cy;
  if(ch==='E'){const p=.5+.5*Math.sin(now/280);ctx.globalAlpha=.35+.35*p;ctx.fillStyle='#fff2b0';ctx.beginPath();ctx.ellipse(px+tile/2,py+tile/2,tile*.45*(1+p*.12),tile*.3*(1+p*.12),0,0,Math.PI*2);ctx.fill();
   ctx.globalAlpha=.25*(1-p);ctx.fillRect(px+tile*.3,py-tile*(.6+p*.4),tile*.4,tile*(1.1+p*.4));continue}
  if(t.lava&&ch!=='#'&&riftHash(x,y)%8<2){const a=.18+.14*Math.sin(now/520+x*1.3+y),gx=px+(6+riftHash(x,y,5)%20)*scale,gy=py+(8+riftHash(x,y,6)%16)*scale,g=ctx.createRadialGradient(gx,gy,0,gx,gy,tile*.45);g.addColorStop(0,`rgba(255,140,60,${a})`);g.addColorStop(1,'rgba(255,140,60,0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(px-tile*.2,py-tile*.2,tile*1.4,tile*1.4)}
  if(t.caustics&&ch!=='#'){ctx.globalAlpha=.12+.08*Math.sin(now/600+x+y*.7);ctx.fillStyle='#bff6ff';const o=(now/40+x*13+y*7)%tile;ctx.fillRect(px+o*.5,py+tile*.3,tile*.25,scale);ctx.fillRect(px+tile-o*.4-tile*.2,py+tile*.7,tile*.2,scale)}
  if(m.riftTheme==='astral'&&ch!=='#'&&riftHash(x,y,7)%5===0){ctx.globalAlpha=.4+.4*Math.sin(now/300+x*2+y);ctx.fillStyle='#ffe9a3';ctx.fillRect(px+(riftHash(x,y,8)%28)*scale,py+(riftHash(x,y,9)%28)*scale,scale*2,scale*2)}}
 ctx.restore()}

function drawRiftAir(m,now,tile,cx,cy,W,H,hero,scale){if(!m.riftTheme)return;const t=riftTheme(m);ctx.save();
 const P=(n,fn)=>{for(let i=0;i<n;i++)fn(i,(i*137.5)%1)};
 if(t.fx==='embers')P(26,i=>{const life=(now/(2600+i*90)+i*.37)%1,x=((i*97.3)%W)+Math.sin(now/500+i)*10,y=H-life*H*1.1;ctx.globalAlpha=.8*(1-life);ctx.fillStyle=i%3?'#ff8a3a':'#ffd27a';ctx.fillRect(x,y,2*scale,2*scale)});
 if(t.fx==='snow')P(40,i=>{const y=((now*.03*(1+i%3*.4)+i*53)%(H+20))-10,x=((i*71.3+now*.012*(1+i%2))%(W+20))-10+Math.sin(now/700+i)*8;ctx.globalAlpha=.85;ctx.fillStyle='#ffffff';ctx.fillRect(x,y,(1+i%2)*scale,(1+i%2)*scale)});
 if(t.fx==='bubbles')P(18,i=>{const life=(now/(4200+i*120)+i*.29)%1,x=((i*113.1)%W)+Math.sin(now/600+i*2)*12,y=H-life*(H+30);ctx.globalAlpha=.55*(1-life*.6);ctx.strokeStyle='#d8f6ff';ctx.lineWidth=Math.max(1,scale*.8);ctx.beginPath();ctx.arc(x,y,(2+i%3)*scale,0,Math.PI*2);ctx.stroke()});
 if(t.fx==='fireflies')P(16,i=>{const x=((i*151.7)%W)+Math.sin(now/1300+i)*30,y=((i*89.3)%H)+Math.cos(now/1100+i*1.7)*20,a=.5+.5*Math.sin(now/240+i*3);ctx.globalAlpha=a;ctx.fillStyle='#e9ff8a';ctx.fillRect(x,y,2*scale,2*scale);ctx.globalAlpha=a*.25;ctx.beginPath();ctx.arc(x+scale,y+scale,6*scale,0,Math.PI*2);ctx.fill()});
 if(t.fx==='sand')P(22,i=>{const x=((now*.18*(1+i%3*.3)+i*137)%(W+60))-30,y=((i*61.7)%H)+Math.sin(now/400+i)*4;ctx.globalAlpha=.35;ctx.fillStyle='#f3dfa8';ctx.fillRect(x,y,(8+i%4*4)*scale*.5,scale)});
 if(t.fx==='wisps')P(8,i=>{const x=((i*211.3+now*.02*(1+i%2))%(W+80))-40,y=((i*97.1)%H)+Math.sin(now/900+i)*16,a=.18+.12*Math.sin(now/500+i);const g=ctx.createRadialGradient(x,y,0,x,y,tile*.9);g.addColorStop(0,`rgba(190,230,255,${a})`);g.addColorStop(1,'rgba(190,230,255,0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(x-tile,y-tile,tile*2,tile*2)});
 if(t.fx==='dust')P(24,i=>{const x=((i*97.7)%W)+Math.sin(now/1500+i)*20,y=((i*57.1+now*.008)%H),a=.3+.3*Math.sin(now/700+i);ctx.globalAlpha=a;ctx.fillStyle='#ffe3a0';ctx.fillRect(x,y,scale,scale)});
 if(t.fx==='stars')P(30,i=>{const x=(i*97.7)%W,y=(i*57.3)%H,a=Math.max(0,Math.sin(now/(500+i*30)+i));ctx.globalAlpha=a;ctx.fillStyle=i%4?'#ffffff':'#ffe9a3';ctx.fillRect(x,y,scale*(1+i%2),scale*(1+i%2))});
 if(t.fx==='sparkle')P(14,i=>{const x=(i*131.7)%W,y=(i*71.9)%H,a=Math.max(0,Math.sin(now/400+i*2));ctx.globalAlpha=a;ctx.fillStyle='#bff7f2';ctx.fillRect(x,y,scale*2,scale*2)});
 if(t.fx==='petals')P(14,i=>{const x=((i*137.5+now*.03)%(W+40))-20,y=((i*71.3)%H+now*.01*(1+i%3))%H;ctx.globalAlpha=.8;ctx.fillStyle=i%2?'#f4b3c8':'#fff2f6';ctx.fillRect(x,y,2*scale,scale)});
 if(t.fx==='clouds')P(4,i=>{const x=((now*.01*(1+i*.3)+i*W*.3)%(W+300))-150,y=H*(.15+i*.22);ctx.globalAlpha=.12;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(x,y,tile*3,tile*.9,0,0,Math.PI*2);ctx.fill()});
 // Torch light: dark worlds fade to black away from the hero.
 if(t.dark){const hx=(hero.rx+.5)*tile-cx,hy=(hero.ry+.3)*tile-cy,flick=1+Math.sin(now/90)*.015+Math.sin(now/37)*.01,g=ctx.createRadialGradient(hx,hy,tile*1.2*flick,hx,hy,tile*5.2*flick);
  g.addColorStop(0,'rgba(5,6,12,0)');g.addColorStop(1,`rgba(5,6,12,${t.dark})`);ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
 ctx.restore()}

/* ---------- events ---------- */
const RIFT_EVENT_TYPES=['spring','tablet','wanderer','mimic','elite'];
function riftWorldIndex(){return S?.rift?.w??0}
function riftFoes(){const z=ZONES[RIFT_STYLE[WARPS[riftWorldIndex()].id].zone];return (z?.foes||[]).filter(k=>ENEMIES[k]?.companion)}
/* One event on the current floor; `i` keeps it done once per floor (S.rift.opened). */
function riftEventEntity(e,i){const key='ev'+i,done=()=>!!S?.rift&&S.rift.opened.includes(key),finish=()=>{S.rift.opened.push(key);save()},type=e.type,R=S?.rift,seed=(R?.seed||1)+i;
 const base={x:e.x,y:e.y,cond:()=>!done()};
 if(type==='spring')return {...base,riftObj:'spring',talk:async()=>{for(const m of S.companions.owned){CR.health(m,CD.species);if(m.hp>0){m.hp=m.maxHp;m.mp=m.maxMp}}S.hp=maxHp();S.mp=maxMp();finish();await sys('澄んだ泉の水を飲んだ。仲間のHPとSPが全回復した！<br><small>（戦闘不能の仲間は宿屋で）</small>')}};
 if(type==='tablet')return {...base,riftObj:'tablet',talk:async()=>{finish();const w=randomUnknownWord(2);if(w){await sys('古代の石碑に、ことばが刻まれている……');await teachWords([w],'古代の石碑')}else{S.exp+=40*(riftWorldIndex()+1);await sys(`古代の石碑の文字を読み解いた。経験値 +${40*(riftWorldIndex()+1)}`)}}};
 const foes=riftFoes(),mon=foes.length?ENEMIES[foes[seed%foes.length]].companion:'seedpod_mouse';
 if(type==='wanderer')return {...base,mon,talk:async()=>{const n=CD.species[mon].name;await say(n,'I am lost... Do you know this word?',`${n}が迷っている。「このことば、わかる？」`);
  const ok=await quiz(qVocab(curTier()));finish();if(!S.companions.seen.includes(mon))S.companions.seen.push(mon);
  if(ok){S.items.churu=(S.items.churu||0)+1;S.items.berry+=2;await sys(`${n}はうれしそうに道を教えてくれた。チュールと木の実×2をもらった！（図鑑に記録）`)}else await sys(`${n}は首をかしげて去っていった……（図鑑に記録）`)}};
 if(type==='mimic'){const k=riftMimicKey(seed);return {...base,chest:'mimic'+i,talk:async()=>{await sys('宝箱を開けようとしたら……宝箱が動き出した！');const r=await battle(k);if(r==='win'){finish();const g=120*(riftWorldIndex()+1);S.gold+=g;S.items.ether+=1;await sys(`中から宝が出てきた！ ${g}ゴールドとエーテルを手に入れた。`)}else if(r==='lose')await gameOver()}}}
 const k=riftEliteKey(seed),en=ENEMIES[k];
 return {...base,mon:en.companion,talk:async()=>{if(!await yesno(en.jp,'...',`強い気配の${en.jp}がこちらをにらんでいる。挑む？`,'挑む','やめておく'))return;const r=await battle(k);
  if(r==='win'){finish();const g=200*(riftWorldIndex()+1);S.gold+=g;S.items.churu=(S.items.churu||0)+2;await sys(`強敵に勝った！ ${g}ゴールドとチュール×2。`);await teachWords([randomUnknownWord(2)].filter(Boolean),en.jp)}else if(r==='lose')await gameOver()}}}
// Treasure-chest monsters and floor elites: a rarer monster than the world's regulars, made tougher.
function riftStrongPick(seed,minRarity){const SP=CD.species,ids=Object.keys(SP).filter(id=>!SP[id].retired&&SP[id].family!=='demon'&&CR.rarity(SP[id])>=minRarity);return ids[seed%ids.length]}
function riftEliteKey(seed){const wi=riftWorldIndex(),key='rift_elite_'+wi;const id=riftStrongPick(seed,Math.min(10,5+wi)),s=CD.species[id],k=wi+1;
 ENEMIES[key]={name:s.name,jp:s.name,companion:id,hp:Math.round((90+CR.rarity(s)*22)*(1+k*.18)),atk:Math.round((12+CR.rarity(s)*2.4)*(1+k*.1)),exp:60*k,gold:40*k,tier:Math.min(3,1+Math.floor(wi/2)),spr:'golem',pal:{1:'#7a6a9a'}};return key}
function riftMimicKey(seed){const wi=riftWorldIndex(),key='rift_mimic_'+wi;const id=riftStrongPick(seed+7,Math.min(9,4+wi)),s=CD.species[id],k=wi+1;
 ENEMIES[key]={name:s.name,jp:s.name,companion:id,hp:Math.round((70+CR.rarity(s)*16)*(1+k*.15)),atk:Math.round((10+CR.rarity(s)*2)*(1+k*.08)),exp:40*k,gold:30*k,tier:Math.min(3,1+Math.floor(wi/2)),spr:'golem',pal:{1:'#9a7a4a'}};return key}

/* ---------- boss floor of the new worlds ---------- */
function genRiftBossFloor(){const W=21,H=17,g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x<2||x>W-3||y<2||y>H-2?'#':'.'));
 for(const [x,y] of [[5,5],[15,5],[5,10],[15,10],[8,3],[12,3]])g[y][x]='&';
 for(let y=12;y<H-1;y++)for(let x=9;x<=11;x++)g[y][x]=',';
 return {rows:g.map(r=>r.join('')),start:[10,H-3],ents:[{x:10,y:H-2,kind:'home'},{x:10,y:4,kind:'boss'}],rooms:[{x:2,y:2,w:W-4,h:H-3,cx:10,cy:8}]}}
async function riftWorldBoss(wi){const w=WARPS[wi],key='rwb_'+w.id,en=ENEMIES[key];
 await say(en.jp,'You came all this way... Show me the power of your words!',`${en.jp}が立ちはだかる。「ここまで来たか……ことばの力、見せてもらおう！」`);
 const r=await battle(key);
 if(r==='win'){F()[w.clear]=1;const gold=400+100*(wi-FIRST_RIFT_WORLD);S.gold+=gold;S.items.churu=(S.items.churu||0)+3;S.items.ether+=2;save();
  const next=WARPS[wi+1];await sys(`◆ ${w.name}の主、${en.jp}を倒した！ ${gold}ゴールド、チュール×3、エーテル×2。`+(next?`<br>異界の門の先「${next.name}」が目を覚ました。`:'<br>すべての異界を踏破した！'));
  await teachWords([randomUnknownWord(2),randomUnknownWord(2)].filter(Boolean),en.jp);returnToIsland(wi);await checkIslandLevel()}
 else if(r==='lose')await gameOver()}

/* ---------- entering a world at its deepest chamber ---------- */
function startRiftDeep(i){const w=WARPS[i];S.rift={w:i,floor:w.floors+1,seed:newRiftSeed(),opened:[],seen:[]};buildRift(S.rift);warp('rift',...SPAWN.rift)}

/* ---------- wiring (after ENEMIES, ZONES, LIKES and the island exist) ---------- */
function initRiftWorlds(){const SP=COMPANION_DATA.species;
 // The original world bosses become rare monsters under their own names.
 for(const [key,name,hp,atk,actions] of CLASSIC_BOSSES){const id=riftSpeciesId(name),en=ENEMIES[key];if(!id||!en)continue;
  Object.assign(en,{name,jp:name,worldArt:id,hp,atk,actions,exp:Math.max(en.exp||0,Math.round(hp*.5)),gold:Math.max(en.gold||0,Math.round(hp*.6))});   // spr stays as the fallback while the picture loads
  const wi=WARPS.findIndex(w=>({meadowking:'meadow',skyowl:'sky',crystalmole:'underground',nightmare:'dream'})[key]===w.id);if(wi>=0)WARPS[wi].boss=name}
 RIFT_WORLDS.forEach(([id,name,boss,backs,bossBack,foes],k)=>{const zone='rw_'+id,keys=[];
  for(const n of foes.split(',')){const sid=riftSpeciesId(n);if(!sid)continue;const s=SP[sid],rar=CR.rarity(s),key='rw_'+id+'_'+sid;
   ENEMIES[key]={name:s.name,jp:s.name,companion:sid,hp:Math.round((70+rar*16)*(1+k*.12)),atk:Math.round((15+rar*2.6)*(1+k*.08)),exp:Math.round(50+rar*8+k*10),gold:Math.round(30+rar*5+k*8),tier:3,spr:'golem',pal:{1:'#6a7a8a'}};keys.push(key)}
  ZONES[zone]={tier:3,foes:keys,bg:'deep'};
  if(typeof BACKDROPS!=='undefined')BACKDROPS[zone]=backs;
  const bid=riftSpeciesId(boss),bs=SP[bid],bkey='rwb_'+id;
  ENEMIES[bkey]={name:boss,jp:boss,worldArt:bid,spr:'golem',pal:{1:'#6a5a8a',A:'#ffd27a'},hp:1000+180*k,atk:38+4*k,actions:2,exp:600+120*k,gold:0,boss:1,tier:3,skill:'奥義'};
  if(typeof BOSS_BACKDROP!=='undefined')BOSS_BACKDROP[bkey]=bossBack});
 buildVault()}

/* ---------- 転移回廊 under the castle ---------- */
function buildVault(){const W=21,H=11,g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>y>=4&&y<=6&&x>=1&&x<=W-2?'.':'#'));
 for(const [x,gy,dy] of VAULT_ALCOVES){const [y0,y1]=gy<dy?[gy,dy-1]:[dy+1,gy];for(let y=y0;y<=y1;y++)for(let xx=x-1;xx<=x+1;xx++)g[y][xx]='.';g[dy][x]='.'}
 g[5][0]='E';
 MAPS.i_vault={name:'Warp Vault',jp:'城の地下・転移回廊',fill:'#',theme:{},rows:g.map(r=>r.join('')),ents:[],indoor:{},riftTheme:'underground',walls:'rift',ground:'deep',exit:['i_castle',VAULT_STAIRS[0]-1,VAULT_STAIRS[1]]};
 SPAWN.i_vault=[1,5,1];MAPLOOK.i_vault=MAPLOOK.underground||MAPLOOK.i_castle;
 const open=k=>!!isle().arena['ik'+(k+1)];
 VAULT_ALCOVES.forEach(([x,gy,dy],k)=>{const wi=FIRST_RIFT_WORLD+k,w=WARPS[wi],cup=ARENA.find(a=>a.id==='ik'+(k+1));
  E('i_vault',{x,y:dy,riftObj:'vaultdoor',cond:()=>!open(k),talk:async()=>{await sys(`封印された扉。奥から「${w.name}」の気配がする。<br>闘技場の「${cup.name}」で優勝すると封印が解ける。`+(cup.need()?'':`<br><small>（挑戦条件：${cup.needText}）</small>`))}});
  E('i_vault',{x,y:gy,prop:'warp',warp:wi,talk:()=>useGate(wi)})});
 E('i_castle',{x:VAULT_STAIRS[0],y:VAULT_STAIRS[1],riftObj:'stairs',talk:async()=>{if(!F().dreamWon){await sys('地下へ続く階段。王様の許しがないと降りられないようだ。<br><small>（夢の島をクリアすると入れる）</small>');return}warp('i_vault',...SPAWN.i_vault)}})}
