/* A small, state-derived guide: no rewards, progression mutations or automatic movement. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),safe=s=>htmlSafe(String(s));
 const button=document.createElement('button');button.id='journeyGuide';button.type='button';button.hidden=true;
 button.innerHTML='<span class="journey-eyebrow">次の一歩 <span>遊び方 ›</span></span><strong></strong><small></small>';
 document.getElementById('app').append(button);
 const prompt=document.createElement('button');prompt.id='interactionHint';prompt.type='button';prompt.hidden=true;document.getElementById('app').append(prompt);
 const active=()=>typeof S!=='undefined'&&S&&mode==='walk'&&!busy&&!atlasOpen&&!document.getElementById('tapStart');
 function currentWarp(){return WARPS.find((w,i)=>!F()[w.clear]&&warpOpen(w,i))}
 function entityTarget(test,label){const e=MAPS[S.map]?.ents.find(e=>(!e.cond||e.cond())&&test(e));return e?{x:e.x,y:e.y,talk:true,label}:null}
 function tileTarget(c,label){const m=MAPS[S.map];for(let y=0;y<m.rows.length;y++){const x=m.rows[y].indexOf(c);if(x>=0)return {x,y,label}}return null}
 function destination(){
  const f=F(),w=currentWarp();
  if(S.map==='island'){
   if(!f.metKing||w?.gen){const door=Object.entries(ISLE.doors).find(([,v])=>v==='i_castle');if(door){const [x,y]=door[0].split(',').map(Number);return {x,y,label:w?.gen&&f.metKing?'城の地下へ':'城の入口'}}}
   if(w&&!w.gen)return {x:w.gate[0],y:w.gate[1],talk:true,label:w.name+'の入口'};
   const a=ARENA.find(a=>a.need()&&!isle().arena[a.id]);if(a)return entityTarget(e=>e.name==='Arena',a.name+'の受付');
  }
  if(S.map==='i_castle'&&!f.metKing)return entityTarget(e=>e.talk===kingTalk,'王様');
  if(S.map==='i_castle'&&w?.gen)return entityTarget(e=>e.riftObj==='stairs','地下への階段');
  if(S.map==='i_vault'&&w?.gen)return entityTarget(e=>e.prop==='warp'&&WARPS[e.warp]===w,w.name+'の入口');
  if(S.map==='rift')return entityTarget(e=>e.boss,'この世界のボス')||tileTarget('E','次の層への出口');
  if(MAPS[S.map]?.indoor)return tileTarget('E','広場へ戻る');
  return null;
 }
 /* Route to an adjacent speaking square, or a door/exit. Never path through an NPC. */
 function route(target){
  if(!target)return null;const m=MAPS[S.map],start=[S.x,S.y],queue=[[...start,0,-1]],seen=new Set([start.join(',')]);
  for(let i=0;i<queue.length&&i<6000;i++){
   const [x,y,steps,first]=queue[i];if((target.talk?Math.abs(x-target.x)+Math.abs(y-target.y)===1:x===target.x&&y===target.y))return {steps,first};
   for(let d=0;d<4;d++){const nx=x+DX[d],ny=y+DY[d],key=nx+','+ny;if(seen.has(key)||ny<0||ny>=m.rows.length||nx<0||nx>=m.rows[ny].length)continue;
    const tile=tileAt(m,nx,ny),end=!target.talk&&nx===target.x&&ny===target.y;
    if((!WALK.has(tile)&&!(end&&tile==='d'))||entityAt(nx,ny)||(!end&&(tile==='E'||tile==='d')))continue;
    seen.add(key);queue.push([nx,ny,steps+1,steps===0?d:first]);
   }
  }return null;
 }
 function facing(){let x=S.x+DX[S.dir],y=S.y+DY[S.dir],e=entityAt(x,y);if(!e&&'cg'.includes(tileAt(MAPS[S.map],x,y)))e=entityAt(x+DX[S.dir],y+DY[S.dir]);return e}
 let last='',routeKey='',routeValue=null;
 function render(){
  const on=active();button.hidden=prompt.hidden=!on;if(!on)return;
  const target=destination(),key=[S.map,S.x,S.y,target?.x,target?.y,Math.floor(performance.now()/1300)].join(':');
  if(key!==routeKey){routeValue=route(target);routeKey=key}
  const directions=['↑ 北へ','→ 東へ','↓ 南へ','← 西へ'];
  const short=!F().metKing?'王様に会って、冒険の依頼を受けよう':goal();
  const detail=target?(routeValue?(routeValue.steps===0?'近くに到着。相手を向いて決定':directions[routeValue.first]+' · 道なりに '+routeValue.steps+' 歩')+' · '+target.label:target.label):'タップして冒険ガイドを見る';
  const signature=short+'|'+detail;if(signature!==last){button.querySelector('strong').textContent=short;button.querySelector('small').textContent=detail;button.setAttribute('aria-label','冒険ガイド。'+short+'。'+detail);last=signature}
  const e=facing();prompt.hidden=!e;if(e){const action=e.boss?'挑戦する':e.chest?'調べる':e.prop==='warp'?'入口を調べる':e.prop==='sign'?'看板を読む':'話す';const text='決定 / A · '+action;if(prompt.textContent!==text)prompt.textContent=text;prompt.setAttribute('aria-label',action)}
 }
 button.onclick=()=>{if(active())run(openJourneyGuide)};prompt.onclick=()=>{if(active()&&!anim)pressA()};
 const chapters={
  loop:{title:'ことばでつながる冒険',body:'<div class="guide-hero"><img src="assets/monsters/seedpod_mouse.webp" alt="タネチュー"><p>英語で戦う。<br>ほめて仲間にする。<br>配合して、島を育てる。</p></div><ol class="guide-steps"><li><b>王様に会う</b><span>広場の北にある城へ。噴水を回り、城の扉に歩いて入ろう。</span></li><li><b>草原で仲間を増やす</b><span>広場の光る入口から異世界へ。最初は3体のチームを目指そう。</span></li><li><b>帰って育てる</b><span>宿屋で回復し、仲間メニューで編成。配合は親2体を消費するので確認して決めよう。</span></li><li><b>新しい世界へ</b><span>ボスに勝つと次の世界が開く。仲間や勝利で島が発展し、闘技場にも挑める。</span></li></ol>'},
  battle:{title:'戦闘とスカウト',body:'<ol class="guide-steps"><li><b>仲間はそれぞれHP・SPを持つ</b><span>最大3体で戦う。呪文を選び、英語問題に答えると技が発動。間違えても効果は半分残る。</span></li><li><b>SPがなくても戦える</b><span>「ことばの光」はSP 0。回復したいときは「聴く」を選ぼう。</span></li><li><b>木の実で好きな言葉を知る</b><span>「どうぐ」から木の実をあげるとヒントがわかる。「スカウト」で英語のほめ言葉を選ぼう。配合限定の種は勧誘できない。</span></li><li><b>無理せず戻ろう</b><span>危ないときは「にげる」。拠点の宿屋で全回復。全滅すると所持金が減るので早めに帰ろう。</span></li></ol>'},
  controls:{title:'操作と保存',body:'<dl class="guide-controls"><dt>スマホ</dt><dd>左スティックで移動。Aで話す・決定、Bで戻る・メニュー。</dd><dt>キーボード</dt><dd>矢印 / WASDで移動。Z / Enterで決定、X / Escで戻る。数字キーで解答、Rでもう一度聞く。</dd><dt>ゲームパッド</dt><dd>標準配置の左スティック / 十字キーで移動。下のボタンで決定、右のボタンで戻る、Startでメニュー。最初の音声は画面タップかキー入力で開始。</dd><dt>保存</dt><dd>会話・戦闘の後などに自動保存。データはこの端末・ブラウザ内だけに保存され、端末間の同期はしません。保存エラーは画面上部に表示します。</dd><dt>英語のレベル</dt><dd>設定で学習帯・ふりがな・音量を変更できます。聞こえない問題は「音声が聞こえないとき」を開いて文章を確認できます。</dd></dl>'}
 };
 async function openJourneyGuide(){
  while(true){
   const done=[!!F().metKing,S.companions.owned.length>=3,!!F().clear1,!!isle().arena.bronze];
   const milestones=['王様から依頼を受ける','仲間を3体集める','草原のボスを倒す','ブロンズ杯で優勝する'];
   setLog('<div class="adventure-guide"><p class="guide-kicker">KIKI & NENE’S FIELD GUIDE</p><h2>冒険ガイド</h2><p class="guide-current">'+safe(goal())+'</p><ol class="guide-checklist">'+milestones.map((s,i)=>'<li class="'+(done[i]?'done':'')+'">'+(done[i]?'✓':'◇')+' '+s+'</li>').join('')+'</ol><p class="sub">まずは、次の一歩から。いつでもここで確認できるよ。</p></div>');
   const choice=await ask([{label:'冒険の進め方',value:'loop'},{label:'戦闘・仲間の集め方',value:'battle'},{label:'操作・保存・英語の設定',value:'controls'},{label:'冒険に戻る',value:null}],{cancel:null});
   if(!choice)return;const c=chapters[choice];setLog('<div class="adventure-guide"><h2>'+c.title+'</h2>'+c.body+'</div>');await next();
  }
 }
 window.JourneyGuide={destination,route,render,open:openJourneyGuide};
 setInterval(render,180);render();
})();
