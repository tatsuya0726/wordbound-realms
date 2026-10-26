/* Display-name profiles are local convenience, not account authentication. */
let Profiles=null;
function syncProfileMode(){if(!Profiles?.current())return;SAVE_KEY=Profiles.saveKey();document.body.classList.toggle('debug-session',Profiles.isDebug());let b=document.getElementById('debugBadge');if(!b){b=document.createElement('div');b.id='debugBadge';b.textContent='DEBUG · 通常セーブとは別';document.body.append(b);}b.hidden=!Profiles.isDebug();}
function profileSettings(first=false){return new Promise(resolve=>{
 const modal=document.createElement('section');modal.className='profile-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','ユーザー設定');
 modal.innerHTML='<div class="profile-window"><h2>ユーザー設定</h2><p>このブラウザー内だけのユーザーです。最初のユーザーに従来のセーブをコピーします。</p><label>ユーザー<select aria-label="ユーザーを選択"></select></label><div class="profile-row"><button data-do="switch">このユーザーに切り替える</button></div><label>名前（1〜24文字）<input aria-label="ユーザー名" maxlength="48" autocomplete="off"></label><div class="profile-row"><button data-do="add">ユーザーを追加</button><button data-do="rename">名前を変更</button></div><p class="profile-error" role="status"></p><button data-do="close">閉じる</button></div>';
 document.body.append(modal);const select=modal.querySelector('select'),input=modal.querySelector('input'),err=modal.querySelector('[role=status]');
 function render(){select.replaceChildren(...Profiles.list().map(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;o.selected=p.id===Profiles.current()?.id;return o;}));input.value=Profiles.current()?.name||'';select.disabled=!Profiles.list().length;modal.querySelector('[data-do=switch]').disabled=!Profiles.list().length;modal.querySelector('[data-do=rename]').disabled=!Profiles.current();modal.querySelector('[data-do=add]').textContent=Profiles.list().length?'ユーザーを追加':'この名前ではじめる';}
 function close(){modal.remove();resolve(!!Profiles.current());}
 modal.addEventListener('click',e=>{const action=e.target.closest('[data-do]')?.dataset.do;if(!action)return;try{if(action==='close'){close();return;}if(action==='add')Profiles.add(input.value);if(action==='rename')Profiles.rename(input.value);if(action==='switch')Profiles.select(select.value);syncProfileMode();render();err.textContent='設定を保存しました';if(first&&Profiles.current())close();}catch(error){err.textContent=error.message;}});
 modal.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Enter'&&e.target===input){e.preventDefault();modal.querySelector('[data-do=add]').click();}if(e.key==='Tab'){const items=[...modal.querySelectorAll('button,input,select')].filter(x=>!x.disabled);const i=items.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();items.at(-1).focus();}else if(!e.shiftKey&&i===items.length-1){e.preventDefault();items[0].focus();}}});render();input.focus();
 });}
function debugAllowed(){return !!Profiles?.isDebug();}
async function debugTools(){if(!debugAllowed())return;while(debugAllowed()){
 setLog('<p class="en">DEBUG テストツール</p><p>この操作はデバッグ専用セーブにだけ保存します。通常セーブは変更しません。</p>');
 const v=await ask([{label:'全図鑑を解放',value:'dex'},{label:'全ての現役モンスターを所持',value:'monsters'},{label:'同行をLv.15・HP/SP全回復',value:'level'},{label:'道具・10000Gを補充',value:'items'},{label:'島をすべて解放',value:'island'},{label:'地域へ移動',value:'warp'},{label:'戦闘テスト',value:'battle'},{label:'閉じる',value:null}],{cancel:null});if(!v||!debugAllowed())return;
 if(v==='dex'){S.companions.seen=Object.keys(CD.species).filter(id=>!CD.species[id].retired);S.companions.registered=[...new Set([...(S.companions.registered||[]),...S.companions.seen])];}
 if(v==='monsters'){for(const id of Object.keys(CD.species).filter(id=>!CD.species[id].retired))if(!S.companions.owned.some(m=>m.id===id))CR.add(S.companions,id,CD.species);}
 if(v==='level'){for(const m of companions()){m.lv=Math.max(m.lv,15);CR.health(m,CD.species);m.hp=m.maxHp;m.mp=m.maxMp;}}
 if(v==='items'){S.gold=Math.max(S.gold,10000);for(const id of Object.keys(S.items))S.items[id]=Math.max(S.items[id],20);}
 if(v==='island'&&typeof debugUnlockIsland==='function'){debugUnlockIsland();await sys(`島レベル${islandLevel()}・浜辺・拡張${ISLAND_PROJECTS.length}か所をすべて解放しました（${ISLE_W}×${ISLE_H}マス）`)}
 if(v==='warp'){const map=await ask([...Object.keys(MAPS).map(id=>({label:id,value:id})),{label:'戻る',value:null}],{cancel:null});if(map&&debugAllowed()){const m=MAPS[map];let pos;for(let y=1;y<m.rows.length-1&&!pos;y++)for(let x=1;x<m.rows[y].length-1;x++)if(tileAt(m,x,y)==='.'){pos={x,y};break;}if(pos)warp(map,pos.x,pos.y,0);else {await sys("この地域には安全なテスト開始地点がありません");continue;}}}
 if(v==='battle'){const key=Object.keys(ENEMIES).find(k=>!ENEMIES[k].boss&&ENEMIES[k].companion);if(key){CR.restore(S.companions,CD.species);await partyBattle(key,{keys:[key,key,key]});if(!debugAllowed())return;}}
 if(debugAllowed()){await sys(save()?'デバッグ専用データを更新しました':'保存できませんでした。ブラウザーの保存領域を確認してください');}
 }}
