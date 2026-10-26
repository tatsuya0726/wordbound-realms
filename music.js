/* Background music (2026-10-26).
   MUSIC_TRACKS is the one list of songs: add a track here (file in assets/bgm/, title, composer, credit link) and
   point maps at it in MAP_MUSIC — the settings 「クレジット」 page is built from the same list, so every song is credited.
   One looping <audio> element follows the current map: it fades between tracks, is silent in battle for now,
   ducks while English is read aloud, and pauses when the page is hidden. Volume: settings 「BGM」 (opt.bgm 0/1/2).
   Phones: play() is only ever started inside a tap or key press (or after one has unlocked the element), never
   retried in a loop — repeated refused play() calls stalled frames on phones and the hero appeared to blink.
   Plain <audio> only (no Web Audio): iPhone mutes Web Audio when the silent switch is on, so routing through a
   gain node made the music silent on many phones. iPhone also ignores <audio>.volume, so song files are mastered
   quiet (-8 dB, 96 kbps MP3) and other devices scale them with BGM_LEVELS. */
const MUSIC_TRACKS={
 forgive:{file:'assets/bgm/forgive.mp3',title:'Forgive',composer:'RYU ITO',site:'https://ryu110.com/',use:'ことのは島・街'}};
// Map id → track id. Town interiors (i_*) share the town's song.
const MAP_MUSIC={island:'forgive',village:'forgive',port:'forgive'};
// Other assets that ask for (or deserve) a credit line.
const OTHER_CREDITS=[{what:'効果音・アイコン',who:'Kenney',site:'https://www.kenney.nl/',note:'CC0'}];
const BGM_LEVELS=[0,.55,1];
const Music=(()=>{let el=null,current=null,level=0,unlocked=false,pending=false;
 const wanted=()=>{if(typeof S==='undefined'||!S||typeof mode==='undefined'||mode==='title'||mode==='battle')return null;
  return MAP_MUSIC[S.map]||(String(S.map).startsWith('i_')?MAP_MUSIC.island:null)||null};
 const target=()=>{const v=BGM_LEVELS[typeof opt!=='undefined'?opt.bgm??1:1]||0;const talking=typeof speechSynthesis!=='undefined'&&speechSynthesis.speaking;return document.hidden?0:v*(talking?.35:1)};
 const setVol=v=>{level=Math.max(0,Math.min(1,v));if(el)el.volume=level};
 function ensure(){if(el)return el;el=new Audio();el.loop=true;el.preload='auto';el.setAttribute('playsinline','');
  try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(_){}   // Safari: play like media, even in silent mode
  return el}
 function load(id){current=id;ensure();el.src=MUSIC_TRACKS[id].file;setVol(0)}
 // At most one play() in flight; a refusal just waits for the next tap instead of retrying.
 function start(){if(!el||!el.paused||pending||!unlocked)return;pending=true;const p=el.play();
  if(p?.then)p.then(()=>{pending=false},()=>{pending=false;unlocked=false});else pending=false}
 function tick(){const want=wanted();
  if(want!==current){if(el&&!el.paused&&level>.01){setVol(level-.04);return}   // fade out, then switch
   if(!want){current=null;el?.pause();return}load(want);start();return}
  if(!el||!current)return;const t=target();
  if(t===0&&level<.01){if(!el.paused)el.pause();return}
  if(el.paused){start();return}
  setVol(level+Math.max(-.03,Math.min(.03,t-level)))}
 // Every tap/key press: resume the audio context and (re)start the song from inside the gesture.
 function gesture(){unlocked=true;ensure();
  const want=wanted();if(want&&want!==current)load(want);
  if(current&&target()>0)start();
  else if(!current&&!el.src){el.muted=true;el.src=Object.values(MUSIC_TRACKS)[0].file;const p=el.play();const done=()=>{el.pause();el.muted=false};p?.then?p.then(done,()=>{el.muted=false}):done()}}
 if(typeof window!=='undefined'){for(const ev of ['pointerdown','keydown','touchend'])window.addEventListener(ev,gesture,{passive:true});setInterval(tick,150)}
 return {tick,unlock:gesture,get playing(){return current&&el&&!el.paused?current:null},get state(){return el?{src:el.src,paused:el.paused,time:el.currentTime,volume:el.volume,muted:el.muted}:null}};
})();
function bgmLabel(){return ['OFF','小さめ','標準'][typeof opt!=='undefined'?opt.bgm??1:1]}
/* Settings → クレジット: every song in MUSIC_TRACKS, then other credited assets. */
async function showCredits(){
 const songs=Object.values(MUSIC_TRACKS).map(t=>`<li><b>曲名「${htmlSafe(t.title)}」</b><br>作曲 ${htmlSafe(t.composer)}<br><a href="${t.site}" target="_blank" rel="noopener">${htmlSafe(t.site)}</a><small>（${htmlSafe(t.use)}）</small></li>`).join('');
 const others=OTHER_CREDITS.map(c=>`<li><b>${htmlSafe(c.what)}</b> ${htmlSafe(c.who)} <a href="${c.site}" target="_blank" rel="noopener">${htmlSafe(c.site)}</a> <small>${htmlSafe(c.note||'')}</small></li>`).join('');
 setLog(`<div class="credits"><p class="en">Credits クレジット</p><h3>音楽</h3><ul>${songs}</ul><h3>素材</h3><ul>${others}</ul></div>`);await next()}
