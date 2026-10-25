/* Roaming adventurers: live battle-object provenance permits normal scouting, never a post-victory grant. */
const RoamingMasters=(()=>{
 const MAX_RARITY=8,INTERVAL=32,COOLDOWN=128;
 let fighting=false,nextWander=0,session=null;
 const members=new WeakMap();
 const valid=id=>!!CD.species[id]&&!CD.species[id].retired&&CR.rarity(CD.species[id])<=MAX_RARITY;
 const eligible=()=>!!F().clear1&&realm()==='異世界'&&!MAPS[S.map]?.town&&!MAPS[S.map]?.indoor;
 function state(){const t=S.masterTrail||(S.masterTrail={steps:0,cooldown:0,serial:0,pending:null});for(const k of ['steps','cooldown','serial'])if(!Number.isSafeInteger(t[k])||t[k]<0)t[k]=0;return t}
 function sound(p){return p&&Number.isSafeInteger(p.id)&&p.id>0&&['waiting','spent'].includes(p.phase)&&Array.isArray(p.roster)&&p.roster.length===2&&new Set(p.roster).size===2&&p.roster.every(valid)&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&!!MAPS[p.map]}
 function sync(){if(!S)return;const t=state(),m=MAPS[S.map];if(!m)return;if(t.pending&&!sound(t.pending)){t.pending=null;t.cooldown=Math.max(t.cooldown,COOLDOWN);save()}
  const p=t.pending;m.ents=m.ents.filter(e=>!e.roamingMaster||(p&&p.phase==='waiting'&&e.masterId===p.id&&p.map===S.map));if(!p||p.phase!=='waiting'||p.map!==S.map)return;
  const present=m.ents.find(e=>e.roamingMaster);if(present){const now=Date.now();if(typeof mode!=='undefined'&&mode==='walk'&&!busy&&now>=nextWander){nextWander=now+1200;const moves=[[1,0],[-1,0],[0,1],[0,-1]],d=moves[Math.floor(Math.random()*moves.length)],x=present.x+d[0],y=present.y+d[1];if(Math.abs(x-present.hx)<=2&&Math.abs(y-present.hy)<=2&&['.','=','s','o'].includes(tileAt(m,x,y))&&!entityAt(x,y)&&!(S.x===x&&S.y===y)){present.x=x;present.y=y;present.face=d[0]>0?1:d[0]<0?3:d[1]>0?2:0}}p.x=present.x;p.y=present.y;return}
  if(!WALK.has(tileAt(m,p.x,p.y))||m.ents.some(e=>e.x===p.x&&e.y===p.y)){t.pending=null;t.cooldown=COOLDOWN;save();return}
  m.ents.push({x:p.x,y:p.y,hx:p.x,hy:p.y,pal:'tourist',name:'旅のマスター・ルカ',wander:1,roamingMaster:true,masterId:p.id,talk:()=>challenge(p.id)});
 }
 function step(){if(!S||!eligible())return;const t=state();sync();if(t.pending?.phase==='waiting')return;if(t.cooldown>0){t.cooldown--;save();return}t.steps++;if(t.steps%INTERVAL){save();return}if(Math.random()>=.10){save();return}
  const m=MAPS[S.map],spots=[],queue=[{x:S.x,y:S.y,d:0}],seen=new Set([S.x+','+S.y]);while(queue.length){const q=queue.shift();if(q.d>=4)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=q.x+dx,y=q.y+dy,key=x+','+y,tile=tileAt(m,x,y);if(seen.has(key)||!['.','=','s','o'].includes(tile)||!WALK.has(tile)||entityAt(x,y))continue;seen.add(key);const pos={x,y};if(q.d>=1)spots.push(pos);queue.push({...pos,d:q.d+1})}}if(!spots.length){save();return}
  const low=Object.keys(CD.species).filter(id=>valid(id)&&CR.rarity(CD.species[id])<=4),rare=Object.keys(CD.species).filter(id=>valid(id)&&CR.rarity(CD.species[id])>=7);const choose=a=>a[Math.floor(Math.random()*a.length)];const lead=choose(Math.random()<.30&&rare.length?rare:low),second=choose(low.filter(id=>id!==lead)),pos=choose(spots);
  t.pending={id:++t.serial,map:S.map,...pos,roster:[lead,second],phase:'waiting'};delete t.pending.roll;save();sync();
 }
 async function challenge(id){if(fighting)return;const t=state(),p=t.pending;if(!sound(p)||p.phase!=='waiting'||p.id!==id||p.map!==S.map||!eligible())return;
  await say('旅のマスター・ルカ','I am exploring this world too. Shall we have a friendly battle?','私もこの世界を旅しているんだ。仲間同士で対戦しない？');
  setLog('<p class="en">旅のマスター・ルカ</p><p>'+p.roster.map(id=>rarityBadge(CD.species[id])+' '+htmlSafe(CD.species[id].name)).join('<br>')+'</p><p class="sub">対戦中に木の実で好みを知り、英語で褒めてスカウトできます。★7・★8もこの対戦だけ対象。再読込・逃走・敗北で対戦は終了します。</p>');
  if(!await ask([{label:'対戦する',value:true},{label:'また今度',value:false}],{cancel:false}))return;
  if(state().pending!==p||!sound(p)||p.phase!=='waiting')return;
  if(!commitCompanionChange(s=>{const q=s.masterTrail.pending;if(q.id!==id||q.phase!=='waiting')throw Error('expired');q.phase='spent';q.capturedSlots=[];delete q.roll;delete q.claimed;s.masterTrail.cooldown=COOLDOWN;})){await sys('保存できないため対戦を開始できません。');return}
  fighting=true;sync();const roster=[...p.roster],keys=roster.map((species,i)=>'traveler_'+id+'_'+i);
  session={id,roster,keys,token:{},battle:null};
  try{for(let i=0;i<roster.length;i++){const sp=CD.species[roster[i]],power=sp.power;ENEMIES[keys[i]]={name:sp.name,jp:sp.name,worldArt:roster[i],companion:roster[i],hp:28+power*5,atk:7+power,exp:16+power*3,gold:12+power*2,spr:'wisp',pal:{1:'#9bd573',2:'#fff',E:'#142020'}}}
   const result=await battle(keys[0],{keys,masterToken:session.token});if(result==='lose')await gameOver();
  }finally{for(const key of keys)delete ENEMIES[key];session=null;fighting=false;sync()}
 }
 function attach(b,options){if(!session||options.masterToken!==session.token||b.enemies.length!==session.keys.length||b.enemies.some((e,i)=>e.key!==session.keys[i]||e.companion!==session.roster[i]||!valid(e.companion)))return;session.battle=b;for(const e of b.enemies)members.set(e,session);}
 function canScout(e){const p=S?.masterTrail?.pending;return !!session&&members.get(e)===session&&session.battle===B&&B.enemies.includes(e)&&mode==='battle'&&e.hp>0&&!e.caught&&e.companion===session.roster[e.slot]&&e.key===session.keys[e.slot]&&valid(e.companion)&&p?.id===session.id&&p.phase==='spent'&&!p.capturedSlots?.includes(e.slot);}
 function profile(e){return canScout(e)?{tags:['strong','brave'],need:4,hint:'誇り高い旅の仲間。強さや勇気を認めてくれる言葉が好き。'}:null;}
 function recruit(e,s){if(!canScout(e))throw Error('Invalid master scout');const p=s.masterTrail?.pending;if(p?.id!==session.id||p.phase!=='spent'||p.capturedSlots?.includes(e.slot))throw Error('Already captured');CR.validate(s.companions,CD.species);const fresh=!s.companions.registered.includes(e.companion);CR.add(s.companions,e.companion,CD.species);if(fresh)s.companions.registered.push(e.companion);(p.capturedSlots??=[]).push(e.slot);return fresh;}
 return {step,sync,attach,canScout,profile,recruit};
})();
