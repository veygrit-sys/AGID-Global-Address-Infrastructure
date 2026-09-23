# 配送POSデータベース v1

配送POSのローカルDBは、既存の `AGID_AppDB` IndexedDB に `version(3)` として追加する。目的は、受付、判断、監査、端末診断、配送ハンドオフ、越境申告を保存し、オフライン運用や後続同期に耐えられるようにすることである。

## 保存方針

POS DB は、操作の事実と判断に必要なメタデータだけを保存する。

保存しないもの:

- QR/NFC の生 payload
- AGID-S 暗号文全文
- 復号済み AGID 本文
- AOID 本文
- 氏名
- 電話番号
- 番地、部屋番号、詳細住所
- 正確な緯度経度

各 POS テーブルは次のフラグを持つ。

```ts
rawPayloadStored: false
rawAddressStored: false
decryptedAgidStored: false
rawAgidSecureStored: false
```

読込時にもこれらの値を `false` に矯正する。外部インポートや古いデータが混ざっても、生データ保存を既成事実にしないためである。

## テーブル

| テーブル | 主キー | 目的 |
| --- | --- | --- |
| `posShipments` | `id` | 国内・越境の配送受付単位 |
| `posReceipts` | `id` | POS受付結果。`receiptId` を主キー化 |
| `posAuditCases` | `id` | 拒否・要確認の監査ケース |
| `posHandoffs` | `id` | 配送員への引き渡しと配送完了状態 |
| `posDeviceDiagnostics` | `id` | プリンタ、キャッシュドロワー、バーコードリーダー診断 |
| `posCrossBorderDeclarations` | `id` | 越境配送のHSコード、申告価格、通貨、補助根拠 |

## 主なインデックス

```ts
posShipments:
  id, kind, status, receiptId, terminalId, updatedAt, destinationCountry

posReceipts:
  id, shipmentId, status, channel, terminalId, createdAt

posAuditCases:
  id, shipmentId, receiptId, status, severity, createdAt

posHandoffs:
  id, shipmentId, receiptId, status, terminalId, updatedAt

posDeviceDiagnostics:
  id, terminalId, kind, status, checkedAt

posCrossBorderDeclarations:
  id, shipmentId, status, originCountry, destinationCountry, updatedAt
```

## POS shipment

`posShipments` は配送受付の中心テーブルである。

主な列:

- `kind`: `domestic` または `cross-border`
- `status`: `draft`, `accepted`, `review`, `rejected`, `handoff`, `completed`, `cancelled`
- `receiptId`
- `crossBorderDeclarationId`
- `handoffId`
- `terminalId`
- `operatorId`
- `originCountry`
- `destinationCountry`
- `addressLanguage`
- `addressQuality`
- `agidTail`
- `aoidTail`
- `privacyMode`

`agidTail` と `aoidTail` は表示・照合用の末尾断片であり、完全な AGID/AOID は保存しない。

## POS receipt

`posReceipts` は `PosAcceptanceReceipt` をDB保存用に変換したものを保存する。

`toDeliveryPosReceiptRecord(receipt, { shipmentId })` を使うと、`receipt.receiptId` が `id` になり、プライバシーフラグが強制的に `false` になる。

## POS audit case

`posAuditCases` は、要確認または拒否された受付を後から追うためのテーブルである。

保存するもの:

- receipt id
- status
- severity
- reason
- operator action
- createdAt
- redacted record label

保存しないもの:

- 受取人名
- 電話番号
- 詳細住所
- AGID-S QR 本文

## POS handoff

`posHandoffs` は配送員への引き渡しと再照合レポートを扱う。

主な状態:

- `pending`
- `in-transit`
- `completed`
- `blocked`

配送完了後の `PosHandoffReverificationReport` はここに紐づける。

## Device diagnostics

`posDeviceDiagnostics` は次の端末状態を保存する。

- receipt printer
- cash drawer
- barcode reader

これは個人情報ではないが、店舗運用情報なので同期先は設定・監査系として扱う。

## Cross-border declaration

`posCrossBorderDeclarations` は越境配送だけで使う。

主な列:

- `originCountry`
- `destinationCountry`
- `hsCode`
- `declaredValue`
- `currency`
- `evidenceSourceIds`
- `advisoryOnly: true`

重要なのは `advisoryOnly: true` である。HSコード、関税、通貨換算はPOS補助であり、法的な最終通関判断として扱わない。

## 同期キュー

POS DB のレコードは、必要に応じて `syncQueue` に積める。

追加された entity type:

- `posShipment`
- `posReceipt`
- `posAuditCase`
- `posHandoff`
- `posDeviceDiagnostic`
- `posCrossBorderDeclaration`

`posDeviceDiagnostic` は設定系として扱い、それ以外は private sync 系として扱う。

## 今後の拡張

ローカルIndexedDBで運用を固めた後、次の順で拡張する。

1. SQLite adapter: 単一店舗、自己ホスト、災害現場サーバー向け。
2. Postgres adapter: 複数店舗、管理画面、監査ログ集約向け。
3. Redis adapter: 短期キャッシュ、レート制限、使用済み状態の高速参照向け。
4. Object storage export: 監査エクスポートやバックアップ向け。

どの拡張でも、サーバー平文住所DBにはしない。
