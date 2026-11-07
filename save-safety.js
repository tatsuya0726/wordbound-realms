/* Save envelopes stay {S,opt}; recovery copies are isolated per profile/mode. */
const SaveSafety=(()=>{
 const backupKey=key=>key+'-previous';
 const damagedKey=key=>key+'-unreadable';
 function decode(raw){
  let value;try{value=JSON.parse(raw);}catch{throw Error('保存データを読めません。原本は変更していません。');}
  if(!value||typeof value!=='object'||Array.isArray(value)||!value.S||typeof value.S!=='object'||Array.isArray(value.S)||value.opt!=null&&(typeof value.opt!=='object'||Array.isArray(value.opt)))throw Error('保存データの形式を確認できません。原本は変更していません。');
  // Missing fields belong to historical saves and are supplied by newState/migrations.
  // Explicitly malformed containers must not reach renderers or mutate live state.
  for(const field of ['flags','items','stats','notebook','weapon','armor','island','praise']){
   if(Object.hasOwn(value.S,field)&&(!value.S[field]||typeof value.S[field]!=='object'||Array.isArray(value.S[field])))throw Error('保存データの項目を確認できません。原本は変更していません。');
  }
  for(const field of ['x','y','lv','hp','mp','gold','exp'])if(Object.hasOwn(value.S,field)&&!Number.isFinite(value.S[field]))throw Error('保存データの数値を確認できません。原本は変更していません。');
  if(Object.hasOwn(value.S,'map')&&typeof value.S.map!=='string')throw Error('保存データの地図を確認できません。原本は変更していません。');
  if(value.S.companions!=null&&(typeof value.S.companions!=='object'||Array.isArray(value.S.companions)))throw Error('仲間データを確認できません。原本は変更していません。');
  return value;
 }
 function read(storage,key){const raw=storage.getItem(key);return raw===null?null:decode(raw);}
 function write(storage,key,value){
  const next=JSON.stringify(value);decode(next);
  const previous=storage.getItem(key);
  // Refuse to silently replace unreadable data, even if called outside title().
  if(previous!==null){decode(previous);if(previous!==next)storage.setItem(backupKey(key),previous);}
  storage.setItem(key,next);return true;
 }
 function canRecover(storage,key){try{return !!read(storage,backupKey(key));}catch{return false;}}
 function recover(storage,key){
  const backup=storage.getItem(backupKey(key));if(backup===null)throw Error('復元できる控えがありません。');decode(backup);
  const original=storage.getItem(key);
  // Keep the unreadable original before replacing it. Never overwrite a different recovery copy.
  if(original!==null){const held=storage.getItem(damagedKey(key));if(held!==null&&held!==original)throw Error('以前の原本が保管されています。復元を中止しました。');storage.setItem(damagedKey(key),original);}
  storage.setItem(key,backup);return decode(backup);
 }
 return {decode,read,write,canRecover,recover,backupKey,damagedKey};
})();
if(typeof module!=='undefined')module.exports=SaveSafety;
