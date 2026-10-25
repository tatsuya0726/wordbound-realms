/* Selective retirement: stable IDs, art and existing individuals remain valid. */
const RETIRED_SPECIES=new Set(["clay_pebble_chick","pebble_fin_minnow","pumice_shell_snail","soot_tail_ferret","bismuth_kingfisher","malachite_cassowary","copper_feather_condor","little_bark_gecko","cobalt_ivory_eleveneye_crownscallop","pearl_veil_astral_sovereign"]);
const UNDEAD_SPECIES=['moonflower_ghost','amber_fossil_spiral_spirit'];
const ROSTER_REPAIRS=[
  {parents:["cobalt_glass_whirlpool_spirit","ivory_coral_spiral_nautilus"],child:"copper_emerald_antler_wyvern"},
  {
    "parents": [
      "silk_leaf_caterpillar",
      "lantern_moth"
    ],
    "child": "garnet_mane_mandrill_patriarch"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "seedpod_mouse"
    ],
    "child": "bronze_plum_hammerhead_dragon"
  },
  {
    "parents": [
      "bronze_casque_scarlet_cassowary",
      "mercury_spring_blob"
    ],
    "child": "emerald_broadbeak_feather_wyrm"
  },
  {
    "parents": [
      "compass_nose_fox",
      "tamarind_cricket"
    ],
    "child": "jade_tonghorn_coralplate_dragon"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "acorn_tail_squirrel"
    ],
    "child": "jade_fuchsia_creeping_pricklypear"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "berry_shell_pillbug"
    ],
    "child": "sapphire_crowned_seahorse"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "button_mushroom_beetle"
    ],
    "child": "kelp_antler_otter"
  },
  {
    "parents": [
      "crescent_shelled_snail",
      "raindrop_duckling"
    ],
    "child": "magnet_shell_armadillo"
  },
  {
    "parents": [
      "lily_pad_frog",
      "bubble_cheek_gecko"
    ],
    "child": "cacao_pod_mantis"
  },
  {
    "parents": [
      "pea_pod_goby",
      "pebble_stacked_golem_cub"
    ],
    "child": "compass_nose_fox"
  },
  {
    "parents": [
      "puddle_jelly_blob",
      "crescent_shelled_snail"
    ],
    "child": "copper_fan_giant_anteater"
  },
  {
    "parents": [
      "paper_leaf_bat",
      "raindrop_duckling"
    ],
    "child": "button_mushroom_beetle"
  },
  {
    "parents": [
      "bubble_cheek_gecko",
      "tiny_moss_pangolin"
    ],
    "child": "crescent_shelled_snail"
  },
  {
    "parents": [
      "bubble_cheek_gecko",
      "pea_pod_goby"
    ],
    "child": "dewdrop_snail"
  },
  {
    "parents": [
      "pearl_plum_longsnout_weevil",
      "crescent_shelled_snail"
    ],
    "child": "honeydrop_grub"
  },
  {
    "parents": [
      "crescent_shelled_snail",
      "marble_eyed_newt"
    ],
    "child": "lily_pad_frog"
  },
  {
    "parents": [
      "ribbon_tailed_tadpole",
      "raindrop_duckling"
    ],
    "child": "puddle_jelly_blob"
  },
  {
    "parents": [
      "pinecone_sparrow",
      "crescent_shelled_snail"
    ],
    "child": "reed_wing_finch"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "clover_cheek_hamster"
    ],
    "child": "frost_petal_moth"
  },
  {
    "parents": [
      "pea_pod_goby",
      "tiny_fern_seahorse"
    ],
    "child": "ivory_coral_spiral_nautilus"
  },
  {
    "parents": [
      "raindrop_duckling",
      "pinecone_sparrow"
    ],
    "child": "ivory_rose_bladecrest_cockatoo"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "crescent_shelled_snail"
    ],
    "child": "lantern_seed_crab"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "honeydrop_grub"
    ],
    "child": "mercury_spring_blob"
  },
  {
    "parents": [
      "pea_pod_goby",
      "raindrop_duckling"
    ],
    "child": "pumice_pufferfish"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "little_coal_beetle"
    ],
    "child": "rainbell_heron"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "little_flint_crow"
    ],
    "child": "shale_wing_swallow"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "marble_eyed_newt"
    ],
    "child": "silver_bill_violet_shoebill"
  },
  {
    "parents": [
      "silk_leaf_caterpillar",
      "okra_tail_quokka"
    ],
    "child": "ivory_jade_seedcrown_dandelion"
  },
  {
    "parents": [
      "artichoke_wolffish",
      "spear_kingfisher"
    ],
    "child": "brass_emerald_bladejaw_fourfin_dunkleodragon"
  },
 // Every active species keeps at least one breeding recipe after retirement removed some; legends keep two.
 {"parents":["tiny_moss_pangolin","crescent_shelled_snail"],"child":"dew_antler_fawn"},
 {"parents":["pinecone_sparrow","okra_tail_quokka"],"child":"little_flint_crow"},
 {"parents":["citrus_scale_skink","pea_pod_goby"],"child":"marble_eyed_newt"},
 {"parents":["tiny_fern_seahorse","mossy_stone_axolotl"],"child":"pea_pod_goby"},
 {"parents":["teacup_hermit","autumn_red_panda"],"child":"reed_basket_mudskipper"},
 {"parents":["cobalt_glass_whirlpool_spirit","@spirit"],"child":"obsidian_bellyface_antler_oracle"}
];
for(const id of RETIRED_SPECIES)COMPANION_DATA.species[id].retired=true;
for(const id of UNDEAD_SPECIES)COMPANION_DATA.species[id].family="undead";
FAMILY_NAMES.undead="アンデッド系";
COMPANION_DATA.recipes=COMPANION_DATA.recipes.filter(r=>!RETIRED_SPECIES.has(r.child)&&!r.parents.some(id=>RETIRED_SPECIES.has(id)));
COMPANION_DATA.recipes.push(...ROSTER_REPAIRS);
function initRosterPolicy(){for(const z of Object.values(ZONES)){z.foes=z.foes.filter(key=>!RETIRED_SPECIES.has(ENEMIES[key]?.companion));}for(const id of UNDEAD_SPECIES)DEX_INFO[id]={...DEX_INFO[id],note:"魂の灯火を宿すアンデッド。骨や霊の体で旅を続ける。"};}

const UNDEAD_LORE={moonflower_ghost:"月夜の花に宿るやさしい幽霊。魂の灯火で迷子を道へ導く。",amber_fossil_spiral_spirit:"琥珀に残った古代の魂が、渦巻く光となって目覚めた。"};
const OLD_INIT_ROSTER=initRosterPolicy;initRosterPolicy=function(){OLD_INIT_ROSTER();for(const [id,eco] of Object.entries(UNDEAD_LORE))DEX_INFO[id]={...DEX_INFO[id],eco,note:eco,quote:DEX_INFO[id]?.quote||""};};
