# バックエンドだけで完結できる範囲

このメモは、AGIDでUIを変更せずに進められる実装範囲を切り分けるためのものです。
結論として、外部連携、住所解決、郵便番号/地理データ更新、検証、証跡、同期、OpenAPI/SDK、運用監視はバックエンドだけでかなり進められます。

## 判定基準

バックエンドだけで完結できるもの:

- 入力と出力がAPI、CLI、ジョブ、JSON、DB、ログ、OpenAPIで表現できる。
- UIの見た目、地図表示、フォーム操作、タブ構成を変えなくても価値が出る。
- 後からUIを載せても契約が変わりにくい。
- 住所、氏名、連絡先などのprivate materialをサーバー側で遮断またはredactできる。

バックエンドだけでは完結しにくいもの:

- 国選択、住所入力フォーム、地図グリッド表示、言語タブの体験そのもの。
- ユーザーが比較・修正・承認する必要がある画面。
- 目視確認が品質の中心になる地図レイヤー、グリッド塗り、位置情報UI。

## すぐ進められる高優先度

| 領域 | バックエンド完結度 | 既存の足場 | 次にやること |
| --- | --- | --- | --- |
| 外部POS連携 | 高 | `src/lib/externalPosIntegration.ts`, `src/server/routes/externalPosRoutes.ts` | POS別adapter fixture、再送キュー、HMAC署名検証を追加 |
| 配送API連携 | 高 | `src/lib/externalDeliveryApi.ts`, `src/server/routes/externalDeliveryApiRoutes.ts` | 配送会社別のcapability差分、label/proofのredaction検証を追加 |
| Oracle OPERA連携 | 高 | `src/services/OracleOperaService.ts`, `src/server/routes/oracleOperaRoutes.ts` | dry-run結果の監査ログ化、プロパティ別policyを追加 |
| DB連携 | 高 | `src/lib/cloudDbIntegration.ts`, `src/server/routes/cloudDbRoutes.ts`, `db/*.sql` | SQLite/Postgres/Mongoの接続health checkとmigration planをAPI化 |
| 住所解決API | 高 | `src/lib/addressResolutionSystem.ts`, `src/server/routes/addressResolutionSystemRoutes.ts` | resolver chainのスコア内訳、失敗理由、再実行tokenを追加 |
| 住所検証 | 高 | `src/lib/addressVerificationEngine.ts`, `src/lib/addressStandardLibraryResolver.ts` | 国別policy coverage reportをジョブ化 |
| 郵便番号/地理データ更新 | 高 | `scripts/verify-postal-sources.ts`, `scripts/sync-address-metadata.ts`, `src/lib/agidPostalCodeEngine.ts` | 日次差分ジョブ、国別失敗リトライ、source freshnessをDB保存 |
| 証跡/監査 | 高 | `src/server/addressResolutionLedgerStore.ts`, `src/lib/addressEvidenceVault.ts` | API呼び出しごとのpublic event ledgerを統一 |
| ZK/credential検証 | 高 | `src/lib/addressCredential*.ts`, `src/server/routes/zk*.ts` | proof bundleの期限/失効/重複nullifierチェックを定期検査 |
| OpenAPI/SDK | 高 | `src/lib/openApiSpec.ts`, `sdk/*` | 外部連携APIをSDK生成対象に追加し、言語別fixtureを統一 |

## 中優先度

| 領域 | バックエンド完結度 | 既存の足場 | 注意点 |
| --- | --- | --- | --- |
| 検索候補/誤字補正 | 中 | `src/lib/addressSearchFederation.ts`, `src/lib/searchQuery.ts`, `server.ts` search routes | UIなしでもAPI改善は可能だが、UX評価は後で必要 |
| ビル名取得 | 中 | `src/services/GeocodingService.ts`, `server.ts` Overture/OSM routes | provider availabilityとライセンス表示をserver resultに含める |
| 車が止まれる点 | 中 | `src/lib/navigationDestination.ts`, `server.ts` navigation route | 地図での目視確認は必要だが、候補生成はAPIだけで可能 |
| ドローン地点/高さ | 中 | `src/lib/droneNavigation.ts`, `src/server/routes/droneDeliveryEvidenceRoutes.ts` | 10cm単位の入力UIは別、制約判定APIは先に作れる |
| 海/山/自然判定 | 中 | `src/services/NatureService.ts`, `src/services/SeaService.ts`, `src/services/PolarService.ts` | 表示品質はUI依存、判定とsource confidenceはbackendで完結 |
| 問い合わせ削減FAQ | 中 | `src/lib/helpFaq.ts` | 内容生成はbackendでできるが、導線改善はUI側 |

## 後回しでよいもの

| 領域 | 理由 |
| --- | --- |
| 地図グリッド表示 | 数理モデルはlibでテストできるが、最終品質は地図描画UIに依存する |
| 住所登録フォーム | 国別field orderや郵便番号入力はUI操作が中心 |
| アプリ言語切替 | translation dataはbackend的に検査できるが、表示崩れはUI確認が必要 |
| 国選択/国旗API表示 | データはAPI化できるが、選びやすさはUIの問題 |

## 推奨する実装順

1. Backend Connector Registry
   - POS、配送、Oracle OPERA、DB、将来のHotel/PMS/ERPを同じadapter contractで登録する。
   - endpoint、token、headersはserver envだけに置く。
   - public capabilityではsecretやURLを返さない。

2. Backend Job Runner
   - 郵便番号OSS、行政界、住所metadata、OpenAPI/SDK fixtureを国別に日次更新する。
   - 全世界一括ではなく、region shardごとに更新する。
   - source freshness、成功/失敗、license note、差分件数を保存する。

3. Address Resolution Pipeline API
   - 入力住所、AGID、座標、郵便番号、建物名、自然地物をresolver chainに通す。
   - 結果は `verified`, `partial`, `manual-required`, `blocked` に正規化する。
   - confidenceとsourcesを必ず返す。

4. Evidence and Audit Ledger
   - 住所解決、POS同期、配送同期、DB同期の結果を同じledger eventにする。
   - raw addressは保存せず、hash/commitment/reference中心にする。

5. Backend-only Test Matrix
   - API route tests、adapter tests、OpenAPI schema tests、privacy leak testsを先に固める。
   - UIテストは最後に、API契約が安定してから載せる。

## 完結形

バックエンドだけで先に完成させるべき完成形は、次の形です。

```text
source data / external API / POS / DB
        ↓
server adapter
        ↓
normalization + redaction + validation
        ↓
confidence + sources + warnings
        ↓
ledger / OpenAPI / SDK / job report
```

この形にすると、UIは「結果を表示する薄い層」になり、住所品質、外部連携、監査、データ更新の大部分をバックエンドで安定化できます。

## バックエンド専用OSSインベントリ

実装上の正本は `src/server/backendOnlyOpenSource.ts` です。
新規ロジックは `src/lib` 直下に増やさず、バックエンド専用の整理は `src/server` 側で管理します。

| Capability | 層 | 精度段階 | 役割 |
| --- | --- | --- | --- |
| `backend-agid-resolver-conformance` | verifier | deterministic | AGID/AOIDのcodec、cell bounds、SDK parityを固定 |
| `backend-secure-address-qr-verifier` | verifier | deterministic | Secure Address QRをalias/commitment/receiptで検証 |
| `backend-address-resolution-pipeline` | api-route | source-backed | 住所解決をVerified/Partial/Manual requiredへ正規化 |
| `backend-country-pack-validator` | data-pack | source-backed | YAML編集元とJSON配信用生成物を検証 |
| `backend-postal-forge-pack-generator` | cli-job | candidate-scored | 国別postal pack候補を生成し、公式郵便番号とは分離 |
| `backend-openapi-sdk-release` | schema-contract | deterministic | OpenAPI、SDK、fixtureを同じ契約で検証 |
| `backend-zk-nullifier-verifier` | verifier | deterministic | proof bundle、freshness、nullifierを公開信号だけで検証 |
| `backend-redacted-evidence-ledger` | ledger | source-backed | raw住所ではなくreceipt/commitment/cause codeで証跡化 |
| `backend-connector-contracts` | adapter-contract | source-backed | POS/OPERA/配送/翻訳/libpostal/DB連携をredacted contract化 |
| `backend-natural-feature-context` | api-route | candidate-scored | 海・山・水辺・島しょ・極地をAGID/地理証拠で補助 |

## 精度段階

| 段階 | 意味 | 公開時の扱い |
| --- | --- | --- |
| `deterministic` | AGID codec、QR署名、ZK public signalsのように同じ入力なら同じ結果を返せる | release gateを通ればpublish-ready |
| `source-backed` | 公式データ、OSS、郵便番号ルール、行政階層などの根拠で判断する | source freshness、license、fallbackを必須 |
| `candidate-scored` | OSM/Overture/自然地物/AGID生成postal zoneなど、候補と信頼度で扱う | Manual reviewやPartialを標準にする |
| `manual-required` | 住所制度や地理データが弱く、自動確定しない | AGID/座標/aliasを主識別子にし、人間確認へ送る |

## バックエンド専用OSS精度ゲート

各capabilityは次を満たさないと公開候補にしません。

- `schema-validation` と `no-raw-address-gate` を必ず持つ。
- `releaseGates`、`minimumSourceEvidence`、`fallbackBehavior` を必ず持つ。
- `src/components/**` や `*Screen.tsx` に依存しない。
- production trafficを送らず、外部通信は `optional-user-configured` または `dry-run-fixture-only` にする。
- `raw address`、`raw AOID`、`AGID-S payload`、`recipient secret`、`proof code`、`PIN`、`private key`、`Oracle raw error` をpublic artifactにしない。
- 商用境界やCommercial licenseに依存しない。商用connectorはOSS契約を消費する側に置く。

検証コマンド:

```bash
npm run verify:backend-only-oss
```

## バックエンドだけで精度を上げる順番

1. `backend-country-pack-validator`
   - YAMLを編集元、JSONを配信用生成物として固定する。
   - `sourceVersion`、`generatedAt`、`license`、`confidence` を必須化する。

2. `backend-address-resolution-pipeline`
   - 郵便番号、行政階層、地物、AGID cell、建物候補をresolver chainで統合する。
   - 自動確定できない場合は `Partial` か `Manual required` に落とす。

3. `backend-connector-contracts`
   - OPERA/POS/配送/libpostal/外部検証はconnector別auth、no-cache、no unsafe retry、redacted errorに統一する。
   - Oracle raw errorやraw addressはUIにもログにも返さず、cause codeだけ返す。

4. `backend-redacted-evidence-ledger`
   - API、ジョブ、コネクタ、SDK releaseの結果を同じredacted eventで残す。
   - 後から監査・同期・再実行判断に使う。

5. `backend-openapi-sdk-release`
   - backend契約をOpenAPIとSDK parity vectorsへ反映する。
   - SDKは `agid-spec` と parity vectors から生成する扱いに統一する。
