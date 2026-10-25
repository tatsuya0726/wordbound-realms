# ごちゃまぜモンスター 引き継ぎ書

作成: 2026-10-22。実装基準: `940be77be16c718e3e2a22ff9304949fc054abb3`（PR #5）。この文書の追加後も開発が進む可能性があるため、開始時に最新履歴・未コミット変更を確認する。

## 正本と別バージョンの区別

| 項目 | 正しい対象 |
|---|---|
| GitHub | https://github.com/tatsuya0726/wordbound-realms |
| プレイURL | https://tatsuya0726.github.io/wordbound-realms/ |
| ローカル作業先 | `C:\Users\god03\lexi-quest-improvements` |
| 本番ブランチ | `main` |
| 配信 | GitHub Pages / mainブランチのルート / legacy build |
| セーブ | ブラウザlocalStorage `wordbound-realms-v1` |

別の `tatsuya0726/words-and-wilds-rpg` は素材・問題の取り込み元となった別プロジェクトで、継続開発の対象ではない。ユーザーは混同を避けるため別版の削除を希望している。公開停止・保管化か完全削除かの範囲は確認中であり、この文書だけで削除済みと判断しないこと。

`C:\Users\god03\WordboundRealms` は同じ wordbound-realms の古いローカルコピー（調査時 `e226524`、未コミット変更なし）。正本と間違えて編集・pushしない。ユーザーの「別版を消す」をこのフォルダーの削除と勝手に解釈しない。

## ユーザーの意図・対応済みの内容

- 旧LEXI QUESTから「ごちゃまぜモンスター」へ改題。英語学習とHD-2D風の世界を維持する。
- 横画面優先。街・フィールドは画面全体に表示。左下に立体的な仮想スティック、右下にA/B。画面は固定し、ウィンドウ内部だけスクロールする。
- 戦闘は上部ステータス、背景、下部メッセージ／コマンドを分割。黒地と白枠を基調にしたクラシックRPG風の独自UI。
- 通常の敵は1〜3体、味方の同行モンスターは最大3体。物語ボスは単独。対象選択で攻撃・木の実・スカウトの相手を変更できる。
- 地上の敵は接地・不透明。鳥・蛾・フクロウ種だけ浮遊。敵の頭上に連続HPバーを表示。
- 主人公は小柄でわんぱくな少年。少年・キキ・ネネは各4方向×3フレームの歩行。猫は主人公の通った経路を追い、停止時はニュートラル姿勢。
- **キキはクリームオレンジの長毛猫、ネネは白銀色の長毛猫。どちらも大きな立ち尾と緑系の目。** ユーザー提供の全身画像を参照している。別の猫や人型キャラに戻さない。
- タイトルに三層世界の地図・光・少年と猫の並びを追加。
- 地上・空中・地下の全体地図。空中庭園／地底水晶庭は実際に探索でき、案内人・商人・英語試練・敵・帰還口がある。
- 仲間8種・最大3体の同行・4通りの親消費配合・餌を与えてから確率スカウト。
- 文法の呪文問題370問、9学習帯（小1〜中3目安）。単語／リスニングと物語の試験は既存の3段階を継続。
- 学習ノートに誤答を保存。復習で2回正解すると克服、また誤答すると復習対象に戻る。誤答でも攻撃／回復は50％発動。

ユーザーは「反映して」と繰り返し依頼しており、直前までの変更はmainにマージ・公開確認済み。アドレスは変えない。次の新しい依頼の範囲に沿って作業し、関係ない別ゲームを編集しない。

## ファイル構成と接続

| ファイル | 役割 |
|---|---|
| `index.html` | ページ・本体ロジック・状態・会話・問題・マップ・Three.js描画・入力・起動 |
| `companion-data.js` | 仲間8種・配合レシピ・370問のデータ |
| `companion-rules.js` | 個体管理、編成、育成、配合、スカウト確率のルール |
| `companion-ui.js` | 仲間UI、保存トランザクション、餌・スカウト、画像の余白正規化 |
| `walk-sprites.js` | 少年／猫の画像読込、方向とフレーム、猫の経路追従 |
| `world-ui.js` | 立ち絵、世界地図、追加エリア、猫との会話、仮想スティック、街の装飾 |
| `party-battle.js` | 複数敵の戦闘ループ、対象選択、報酬、HPバーと味方の描画 |
| `landscape.css` | 全画面探索・横向き基本レイアウト |
| `party-ui.css` | 戦闘レイアウト・タイトルの追加スタイル（後から読み込む） |
| `assets/world/` | 世界地図・戦闘背景 |
| `assets/companions/` | モンスター画像、取り込み元の猫画像 |
| `assets/walk/` | 採用中の少年／キキ／ネネの歩行シート・静止画・生成記録 |
| `assets/people/` | 街の人物素材 |
| `assets/ART-SOURCES.md` | Drive由来の素材対応表 |

全体はビルド不要の静的サイト。Three.js r128をCDNから読む。npmはテスト用で、PhaserやUnityのランタイムではない。外部スクリプトとinline本体がグローバル関数・状態を共有しているため、読み込み順・名前の衝突に注意。

## 状態と変更時の注意点

- `S`: セーブ対象の主人公・進行・所持品・仲間。`opt`: 学習／音声などの設定。保存形式は `{S,opt}`。
- `S.companions`: `version,nextUid,owned,team,seen,breeds`。同じ種でも個体UIDで区別する。
- `commitCompanionChange` はコピーに変更→検証→保存成功→本体差し替え。保存失敗時に親や仲間が消えないよう、配合・加入はこの経路を維持。
- 旧セーブの仲間移行は元データを `wordbound-realms-v1-before-companions` に退避。読み込み互換性を維持。
- `B.enemies`: 最大3体の戦闘用コピー。各敵は `slot,hp,max,fed,caught,hitAt,attackAt` を持つ。
- `B.E` と `B.key`: 選択中の敵。`B.fed` は `B.E.fed` へのgetter/setter。餌・スカウトは敵ごとに管理する。
- 倒した敵と加入した敵は反撃しない。他の敵が残れば続行。勝利時の報酬は倒した敵だけを合計する。
- **味方の独立した3体分のHP／個別ターンは未実装。** 仲間は連携攻撃を支援し、主人公のHP・MPを共有する。表示には「共有」と明記。
- 飛行種は `AIRBORNE_SPECIES`。旧敵の `spr:'wisp'` だけで浮遊／透明を判定しない。
- `creatureCanvas` は画像の透明余白を検出し、足元を96pxキャンバスの下端に揃える。
- 移動方向は `0=上、1=右、2=下、3=左`。歩行シートの行順は `下・左・右・上`、列順は `左足・静止・右足`。64pxセル、全体192×256px。
- `run()` と `busy` で移動を止め、完了後に保存。`mode` はtitle/walk/battle。`body.dataset.view` がUIを切り替える。
- `ask` のクリック受付に約140msのガードがある。UIテストは画面切替後180〜200ms待つ。
- `next` はconstなのでテストで代入しない。自動進行が必要なら `ask` を差し替えてfinallyで戻す。
- 戦闘canvasは表示領域に合わせて可変サイズ。探索／タイトルでは480×352に戻す。

## 素材と参考

背景と人物は所有者のGoogle Drive「ChatGPT / ゲーム用モンスター素材」から取り込み済み。モンスター・問題の一部は別リポジトリからコピー済み。実行時にDriveや別版リポジトリへアクセスしないので、別版を公開停止しても動作する。

少年と猫はbuilt-in imagegenで生成し、共通倍率・足元アンカーで正規化。最終プロンプトは `assets/walk/PROMPTS.md`。参照元の猫写真はこのPCの次の場所（リポジトリには含めていない）:

- ネネ: `C:\Users\god03\.codex\codex-remote-attachments\01a116bb-059b-7342-bc4d-547b1ed7ad07\0865E070-4EEC-481E-B049-D23126D393AC\1-写真1.jpg`
- キキ: 同じフォルダーの `2-写真2.jpg`

ユーザーが以前示したNotionリンク: https://app.notion.com/p/Claude-v8-4015fd76ba67815d930ddfde552ade4c 。本文を再取得していないので、この文書をそのページ全体の仕様実装保証として扱わない。YouTubeの分析はユーザーが取りやめているため再開不要。

## 検証

```powershell
npm install
npx playwright install chromium
npm test
```

インストール済みEdgeを使う場合は `$env:BROWSER_CHANNEL='msedge'`。このPCでは次の既存ランタイムでも検証済み:

```powershell
$env:NODE_PATH='C:\Users\god03\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
$env:BROWSER_CHANNEL='msedge'
npm test
```

`playtest.cjs` 9項目、`companion-test.cjs` 24項目、`landscape-test.cjs` 14項目、`party-test.cjs` 30項目、合計77項目を基準コミットで通過。各テストは自前のローカルサーバーを起動し、独立したブラウザでセーブなどを操作する。結果と画像はgitignore対象の `qa/`。

- 667×375、844×390、390×844、1366×768などを確認。
- 対象別ダメージ・餌・スカウト、残敵の行動、勝敗・報酬、旧セーブ、学習、移動と猫の停止を検証。
- 公開版でも3体の敵／味方・歩行画像の読み込み・描画エラーなし・配信コード一致を確認。
- **実機iPhoneでのタッチ・音声、全ストーリーの通しプレイは未確認。** PCのモバイル表示テストと区別する。
- 全体地図の絵に描かれたすべての地点が実装済みではない。
- 街の大人NPCは以前の立ち絵が残る。全人物に新規4方向シートがあるわけではない。

## 公開の流れ

1. 正しい作業先で `git status` / `git log` を確認し、目的のブランチで変更。
2. 変更に必要なテストと画面確認。既存セーブを壊さない。
3. コミット・pushし、PRに結果を記載。直近の実装PRは https://github.com/tatsuya0726/wordbound-realms/pull/5 。
4. mainへマージ後に `pages build and deployment` の成功を確認。マージだけで公開完了とはしない。
5. 同じ公開URLで新コード・画像・操作を確認。WindowsのCRLFと公開時LFは比較時に正規化する。

URLとセーブキーを変更せず、キャッシュを理由にセーブ削除を案内しない。古い表示なら通常の再読み込みを試す。開発用の認証情報は文書・リポジトリへ書かない。

## スマホの全画面と画質（2026-10-22）

- iPhone Safariの横画面で上に出る帯は、Safariのツールバー（ページの色で塗られる）。ページ側からは消せないため、`manifest.webmanifest`（display: fullscreen）と apple-mobile-web-app 系のmetaを追加し、ホーム画面に追加して開くと全画面になるようにした。右上の「全画面」ボタン（タッチ端末のみ）は、Androidなどでは Fullscreen API、iPhoneでは「ホーム画面に追加」の案内を出す。アイコンは `assets/app/`。
- 画質: `creatureCanvas` は96px→256pxで高品質縮小し `c.smooth=true`。人物の立ち絵は320px。`sprTex` は `smooth` の画像だけ線形補間。バトルとタイトルの2Dキャンバスは表示サイズ×devicePixelRatio（最大3）で描き、描画コードは `VIEW.w/VIEW.h`（CSS px）を使う。探索中の2Dオーバーレイは従来どおり480×352。
- 少年・キキ・ネネの歩行画像は64pxのドット絵が元なので、ドットのまま（Nearest）表示している。

## 会話・お店の立ち絵（2026-10-22）

- 対象は**横画面スマホ・PC・テレビ**。縦画面は今後考慮しない（ユーザー指示）。
- 話しかけた相手（`talk()` の `e.pal` → `PORTRAIT_ROLE`）のバストアップを会話中だけ左側に表示する（`showPortrait`、`#portrait`、`body.with-portrait`）。会話中はスティック・場所表示を隠す。
- 素材: Drive「ゲーム用モンスター素材/街・人物素材」の `*_portrait.png`（1254px、PCでは `G:\マイドライブ\...` に同期済み）を512pxのWebPにして `assets/portraits/` に置いた。
- 子ども・主人公（hero/boy/child）と幽霊には立ち絵がない。**主人公の少年の立ち絵はユーザーが後で用意する予定**。届いたら同じ形式で取り込み、主人公側の表示を追加する。

## タイトル画面（2026-10-22）

アビスデッキのタイトルを参考に、`title-luxe.css`（最後に読み込む）で作り直した。中央に金のエンブレム・金×水色グラデの題字・枠付きメニュー（先頭の使えるボタンを金の光るボタンにする：セーブがあれば Continue、なければ New Game）、四隅に仲間（トモス・フクロウ・ピヨコーン・モリゼル）が浮かび、左下に少年とキキ・ネネ。寸法は `--u`（画面の高さの1%）基準で、スマホ横画面からPC・テレビまで拡縮する。タイトルのメニュー表示中だけ `body.title-menu` を付けて説明文（#log）を隠す。上書き確認ダイアログは従来どおり #log を使う。縦画面は対象外。

## Godot試作版（2026-10-22 追加）

ユーザーの依頼「Godotでクオリティを上げる」に対し、**本編はそのまま**、別アドレスで比較できる試作を作った。本編のURL・セーブ・テストには影響しない。

| 項目 | 内容 |
|---|---|
| ソース | `godot-src/`（Godot 4.7.2 / Compatibility レンダラー / GDScript） |
| 公開物 | `godot/`（Web書き出し・スレッドなし版。GitHub Pagesでそのまま動く） |
| URL（mainに入った後） | https://tatsuya0726.github.io/wordbound-realms/godot/ |
| このPCのGodot | `C:\Users\god03\AppData\Local\Microsoft\WinGet\Packages\GodotEngine.GodotEngine_Microsoft.Winget.Source_8wekyb3d8bbwe\Godot_v4.7.2-stable_win64_console.exe`（Web書き出しテンプレート導入済み） |

内容: タイトル → こもれびの村 → 草原の1〜3体バトル。2回目の改修（同日）で Octopath Traveler 型のHD-2Dと『夢をみる島』リメイク風のジオラマ感を目標に作り直した。

- 村: 夕方の斜光（ACES）、ボロノイ石畳と芝・土をなじませる地面シェーダー＋物陰の暗がり（splat の a に焼き込み）、2階が張り出した木組みの家・瓦屋根・窓明かり・煙突の煙・看板、門柱とランタン、北の家並み・風車・大樹、葉っぱカード数千枚の木（MultiMesh）、草むら・花、蝶・落ち葉・花粉・光の筋、強めのティルトシフトと色調整。
- バトル: 白樺の林と草原を3Dで組んだ舞台。少年・キキ・ネネは後ろ姿で手前、敵は奥。攻撃ごとにカメラが寄り、斬撃（三日月）・呪文（地面の魔法陣と光の柱）・こだま（音の輪）・火花・閃光・被弾の赤フラッシュ、勝利時は仲間がジャンプ。
- 共通部品は `scripts/art.gd`（手続きテクスチャ、Foliage、環境光、仕上げパス）。
- Webでは初めて入る場所で数秒止まる（WebGLが影や光のシェーダーを初回にまとめてコンパイルするため）。その間は「よみこみ中…」を表示する。少年・キキ・ネネの歩行シート、人物・モンスター・背景画像、英語問題（単語・呪文370問・リスニング・会話）は本編から複製して使う。BGM・効果音はコード内で合成したチップチューン。

- **セーブは読み取りのみ**: 同じドメインなら localStorage `wordbound-realms-v1` からLv・HP・所持金・薬草・同行仲間・学習帯を読む。試作版からは**一切書き込まない**。試作内の経験値などはページを閉じると消える。
- 未実装: スカウト・配合・学習ノート・物語の進行・港町など他マップ。日本語訳の表示切替。iPhone実機での確認。
- `godot-src/data/` と `godot-src/assets/` は本編からの複製。問題や画像を本編で変えたら `node godot-src/tools/sync-from-web.cjs` で再同期する。
- `godot-src/assets/baked/` はWebでの読み込み短縮用（BGM、`Art.TEXTURES` の手続きテクスチャ、村の `village_splat.png`）。合成ロジック・テクスチャ・村の配置を変えたら `Godot... --path godot-src -- bake=1` で作り直す（ウィンドウ付きで実行。headless では動かない）。BGMの `.import` はループ設定（`edit/loop_mode=2`）、テクスチャは `mipmaps/generate=true`、splat は `fix_alpha_border=false` にしてある。
- 書き出し: `Godot... --headless --path godot-src --export-release "Web" ../godot/index.html`。`godot/index.wasm` は約38MB（Godot本体）。
- 確認用: `Godot... --path godot-src -- scene=battle shot=C:/tmp/b.png after=5 press=accept@3.4` で画面を開いて自動操作・撮影できる。
- フォントは DotGothic16（SIL OFL、`godot-src/assets/fonts/OFL.txt`）。

## 次の担当者への依頼文

「このリポジトリの `CLAUDE.md` と `HANDOFF.md` を読んで、ごちゃまぜモンスターの開発を引き継いでください。正本は wordbound-realms で、words-and-wilds-rpg は別版です。まず現在の変更・公開状況を確認してください。既存セーブと公開URL、英語学習、HD-2D、少年・キキ・ネネのデザインを維持し、私の次の依頼から作業を続けてください。」

## 参考画像に合わせた戦闘画面（2026-10-22）

本編の戦闘UIを、ユーザー提供のクラシックRPG画面を参考に更新。背景を全画面に広げ、上部に共有HP／MPと最大3体の仲間、中央に敵、左下にコマンド、右下にメッセージ／英語問題を配置する。縦画面では下部の2枠を上下に並べる。白枠・暗い半透明のウィンドウを用い、敵の描画領域はウィンドウの実寸から計算する。対象選択は少し手前に重なる枠として表現する。

味方のスプライトは上部の仲間欄へ移動。独立したHP／MPは追加せず共有値を明示する。背景の高解像度描画、英語問題、最大3体、地上敵の接地、頭上HPバーを保持。新しいタイトル画面とGodot試作版はこの変更の対象外。

`party-battle.js` の `battleStageBounds()` が敵を置ける範囲を返す。`body.dataset.battlePhase` は command / target / item / question / message。戦闘の見た目は `party-ui.css` にあり、タイトル部分を上書きしないこと。

## UIの編集方針（2026-10-23）

ユーザーは「どうする？」のように選択肢から自明な問いかけ、標語、スタート画面の遊び方説明を不要としている。操作は選択マーク・配置・無効状態・必要な数値で示す。英語の問題文／解説、会話、保存失敗や上書き確認など意味のある情報は保持する。

戦闘の基本メニューは「たたかう・どうぐ・スカウト・にげる」の4項目。「たたかう」から単語／文法（MP表示）／リスニング／対象／戻るへ進む。敵一覧は名前と匹数、選択マークのみで、行を押して対象を変更できる。同じ種類はまとめる。`battleCommands()` と `battleEnemyList()` が担当。説明的なコマンド副題、繰り返す共有HPの案内、主観的な成功演出文を減らした。

タイトルはロゴ・世界観の絵・日本語の開始メニューを中心とし、標語・説明・地上／空中／地下のラベルを削除。英語問題の本文は変更していない。UIの文言を足す際は、選択肢や数値だけで伝わらないか先に検討する。

## 2026-10-24: 正式開発対象とタイトル背景
ユーザーが旧LEXI系統の本repoを正式な「ごちゃまぜモンスター」と再確認。words-and-wilds-rpgは削除せず「ことばとモンスター（旧試作版）」へ改名。今後の正規開発は本repo。採用済み背景3枚はassets/title-0.png～title-2.png。title()ごとに1枚を選び、描画ループでは再抽選しない。title-art.js/cssで画像読込・失敗時代替を処理。浮遊モンスターとタイトル上の人物ドット装飾を削除。ゲーム内素材・ルール・保存形式は変更していない。

## 世界地図どおりの世界とイベント（2026-10-24）

`assets/world/surface.webp`（1600×900）を25px＝1マスでなぞった **64×36 の新フィールド**に作り直した。`tools/build-world.cjs` が海岸・地域・川・道・名所を生成し `world-map-data.js`（`WORLD_ROWS`/`WORLD_POI`）を書き出す。絵の位置を変えたいときは生成スクリプトを直して再実行する（`tools/surface-64x36.json` は絵の色の平均で、参考用）。

- フィールド記号: `~`海・川 `^`岩山 `n`雪山 `M`峡谷 `L`溶岩 `.`草原 `T`森 `s`砂漠 `=`道 `B`橋 `u`畑。名所: V村 P港 C洞窟 G大樹の森 H滝の祠 K王都 A炎のふもと村 Y炎の山 R砂の遺跡 O オアシス X沈黙の塔 I灯台の島（港の船でのみ行ける）。
- 大河が東西を分け、渡れるのは大橋だけ（番兵の文法試験＝`bridgeOpen`）。東側に王都・炎のふもと村・炎の山・砂漠（遺跡・オアシス・塔）。
- 本筋の変更: 2つ目のかけらの学者レクサは港から**王都ルミナ**へ移動（港には助手が案内）。長老・番兵・目標・冒険の記録の方角を新しい地図に合わせた。英語問題は変更していない。
- 新しい場所（`world-expansion.js` の `NEW_MAPS`）: 王都ルミナ／炎のふもと村／オアシスの町／灯台の島／大樹の森／滝の祠／砂の遺跡（石板3枚→スフィンクス）／炎の山（溶岩ゴーレム）。各地に宿・店・NPC・宝箱。
- 人助け（`QUESTS`、冒険の記録に表示、5つで王から王家の剣）: 畑のことば、迷子のメイ、大樹の試練、こだまの試練、騎士団長の試験、失われた本（王都→遺跡）、炎の山のゴーレム（ふもと村→炎の山）、灯台のあかり（灯台→オアシスの油）、道しるべを読む（看板5か所）。フィールドには看板・吟遊詩人・釣り人・隠者・行商人・宝箱も置いた。
- 新装備: 鋼の斧・鉄のよろい（ふもと村）、銀の剣・ミスリルの鎧（王都）、報酬で騎士の盾・葉の鎧・炎の剣・王家の剣。`equip()` は今より強いときだけ装備を替える。
- 世界地図画面: 地上の絵の上に、主人公の位置（赤い点）と訪れた場所のピンを表示。ピンを選んで「ここへ行く」で移動できる（訪問済みのみ、`seen_<map>` フラグ）。
- セーブ: 保存形式とキーは同じ。`S.worldV=2` を追加し、旧フィールド上で保存したデータは村の門の前から再開する（`migrateWorld(sv.S.worldV)`）。新しいフラグは `q_<id>`、`seen_<map>`、`sign<n>` など `S.flags` のみ。
- エンジン側の汎用化: マップの `walls`（壁の種類）・`town`（家・屋台・街灯）・`ground`（地面の色）・`torches`・`lava`、エンティティの `prop`（看板・石板）。地域別の敵は `worldZone()`。
- 検証: `world-test.cjs`（`npm test` に追加）で、全マスの配置・大橋の通行制限・全名所への到達・8か所の描画・旧セーブ移行・世界地図のピンを確認。

## 島の国を拠点にした箱庭ゲームへ（2026-10-24）

ゲームの軸を「ことのは島」の発展に変更。主人公はモンスターマスターの素質を持ち、王（King Oswin）の依頼で、広場のワープポイントから異世界へ行ってモンスターを仲間にし、島を発展させる。英語問題で戦う仕組み・保存キー・既存の問題は変えていない。実装は `island-hub.js`。

- 新しいゲームは島の城の前から始まる（`newState()` の `map:'island'`、`hubV:1`、`S.island`）。
- キキ（牧場、(27,9)）とネネ（配合小屋、(6,11)）は固定配置。主人公の後ろを歩く猫は廃止（`addWalkingCats` の呼び出しを外した。経路計算の関数は残している）。牧場の柵の中を、所持モンスター（最大14体）が歩き回る。
- チュール（`ITEM.churu`、島の店20G、ボス・闘技場の報酬）をキキ・ネネにあげると好感度が上がり、3/6/10/15/20本目にお礼の品。
- 島スコア＝仲間数×3（15体まで）＋チュール数×2＋異世界クリア×12＋闘技場の杯×10。レベル境目は 12/30/55/85。レベルで地形が変わる（`ISLAND_TEMPLATE` の数字マス）: Lv2 闘技場の小島へ橋、Lv3 北の森が開けて温泉・畑、Lv4 北西の岩が崩れて山頂へ、Lv5 祭りの飾りと山頂の賢者の記念品。ブロンズ杯優勝で南の浜辺が現れる。
- ワープ（`WARPS`）: ①はじまりの草原（新マップ `meadow`、ボス草原の主）→②空中庭園（ボス空の王）→③地底水晶庭（ボス水晶の番人）→④ルミナ大陸（既存の大陸と本筋。ボス沈黙の王＝`won`）→⑤夢の島（悪夢の主。シルバー杯優勝も必要）。前の世界のボスを倒すと次のワープが開き、自動で島へ戻る。各世界には帰還用のワープ（ルミナは村の中）。
- 闘技場（島レベル2から）: ブロンズ杯・シルバー杯（空中庭園クリア後）・ゴールド杯（ルミナ大陸クリア後）。他国のマスターと3連戦（途中回復なし、`ar_<杯>_<種族>` の敵、スカウト不可）。優勝で賞金・チュール・浜辺／夢の島ワープ／王者の冠。
- 世界地図: 「ここへ行く」ピンはルミナ大陸にいる時だけ。空中・地下の「探索」は、そのワープが開いている時だけ表示。
- 旧セーブ: `migrateHub(sv.S.hubV)` で島から再開（`metKing` 済み、`won` 済みなら①〜③もクリア扱い、宿は島）。
- テスト: `island-test.cjs` を追加（9項目）。猫の追従・第2章の目標・世界地図の入場など、意図して変えた挙動に合わせて既存テストを更新。全テストの合計は93項目。
- テスト用ブラウザは `test-quiet.cjs` で無音（`--mute-audio` と読み上げの無効化）。ユーザーは開発中にPCから音が出るのを望まない。

## 大きな島・建物の中・褒め言葉スカウト・ワープ先の層（2026-10-24）

- 島を 56×34 に拡大（`islandTemplate()` で生成、座標は `ISLE`）。城（北）・道具屋・本屋・宿屋・ウメばあさんの家・配合小屋（西の町）・老水夫の家（南東）に扉 `d` があり、歩いて入ると室内マップ `i_*` へ（`ISLE.doors` → `enterDoor`、`tryMove` から呼ぶ）。室内は `addInterior()` で作り、家具は K本棚 n机 j寝台 Y玉座 g会計台 Q鉢植え（`decorateInterior`）。会計台 `g` の向こうの人にも話せる。
- 王様は城の中、ネネは配合小屋の中、キキは牧場の入口（34,12）。宿は `i_inn`。
- スカウトは木の実の確率抽選から「英語で褒める」方式へ（`praise-words.js`）。種ごとに好きな褒め言葉の種類 `LIKES` があり、好きな言葉でハートが必要数たまると加入。同じ言葉は無効、好みでない言葉3回で怒ってスカウト不可。木の実は好みのヒントを1つ明かす道具に変更。
- 褒め言葉27語（`PRAISE`）。最初は cute/strong/kind、王様が brave。本屋の本7冊（`BOOKS`、進行で入荷）、大臣（島レベルごと）、ウメばあさん・ソラ・老水夫・山頂の賢者、ボス撃破、闘技場初優勝、ワープ層の宝箱で増える。メニュー「Praise words」で一覧と各モンスターの好み。
- ワープ先（草原2層・空中3層・地底3層・夢3層、ルミナ大陸は従来どおり）は、ランダム生成の層（`warp-floors.js` の `genFloor`、マップID `rift`）を光る出口から進むとボスの間に出る。層の状態は `S.rift`、セーブ後も同じ層を再生成。クリア済みは「最深部へ直行」も選べる。
- セーブ `hubV:2`。v1の島にいたセーブは広場（24,13）へ移動し、クリア済みの世界の数だけ本の言葉を付与。
- テスト: `island-test.cjs` を13項目に作り直し（扉・室内・到達性・層・保存・褒め言葉スカウト・本屋・移行）。companion/party テストのスカウト部分を新方式に更新。

## 建物ごとの見た目・見下ろし視点・ダンジョンの霧（2026-10-24）

- 島の建物は `MAPS.island.buildHouse=islandBuilding` で個別に作る：石造りの城（胸壁・天守・門・旗）、道具屋（黄屋根・日よけ・看板）、本屋（青屋根）、宿屋（赤屋根）、民家2軒（緑・青灰の屋根、煙突）、配合の館（白い円柱＋紫ドーム＋光る結晶）、闘技場（円形の壁）。看板は `signBoard`。橋には床板と手すり。
- カメラを真上寄りに変更（`renderGL`：高さ11.4・後ろ5.4）。建物は1棟ずつ Group にし、主人公が裏側にいると半透明になる（`buildScene` の fades）。全マップ共通。
- ワープ先の層には霧（`decorateRift`）。歩いた周囲と入った部屋だけが見え、出口の光も見つけるまで出ない。見えた範囲は `S.rift.seen` に保存。
- つづきから再開時に島の形を現在のレベルで作り直す（`migrateHub` → `refreshIsland`。以前は橋などがLv1のまま表示されていた）。

## 平面描画の街並み（2026-10-25）

- `flat-world.js`（平面ピクセル描画）の上に `flat-town.js` を追加。建物は屋根`r`＋壁`#`/`d`の範囲（`townBuildings`）をまとめて1枚絵で描く：ことのは城（スレート屋根・赤い円錐の塔2本・胸壁・アーチの大門・青い旗）、民家（切妻の瓦屋根・木組みの白壁・花台つきの窓・煙突）、道具屋/本屋/宿屋（屋根色と看板アイコン）、配合の館（紫ドーム・光る結晶）、闘技場（楕円のスタジアム）。島では建物の上に名札。
- 木は2マス分の高さ（丸い木2色・針葉樹）、草地・土の道（端の縁取り）・広場の石畳・白い柵・赤い花・岩・郵便受け`x`・街灯・波のある水を `townTile` で描く。村・港にも同じ建物描画が効く。
- `landscape-test` の WebGL 前提チェック（`GL.ok`）を平面描画の確認に置き換えた（WebGL は f502513 で外されている）。

## 島をにぎやかに（2026-10-25、DQM2ルカの旅立ちのマルタ島を参考）

- 島の空き地を埋めた：大樹（`G` 3×3、`drawGreatTree`）、広場の噴水（`Z` 2×2、`drawFountain`）、広場の花台`p`、市場の屋台`c`（花売り・魚売り）、井戸`q`、樽`b`、木箱`k`、南東の果樹園、村人の家2軒（扉は施錠：`d`があるが `ISLE.doors` に無い）。屋根色は位置で変わる。
- 町の人8人（`folk`）。`wander` のある人は家の周り2マス以内を歩く（`islandWander`、0.9秒ごと）。扉の前・ワープの隣・橋には立ち止まらない。
- 町のモンスター8匹（`pet`、エンティティの `mon` に種ID）。人と同じく歩き回り、話しかけると「名前（種名）」で会話する。平面描画は `e.mon` なら `creatureCanvas` を描く。

## 下の会話窓・ふりがな・なめらかなモンスター・近いカメラ（2026-10-25）

- 会話・選択肢は画面下の横長ウィンドウ（`dialogue-bottom.css`）。話し相手の顔は窓の左上。選択肢が5つ以上のメニューは窓を高くし、中でスクロール。会話中はカメラが窓の上の範囲に主人公を収める（`flat-world.js` の `talkH`）。会話中は十字キー/ABボタンを隠す。
- 設定「ふりがな」：オンにすると kuromoji（形態素解析）を jsDelivr から読み込み、`#log #opts #hud` の漢字に `<ruby>` を付ける（`furigana.js`、MutationObserver）。オフで元の文字に戻す。`opt.ruby` は保存される。オフラインでは読み込めない旨を表示。
- モンスター・キキ・ネネは段階縮小＋スムージングで描画（`smoothSprite`）。戦闘のモンスターは256pxの元絵をそのまま描く。
- フィールドの拡大率を `min(W/384,H/216)` の0.5刻みに（1280×720で1マス96px）。
- キキ・ネネの会話窓の顔は高解像度の顔イラスト（assets/companions/kiki.webp・nene.webp）を132pxでなめらかに表示（world-ui.js の supportDialogue）。
- 同行中の仲間（最大3体）が主人公の通った道をたどって後ろを歩く（flat-town.js の followerPoses、歩く向きで左右反転）。
- 町のモンスターは初期種ではなく、Drive「ゲーム用モンスター素材/通常画像」から選んだ強そうな・遠い地方のモンスター11体（assets/town/*.png、256pxに切り抜き縮小）。城の修理・門番・果樹園・材木運び・市場・水くみ・闘技場の師範（島Lv2から）・大樹の守り・手紙運び・牧場・郵便配達をしている。エンティティの art/big（描画サイズ、マス単位）で表示。

## モンスター図鑑と配合表（2026-10-25）

- monster-book.js / monster-book.css：全画面の本。タブは「図鑑」（8種、出会うと絵・生息地・好きな褒め言葉・所持数・解説、未発見は影絵）、「配合表」（全レシピを親＋親→子の絵で表示、親がそろうと『配合できる！』）、「島の住人」（町の強いモンスター11体、話しかけると記録 F().met_<art>）。左右キーでタブ切替、上下でスクロール、Esc/Xで閉じる。
- 開き方：メニュー「Monster book」、キキ「図鑑」、ネネ「配合表を見る」、仲間メニューの Collection。

## モンスター200種追加（2026-10-25）

- Drive「ゲーム用モンスター素材/通常画像」から200体を選び、Godotで切り抜き＋200px WebP化（assets/monsters/、計2.5MB）。名前とランク（1〜4）は tools/more-monsters.txt。
- companion-more.js は tools/build-more-monsters.cjs で生成（直接編集しない）。英語IDの単語から 生息地（13ゾーン）・好きな褒め言葉・図鑑の説明・HP/攻撃・配合レシピ（105通り、ランク4の伝説25体は配合のみ）を決める。
- 追加種の絵は初めて描くときに読み込む（companion-ui.js の creatureImage）。図鑑の画像は loading=lazy。配合表は『配合できる』→出会った親がいる順に並ぶ。

## 戦闘背景（2026-10-25）

- Drive「ゲーム用モンスター素材/戦闘背景」（2162枚）から40枚を選び 1280×720 WebP に（assets/battle/、計11.5MB、戦闘開始時に読み込み）。battle-backdrops.js：地域（ゾーン）ごとに2〜3枚から毎戦ランダム、ボスは専用（草原の主=大樹の洞、空の王=飛空艇の甲板、水晶の番人=水晶竜の巣、沈黙の王=時計塔、悪夢の主=深淵の裂け目など）、闘技場はコロシアム、氷のモンスターだけの群れは雪山。読み込み前はタイル地面。
- 図鑑の各モンスターに「生態」と「一言」（208種すべて手書き、tools/monster-lore.txt）。生成時に companion-more.js の MONSTER_LORE に入り、DEX_INFO[id].eco / .quote として図鑑カードに表示。

## 全モンスターに配合レシピ（2026-10-25）

- 全208種に1つ以上の作り方（計323レシピ）。種ごとに系統（獣・鳥・虫・植物・竜・精霊・爬虫・水）があり、親の片方を『@系統』（その系統なら何でもよい）にした系統レシピが115。伝説（ランク4）は必ず2通り以上。
- companion-rules.js の recipe(c,a,b,recipes,species)：完全一致のレシピを優先し、なければ系統レシピ。CR.fits で判定。
- 配合表タブはモンスターごとに1行（作り方1・2…、配合できるものが上）。図鑑カードにも『配合』欄。生成は tools/build-more-monsters.cjs（系統・レシピもここで決まる）。

## Individual combat, rarity and inheritance (2026-10-25)
This section supersedes older shared-HP/MP combat descriptions above. Canonical JavaScript main only; Godot comparison remains unchanged.

- Each owned UID persists current hp/mp, derived maxHp/maxMp, plus, and inherited skill-ID plans. Missing resources migrate to full; finite values clamp and zero remains KO. Missing/invalid plus becomes0. Save key and UID/species identity remain unchanged.
- Rarity is metadata only. Existing tiers1/2/3/4 map to stars1/4/7/10. Original starter mouse/sprout/caterpillar/sparrow=1, mole/moth=4, owlet=7, stag=10. No rarity damage multiplier.
- Breeding plus=max(parent plus)+1. No silent cap; unsafe integer overflow rejects before consuming parents. Names never get +N. Status and breeding preview/result show plus separately.
- Let p=species.power, k=1+0.05*plus, l=level-1. HP=floor((24+4p)*k)+4l; MP=floor((10+2p)*k)+2l; attack=(6+p)*k+1.2l; defense=(2+p/2)*k+0.6l. Only initial stats receive plus, never level growth or equipment. Derivation does not compound on reload.
- Equipped team UID order determines display and actions. Living allies act once each, then surviving enemies. Normal foes target one living ally; boss third-round special hits all living allies. Only all active down is defeat. Empty team selects an owned member. Normal healing cannot revive; inns/full rest/defeat restore all owned including reserves. Partial field recovery targets living only.
- All battle HP/MP belong to individuals. Legacy traveler fields remain for save/story compatibility. Existing weapon/armor values support each ally and existing scribe/sage/hunter damage perks remain. The zero-MP word and listening commands remain available as basic actions, independent of learned skill slots.
-208 species each have3 native skill IDs (native:species:0..2), with family themes and8 real effects: single/all damage, single/all heal, drain, attack boost, defense boost, enemy attack reduction. This is family-based initial balancing, not624 bespoke mechanics. Native unlock levels1/5/10.
- Breeding explicitly selects up to5 learned parental skills, including learned inherited skills. Child-native IDs cannot consume inherited slots; IDs deduplicate. Capacity is3 native +5 inherited, including latent plans. All inherited skills are locked at childLv1 and unlock at childLv3/7/12 according to source skill strength. Parent unlocked state never transfers. Plans retain source, cost, required level and effect through save/reload; the child can pass them on only after learning them.
- English correct=100%,wrong=50% effect; MP cost unchanged. Buff magnitude halves, duration does not. Buffs replace rather than stack. Attack boost covers current and next2 ally rounds; defense and enemy weakening cover3 enemy phases. Drain heals half actual HP removed, not overkill. MP insufficiency/dead actor/locked skill/canceled target consumes nothing. Resources save at spend/action/damage boundaries; reload abandons battle without restoring spent MP.
- Successful scouting registration is separate from seen. The first registered scout opens the existing single-species bestiary modal; repeats do not. Registration and recruitment save atomically. Legacy missing registration uses current owned species; old consumed recruits cannot be distinguished from encounters, so one repeat popup may occur for those species.
- Pure tests: node individual-test.cjs; node plus-test.cjs. Tests cover624 skills,323 recipes, migration/clamping, plus, KO/recovery, five-slot inheritance/latent unlock, effects and real battle/scout functions with mock presentation. Local Chrome isolated RAM-save UI checks cover640x300 and844x390, individual turns/MP, correct/wrong effects, eight learned skills, targeted inherited skill, breeding and save/reload. Screenshots are internal in the Codex task qa directory, not published. Real phones/TV hardware and exhaustive whole-game balance are not tested.

## Breeding-exclusive expansion (2026-10-25)
- 232 distinct species, 347 recipes. Rarity distribution: star1=45, star4=88, star7=61, star10=38. All star7+ (99 species) are breeding-only;133 species remain recruitable. Existing high-rarity encounters can still be fought, but cannot consume scout food or be recruited. Owned individuals and registration history remain intact.
-24 reviewed existing Drive designs added in companion-rare.js, with24 explicit recipes that do not override any earlier exact or family pairing. All232 are reachable from legal low-rarity sources. No new image generation. Existing normal illustration style retained; new assets are cropped transparent200px PNG (about1MB total), avoiding new image-package installation. Original source hashes verified locally; private source IDs and temporary download URLs are not published.
- Shared static rarityBadge: neutral1, blue4, violet glow7, gold double border/shine10. Exact star number and aria label remain; no animation/flash, reduced-motion override. Applied to detail, encyclopedia, breeding preview and result, not battle names.
- Run node rarity-test.cjs plus individual-test.cjs and plus-test.cjs. Test source data includes new species. Local isolated Chrome QA:24 actual images,640x300 new-species encyclopedia and breeding result, modal close. Real devices and long-term balance remain unverified.

## Roaming masters and selective roster cleanup (2026-10-25)
- Otherworld road/grass encounter after clear1: every32 eligible movement steps,10% spawn check,128 eligible steps cooldown after a challenge.30% of masters lead with a rarity7–8 species; otherwise rarity1–4. Second companion is low rarity. All current data above8 excluded at generation, hydration and award. Existing arena unchanged.
- NPC uses existing tourist sprite, wanders within2 tiles, talks through standard English/Japanese dialogue. Only path-connected nearby open tiles spawn it. Declining leaves the same saved encounter available.
- Challenge marks encounter spent atomically before combat. Two standard opponents use normal in-battle berry/praise scouting, including rarity7/8 via a live battle-object capability. No fixed20% or post-victory award. Normal scouting is deterministic heart progress from liked English praise, not a random success probability; berries reveal likes. Each attempt/feed uses an ally action. Each opponent can join once, without kill rewards, as Lv1/plus0 reserve; first registration opens the bestiary. Captured slots save atomically with recruitment. Defeat/flee/reload end the encounter; live permission never survives into another battle. Rarity9/10 and ordinary wild rarity7+ remain blocked.
- module roaming-masters.js; persistent S.masterTrail; test node master-test.cjs. This discourages reload farming, not external save editing. Dialogue/real battle/victory/target choice/first registration/map return verified in isolated local Chrome844x390 and640x300. Production saves untouched.

- Release roster:232 declared/stable IDs,222 active,10 retired from new wild recruitment/breeding/active bestiary;317 recipes. Retired originals and owned individuals remain usable with details under the legacy bestiary filter.30 replacement recipes preserve active reachability. No source art was deleted.
- Undead family currently contains only moonflower_ghost and amber_fossil_spiral_spirit. Native effects: drain, defense boost, enemy attack reduction; same learning/cost system. Four ruler reclassifications and the new revenant are NOT shipped: revised art is pending. No new art in this release. Pending drafts are preserved outside the release; do not load companion-undead.js.
- Tests: node roster-test.cjs, master-test.cjs, rarity-test.cjs, individual-test.cjs, plus-test.cjs. Final UI and deployment verification are recorded by the release operator.

- Master scouting correction: post-victory lottery removed. Existing known praise profiles retained; new breeding-only species without a profile prefer strong/brave,4 hearts. Repeated words do not advance; three disliked attempts end scouting, matching normal battles. No image changes.

## Overlay camera correction
- Dialogue/menu/detail overlays no longer reduce the world-camera viewport height. Opening or closing UI preserves the same world and actor screen coordinates; ordinary walking/follow-camera remains unchanged. Battle renderer/layout unchanged.
- node dialogue-camera-test.cjs checks five sizes, edges, small maps and repeated view changes. Local Chrome verified central hero/follower and fountain before/during/after dialogue, menu and details, including640x300. Screenshots kept locally only.

## 画面モード（2026-10-25）

- 設定「画面モード」：自動 / スマホ / TV / PC（screen-modes.js・screen-modes.css）。端末ごとに localStorage 'wordbound-screen' に保存し、タイトルから適用（body[data-screen]）。スマホ=操作ボタン常時表示・選択肢を大きく・カメラ少し近く、TV=操作ボタンなし・文字と窓を1.3倍・画面端に余白、PC=操作ボタンなし・マップを広く表示（タイル0.8倍）。自動は従来どおり。
- テスト：node screen-mode-test.cjs。
- 注意（2026-10-25時点）：ChatGPT側の変更（世界地図ボタン削除、『たたかう』→『呪文』、個別戦闘、技継承の配合フロー、図鑑のクラス変更）に合わせて更新されていない旧テスト6本（playtest / companion-test / landscape-test / party-test / world-test / island-test）が失敗する。今回の変更前から同じ失敗。

## 旧テスト6本の更新（2026-10-25）

- playtest / companion / landscape / party / world / island の各テストを ChatGPT 側の仕様（呪文コマンド・1体ずつのHP・技継承の配合・世界地図は相談メニューから・図鑑タイル・初回スカウトで図鑑が開く・★7以上は配合限定・引退10種）に合わせて更新。
- test-quiet.cjs が各ページに試験用ユーザー『テスト』を作る（初回のユーザー名入力で止まらないため）。
- 見つかった抜けを修正：ChatGPT の新24種に生態・一言を追加（tools/monster-lore.txt、companion-rare.js は既存の文を残す）。アンデッド2種の一言を復活。引退整理でレシピが無くなった5種と、作り方が1つになった伝説1種に配合を追加（roster-policy.js の ROSTER_REPAIRS、計323、individual/plus テストの件数も更新）。
- npm test は全21テストを実行。
