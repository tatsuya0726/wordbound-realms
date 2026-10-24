/* Furigana: when the 「ふりがな」 setting is on, kanji in conversations, choices and the status bar get readings (<ruby>).
   Readings come from the kuromoji morphological analyser, loaded from the CDN only the first time the setting is switched on. */
const RUBY={tok:null,loading:null},RUBY_KANJI=/[一-鿿々]/,RUBY_TARGETS=['log','opts','hud','supportToast'];
function loadRuby(){if(RUBY.tok)return Promise.resolve(RUBY.tok);if(RUBY.loading)return RUBY.loading;
 RUBY.loading=new Promise((res,rej)=>{const fail=e=>{RUBY.loading=null;rej(e)};const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js';
  s.onload=()=>kuromoji.builder({dicPath:'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/'}).build((err,t)=>{if(err)return fail(err);RUBY.tok=t;res(t);rubyAll()});s.onerror=()=>fail(Error('kuromoji'));document.head.append(s)});
 return RUBY.loading}
const rubyEsc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),rubyHira=s=>s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
/* One token: the reading goes over the kanji part only; kana before and after (okurigana) stay outside the ruby. */
function rubyToken(surface,reading){if(!RUBY_KANJI.test(surface)||!reading||reading==='*')return rubyEsc(surface);
 let s=surface,r=rubyHira(reading),head='',tail='';
 while(s.length>1&&r.length&&!RUBY_KANJI.test(s.at(-1))&&rubyHira(s.at(-1))===r.at(-1)){tail=s.at(-1)+tail;s=s.slice(0,-1);r=r.slice(0,-1)}
 while(s.length>1&&r.length&&!RUBY_KANJI.test(s[0])&&rubyHira(s[0])===r[0]){head+=s[0];s=s.slice(1);r=r.slice(1)}
 return rubyEsc(head)+`<ruby>${rubyEsc(s)}<rt>${r}</rt></ruby>`+rubyEsc(tail)}
function rubyText(text){return RUBY.tok.tokenize(text).map(t=>rubyToken(t.surface_form,t.reading)).join('')}
function rubyNode(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),list=[];
 while(w.nextNode()){const n=w.currentNode;if(RUBY_KANJI.test(n.nodeValue)&&!n.parentElement.closest('ruby,.rb'))list.push(n)}
 for(const n of list){const span=document.createElement('span');span.className='rb';span.innerHTML=rubyText(n.nodeValue);n.replaceWith(span)}}
function rubyAll(){if(typeof opt==='undefined'||!opt.ruby||!RUBY.tok)return;for(const id of RUBY_TARGETS)rubyNode(document.getElementById(id))}
/* Turning the setting off puts the plain text back. */
function unrubyAll(){for(const id of RUBY_TARGETS)document.getElementById(id)?.querySelectorAll('.rb').forEach(sp=>{sp.querySelectorAll('rt').forEach(rt=>rt.remove());sp.replaceWith(sp.textContent)})}
new MutationObserver(rubyAll).observe(document.body,{childList:true,subtree:true});
async function toggleRuby(){opt.ruby=!opt.ruby;
 if(!opt.ruby){unrubyAll();return}
 setLog('<p class="tipline">ふりがな用の辞書を読み込んでいます…</p>');
 try{await loadRuby()}catch(e){opt.ruby=false;await sys('ふりがなの辞書を読み込めませんでした。インターネットにつながっているか確認してください。')}}
function initRuby(){if(opt.ruby)loadRuby().catch(()=>{opt.ruby=false})}
