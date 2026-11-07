const assert=require('node:assert/strict'),Save=require('./save-safety'),Profiles=require('./local-profiles');
function storage(initial={}){const values=new Map(Object.entries(initial));return {values,getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v))};}
const key='wordbound-profile:p1:normal',old=JSON.stringify({S:{gold:123},opt:{}}),next={S:{gold:456},opt:{}};
let s=storage({[key]:old});assert.equal(Save.read(s,key).S.gold,123);Save.write(s,key,next);assert.equal(s.getItem(Save.backupKey(key)),old);assert.equal(Save.read(s,key).S.gold,456);
Save.write(s,key,next);assert.equal(s.getItem(Save.backupKey(key)),old,'identical saves preserve useful backup');
for(const bad of ['','{','null','[]','{}','{"S":null}','{"S":[]}','{"S":{},"opt":[]}']){s=storage({[key]:bad});assert.throws(()=>Save.read(s,key));assert.throws(()=>Save.write(s,key,next));assert.equal(s.getItem(key),bad);assert.equal(Save.canRecover(s,key),false);}
s=storage();assert.equal(Save.read(s,key),null);Save.write(s,key,next);assert.equal(Save.read(s,key).S.gold,456);
s=storage({[key]:'broken',[Save.backupKey(key)]:old});assert.equal(Save.canRecover(s,key),true);Save.recover(s,key);assert.equal(s.getItem(key),old);assert.equal(s.getItem(Save.damagedKey(key)),'broken');
s.setItem(key,'second corruption');assert.throws(()=>Save.recover(s,key));assert.equal(s.getItem(key),'second corruption');assert.equal(s.getItem(Save.damagedKey(key)),'broken');
for(const failAt of [key,Save.backupKey(key)]){s=storage({[key]:old});const underlying=s.setItem;s.setItem=(k,v)=>{if(k===failAt)throw Error('quota');underlying(k,v);};assert.throws(()=>Save.write(s,key,next));assert.equal(s.getItem(key),old);}
s=storage({[key]:'broken',[Save.backupKey(key)]:old});s.setItem=()=>{throw Error('quota');};assert.throws(()=>Save.recover(s,key));assert.equal(s.getItem(key),'broken');
assert.throws(()=>Save.read({getItem(){throw Error('denied');}},key));
s=storage({[key]:old,'wordbound-profile:p1:debug':old,[Profiles.LEGACY]:old});Save.write(s,key,next);assert.equal(s.getItem('wordbound-profile:p1:debug'),old);assert.equal(s.getItem(Profiles.LEGACY),old);
for(const bad of ['','null','[]','{"version":1,"profiles":[],"current":"missing"}','{"version":1,"profiles":[{"id":"p1","name":"x"},{"id":"p1","name":"y"}]}']){s=storage({[Profiles.META]:bad});assert.throws(()=>Profiles.create(s));assert.equal(s.getItem(Profiles.META),bad);}
console.log('PASS save recovery: malformed/missing/access-denied saves, backup preservation, quota failures, recovery originals, profile/debug/legacy isolation, metadata validation');

for(const field of ['flags','items','stats','notebook','weapon','armor','island','praise'])for(const bad of [null,[],3,'bad'])assert.throws(()=>Save.decode(JSON.stringify({S:{[field]:bad}})));
for(const field of ['x','y','lv','hp','mp','gold','exp'])assert.throws(()=>Save.decode(JSON.stringify({S:{[field]:'bad'}})));
assert.doesNotThrow(()=>Save.decode('{"S":{"gold":123}}'));
console.log('PASS malformed present state containers/numbers rejected, missing historical fields accepted');
