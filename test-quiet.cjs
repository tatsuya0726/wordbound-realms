// Launches the test browser silently: audio output is muted and speech synthesis is stubbed,
// so running the tests never reads English aloud through the PC's speakers.
module.exports=async(chromium,opts={})=>{
 const browser=await chromium.launch({...opts,args:[...(opts.args||[]),'--mute-audio']});
 const silence=()=>{try{const s=window.speechSynthesis;if(s){s.speak=()=>{};s.cancel=()=>{}}}catch(e){}};
 const newPage=browser.newPage.bind(browser),newContext=browser.newContext.bind(browser);
 browser.newPage=async o=>{const p=await newPage(o);await p.addInitScript(silence);return p};
 browser.newContext=async o=>{const c=await newContext(o);await c.addInitScript(silence);return c};
 return browser};
