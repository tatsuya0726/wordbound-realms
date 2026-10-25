/* Screen mode (設定「画面モード」): 自動 / スマホ / TV / PC.
   スマホ: touch controls fully shown, larger buttons, slightly closer camera.
   TV: no touch controls, larger text and windows, margins for TV overscan.
   PC: no touch controls (keyboard/mouse), more of the map on screen.
   The choice is kept per device in localStorage so it applies from the title screen, and copied into opt. */
const SCREEN_MODES={auto:'自動',phone:'スマホ',tv:'TV',pc:'PC'},SCREEN_KEY='wordbound-screen';
function screenMode(){try{return SCREEN_MODES[localStorage.getItem(SCREEN_KEY)]?localStorage.getItem(SCREEN_KEY):'auto'}catch(e){return 'auto'}}
function applyScreenMode(m=screenMode()){document.body.dataset.screen=m;dispatchEvent(new Event('resize'))}
function setScreenMode(m){try{localStorage.setItem(SCREEN_KEY,m)}catch(e){}if(typeof opt!=='undefined')opt.screen=m;applyScreenMode(m)}
function cycleScreenMode(){const order=Object.keys(SCREEN_MODES),m=order[(order.indexOf(screenMode())+1)%order.length];setScreenMode(m);return m}
/* How much larger field tiles are drawn in this mode (1 = automatic size). */
function screenTileFactor(){return {phone:1.1,pc:.8}[document.body.dataset.screen]||1}
applyScreenMode();
