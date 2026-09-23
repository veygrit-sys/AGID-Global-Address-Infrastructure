# AGID/AOID 3つの公開デモ

Last updated: 2026-06-18

この文書は、寄付・助成・外部監査・初期ユーザー説明に使う3つのデモを定義する。すべて、Hosted Registry、Ethereum、ZK、商用APIなしでも説明できることを優先する。

## Demo 1: Local Resolver + Address Element

### 目的

EC、CMS、POS、買い物Agentへ埋め込める住所入力 UI と、AGID Local Resolver の価値を示す。

### 見せる流れ

1. ユーザーが国と言語を選ぶ。
2. 郵便番号、AGID、地名、住所断片のいずれかを入力する。
3. 候補が表示される。
4. 言語タブを切り替えると住所表示が変わる。
5. ユーザーが住所を修正できる。
6. 修正フィードバックはローカル学習候補として保存される。
7. host app へは raw address ではなく、判定状態、必要な次アクション、redacted reference を返す。

### 成功条件

- Hosted API なしで動く。
- 言語切替が UI と住所タブに反映される。
- 内部品質スコアはユーザーに細かく出さず、`verified` / `partial` / `needs-review` の操作判断に落とす。
- raw address、電話番号、受取人名、proof code を host event に出さない。

### デモで使う画面

- `AGID Map / Registration App`
- `AGID Address Element`
- `Settings and Policy Center`

### 検証コマンド

```bash
npm run verify:no-raw-address
npm run verify:a11y
npm run lint
```

## Demo 2: AGID-S High-Risk Sharing + POS Offline Handoff

### 目的

住所やAGIDを公開せず、鍵を持つPOS/配送者だけが復号できる QR/NFC handoff を示す。災害、避難、DV、人道支援でも使える安全側の流れにする。

### 見せる流れ

1. 通常 AGID を生成する。
2. 配送者または支援団体の公開鍵向けに AGID-S を生成する。
3. POS で QR/NFC を読み込む。
4. 失効、使用済み、有効期限、鮮度を確認する。
5. Carrier Scan OK になる。
6. 受取人 proof を要求する。
7. Passkey / AOID credential / one-time proof のいずれかで確認する。
8. Handoff Complete になり、redacted receipt を印刷または export する。
9. Offline の場合は local used ledger に保存し、後で sync する。

### 成功条件

- 高リスクモードで raw address、raw AGID/AOID、電話番号、proof code を出さない。
- スクショQR再利用は `requires-review` または `rejected`。
- POS端末署名、時刻、店舗/POS ID、carrier receipt、recipient proof receipt を再照合レポートに含める。
- オフライン衝突は `audit-required` として残る。

### デモで使う画面

- `AGID POS Terminal`
- `Device Diagnostics`
- `Offline Queue`
- `Audit Report`

### 検証コマンド

```bash
npm run verify:pos-ui
npm run verify:external-audit
npm run lint
```

## Demo 3: Audit-Ready Registry + ZK-Ready Predicate Flow

### 目的

住所本文を出さず、issuer、revocation、freshness、nullifier、proof bundle を使った監査可能な流れを示す。ZK は production-grade と呼ばず、外部暗号監査前は `ZK-ready` と明記する。

### 見せる流れ

1. issuer trust registry に issuer metadata を登録する。
2. credential commitment を登録する。
3. revocation/freshness root を更新する。
4. user が「配送可能地域内」「指定国居住」「同一住所受取人」などの述語 proof envelope を作る。
5. verifier は public signal allowlist を検査する。
6. nullifier を登録し、二重使用を防ぐ。
7. registry は raw address、raw AGID/AOID、witness を保存しない。
8. audit packet を出力する。

### 成功条件

- public signals は allowlist のみ。
- forbidden public signal があれば拒否。
- nullifier は domain separation 済み。
- witness、private input、AGID-S ciphertext を registry に保存しない。
- production-grade ZK と呼ぶには external cryptography audit が必要。

### デモで使う画面・API

- `Hosted Registry API` のOSS参照実装
- `Address Console / Dashboard`
- `ZK proof bundle registry`

### 検証コマンド

```bash
npm run verify:zk-baseline
npm run verify:external-audit
npm run verify:no-raw-address
```

## デモ公開時の禁止事項

- 実在の個人住所を使わない。
- 実在の電話番号を使わない。
- 実在のAGID-S ciphertextを貼らない。
- ZK fixture を production circuit と呼ばない。
- 住所をオンチェーンに載せるデモにしない。
- 高リスクモードを見た目だけのラベルにしない。

## 最初の公開順

1. Demo 1: Local Resolver + Address Element
2. Demo 2: AGID-S High-Risk POS Handoff
3. Demo 3: Audit-Ready Registry + ZK-Ready Predicate Flow

この順番なら、AGIDの中核価値である local-first と no-raw-address を先に見せ、ZK/Ethereum/Registry を補助レイヤーとして説明できる。
