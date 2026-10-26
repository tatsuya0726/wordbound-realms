/* Tap to start (2026-10-26): a first screen that waits for one tap, click or key press before the title menu.
   Phones only allow sound from inside a user gesture, so that first touch unlocks the music (Music.unlock)
   and the English read-aloud voice; afterwards BGM and speech can start on their own.
   The test browser sets window.__skipTapStart (test-quiet.cjs) so older tests start at the title as before. */
(function tapStart(){
 if(typeof window==='undefined'||window.__skipTapStart)return;
 const show=()=>{const o=document.createElement('div');o.id='tapStart';o.setAttribute('role','button');o.tabIndex=0;o.setAttribute('aria-label','タップしてはじめる');
  o.innerHTML='<div class="tap-title">ごちゃまぜ<span>モンスター</span></div><div class="tap-prompt"><b>TAP TO START</b><small>タップしてはじめる</small></div><p class="tap-note">♪ 音が出ます</p>';
  document.body.appendChild(o);o.focus({preventScroll:true});
  let done=false;
  const go=e=>{if(done)return;if(e.type==='keydown'&&!['Enter',' ','Spacebar'].includes(e.key)&&e.key.length>1)return;done=true;e.preventDefault?.();e.stopPropagation?.();
   if(typeof Music!=='undefined')Music.unlock();   // inside the gesture: unlocks the music element and audio context
   try{const s=window.speechSynthesis;if(s){const u=new SpeechSynthesisUtterance('');u.volume=0;s.speak(u)}}catch(_){}   // unlocks read-aloud on iPhone
   o.classList.add('out');setTimeout(()=>o.remove(),450)};
  o.addEventListener('pointerdown',go);o.addEventListener('keydown',go);window.addEventListener('keydown',go,{capture:true,once:false})};
 if(document.body)show();else document.addEventListener('DOMContentLoaded',show);
})();
