/* Game feel (2026-11-10): sound effects for answers and battle, made in the browser with Web Audio.
   No audio files: every sound is a few oscillators or a noise burst, so nothing extra is downloaded.
   - Volume follows the 効果音 slider (music.js). At 0 nothing plays. While English is being read aloud
     sounds drop to 45% so the pronunciation stays clear. Nothing plays while the page is hidden.
   - The audio context is only created after the first tap or key press (browsers refuse sound before that).
   - Hooks are wrappers around existing global functions plus one small watcher of the battle state (B).
     They never change a result, and every hook is wrapped in try/catch: sound must never block the game.
   GameSfx.play(name, {at, combo}) can be called from anywhere; GameSfx.log keeps the last names for tests. */
const GameSfx=(()=>{
 'use strict';
 let ac=null,out=null,noiseBuf=null,gestured=false;const log=[];
 const AC=typeof window!=='undefined'?(window.AudioContext||window.webkitAudioContext):null;
 function ensure(){if(!AC||!gestured)return false;
  try{if(!ac||ac.state==='closed'){ac=new AC();const lim=ac.createDynamicsCompressor();lim.threshold.value=-8;lim.knee.value=6;lim.ratio.value=8;lim.attack.value=.002;lim.release.value=.12;
    out=ac.createGain();out.gain.value=1;out.connect(lim);lim.connect(ac.destination);noiseBuf=null}
   if(ac.state==='suspended'&&!document.hidden)ac.resume().catch(()=>{});return true}catch(_){ac=out=null;return false}}
 function level(){const g=typeof globalThis.wordboundSfxGain==='function'?globalThis.wordboundSfxGain():1;if(!(g>0))return 0;
  const talking=typeof speechSynthesis!=='undefined'&&(speechSynthesis.speaking||speechSynthesis.pending);return Math.min(1.5,g)*(talking?.45:1)}
 /* One enveloped oscillator. f2 glides the pitch; lp softens bright waves. */
 function tone(t,{f,f2,dur=.15,vol=.2,type='sine',attack=.005,lp}){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  let node=o;if(lp){const flt=ac.createBiquadFilter();flt.type='lowpass';flt.frequency.value=lp;o.connect(flt);node=flt}
  node.connect(g).connect(out);o.start(t);o.stop(t+dur+.03)}
 function noise(t,{dur=.1,vol=.2,type='bandpass',freq=1000,freq2,q=.8}){
  if(!noiseBuf){noiseBuf=ac.createBuffer(1,ac.sampleRate*.6,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
  const s=ac.createBufferSource(),flt=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf;flt.type=type;flt.Q.value=q;flt.frequency.setValueAtTime(freq,t);
  if(freq2)flt.frequency.exponentialRampToValueAtTime(freq2,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(flt).connect(g).connect(out);s.start(t,Math.random()*.4,dur+.02)}
 const notes=(t,list,o)=>{for(const [dt,f,dur,vol] of list)tone(t+dt,{...o,f,dur:dur??o.dur,vol:vol??o.vol})};
 const SOUNDS={
  // Answers: a bright two-note chime that climbs a semitone per answer in a row (up to +7); a soft low "hmm" for a miss.
  correct(t,v,o){const k=Math.pow(2,Math.min(7,Math.max(0,o.combo||0))/12),f=880*k;tone(t,{f,dur:.16,vol:.2*v,type:'triangle'});tone(t+.075,{f:f*1.5,dur:.26,vol:.2*v,type:'triangle'});tone(t+.075,{f:f*3,dur:.12,vol:.05*v})},
  wrong(t,v){tone(t,{f:233,f2:196,dur:.16,vol:.17*v,type:'triangle'});tone(t+.13,{f:185,f2:156,dur:.24,vol:.17*v,type:'triangle'})},
  // Battle
  hit(t,v){noise(t,{dur:.09,vol:.3*v,freq:1300,freq2:500});tone(t,{f:190,f2:70,dur:.11,vol:.26*v})},
  crit(t,v){noise(t,{dur:.16,vol:.36*v,freq:2200,freq2:500});tone(t,{f:150,f2:50,dur:.2,vol:.32*v});tone(t+.02,{f:1250,f2:2500,dur:.2,vol:.1*v,type:'triangle'})},
  miss(t,v){noise(t,{dur:.15,vol:.1*v,type:'highpass',freq:1800,freq2:4500,q:.5})},
  hurt(t,v){noise(t,{dur:.13,vol:.24*v,type:'lowpass',freq:800,freq2:250});tone(t,{f:130,f2:55,dur:.16,vol:.28*v,type:'triangle'})},
  hurtBig(t,v){noise(t,{dur:.24,vol:.34*v,type:'lowpass',freq:1200,freq2:200});tone(t,{f:110,f2:38,dur:.3,vol:.36*v,type:'triangle'})},
  heal(t,v){notes(t,[[0,523],[.07,659],[.14,784],[.21,1047,.34]],{dur:.2,vol:.12*v})},
  buff(t,v){notes(t,[[0,392],[.09,587,.26]],{dur:.14,vol:.14*v,type:'triangle'})},
  defeat(t,v){tone(t,{f:620,f2:110,dur:.3,vol:.17*v,type:'triangle'});noise(t+.04,{dur:.26,vol:.13*v,type:'lowpass',freq:2600,freq2:300})},
  encounter(t,v){tone(t,{f:240,f2:960,dur:.34,vol:.12*v,type:'sawtooth',lp:1800});noise(t,{dur:.36,vol:.08*v,type:'highpass',freq:700,freq2:5000,q:.5})},
  boss(t,v){tone(t,{f:90,f2:45,dur:.6,vol:.3*v,type:'triangle'});tone(t,{f:120,f2:380,dur:.5,vol:.11*v,type:'sawtooth',lp:1100});noise(t,{dur:.5,vol:.12*v,type:'lowpass',freq:500,freq2:150})},
  victory(t,v){const o={vol:.13*v,type:'square',lp:2400};notes(t,[[0,523,.1],[.12,523,.1],[.24,523,.1],[.36,659,.22],[.6,784,.55]],o);notes(t,[[.36,523,.22,.07*v],[.6,659,.55,.07*v],[.6,392,.55,.07*v]],{type:'triangle'})},
  levelup(t,v){notes(t,[[0,523],[.08,659],[.16,784],[.24,1047],[.32,1319,.5]],{dur:.16,vol:.13*v,type:'triangle'});notes(t,[[.32,1047,.5,.06*v],[.36,2637,.3,.035*v]],{})},
  heart(t,v){notes(t,[[0,988],[.09,1319,.3]],{dur:.14,vol:.11*v})},
  scout(t,v){notes(t,[[0,659],[.09,784],[.18,988],[.27,1319,.5]],{dur:.18,vol:.13*v});notes(t,[[.27,659,.5,.06*v]],{type:'triangle'})},
  gameover(t,v){notes(t,[[0,392,.3],[.3,349,.3],[.6,294,.3],[.9,262,.8]],{vol:.13*v,type:'triangle'})},
  // Field and menus
  cursor(t,v){tone(t,{f:1150,dur:.035,vol:.045*v})},
  warp(t,v){tone(t,{f:330,f2:880,dur:.28,vol:.07*v});tone(t+.05,{f:495,f2:1320,dur:.26,vol:.04*v})}};
 function play(name,o={}){
  try{log.push(name);if(log.length>60)log.shift();
   const fn=SOUNDS[name];if(!fn||typeof document==='undefined'||document.hidden)return false;const v=level();if(!v||!ensure()||ac.state!=='running')return false;
   const wait=o.at?Math.max(0,Math.min(3,(o.at-performance.now())/1000)):0;fn(ac.currentTime+.012+wait,v,o);return true}catch(_){return false}}
 if(typeof window!=='undefined'){
  const wake=()=>{gestured=true;ensure()};for(const ev of ['pointerdown','keydown','touchend'])window.addEventListener(ev,wake,{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(!ac)return;(document.hidden?ac.suspend():ac.resume()).catch(()=>{})});
  window.addEventListener('pagehide',()=>ac?.suspend().catch(()=>{}))}
 return Object.freeze({play,log,names:Object.keys(SOUNDS),get state(){return ac?ac.state:null}});
})();

/* ---- Hooks ---- */
(()=>{
 'use strict';
 if(typeof window==='undefined')return;
 const guard=fn=>(...a)=>{try{return fn(...a)}catch(e){console.warn('game-feel',e)}};
 const wrap=(name,before)=>{const orig=window[name];if(typeof orig!=='function')return;const pre=guard(before);window[name]=function(...a){pre(...a);return orig.apply(this,a)}};
 // Answers: quiz() calls record() the moment a choice is picked.
 wrap('record',(Q,ok)=>GameSfx.play(ok?'correct':'wrong',{combo:typeof quizStreak==='number'?quizStreak-1:0}));
 wrap('navMove',()=>{if(nav.btns.length>1)GameSfx.play('cursor')});
 wrap('warp',map=>{if(typeof S!=='undefined'&&S&&S.map!==map&&mode==='walk')GameSfx.play('warp')});
 wrap('encounterFx',boss=>GameSfx.play(boss?'boss':'encounter'));
 wrap('groupVictory',()=>{if(B.enemies.some(e=>e.hp<=0&&!e.caught))GameSfx.play('victory',{at:performance.now()+120})});
 wrap('gameOver',()=>GameSfx.play('gameover'));
 /* Battle watcher: party-battle.js already records when each number pops (B.nums), which ally card flashes (B.allyFx)
    and each enemy's HP, hearts and caught flag — the sounds follow those, timed to the same moments as the visuals. */
 let seen=null,nums=0,ally=null,foes=[],hero=null,lv=0;
 const watch=guard(()=>{
  if(typeof S!=='undefined'&&S){if(S!==hero){hero=S;lv=S.lv}else if(S.lv>lv){lv=S.lv;GameSfx.play('levelup')}else lv=S.lv}
  if(typeof B==='undefined'||!B){seen=null;return}
  if(B!==seen){seen=B;nums=B.nums.length;ally=B.allyFx;foes=B.enemies.map(e=>({hp:e.hp,hearts:e.hearts||0,caught:!!e.caught}))}
  if(nums>B.nums.length)nums=B.nums.length;
  while(nums<B.nums.length){const n=B.nums[nums++];GameSfx.play(n.v==='MISS'?'miss':n.crit?'crit':'hit',{at:n.t})}
  if(B.allyFx!==ally){ally=B.allyFx;if(ally){const big=ally.kind==='hurt'&&B.critEnemy&&B.critAt&&Math.abs(B.critAt-ally.t)<80;GameSfx.play(ally.kind==='hurt'?(big?'hurtBig':'hurt'):ally.kind==='heal'?'heal':'buff',{at:ally.t})}}
  B.enemies.forEach((e,i)=>{const was=foes[i]||(foes[i]={hp:e.hp,hearts:e.hearts||0,caught:!!e.caught});
   if(e.hp<=0&&was.hp>0)GameSfx.play('defeat',{at:Math.max(performance.now(),e.hitAt||0)+170});
   if(e.caught&&!was.caught)GameSfx.play('scout');else if((e.hearts||0)>was.hearts)GameSfx.play('heart');
   was.hp=e.hp;was.hearts=e.hearts||0;was.caught=!!e.caught})});
 setInterval(watch,40);
})();
