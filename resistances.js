/* Elements and hidden resistances.
   Six elements: 火 fire, 水 water, 雷 thunder, 風 wind, 闇 dark, 聖 holy. Each skill's element is shown with
   its name (elementTag); the resistance numbers themselves stay hidden.
   Weak and resisted elements come from each monster's look (look-weakness.js), shown in the bestiary as 弱点.
   The family tables below are only a fallback for monsters without an entry (retired ones).
   Rarer monsters shrug things off better: a weakness deals ×1.5 at ★1 down to ×1.2 at ★10 (still a weakness),
   resisted elements ×0.85 → ×0.65, other elements ×1.0 → ×0.9.
   魔王系 (demon) has no weakness and resists everything (×0.85 → ×0.7) except 聖, which still gets through (×1.15 → ×1.05). */
const ElementResist=(()=>{
 const ELEMENTS={fire:'火',water:'水',thunder:'雷',wind:'風',dark:'闇',holy:'聖'};
 // Keyed by skill series (tier2/tier3 share their base skill's element).
 const SKILL_ELEMENT={
  ember:'fire',dragon_flare:'fire',fire_breath:'fire',ember_tail:'fire',
  water_bolt:'water',wave_song:'water',ice_needle:'water',blizzard:'water',frost_bite:'water',foam_curtain:'water',sea_blessing:'water',pure_drop:'water',
  spark:'thunder',thunder_rain:'thunder',thunder_stun:'thunder',
  wing_blade:'wind',wing_sweep:'wind',leaf_storm:'wind',razor_leaf:'wind',crescent_slash:'wind',sand_screen:'wind',fragrant_breeze:'wind',
  shadow_ball:'dark',soul_sip:'dark',eclipse_wave:'dark',venom_fang:'dark',venom_needle:'dark',shadow_dust:'dark',poison_spore:'dark',toxic_mist:'dark',
  glimmer:'holy',crystal_ray:'holy',star_lance:'holy',moon_rain:'holy',resonant_chime:'holy',expose_light:'holy',moon_heal:'holy',star_sanctuary:'holy',purge_chime:'holy',soul_return:'holy'};
 // Older per-family native skills (species without a catalog assignment), by their move name.
 const NAME_ELEMENT=[[/火花|息吹|ほのお|火炎|ひのこ/,'fire'],[/水紋|波|潮|しずく|あわ/,'water'],[/雷|いなずま/,'thunder'],[/風|嵐/,'wind'],[/魂|かげ|影|闇|どく/,'dark'],[/光の灯|ひかり|聖/,'holy']];
 const WEAK={beast:['fire'],plant:['fire'],insect:['wind','fire'],bird:['thunder'],dragon:['wind'],spirit:['dark'],aquatic:['thunder'],undead:['holy']};
 const RESIST={beast:['dark'],bird:['wind'],insect:['dark'],plant:['water','thunder'],dragon:['fire','water'],spirit:['holy','wind'],aquatic:['fire','water'],undead:['dark','water']};
 const LETTER={f:'fire',w:'water',t:'thunder',a:'wind',d:'dark',h:'holy'},lookCache={};
 /* {weak:[...],resist:[...]} for one species: its look entry, else its family's fallback. */
 function traits(id){const s=COMPANION_DATA.species[id];if(!s)return {weak:[],resist:[]};if(s.family==='demon')return {weak:[],resist:[]};
  const v=typeof LOOK_WEAKNESS!=='undefined'?LOOK_WEAKNESS[s.name]:undefined;if(v===undefined)return {weak:WEAK[s.family]||[],resist:RESIST[s.family]||[]};
  return lookCache[id]??={weak:[...v.split('/')[0]].map(c=>LETTER[c]),resist:[...(v.split('/')[1]||'')].map(c=>LETTER[c])}}
 const series=id=>String(id||'').replace(/_tier\d+$/,'');
 // The player's word attack (ことばの光) shines with holy light.
 function element(ability){if(!ability)return null;if(ability.element)return ability.element;const e=SKILL_ELEMENT[series(ability.id)];if(e)return e;
  if(ability.command==='atk')return 'holy';
  if(typeof ability.id==='string'&&ability.id.startsWith('native:')){const n=String(ability.name||'').split('・').pop();for(const [re,el] of NAME_ELEMENT)if(re.test(n))return el}
  return null}
 /* Small coloured badge for a skill's element; attacks without one show 無, support moves without one show nothing. */
 const DAMAGING=new Set(['damage','allDamage','drain']);
 function tag(ability){const e=element(ability);if(e)return `<span class="el el-${e}" title="${ELEMENTS[e]}属性">${ELEMENTS[e]}</span>`;
  const parts=ability?.effects||[{effect:ability?.effect}];return parts.some(p=>DAMAGING.has(p?.effect))?'<span class="el el-none" title="無属性">無</span>':''}
 function speciesOf(m){const SP=COMPANION_DATA.species;return m.id&&SP[m.id]?m.id:m.companion&&SP[m.companion]?m.companion:m.worldArt&&SP[m.worldArt]?m.worldArt:null}
 function rarityOf(s){return s.rarity||({1:1,2:4,3:7,4:10})[s.tier]||1}
 function forSpecies(id,el){const s=COMPANION_DATA.species[id];if(!s||!el)return 1;const t=Math.max(0,Math.min(1,(rarityOf(s)-1)/9)),f=s.family;
  if(f==='demon')return el==='holy'?1.15-0.1*t:0.85-0.15*t;
  const tr=traits(id);
  if(tr.weak.includes(el))return 1.5-0.3*t;
  if(tr.resist.includes(el))return 0.85-0.2*t;
  return 1-0.1*t}
 /* Damage multiplier for one target hit by one ability. */
 function multiplier(target,ability){const id=speciesOf(target);return id?forSpecies(id,element(ability)):1}
 /* Bestiary line: weakness badges (魔王系: none, 聖 gets through a little). */
 function weakHtml(id){const s=COMPANION_DATA.species[id];if(s?.family==='demon')return 'なし（聖が少し効く）';const w=traits(id).weak;return w.length?w.map(e=>`<span class="el el-${e}">${ELEMENTS[e]}</span>`).join(''):'なし'}
 return {element,tag,traits,weakHtml,multiplier,forSpecies,ELEMENTS,SKILL_ELEMENT,WEAK,RESIST};
})();
const elementTag=a=>ElementResist.tag(a);
if(typeof module!=='undefined')module.exports=ElementResist;
