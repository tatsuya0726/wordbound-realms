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
// Families: every species belongs to one, so a recipe can ask for "any bird" ('@bird') as one parent.
const ORIGINALS=[['seedpod_mouse',1,'beast'],['lotus_root_sproutling',1,'plant'],['silk_leaf_caterpillar',1,'insect'],['pinecone_sparrow',1,'bird'],['sprout_ear_mole',2,'beast'],['lantern_moth',2,'insect'],['thunder_feather_owlet',2,'bird'],['ancient_forest_stag',3,'beast']];
const all=[...ORIGINALS.map(([id,tier,fam])=>({id,tier,fam})),...rows.map(m=>({id:m.id,tier:m.tier,fam:catOf(m)}))];
const family=Object.fromEntries(all.map(s=>[s.id,s.fam]));
// Recipes. The four original ones stay. Then two tier-n parents make a tier-(n+1) child (legends, then most tier 3 and 2),
// then every species still without a recipe gets one from the tier below (same family first), and about half of all species
// — every legend — get a second way to make them: a specific monster plus any monster of the child's family.
const existing=new Set(['sprout_ear_mole|lantern_moth','seedpod_mouse|lotus_root_sproutling','pinecone_sparrow|seedpod_mouse','silk_leaf_caterpillar|lotus_root_sproutling'].map(s=>s.split('|').sort().join('|')));
const covered=new Set(['ancient_forest_stag','sprout_ear_mole','thunder_feather_owlet','lantern_moth']);
const recipes=[];
const tryAdd=(a,b,child)=>{const k=[a,b].sort().join('|');if(a===b||existing.has(k))return false;existing.add(k);recipes.push([a,b,child]);covered.add(child);return true};
// Pairs parents i,i+1 of the tier below; if that pair is already used, steps on until a free pair is found.
const addRecipe=(pool,i,child)=>{for(let s=0;s<pool.length*pool.length;s++)if(tryAdd(pool[(2*i+s)%pool.length].id,pool[(2*i+1+s*3)%pool.length].id,child))return};
by[4].forEach((m,i)=>addRecipe(by[3],i,m.id));
by[3].slice(0,40).forEach((m,i)=>addRecipe(by[2],i,m.id));
by[2].slice(0,40).forEach((m,i)=>addRecipe(by[1],i,m.id));
const lowerOf=s=>all.filter(x=>x.tier===Math.max(1,s.tier-1)&&x.id!==s.id);
for(const s of all){if(covered.has(s.id))continue;const low=lowerOf(s),same=low.filter(x=>x.fam===s.fam),pa=same.length?same:low,k=h(s.id);
 for(let t=0;t<pa.length*low.length;t++)if(tryAdd(pa[(k+t)%pa.length].id,low[(h(s.id+'b')+t*7)%low.length].id,s.id))break}
for(const s of all){if(s.tier<4&&h(s.id+'2')%2)continue;const low=lowerOf(s),other=low.filter(x=>x.fam!==s.fam),pa=other.length?other:low,k=h(s.id+'c');
 for(let t=0;t<pa.length;t++)if(tryAdd(pa[(k+t)%pa.length].id,'@'+s.fam,s.id))break}const data=rows.map(m=>{const k=h(m.id),z=zoneOf(m),hp=[0,16,32,58,95][m.tier]+k%9,atk=[0,5,10,16,24][m.tier]+k%3;
 return [m.id,m.name,m.tier,z,likesOf(m),z?HABITAT[z]:'配合でのみ生まれる',(catOf(m)==='beast'&&m.tier===1?'小さな体で元気いっぱいに駆け回る。':CAT_NOTE[catOf(m)])+TIER_NOTE[m.tier],hp,atk]});
// Ecology and a one-line comment for every species (the first eight included), from tools/monster-lore.txt.
const lore=Object.fromEntries(fs.readFileSync(path.join(__dirname,'monster-lore.txt'),'utf8').split(/\r?\n/).filter(Boolean).map(l=>{const [id,eco,quote]=l.split('|');return [id,[eco,quote]]}));
const js=`/* ${rows.length} more companion species. GENERATED by tools/build-more-monsters.cjs from tools/more-monsters.txt and tools/monster-lore.txt — edit those, not this file.
   Art: assets/monsters/<id>.webp. Row: [id, name, tier 1-4, encounter zone (null = breeding only), liked praise, habitat, note, hp, atk]. */
const MORE_MONSTERS=${JSON.stringify(data)};
const MORE_RECIPES=${JSON.stringify(recipes)};   // [parent, parent or '@family', child]
const MONSTER_FAMILY=${JSON.stringify(family)};
const FAMILY_NAMES={beast:'獣系',bird:'鳥系',insect:'虫系',plant:'植物系',dragon:'竜系',spirit:'精霊系',reptile:'爬虫系',aquatic:'水系'};
const MONSTER_LORE=${JSON.stringify(lore)};   // id: [生態, 一言]
// Registered before companion-ui.js runs, so they are full species everywhere (dex, breeding, saves).
for(const [id,name,tier] of MORE_MONSTERS)COMPANION_DATA.species[id]={name,img:'assets/monsters/'+id+'.webp',power:[0,3,4,6,8][tier],...(tier===4?{fusionOnly:true}:{})};
for(const [id,fam] of Object.entries(MONSTER_FAMILY))if(COMPANION_DATA.species[id])COMPANION_DATA.species[id].family=fam;
for(const [a,b,child] of MORE_RECIPES)COMPANION_DATA.recipes.push({parents:[a,b],child});
/* Battle enemies, encounter zones, praise likes and field-guide entries (needs ENEMIES/ZONES from the main script). */
function initMoreMonsters(){
 for(const [id,[eco,quote]] of Object.entries(MONSTER_LORE))DEX_INFO[id]={...DEX_INFO[id],eco,quote};
 for(const [id,name,tier,zone,likes,habitat,note,hp,atk] of MORE_MONSTERS){
  DEX_INFO[id]={...DEX_INFO[id],habitat,note};if(tier===4)continue;
  ENEMIES[id]={name,jp:name,companion:id,hp,atk,exp:Math.round(hp*.55),gold:Math.round(hp/3),spr:'wisp',pal:{1:'#9bd573',2:'#fff',E:'#142020'}};
  LIKES[id]={tags:likes,need:tier===1?2:tier===2?3:4,hint:note};
  if(ZONES[zone])ZONES[zone].foes.push(id)}}
`;
fs.writeFileSync(path.join(root,'companion-more.js'),js);
console.log(JSON.stringify({species:data.length,recipes:recipes.length,familyRecipes:recipes.filter(r=>r[1][0]==='@').length,uncovered:all.filter(s=>!covered.has(s.id)).map(s=>s.id),zones:data.reduce((o,d)=>(o[d[3]]=(o[d[3]]||0)+1,o),{})}));
