/* Stronger roster (2026-10-26).
   - 16 small, weak-looking species are retired (owned individuals stay usable; they leave the wild and breeding).
   - 20 strong-looking species join (art assets/monsters/<id>.webp from Drive ゲーム用モンスター素材/通常画像).
   - 魔王系 (family 'demon'): 7 existing rulers plus 6 new demon lords. ★10, never scoutable, bred only from ★10
     parents, and they reign as bosses deep in the later warp worlds once those worlds are cleared.
   - Every active species keeps at least one breeding recipe after the changes.
   Loaded after roster-policy.js; data changes apply at load, battle/encounter wiring in initStrongRoster(). */
const WEAK_RETIRED=['candle_wax_slug','dewdrop_snail','crescent_shelled_snail','honeydrop_grub','berry_shell_pillbug','puddle_jelly_blob','teacup_hermit','ribbon_tailed_tadpole','raindrop_duckling','pebble_back_shrew','bubble_cheek_gecko','okra_tail_quokka','thimble_eared_chinchilla','button_mushroom_beetle','cottonseed_puff_moth','pea_pod_goby'];
// [id, name, rarity, family, wild zone (null = breeding only), liked praise, ecology, one-liner]
const STRONG_SPECIES=[
 ['russet_emerald_longleg_saberfang_manedwolf','ガルファング',1,'beast','meadow',['brave','fast'],'長い脚で草原を駆け、サーベルのような牙で獲物を逃さない狼。群れでは若い者ほど先頭を走りたがる。','遠吠えが三回聞こえたら、群れが集まる合図。'],
 ['ivory_ruby_hornback_sixleg_boar','ゴルボア',1,'beast','forest',['strong','brave'],'背中に角をはやした六本脚の猪。突進すると倒木ごと道を切り開く。','鼻先のルビーは、怒ると赤く燃える。'],
 ['sapphire_asymmetric_jaw_stag_beetle','ブレードスタッグ',1,'insect','forest',['strong','brave'],'左右で形の違う大あごを剣のように振るうクワガタ。森の木の上で縄張り争いをくり返す。','片方のあごは、勝った数だけ伸びるという。'],
 ['navy_ivory_glidefold_gecko_dragon','グライドラ',1,'dragon','w1',['fast','smart'],'脇腹の膜を広げて崖から崖へ滑空する竜ヤモリ。夜の谷に青い影を落として飛ぶ。','着地だけは、まだちょっと下手。'],
 ['silver_beard_lammergeier','ボーンブレイカー',1,'bird','cave',['brave','strong'],'骨を高い崖から落として割り、中身を食べる銀ひげの大鷲。洞窟の入口の岩場に巣を作る。','割れない骨はない、と胸を張る。'],
 ['ochre_cobalt_fanfrill_chameleon_dragon','フリルドレイク',1,'dragon','forest',['beauty','smart'],'扇のようなえりを広げ、体の色を変えて仲間と話すカメレオンの竜。森の花畑にまぎれて暮らす。','えりの色が金色のときは、ご機嫌のしるし。'],
 ['slate_ochre_cloudpattern_crescenttail_cloudedleopard','セイバーパンサー',4,'beast','w2',['fast','brave'],'雲の模様をまとった剣歯の豹。三日月のしっぽで体のバランスをとり、断崖を音もなく駆け下りる。','気配を消すのは得意だが、昼寝の寝言は大きい。'],
 ['saffron_sail_drake','サフランドレイク',4,'dragon','desert',['strong','brave'],'背中の帆で砂漠の熱を集め、夜の寒さをしのぐ竜。帆の色で年齢がわかる。','帆が夕日色になったら、一人前。'],
 ['copper_coral_sailcrest_pterosaur_wyvern','プテラヴェルン',4,'dragon','sky',['fast','brave'],'サンゴ色のとさかで風を読む翼竜。空中庭園の上昇気流に乗って一日中飛び続ける。','地上を歩くのは、少し苦手。'],
 ['jade_cobalt_hindwing_twinhorn_gliding_dragon','ジェイドグライダー',4,'dragon','sky',['beauty','fast'],'後ろ脚にも翼を持つ双角の竜。四枚の翼で雲の間をすべるように飛ぶ。','翼をたたむと、意外と小さい。'],
 ['violet_emerald_twincrest_tridenttail_dilophodrake','トライデントドレイク',4,'dragon','ruins',['brave','smart'],'三つ又のしっぽと双つのとさかを持つ竜。遺跡の柱の間を縄張りにしている。','しっぽの三つ又で、器用に果物を刺して食べる。'],
 ['silver_teal_ambereye_scythetail_thresher_shark','サイスシャーク',4,'aquatic','w2',['fast','strong'],'鎌のように長い尾で魚の群れを打ちすえる鮫。琥珀色の目は暗い海でも光る。','尾をひと振りすると、波が二つに割れる。'],
 ['obsidian_rose_violinshield_glasswing_mantis','グラスマンティス',4,'insect','ruins',['beauty','brave'],'ガラスの翅とバイオリン形の盾を持つカマキリ。月夜の遺跡で舞うように狩りをする。','翅の音は、弦楽器のように響く。'],
 ['slate_ivory_doublecrest_oxbloodwing_harpyeagle','ブラッドハーピー',4,'bird','sky',['brave','strong'],'血の色の翼と二重のとさかを持つ大鷲。空中庭園の王者として恐れられる。','雲の上から、ねずみ一匹見逃さない。'],
 ['violet_ivory_fanantenna_splitwing_longhornbeetle','ヴァイオホーン',4,'insect','underground',['strong','beauty'],'扇の触角と割れた翅を持つカミキリムシ。水晶の柱をかじって巣穴を作る。','触角の扇は、仲間への合図に使う。'],
 ['rust_jade_twinhorn_shortarm_speartail_tyrantdragon','ティラノヴァルク',7,'dragon',null,['strong','brave'],'双角と槍のしっぽを持つ暴君竜。短い腕を補うように、顎と尾で何でも砕く。','吠え声は、山三つ向こうまで届く。'],
 ['plum_ivory_scytheclaw_feathered_therizodragon','サイスクロウ',7,'dragon',null,['smart','strong'],'鎌のような長い爪を持つ羽毛の竜。普段は木の葉を食べる穏やかな性格だが、怒ると嵐のように爪を振るう。','爪の手入れに、毎朝一時間かける。'],
 ['umber_sapphire_saberjaw_twinwing_fourleg_gorgonodragon','ゴルゴドラグーン',7,'dragon',null,['brave','strong'],'剣のような顎と二枚の翼を持つ四脚の竜。古代の戦場に現れ、竜の群れを率いたと伝えられる。','牙の数は、倒した敵の数と同じらしい。'],
 ['teal_coral_trihorn_frillwing_triceradragon','トリケラドラグ',7,'dragon',null,['strong','kind'],'三本の角とえりの翼を持つ竜。えりを広げて突進すると、城門さえ打ち破る。','角を磨いてもらうのが大好き。'],
 ['violet_mane_snow_leopard_regent','スノウレガリア',7,'beast',null,['beauty','brave'],'紫のたてがみを持つ雪豹の王。吹雪の山頂から白い世界を見守る。','足跡は、雪の上でも残らない。']];
// New demon lords: [id, name, ecology, one-liner]
const NEW_DEMON_LORDS=[
 ['ash_violet_stackeye_twinhorn_rhino_demonlord','角魔王ライノクス','重なる眼と双角を持つ犀の魔王。黄金の盾と鎌で、魔界の門を何千年も守ってきた。','その角が揺れるとき、大地も揺れる。'],
 ['navy_ivory_chesttrieye_palmantler_moose_demonlord','森魔王ムースガルド','胸に三つの眼を宿す大鹿の魔王。宝杖で森の命を操り、迷い込んだ者を永遠の森に閉じこめる。','杖の宝石には、閉じこめた森が映っている。'],
 ['plum_ivory_hammermuzzle_twowing_bat_demonlord','夜魔王ノクトヴァン','槌のような鼻と深紅の翼を持つ蝙蝠の魔王。月のない夜にだけ、空の色を塗り替える。','朝日だけは、どうしても苦手。'],
 ['slate_crimson_sixeye_fourtusk_hippo_demonlord','牙魔王ガルドン','六つの眼と四本の牙を持つ河馬の魔王。戦斧と盾を構え、魔界の大河を一歩も通さない。','怒ると、川の水が沸き立つ。'],
 ['obsidian_scarlet_throatsac_twowing_marabou_demonlord','冥鳥王マラヴォス','黒い翼と深紅の喉袋を持つハゲコウの魔王。のこぎりの剣で、魂の糸を断ち切るという。','鳴き声を聞いた者は、三日眠れない。'],
 ['charcoal_ivory_forearmeye_fourarm_badger_demonlord','四腕魔王バジャルグ','四本の腕の手首に眼を持つアナグマの魔王。地の底に巨大な迷宮を掘り、その最奥で眠る。','四本の腕で、同時に四つの扉を閉める。']];
// Existing rulers that join 魔王系.
const DEMON_CONVERTS=['obsidian_ivory_threeface_fourarm_spadetail_demonlord','jade_violet_fiveeye_mouthless_serpent_demonking','amethyst_ivory_chesteye_frillgill_salamander_demonking','obsidian_ivory_headless_chestface_demonking','indigo_ivory_trunkeye_fourtusk_mammoth_demonlord','charcoal_crown_warg_archfiend','thorn_throne_tree_demon'];
const DEMON_LORDS=[...DEMON_CONVERTS,...NEW_DEMON_LORDS.map(d=>d[0])];
/* Post-clear bosses: the demon lord who reigns at the deepest floor of each later warp world. */
const DEMON_BOSSES=[{world:1,id:'obsidian_scarlet_throatsac_twowing_marabou_demonlord',hp:620,atk:38,backdrop:'astral_void_terrace'},
 {world:2,id:'charcoal_ivory_forearmeye_fourarm_badger_demonlord',hp:720,atk:42,backdrop:'ancient_sealed_sarcophagus_crypt'},
 {world:4,id:'obsidian_ivory_threeface_fourarm_spadetail_demonlord',hp:900,atk:48,backdrop:'abyssal_trench_hydrothermal_rift'}];

(function applyStrongRoster(){
 const SP=COMPANION_DATA.species,power=r=>r>=10?8:r>=7?6:r>=4?4:3;
 if(typeof FAMILY_NAMES!=='undefined')FAMILY_NAMES.demon='魔王系';
 for(const id of WEAK_RETIRED)if(SP[id])SP[id].retired=true;
 // Native skills: borrow the set of a same-family species of the nearest rarity.
 const borrow=(id,family,rarity)=>{if(typeof SPECIES_SKILLS==='undefined'||SPECIES_SKILLS[id])return;
  const pool=Object.keys(SP).filter(k=>k!==id&&SPECIES_SKILLS[k]&&SP[k].family===family).sort((a,b)=>Math.abs((SP[a].rarity||1)-rarity)-Math.abs((SP[b].rarity||1)-rarity));if(pool[0])SPECIES_SKILLS[id]=[...SPECIES_SKILLS[pool[0]]]};
 for(const [id,name,rarity,family] of STRONG_SPECIES){SP[id]={name,img:'assets/monsters/'+id+'.webp',power:power(rarity),rarity,family,...(rarity>=7?{fusionOnly:true}:{})};borrow(id,family,rarity)}
 for(const id of DEMON_CONVERTS)if(SP[id])Object.assign(SP[id],{family:'demon',rarity:10,fusionOnly:true,power:Math.max(SP[id].power||8,8)});
 for(const [id,name] of NEW_DEMON_LORDS){SP[id]={name,img:'assets/monsters/'+id+'.webp',power:8,rarity:10,family:'demon',fusionOnly:true};if(typeof SPECIES_SKILLS!=='undefined'&&!SPECIES_SKILLS[id]){const t=DEMON_CONVERTS.find(k=>SPECIES_SKILLS[k]);if(t)SPECIES_SKILLS[id]=[...SPECIES_SKILLS[t]]}}
 // Reptiles join the dragons and every family is spread smoothly over ★1..★10 (rarity-curve.js).
 if(typeof applyRarityCurve==='function')globalThis.RARITY_MISSING=applyRarityCurve(SP);
 // Recipes: drop any that use a retired species, then rebuild the demon lords' recipes as hard ones.
 const R=COMPANION_DATA.recipes,active=id=>SP[id]&&!SP[id].retired,isDemon=id=>SP[id]?.family==='demon';
 const before={};for(const x of R)before[x.child]=(before[x.child]||0)+1;
 const keep=R.filter(r=>active(r.child)&&r.parents.every(p=>p[0]==='@'||active(p))&&!isDemon(r.child));R.length=0;R.push(...keep);
 const used=new Set(R.map(r=>[...r.parents].sort().join('|'))),add=(a,b,child)=>{const k=[a,b].sort().join('|');if(a===b||used.has(k))return false;used.add(k);R.push({parents:[a,b],child});return true};
 const h=s=>{let x=2166136261;for(const c of s)x=Math.imul(x^c.charCodeAt(0),16777619);return x>>>0};
 const ids=Object.keys(SP).filter(active),rar=id=>SP[id].rarity||1;
 const legends=ids.filter(id=>rar(id)>=10&&!isDemon(id));
 DEMON_LORDS.forEach((d,i)=>{const k=h(d);
  for(let t=0;t<legends.length*legends.length;t++)if(add(legends[(k+t)%legends.length],legends[(k+t*7+3)%legends.length],d))break;          // two ★10 legends
  const other=DEMON_LORDS.filter(x=>x!==d),fam=['dragon','undead','spirit','beast'][i%4];
  for(let t=0;t<other.length;t++)if(add(other[(k+t)%other.length],'@'+fam,d))break});                                                          // another demon lord + a family
 // New strong species, and species that lost recipes to retirement (they keep up to two ways):
 // parents one to three ranks below (★1 from two ★1s).
 const below=id=>ids.filter(x=>x!==id&&!isDemon(x)&&rar(x)>=Math.max(1,rar(id)-3)&&rar(x)<=Math.max(1,rar(id)-1));
 for(const id of [...STRONG_SPECIES.map(s=>s[0]),...ids.filter(x=>R.filter(r=>r.child===x).length<Math.min(2,before[x]||1))]){if(R.filter(r=>r.child===id).length>=Math.min(2,before[id]||1)&&!STRONG_SPECIES.some(s=>s[0]===id))continue;
  const low=below(id),same=low.filter(x=>SP[x].family===SP[id].family),pa=same.length?same:low,k=h(id);
  for(let t=0;t<pa.length*low.length;t++)if(add(pa[(k+t)%pa.length],low[(k+t*5+1)%low.length],id))break}
 // A parent never outranks its child: swap it for a species of the same family at or just below the child's rank.
 for(const r of R)for(let j=0;j<2;j++){const p=r.parents[j],other=r.parents[1-j];if(p[0]==='@'||rar(p)<=rar(r.child))continue;
  const pool=ids.filter(x=>x!==r.child&&x!==other&&!isDemon(x)&&rar(x)<=rar(r.child)).sort((a,b)=>(SP[b].family===SP[p].family)-(SP[a].family===SP[p].family)||rar(b)-rar(a)||h(a+r.child)-h(b+r.child));
  const x=pool.find(x=>!used.has([x,other].sort().join('|')));if(!x)continue;used.delete([p,other].sort().join('|'));used.add([x,other].sort().join('|'));r.parents[j]=x}
})();

/* Battle and world wiring (after ENEMIES, ZONES, LIKES, DEX_INFO and maps exist). */
function initStrongRoster(){
 const SP=COMPANION_DATA.species;
 for(const z of Object.values(ZONES))z.foes=z.foes.filter(k=>!SP[ENEMIES[k]?.companion]?.retired&&SP[ENEMIES[k]?.companion]?.family!=='demon');
 for(const id of DEMON_LORDS)delete LIKES[id];
 for(const [id,name,rarity,family,zone,likes,eco,quote] of STRONG_SPECIES){
  DEX_INFO[id]={...DEX_INFO[id],habitat:zone?({meadow:'はじまりの草原',forest:'森',w1:'ルミナの草原',cave:'ささやきの洞窟',sky:'空中庭園',underground:'地底水晶庭',desert:'砂漠',ruins:'遺跡',w2:'東の地方'}[zone]||zone):'配合でのみ生まれる',note:eco,eco,quote};
  if(!zone)continue;const hp=[0,22,0,0,40][rarity]||30,atk=[0,7,0,0,13][rarity]||10;
  ENEMIES[id]={name,jp:name,companion:id,hp,atk,exp:Math.round(hp*.55),gold:Math.round(hp/3),spr:'wisp',pal:{1:'#9bd573',2:'#fff',E:'#142020'}};
  LIKES[id]={tags:likes,need:rarity>=4?3:2,hint:eco};if(ZONES[zone])ZONES[zone].foes.push(id,id)}
 for(const [id,name,eco,quote] of NEW_DEMON_LORDS)DEX_INFO[id]={...DEX_INFO[id],habitat:'配合限定（★10どうし）',note:eco,eco,quote};
 for(const id of DEMON_CONVERTS)if(DEX_INFO[id])DEX_INFO[id].habitat='配合限定（★10どうし）';
 // Demon lords reign at the deepest floor of later worlds once that world's boss has fallen.
 for(const b of DEMON_BOSSES){const w=WARPS[b.world],key='demon_'+b.id,s=SP[b.id];
  ENEMIES[key]={name:s.name,jp:s.name,hp:b.hp,atk:b.atk,exp:Math.round(b.hp*.6),gold:Math.round(b.hp*.8),spr:'golem',pal:{1:'#5a3a6a',A:'#ffd27a'},boss:1,tier:3,skill:'魔王の一撃',worldArt:b.id};
  if(typeof BOSS_BACKDROP!=='undefined')BOSS_BACKDROP[key]=b.backdrop;
  const spot=(MAPS[w.map].ents.find(e=>e.boss&&e.boss!==key)||{x:14,y:3});
  E(w.map,{x:spot.x,y:spot.y,boss:key,cond:()=>!!F()[w.clear]&&!F()[key],talk:()=>demonLordBattle(b)})}}
async function demonLordBattle(b){const s=COMPANION_DATA.species[b.id],key='demon_'+b.id;
 await say(s.name,"So, a Monster Master dares to enter my domain. Show me the power of your words!",'ほう、モンスターマスターが我が領域に踏み込むか。そなたの言葉の力、見せてみよ！');
 if(!await yesno(s.name,'Will you fight?',s.name+'に挑む？（とても強い）','挑む','まだやめておく'))return;
 const r=await battle(key);
 if(r==='win'){F()[key]=1;S.gold+=1500;S.items.churu=(S.items.churu||0)+5;save();
  await sys(`<b>◆ ${s.name}を打ち倒した！</b> 1500ゴールドとチュール×5。<br>その力は、★10どうしの配合でのみ受け継がれるという…`)}
 else if(r==='lose')await gameOver()}
