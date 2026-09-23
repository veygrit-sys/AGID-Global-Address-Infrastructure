# AGID Accessibility Hardening

Last updated: 2026-06-18

## 目的

AGID/AOID は地図、住所登録、配送 POS、Portal、Review Console、証跡出力をまたぐため、アクセシビリティは見た目の配慮ではなく運用安全の一部として扱う。

この文書では、無料・OSS として公開する基本機能に最低限必要なアクセシビリティ基準を定義する。対象は、AGID 生成、住所表示、住所登録、QR/NFC 受付、POS handoff、同意管理、監査レポートである。

## 基本方針

1. 主要業務はキーボードだけで完了できる。
2. 受付、拒否、要確認、完了は色だけで伝えない。
3. 言語設定は画面、サイドメニュー、レポート、`html lang`、`dir` に反映する。
4. 高リスクモードでは、アクセシビリティ表示によって個人情報を余計に読み上げたり露出したりしない。
5. 地図操作には検索、AGID 入力、座標入力、候補リストなどの非ポインター代替手段を用意する。

## P0: リリース前必須

| 項目 | 対象 | 合格条件 |
| --- | --- | --- |
| キーボード主要導線 | 地図、住所登録、POS、Portal、Review | Tab / Shift+Tab / Enter / Space で主要操作が完了する |
| フォーカス可視化 | 全画面 | 操作可能要素に高コントラストの `focus-visible` が出る |
| 状態のプログラム表現 | POS、Review、印刷/出力 | Decision banner、警告、拒否理由が読み上げ可能なテキストで存在する |
| 色だけに依存しない状態 | POS、地図、Review | OK、要確認、拒否、高リスクが文字・アイコン・形状でも区別できる |
| 言語・方向同期 | 全画面 | 言語切替で UI 文言、住所タブ、`html lang`、`dir`、レポート文言が一致する |
| 高リスク時の秘匿 | POS、Portal、印刷 | raw address、raw AGID/AOID、電話、氏名、proof code を表示・読み上げしない |

## P1: 早期に成熟させる

| 項目 | 対象 | 合格条件 |
| --- | --- | --- |
| Reduced motion | 地図、POS、全体 shell | `prefers-reduced-motion` で非必須アニメーションを止める |
| タッチターゲット | POS、住所登録、Portal | 主要操作は短辺 44px 以上、翻訳後も縮まない |
| エラー連携 | 住所登録、Review | エラー要約から該当フィールドや証明ステップへ移動できる |
| 地図代替操作 | 地図、住所登録 | hover や click 以外でも AGID 候補を選択・確定できる |
| 印刷・PDF代替 | 監査レポート | QR やアイコンだけでなく、判定理由と redaction 状態を文字で含める |

## P2: 高度化

| 項目 | 対象 | 合格条件 |
| --- | --- | --- |
| Plain-language privacy | 高リスクモード、Portal | 何を共有し、何を隠し、いつ失効するかを短い文章で示す |
| Screen reader transcript | POS、Review | 完了時の証跡を読み上げ順に再構成できる |
| Offline conflict narration | 災害/現場モード | deferred sync、衝突、要監査を明確に伝える |

## 画面別の実装順

1. Global shell
   `focus-visible`、`.sr-only`、`.skip-link`、reduced-motion、forced-colors を共通 CSS として整備する。

2. AGID POS Terminal
   Decision banner を `role="status"` または明確な見出しにし、四段階 handoff、拒否理由、使用済み/失効/鮮度を読み上げ可能にする。アイコンだけのボタンには必ず `aria-label` を付ける。

3. Map / Address Registration
   AGID は w3w 風に click/confirm でのみ確定し、hover は薄い枠の preview に留める。キーボード利用者には検索、AGID 入力、座標入力、候補一覧を提供する。

4. Address Portal
   consent scope、失効、削除、export をフォームと状態機械として扱い、確認ダイアログ後に focus を復元する。

5. Review Console / Dashboard
   要確認、拒否、異議申し立て、再照合の理由を表形式と詳細パネルの両方で読めるようにする。

## テスト方針

実装契約は `src/lib/accessibilityHardening.ts` に置き、`src/lib/accessibilityHardening.test.ts` で P0/P1/P2 の合否を検証する。

実行コマンド:

```bash
npm run verify:a11y
```

このテストは DOM の完全な自動アクセシビリティ監査ではない。実画面では追加で以下を見る。

- キーボードだけで POS の scan -> decision -> handoff -> report が通るか。
- スクリーンリーダーで decision と blocking reason が先に読めるか。
- 言語切替後にサイドメニュー、メイン、レポート、`html lang` が変わるか。
- high-risk mode で raw address / raw AGID / proof code が表示・印刷されないか。
- forced-colors と reduced-motion で操作不能にならないか。

## 実装済み

- アクセシビリティ強化の実行モデルと評価関数を追加。
- P0/P1/P2 のテストを追加。
- 共通 CSS に `focus-visible`、`.sr-only`、`.skip-link`、`prefers-reduced-motion`、`forced-colors` 対応を追加。
- `verify:a11y` コマンドを追加。
