/* Reviewed existing art; explicit additive recipes preserve prior combinations. */
const RARE_MONSTERS=[
  {
    "id": "obsidian_ivory_threeface_fourarm_spadetail_demonlord",
    "name": "三面魔王",
    "family": "spirit",
    "rarity": 10,
    "note": "三つの顔と四本の腕で古い契約を守る魔王。"
  },
  {
    "id": "jade_violet_fiveeye_mouthless_serpent_demonking",
    "name": "五眼の蛇魔王",
    "family": "reptile",
    "rarity": 10,
    "note": "五つの眼で遠くを見通す、静かな蛇の王。"
  },
  {
    "id": "amethyst_ivory_chesteye_frillgill_salamander_demonking",
    "name": "魔眼のサラマンダー王",
    "family": "dragon",
    "rarity": 10,
    "note": "胸の魔眼と紫の飾り鰓を持つ火の王。"
  },
  {
    "id": "obsidian_ivory_headless_chestface_demonking",
    "name": "首なしの魔王",
    "family": "spirit",
    "rarity": 10,
    "note": "胸に宿る顔で言葉を紡ぐ、首なき守護者。"
  },
  {
    "id": "indigo_ivory_trunkeye_fourtusk_mammoth_demonlord",
    "name": "四牙のマンモス魔王",
    "family": "beast",
    "rarity": 10,
    "note": "四本の牙と大きな盾で仲間を守る魔王。"
  },
  {
    "id": "obsidian_ivory_fourwing_crescentfan_owl_demon",
    "name": "四翼の魔梟",
    "family": "bird",
    "rarity": 7,
    "note": "四枚の翼を広げ、夜の空を見張る梟。"
  },
  {
    "id": "midnight_ivory_threehead_moutheye_fox_uma",
    "name": "三つ首の妖狐",
    "family": "beast",
    "rarity": 7,
    "note": "三つの首がそれぞれ違う夢を語る妖狐。"
  },
  {
    "id": "charcoal_ivory_blindface_sixantlereye_nightantelope_uma",
    "name": "六眼角の夜羚羊",
    "family": "beast",
    "rarity": 7,
    "note": "角に宿る六つの眼で暗い森の道を探す。"
  },
  {
    "id": "indigo_amber_eyewing_mothman",
    "name": "魔眼翼のモスマン",
    "family": "insect",
    "rarity": 7,
    "note": "眼の模様がある大きな翼で、夜霧を払う。"
  },
  {
    "id": "ivory_tripod_moonmirror_uma",
    "name": "月鏡の三脚獣",
    "family": "spirit",
    "rarity": 7,
    "note": "月を映す輪と三本の脚を持つ不思議な獣。"
  },
  {
    "id": "sage_ivory_twinhead_winewing_twoleg_wyvern",
    "name": "双頭の飛竜",
    "family": "dragon",
    "rarity": 7,
    "note": "二つの頭で風を読み、赤い翼で舞う飛竜。"
  },
  {
    "id": "cobalt_silver_threehead_jademace_hydra",
    "name": "翡翠槌の三頭ヒュドラ",
    "family": "dragon",
    "rarity": 10,
    "note": "三つの頭と翡翠色の尾槌を持つ海の竜。"
  },
  {
    "id": "burgundy_ivory_fourclaw_spikewheel_ouroboros_dragon",
    "name": "荊輪のウロボロス",
    "family": "dragon",
    "rarity": 10,
    "note": "輪になった体と棘で、古い宝を守る竜。"
  },
  {
    "id": "ivory_jade_sixwing_serpentine_amphiptere",
    "name": "六翼の天蛇",
    "family": "dragon",
    "rarity": 7,
    "note": "六枚の翼で雲を渡る、白い天の蛇。"
  },
  {
    "id": "brass_emerald_bladejaw_fourfin_dunkleodragon",
    "name": "鋼顎の古代海竜",
    "family": "aquatic",
    "rarity": 7,
    "note": "鎧のような鱗と鋼の顎を持つ古代の海竜。"
  },
  {
    "id": "obsidian_gold_foureye_hoodcrest_cobra_wyrm",
    "name": "四眼の冠蛇竜",
    "family": "reptile",
    "rarity": 7,
    "note": "四つの眼と金色の冠飾りを持つ蛇竜。"
  },
  {
    "id": "black_prism_six_mask_sovereign",
    "name": "黒晶の仮面王",
    "family": "spirit",
    "rarity": 10,
    "note": "六つの仮面に異なる記憶を宿す黒晶の王。"
  },
  {
    "id": "crimson_mirror_sixarm_judge",
    "name": "六腕の鏡審判者",
    "family": "spirit",
    "rarity": 10,
    "note": "六本の腕と赤い鏡で、言葉の真意を測る。"
  },
  {
    "id": "ivory_labyrinth_sovereign",
    "name": "迷宮甲の覇王",
    "family": "reptile",
    "rarity": 10,
    "note": "迷路模様の甲羅に、忘れられた道を刻む。"
  },
  {
    "id": "amber_lantern_sixleg_qilin",
    "name": "灯籠の六脚麒麟",
    "family": "beast",
    "rarity": 7,
    "note": "六本の脚で旅し、灯籠の光で道を照らす麒麟。"
  },
  {
    "id": "volcanic_gryphon",
    "name": "火山のグリフォン",
    "family": "bird",
    "rarity": 7,
    "note": "炎の色の翼を広げ、火山の風を乗りこなす。"
  },
  {
    "id": "jade_bamboo_cathedral_titan",
    "name": "竹林の巨神",
    "family": "plant",
    "rarity": 10,
    "note": "竹林の聖堂を背負い、森の静けさを守る巨神。"
  },
  {
    "id": "ruby_club_mantis_shrimp_leviathan",
    "name": "紅玉拳の海王",
    "family": "aquatic",
    "rarity": 10,
    "note": "紅玉の拳と鮮やかな殻を持つ深海の王。"
  },
  {
    "id": "cinnabar_kiln_titan",
    "name": "朱窯の巨兵",
    "family": "spirit",
    "rarity": 7,
    "note": "朱色の窯から生まれ、温かな炎を守る巨兵。"
  }
];
const RARE_RECIPES=[
  {
    "parents": [
      "bronze_casque_scarlet_cassowary",
      "charcoal_ivory_copperbill_tuftedpuffin"
    ],
    "child": "obsidian_ivory_fourwing_crescentfan_owl_demon"
  },
  {
    "parents": [
      "buckwheat_capybara",
      "compass_nose_fox"
    ],
    "child": "midnight_ivory_threehead_moutheye_fox_uma"
  },
  {
    "parents": [
      "buckwheat_capybara",
      "copper_fan_giant_anteater"
    ],
    "child": "charcoal_ivory_blindface_sixantlereye_nightantelope_uma"
  },
  {
    "parents": [
      "amber_lantern_firefly",
      "amber_stag_beetle"
    ],
    "child": "indigo_amber_eyewing_mothman"
  },
  {
    "parents": [
      "amber_fossil_spiral_spirit",
      "celadon_violet_cyclopean_windchime"
    ],
    "child": "ivory_tripod_moonmirror_uma"
  },
  {
    "parents": [
      "quartz_backed_salamander",
      "amber_fossil_spiral_spirit"
    ],
    "child": "sage_ivory_twinhead_winewing_twoleg_wyvern"
  },
  {
    "parents": [
      "quartz_backed_salamander",
      "amber_lantern_firefly"
    ],
    "child": "ivory_jade_sixwing_serpentine_amphiptere"
  },
  {
    "parents": [
      "artichoke_wolffish",
      "bismuth_kingfisher"
    ],
    "child": "brass_emerald_bladejaw_fourfin_dunkleodragon"
  },
  {
    "parents": [
      "amethyst_trumpet_chameleon",
      "cork_bud_caiman"
    ],
    "child": "obsidian_gold_foureye_hoodcrest_cobra_wyrm"
  },
  {
    "parents": [
      "buckwheat_capybara",
      "indigo_silver_mane_okapi"
    ],
    "child": "amber_lantern_sixleg_qilin"
  },
  {
    "parents": [
      "bronze_casque_scarlet_cassowary",
      "copper_sorrel_secretarybird"
    ],
    "child": "volcanic_gryphon"
  },
  {
    "parents": [
      "amber_fossil_spiral_spirit",
      "cobalt_glass_whirlpool_spirit"
    ],
    "child": "cinnabar_kiln_titan"
  },
  {
    "parents": [
      "cinnabar_kiln_titan",
      "clockwork_seed_golem"
    ],
    "child": "obsidian_ivory_threeface_fourarm_spadetail_demonlord"
  },
  {
    "parents": [
      "obsidian_gold_foureye_hoodcrest_cobra_wyrm",
      "obsidian_tortoise"
    ],
    "child": "jade_violet_fiveeye_mouthless_serpent_demonking"
  },
  {
    "parents": [
      "amber_slate_ribwing_ankylodragon",
      "brass_throat_frill_dragon"
    ],
    "child": "amethyst_ivory_chesteye_frillgill_salamander_demonking"
  },
  {
    "parents": [
      "cinnabar_kiln_titan",
      "ivory_crescent_shouldereye_dreambeast"
    ],
    "child": "obsidian_ivory_headless_chestface_demonking"
  },
  {
    "parents": [
      "amber_lantern_sixleg_qilin",
      "burgundy_ivory_sapphireplate_okapi"
    ],
    "child": "indigo_ivory_trunkeye_fourtusk_mammoth_demonlord"
  },
  {
    "parents": [
      "amber_slate_ribwing_ankylodragon",
      "bronze_plum_hammerhead_dragon"
    ],
    "child": "cobalt_silver_threehead_jademace_hydra"
  },
  {
    "parents": [
      "amber_slate_ribwing_ankylodragon",
      "cobalt_horn_goat_chimera"
    ],
    "child": "burgundy_ivory_fourclaw_spikewheel_ouroboros_dragon"
  },
  {
    "parents": [
      "cinnabar_kiln_titan",
      "ivory_mask_ruby_dreambeast"
    ],
    "child": "black_prism_six_mask_sovereign"
  },
  {
    "parents": [
      "cinnabar_kiln_titan",
      "ivory_tripod_moonmirror_uma"
    ],
    "child": "crimson_mirror_sixarm_judge"
  },
  {
    "parents": [
      "obsidian_gold_foureye_hoodcrest_cobra_wyrm",
      "amber_ivory_jawshield_antlion"
    ],
    "child": "ivory_labyrinth_sovereign"
  },
  {
    "parents": [
      "pitcher_plant_dragon",
      "pomegranate_hydra_tree"
    ],
    "child": "jade_bamboo_cathedral_titan"
  },
  {
    "parents": [
      "brass_emerald_bladejaw_fourfin_dunkleodragon",
      "celestial_jellyfish"
    ],
    "child": "ruby_club_mantis_shrimp_leviathan"
  }
];
for(const m of RARE_MONSTERS)COMPANION_DATA.species[m.id]={name:m.name,img:"assets/monsters/"+m.id+".png",power:m.rarity===7?6:8,rarity:m.rarity,family:m.family,fusionOnly:true};
COMPANION_DATA.recipes.push(...RARE_RECIPES);
function initRareMonsters(){for(const m of RARE_MONSTERS)DEX_INFO[m.id]={habitat:"配合限定",note:m.note,eco:m.note};}
