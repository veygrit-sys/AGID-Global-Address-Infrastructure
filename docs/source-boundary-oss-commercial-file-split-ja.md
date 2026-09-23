# OSS / Commercial Source Boundary

Last updated: 2026-06-20

この文書は、AGID/AOIDプロジェクトのファイルを「オープンソースに残すもの」と「商用運用に分けるもの」に整理するための実装ルールである。対応する機械可読モデルは次の3ファイルに置く。

- `src/lib/sourceBoundary.ts`
- `src/lib/sourceBoundaryOpenSource.ts`
- `src/lib/sourceBoundaryCommercial.ts`

## 方針

現時点では既存ファイルを大移動しない。理由は、`src/lib/*` や `src/components/*` を直接参照している既存テスト・画面・SDKが多く、物理移動だけを先に行うと互換性を壊しやすいためである。

代わりに、各領域について次を固定する。

| 項目 | 意味 |
| --- | --- |
| `currentPaths` | 現在の互換パス。既存importを壊さないため残す。 |
| `recommendedPaths` | 将来の配置先。OSS package、OSS app、commercial service、enterprise deploymentに分ける。 |
| `stableImport` | 互換維持の代表import。移動後もbarrel/shimで残す。 |
| `ossFallback` | 商用機能に対して必ず残す自己ホスト/ローカル代替。 |
| `guardrails` | raw address漏洩、証跡、ZK witness、公式性の過剰主張を防ぐ制約。 |

つまり、今は「互換性を保つ境界」を作り、次段階でエイリアスとbarrel exportを追加してから物理移動する。

## OSSに固定するファイル群

| 領域 | 現在の代表パス | 将来の配置先 |
| --- | --- | --- |
| AGID/AOID標準・SDK | `sdk/agid-spec/**`, `sdk/agid-*/**`, `src/lib/agid.ts`, `src/lib/aoid.ts` | `packages/oss/agid-spec/**`, `packages/oss/agid-sdk/**` |
| Local Resolver / 表示 | `src/lib/addressDisplay.ts`, `src/lib/addressRendering.ts`, `src/data/address_formats/**` | `packages/oss/address-resolver/**` |
| Address Registration / Element | `src/components/AddressRegistration.tsx`, `src/components/AgidAddressElement.tsx`, `src/lib/addressElement.ts` | `apps/oss/address-registration/**`, `packages/oss/address-element/**` |
| Basic POS | `src/components/PosAppScreen.tsx`, `src/lib/posAcceptance.ts`, `src/lib/shippingLabelQr.ts` | `apps/oss/pos-terminal/**`, `packages/oss/pos-core/**` |
| Address Portal | `src/components/AddressPortalScreen.tsx`, `src/lib/addressPortal.ts`, `src/lib/addressConsentEnvelope.ts` | `apps/oss/address-portal/**`, `packages/oss/consent/**` |
| Privacy / Security | `SECURITY.md`, `src/lib/noRawAddressReleaseScan.ts`, `src/lib/publicPrivateSeparation.ts` | `packages/oss/security-gates/**` |
| ZK基礎 | `circuits/**`, `src/lib/zkProofRuntime.ts`, `src/lib/agidZkAddressProofs.ts` | `packages/oss/zk-address-predicates/**` |
| Docs / Research | `docs/address-morphism-theory-*.md`, `docs/zk-address-*.md`, `sdk/agid-spec/test-vectors.json` | `docs/oss/specs/**`, `docs/oss/papers/**` |

これらは、有料サービスを使わなくてもAGID/AOIDを実装・検証・ローカル運用できるために必要な層である。特に、AGID生成、AGID decode、AGID-Sローカル復号、住所表示、言語タブ、郵便番号補完、基本POS、Portalの取消/削除/export、no-raw-addressテストは閉じない。

## 商用に分けるファイル群

| 領域 | 現在の代表パス | 将来の配置先 | OSS fallback |
| --- | --- | --- | --- |
| Hosted Registry | `src/lib/agidRegistryApi.ts`, `src/server/**`, `server.ts` | `services/commercial/hosted-registry/**` | self-host registry schema / OpenAPI |
| Enterprise Console | `src/components/AddressDashboardScreen.tsx`, `src/lib/developerConsole.ts` | `apps/commercial/address-console/**` | minimal self-host dashboard |
| Advanced POS Fleet | `src/lib/addressTerminal.ts`, `src/lib/posOperationalControls.ts` | `apps/commercial/terminal-fleet/**` | local POS diagnostics |
| Review / Radar | `src/lib/addressRadar.ts`, `src/lib/addressSignal.ts` | `services/commercial/address-radar/**` | local reason-code rules |
| Managed Evidence Vault | `src/lib/addressEvidenceVault.ts`, `src/lib/addressDocumentReading.ts` | `services/commercial/evidence-retention/**` | local encrypted evidence envelope |
| Managed ZK | `src/lib/managedZkProofServer.ts` | `services/commercial/managed-zk-proof/**` | self-host prover path |
| Private Deployment | `src/lib/privateDeployment.ts` | `enterprise/private-deployments/**` | deployment guides / reference stack |
| Payment / Carrier Label | `src/lib/carrierLabelIntent.ts`, `src/lib/posEthereumPayment.ts`, `src/lib/veyFinance.ts` | `services/commercial/payment-settlement/**` | waybill QR schema / manual carrier flow |

商用にできるのは「ホスト運用」「SLA」「長期ログ」「端末fleet」「法的保持」「ZK計算資源」「規制対応」「有人審査」「専用導入」であり、プロトコルの検証権そのものではない。

## 二重契約として扱うもの

一部の機能は、公開モデルと商用運用が同居している。ここは特に混ざりやすいため `dual-contract` とする。

| 領域 | OSSに残すもの | 商用に分けるもの |
| --- | --- | --- |
| Veygrit ID | protocol、scope model、consent contract、SDK、自ホスト可能な認可モデル | hosted IdP、法人審査、KYB、API key運用、abuse対応 |
| Postal Zone Designer | 数理モデル、ローカルGIS設計、draft/pilot export | 自治体・郵便当局との公式承認ワークフロー、managed GIS review |
| Operations / Workspace / Trading / Finance | 状態機械、receipt schema、simulation model | 規制対象の支払い、関税納付、エスクロー、商用WMS/TMS運用 |
| Drone / Locker Ops | MQTT/HTTP/Modbus local simulator、到達可否API、配送証跡API | 実機fleet、hardware certification、multi-site SLA |

## 互換性ルール

1. 既存の `src/lib/*` と `src/components/*` はすぐに消さない。
2. 物理移動する前に、`packages/oss/*` や `services/commercial/*` へのbarrel exportまたはcompatibility shimを追加する。
3. OSS coreからcommercial moduleをimportしない。依存方向は `commercial -> oss` のみ。
4. Mode 0 Local Onlyは、Hosted Registry、Managed ZK、Ethereum、Payment Settlement、Enterprise Dashboardなしで動く。
5. raw address、raw AOID、AGID-S payload、proof code、recipient secret、passport-name payloadを境界越えの既定payloadにしない。
6. 商用機能には必ずOSS fallbackまたはself-host pathを用意する。

## 次の物理移動順

1. `packages/oss/address-element/**` を作り、`src/lib/addressElement.ts` からre-exportする。
2. `apps/oss/address-portal/**` を作り、`/portal` 画面をそこから読み込む。
3. `apps/oss/pos-terminal/**` を作り、POSのScan -> Decision -> Handoff -> Reportを独立app化する。
4. `packages/oss/security-gates/**` を作り、no-raw-address系テストを公開release gate化する。
5. `services/commercial/hosted-registry/**` にHosted Registryの運用コードを移し、OSS側にはOpenAPI/schema/clientだけ残す。
6. `apps/commercial/address-console/**` にDashboard/Review/Developer Consoleの商用運用層を移す。

## 検証

境界モデルは次で検証する。

```bash
npx tsx --test src/lib/sourceBoundary.test.ts
```

`validateSourceBoundaryManifest()` は次を確認する。

- OSS entryがCommercial licenseになっていない。
- Commercial / dual-contract entryにOSS fallbackがある。
- 現在パスを残し、互換shimを先に置く方針になっている。
- 必須領域、Mode 0、no raw address、OSS coreからcommercialへimportしない原則が存在する。
