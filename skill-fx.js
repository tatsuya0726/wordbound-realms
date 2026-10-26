/* Skill effects (2026-10-26): every skill gets a visual, chosen from what it does.
   - Attacks on enemies: elemental skills fly from the party to the target and burst (火 flames, 氷 shards,
     雷 a lightning bolt from the sky, 風 crescent gusts, 闇 an imploding orb, 聖 a pillar of light); physical skills
     strike by theme (claws, fangs, horns, leaves, rocks, sound waves, slashes). Every strike of a multi-hit skill
     plays again, a miss whiffs past, and a 会心の一撃 adds a star burst.
   - Status on enemies: poison bubbles, flames, Zzz, circling stars, a seal, an ink cloud, falling arrows, shattering glass.
   - Help for the party plays on the stage floor (rising sparkles, arrows, a shimmering barrier, a golden pillar) and
     lights up that monster's card in the roster (heal / buff / shield / …).
   cast() is called by party-battle.js with the skill's events; numbers then pop after fxLead ms. */
const SkillFX=(()=>{
 const list=[];
 const EL_COL={fire:['#ff6a2a','#ffd27a'],ice:['#bfefff','#5fc8ff'],thunder:['#fff6a0','#ffd23a'],wind:['#d8ffe8','#5fe0a0'],dark:['#b07ae8','#3a1650'],holy:['#fffbe0','#ffe27a']};
 const STATUS_FX={poison:'poison',burn:'burn',sleep:'sleep',stun:'stun',silence:'silence',blind:'blind',attackDown:'debuff',defenseDown:'debuff',dispel:'shatter',wardBlocked:'ward',resist:'resist'};
 const ALLY_FX={heal:'heal',revive:'revive',regen:'regen',attackUp:'buff-atk',defenseUp:'buff-def',shield:'shield',guard:'shield',statusWard:'ward',cleanse:'cleanse',damage:'hurt',critical:'hurt',poison:'poison',burn:'burn',sleep:'sleep',stun:'stun',silence:'silence',blind:'blind',attackDown:'debuff',defenseDown:'debuff',recoil:'hurt',dispel:'debuff'};
 /* The look of a damaging skill: its element, else its theme. */
 function hitKind(ability){const el=typeof ElementResist!=='undefined'?ElementResist.element(ability):null;if(ability.command==='lis')return {kind:'wave'};
  if(el)return {kind:el,proj:true};const tags=(ability.themeTags||[]).join(' ');
  if(/claw|beast/.test(tags))return {kind:'claw'};if(/fang/.test(tags))return {kind:'bite'};if(/horn|shell|metal|golem/.test(tags))return {kind:'impact'};
  if(/seed|leaf|plant|thorn|flower|root|wood|fungus/.test(tags))return {kind:'leaf',proj:true};if(/earth|stone|rock|sand|crystal/.test(tags))return {kind:'rock'};
  if(/sound|bell|clock/.test(tags))return {kind:'wave'};if(/wing|bird|nest/.test(tags))return {kind:'wind'};if(/poison/.test(tags))return {kind:'poison'};
  return {kind:'slash'}}
 /* Queue the visuals for one skill use. events: what SkillEffects.apply reported. Returns ms before numbers pop. */
 function cast(ability,events,actor){if(typeof B==='undefined'||!B)return 0;const now=performance.now(),look=hitKind(ability),fromEnemy=!actor?.uid,lead=look.proj&&!fromEnemy?300:160;let strike=0,partyKind=null;
  B.allyFxMap??={};
  for(const e of events){const t=e.target;if(!t)continue;
   if(t.uid){const k=ALLY_FX[e.kind];if(k){B.allyFxMap[t.uid]={t:now+(['damage','critical'].includes(e.kind)?lead:60),kind:k};if(!fromEnemy&&!['hurt','debuff','poison','burn','sleep','stun','silence','blind'].includes(k))partyKind=k}continue}
   if(['damage','critical','miss'].includes(e.kind)){const at=now+(strike++)*140;
    if(look.proj&&!fromEnemy&&strike===1)list.push({kind:'proj',el:look.kind,slot:t.slot,t0:now,dur:lead});
    list.push({kind:e.kind==='miss'?'miss':look.kind,slot:t.slot,t0:at+(look.proj&&!fromEnemy?lead:60),dur:520,n:strike});
    if(e.kind==='critical')list.push({kind:'crit',slot:t.slot,t0:at+lead,dur:520})}
   else if(STATUS_FX[e.kind])list.push({kind:STATUS_FX[e.kind],slot:t.slot,t0:now+lead+120,dur:900})}
  if(partyKind)list.push({kind:'party-'+partyKind,t0:now+60,dur:900});
  B.fxLead=strike?lead:0;return B.fxLead}
 /* Plain enemy attacks: a claw swipe on the struck ally's card. */
 function enemyHit(target,crushing){if(!B||!target?.uid)return;B.allyFxMap??={};B.allyFxMap[target.uid]={t:performance.now(),kind:crushing?'crush':'hurt'}}

 /* ---------- drawing ---------- */
 const lerp=(a,b,t)=>a+(b-a)*t,ease=t=>1-Math.pow(1-t,3);
 function glow(x,y,r,col,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=a;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
 function star(x,y,r1,r2,n,rot){ctx.beginPath();for(let i=0;i<n*2;i++){const r=i%2?r2:r1,a=rot+i*Math.PI/n;ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath()}
 function bolt(x0,y0,x1,y1,seed){ctx.beginPath();ctx.moveTo(x0,y0);const n=7;for(let i=1;i<n;i++){const t=i/n,j=((seed*97+i*53)%23-11);ctx.lineTo(lerp(x0,x1,t)+j*2.2,lerp(y0,y1,t))}ctx.lineTo(x1,y1)}
 const DRAW={
  proj(f,g,t,W,H){const c=EL_COL[f.el]||['#fff','#fff'],x=lerp(W/2,g.x,ease(t)),y=lerp(H*.92,g.cy,ease(t))-Math.sin(t*Math.PI)*g.size*.35,r=g.size*.08;
   for(let k=1;k<6;k++){const tt=Math.max(0,t-k*.05);glow(lerp(W/2,g.x,ease(tt)),lerp(H*.92,g.cy,ease(tt))-Math.sin(tt*Math.PI)*g.size*.35,r*(1-k*.12),c[1],.35-k*.05)}glow(x,y,r*2.2,c[0],.9);ctx.globalAlpha=1;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,r*.5,0,Math.PI*2);ctx.fill()},
  fire(f,g,t){const c=EL_COL.fire;for(let i=0;i<12;i++){const a=i/12*Math.PI*2+f.n,d=g.size*.32*ease(t),x=g.x+Math.cos(a)*d,y=g.cy+Math.sin(a)*d*.7-t*g.size*.15;glow(x,y,g.size*(.16-.08*t),i%2?c[0]:c[1],1-t)}glow(g.x,g.cy,g.size*.45*(.6+t*.6),c[1],.8*(1-t))},
  ice(f,g,t){ctx.globalAlpha=1-t;for(let i=0;i<9;i++){const a=i/9*Math.PI*2+f.n*.4,d=g.size*(.05+.4*ease(t)),x=g.x+Math.cos(a)*d,y=g.cy+Math.sin(a)*d,s=g.size*.07;ctx.fillStyle=i%2?'#ffffff':'#9fe3ff';ctx.beginPath();ctx.moveTo(x+Math.cos(a)*s*1.8,y+Math.sin(a)*s*1.8);ctx.lineTo(x+Math.cos(a+1.9)*s,y+Math.sin(a+1.9)*s);ctx.lineTo(x+Math.cos(a-1.9)*s,y+Math.sin(a-1.9)*s);ctx.fill()}
   ctx.strokeStyle='#dff6ff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(g.x,g.base,g.size*.45*ease(t),g.size*.1*ease(t),0,0,Math.PI*2);ctx.stroke()},
  thunder(f,g,t){if(t>.75)return;const on=Math.floor(t*12)%2===0;ctx.globalAlpha=on?1:.4;ctx.lineWidth=g.size*.035;ctx.strokeStyle='#fff6a0';bolt(g.x+((f.n*31)%40-20),g.top,g.x,g.cy,f.n+Math.floor(t*6));ctx.stroke();ctx.lineWidth=g.size*.012;ctx.strokeStyle='#ffffff';ctx.stroke();glow(g.x,g.cy,g.size*.5,'#fff6a0',on?.8:.3)},
  wind(f,g,t){ctx.lineCap='round';for(let i=0;i<3;i++){const tt=Math.min(1,Math.max(0,t*1.4-i*.15)),a0=-1.2+tt*3+i*.5,r=g.size*(.22+i*.08);ctx.globalAlpha=(1-tt)*.9;ctx.strokeStyle=i%2?'#5fe0a0':'#e8fff2';ctx.lineWidth=g.size*.03;ctx.beginPath();ctx.arc(g.x,g.cy,r,a0,a0+1.4);ctx.stroke()}},
  dark(f,g,t){const r=g.size*.5*(1-ease(t))+g.size*.05;ctx.globalAlpha=.9*(1-t*.6);ctx.strokeStyle='#b07ae8';ctx.lineWidth=g.size*.03;ctx.beginPath();ctx.arc(g.x,g.cy,r,0,Math.PI*2);ctx.stroke();glow(g.x,g.cy,g.size*.35,'#3a1650',.9*(1-t));
   if(t>.55)for(let i=0;i<8;i++){const a=i/8*Math.PI*2,d=g.size*.4*(t-.55)/.45;glow(g.x+Math.cos(a)*d,g.cy+Math.sin(a)*d,g.size*.12,'#7a3ab0',(1-t)*1.6)}},
  holy(f,g,t){const w=g.size*.28*(1-Math.abs(t-.35)),gr=ctx.createLinearGradient(g.x-w,0,g.x+w,0);gr.addColorStop(0,'rgba(255,240,180,0)');gr.addColorStop(.5,'rgba(255,252,230,.95)');gr.addColorStop(1,'rgba(255,240,180,0)');ctx.globalAlpha=1-t;ctx.fillStyle=gr;ctx.fillRect(g.x-w,g.top,w*2,g.base-g.top);
   for(let i=0;i<6;i++){const y=g.base-((t*1.5+i/6)%1)*g.size,x=g.x+Math.sin(i*2.1)*g.size*.25;ctx.fillStyle='#fffbe0';star(x,y,g.size*.04,g.size*.012,4,0);ctx.fill()}},
  claw(f,g,t){ctx.lineCap='round';const p=Math.min(1,t*2.2),dir=f.n%2?-1:1;for(let i=-1;i<=1;i++){const x0=g.x-g.size*.28*dir+i*g.size*.11,y0=g.cy-g.size*.32,x1=x0+g.size*.5*dir,y1=y0+g.size*.62;ctx.globalAlpha=t<.6?1:1-(t-.6)/.4;ctx.strokeStyle='#ffffff';ctx.lineWidth=g.size*.03;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(lerp(x0,x1,p),lerp(y0,y1,p));ctx.stroke();ctx.strokeStyle='#ff5a5a';ctx.lineWidth=g.size*.01;ctx.stroke()}},
  bite(f,g,t){const close=Math.min(1,t*2.5),gap=g.size*.3*(1-close),w=g.size*.5;ctx.globalAlpha=t<.7?1:1-(t-.7)/.3;ctx.fillStyle='#ffffff';
   for(const s of [-1,1]){const y=g.cy+s*gap;ctx.beginPath();ctx.moveTo(g.x-w/2,y-s*g.size*.02);for(let i=0;i<=6;i++)ctx.lineTo(g.x-w/2+i*w/6,y+(i%2?s*g.size*.09:0));ctx.lineTo(g.x+w/2,y-s*g.size*.02);ctx.closePath();ctx.fill()}},
  impact(f,g,t){ctx.globalAlpha=1-t;ctx.fillStyle='#fff3c0';star(g.x,g.cy,g.size*(.12+.3*ease(t)),g.size*(.05+.12*ease(t)),8,f.n);ctx.fill();ctx.strokeStyle='#ffd27a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(g.x,g.cy,g.size*.5*ease(t),0,Math.PI*2);ctx.stroke()},
  leaf(f,g,t){for(let i=0;i<7;i++){const tt=Math.min(1,t*1.3+i*.04),a=i*.9+tt*6,r=g.size*.45*(1-tt),x=g.x+Math.cos(a)*r,y=g.cy+Math.sin(a)*r*.6;ctx.globalAlpha=1-Math.max(0,t-.7)/.3;ctx.fillStyle=i%2?'#7fd05a':'#c8f088';ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,0,g.size*.05,g.size*.022,0,0,Math.PI*2);ctx.fill();ctx.restore()}},
  rock(f,g,t){for(let i=0;i<4;i++){const tt=Math.min(1,t*1.6-i*.12);if(tt<=0)continue;const x=g.x+(i-1.5)*g.size*.16,y=lerp(g.top,g.cy+g.size*.1,ease(tt));ctx.globalAlpha=tt<1?1:Math.max(0,1-(t-.75)*4);ctx.fillStyle=i%2?'#8a7a6a':'#b0a090';ctx.beginPath();ctx.ellipse(x,y,g.size*.07,g.size*.055,i,0,Math.PI*2);ctx.fill()}
   if(t>.55)glow(g.x,g.base-g.size*.1,g.size*.45,'#c8b8a0',(1-t)*1.4)},
  wave(f,g,t){for(let i=0;i<3;i++){const tt=Math.min(1,Math.max(0,t*1.3-i*.15));ctx.globalAlpha=1-tt;ctx.strokeStyle=i%2?'#bff6ff':'#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(g.x,g.cy,g.size*(.1+.45*tt),0,Math.PI*2);ctx.stroke()}},
  slash(f,g,t){const p=Math.min(1,t*2.5),dir=f.n%2?1:-1;ctx.globalAlpha=t<.6?1:1-(t-.6)/.4;ctx.strokeStyle='#ffffff';ctx.lineCap='round';ctx.lineWidth=g.size*.04;ctx.beginPath();ctx.arc(g.x,g.cy+g.size*.1,g.size*.42,-Math.PI*.75*dir-.4,(-Math.PI*.75+p*1.3)*dir-.4,dir<0);ctx.stroke();ctx.lineWidth=g.size*.012;ctx.strokeStyle='#bfe8ff';ctx.stroke()},
  miss(f,g,t){ctx.globalAlpha=1-t;ctx.strokeStyle='#e0e8ee';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(g.x+g.size*.45,g.cy,g.size*.3,-1,1);ctx.stroke();ctx.setLineDash([])},
  crit(f,g,t){ctx.globalAlpha=1-t;ctx.fillStyle='#ffffff';star(g.x,g.cy,g.size*(.2+.45*ease(t)),g.size*.06,12,t);ctx.fill();glow(g.x,g.cy,g.size*.6,'#ffd27a',.7*(1-t))},
  poison(f,g,t){for(let i=0;i<8;i++){const tt=(t*1.2+i/8)%1,x=g.x+Math.sin(i*1.7)*g.size*.3,y=g.cy+g.size*.3-tt*g.size*.6;ctx.globalAlpha=(1-t)*(1-tt);ctx.fillStyle=i%2?'#a85ad8':'#6ad85a';ctx.beginPath();ctx.arc(x,y,g.size*(.03+.02*(i%3)),0,Math.PI*2);ctx.fill()}},
  burn(f,g,t){for(let i=0;i<6;i++){const x=g.x+(i-2.5)*g.size*.12,h=g.size*(.12+.08*Math.sin(t*20+i));glow(x,g.base-h*.6,h,i%2?'#ff6a2a':'#ffd27a',1-t)}},
  sleep(f,g,t){ctx.globalAlpha=1-t;ctx.fillStyle='#dfe8ff';for(let i=0;i<3;i++){const tt=(t+i*.25)%1;ctx.font=`bold ${Math.round(g.size*(.08+.04*i))}px sans-serif`;ctx.fillText('Z',g.x+g.size*(.15+.1*i)+Math.sin(tt*6)*6,g.top+g.size*.25-tt*g.size*.2+i*8)}},
  stun(f,g,t){ctx.globalAlpha=1-t*.7;for(let i=0;i<4;i++){const a=t*8+i/4*Math.PI*2,x=g.x+Math.cos(a)*g.size*.25,y=g.cy-g.size*.32+Math.sin(a)*g.size*.07;ctx.fillStyle='#ffe27a';star(x,y,g.size*.05,g.size*.02,5,a);ctx.fill()}},
  silence(f,g,t){const s=g.size*.18;ctx.globalAlpha=1-t;ctx.strokeStyle='#ff6a8a';ctx.lineWidth=g.size*.03;ctx.beginPath();ctx.arc(g.x,g.cy-g.size*.1,s,0,Math.PI*2);ctx.moveTo(g.x-s*.7,g.cy-g.size*.1-s*.7);ctx.lineTo(g.x+s*.7,g.cy-g.size*.1+s*.7);ctx.stroke()},
  blind(f,g,t){for(let i=0;i<5;i++)glow(g.x+(i-2)*g.size*.1,g.cy-g.size*.15+Math.sin(i)*8,g.size*.2,'#101018',(1-t)*1.2)},
  debuff(f,g,t){ctx.globalAlpha=1-t;ctx.fillStyle='#7ab0ff';for(let i=0;i<3;i++){const x=g.x+(i-1)*g.size*.2,y=g.cy-g.size*.2+t*g.size*.35+i*6,s=g.size*.06;ctx.beginPath();ctx.moveTo(x-s,y);ctx.lineTo(x+s,y);ctx.lineTo(x,y+s*1.3);ctx.fill()}},
  shatter(f,g,t){ctx.globalAlpha=1-t;ctx.fillStyle='#e8f6ff';for(let i=0;i<10;i++){const a=i/10*Math.PI*2,d=g.size*.4*ease(t),x=g.x+Math.cos(a)*d,y=g.cy+Math.sin(a)*d;ctx.save();ctx.translate(x,y);ctx.rotate(a+t*4);ctx.fillRect(-g.size*.03,-g.size*.015,g.size*.06,g.size*.03);ctx.restore()}},
  ward(f,g,t){ctx.globalAlpha=1-t;ctx.strokeStyle='#bff6ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(g.x,g.cy,g.size*.4,0,Math.PI*2);ctx.stroke()},
  resist(f,g,t){ctx.globalAlpha=1-t;ctx.strokeStyle='#cfd8dc';ctx.lineWidth=2;ctx.beginPath();ctx.arc(g.x,g.cy,g.size*.3*(1+t*.3),0,Math.PI*2);ctx.stroke()}};
 // Party-wide support on the stage floor (the party itself is shown in the roster above).
 const PARTY={heal:['#7af0a0','✚'],regen:['#7af0a0','✚'],revive:['#ffe27a','✦'],'buff-atk':['#ff8a6a','▲'],'buff-def':['#7ab0ff','▲'],shield:['#9fe3ff','◆'],ward:['#d8c8ff','◆'],cleanse:['#ffffff','✧']};
 function drawParty(f,t,W,H,base){const [col,sym]=PARTY[f.kind.slice(6)]||PARTY.heal;
  const gr=ctx.createLinearGradient(0,base-H*.25,0,base);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,col);ctx.globalAlpha=.35*(1-t);ctx.fillStyle=gr;ctx.fillRect(0,base-H*.25,W,H*.25);
  ctx.font=`bold ${Math.round(H*.035)}px sans-serif`;ctx.textAlign='center';for(let i=0;i<14;i++){const x=W*(i+.5)/14,y=base-((t*1.2+i*.37)%1)*H*.28;ctx.globalAlpha=(1-t)*.9;ctx.fillStyle=col;ctx.fillText(sym,x,y)}ctx.textAlign='left'}
 /* Draw every live effect. geo(slot) → {x, cy, base, top, size} of that enemy. */
 function draw(now,geo,W,H,base){for(let i=list.length-1;i>=0;i--){const f=list[i],t=(now-f.t0)/f.dur;if(t>1){list.splice(i,1);continue}if(t<0)continue;
   ctx.save();try{if(f.kind.startsWith('party-'))drawParty(f,t,W,H,base);else{const g=geo(f.slot);if(g)(DRAW[f.kind]||DRAW.slash)(f,g,t,W,H)}}finally{ctx.restore()}}}
 function clear(){list.length=0}
 return {cast,enemyHit,draw,clear,hitKind,DRAW,get active(){return list.length}};
})();
