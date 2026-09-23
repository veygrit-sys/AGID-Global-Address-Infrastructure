# AGID / AOID 役割契約

更新日: 2026-07-27

## 責務

- AGIDは、個人情報を含まない公開可能な地理実体の安定した参照である。
- AOIDは、AGIDを参照し、配送・居住に必要な私的情報を保持するユーザー所有の識別子である。
- AGIDからAOID本文を復元してはならない。
- AOID本文を公開API、公開QR、イベント、公開データパックへ出してはならない。

`JP-13-TKY-CHIYODA-001`のような値は、人間向け公開別名の例として利用できる。
既存実装の12文字AGID機械形式は互換性維持のため変更しない。

## 構造

```text
AOID private body
 ├─ AGID
 ├─ Building
 ├─ Floor
 ├─ Room
 ├─ Recipient
 ├─ Delivery Options
 ├─ Intercom
 ├─ Access Policy
 ├─ Validity
 └─ Metadata
```

AOID本文の実行可能スキーマは`aoid-private-body-v1`とする。新規登録では有効な
AGID参照を必須とする。既存のAGID未参照AOIDは移行目的で読み込めるが、新規登録
要件を満たさない。

## ライフサイクル

| 変更 | AGID | AOID |
| --- | --- | --- |
| 受取人・部屋・受取方法の変更 | 維持 | 本文を更新 |
| 一時配送先・有効期間の追加 | 維持または別AGIDを参照 | 別AOIDを作成可能 |
| 建物など参照対象の地理実体が変化 | 新しいAGIDへ切替 | 新AGIDを参照するよう更新 |
| 所有者が利用停止 | 維持 | revokeまたはrotate |

## 公開境界

公開可能なのはAGIDと、必要に応じたAOID commitmentまたは用途限定参照だけである。
建物内情報、階、部屋、受取人、電話、配送指示、インターホン、置き配、アクセス
権限、有効期間、AOID本文は、端末内またはowner-device暗号化エンベロープに限定する。
