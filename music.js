/* Background music (2026-10-26).
   MUSIC_TRACKS is the one list of songs: add a track here (file in assets/bgm/, title, composer, credit link) and
   point maps at it in MAP_MUSIC — the settings 「クレジット」 page is built from the same list, so every song is credited.
   One looping <audio> element follows the current map: it fades between tracks, is silent in battle for now,
   ducks while English is read aloud, and pauses when the page is hidden. Browsers only allow sound after the
   first tap or key press, so playback starts then. Volume: settings 「BGM」 (opt.bgm 0 off / 1 small / 2 normal). */
const MUSIC_TRACKS={
 forgive:{file:'assets/bgm/forgive.mp3',title:'Forgive',composer:'RYU ITO',site:'https://ryu110.com/',use:'ことのは島・街'}};
// Map id → track id. Town interiors (i_*) share the town's song.
const MAP_MUSIC={island:'forgive',village:'forgive',port:'forgive'};
// Other assets that ask for (or deserve) a credit line.
const OTHER_CREDITS=[{what:'効果音・アイコン',who:'Kenney',site:'https://www.kenney.nl/',note:'CC0'}];
const BGM_LEVELS=[0,.22,.42];
const Music=(()=>{let el=null,current=null,unlocked=false,level=0;
 const wanted=()=>{if(typeof S==='undefined'||!S||typeof mode==='undefined'||mode==='title'||mode==='battle')return null;
  return MAP_MUSIC[S.map]||(String(S.map).startsWith('i_')?MAP_MUSIC.island:null)||null};
 const target=()=>{const v=BGM_LEVELS[typeof opt!=='undefined'?opt.bgm??1:1]||0;const talking=typeof speechSynthesis!=='undefined'&&speechSynthesis.speaking;return document.hidden?0:v*(talking?.35:1)};
 function tick(){if(!unlocked)return;const want=wanted();
  if(want!==current){   // fade out the old song, then switch
   if(el&&level>.01){level=Math.max(0,level-.04);el.volume=level;return}
   current=want;if(!want){el?.pause();return}
   if(!el){el=new Audio();el.loop=true;el.preload='auto'}
   el.src=MUSIC_TRACKS[want].file;level=0;el.volume=0;el.play()?.catch?.(()=>{});return}
  if(!el||!current)return;const t=target();
  if(t===0&&level<.01){if(!el.paused)el.pause();return}
  if(el.paused)el.play()?.catch?.(()=>{});
  level+=Math.max(-.03,Math.min(.03,t-level));el.volume=Math.max(0,Math.min(1,level))}
 function unlock(){if(unlocked)return;unlocked=true;tick()}
 if(typeof window!=='undefined'){for(const ev of ['pointerdown','keydown','touchstart'])window.addEventListener(ev,unlock,{passive:true});setInterval(tick,100)}
 return {tick,unlock,get playing(){return current&&el&&!el.paused?current:null}};
})();
function bgmLabel(){return ['OFF','小さめ','標準'][typeof opt!=='undefined'?opt.bgm??1:1]}
/* Settings → クレジット: every song in MUSIC_TRACKS, then other credited assets. */
async function showCredits(){
 const songs=Object.values(MUSIC_TRACKS).map(t=>`<li><b>曲名「${htmlSafe(t.title)}」</b><br>作曲 ${htmlSafe(t.composer)}<br><a href="${t.site}" target="_blank" rel="noopener">${htmlSafe(t.site)}</a><small>（${htmlSafe(t.use)}）</small></li>`).join('');
 const others=OTHER_CREDITS.map(c=>`<li><b>${htmlSafe(c.what)}</b> ${htmlSafe(c.who)} <a href="${c.site}" target="_blank" rel="noopener">${htmlSafe(c.site)}</a> <small>${htmlSafe(c.note||'')}</small></li>`).join('');
 setLog(`<div class="credits"><p class="en">Credits クレジット</p><h3>音楽</h3><ul>${songs}</ul><h3>素材</h3><ul>${others}</ul></div>`);await next()}
