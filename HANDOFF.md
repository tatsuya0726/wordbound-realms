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

## Godot試作版（2026-10-22 追加）

ユーザーの依頼「Godotでクオリティを上げる」に対し、**本編はそのまま**、別アドレスで比較できる試作を作った。本編のURL・セーブ・テストには影響しない。

| 項目 | 内容 |
|---|---|
| ソース | `godot-src/`（Godot 4.7.2 / Compatibility レンダラー / GDScript） |
| 公開物 | `godot/`（Web書き出し・スレッドなし版。GitHub Pagesでそのまま動く） |
| URL（mainに入った後） | https://tatsuya0726.github.io/wordbound-realms/godot/ |
| このPCのGodot | `C:\Users\god03\AppData\Local\Microsoft\WinGet\Packages\GodotEngine.GodotEngine_Microsoft.Winget.Source_8wekyb3d8bbwe\Godot_v4.7.2-stable_win64_console.exe`（Web書き出しテンプレート導入済み） |

内容: タイトル → こもれびの村（3D化したHD-2D。影・揺れる草木・噴水の水しぶき・街灯・旗・ティルトシフト）→ 草原の1〜3体バトル（ヒット演出・ダメージ数字・画面揺れ）。少年・キキ・ネネの歩行シート、人物・モンスター・背景画像、英語問題（単語・呪文370問・リスニング・会話）は本編から複製して使う。BGM・効果音はコード内で合成したチップチューン。

- **セーブは読み取りのみ**: 同じドメインなら localStorage `wordbound-realms-v1` からLv・HP・所持金・薬草・同行仲間・学習帯を読む。試作版からは**一切書き込まない**。試作内の経験値などはページを閉じると消える。
- 未実装: スカウト・配合・学習ノート・物語の進行・港町など他マップ。日本語訳の表示切替。iPhone実機での確認。
- `godot-src/data/` と `godot-src/assets/` は本編からの複製。問題や画像を本編で変えたら `node godot-src/tools/sync-from-web.cjs` で再同期する。
- `godot-src/assets/baked/` はWebでの読み込み短縮用（BGMと村の地面）。合成ロジックや村マップを変えたら `Godot... --path godot-src -- bake=1` で作り直す。BGMの `.import` はループ設定（`edit/loop_mode=2`）にしてある。
- 書き出し: `Godot... --headless --path godot-src --export-release "Web" ../godot/index.html`。`godot/index.wasm` は約38MB（Godot本体）。
- 確認用: `Godot... --path godot-src -- scene=battle shot=C:/tmp/b.png after=5 press=accept@3.4` で画面を開いて自動操作・撮影できる。
- フォントは DotGothic16（SIL OFL、`godot-src/assets/fonts/OFL.txt`）。

## 次の担当者への依頼文

「このリポジトリの `CLAUDE.md` と `HANDOFF.md` を読んで、ごちゃまぜモンスターの開発を引き継いでください。正本は wordbound-realms で、words-and-wilds-rpg は別版です。まず現在の変更・公開状況を確認してください。既存セーブと公開URL、英語学習、HD-2D、少年・キキ・ネネのデザインを維持し、私の次の依頼から作業を続けてください。」
