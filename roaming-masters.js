/* Roaming adventurers. No global scouting override: a closed-over battle result grants one post-victory attempt. */
const RoamingMasters=(()=>{
 const MAX_RARITY=8,CHANCE=.20,INTERVAL=32,COOLDOWN=128;
 let fighting=false,nextWander=0;
 const valid=id=>!!CD.species[id]&&!CD.species[id].retired&&CR.rarity(CD.species[id])<=MAX_RARITY;
 const eligible=()=>!!F().clear1&&realm()==='異世界'&&!MAPS[S.map]?.town&&!MAPS[S.map]?.indoor;
 function state(){const t=S.masterTrail||(S.masterTrail={steps:0,cooldown:0,serial:0,pending:null});for(const k of ['steps','cooldown','serial'])if(!Number.isSafeInteger(t[k])||t[k]<0)t[k]=0;return t}
 function sound(p){return p&&Number.isSafeInteger(p.id)&&p.id>0&&['waiting','spent'].includes(p.phase)&&Array.isArray(p.roster)&&p.roster.length===2&&new Set(p.roster).size===2&&p.roster.every(valid)&&Number.isFinite(p.roll)&&p.roll>=0&&p.roll<1&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&!!MAPS[p.map]}
 function sync(){if(!S)return;const t=state(),m=MAPS[S.map];if(!m)return;if(t.pending&&!sound(t.pending)){t.pending=null;t.cooldown=Math.max(t.cooldown,COOLDOWN);save()}
  const p=t.pending;m.ents=m.ents.filter(e=>!e.roamingMaster||(p&&p.phase==='waiting'&&e.masterId===p.id&&p.map===S.map));if(!p||p.phase!=='waiting'||p.map!==S.map)return;
  const present=m.ents.find(e=>e.roamingMaster);if(present){const now=Date.now();if(typeof mode!=='undefined'&&mode==='walk'&&!busy&&now>=nextWander){nextWander=now+1200;const moves=[[1,0],[-1,0],[0,1],[0,-1]],d=moves[Math.floor(Math.random()*moves.length)],x=present.x+d[0],y=present.y+d[1];if(Math.abs(x-present.hx)<=2&&Math.abs(y-present.hy)<=2&&['.','=','s','o'].includes(tileAt(m,x,y))&&!entityAt(x,y)&&!(S.x===x&&S.y===y)){present.x=x;present.y=y;present.face=d[0]>0?1:d[0]<0?3:d[1]>0?2:0}}p.x=present.x;p.y=present.y;return}
  if(!WALK.has(tileAt(m,p.x,p.y))||m.ents.some(e=>e.x===p.x&&e.y===p.y)){t.pending=null;t.cooldown=COOLDOWN;save();return}
  m.ents.push({x:p.x,y:p.y,hx:p.x,hy:p.y,pal:'tourist',name:'旅のマスター・ルカ',wander:1,roamingMaster:true,masterId:p.id,talk:()=>challenge(p.id)});
 }
 function step(){if(!S||!eligible())return;const t=state();sync();if(t.pending?.phase==='waiting')return;if(t.cooldown>0){t.cooldown--;save();return}t.steps++;if(t.steps%INTERVAL){save();return}if(Math.random()>=.10){save();return}
  const m=MAPS[S.map],spots=[],queue=[{x:S.x,y:S.y,d:0}],seen=new Set([S.x+','+S.y]);while(queue.length){const q=queue.shift();if(q.d>=4)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=q.x+dx,y=q.y+dy,key=x+','+y,tile=tileAt(m,x,y);if(seen.has(key)||!['.','=','s','o'].includes(tile)||!WALK.has(tile)||entityAt(x,y))continue;seen.add(key);const pos={x,y};if(q.d>=1)spots.push(pos);queue.push({...pos,d:q.d+1})}}if(!spots.length){save();return}
  const low=Object.keys(CD.species).filter(id=>valid(id)&&CR.rarity(CD.species[id])<=4),rare=Object.keys(CD.species).filter(id=>valid(id)&&CR.rarity(CD.species[id])>=7);const choose=a=>a[Math.floor(Math.random()*a.length)];const lead=choose(Math.random()<.30&&rare.length?rare:low),second=choose(low.filter(id=>id!==lead)),pos=choose(spots);
  t.pending={id:++t.serial,map:S.map,...pos,roster:[lead,second],roll:Math.random(),phase:'waiting'};save();sync();
 }
 async function challenge(id){if(fighting)return;const t=state(),p=t.pending;if(!sound(p)||p.phase!=='waiting'||p.id!==id||p.map!==S.map||!eligible())return;
  await say('旅のマスター・ルカ','I am exploring this world too. Shall we have a friendly battle?','私もこの世界を旅しているんだ。仲間同士で対戦しない？');
  setLog('<p class="en">旅のマスター・ルカ</p><p>'+p.roster.map(id=>rarityBadge(CD.species[id])+' '+htmlSafe(CD.species[id].name)).join('<br>')+'</p><p class="sub">勝利後、選んだ1体に20%で仲間になるチャンス。挑戦は一度だけ。再読込・逃走・敗北でも終了します。</p>');
  if(!await ask([{label:'対戦する',value:true},{label:'また今度',value:false}],{cancel:false}))return;
  if(state().pending!==p||!sound(p)||p.phase!=='waiting')return;
  if(!commitCompanionChange(s=>{const q=s.masterTrail.pending;if(q.id!==id||q.phase!=='waiting')throw Error('expired');q.phase='spent';s.masterTrail.cooldown=COOLDOWN;})){await sys('保存できないため対戦を開始できません。');return}
  fighting=true;sync();const roster=[...p.roster],roll=p.roll,keys=roster.map((species,i)=>'traveler_'+id+'_'+i);
  try{for(let i=0;i<roster.length;i++){const sp=CD.species[roster[i]],power=sp.power;ENEMIES[keys[i]]={name:sp.name,jp:sp.name,worldArt:roster[i],hp:28+power*5,atk:7+power,exp:16+power*3,gold:12+power*2,spr:'wisp',pal:{1:'#9bd573',2:'#fff',E:'#142020'}}}
   const result=await battle(keys[0],{keys});if(result==='lose'){await gameOver();return}if(result!=='win')return;
   setLog('<p>いい勝負だったね！ 交流したい仲間を1体選んでね。</p><p class="sub">成功率20%。★9・★10は連れていません。</p>');const chosen=await ask([...roster.map(id=>({label:rarityBadge(CD.species[id])+' '+htmlSafe(CD.species[id].name),value:id})),{label:'今回は見送る',value:null}],{cancel:null});
   if(!chosen||!roster.includes(chosen)||!valid(chosen))return;if(roll>=CHANCE){await sys('仲間は旅を続けたいようだ。また別の旅人との出会いを楽しもう。');return}
   let fresh=false;if(!commitCompanionChange(s=>{const q=s.masterTrail.pending;if(!q||q.id!==id||q.phase!=='spent'||q.claimed||!valid(chosen)||!roster.includes(chosen))throw Error('invalid master reward');CR.validate(s.companions,CD.species);fresh=!s.companions.registered.includes(chosen);CR.add(s.companions,chosen,CD.species);if(fresh)s.companions.registered.push(chosen);q.claimed=true;})){await sys('保存できなかったため加入を取り消しました。');return}
   await sys(CD.species[chosen].name+'が仲間になった！ 同行枠がいっぱいなら牧場で待機します。');if(fresh)await openMonsterBook('dex',chosen);
  }finally{for(const key of keys)delete ENEMIES[key];fighting=false;sync()}
 }
 return {step,sync};
})();
