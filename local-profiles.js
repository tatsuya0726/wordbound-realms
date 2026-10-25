/* Local browser profiles. A display name is not authentication. */
const LocalProfiles=(()=>{
 const META='wordbound-profiles-v1',LEGACY='wordbound-realms-v1',DEBUG_NAME='達也0726';
 function create(storage,uuid=()=>crypto.randomUUID()){
  let data;const raw=storage.getItem(META);try{data=raw?JSON.parse(raw):{version:1,profiles:[],current:null,legacyClaimed:false};}catch{throw Error('ユーザー設定を読めません。保存原本は変更していません。');}
  if(data.version!==1||!Array.isArray(data.profiles)||data.profiles.some(p=>!p||typeof p.name!=='string'||!/^[a-zA-Z0-9-]+$/.test(p.id))||new Set(data.profiles.map(p=>p.id)).size!==data.profiles.length)throw Error('ユーザー設定の形式が不正です');
  let debug=false;
  const current=()=>data.profiles.find(p=>p.id===data.current)||null;
  const key=(id,mode=false)=>'wordbound-profile:'+id+':'+(mode?'debug':'normal');
  const name=value=>{const n=String(value??'').trim();if(!n||[...n].length>24||/[\u0000-\u001f\u007f<>]/.test(n))throw Error('名前は1〜24文字で入力してください（制御文字・山かっこは使えません）');return n;};
  function commit(next){storage.setItem(META,JSON.stringify(next));data=next;}
  function add(value){const n=name(value);if(data.profiles.some(p=>p.name===n))throw Error('同じ名前のユーザーがいます');if(data.profiles.length>=20)throw Error('ユーザーは20人までです');const id=uuid();if(!/^[a-zA-Z0-9-]+$/.test(id)||data.profiles.some(p=>p.id===id))throw Error('ユーザーIDを作成できません');const first=!data.legacyClaimed,legacy=first?storage.getItem(LEGACY):null;if(legacy!==null){JSON.parse(legacy);if(storage.getItem(key(id))!==null)throw Error('保存先が既にあります');storage.setItem(key(id),legacy);}commit({...data,profiles:[...data.profiles,{id,name:n}],current:id,legacyClaimed:true});debug=false;return current();}
  function rename(value){const p=current();if(!p)throw Error('ユーザーを選択してください');const n=name(value);if(data.profiles.some(x=>x.id!==p.id&&x.name===n))throw Error('同じ名前のユーザーがいます');commit({...data,profiles:data.profiles.map(x=>x.id===p.id?{...x,name:n}:x)});debug=false;}
  function select(id){if(!data.profiles.some(p=>p.id===id))throw Error('ユーザーが見つかりません');commit({...data,current:id});debug=false;}
  function setDebug(on){const p=current();if(!p)throw Error('ユーザーを選択してください');if(on&&p.name!==DEBUG_NAME)throw Error('この名前ではデバッグ起動できません');if(on&&storage.getItem(key(p.id,true))===null){const normal=storage.getItem(key(p.id));if(normal!==null)storage.setItem(key(p.id,true),normal);}debug=!!on;return debug;}
  return {list:()=>data.profiles.map(p=>({...p})),current:()=>current()?{...current()}:null,add,rename,select,setDebug,isDebug:()=>debug&&current()?.name===DEBUG_NAME,eligible:()=>current()?.name===DEBUG_NAME,saveKey:()=>{if(!current())throw Error('ユーザー未選択');return key(current().id,debug&&current().name===DEBUG_NAME);},key};
 }
 return {create,META,LEGACY,DEBUG_NAME};
})();
if(typeof module!=='undefined')module.exports=LocalProfiles;
