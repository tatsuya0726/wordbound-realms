// Copies art and learning data from the web version into the Godot project.
// The web game stays the source of truth: run `node godot-src/tools/sync-from-web.cjs` after editing questions or art.
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','..'),out=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const slice=(from,to)=>{const a=html.indexOf(from),b=html.indexOf(to,a);if(a<0||b<0)throw new Error('marker not found: '+from);return html.slice(a,b)};

// Pure data blocks from index.html (no DOM access inside them).
const learning=new Function(slice('const VRAW=','/* ================= SPRITES')+';return {VOCAB,GRAMMAR,LISTEN,CONVO,DICT};')();
const maps=new Function(slice('function grid(','const INNS=')+';return {MAPS,SPAWN};')();
const COMPANION_DATA=new Function(fs.readFileSync(path.join(root,'companion-data.js'),'utf8')+';return COMPANION_DATA;')();

const village=maps.MAPS.village;
// Positions and roles mirror the E('village',…) entries and PORTRAIT_ROLE in world-ui.js.
const npcs=[
 {id:'elder',name:'Orin',jp:'長老オリン',x:13,y:8,art:'travel_guide'},
 {id:'shop',name:'Mia',jp:'道具屋ミア',x:4,y:9,art:'item_shop'},
 {id:'inn',name:'Tom',jp:'宿屋トム',x:18,y:9,art:'inn'},
 {id:'girl',name:'Nina',jp:'ニーナ',x:7,y:6,art:'adventurer_female'},
 {id:'granny',name:'Rose',jp:'ローズ',x:3,y:13,art:'resident'},
 {id:'guard',name:'Bram',jp:'ブラム',x:9,y:13,art:'blacksmith'},
 {id:'scholar',name:'Fen',jp:'フェン',x:17,y:5,art:'breeding_guide'}];

const write=(rel,data)=>{const p=path.join(out,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(data));console.log('wrote',rel)};
write('data/learning.json',{
 vocab:learning.VOCAB.map(([tier,en,ja])=>({tier,en,ja})),
 grammar:learning.GRAMMAR.map(([tier,q,a,tip,ja])=>({tier,q,a,tip,ja})),
 listen:learning.LISTEN.map(([tier,en,ja])=>({tier,en,ja})),
 convo:learning.CONVO,
 spells:COMPANION_DATA.questions,
 dict:learning.DICT});
write('data/world.json',{
 village:{name:'Komorebi Village',jp:'こもれびの村',rows:village.rows,spawn:maps.SPAWN.village,npcs},
 species:COMPANION_DATA.species});

const copy=(dir,filter=()=>true)=>{const src=path.join(root,'assets',dir),dst=path.join(out,'assets',dir);fs.mkdirSync(dst,{recursive:true});
 for(const f of fs.readdirSync(src))if(filter(f)){fs.copyFileSync(path.join(src,f),path.join(dst,f))}console.log('copied assets/'+dir)};
copy('walk',f=>f.endsWith('.png'));
copy('companions',f=>f.endsWith('.webp'));
copy('people',f=>f.endsWith('.webp'));
copy('world',f=>/^(battle-grass|battle-town|surface)\.webp$/.test(f));
