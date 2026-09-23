# 必須セキュリティリリースゲート

AGID/AOID の POS、送り状、QR/NFC、監査ログ、Hosted Registry では、次の4条件を必須にする。

## 1. no-raw-address テスト

公開物、テストベクトル、監査レポート、ログ、README、APIサンプルに以下を出さない。

- 実住所、詳細住所、部屋番号、建物入口コード
- 受取人氏名、電話番号、proof code
- AOID plaintext、AGID-S ciphertext、private key、ZK witness
- 精密な緯度経度ペア

検証は `scanNoRawAddressReleaseText` と `evaluateMandatorySecurityReleaseGate` で行う。

## 2. 端末署名

POS、配送handoff、送り状receipt、端末診断receiptは、端末ID、署名、署名時刻、署名アルゴリズムを持つ。

保存してよいもの:

- terminalId
- signedAt
- signature tail
- algorithm

保存しないもの:

- proof code
- 生の住所
- 生のAGID-S復号結果

## 3. 短期alias

配送・QR・NFC・送り状の参照には短期aliasを使う。生のwaybill id、AGID、AOID、住所文字列を監査ログや公開レポートへ直接保存しない。

標準TTLは最大15分、高リスクモードでは最大5分とする。長期保存が必要な場合は、生IDではなく commitment と tail を保存する。

## 4. 監査ログredaction

監査ログは、保存前に redaction 済みであることを明示する。

必須フィールド:

- redactionApplied: true
- redactionVersion
- redacted audit event

禁止フィールド:

- rawAddress
- inputAddress
- recipientName
- phoneNumber
- proofCode
- rawAgid
- rawAoid
- rawWaybillId
- agidSPlaintext
- privateKey
- witness

## 実行コマンド

```bash
npm run verify:no-raw-address
npm run verify:mandatory-security
npm run verify:preaudit-secrets
npm run lint
```

このゲートに失敗したビルドは、公開・配送handoff完了・監査レポートexport・外部提出に進めない。
