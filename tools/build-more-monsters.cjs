// Builds companion-more.js from tools/more-monsters.txt (id|カタカナ名|tier, one per line).
// Art: assets/monsters/<id>.webp (cropped 200px from Drive ゲーム用モンスター素材/通常画像).
// Everything else is derived deterministically from the English id words: where it lives, what praise it likes,
// a short field-guide note, battle stats and breeding recipes. Run: node tools/build-more-monsters.cjs
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const rows=fs.readFileSync(path.join(__dirname,'more-monsters.txt'),'utf8').split(/\r?\n/).filter(Boolean).map(l=>{const [id,name,tier]=l.split('|');return {id,name,tier:+tier,w:id.split('_')}});
const h=s=>{let x=2166136261;for(const c of s)x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0};
const has=(m,list)=>m.w.some(w=>list.some(k=>w.includes(k)));
const CAT={
 aquatic:['fish','jelly','squid','seahorse','cuttlefish','eel','crab','manta','nautilus','moray','skate','goby','minnow','clione','isopod','paddlefish','koi','scallop','lobster','puffer','angler','seadragon','coelacanth','oarfish','leviathan','tadpole','mudskipper','seal','otter','hermit','pelican'],
 bird:['crow','chick','duckling','finch','kingfisher','crane','owl','heron','ibis','swallow','shoebill','cockatoo','toucan','condor','roc','cockatrice','lyrebird','puffin','bellbird','guineafowl','cassowary','capercaillie','secretarybird','hoatzin','frogmouth','peacock'],
 insect:['beetle','pillbug','grub','moth','firefly','mantis','cicada','lacebug','cricket','weevil','waterstrider','dragonfly','scorpionfly','antlion','vinegaroon','bat'],
 plant:['mandrake','pricklypear','orchid','rafflesia','shrub','rootwalker','dandelion','pitcher','pomegranate','tree','lotus','cacao'],
 dragon:['dragon','wyvern','wyrm','drake','hexadrake','basilisk','hydra','kirin','chimera','salamander'],
 spirit:['spirit','ghost','blob','dreambeast','sphinx','gargoyle','golem','oracle','seraph','meteor','colossus','windchime','fossil'],
 reptile:['gecko','newt','skink','toad','frog','axolotl','iguana','caiman','gharial','tortoise','chameleon','snail','slug']};
const catOf=m=>Object.keys(CAT).find(c=>has(m,CAT[c]))||'beast';
const LIKE_WORDS={
 cute:['squirrel','hamster','chick','duckling','frog','snail','quokka','chinchilla','shrew','goby','jerboa','fawn','capybara','panda','alpaca','otter','axolotl','hare','puff','dewdrop','raindrop','teacup','tadpole','blob','minnow'],
 strong:['bear','boar','bison','golem','colossus','titan','behemoth','mammoth','beetle','armadillo','tortoise','caiman','gharial','anvil','hammer','tusk','warg','mandrill'],
 fast:['kingfisher','swallow','hare','finch','dragonfly','leopard','fox','ferret','crow','condor','waterstrider','cricket','skink','gecko','storm','tempest','spear'],
 smart:['owl','fox','oracle','sphinx','squid','cuttlefish','nautilus','ayeaye','spirit','compass','crow','eleveneye','seveneye','fossil','clockwork','rune','musicbox'],
 beauty:['moth','jelly','peacock','crane','heron','lyrebird','seahorse','koi','lionfish','orchid','firefly','cockatoo','windchime','aurora','opal','pearl','rose','glass','crystal','lantern','celestial'],
 brave:['dragon','wyvern','wyrm','drake','lion','condor','gryphon','kirin','cockatrice','chimera','basilisk','leopard','roc','scorpion','blade','spear','ember','tyrant'],
 kind:['tapir','capybara','dugong','seal','mandrake','okapi','tortoise','pelican','alpaca','lotus','sleepy','honey','moss','fern','clover','bell','harp']};
const TAGS=Object.keys(LIKE_WORDS);
function likesOf(m){const out=[];for(const t of TAGS)if(has(m,LIKE_WORDS[t])&&!out.includes(t))out.push(t);let k=h(m.id);while(out.length<2){const t=TAGS[k%TAGS.length];if(!out.includes(t))out.push(t);k=Math.floor(k/7)+3}return out.slice(0,2)}
function zoneOf(m){const c=catOf(m),k=h(m.id);
 if(m.tier===4)return null;
 if(m.tier===1)return c==='aquatic'?'w1':c==='insect'||c==='plant'?'forest':has(m,['bat','coal','golem','pebble','flint'])?'cave':['meadow','forest','w1','meadow'][k%4];
 if(m.tier===2){if(c==='bird')return 'sky';if(has(m,['crystal','quartz','fossil','geode','magnet','mercury','gear','rune','pangolin','mole','isopod','salt']))return 'underground';
  if(has(m,['hourglass','scorpion','antlion','pricklypear','cassowary','vinegaroon','tamarind','cacao','cricket']))return 'desert';if(c==='aquatic')return 'w2';if(c==='plant'||c==='spirit')return 'ruins';return ['w2','ruins','sky','underground'][k%4]}
 if(has(m,['ember','obsidian','basalt','volcan','garnet','crimson']))return k%2?'volcano':'volcanic';
 if(has(m,['dream','mask','mirror','moon','eclipse','celestial','sphinx','gargoyle']))return 'dream';
 if(has(m,['ice','frost','glacier','snow']))return 'tower';
 return ['volcanic','dream','tower','sky','underground'][k%5]}
const HABITAT={meadow:'はじまりの草原',forest:'森',w1:'ルミナの草原',cave:'ささやきの洞窟',sky:'空中庭園',underground:'地底水晶庭',desert:'砂漠',ruins:'遺跡',w2:'東の地方',volcano:'火山',volcanic:'火山地帯',dream:'夢の島',tower:'沈黙の塔'};
const CAT_NOTE={aquatic:'水の中をすいすい泳ぐ。',bird:'大きな翼で空を自在に飛び回る。',insect:'小さな体に驚くほどの力を秘めた虫のモンスター。',plant:'根や葉で日の光を集めて暮らす植物のモンスター。',dragon:'竜の血を引き、鋭い爪と誇り高い心を持つ。',spirit:'ふしぎな力から生まれた精霊のようなモンスター。',reptile:'ひんやりした体で、水辺や岩場を好む。',beast:'たくましい四肢で野山を駆ける獣のモンスター。'};
const TIER_NOTE={1:'人なつっこく、旅の始めの仲間にぴったり。',2:'各地の冒険で出会える頼もしい種。',3:'強大な力を秘め、出会うには世界の奥深くまで進む必要がある。',4:'配合でしか生まれない伝説級のモンスター。'};
const by={1:[],2:[],3:[],4:[]};for(const m of rows)by[m.tier].push(m);
// Recipes: two tier-n parents make a tier-(n+1) child. Every legend (tier 4) gets one; most tier 2-3 too.
const existing=new Set(['sprout_ear_mole|lantern_moth','seedpod_mouse|lotus_root_sproutling','pinecone_sparrow|seedpod_mouse','silk_leaf_caterpillar|lotus_root_sproutling'].map(s=>s.split('|').sort().join('|')));
const recipes=[];
// Pairs parents i,i+1 of the tier below; if that pair is already used, steps on until a free pair is found.
const addRecipe=(pool,i,child)=>{for(let s=0;s<pool.length*pool.length;s++){const a=pool[(2*i+s)%pool.length].id,b=pool[(2*i+1+s*3)%pool.length].id,k=[a,b].sort().join('|');if(a===b||existing.has(k))continue;existing.add(k);recipes.push([a,b,child]);return}};
by[4].forEach((m,i)=>addRecipe(by[3],i,m.id));
by[3].slice(0,40).forEach((m,i)=>addRecipe(by[2],i,m.id));
by[2].slice(0,40).forEach((m,i)=>addRecipe(by[1],i,m.id));
const data=rows.map(m=>{const k=h(m.id),z=zoneOf(m),hp=[0,16,32,58,95][m.tier]+k%9,atk=[0,5,10,16,24][m.tier]+k%3;
 return [m.id,m.name,m.tier,z,likesOf(m),z?HABITAT[z]:'配合でのみ生まれる',(catOf(m)==='beast'&&m.tier===1?'小さな体で元気いっぱいに駆け回る。':CAT_NOTE[catOf(m)])+TIER_NOTE[m.tier],hp,atk]});
const js=`/* ${rows.length} more companion species. GENERATED by tools/build-more-monsters.cjs from tools/more-monsters.txt — edit those, not this file.
   Art: assets/monsters/<id>.webp. Row: [id, name, tier 1-4, encounter zone (null = breeding only), liked praise, habitat, note, hp, atk]. */
const MORE_MONSTERS=${JSON.stringify(data)};
const MORE_RECIPES=${JSON.stringify(recipes)};
// Registered before companion-ui.js runs, so they are full species everywhere (dex, breeding, saves).
for(const [id,name,tier] of MORE_MONSTERS)COMPANION_DATA.species[id]={name,img:'assets/monsters/'+id+'.webp',power:[0,3,4,6,8][tier],...(tier===4?{fusionOnly:true}:{})};
for(const [a,b,child] of MORE_RECIPES)COMPANION_DATA.recipes.push({parents:[a,b],child});
/* Battle enemies, encounter zones, praise likes and field-guide entries (needs ENEMIES/ZONES from the main script). */
function initMoreMonsters(){
 for(const [id,name,tier,zone,likes,habitat,note,hp,atk] of MORE_MONSTERS){
  DEX_INFO[id]={habitat,note};if(tier===4)continue;
  ENEMIES[id]={name,jp:name,companion:id,hp,atk,exp:Math.round(hp*.55),gold:Math.round(hp/3),spr:'wisp',pal:{1:'#9bd573',2:'#fff',E:'#142020'}};
  LIKES[id]={tags:likes,need:tier===1?2:tier===2?3:4,hint:note};
  if(ZONES[zone])ZONES[zone].foes.push(id)}}
`;
fs.writeFileSync(path.join(root,'companion-more.js'),js);
console.log(JSON.stringify({species:data.length,recipes:recipes.length,zones:data.reduce((o,d)=>(o[d[3]]=(o[d[3]]||0)+1,o),{})}));
