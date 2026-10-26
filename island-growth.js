/* Island growth (2026-10-26): after the five island levels, events open new land around ことのは島.
   The island map is ISLE_W x ISLE_H (72 x 44); the old island fills the top-left 56 x 34 and the new areas sit in
   the sea around it. Each area is a project: when its event condition is met (an arena cup, a number of monsters,
   breeding, cleared worlds), the carpenter トンカ on the plaza builds it for gold and the land, bridges and its people
   appear. Built projects live in isle().built; paintIslandGrowth draws them into the rows islandRows makes. */
const ISLAND_PROJECTS=[
 {id:'pier',name:'南の桟橋と釣り場',cost:200,need:()=>!!isle().arena.bronze,needText:'ブロンズ杯で優勝（浜辺ができる）',
  news:'浜辺の先に桟橋がのび、釣り場ができた！',
  paint(g,put,road){road(24,31,24,35);road(25,31,25,35);put('B',19,36,30,37);g[37][19]='b';g[37][30]='k';g[36][21]='l';g[36][28]='l'}},
 {id:'flowers',name:'花の丘',cost:300,need:()=>S.companions.owned.length>=15,needText:'モンスターを15体なかまにする',
  news:'南西の海に花の丘が生まれた！ 花屋さんが引っ越してきた。',
  paint(g,put,road){land(g,10,37,7,4.6);road(9,23,9,33);for(let y=34;y<=41;y++)for(let x=4;x<=16;x++)if(g[y][x]==='.'&&hash(x,y)%3)g[y][x]='f';
   put('r',11,34,13,34);put('#',11,35,13,35);put(',',9,34,9,38);put(',',10,36,14,36);g[38][5]='t';g[39][15]='t';g[40][8]='t'}},
 {id:'orchard',name:'東の果樹園島',cost:400,need:()=>(S.companions.breeds||0)>=3,needText:'ネネのところで3回配合する',
  news:'闘技場の島の東に果樹園島ができた！ 木の実がたくさんとれる。',
  paint(g,put,road){land(g,62,18.5,6.5,6);road(54,19,57,19);put(',',57,19,66,19);put(',',62,14,62,23);
   for(const y of [15,17,21,23])for(let x=58;x<=66;x+=2)if(g[y][x]==='.')g[y][x]='t';put('u',64,21,66,22);put('u',58,21,60,22);put('r',63,13,65,13);put('#',63,14,65,14);g[16][60]='q'}},
 {id:'market',name:'港町の市場',cost:600,need:()=>!!isle().arena.silver&&islandBuilt('pier'),needText:'シルバー杯で優勝し、桟橋を建てる',
  news:'桟橋の東に港町の市場ができた！ めずらしい品物が並んでいる。',
  paint(g,put,road){land(g,47,36,8,4.6);road(31,36,39,36);put(',',40,36,54,37);put(',',46,33,46,40);
   put('c',41,34,43,34);put('c',49,34,51,34);put('c',41,39,43,39);put('c',49,39,51,39);g[35][40]='l';g[35][53]='l';g[38][40]='l';g[38][53]='l';
   put('r',43,32,45,32);put('#',43,33,45,33);put('r',48,32,50,32);put('#',48,33,50,33)}},
 {id:'ruins',name:'北の遺跡の小島',cost:800,need:()=>WARPS.filter(w=>F()[w.clear]).length>=3&&islandBuilt('orchard'),needText:'異世界のボスを3体たおし、果樹園島を建てる',
  news:'果樹園島の北に、古い遺跡の小島が見つかった！',
  paint(g,put,road){land(g,62,6,6,3.6);road(62,10,62,12);put(',',57,6,67,6);put(',',62,3,62,9);
   for(const [x,y] of [[58,4],[66,4],[58,8],[66,8],[60,3],[64,3]])g[y][x]='#';g[5][59]='f';g[7][65]='f'}},
 {id:'festival',name:'島祭りの広場',cost:1000,need:()=>!!isle().arena.gold&&islandBuilt('market'),needText:'ゴールド杯で優勝し、港町の市場を建てる',
  news:'市場の南に祭りの広場ができた！ 島じゅうがお祭りさわぎだ。',
  paint(g,put,road){land(g,47,41.5,7,2.2);put(',',40,40,54,42);put('c',41,42,42,42);put('c',52,42,53,42);g[40][41]='l';g[40][53]='l';g[42][46]='l';g[42][48]='l';put('p',44,42,44,42);put('p',50,42,50,42)}}];
function islandBuilt(id){return !!isle().built?.[id]}
/* An oval of grass at (cx, cy) with radii rx, ry, ringed by a few shore trees. */
function land(g,cx,cy,rx,ry){for(let y=1;y<g.length-1;y++)for(let x=1;x<g[0].length-1;x++){const dx=(x-cx)/rx,dy=(y-cy)/ry,d=dx*dx+dy*dy;if(d<1&&g[y][x]==='w')g[y][x]=d>.8&&hash(x+5,y)%4===0?'t':'.'}}
function paintIslandGrowth(rows){const built=S?isle().built||{}:{};if(!ISLAND_PROJECTS.some(p=>built[p.id]))return rows;
 const g=rows.map(r=>r.split('')),H=g.length,W=g[0].length,put=(c,x0,y0,x1=x0,y1=y0)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(y>=1&&y<H-1&&x>=1&&x<W-1)g[y][x]=c};
 // A straight road: bridge over water, path over land, sand left as it is.
 const road=(x0,y0,x1,y1)=>{for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++){const c=g[y][x];if(c==='w')g[y][x]='B';else if(c!=='s'&&c!=='B')g[y][x]=','}};
 for(const p of ISLAND_PROJECTS)if(built[p.id])p.paint(g,put,road);
 return g.map(r=>r.join(''))}

/* The carpenter and the people of the new areas. */
async function carpenterTalk(){const n='大工のトンカ',i=isle();i.built=i.built||{};
 await say(n,"Tell me what to build next. I need the right event first, and some gold.","次はなにを建てようか？ きっかけになる出来事と、お金が必要だよ。");
 const v=await ask([...ISLAND_PROJECTS.map(p=>({label:`${p.name}<small>${i.built[p.id]?'完成':p.need()?`建てられる · ${p.cost}G`:'条件：'+p.needText}</small>`,value:p.id})),{label:'もどる',value:null}],{cancel:null});
 const p=ISLAND_PROJECTS.find(x=>x.id===v);if(!p)return;
 if(i.built[p.id])return sys(`${p.name}はもう完成している。`);
 if(!p.need())return sys(`まだ建てられない。<br>条件：${p.needText}`);
 if(S.gold<p.cost)return sys(`お金が足りない。（${p.cost}G 必要 ・ 所持 ${S.gold}G）`);
 if(!await yesno(`${p.cost}Gで「${p.name}」を建てますか？`))return;
 S.gold-=p.cost;i.built[p.id]=1;refreshIsland();save();await sys(`<b>島が広がった！</b><br>${p.news}`)}
function addIslandGrowth(){const I='island',built=id=>()=>islandBuilt(id);
 E(I,{x:21,y:12,pal:'guard',name:'Carpenter',talk:carpenterTalk});
 E(I,{x:23,y:36,pal:'sailor',name:'Angler',cond:built('pier'),talk:async()=>{const n='釣り師ウオマツ';
  if(F().fishDay===S.stats.right+S.stats.wrong)return say(n,"The fish are shy today. Come back after more questions.","今日はもう釣れないなあ。また問題に答えてから来な。");
  F().fishDay=S.stats.right+S.stats.wrong;S.items.berry+=1;S.items.churu=(S.items.churu||0)+1;save();await say(n,"Look at this catch! Take some.","大漁だ！ おすそわけだよ。");await sys('木の実×1とチュール×1をもらった。')}});
 E(I,{x:10,y:37,pal:'shop',name:'Florist',cond:built('flowers'),talk:async()=>{const n='花屋のリリ';
  if(!F().flowerGift){F().flowerGift=1;S.items.churu=(S.items.churu||0)+3;save();await say(n,"Thank you for this hill! Monsters love to nap in the flowers.","丘をありがとう！ モンスターたちが花の中でお昼寝してるの。");return sys('チュール×3をもらった。')}
  await say(n,"Smell the flowers. Every monster here is happy.","花のかおりをどうぞ。ここのモンスターはみんな幸せそう。")}});
 E(I,{x:61,y:20,pal:'granny',name:'Orchard Keeper',cond:built('orchard'),talk:async()=>{const n='果樹園のモモばあ';
  if(F().orchardDay===S.stats.right+S.stats.wrong)return say(n,"The fruit is still ripening.","実はまだ熟していないよ。");
  F().orchardDay=S.stats.right+S.stats.wrong;S.items.berry+=3;save();await say(n,"Ripe and sweet! Take them for your monsters.","よく熟れて甘いよ！ モンスターにあげなさい。");await sys('木の実×3をもらった。')}});
 E(I,{x:46,y:35,pal:'shop',name:'Market Merchant',cond:built('market'),talk:async()=>{await say('港町の商人',"Goods from across the sea!","海の向こうの品物だよ！");await shop('港町の商人',[ITEM.churu,ITEM.ether,ITEM.berry])}});
 E(I,{x:62,y:5,pal:'scholar',name:'Archaeologist',cond:built('ruins'),talk:async()=>{const n='考古学者セキ';
  await say(n,"These stones carry words older than the kingdom.","この石には王国より古い言葉が刻まれている。");
  if(!F().ruinsWords){F().ruinsWords=1;await teachWords([randomUnknownWord(),randomUnknownWord(),randomUnknownWord()].filter(Boolean),n)}}});
 E(I,{x:47,y:41,pal:'tourist',name:'Festival Host',cond:built('festival'),talk:async()=>{const n='祭り屋台の親方';
  if(!F().festivalGift){F().festivalGift=1;S.gold+=500;S.items.ether+=3;save();await say(n,"The whole island is celebrating you!","島じゅうがあなたをお祝いしているよ！");return sys('500Gとエーテル×3をもらった。')}
  await say(n,"Enjoy the festival! Try every stall.","お祭りを楽しんで！ 屋台を全部まわってね。")}});
}
/* DEBUG: open every part of the island at once (debug save only). */
function debugUnlockIsland(){const i=isle();i.kiki=Math.max(i.kiki,20);i.nene=Math.max(i.nene,20);for(const id of ['bronze','silver','gold'])i.arena[id]=i.arena[id]||1;
 i.built=Object.fromEntries(ISLAND_PROJECTS.map(p=>[p.id,1]));i.seenLevel=islandLevel();refreshIsland()}
