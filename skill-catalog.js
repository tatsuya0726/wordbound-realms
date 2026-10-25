/* Shared skill definitions; canonical stable IDs. */
const SKILL_CATALOG={
  "seed_shot": {
    "id": "seed_shot",
    "name": "たねだま",
    "category": "攻撃",
    "target": "enemy",
    "cost": 2,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.6
      }
    ],
    "themeTags": [
      "seed",
      "plant"
    ],
    "description": "攻撃値×1.6のダメージ",
    "effect": "damage",
    "power": 1.6
  },
  "quick_claw": {
    "id": "quick_claw",
    "name": "はやがけの爪",
    "category": "攻撃",
    "target": "enemy",
    "cost": 2,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.6
      }
    ],
    "themeTags": [
      "claw",
      "beast"
    ],
    "description": "攻撃値×1.6のダメージ",
    "effect": "damage",
    "power": 1.6
  },
  "small_fang": {
    "id": "small_fang",
    "name": "かみつき",
    "category": "攻撃",
    "target": "enemy",
    "cost": 2,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.6
      }
    ],
    "themeTags": [
      "fang",
      "beast",
      "reptile"
    ],
    "description": "攻撃値×1.6のダメージ",
    "effect": "damage",
    "power": 1.6
  },
  "horn_thrust": {
    "id": "horn_thrust",
    "name": "つのとつげき",
    "category": "攻撃",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.8
      }
    ],
    "themeTags": [
      "horn",
      "beast"
    ],
    "description": "攻撃値×1.8のダメージ",
    "effect": "damage",
    "power": 1.8
  },
  "stone_peck": {
    "id": "stone_peck",
    "name": "いしつぶて",
    "category": "攻撃",
    "target": "enemy",
    "cost": 2,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.6
      }
    ],
    "themeTags": [
      "earth",
      "bird"
    ],
    "description": "攻撃値×1.6のダメージ",
    "effect": "damage",
    "power": 1.6
  },
  "wing_blade": {
    "id": "wing_blade",
    "name": "かまいたち",
    "category": "攻撃",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.8
      }
    ],
    "themeTags": [
      "wing",
      "wind",
      "bird"
    ],
    "description": "攻撃値×1.8のダメージ",
    "effect": "damage",
    "power": 1.8
  },
  "ember": {
    "id": "ember",
    "name": "ひのこ",
    "category": "攻撃",
    "target": "enemy",
    "cost": 2,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.6
      }
    ],
    "themeTags": [
      "fire"
    ],
    "description": "敵1体に攻撃値×1.6のダメージ。",
    "effect": "damage",
    "power": 1.6,
    "series": "ember",
    "stage": 1,
    "seriesText": "ひのこ Lv.1 → 紅蓮弾 Lv.10 → ヴァルフレア Lv.22"
  },
  "water_bolt": {
    "id": "water_bolt",
    "name": "みずでっぽう",
    "category": "攻撃",
    "target": "enemy",
    "cost": 2,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.6
      }
    ],
    "themeTags": [
      "water",
      "aquatic"
    ],
    "description": "敵1体に攻撃値×1.6のダメージ。",
    "effect": "damage",
    "power": 1.6,
    "series": "water_bolt",
    "stage": 1,
    "seriesText": "みずでっぽう Lv.1 → 奔流の矢 Lv.10 → アクエリオン Lv.22"
  },
  "ice_needle": {
    "id": "ice_needle",
    "name": "こおりのはり",
    "category": "攻撃",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.8
      }
    ],
    "themeTags": [
      "ice"
    ],
    "description": "攻撃値×1.8のダメージ",
    "effect": "damage",
    "power": 1.8
  },
  "spark": {
    "id": "spark",
    "name": "ちいさな雷",
    "category": "攻撃",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.8
      }
    ],
    "themeTags": [
      "thunder"
    ],
    "description": "敵1体に攻撃値×1.8のダメージ。",
    "effect": "damage",
    "power": 1.8,
    "series": "spark",
    "stage": 1,
    "seriesText": "ちいさな雷 Lv.1 → 雷鳴槍 Lv.10 → 轟雷ゼルガ Lv.22"
  },
  "leaf_arrow": {
    "id": "leaf_arrow",
    "name": "わかばの矢",
    "category": "攻撃",
    "target": "enemy",
    "cost": 2,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.6
      }
    ],
    "themeTags": [
      "leaf",
      "plant"
    ],
    "description": "攻撃値×1.6のダメージ",
    "effect": "damage",
    "power": 1.6
  },
  "glimmer": {
    "id": "glimmer",
    "name": "ひかりのつぶ",
    "category": "攻撃",
    "target": "enemy",
    "cost": 2,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.6
      }
    ],
    "themeTags": [
      "light",
      "spirit"
    ],
    "description": "攻撃値×1.6のダメージ",
    "effect": "damage",
    "power": 1.6
  },
  "shadow_ball": {
    "id": "shadow_ball",
    "name": "かげだま",
    "category": "攻撃",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.8
      }
    ],
    "themeTags": [
      "shadow",
      "spirit"
    ],
    "description": "攻撃値×1.8のダメージ",
    "effect": "damage",
    "power": 1.8
  },
  "crystal_ray": {
    "id": "crystal_ray",
    "name": "水晶の光線",
    "category": "攻撃",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 2.05
      }
    ],
    "themeTags": [
      "crystal"
    ],
    "description": "攻撃値×2.05のダメージ",
    "effect": "damage",
    "power": 2.05
  },
  "iron_jaw": {
    "id": "iron_jaw",
    "name": "はがねのアゴ",
    "category": "攻撃",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 2.1
      }
    ],
    "themeTags": [
      "metal",
      "fang"
    ],
    "description": "攻撃値×2.1のダメージ",
    "effect": "damage",
    "power": 2.1
  },
  "royal_horn": {
    "id": "royal_horn",
    "name": "王者のつの",
    "category": "攻撃",
    "target": "enemy",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 2.7
      }
    ],
    "themeTags": [
      "horn",
      "beast"
    ],
    "description": "攻撃値×2.7のダメージ",
    "effect": "damage",
    "power": 2.7
  },
  "star_lance": {
    "id": "star_lance",
    "name": "星くずの槍",
    "category": "攻撃",
    "target": "enemy",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 2.7
      }
    ],
    "themeTags": [
      "star",
      "light"
    ],
    "description": "攻撃値×2.7のダメージ",
    "effect": "damage",
    "power": 2.7
  },
  "dragon_flare": {
    "id": "dragon_flare",
    "name": "りゅうの火炎",
    "category": "攻撃",
    "target": "enemy",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 2.7
      }
    ],
    "themeTags": [
      "fire",
      "dragon"
    ],
    "description": "攻撃値×2.7のダメージ",
    "effect": "damage",
    "power": 2.7
  },
  "leaf_storm": {
    "id": "leaf_storm",
    "name": "木の葉あらし",
    "category": "全体攻撃",
    "target": "allEnemies",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 0.9
      }
    ],
    "themeTags": [
      "leaf",
      "wind"
    ],
    "description": "攻撃値×0.9のダメージ",
    "effect": "damage",
    "power": 0.9
  },
  "wave_song": {
    "id": "wave_song",
    "name": "さざなみの歌",
    "category": "全体攻撃",
    "target": "allEnemies",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 0.9
      }
    ],
    "themeTags": [
      "water",
      "sound"
    ],
    "description": "攻撃値×0.9のダメージ",
    "effect": "damage",
    "power": 0.9
  },
  "fire_breath": {
    "id": "fire_breath",
    "name": "ほのおの息",
    "category": "全体攻撃",
    "target": "allEnemies",
    "cost": 8,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 1.3
      }
    ],
    "themeTags": [
      "fire",
      "dragon"
    ],
    "description": "攻撃値×1.3のダメージ",
    "effect": "damage",
    "power": 1.3
  },
  "blizzard": {
    "id": "blizzard",
    "name": "こごえる吹雪",
    "category": "全体攻撃",
    "target": "allEnemies",
    "cost": 8,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 1.3
      }
    ],
    "themeTags": [
      "ice",
      "wind"
    ],
    "description": "攻撃値×1.3のダメージ",
    "effect": "damage",
    "power": 1.3
  },
  "thunder_rain": {
    "id": "thunder_rain",
    "name": "雷のあられ",
    "category": "全体攻撃",
    "target": "allEnemies",
    "cost": 8,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 1.3
      }
    ],
    "themeTags": [
      "thunder",
      "star"
    ],
    "description": "攻撃値×1.3のダメージ",
    "effect": "damage",
    "power": 1.3
  },
  "earthquake": {
    "id": "earthquake",
    "name": "だいちのうねり",
    "category": "全体攻撃",
    "target": "allEnemies",
    "cost": 8,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 1.3
      }
    ],
    "themeTags": [
      "earth"
    ],
    "description": "攻撃値×1.3のダメージ",
    "effect": "damage",
    "power": 1.3
  },
  "moon_rain": {
    "id": "moon_rain",
    "name": "月光のシャワー",
    "category": "全体攻撃",
    "target": "allEnemies",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 1.15
      }
    ],
    "themeTags": [
      "moon",
      "light"
    ],
    "description": "攻撃値×1.15のダメージ",
    "effect": "damage",
    "power": 1.15
  },
  "wing_sweep": {
    "id": "wing_sweep",
    "name": "つばさの一掃",
    "category": "全体攻撃",
    "target": "allEnemies",
    "cost": 6,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 1.05
      }
    ],
    "themeTags": [
      "wing",
      "bird"
    ],
    "description": "攻撃値×1.05のダメージ",
    "effect": "damage",
    "power": 1.05
  },
  "twin_claw": {
    "id": "twin_claw",
    "name": "にれんの爪",
    "category": "連撃",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 0.95
      },
      {
        "effect": "damage",
        "power": 0.95
      }
    ],
    "themeTags": [
      "claw",
      "beast"
    ],
    "description": "攻撃値×0.95のダメージ / 攻撃値×0.95のダメージ",
    "effect": "damage",
    "power": 0.95
  },
  "shell_break": {
    "id": "shell_break",
    "name": "からわり",
    "category": "攻撃＋弱体",
    "target": "enemy",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 1.25
      },
      {
        "effect": "defenseDown",
        "power": 0.15,
        "duration": 2
      }
    ],
    "themeTags": [
      "shell",
      "metal",
      "claw"
    ],
    "description": "攻撃値×1.25のダメージ / 被ダメージ増加 15%・2ラウンド（重複加算なし）",
    "effect": "damage",
    "power": 1.25
  },
  "thorn_bind": {
    "id": "thorn_bind",
    "name": "いばらしばり",
    "category": "攻撃＋弱体",
    "target": "enemy",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 1.1
      },
      {
        "effect": "attackDown",
        "power": 0.2,
        "duration": 2
      }
    ],
    "themeTags": [
      "thorn",
      "leaf",
      "plant"
    ],
    "description": "攻撃値×1.1のダメージ / 攻撃低下 20%・2ラウンド（重複加算なし）",
    "effect": "damage",
    "power": 1.1
  },
  "frost_bite": {
    "id": "frost_bite",
    "name": "しもやけの牙",
    "category": "攻撃＋弱体",
    "target": "enemy",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 1.35
      },
      {
        "effect": "attackDown",
        "power": 0.25,
        "duration": 1
      }
    ],
    "themeTags": [
      "ice",
      "fang"
    ],
    "description": "攻撃値×1.35のダメージ / 攻撃低下 25%・1ラウンド（重複加算なし）",
    "effect": "damage",
    "power": 1.35
  },
  "ember_tail": {
    "id": "ember_tail",
    "name": "火のしっぽ",
    "category": "攻撃＋状態",
    "target": "enemy",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 1.1
      },
      {
        "effect": "burn",
        "power": 0.2,
        "duration": 3,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "fire",
      "beast"
    ],
    "description": "攻撃値×1.1のダメージ / 火傷：ラウンド終了時に攻撃値×0.2ダメージ・3回（最大HP10%上限）",
    "effect": "damage",
    "power": 1.1
  },
  "venom_fang": {
    "id": "venom_fang",
    "name": "どくの牙",
    "category": "攻撃＋状態",
    "target": "enemy",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 1
      },
      {
        "effect": "poison",
        "power": 0.25,
        "duration": 3,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "poison",
      "fang"
    ],
    "description": "攻撃値×1のダメージ / 毒：ラウンド終了時に攻撃値×0.25ダメージ・3回（最大HP10%上限）",
    "effect": "damage",
    "power": 1
  },
  "siphon_root": {
    "id": "siphon_root",
    "name": "すいとる根",
    "category": "吸収",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "drain",
        "power": 1.15,
        "fraction": 0.4
      }
    ],
    "themeTags": [
      "root",
      "plant"
    ],
    "description": "攻撃値×1.15の攻撃＋実ダメージ40%を自分回復",
    "effect": "drain",
    "power": 1.15
  },
  "soul_sip": {
    "id": "soul_sip",
    "name": "たましいの灯",
    "category": "吸収",
    "target": "enemy",
    "cost": 6,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "drain",
        "power": 1.55,
        "fraction": 0.5
      }
    ],
    "themeTags": [
      "spirit",
      "undead",
      "shadow"
    ],
    "description": "攻撃値×1.55の攻撃＋実ダメージ50%を自分回復",
    "effect": "drain",
    "power": 1.55
  },
  "reckless_ram": {
    "id": "reckless_ram",
    "name": "すてみの体当たり",
    "category": "反動攻撃",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 2.4
      },
      {
        "effect": "recoil",
        "power": 0.1
      }
    ],
    "themeTags": [
      "horn",
      "beast"
    ],
    "description": "攻撃値×2.4のダメージ / 自分の最大HP10%反動（HP1は残る）",
    "effect": "damage",
    "power": 2.4
  },
  "guard_strike": {
    "id": "guard_strike",
    "name": "まもりの一撃",
    "category": "攻撃＋盾",
    "target": "enemy",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 1.2
      },
      {
        "effect": "shield",
        "power": 0.7,
        "duration": 2,
        "scale": "attack",
        "self": true
      }
    ],
    "themeTags": [
      "shell",
      "metal",
      "earth"
    ],
    "description": "攻撃値×1.2のダメージ / 自分に攻撃値×0.7の吸収盾・2ラウンド",
    "effect": "damage",
    "power": 1.2
  },
  "sprout_heal": {
    "id": "sprout_heal",
    "name": "めぶきの手当て",
    "category": "回復",
    "target": "ally",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "heal",
        "power": 0,
        "fixedHeal": 35
      }
    ],
    "themeTags": [
      "seed",
      "leaf",
      "plant"
    ],
    "description": "生存味方1体のHPを35回復（蘇生なし）。不正解は半分。",
    "effect": "heal",
    "power": 0,
    "series": "sprout_heal",
    "stage": 1,
    "fixedHeal": 35,
    "seriesText": "めぶきの手当て Lv.1 → リーフェル Lv.10 → リーフェリア Lv.22"
  },
  "honey_heal": {
    "id": "honey_heal",
    "name": "はちみつのしずく",
    "category": "回復",
    "target": "ally",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "heal",
        "power": 1.9
      }
    ],
    "themeTags": [
      "honey",
      "insect"
    ],
    "description": "攻撃値×1.9のHP回復（蘇生なし）",
    "effect": "heal",
    "power": 1.9
  },
  "moon_heal": {
    "id": "moon_heal",
    "name": "月のいやし",
    "category": "回復",
    "target": "ally",
    "cost": 6,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "heal",
        "power": 2.7
      }
    ],
    "themeTags": [
      "moon",
      "light"
    ],
    "description": "攻撃値×2.7のHP回復（蘇生なし）",
    "effect": "heal",
    "power": 2.7
  },
  "flower_garden": {
    "id": "flower_garden",
    "name": "花園のいのり",
    "category": "回復",
    "target": "allAllies",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "heal",
        "power": 1.15
      }
    ],
    "themeTags": [
      "flower",
      "plant"
    ],
    "description": "攻撃値×1.15のHP回復（蘇生なし）",
    "effect": "heal",
    "power": 1.15
  },
  "sea_blessing": {
    "id": "sea_blessing",
    "name": "海のめぐみ",
    "category": "回復",
    "target": "allAllies",
    "cost": 9,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "heal",
        "power": 1.55
      }
    ],
    "themeTags": [
      "water",
      "aquatic"
    ],
    "description": "攻撃値×1.55のHP回復（蘇生なし）",
    "effect": "heal",
    "power": 1.55
  },
  "nest_rest": {
    "id": "nest_rest",
    "name": "すやすや巣ごもり",
    "category": "回復",
    "target": "self",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "heal",
        "power": 1.7
      }
    ],
    "themeTags": [
      "bird",
      "beast",
      "nest"
    ],
    "description": "攻撃値×1.7のHP回復（蘇生なし）",
    "effect": "heal",
    "power": 1.7
  },
  "spring_regen": {
    "id": "spring_regen",
    "name": "春のしずく",
    "category": "継続回復",
    "target": "ally",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "regen",
        "power": 0.65,
        "duration": 3,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "water",
      "leaf"
    ],
    "description": "ラウンド終了時に攻撃値×0.65回復・3回",
    "effect": "regen",
    "power": 0.65
  },
  "forest_regen": {
    "id": "forest_regen",
    "name": "森のゆりかご",
    "category": "継続回復",
    "target": "allAllies",
    "cost": 8,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "regen",
        "power": 0.4,
        "duration": 3,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "wood",
      "flower"
    ],
    "description": "ラウンド終了時に攻撃値×0.4回復・3回",
    "effect": "regen",
    "power": 0.4
  },
  "shed_skin": {
    "id": "shed_skin",
    "name": "ぬけがらの術",
    "category": "状態解除",
    "target": "self",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "cleanse",
        "power": 0
      }
    ],
    "themeTags": [
      "reptile",
      "insect",
      "shell"
    ],
    "description": "悪い状態を解除",
    "effect": "cleanse",
    "power": 0
  },
  "pure_drop": {
    "id": "pure_drop",
    "name": "きよめのしずく",
    "category": "状態解除",
    "target": "ally",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "cleanse",
        "power": 0
      }
    ],
    "themeTags": [
      "water",
      "light"
    ],
    "description": "悪い状態を解除",
    "effect": "cleanse",
    "power": 0
  },
  "fragrant_breeze": {
    "id": "fragrant_breeze",
    "name": "かおりのそよ風",
    "category": "状態解除",
    "target": "allAllies",
    "cost": 6,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "cleanse",
        "power": 0
      }
    ],
    "themeTags": [
      "flower",
      "wind"
    ],
    "description": "悪い状態を解除",
    "effect": "cleanse",
    "power": 0
  },
  "purifying_bloom": {
    "id": "purifying_bloom",
    "name": "浄化の花",
    "category": "回復＋解除",
    "target": "ally",
    "cost": 6,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "heal",
        "power": 1.3
      },
      {
        "effect": "cleanse",
        "power": 0
      }
    ],
    "themeTags": [
      "flower",
      "light"
    ],
    "description": "攻撃値×1.3のHP回復（蘇生なし） / 悪い状態を解除",
    "effect": "heal",
    "power": 1.3
  },
  "soul_return": {
    "id": "soul_return",
    "name": "たましいの帰り道",
    "category": "蘇生",
    "target": "fallenAlly",
    "cost": 9,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "revive",
        "power": 0.25
      }
    ],
    "themeTags": [
      "spirit",
      "undead",
      "light"
    ],
    "description": "HP25%で蘇生（SP回復なし）",
    "effect": "revive",
    "power": 0.25
  },
  "phoenix_seed": {
    "id": "phoenix_seed",
    "name": "よみがえりの種",
    "category": "蘇生",
    "target": "fallenAlly",
    "cost": 12,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "revive",
        "power": 0.45
      }
    ],
    "themeTags": [
      "seed",
      "fire",
      "star"
    ],
    "description": "HP45%で蘇生（SP回復なし）",
    "effect": "revive",
    "power": 0.45
  },
  "leaf_shield": {
    "id": "leaf_shield",
    "name": "葉っぱの盾",
    "category": "盾",
    "target": "ally",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "shield",
        "power": 0.15,
        "duration": 2
      }
    ],
    "themeTags": [
      "leaf",
      "plant"
    ],
    "description": "味方1体に最大HPの15%を吸収する盾（2ターン・加算不可）。",
    "effect": "shield",
    "power": 0.15,
    "series": "leaf_shield",
    "stage": 1,
    "duration": 2,
    "seriesText": "葉っぱの盾 Lv.1 → 翠葉の障壁 Lv.10 → フォレスティア Lv.22"
  },
  "crystal_wall": {
    "id": "crystal_wall",
    "name": "水晶のかべ",
    "category": "盾",
    "target": "ally",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "shield",
        "power": 1.8,
        "duration": 2,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "crystal",
      "earth"
    ],
    "description": "攻撃値×1.8の吸収盾・2ラウンド",
    "effect": "shield",
    "power": 1.8
  },
  "foam_curtain": {
    "id": "foam_curtain",
    "name": "あわのカーテン",
    "category": "盾",
    "target": "allAllies",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "shield",
        "power": 0.95,
        "duration": 2,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "water",
      "aquatic"
    ],
    "description": "攻撃値×0.95の吸収盾・2ラウンド",
    "effect": "shield",
    "power": 0.95
  },
  "iron_guard": {
    "id": "iron_guard",
    "name": "てっぺき",
    "category": "防御",
    "target": "self",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "guard",
        "power": 0.4,
        "duration": 1
      }
    ],
    "themeTags": [
      "metal",
      "shell"
    ],
    "description": "被ダメージ軽減 40%・1ラウンド（重複加算なし）",
    "effect": "guard",
    "power": 0.4
  },
  "silk_veil": {
    "id": "silk_veil",
    "name": "絹糸のベール",
    "category": "状態予防",
    "target": "ally",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "statusWard",
        "power": 1,
        "duration": 3
      }
    ],
    "themeTags": [
      "silk",
      "insect"
    ],
    "description": "悪い状態を1回防ぐ・3ラウンド",
    "effect": "statusWard",
    "power": 1
  },
  "star_sanctuary": {
    "id": "star_sanctuary",
    "name": "星明かりの聖域",
    "category": "状態予防",
    "target": "allAllies",
    "cost": 9,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "statusWard",
        "power": 1,
        "duration": 3
      },
      {
        "effect": "shield",
        "power": 0.6,
        "duration": 3,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "star",
      "light"
    ],
    "description": "悪い状態を1回防ぐ・3ラウンド / 攻撃値×0.6の吸収盾・3ラウンド",
    "effect": "statusWard",
    "power": 1
  },
  "brave_roar": {
    "id": "brave_roar",
    "name": "勇気のほうこう",
    "category": "強化",
    "target": "ally",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "attackUp",
        "power": 0.2,
        "duration": 3
      }
    ],
    "themeTags": [
      "beast",
      "horn",
      "sound"
    ],
    "description": "味方1体の攻撃を20%強化（3ターン・重ね掛け不可）。",
    "effect": "attackUp",
    "power": 0.2,
    "series": "brave_roar",
    "stage": 1,
    "duration": 3,
    "seriesText": "勇気のほうこう Lv.1 → 覇気の号令 Lv.10 → グランヴォーク Lv.22"
  },
  "battle_chorus": {
    "id": "battle_chorus",
    "name": "たたかいの合唱",
    "category": "強化",
    "target": "allAllies",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "attackUp",
        "power": 0.2,
        "duration": 3
      }
    ],
    "themeTags": [
      "bird",
      "sound"
    ],
    "description": "攻撃強化 20%・3ラウンド（重複加算なし）",
    "effect": "attackUp",
    "power": 0.2
  },
  "scale_guard": {
    "id": "scale_guard",
    "name": "うろこの守り",
    "category": "強化",
    "target": "ally",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "defenseUp",
        "power": 0.4,
        "duration": 3
      }
    ],
    "themeTags": [
      "reptile",
      "dragon",
      "shell"
    ],
    "description": "防御強化 40%・3ラウンド（重複加算なし）",
    "effect": "defenseUp",
    "power": 0.4
  },
  "stone_circle": {
    "id": "stone_circle",
    "name": "いわの輪",
    "category": "強化",
    "target": "allAllies",
    "cost": 6,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "defenseUp",
        "power": 0.3,
        "duration": 3
      }
    ],
    "themeTags": [
      "earth",
      "crystal"
    ],
    "description": "防御強化 30%・3ラウンド（重複加算なし）",
    "effect": "defenseUp",
    "power": 0.3
  },
  "iron_bloom": {
    "id": "iron_bloom",
    "name": "はがねの花",
    "category": "強化",
    "target": "ally",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "attackUp",
        "power": 0.4,
        "duration": 3
      }
    ],
    "themeTags": [
      "metal",
      "flower"
    ],
    "description": "攻撃強化 40%・3ラウンド（重複加算なし）",
    "effect": "attackUp",
    "power": 0.4
  },
  "soft_spores": {
    "id": "soft_spores",
    "name": "やわらぎの胞子",
    "category": "弱体",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "attackDown",
        "power": 0.2,
        "duration": 3
      }
    ],
    "themeTags": [
      "fungus",
      "plant"
    ],
    "description": "攻撃低下 20%・3ラウンド（重複加算なし）",
    "effect": "attackDown",
    "power": 0.2
  },
  "mist_song": {
    "id": "mist_song",
    "name": "まどろみの霧歌",
    "category": "弱体",
    "target": "allEnemies",
    "cost": 6,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "attackDown",
        "power": 0.2,
        "duration": 3
      }
    ],
    "themeTags": [
      "moon",
      "water",
      "sound"
    ],
    "description": "攻撃低下 20%・3ラウンド（重複加算なし）",
    "effect": "attackDown",
    "power": 0.2
  },
  "threatening_gaze": {
    "id": "threatening_gaze",
    "name": "にらみつけ",
    "category": "弱体",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "attackDown",
        "power": 0.35,
        "duration": 3
      }
    ],
    "themeTags": [
      "beast",
      "reptile"
    ],
    "description": "攻撃低下 35%・3ラウンド（重複加算なし）",
    "effect": "attackDown",
    "power": 0.35
  },
  "expose_light": {
    "id": "expose_light",
    "name": "見ぬくひかり",
    "category": "弱体",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "defenseDown",
        "power": 0.2,
        "duration": 3
      }
    ],
    "themeTags": [
      "light",
      "crystal"
    ],
    "description": "被ダメージ増加 20%・3ラウンド（重複加算なし）",
    "effect": "defenseDown",
    "power": 0.2
  },
  "crack_resonance": {
    "id": "crack_resonance",
    "name": "ひびわれの共鳴",
    "category": "弱体",
    "target": "allEnemies",
    "cost": 8,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "defenseDown",
        "power": 0.15,
        "duration": 3
      }
    ],
    "themeTags": [
      "sound",
      "crystal"
    ],
    "description": "被ダメージ増加 15%・3ラウンド（重複加算なし）",
    "effect": "defenseDown",
    "power": 0.15
  },
  "sticky_thread": {
    "id": "sticky_thread",
    "name": "ねばねば糸",
    "category": "弱体",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "attackDown",
        "power": 0.15,
        "duration": 3
      }
    ],
    "themeTags": [
      "silk",
      "insect"
    ],
    "description": "攻撃低下 15%・3ラウンド（重複加算なし）",
    "effect": "attackDown",
    "power": 0.15
  },
  "sunrise_song": {
    "id": "sunrise_song",
    "name": "あさひの歌",
    "category": "回復＋強化",
    "target": "allAllies",
    "cost": 9,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "attackUp",
        "power": 0.15,
        "duration": 3
      },
      {
        "effect": "heal",
        "power": 0.55
      }
    ],
    "themeTags": [
      "light",
      "bird",
      "sound"
    ],
    "description": "攻撃強化 15%・3ラウンド（重複加算なし） / 攻撃値×0.55のHP回復（蘇生なし）",
    "effect": "attackUp",
    "power": 0.15
  },
  "rooted_resolve": {
    "id": "rooted_resolve",
    "name": "根をはる",
    "category": "回復＋強化",
    "target": "self",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "defenseUp",
        "power": 0.4,
        "duration": 3
      },
      {
        "effect": "regen",
        "power": 0.4,
        "duration": 3,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "root",
      "wood",
      "plant"
    ],
    "description": "防御強化 40%・3ラウンド（重複加算なし） / ラウンド終了時に攻撃値×0.4回復・3回",
    "effect": "defenseUp",
    "power": 0.4
  },
  "poison_spore": {
    "id": "poison_spore",
    "name": "どくの胞子",
    "category": "継続ダメージ",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "poison",
        "power": 0.35,
        "duration": 3,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "fungus",
      "poison"
    ],
    "description": "毒：ラウンド終了時に攻撃値×0.35ダメージ・3回（最大HP10%上限）",
    "effect": "poison",
    "power": 0.35
  },
  "toxic_mist": {
    "id": "toxic_mist",
    "name": "もうどくの霧",
    "category": "継続ダメージ",
    "target": "allEnemies",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "poison",
        "power": 0.3,
        "duration": 3,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "poison",
      "shadow"
    ],
    "description": "毒：ラウンド終了時に攻撃値×0.3ダメージ・3回（最大HP10%上限）",
    "effect": "poison",
    "power": 0.3
  },
  "sleep_pollen": {
    "id": "sleep_pollen",
    "name": "ねむりの花粉",
    "category": "行動阻害",
    "target": "enemy",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "sleep",
        "power": 0.7,
        "duration": 1
      }
    ],
    "themeTags": [
      "flower",
      "fungus"
    ],
    "description": "70%で次の1行動を停止・直接攻撃で解除・ボス無効・解除後2ラウンド耐性",
    "effect": "sleep",
    "power": 0.7
  },
  "thunder_stun": {
    "id": "thunder_stun",
    "name": "しびれる閃光",
    "category": "行動阻害",
    "target": "enemy",
    "cost": 6,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "stun",
        "power": 0.6,
        "duration": 1
      }
    ],
    "themeTags": [
      "thunder",
      "light"
    ],
    "description": "60%で次の1行動を停止・ボス無効・解除後2ラウンド耐性",
    "effect": "stun",
    "power": 0.6
  },
  "hush_bell": {
    "id": "hush_bell",
    "name": "しずけさの鈴",
    "category": "特殊封印",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "silence",
        "power": 1,
        "duration": 2
      }
    ],
    "themeTags": [
      "sound",
      "spirit"
    ],
    "description": "特殊行動を通常攻撃に置換・2ラウンド",
    "effect": "silence",
    "power": 1
  },
  "shadow_dust": {
    "id": "shadow_dust",
    "name": "かげのこな",
    "category": "命中低下",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "blind",
        "power": 0.25,
        "duration": 2
      }
    ],
    "themeTags": [
      "shadow",
      "insect"
    ],
    "description": "攻撃の失敗率25%・2ラウンド",
    "effect": "blind",
    "power": 0.25
  },
  "purge_chime": {
    "id": "purge_chime",
    "name": "うちけしの音",
    "category": "強化解除",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "dispel",
        "power": 0
      }
    ],
    "themeTags": [
      "sound",
      "spirit"
    ],
    "description": "強化・盾を解除",
    "effect": "dispel",
    "power": 0
  },
  "eclipse_wave": {
    "id": "eclipse_wave",
    "name": "日食の波動",
    "category": "攻撃＋解除",
    "target": "allEnemies",
    "cost": 9,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 0.9
      },
      {
        "effect": "dispel",
        "power": 0
      }
    ],
    "themeTags": [
      "shadow",
      "moon"
    ],
    "description": "攻撃値×0.9のダメージ / 強化・盾を解除",
    "effect": "damage",
    "power": 0.9
  },
  "resonant_chime": {
    "id": "resonant_chime",
    "name": "ひびきの鈴音",
    "category": "攻撃＋解除",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.25
      },
      {
        "effect": "dispel",
        "power": 0
      }
    ],
    "themeTags": [
      "sound",
      "bell"
    ],
    "description": "攻撃値×1.25のダメージ / 強化・盾を解除",
    "effect": "damage",
    "power": 1.25
  },
  "rock_knuckle": {
    "id": "rock_knuckle",
    "name": "岩のこぶし",
    "category": "攻撃",
    "target": "enemy",
    "cost": 2,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 1.6
      }
    ],
    "themeTags": [
      "earth",
      "stone",
      "golem"
    ],
    "description": "攻撃値×1.6のダメージ",
    "effect": "damage",
    "power": 1.6
  },
  "crescent_slash": {
    "id": "crescent_slash",
    "name": "三日月の刃",
    "category": "攻撃＋弱体",
    "target": "enemy",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 1.4
      },
      {
        "effect": "defenseDown",
        "power": 0.1,
        "duration": 3
      }
    ],
    "themeTags": [
      "blade",
      "moon",
      "insect"
    ],
    "description": "攻撃値×1.4のダメージ / 被ダメージ増加 10%・3ラウンド（重複加算なし）",
    "effect": "damage",
    "power": 1.4
  },
  "sand_screen": {
    "id": "sand_screen",
    "name": "すなけむり",
    "category": "攻撃＋状態",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 0.7
      },
      {
        "effect": "blind",
        "power": 0.2,
        "duration": 2
      }
    ],
    "themeTags": [
      "sand",
      "earth"
    ],
    "description": "攻撃値×0.7のダメージ / 攻撃の失敗率20%・2ラウンド",
    "effect": "damage",
    "power": 0.7
  },
  "hourglass_hush": {
    "id": "hourglass_hush",
    "name": "砂時計のしずけさ",
    "category": "弱体",
    "target": "enemy",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "attackDown",
        "power": 0.25,
        "duration": 3
      },
      {
        "effect": "silence",
        "power": 1,
        "duration": 1
      }
    ],
    "themeTags": [
      "clock",
      "sand"
    ],
    "description": "攻撃低下 25%・3ラウンド（重複加算なし） / 特殊行動を通常攻撃に置換・1ラウンド",
    "effect": "attackDown",
    "power": 0.25
  },
  "gear_winding": {
    "id": "gear_winding",
    "name": "ぜんまいチャージ",
    "category": "強化＋盾",
    "target": "self",
    "cost": 5,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "attackUp",
        "power": 0.3,
        "duration": 3
      },
      {
        "effect": "shield",
        "power": 0.5,
        "duration": 2,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "clock",
      "metal"
    ],
    "description": "攻撃強化 30%・3ラウンド（重複加算なし） / 攻撃値×0.5の吸収盾・2ラウンド",
    "effect": "attackUp",
    "power": 0.3
  },
  "mirror_veil": {
    "id": "mirror_veil",
    "name": "鏡のまもり",
    "category": "盾＋予防",
    "target": "ally",
    "cost": 6,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "shield",
        "power": 1.2,
        "duration": 2,
        "scale": "attack"
      },
      {
        "effect": "statusWard",
        "power": 1,
        "duration": 3
      }
    ],
    "themeTags": [
      "mirror",
      "crystal"
    ],
    "description": "攻撃値×1.2の吸収盾・2ラウンド / 悪い状態を1回防ぐ・3ラウンド",
    "effect": "shield",
    "power": 1.2
  },
  "venom_needle": {
    "id": "venom_needle",
    "name": "どくばり",
    "category": "攻撃＋状態",
    "target": "enemy",
    "cost": 4,
    "level": 5,
    "inheritLevel": 7,
    "effects": [
      {
        "effect": "damage",
        "power": 0.7
      },
      {
        "effect": "poison",
        "power": 0.25,
        "duration": 3,
        "scale": "attack"
      }
    ],
    "themeTags": [
      "needle",
      "poison",
      "insect",
      "aquatic"
    ],
    "description": "攻撃値×0.7のダメージ / 毒：ラウンド終了時に攻撃値×0.25ダメージ・3回（最大HP10%上限）",
    "effect": "damage",
    "power": 0.7
  },
  "razor_leaf": {
    "id": "razor_leaf",
    "name": "はっぱカッター",
    "category": "連撃",
    "target": "enemy",
    "cost": 3,
    "level": 1,
    "inheritLevel": 3,
    "effects": [
      {
        "effect": "damage",
        "power": 0.85
      },
      {
        "effect": "damage",
        "power": 0.85
      }
    ],
    "themeTags": [
      "blade",
      "leaf",
      "insect"
    ],
    "description": "攻撃値×0.85のダメージ / 攻撃値×0.85のダメージ",
    "effect": "damage",
    "power": 0.85
  },
  "sprout_heal_tier2": {
    "id": "sprout_heal_tier2",
    "name": "リーフェル",
    "category": "回復",
    "target": "ally",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "heal",
        "power": 0,
        "fixedHeal": 75
      }
    ],
    "themeTags": [
      "seed",
      "leaf",
      "plant"
    ],
    "description": "生存味方1体のHPを75回復（蘇生なし）。不正解は半分。",
    "effect": "heal",
    "power": 0,
    "series": "sprout_heal",
    "stage": 2,
    "fixedHeal": 75,
    "seriesText": "めぶきの手当て Lv.1 → リーフェル Lv.10 → リーフェリア Lv.22"
  },
  "sprout_heal_tier3": {
    "id": "sprout_heal_tier3",
    "name": "リーフェリア",
    "category": "回復",
    "target": "ally",
    "cost": 16,
    "level": 22,
    "inheritLevel": 24,
    "effects": [
      {
        "effect": "heal",
        "power": 0,
        "fullHeal": true
      }
    ],
    "themeTags": [
      "seed",
      "leaf",
      "plant"
    ],
    "description": "生存味方1体のHPを全回復（蘇生なし）。不正解は最大HPの50%回復。",
    "effect": "heal",
    "power": 0,
    "series": "sprout_heal",
    "stage": 3,
    "fixedHeal": 35,
    "fullHeal": true,
    "seriesText": "めぶきの手当て Lv.1 → リーフェル Lv.10 → リーフェリア Lv.22"
  },
  "ember_tier2": {
    "id": "ember_tier2",
    "name": "紅蓮弾",
    "category": "攻撃",
    "target": "enemy",
    "cost": 6,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 2.8
      }
    ],
    "themeTags": [
      "fire"
    ],
    "description": "敵1体に攻撃値×2.8のダメージ。",
    "effect": "damage",
    "power": 2.8,
    "series": "ember",
    "stage": 2,
    "seriesText": "ひのこ Lv.1 → 紅蓮弾 Lv.10 → ヴァルフレア Lv.22"
  },
  "ember_tier3": {
    "id": "ember_tier3",
    "name": "ヴァルフレア",
    "category": "攻撃",
    "target": "enemy",
    "cost": 12,
    "level": 22,
    "inheritLevel": 24,
    "effects": [
      {
        "effect": "damage",
        "power": 4.2
      }
    ],
    "themeTags": [
      "fire"
    ],
    "description": "敵1体に攻撃値×4.2のダメージ。",
    "effect": "damage",
    "power": 4.2,
    "series": "ember",
    "stage": 3,
    "seriesText": "ひのこ Lv.1 → 紅蓮弾 Lv.10 → ヴァルフレア Lv.22"
  },
  "water_bolt_tier2": {
    "id": "water_bolt_tier2",
    "name": "奔流の矢",
    "category": "攻撃",
    "target": "enemy",
    "cost": 6,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 2.8
      }
    ],
    "themeTags": [
      "water",
      "aquatic"
    ],
    "description": "敵1体に攻撃値×2.8のダメージ。",
    "effect": "damage",
    "power": 2.8,
    "series": "water_bolt",
    "stage": 2,
    "seriesText": "みずでっぽう Lv.1 → 奔流の矢 Lv.10 → アクエリオン Lv.22"
  },
  "water_bolt_tier3": {
    "id": "water_bolt_tier3",
    "name": "アクエリオン",
    "category": "攻撃",
    "target": "enemy",
    "cost": 12,
    "level": 22,
    "inheritLevel": 24,
    "effects": [
      {
        "effect": "damage",
        "power": 4.2
      }
    ],
    "themeTags": [
      "water",
      "aquatic"
    ],
    "description": "敵1体に攻撃値×4.2のダメージ。",
    "effect": "damage",
    "power": 4.2,
    "series": "water_bolt",
    "stage": 3,
    "seriesText": "みずでっぽう Lv.1 → 奔流の矢 Lv.10 → アクエリオン Lv.22"
  },
  "spark_tier2": {
    "id": "spark_tier2",
    "name": "雷鳴槍",
    "category": "攻撃",
    "target": "enemy",
    "cost": 7,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "damage",
        "power": 3
      }
    ],
    "themeTags": [
      "thunder"
    ],
    "description": "敵1体に攻撃値×3のダメージ。",
    "effect": "damage",
    "power": 3,
    "series": "spark",
    "stage": 2,
    "seriesText": "ちいさな雷 Lv.1 → 雷鳴槍 Lv.10 → 轟雷ゼルガ Lv.22"
  },
  "spark_tier3": {
    "id": "spark_tier3",
    "name": "轟雷ゼルガ",
    "category": "攻撃",
    "target": "enemy",
    "cost": 13,
    "level": 22,
    "inheritLevel": 24,
    "effects": [
      {
        "effect": "damage",
        "power": 4.5
      }
    ],
    "themeTags": [
      "thunder"
    ],
    "description": "敵1体に攻撃値×4.5のダメージ。",
    "effect": "damage",
    "power": 4.5,
    "series": "spark",
    "stage": 3,
    "seriesText": "ちいさな雷 Lv.1 → 雷鳴槍 Lv.10 → 轟雷ゼルガ Lv.22"
  },
  "leaf_shield_tier2": {
    "id": "leaf_shield_tier2",
    "name": "翠葉の障壁",
    "category": "盾",
    "target": "ally",
    "cost": 6,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "shield",
        "power": 0.28,
        "duration": 2
      }
    ],
    "themeTags": [
      "leaf",
      "plant"
    ],
    "description": "味方1体に最大HPの28%を吸収する盾（2ターン・加算不可）。",
    "effect": "shield",
    "power": 0.28,
    "series": "leaf_shield",
    "stage": 2,
    "duration": 2,
    "seriesText": "葉っぱの盾 Lv.1 → 翠葉の障壁 Lv.10 → フォレスティア Lv.22"
  },
  "leaf_shield_tier3": {
    "id": "leaf_shield_tier3",
    "name": "フォレスティア",
    "category": "盾",
    "target": "ally",
    "cost": 10,
    "level": 22,
    "inheritLevel": 24,
    "effects": [
      {
        "effect": "shield",
        "power": 0.4,
        "duration": 2
      }
    ],
    "themeTags": [
      "leaf",
      "plant"
    ],
    "description": "味方1体に最大HPの40%を吸収する盾（2ターン・加算不可）。",
    "effect": "shield",
    "power": 0.4,
    "series": "leaf_shield",
    "stage": 3,
    "duration": 2,
    "seriesText": "葉っぱの盾 Lv.1 → 翠葉の障壁 Lv.10 → フォレスティア Lv.22"
  },
  "brave_roar_tier2": {
    "id": "brave_roar_tier2",
    "name": "覇気の号令",
    "category": "強化",
    "target": "ally",
    "cost": 5,
    "level": 10,
    "inheritLevel": 12,
    "effects": [
      {
        "effect": "attackUp",
        "power": 0.3,
        "duration": 3
      }
    ],
    "themeTags": [
      "beast",
      "horn",
      "sound"
    ],
    "description": "味方1体の攻撃を30%強化（3ターン・重ね掛け不可）。",
    "effect": "attackUp",
    "power": 0.3,
    "series": "brave_roar",
    "stage": 2,
    "duration": 3,
    "seriesText": "勇気のほうこう Lv.1 → 覇気の号令 Lv.10 → グランヴォーク Lv.22"
  },
  "brave_roar_tier3": {
    "id": "brave_roar_tier3",
    "name": "グランヴォーク",
    "category": "強化",
    "target": "ally",
    "cost": 8,
    "level": 22,
    "inheritLevel": 24,
    "effects": [
      {
        "effect": "attackUp",
        "power": 0.4,
        "duration": 3
      }
    ],
    "themeTags": [
      "beast",
      "horn",
      "sound"
    ],
    "description": "味方1体の攻撃を40%強化（3ターン・重ね掛け不可）。",
    "effect": "attackUp",
    "power": 0.4,
    "series": "brave_roar",
    "stage": 3,
    "duration": 3,
    "seriesText": "勇気のほうこう Lv.1 → 覇気の号令 Lv.10 → グランヴォーク Lv.22"
  }
};
if(typeof module!=="undefined")module.exports=SKILL_CATALOG;
