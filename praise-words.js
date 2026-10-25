/* Praise scouting: a wild monster joins only when it is praised in English with words it likes.
   Praise words are collected during the game: the king, the chancellor, the bookstore, island people,
   bosses, arena cups and treasure chests on warp floors. A berry reveals what a monster likes. */
const PRAISE_TAGS={cute:'かわいい',strong:'強い',fast:'速い',smart:'かしこい',beauty:'美しい',brave:'勇ましい',kind:'やさしい'};
// [word, meaning, kind of praise, hearts it gives]
const PRAISE=[
 ['cute','かわいい','cute',1],['sweet','かわいらしい','cute',1],['lovely','愛らしい','cute',1],['adorable','とても愛らしい','cute',2],
 ['strong','強い','strong',1],['tough','たくましい','strong',1],['powerful','力強い','strong',1],['mighty','強大な','strong',2],
 ['fast','速い','fast',1],['quick','すばやい','fast',1],['swift','すばしこい','fast',2],
 ['smart','かしこい','smart',1],['clever','利口な','smart',1],['wise','賢明な','smart',2],['brilliant','すばらしく賢い','smart',2],
 ['pretty','きれいな','beauty',1],['beautiful','美しい','beauty',1],['elegant','優雅な','beauty',2],['gorgeous','華やかな','beauty',2],
 ['brave','勇敢な','brave',1],['cool','かっこいい','brave',1],['bold','大胆な','brave',1],['fearless','恐れを知らない','brave',2],
 ['kind','やさしい','kind',1],['gentle','おだやかな','kind',1],['friendly','人なつっこい','kind',1],['generous','心が広い','kind',2]];
const PRAISE_BY=Object.fromEntries(PRAISE.map(p=>[p[0],p]));
const STARTER_WORDS=['cute','strong','kind'];
/* What each species likes, how many hearts it needs, and the clue shown while scouting. */
const LIKES={
 seedpod_mouse:{tags:['cute','fast'],need:2,hint:'小さな体で、ちょこまか走り回っている。'},
 lotus_root_sproutling:{tags:['kind','cute'],need:2,hint:'葉っぱをゆらして、のんびり日なたぼっこしている。'},
 silk_leaf_caterpillar:{tags:['beauty','kind'],need:2,hint:'絹のような体を、つやつや光らせている。'},
 pinecone_sparrow:{tags:['fast','brave'],need:2,hint:'胸を張って、すばやく羽ばたいている。'},
 sprout_ear_mole:{tags:['smart','strong'],need:3,hint:'大きな耳をぴくぴく。何かを考えているようだ。'},
 lantern_moth:{tags:['beauty','smart'],need:3,hint:'やわらかな光をまとって、ふわふわ舞っている。'},
 thunder_feather_owlet:{tags:['smart','brave'],need:3,hint:'鋭い目で、じっとこちらを見つめている。'}};
const ANGER_LIMIT=3;

function praise(){return S.praise||(S.praise={known:[...STARTER_WORDS],likes:{}})}
function knowsWord(w){return praise().known.includes(w)}
function learnWords(words){const p=praise(),fresh=[...new Set(words)].filter(w=>PRAISE_BY[w]&&!p.known.includes(w));p.known.push(...fresh);return fresh}
function learnLike(id,tag){const p=praise(),l=p.likes[id]||(p.likes[id]=[]);if(!l.includes(tag))l.push(tag)}
function wordChip(w){return `<b class="praise-word">${w}</b> ${PRAISE_BY[w][1]}`}
async function teachWords(words,from){const fresh=learnWords(words);
 if(!fresh.length){if(words.length){S.gold+=30;await sys('知っている言葉ばかりだった。かわりに30ゴールドをもらった。')}return []}
 save();await sys(`<b>褒め言葉を覚えた！</b>${from?`（${from}）`:''}<br>${fresh.map(wordChip).join('　')}`);return fresh}
/* A word the hero does not know yet, preferring easier words (power 1) unless maxPower allows strong ones. */
function randomUnknownWord(maxPower=2){const pool=PRAISE.filter(p=>!knowsWord(p[0])&&p[3]<=maxPower);if(!pool.length)return null;const easy=pool.filter(p=>p[3]===1);return pick(easy.length?easy:pool)[0]}

function masterScout(e){return typeof RoamingMasters!=='undefined'&&RoamingMasters.canScout(e);}
function scoutLikes(e){return LIKES[e?.companion]||(masterScout(e)?RoamingMasters.profile(e):null);}
function canScout(e){const sp=CD.species[e?.companion];return !!e&&!!sp&&!sp.retired&&!!scoutLikes(e)&&!e.angry&&!e.caught&&e.hp>0&&((!sp.fusionOnly&&CR.rarity(sp)<7)||masterScout(e));}
function scoutNeed(e){return scoutLikes(e)?.need||2}
function heartText(e){const n=scoutNeed(e),h=Math.min(n,e.hearts||0);return '♥'.repeat(h)+'♡'.repeat(n-h)}
/* Progress toward joining, as a percentage of the hearts needed. */
function scoutRate(){return B&&canScout(B.E)?Math.round(Math.min(1,(B.E.hearts||0)/scoutNeed(B.E))*100):0}

/* Berry: the monster eats it and lets slip one kind of praise it likes. */
async function feed(){const e=B.E;
 if(!canScout(e)){await sys('この相手には木の実を使えません。木の実は消費しません。');return false}
 if(!S.items.berry)return false;S.items.berry--;e.fed=(e.fed||0)+1;
 const L=scoutLikes(e),known=praise().likes[e.companion]||[],tag=L.tags.find(t=>!known.includes(t))||L.tags[e.fed%L.tags.length];learnLike(e.companion,tag);
 await beat(`<p class="en">You offer a berry.</p><p class="ja">${htmlSafe(e.jp)}はおいしそうに食べている。<br>「${PRAISE_TAGS[tag]}」と褒められるのが好きみたい！</p>`,1800);return true}

/* One praise attempt. Returns 'success' (joined), 'fail' (not yet), 'angry' (gave up on you) or 'cancel'. */
async function scout(){const e=B&&B.E;if(!canScout(e))return 'cancel';
 const L=scoutLikes(e),p=praise(),likes=p.likes[e.companion]||[];e.heard=e.heard||[];
 setLog(`<p class="en">Praise ${htmlSafe(e.jp)}!</p><p class="big">${heartText(e)}</p><p class="sub">${L.hint}${likes.length?`<br>好み：${likes.map(t=>PRAISE_TAGS[t]).join('・')}`:'<br>好みは木の実をあげるとわかる。'}</p>`);
 const w=await ask([...p.known.map(w=>({label:`${w}<small>${PRAISE_BY[w][1]}${e.heard.includes(w)?' ・ 言った':''}</small>`,value:w})),{label:'Back<small>もどる</small>',value:null}],{cancel:null});
 if(!w)return 'cancel';
 const [en,ja,tag,power]=PRAISE_BY[w],line=`You are so ${en}!`;if(opt.auto)speak(line);
 const said=`<p class="en">“${line}”</p>`;
 if(e.heard.includes(w)){await beat(`${said}<p class="ja">${htmlSafe(e.jp)}は「それ、さっきも聞いた」という顔をしている。</p>`,1500,line);return 'fail'}
 e.heard.push(w);
 if(L.tags.includes(tag)){e.hearts=(e.hearts||0)+power;learnLike(e.companion,tag);
  if(e.hearts<L.need){await beat(`${said}<p class="ja">${htmlSafe(e.jp)}はうれしそうだ！ ${heartText(e)}</p>`,1500,line);return 'fail'}
  const id=e.companion;let fresh=false;
  if(!commitCompanionChange(s=>{fresh=masterScout(e)?RoamingMasters.recruit(e,s):CR.recruit(s.companions,id,CD.species)})){await sys('保存できなかったため加入を取り消しました。保存容量を確認してください。');return 'fail'}
  e.caught=true;
  await beat(`${said}<p class="ja">${htmlSafe(e.jp)}はとても喜んでいる！ ${heartText(e)}</p>`,1300,line);
  await sys(`${CD.species[id].name}が仲間になった！`);if(fresh)await openMonsterBook('dex',id);return 'success'}
 e.anger=(e.anger||0)+1;
 if(e.anger>=ANGER_LIMIT){e.angry=1;await beat(`${said}<p class="ja">${htmlSafe(e.jp)}はぷいっとそっぽを向いた。もうスカウトできない。</p>`,1600,line);return 'angry'}
 await beat(`${said}<p class="ja">${htmlSafe(e.jp)}はピンとこないようだ…（あと${ANGER_LIMIT-e.anger}回で怒ってしまう）</p>`,1600,line);return 'fail'}

/* Field menu: the collected words, grouped by kind, and what each discovered monster likes. */
async function praiseBook(){const p=praise();
 const groups=Object.entries(PRAISE_TAGS).map(([t,jp])=>`<p class="sub"><b>${jp}</b>　${PRAISE.filter(w=>w[2]===t).map(w=>knowsWord(w[0])?`${w[0]}<small>(${w[1]})</small>`:'？？？').join(' ・ ')}</p>`).join('');
 const likes=Object.keys(LIKES).filter(id=>S.companions.seen.includes(id)).map(id=>`<p class="sub">${CD.species[id].name}：${(p.likes[id]||[]).map(t=>PRAISE_TAGS[t]).join('・')||'？'}</p>`).join('');
 setLog(`<p class="en">Praise Words <span class="sub">褒め言葉 ${p.known.length}/${PRAISE.length}</span></p>${groups}<p class="progress-note">モンスターの好み</p>${likes||'<p class="sub">まだモンスターに出会っていない。</p>'}`);await next()}

/* ---------------- bookstore ---------------- */
const BOOKS=[
 {id:'b1',name:'はじめての褒め言葉',p:40,words:['fast','pretty','smart'],need:()=>true},
 {id:'b2',name:'どうぶつと仲よくなる本',p:70,words:['sweet','gentle','quick'],need:()=>true},
 {id:'b3',name:'勇者のことば',p:120,words:['cool','tough','clever'],need:()=>islandLevel()>=2,needText:'島レベル2'},
 {id:'b4',name:'光と花のことば',p:180,words:['beautiful','lovely','friendly'],need:()=>!!F().clear1,needText:'草原の主を倒す'},
 {id:'b5',name:'上級褒め言葉 I',p:280,words:['adorable','mighty','swift','bold'],need:()=>!!F().clear2,needText:'空の王を倒す'},
 {id:'b6',name:'上級褒め言葉 II',p:380,words:['wise','elegant','generous','powerful'],need:()=>!!F().clear3,needText:'水晶の番人を倒す'},
 {id:'b7',name:'伝説の褒め言葉',p:520,words:['brilliant','gorgeous','fearless'],need:()=>islandLevel()>=5||!!F().won,needText:'島レベル5 または ルミナ大陸クリア'}];
async function bookShop(){const who='Bookseller Rin';
 const ok=await quiz(qConvo(pick(CONVO.filter(c=>c.tag==='shop')),who));const disc=ok?.8:1;
 await say(who,ok?"Such polite English! Twenty percent off for you.":"Welcome. Books teach you new words.",ok?"丁寧な英語ね！2割引きにするわ。":"いらっしゃい。本を読めば新しい言葉が覚えられるわ。");
 while(true){
  setLog(`<div class="who">${who}</div><p class="en">${wordify("Which book would you like?")}</p><p class="sub">所持金 ${S.gold}G ・ 褒め言葉 ${praise().known.length}/${PRAISE.length}</p>`,"Which book would you like?");
  const b=await ask([...BOOKS.map(b=>{const read=b.words.every(knowsWord),price=Math.ceil(b.p*disc);
   return {label:`${b.name}${read?' ◆':''}<small>${!b.need()?'入荷待ち：'+b.needText:read?'読了':b.words.join(', ')+' ・ '+price+'G'}</small>`,value:b,disabled:read||!b.need()}}),{label:'Leave<small>店を出る</small>',value:null}],{cancel:null});
  if(!b)break;const price=Math.ceil(b.p*disc);
  if(S.gold<price){await say(who,"Sorry, you don't have enough money.","ごめんなさい、お金が足りないみたい。");continue}
  S.gold-=price;await say(who,"Here you are. Enjoy reading!","はい、どうぞ。読書を楽しんでね！");await teachWords(b.words,b.name)}
 await say(who,"Come again. Words are waiting for you!","またどうぞ。新しい言葉が待っているわ！")}
