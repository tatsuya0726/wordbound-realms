/* Rarity curve (2026-10-26).
   - 爬虫類系 (reptile) is merged into ドラゴン系 (dragon); ten small, weak-looking reptiles retire so the
     dragon family stays about the size of the others.
   - Every family is ranked from weakest-looking to strongest-looking art and spread evenly over ★1..★10,
     so each family climbs smoothly to ★10 and a lower ★ never looks stronger than a higher one in its family.
   - 魔王系 stays ★10. Power follows the new rarity; ★7 and above stay breeding-only (rarity-policy rule).
   Called from strong-roster.js once the strong species exist and before any recipe is rebuilt. */
const REPTILE_RETIRED=['lily_pad_frog','marble_eyed_newt','copper_shell_toad','mossy_stone_axolotl','quartz_backed_salamander','amethyst_trumpet_chameleon','cork_bud_caiman','vine_spined_iguana','cobalt_horn_goat_chimera','violet_glassfrill_gecko_dragon'];
// Weakest-looking first, strongest-looking last (by species name).
const RARITY_ORDER={
 dragon:['ミカントカゲ','グライドラ','フリルドレイク','サフランドレイク','プテラヴェルン','ジェイドグライダー','トライデントドレイク','コクヨウガメ','ジェイガル','ハネクチワーム',
  'ツノワイバーン','ハンマードラゴン','ホカケドラゴン','サンゴヨロイドラ','ヘキサウル','シャベルバジリスク','サラヴェント','コガネアラシキリン','鳴竜ブラスカ','地掘竜ドグラム',
  'コクヨウワドラ','イカリドラゴン','バザルガ','鎧竜ガルドン','クレナイキメラ','サイスクロウ','トリケラドラグ','シモハンマー','ゴルゴドラグーン','ティラノヴァルク',
  '冠蛇ヴァスラ','双竜ヴァイン','天蛇セラフィス','ホバシラガビアル','三頭ギドラム','荊環ウロヴェル','迷宮王ラビュロス'],
 beast:['タネチュー','クロロット','ドングリス','モグリーフ','ソバカピバラ','ツユジカ','アンズパカ','コケセンザン','モミジレッサー','ラシンギツネ',
  'ジシャクアルマ','ルナレッタ','ネッコイノシシ','ルーンセンザン','オウギアリクイ','ナガユビアイアイ','ガルファング','ゴルボア','キノコヨロイグマ','コオリオヒョウ',
  'アイガミオカピ','セイバーパンサー','ルリヨロイオカピ','ユメクイバク','スイショウバイソン','ハリモグラタイタン','スノウレガリア','灯麒アンバル','夜羚ユーヴァ','モリゼル',
  'コハクサイガオウ','妖狐ミツカゲ','ザクロマンドリル','銀羽のセクティス'],
 bird:['ピヨコーン','アシバネヒワ','ヒウチガラス','ジオードパフィン','スズドリ','イシバネツバメ','ホロホロカブト','ツメバネドリ','オウギライチョウ','ギンガマグチ',
  'アマスズサギ','イカヅチヅル','タネカンムリポポ','ツキヨフクロウ','エトピリカン','ショキカンドリ','ギンバシビロ','ヨロイトキ','ボーンブレイカー','バラトサカオウム',
  'オオハシルビー','ブラッドハーピー','アカヒクイドリ','ライホル','バラハナヒョウ','ザクロコンドル','アラシクジャク','ホムラコカトリス','ヨロイコトドリ','ニッショクロック',
  '夜翼ノクティス','火山のグリフォン','ヒスイヅルオウ'],
 insect:['シルミィ','カミコウモリ','シモバナガ','スミコガネ','トモス','コハクボタル','タマリンコオロギ','キリガラストンボ','アカリボタル','ユウグレコウモリ',
  'ハナナガゾウ','カカオカマキリ','アメルバ','ラッパゼミ','ヒスイグンバイ','バラカマキリ','ブレードスタッグ','ゲンブコウモリ','ヤイバアメンボ','ベニハネガ',
  'ムチサソリン','コケハグルマムシ','ヴァイオホーン','トゲランカマキリ','コハククワガタ','グラスマンティス','オウギシリアゲ','タテアゴアリジゴク','モルガント','ロズオルゴ',
  'スナドケイテイ','雷牙ドンラウド','コバルトベヒーモス'],
 aquatic:['カルイシフグ','シダタツノコ','アシカゴハゼ','ローゼリア','コンブカワウソ','フウリンクラゲ','サンゴイカ','イシエイ','トモシビガニ','ソルモーラ',
  'フクロペリカン','アウレリア','クロノシェル','オオダンゴシ','ヤリカワセミ','パールヘラチョウ','ジキリボンイカ','チョウチンアンコ','アーチオオカミウオ','スミグモイカ',
  'クリオネビ','ウチワエビロン','サンゴオウムガイ','ルリカンムリウマ','ヴェルダコ','ホシクラゲ','ホムラゴイ','サイスシャーク','リーフシードラ','ヒョウガマンタ',
  'カンムリミノカサゴ','鋼顎ダンクレア','紅拳ルビゼン','ギンサンゴシーラ','ヨルリュウグウ','シンエンレヴィアタン'],
 plant:['タンポトビ','ハスプル','ネムリマンドラ','ハスバク','ヒスイサボテ','イガグリアシ','ヒイラギアシ','トルコランソウ','サンゴラフレシア','ウツボドラゴン',
  'ザクロヒドラ','根王カカロス','コガネハスネオウ','竹神チクセン'],
 spirit:['ミズガネプル','ツミイシゴーレム','ウズガラス','フウリンメ','夜絹のソレイユ','ゼンマイゴーレム','カメンユメジュウ','夢獣ミラルナ','カガミスフィンクス','ルリガーゴイル',
  '月鏡トリム','朱窯ガラド','リュウセイオウ','ヨツウデノミコ','コクヨウジカノミコ','ナナメノヨゲンシャ','城塞ルークス','オパールセラフ','鏡判ヴァルディス','黒晶アズラント'],
 undead:['コツリ','ネムロ','マミル','ルミィ','カサネ','ツキミゴースト','ポロック','カボロン','ヨイマル','グレイヴァー',
  'ベルゴー','フリジット','モルグ','グラモス','ラグス','アシュロウ','ノクティル','コフィラム','ドンガル','ドレッガー',
  'シグモ','オスガル','レクシオン','デュラゼル','ガルベロス','ネフェルカ','ヴェスパル','モルダント','ゼルヴァーン','アストレギア',
  'ヴァルドレイク','冥王グレイヴァル']};
const RARITY_POWER=[3,3,4,4,5,5,6,7,7,8];
/* Applies the merge and the curve. Returns names that matched no active species (should be empty). */
function applyRarityCurve(SP){
 for(const id of REPTILE_RETIRED)if(SP[id])SP[id].retired=true;
 for(const s of Object.values(SP))if(s.family==='reptile')s.family='dragon';
 for(const r of COMPANION_DATA.recipes)r.parents=r.parents.map(p=>p==='@reptile'?'@dragon':p);
 if(typeof FAMILY_NAMES!=='undefined')delete FAMILY_NAMES.reptile;
 const byName={},missing=[];for(const [id,s] of Object.entries(SP))if(!s.retired)byName[s.name]=id;
 for(const [family,names] of Object.entries(RARITY_ORDER))names.forEach((name,i)=>{const id=byName[name];if(!id||SP[id].family!==family){missing.push(name);return}
  const s=SP[id],rarity=1+Math.floor(i*10/names.length);s.rarity=rarity;s.power=rarity===1?Math.min(s.power||3,3):RARITY_POWER[rarity-1];
  if(rarity>=7)s.fusionOnly=true;else delete s.fusionOnly});
 return missing}
