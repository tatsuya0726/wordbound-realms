/* Battle backdrops: painted pixel-art scenes (assets/battle/*.webp, from Drive ゲーム用モンスター素材/戦闘背景)
   chosen to fit where the fight happens. Each area has a few scenes and one is picked per battle; bosses and
   arena matches get their own. Images load when first needed; until then the tiled ground is drawn. */
const BACKDROPS={
 meadow:['amber_daylily_greenstone_summer_meadow','acacia_rainshelf_fresh_savanna','blackthorn_blossom_hedgebank_spring_pasture'],
 forest:['amber_chestnut_burrs_creek_grass_glade','black_bamboo_celadon_grass_glade','broad_birds_nest_fern_fallen_trunk_rainforest_grass'],
 w1:['beechwood_edge_terraced_valley','brick_viaduct_shadow_spring_grass_common','amber_willow_twilight_river_common'],
 cave:['amber_flowstone_curtain_cavern','azurite_coppervein_limestone_cavern','black_flint_seam_moonlit_chalk_cavern'],
 sky:['alpine_cloud_bridge','blue_agapanthus_ceramic_moonlit_skygarden','apricot_brugmansia_cane_awning_dusk_skyterrace'],
 underground:['blue_celestite_limestone_geode_cavern','black_tourmaline_milky_quartz_cavern','azurite_coppervein_limestone_cavern'],
 desert:['ancient_desert_stepwell_twilight','black_saltpan_rose_mesa_bluehour_desert','basalt_ring_desert_copper_dawn'],
 ruins:['ancient_aqueduct_cistern','ancient_sealed_sarcophagus_crypt','frontier_grassland_watchtower_ruins'],
 w2:['autumn_lakeside_harbor_sunset','amber_kelp_stormwrack_silver_beach','banksia_seafog_coastal_grass_terrace'],
 volcano:['ash_buried_pine_lava_river_clearing','basalt_overhang_volcanic_vista'],
 volcanic:['basalt_overhang_volcanic_vista','ash_buried_pine_lava_river_clearing'],
 dream:['astral_void_terrace','aurora_hoarfrost_open_grassland','moonlit_haunted_marsh'],
 tower:['clock_tower_mechanism_twilight','alchemist_tower_laboratory','cobalt_vault_sand_buried_palace_hall'],
 snow:['aurora_snow_mountain_pass'],
 arena:['ancient_tournament_colosseum']};
/* Boss fights take place in a scene of their own. */
const BOSS_BACKDROP={meadowking:'ancient_giant_tree_hollow',skyowl:'airship_deck_sunrise',crystalmole:'abandoned_crystal_dragon_nest',
 nightmare:'abyssal_trench_hydrothermal_rift',silencer:'clock_tower_mechanism_twilight',mumble:'cobalt_vault_sand_buried_palace_hall',
 sphinx:'ancient_desert_stepwell_twilight',embergolem:'ash_buried_pine_lava_river_clearing'};
const BACKDROP_IMG={};
function backdropImage(name){let im=BACKDROP_IMG[name];if(!im){im=BACKDROP_IMG[name]=new Image();im.src='assets/battle/'+name+'.webp'}return im}
/* Which scene this battle uses: arena cups → colosseum, bosses → their scene, otherwise one of the area's scenes. */
function pickBackdrop(){
 const keys=B.enemies.map(e=>e.key),boss=keys.find(k=>BOSS_BACKDROP[k]);if(boss)return BOSS_BACKDROP[boss];
 if(keys.some(k=>k.startsWith('ar_')))return BACKDROPS.arena[0];
 if(keys.every(k=>/ice|frost|glacier|snow/.test(k)))return BACKDROPS.snow[0];   // a pack of ice monsters fights in the snow
 const zone=typeof zoneKey==='function'?zoneKey():'w1',set=BACKDROPS[zone]||(MAPS[S.map]?.indoor?BACKDROPS.tower:BACKDROPS.w1);
 return set[Math.floor(Math.random()*set.length)]}
/* Draws the backdrop to fill the battle screen. Returns false while the image is still loading. */
function drawBattleBackdrop(){if(!B)return false;B.backdrop=B.backdrop||pickBackdrop();const im=backdropImage(B.backdrop);if(!im.complete||!im.naturalWidth)return false;
 const W=VIEW.w,H=VIEW.h,scale=Math.max(W/im.width,H/im.height),sw=W/scale,sh=H/scale;
 ctx.imageSmoothingEnabled=scale<1;ctx.imageSmoothingQuality='high';ctx.drawImage(im,(im.width-sw)/2,(im.height-sh)*.6,sw,sh,0,0,W,H);ctx.imageSmoothingEnabled=false;
 // Soft shade at the bottom keeps the command windows readable over bright scenes.
 const g=ctx.createLinearGradient(0,H*.55,0,H);g.addColorStop(0,'#00000000');g.addColorStop(1,'#00000066');ctx.fillStyle=g;ctx.fillRect(0,H*.55,W,H*.45);return true}
