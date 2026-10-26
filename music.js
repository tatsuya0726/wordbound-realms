/* Background music (2026-10-26), same design as ABYSS DECK's audio.
   MUSIC_TRACKS is the one list of songs: add a track here (file in assets/bgm/, title, composer, credit link,
   loudness trim) and point maps at it in MAP_MUSIC. The settings 「クレジット」 and 「BGMを聞く」 pages are built from
   the same list, so every song is credited and playable.
   - Web Audio: each song → loudness trim → crossfade gain → BGM bus → soft limiter → speakers; songs crossfade 0.8 s.
   - Volume: settings 「音量設定」 sliders for BGM and 効果音 (0–100%, saved in localStorage 'wordbound-audio-prefs').
     BGM gain is the slider squared; the BGM bus ducks to 42% while English is read aloud.
   - Music stops the moment the page is hidden, the app is switched away or the screen locks (visibilitychange /
     pagehide), and resumes when the page comes back.
   - Playback only starts from a tap or key press or after one (tap-start.js); a refused play() is never retried
     in a loop. Like ABYSS DECK, music follows the phone's silent switch (silent mode = no music). */
const MUSIC_TRACKS={
 forgive:{file:'assets/bgm/forgive.mp3',title:'Forgive',composer:'RYU ITO',site:'https://ryu110.com/',use:'ことのは島・街',gain:.447}};   // -14 LUFS → about -21
// Map id → track id. Town interiors (i_*) share the town's song.
const MAP_MUSIC={island:'forgive',village:'forgive',port:'forgive'};
// Other assets that ask for (or deserve) a credit line.
const OTHER_CREDITS=[{what:'効果音・アイコン',who:'Kenney',site:'https://www.kenney.nl/',note:'CC0'}];
const AUDIO_PREFS_KEY='wordbound-audio-prefs';
const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
const volumeGain=v=>Math.pow(clamp01(v),2);
const sfxVolumeGain=v=>{v=clamp01(v);return v<=.5?4*v*v:1+(v-.5)};
let audioPrefs=(()=>{try{const s=JSON.parse(localStorage.getItem(AUDIO_PREFS_KEY)||'{}');if(s.version===1)return {version:1,bgm:clamp01(s.bgm),sfx:clamp01(s.sfx)}}catch(_){}return {version:1,bgm:.5,sfx:.5}})();
// Click sounds (ui-feedback.js) follow the 効果音 slider.
globalThis.wordboundSfxGain=()=>sfxVolumeGain(audioPrefs.sfx);

const Music=(()=>{let ac=null,bus=null,bgm=null,current=null,hiddenPaused=false,gallery=false,ducked=false;const live=new Set(),FADE=.8;
 function ensureAudio(){const AC=window.AudioContext||window.webkitAudioContext;
  try{if(AC&&(!ac||ac.state==='closed')){ac=new AC();bus=ac.createGain();const lim=ac.createDynamicsCompressor();lim.threshold.value=-3;lim.knee.value=3;lim.ratio.value=12;lim.attack.value=.003;lim.release.value=.15;
    bus.connect(lim);lim.connect(ac.destination);bus.gain.value=volumeGain(audioPrefs.bgm)}
   if(ac&&ac.state!=='running')ac.resume().catch(()=>{});return true}catch(_){ac=bus=null;return false}}
 function updateGain(){const v=volumeGain(audioPrefs.bgm)*(ducked?.42:1);if(ac&&bus){bus.gain.cancelScheduledValues(ac.currentTime);bus.gain.setTargetAtTime(v,ac.currentTime,.015)}else for(const el of live)el.volume=v}
 function create(id){ensureAudio();const t=MUSIC_TRACKS[id],el=new Audio(t.file);el.loop=true;el.preload='auto';el.playsInline=true;el._id=id;
  if(ac&&bus){const src=ac.createMediaElementSource(el),trim=ac.createGain(),fade=ac.createGain();trim.gain.value=t.gain??1;fade.gain.value=0;src.connect(trim).connect(fade).connect(bus);Object.assign(el,{_src:src,_trim:trim,_fade:fade})}
  else el.volume=volumeGain(audioPrefs.bgm);live.add(el);return el}
 function release(el){if(!el||el._gone)return;el._gone=true;clearTimeout(el._timer);live.delete(el);el.pause();el._src?.disconnect();el._trim?.disconnect();el._fade?.disconnect();el.removeAttribute('src');el.load()}
 function fade(el,to){const g=el?._fade?.gain;if(!g||!ac)return;const now=ac.currentTime;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(to,now+FADE)}
 function retire(el){if(!el||el._gone||el._retiring)return;if(el.paused||document.hidden||audioPrefs.bgm<=0||!el._fade){release(el);return}el._retiring=true;fade(el,0);el._timer=setTimeout(()=>release(el),FADE*1000+60)}
 const canPlay=()=>audioPrefs.bgm>0&&!document.hidden;
 function play(el){const p=el.play();if(p?.catch)p.catch(()=>{})}   // one attempt; a refusal waits for the next tap
 function switchTo(id){if(id===current&&bgm&&!bgm._gone){if(canPlay()&&bgm.paused)play(bgm);return}
  current=id;const old=bgm;if(!id){bgm=null;for(const el of [...live])retire(el);return}
  const incoming=bgm=create(id);for(const el of [...live])if(el!==incoming&&el!==old)release(el);
  incoming.addEventListener('playing',()=>{if(incoming._gone||bgm!==incoming)return;fade(incoming,1);for(const el of [...live])if(el!==incoming)retire(el)},{once:true});
  incoming.addEventListener('error',()=>{if(bgm===incoming){release(incoming);bgm=null;current=null}},{once:true});
  if(canPlay())play(incoming);else for(const el of [...live])if(el!==incoming)release(el)}
 const wanted=()=>{if(typeof S==='undefined'||!S||typeof mode==='undefined'||mode==='title'||mode==='battle')return null;
  return MAP_MUSIC[S.map]||(String(S.map).startsWith('i_')?MAP_MUSIC.island:null)||null};
 function sync(){if(document.hidden||gallery)return;const want=wanted();if(want!==current)switchTo(want);
  const talking=typeof speechSynthesis!=='undefined'&&!!speechSynthesis.speaking;if(talking!==ducked){ducked=talking;updateGain()}}
 // Taps and key presses: wake the audio context and, inside the gesture, start a song that is waiting to play.
 function gesture(){ensureAudio();if(bgm&&bgm.paused&&canPlay())play(bgm);else sync()}
 function hide(){for(const el of [...live])if(el!==bgm)release(el);if(bgm&&!bgm.paused){bgm.pause();hiddenPaused=true}ac?.suspend?.().catch(()=>{})}
 function show(){ac?.resume?.().catch(()=>{});if(hiddenPaused&&bgm&&canPlay())play(bgm);hiddenPaused=false;sync()}
 if(typeof window!=='undefined'){
  for(const ev of ['pointerdown','keydown','touchend'])window.addEventListener(ev,gesture,{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>document.hidden?hide():show());
  window.addEventListener('pagehide',hide);window.addEventListener('pageshow',()=>{if(!document.hidden)show()});
  setInterval(sync,250)}
 function setVolume(kind,v){audioPrefs[kind]=clamp01(v);try{localStorage.setItem(AUDIO_PREFS_KEY,JSON.stringify(audioPrefs))}catch(_){}
  if(kind==='bgm'){ensureAudio();updateGain();if(bgm){if(audioPrefs.bgm<=0){bgm.pause();for(const el of [...live])if(el!==bgm)release(el)}else if(!document.hidden&&bgm.paused)play(bgm)}}}
 // BGMを聞く: play any song on demand; leaving the gallery returns to the scene's music.
 function preview(id){gallery=true;current=null;switchTo(id)}
 function closeGallery(){gallery=false;switchTo(null);sync()}
 return {unlock:gesture,sync,setVolume,preview,closeGallery,stopPreview:()=>{bgm?.pause()},
  get playing(){return current&&bgm&&!bgm.paused?current:null},
  get state(){return bgm?{src:bgm.src,paused:bgm.paused,time:bgm.currentTime,muted:bgm.muted,webAudio:!!bgm._fade,context:ac?.state||null}:null}};
})();

/* Settings → 音量設定: BGM and 効果音 sliders (like ABYSS DECK). Resolves when closed. */
function openAudioSettings(){return new Promise(done=>{document.getElementById('audioSettings')?.remove();
 const p=document.createElement('div');p.id='audioSettings';p.setAttribute('role','dialog');p.setAttribute('aria-label','音量設定');
 p.innerHTML='<h3>音量設定</h3>'+[['bgm','BGM'],['sfx','効果音']].map(([k,l])=>`<label><span class="audio-label">${l}</span><input id="${k}Volume" type="range" min="0" max="100" step="1" value="${Math.round(audioPrefs[k]*100)}"><output id="${k}Value">${Math.round(audioPrefs[k]*100)}%</output></label>`).join('')+'<button type="button" id="audioClose">閉じる</button>';
 document.body.appendChild(p);
 for(const k of ['bgm','sfx']){const input=p.querySelector('#'+k+'Volume');input.oninput=()=>{Music.setVolume(k,input.value/100);p.querySelector('#'+k+'Value').textContent=input.value+'%'};
  if(k==='sfx')input.onchange=()=>globalThis.UIFeedback?.confirm(2)}
 const close=()=>{p.remove();document.removeEventListener('keydown',esc,true);done()},esc=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}};
 p.querySelector('#audioClose').onclick=close;document.addEventListener('keydown',esc,true);p.querySelector('#bgmVolume').focus()})}

/* Settings → BGMを聞く: every song with where it plays and who made it. Resolves when closed. */
function openMusicGallery(){return new Promise(done=>{document.getElementById('musicGallery')?.remove();
 const g=document.createElement('div');g.id='musicGallery';g.setAttribute('role','dialog');g.setAttribute('aria-label','BGMを聞く');
 g.innerHTML=`<div class="music-gallery-panel"><header><small>MUSIC ARCHIVE</small><h2>BGMを聞く</h2></header><div class="music-gallery-list">${Object.entries(MUSIC_TRACKS).map(([id,t])=>`<button type="button" data-track="${id}"><i>♫</i><span><small>${htmlSafe(t.use)}</small><b>${htmlSafe(t.title)}</b><small>作曲 ${htmlSafe(t.composer)}</small></span><em>再生</em></button>`).join('')}</div><button type="button" class="music-gallery-close">閉じる</button></div>`;
 document.body.appendChild(g);
 const mark=id=>g.querySelectorAll('[data-track]').forEach(b=>{const on=b.dataset.track===id;b.classList.toggle('playing',on);b.querySelector('em').textContent=on?'停止':'再生'});
 g.querySelectorAll('[data-track]').forEach(b=>b.onclick=()=>{if(b.classList.contains('playing')){Music.stopPreview();mark(null)}else{Music.preview(b.dataset.track);mark(b.dataset.track)}});
 const close=()=>{g.remove();document.removeEventListener('keydown',esc,true);Music.closeGallery();done()},esc=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}};
 g.querySelector('.music-gallery-close').onclick=close;g.addEventListener('click',e=>{if(e.target===g)close()});document.addEventListener('keydown',esc,true);g.querySelector('[data-track]')?.focus()})}

/* Settings → クレジット: every song in MUSIC_TRACKS, then other credited assets. */
async function showCredits(){
 const songs=Object.values(MUSIC_TRACKS).map(t=>`<li><b>曲名「${htmlSafe(t.title)}」</b><br>作曲 ${htmlSafe(t.composer)}<br><a href="${t.site}" target="_blank" rel="noopener">${htmlSafe(t.site)}</a><small>（${htmlSafe(t.use)}）</small></li>`).join('');
 const others=OTHER_CREDITS.map(c=>`<li><b>${htmlSafe(c.what)}</b> ${htmlSafe(c.who)} <a href="${c.site}" target="_blank" rel="noopener">${htmlSafe(c.site)}</a> <small>${htmlSafe(c.note||'')}</small></li>`).join('');
 setLog(`<div class="credits"><p class="en">Credits クレジット</p><h3>音楽</h3><ul>${songs}</ul><h3>素材</h3><ul>${others}</ul></div>`);await next()}
