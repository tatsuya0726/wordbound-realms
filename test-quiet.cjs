// Launches the test browser silently: audio output is muted and speech synthesis is stubbed,
// so running the tests never reads English aloud through the PC's speakers.
// Every page also starts with one local user profile ("テスト"), so the first-launch name prompt
// (local-profiles.js) does not block the title menu; saves then go to that profile's key.
module.exports=async(chromium,opts={})=>{
 const browser=await chromium.launch({...opts,args:[...(opts.args||[]),'--mute-audio']});
 const prepare=()=>{try{const s=window.speechSynthesis;if(s){s.speak=()=>{};s.cancel=()=>{}}}catch(e){}
  try{if(!localStorage.getItem('wordbound-profiles-v1'))localStorage.setItem('wordbound-profiles-v1',JSON.stringify({version:1,profiles:[{id:'test-user',name:'テスト'}],current:'test-user',legacyClaimed:true}))}catch(e){}};
 const newPage=browser.newPage.bind(browser),newContext=browser.newContext.bind(browser);
 browser.newPage=async o=>{const p=await newPage(o);await p.addInitScript(prepare);return p};
 browser.newContext=async o=>{const c=await newContext(o);await c.addInitScript(prepare);return c};
 return browser};
