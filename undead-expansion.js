/* Thirty approved undead designs. Original IDs, saves and existing recipes remain untouched. */
const UNDEAD_EXPANSION=[
  {
    "id": "undead_bone_chick",
    "name": "コツリ",
    "rarity": 1,
    "power": 2,
    "zone": "meadow",
    "habitat": "はじまりの草原",
    "eco": "卵殻をかぶった小さな骨ひよこ。殻を鳴らして仲間の居場所を知らせる。",
    "skills": [
      "stone_peck",
      "nest_rest",
      "soul_return"
    ]
  },
  {
    "id": "undead_sleepflame_snail",
    "name": "ネムロ",
    "rarity": 1,
    "power": 2,
    "zone": "dream",
    "habitat": "夢の回廊",
    "eco": "眠そうな目と骨の巻き貝を持つ幽霊マイマイ。夢の道をゆっくりたどる。",
    "skills": [
      "scale_guard",
      "sleep_pollen",
      "moon_heal"
    ]
  },
  {
    "id": "undead_bandage_rabbit",
    "name": "マミル",
    "rarity": 2,
    "power": 3,
    "zone": "forest",
    "habitat": "森",
    "eco": "長い耳と鈴が特徴の包帯うさぎ。跳ねるたびに鈴がやさしく響く。",
    "skills": [
      "quick_claw",
      "resonant_chime",
      "soul_return"
    ]
  },
  {
    "id": "undead_candle_monk",
    "name": "ルミィ",
    "rarity": 2,
    "power": 3,
    "zone": "cave",
    "habitat": "ささやきの洞窟",
    "eco": "青い魂火を灯すろうそくの亡霊。焦げたマッチで消えかけた灯を守る。",
    "skills": [
      "ember",
      "glimmer",
      "phoenix_seed"
    ]
  },
  {
    "id": "undead_bone_puffer",
    "name": "ポロック",
    "rarity": 3,
    "power": 3,
    "zone": "w2",
    "habitat": "海岸",
    "eco": "丸い骨の体と釣り針のお守りを持つ魚。潮に流された魂を港へ案内する。",
    "skills": [
      "water_bolt",
      "venom_needle",
      "foam_curtain"
    ]
  },
  {
    "id": "undead_umbrella_ghost",
    "name": "カサネ",
    "rarity": 2,
    "power": 3,
    "zone": "forest",
    "habitat": "森",
    "eco": "一本の骨脚で跳ねる古い和傘の幽霊。雨の夜は迷子に傘を差し出す。",
    "skills": [
      "wing_blade",
      "mist_song",
      "fragrant_breeze"
    ]
  },
  {
    "id": "undead_lantern_fox",
    "name": "ヨイマル",
    "rarity": 3,
    "power": 3,
    "zone": "forest",
    "habitat": "森",
    "eco": "尻尾の灯籠で道を照らす亡霊キツネ。夜道の分かれ道で旅人を待つ。",
    "skills": [
      "glimmer",
      "shadow_dust",
      "moon_heal"
    ]
  },
  {
    "id": "undead_pumpkin_hermit",
    "name": "カボロン",
    "rarity": 3,
    "power": 3,
    "zone": "meadow",
    "habitat": "はじまりの草原",
    "eco": "おばけカボチャを宿にする白骨ヤドカリ。秋の実りを静かに見守る。",
    "skills": [
      "iron_guard",
      "guard_strike",
      "soul_sip"
    ]
  },
  {
    "id": "undead_gravestone_tortoise",
    "name": "グラモス",
    "rarity": 4,
    "power": 4,
    "zone": "ruins",
    "habitat": "遺跡",
    "eco": "墓石の甲羅を背負った骨ガメ。背に刻まれた名前を忘れない。",
    "skills": [
      "rock_knuckle",
      "stone_circle",
      "crystal_wall"
    ]
  },
  {
    "id": "undead_rust_sword_skeleton",
    "name": "ラグス",
    "rarity": 4,
    "power": 4,
    "zone": "ruins",
    "habitat": "遺跡",
    "eco": "錆びた剣と鍋蓋盾を構える小さな獣骸骨兵。古い約束を今も守る。",
    "skills": [
      "quick_claw",
      "guard_strike",
      "crescent_slash"
    ]
  },
  {
    "id": "undead_gravekeeper_mole",
    "name": "モルグ",
    "rarity": 4,
    "power": 4,
    "zone": "cave",
    "habitat": "ささやきの洞窟",
    "eco": "墓石の盾とシャベル爪で戦う骨モグラ。荒れた墓地を毎晩手入れする。",
    "skills": [
      "rock_knuckle",
      "shell_break",
      "stone_circle"
    ]
  },
  {
    "id": "undead_chain_bell_ghost",
    "name": "ベルゴー",
    "rarity": 4,
    "power": 4,
    "zone": "tower",
    "habitat": "塔",
    "eco": "鎖を揺らす大鐘の幽霊。深い鐘の音でさまよう魂を鎮める。",
    "skills": [
      "resonant_chime",
      "hush_bell",
      "purge_chime"
    ]
  },
  {
    "id": "undead_frost_coffin_penguin",
    "name": "フリジット",
    "rarity": 4,
    "power": 4,
    "zone": "dream",
    "habitat": "夢の回廊",
    "eco": "氷の棺を背負った亡霊ペンギン。冷気の寝床で長い夢を見ている。",
    "skills": [
      "ice_needle",
      "crystal_wall",
      "blizzard"
    ]
  },
  {
    "id": "undead_ashwing_skeleton_raven",
    "name": "アシュロウ",
    "rarity": 5,
    "power": 5,
    "zone": "volcanic",
    "habitat": "火山地帯",
    "eco": "灰色の羽と骨の翼を持つ不死のカラス。燃え跡から新しい夜明けを探す。",
    "skills": [
      "ember",
      "wing_sweep",
      "phoenix_seed"
    ]
  },
  {
    "id": "undead_grimoire_ghost_owl",
    "name": "ノクティル",
    "rarity": 5,
    "power": 5,
    "zone": "tower",
    "habitat": "塔",
    "eco": "古い呪文書を抱える亡霊フクロウ。月の光で忘れられた言葉を読む。",
    "skills": [
      "shadow_ball",
      "hush_bell",
      "moon_rain"
    ]
  },
  {
    "id": "undead_coffin_shield_mummy",
    "name": "コフィラム",
    "rarity": 5,
    "power": 5,
    "zone": "desert",
    "habitat": "砂漠",
    "eco": "大きな棺の盾を構える重装ミイラ。仲間の退路を決して明け渡さない。",
    "skills": [
      "iron_guard",
      "guard_strike",
      "star_sanctuary"
    ]
  },
  {
    "id": "undead_anchor_revenant",
    "name": "ドレッガー",
    "rarity": 5,
    "power": 5,
    "zone": "w2",
    "habitat": "海岸",
    "eco": "大錨を振るう魚頭の骸骨海賊。海に眠る船と乗組員を守っている。",
    "skills": [
      "water_bolt",
      "shell_break",
      "wave_song"
    ]
  },
  {
    "id": "undead_bone_drum_ogre",
    "name": "ドンガル",
    "rarity": 6,
    "power": 6,
    "zone": "ruins",
    "habitat": "遺跡",
    "eco": "魂を揺さぶる骨太鼓を打つ骸骨鬼。太鼓の拍子で仲間を奮い立たせる。",
    "skills": [
      "brave_roar",
      "resonant_chime",
      "battle_chorus"
    ]
  },
  {
    "id": "undead_shadow_thread_samurai",
    "name": "シグモ",
    "rarity": 6,
    "power": 6,
    "zone": "tower",
    "habitat": "塔",
    "eco": "糸巻きを背負い、影を縫い止める骸骨侍。刃より先に細い糸が走る。",
    "skills": [
      "sticky_thread",
      "crescent_slash",
      "shadow_dust"
    ]
  },
  {
    "id": "undead_bone_bison",
    "name": "オスガル",
    "rarity": 6,
    "power": 6,
    "zone": "volcanic",
    "habitat": "火山地帯",
    "eco": "胸に青い魂火を燃やす大角の白骨野牛。消えない闘志で荒野を駆ける。",
    "skills": [
      "horn_thrust",
      "reckless_ram",
      "soul_sip"
    ]
  },
  {
    "id": "undead_iron_crown_dullahan",
    "name": "デュラゼル",
    "rarity": 7,
    "power": 6,
    "zone": null,
    "habitat": "配合／旅のマスターとの出会い",
    "eco": "獣の骸骨頭を手に提げた首なし黒鉄騎士。騎士の誇りだけは失わない。",
    "skills": [
      "shadow_ball",
      "guard_strike",
      "royal_horn"
    ]
  },
  {
    "id": "undead_requiem_bird_lich",
    "name": "レクシオン",
    "rarity": 7,
    "power": 6,
    "zone": null,
    "habitat": "配合／旅のマスターとの出会い",
    "eco": "鎮魂の杖を携える鳥頭の骨魔術師。魂の帰り道を星に尋ねる。",
    "skills": [
      "glimmer",
      "purge_chime",
      "soul_return"
    ]
  },
  {
    "id": "undead_underworld_bone_cerberus",
    "name": "ガルベロス",
    "rarity": 7,
    "power": 6,
    "zone": null,
    "habitat": "配合／旅のマスターとの出会い",
    "eco": "紫の炎をまとった三頭の骨魔犬。冥界の門を三つの意志で守る。",
    "skills": [
      "small_fang",
      "twin_claw",
      "fire_breath"
    ]
  },
  {
    "id": "undead_sarcophagus_jackal_pharaoh",
    "name": "ネフェルカ",
    "rarity": 8,
    "power": 7,
    "zone": null,
    "habitat": "配合／旅のマスターとの出会い",
    "eco": "金と濃青の衣をまとうジャッカル頭のミイラ王。眠る王国を慈しみ統べる。",
    "skills": [
      "shadow_ball",
      "mirror_veil",
      "soul_return"
    ]
  },
  {
    "id": "undead_fortress_bone_mammoth",
    "name": "モルダント",
    "rarity": 8,
    "power": 7,
    "zone": null,
    "habitat": "配合／旅のマスターとの出会い",
    "eco": "要塞のような鎧を背負う巨大な骨マンモス。その歩みは城門をも揺らす。",
    "skills": [
      "horn_thrust",
      "stone_circle",
      "earthquake"
    ]
  },
  {
    "id": "undead_moonwing_vampire_beast",
    "name": "ヴェスパル",
    "rarity": 8,
    "power": 7,
    "zone": null,
    "habitat": "配合／旅のマスターとの出会い",
    "eco": "大きな翼をマントのように広げる吸血蝙蝠の魔獣。月の影を静かに渡る。",
    "skills": [
      "wing_blade",
      "shadow_dust",
      "soul_sip"
    ]
  },
  {
    "id": "undead_bonewing_soul_wyvern",
    "name": "ゼルヴァーン",
    "rarity": 8,
    "power": 7,
    "zone": null,
    "habitat": "配合／旅のマスターとの出会い",
    "eco": "緑の魂火と古い鎧をまとう骨ワイバーン。朽ちた翼でも誓いの空を飛ぶ。",
    "skills": [
      "ember",
      "wing_sweep",
      "dragon_flare"
    ]
  },
  {
    "id": "undead_astral_skeleton_knight",
    "name": "アストレギア",
    "rarity": 9,
    "power": 8,
    "zone": null,
    "habitat": "配合限定",
    "eco": "星型の大剣を振るう紫銀の骸骨騎士。流星の下で交わした誓約を守る。",
    "skills": [
      "glimmer",
      "crescent_slash",
      "star_lance"
    ]
  },
  {
    "id": "undead_immortal_bone_dragon_baldraik",
    "name": "ヴァルドレイク",
    "rarity": 9,
    "power": 8,
    "zone": null,
    "habitat": "配合限定",
    "eco": "王冠状の角と青い魂火を持つ不死の骨竜。太古の王国の記憶を胸に宿す。",
    "skills": [
      "ember",
      "scale_guard",
      "fire_breath"
    ]
  },
  {
    "id": "undead_grave_sovereign_graeval",
    "name": "冥王グレイヴァル",
    "rarity": 10,
    "power": 8,
    "zone": null,
    "habitat": "配合限定",
    "eco": "黒金の王衣と巨大な爪を持つ獣骸骨の冥王。冥界の静寂を統べる威厳ある王。",
    "skills": [
      "shadow_ball",
      "threatening_gaze",
      "eclipse_wave"
    ]
  }
];
const UNDEAD_RECIPES=[
  {
    "parents": [
      "moonflower_ghost",
      "amber_fossil_spiral_spirit"
    ],
    "child": "undead_bone_chick"
  },
  {
    "parents": [
      "undead_bone_chick",
      "amber_fossil_spiral_spirit"
    ],
    "child": "undead_sleepflame_snail"
  },
  {
    "parents": [
      "undead_sleepflame_snail",
      "seedpod_mouse"
    ],
    "child": "undead_bandage_rabbit"
  },
  {
    "parents": [
      "undead_bandage_rabbit",
      "lantern_moth"
    ],
    "child": "undead_candle_monk"
  },
  {
    "parents": [
      "undead_candle_monk",
      "lotus_root_sproutling"
    ],
    "child": "undead_bone_puffer"
  },
  {
    "parents": [
      "undead_bone_puffer",
      "pinecone_sparrow"
    ],
    "child": "undead_umbrella_ghost"
  },
  {
    "parents": [
      "undead_umbrella_ghost",
      "moonflower_ghost"
    ],
    "child": "undead_lantern_fox"
  },
  {
    "parents": [
      "undead_lantern_fox",
      "amber_fossil_spiral_spirit"
    ],
    "child": "undead_pumpkin_hermit"
  },
  {
    "parents": [
      "undead_pumpkin_hermit",
      "seedpod_mouse"
    ],
    "child": "undead_gravestone_tortoise"
  },
  {
    "parents": [
      "undead_gravestone_tortoise",
      "lantern_moth"
    ],
    "child": "undead_rust_sword_skeleton"
  },
  {
    "parents": [
      "undead_rust_sword_skeleton",
      "lotus_root_sproutling"
    ],
    "child": "undead_gravekeeper_mole"
  },
  {
    "parents": [
      "undead_gravekeeper_mole",
      "pinecone_sparrow"
    ],
    "child": "undead_chain_bell_ghost"
  },
  {
    "parents": [
      "undead_chain_bell_ghost",
      "moonflower_ghost"
    ],
    "child": "undead_frost_coffin_penguin"
  },
  {
    "parents": [
      "undead_frost_coffin_penguin",
      "amber_fossil_spiral_spirit"
    ],
    "child": "undead_ashwing_skeleton_raven"
  },
  {
    "parents": [
      "undead_ashwing_skeleton_raven",
      "seedpod_mouse"
    ],
    "child": "undead_grimoire_ghost_owl"
  },
  {
    "parents": [
      "undead_grimoire_ghost_owl",
      "lantern_moth"
    ],
    "child": "undead_coffin_shield_mummy"
  },
  {
    "parents": [
      "undead_coffin_shield_mummy",
      "lotus_root_sproutling"
    ],
    "child": "undead_anchor_revenant"
  },
  {
    "parents": [
      "undead_anchor_revenant",
      "pinecone_sparrow"
    ],
    "child": "undead_bone_drum_ogre"
  },
  {
    "parents": [
      "undead_bone_drum_ogre",
      "moonflower_ghost"
    ],
    "child": "undead_shadow_thread_samurai"
  },
  {
    "parents": [
      "undead_shadow_thread_samurai",
      "amber_fossil_spiral_spirit"
    ],
    "child": "undead_bone_bison"
  },
  {
    "parents": [
      "undead_rust_sword_skeleton",
      "undead_coffin_shield_mummy"
    ],
    "child": "undead_iron_crown_dullahan"
  },
  {
    "parents": [
      "undead_chain_bell_ghost",
      "undead_grimoire_ghost_owl"
    ],
    "child": "undead_requiem_bird_lich"
  },
  {
    "parents": [
      "undead_lantern_fox",
      "undead_bone_bison"
    ],
    "child": "undead_underworld_bone_cerberus"
  },
  {
    "parents": [
      "undead_iron_crown_dullahan",
      "undead_requiem_bird_lich"
    ],
    "child": "undead_sarcophagus_jackal_pharaoh"
  },
  {
    "parents": [
      "undead_gravestone_tortoise",
      "undead_bone_bison"
    ],
    "child": "undead_fortress_bone_mammoth"
  },
  {
    "parents": [
      "undead_ashwing_skeleton_raven",
      "undead_grimoire_ghost_owl"
    ],
    "child": "undead_moonwing_vampire_beast"
  },
  {
    "parents": [
      "undead_underworld_bone_cerberus",
      "undead_anchor_revenant"
    ],
    "child": "undead_bonewing_soul_wyvern"
  },
  {
    "parents": [
      "undead_iron_crown_dullahan",
      "undead_sarcophagus_jackal_pharaoh"
    ],
    "child": "undead_astral_skeleton_knight"
  },
  {
    "parents": [
      "undead_bonewing_soul_wyvern",
      "undead_fortress_bone_mammoth"
    ],
    "child": "undead_immortal_bone_dragon_baldraik"
  },
  {
    "parents": [
      "undead_astral_skeleton_knight",
      "undead_immortal_bone_dragon_baldraik"
    ],
    "child": "undead_grave_sovereign_graeval"
  }
];
for(const m of UNDEAD_EXPANSION){if(COMPANION_DATA.species[m.id])throw Error('Duplicate undead ID');COMPANION_DATA.species[m.id]={name:m.name,img:'assets/monsters/'+m.id+'.png',power:m.power,rarity:m.rarity,family:'undead',fusionOnly:m.rarity>=7};}
COMPANION_DATA.recipes.push(...UNDEAD_RECIPES);
function initUndeadExpansion(){for(const m of UNDEAD_EXPANSION){DEX_INFO[m.id]={...DEX_INFO[m.id],habitat:m.habitat,note:m.eco,eco:m.eco};if(m.rarity>=7)continue;const hp=16+m.power*6,atk=3+m.power*2;ENEMIES[m.id]={name:m.name,jp:m.name,companion:m.id,hp,atk,exp:Math.round(hp*.55),gold:Math.round(hp/3),spr:'wisp',pal:{1:'#9bd5d3',2:'#fff',E:'#142020'}};LIKES[m.id]={tags:['brave','kind'],need:m.rarity<=2?2:m.rarity<=4?3:4,hint:m.eco};if(!ZONES[m.zone])throw Error('Missing undead habitat '+m.zone);if(!ZONES[m.zone].foes.includes(m.id))ZONES[m.zone].foes.push(m.id);}}
