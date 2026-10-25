/* Kenney CC0 command pictograms and optional, speech-safe confirmation audio. */
(()=>{
 'use strict';
 const icons={item:'basket',scout:'target',run:'exitLeft',lis:'audioOn',target:'target',settings:'gear',save:'save',sfx:'audioOn'};
 let voice=null,last=-Infinity;
 function decorate(button,value){
  const icon=icons[value];if(!icon)return;
  const img=document.createElement('img');img.src='assets/kenney/icons/'+icon+'.png';img.alt='';img.setAttribute('aria-hidden','true');img.width=16;img.height=16;
  img.style.cssText='width:16px;height:16px;object-fit:contain;vertical-align:-2px;margin-right:6px;opacity:.85;pointer-events:none';
  img.onerror=()=>img.remove();button.prepend(img);
 }
 function confirm(level){
  if(level===0||document.hidden||globalThis.speechSynthesis?.speaking||globalThis.speechSynthesis?.pending)return;
  const now=performance.now();if(now-last<100)return;last=now;
  try{if(!voice){voice=new Audio('assets/kenney/sounds/click_001.ogg');voice.preload='none'}voice.pause();voice.currentTime=0;voice.volume=level===2?.22:.09;const p=voice.play();if(p?.catch)p.catch(()=>{});}catch(_){/* Audio failure must never block a game action. */}
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)voice?.pause()});
 globalThis.UIFeedback=Object.freeze({decorate,confirm,stop:()=>voice?.pause()});
})();
