# Funding Channels for AGID/AOID OSS

Last updated: 2026-06-18

## 目的

AGID/AOID のOSS部分に対して、GitHub Sponsors、Open Collective、Gitcoin から寄付・助成・コミュニティ支援を受けられる導線を作る。

ただし、資金導線によって哲学を曲げない。寄付や助成のために、住所データの集中、token-first化、個人住所ログの収集、安全機能の有料化をしてはいけない。

## 1. GitHub Sponsors

### 役割

小口寄付、継続支援、OSSメンテナンス費用。

### 向いている支援内容

- SDK/CLI整備
- Local Resolver改善
- no-raw-address tests
- `SECURITY.md` / release checklist
- accessibility修正
- documentation cleanup

### 必要な準備

- GitHub Sponsors プロフィール
- `FUNDING.yml` の `github:` にハンドルを追加
- README に「寄付で何が改善されるか」を短く追記
- 毎月の進捗報告テンプレート

### 注意

GitHub Sponsors では、個人住所データや利用者データを支援者向け特典にしない。

## 2. Open Collective

### 役割

透明な会計、複数人メンテナ、外部監査費用、コミュニティ支援。

### 向いている支援内容

- 外部セキュリティ監査
- アクセシビリティ監査
- ZK回路レビュー
- データライセンス監査
- 翻訳・ドキュメント整理
- デモ環境の維持

### 必要な準備

- Open Collective project ページ
- fiscal host の選定
- `FUNDING.yml` の `open_collective:` に slug を追加
- `docs/funder-brief-en.md` へのリンク
- 支出カテゴリの公開

### 注意

Open Collective の透明性は強いが、公開会計に private deployment 顧客名や高リスク現場名を出さない。

## 3. Gitcoin

### 役割

public goods コミュニティ向け支援、ZK/registry/OSSデモの初期支持。

### 向いている支援内容

- AGID-S high-risk sharing demo
- Local Resolver public demo
- optional ZK-ready predicate demo
- public signal allowlist
- no raw address release scan

### 必要な準備

- Gitcoin project profile
- 1分説明文
- 3つのデモ動画またはスクリーンショット
- public-good impact statement
- `docs/funder-brief-en.md` の要約

### 注意

GitcoinではWeb3色が強くなりやすい。AGID/AOIDは暗号通貨プロジェクトではなく、ZK/Ethereumを任意の検証レイヤーとして使う住所インフラである、と明記する。

## 4. FUNDING.yml の現在地

`.github/FUNDING.yml` は汎用リンクで作成済み。

公開前に差し替える。

```yaml
github:
  - <github-sponsors-handle>
open_collective: <open-collective-slug>
custom:
  - https://grants.gitcoin.co/
```

プロジェクト固有の Gitcoin URL ができた場合は、`custom` に追加する。

## 5. 寄付者向けに約束してよいこと

- Local Resolver を改善する。
- Address Element を使いやすくする。
- POS high-risk flow を安全にする。
- no-raw-address / secret scan / release checklist を強くする。
- 外部監査を受ける準備を進める。
- public docs を英語と日本語で揃える。
- data license と出典を明確にする。

## 6. 約束してはいけないこと

- 利用者住所データへのアクセス。
- 個人住所ログの分析レポート。
- 実住所データセットの販売。
- 支援者限定の安全機能。
- token配布や投資リターン。
- 「全世界240か国で有料APIに勝つ」という未検証の保証。
- production-grade ZK を外部監査前に保証すること。

## 7. 最初の支援目標

### Goal A: OSS Release Candidate

必要額の用途:

- v0.1 RC整理
- no-raw-address tests
- secret scan
- SECURITY.md
- data license manifest

### Goal B: Three Public Demos

必要額の用途:

- Local Resolver demo
- AGID-S POS handoff demo
- ZK-ready registry demo
- demo動画/スクリーンショット

### Goal C: External Audit Preparation

必要額の用途:

- threat model review
- accessibility review
- ZK audit packet整理
- release artifact review

## 8. README向け短文

```text
AGID/AOID is funded as open address infrastructure. Donations support local-first
resolver quality, no-raw-address tests, accessibility, release engineering, and
external security review. Donations do not buy access to user address data.
```

## 9. 成功指標

- `npm run verify:external-audit` が通る。
- `npm run verify:no-raw-address` が通る。
- `npm run verify:preaudit-secrets` が通る。
- 3デモが5分以内に説明できる。
- v0.1 RCの既知制限が公開されている。
- 支援者に個人住所データを見せずに進捗報告できる。
