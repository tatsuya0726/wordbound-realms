/* Keyboard and standard-mapped controllers. Loaded after the main game script.
   Does not own save data, combat state, or the touch joystick. */
(function () {
 'use strict';
 const DEADZONE=.32, FIRST_REPEAT=380, REPEAT=135;
 let padIndex=null, previous={}, lastDir=-1, repeatAt=0, ownedDir=-1;
 let suspended=false, neutralRequired=true, lastMenu=null;
 const visible=el=>!!el&&!el.hidden&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
 const editable=el=>!!el?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
 const modal=()=>[...document.querySelectorAll('[aria-modal="true"],dialog[open]')].filter(visible).at(-1);
 const controls=root=>[...root.querySelectorAll('button,[href],input,select,textarea,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&visible(el));
 function release(){if(ownedDir>=0&&heldDir===ownedDir)heldDir=-1;ownedDir=-1;lastDir=-1;repeatAt=0;}
 function reset(){release();previous={};neutralRequired=true;}
 function focus(el){el?.focus({preventScroll:true});el?.scrollIntoView({block:'nearest',inline:'nearest'});}
 function move(delta){
  if(document.getElementById('tapStart'))return;
  const dialog=modal();
  if(dialog){const list=controls(dialog);if(!list.length)return;const i=list.indexOf(document.activeElement);focus(list[(i+delta+list.length)%list.length]);return;}
  if(nav.done){navMove(delta);focus(nav.btns[nav.i]);}
 }
 function activate(cancel){
  const tap=document.getElementById('tapStart');
  if(tap){if(!cancel)tap.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}));return;}
  const dialog=modal();
  if(dialog){
   if(cancel){const close=dialog.querySelector('[data-do="close"],#atlasClose,[data-close]');if(close&&!close.disabled)close.click();}
   else if(!editable(document.activeElement)){const el=dialog.contains(document.activeElement)?document.activeElement:controls(dialog)[0];if(el?.matches('button,[role="button"],a'))el.click();}
   return;
  }
  if(cancel)pressB();else pressA();
 }
 const down=(pad,i)=>!!pad.buttons[i]&&(pad.buttons[i].pressed||pad.buttons[i].value>.5);
 function direction(pad){
  const up=down(pad,12),right=down(pad,15),bottom=down(pad,13),left=down(pad,14);
  if(up!==bottom)return up?0:2;if(left!==right)return right?1:3;
  const x=Number(pad.axes[0])||0,y=Number(pad.axes[1])||0;
  if(Math.max(Math.abs(x),Math.abs(y))<DEADZONE)return -1;
  return Math.abs(x)>Math.abs(y)?(x>0?1:3):(y>0?2:0);
 }
 function poll(now){
  if(suspended||document.hidden){reset();return;}
  let pads;try{pads=navigator.getGamepads?.()||[];}catch(_){reset();return;}
  const connected=Array.from(pads).filter(p=>p&&p.connected&&p.mapping==='standard');
  let pad=connected.find(p=>p.index===padIndex)||connected[0];
  if(!pad){if(padIndex!==null){padIndex=null;document.body.removeAttribute('data-controller');announce('コントローラーの接続が切れました。キーボード・タッチ操作を使えます。');}reset();return;}
  if(padIndex!==pad.index){reset();padIndex=pad.index;document.body.dataset.controller='standard';announce('コントローラー接続：左スティック・十字キーで移動、下のボタンで決定、右のボタンで戻る。');}
  const dir=direction(pad),buttons={a:down(pad,0),b:down(pad,1),menu:down(pad,9)};
  const any=dir>=0||Object.values(buttons).some(Boolean);
  if(neutralRequired){previous=buttons;if(!any)neutralRequired=false;return;}
  // A held button must never carry through a new menu or form.
  const tap=document.getElementById('tapStart'),context=tap||modal()||nav.done;
  if(context!==lastMenu){release();lastMenu=context;previous=buttons;neutralRequired=any;return;}
  if(!tap&&editable(document.activeElement)){release();previous=buttons;neutralRequired=any;return;}
  if(dir>=0){
   if(context){releaseMovement();if(dir!==lastDir||now>=repeatAt){move(dir===0||dir===3?-1:1);repeatAt=now+(dir===lastDir?REPEAT:FIRST_REPEAT);}}
   else if(mode==='walk'&&!busy){heldDir=dir;ownedDir=dir;}
  }else releaseMovement();
  lastDir=dir;
  if(buttons.b&&!previous.b||buttons.menu&&!previous.menu)activate(true);
  else if(buttons.a&&!previous.a)activate(false);
  previous=buttons;
 }
 function releaseMovement(){if(ownedDir>=0&&heldDir===ownedDir)heldDir=-1;ownedDir=-1;}
 const status=document.createElement('div');status.id='controllerStatus';status.className='input-sr-only';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.append(status);
 function announce(text){status.textContent=text;}
 document.addEventListener('focusin',e=>{
  const i=nav.btns.indexOf(e.target);if(i>=0&&!e.target.disabled){nav.i=i;hl();}
  if(editable(e.target)){heldDir=-1;reset();}else if(modal()){heldDir=-1;releaseMovement();}
 });
 document.addEventListener('keydown',e=>{
  document.body.dataset.input='keyboard';
  const dialog=modal();
  if(e.code==='Tab'&&dialog){const list=controls(dialog);if(list.length){const i=list.indexOf(document.activeElement);if(i<0||e.shiftKey&&i===0||!e.shiftKey&&i===list.length-1){e.preventDefault();focus(e.shiftKey?list.at(-1):list[0]);}}return;}
  if(editable(e.target)){heldDir=-1;if(!dialog)e.stopPropagation();return;}
  if(dialog){
   // Keep the original dialog's Escape and form handlers, but never leak to gameplay.
   if(!dialog.dataset.inputGuard){dialog.dataset.inputGuard='true';dialog.addEventListener('keydown',event=>event.stopPropagation());}
   return;
  }
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.code in KDIR)releaseMovement();
  if(nav.done&&['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'].includes(e.code)){
   e.preventDefault();e.stopImmediatePropagation();move(e.code==='ArrowUp'||e.code==='ArrowLeft'?-1:1);return;
  }
  const target=e.target.closest?.('button,a[href],summary,[role="button"]');
  if(target&&!nav.btns.includes(target)&&['Enter','Space'].includes(e.code)){
   e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)target.click();
  }
 },true);
 document.addEventListener('pointerdown',()=>{document.body.dataset.input='pointer';release();},true);
 window.addEventListener('blur',()=>{suspended=true;heldDir=-1;reset();});
 window.addEventListener('focus',()=>{suspended=false;reset();});
 document.addEventListener('visibilitychange',()=>{heldDir=-1;reset();});
 window.addEventListener('gamepaddisconnected',()=>reset());
 function frame(now){poll(now);requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
 // Pure decoder exported for focused regression tests, not a fake hardware connection.
 window.AccessibleInput=Object.freeze({direction,deadzone:DEADZONE});
})();
