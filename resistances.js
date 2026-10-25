/* Hidden elemental resistances (not shown anywhere in the UI).
   Each damaging skill has an element taken from its theme; plain physical moves have none.
   Each family has one weakness and a few resisted elements:
     plant/insect/beast ← fire, aquatic/bird ← thunder, dragon/reptile ← ice, spirit ← dark, undead ← light.
   Rarer monsters shrug things off better: a weakness deals ×1.5 at ★1 down to ×1.2 at ★10 (still a weakness),
   resisted elements ×0.85 → ×0.65, other elements ×1.0 → ×0.9.
   魔王系 (demon) has no weakness and resists everything (×0.85 → ×0.7). */
const ElementResist=(()=>{
 const SKILL_ELEMENT={
  ember:'fire',dragon_flare:'fire',fire_breath:'fire',ember_tail:'fire',ember_tier2:'fire',ember_tier3:'fire',
  water_bolt:'water',wave_song:'water',water_bolt_tier2:'water',water_bolt_tier3:'water',
  spark:'thunder',thunder_rain:'thunder',spark_tier2:'thunder',spark_tier3:'thunder',
  ice_needle:'ice',blizzard:'ice',frost_bite:'ice',
  seed_shot:'plant',leaf_arrow:'plant',leaf_storm:'plant',thorn_bind:'plant',siphon_root:'plant',razor_leaf:'plant',
  stone_peck:'earth',earthquake:'earth',rock_knuckle:'earth',sand_screen:'earth',
  wing_blade:'wind',wing_sweep:'wind',
  glimmer:'light',crystal_ray:'light',star_lance:'light',moon_rain:'light',resonant_chime:'light',
  shadow_ball:'dark',soul_sip:'dark',eclipse_wave:'dark',venom_fang:'dark',venom_needle:'dark'};
 const WEAK={plant:'fire',insect:'fire',beast:'fire',aquatic:'thunder',bird:'thunder',dragon:'ice',reptile:'ice',spirit:'dark',undead:'light'};
 const RESIST={plant:['water','earth','plant'],insect:['plant','earth'],beast:['ice','earth'],aquatic:['fire','water','ice'],bird:['earth','plant'],
  dragon:['fire','plant','water'],reptile:['fire','earth'],spirit:['light','wind'],undead:['dark','ice']};
 // The player's word attack (ことばの光) shines with light.
 function element(ability){return ability?.element||SKILL_ELEMENT[ability?.id]||(ability?.command==='atk'?'light':null)}
 function speciesOf(m){const SP=COMPANION_DATA.species;return m.id&&SP[m.id]?m.id:m.companion&&SP[m.companion]?m.companion:m.worldArt&&SP[m.worldArt]?m.worldArt:null}
 function rarityOf(s){return s.rarity||({1:1,2:4,3:7,4:10})[s.tier]||1}
 function forSpecies(id,el){const s=COMPANION_DATA.species[id];if(!s||!el)return 1;const t=Math.max(0,Math.min(1,(rarityOf(s)-1)/9)),f=s.family;
  if(f==='demon')return 0.85-0.15*t;
  if(WEAK[f]===el)return 1.5-0.3*t;
  if(RESIST[f]?.includes(el))return 0.85-0.2*t;
  return 1-0.1*t}
 /* Damage multiplier for one target hit by one ability. */
 function multiplier(target,ability){const id=speciesOf(target);return id?forSpecies(id,element(ability)):1}
 return {element,multiplier,forSpecies,SKILL_ELEMENT,WEAK,RESIST};
})();
if(typeof module!=='undefined')module.exports=ElementResist;
