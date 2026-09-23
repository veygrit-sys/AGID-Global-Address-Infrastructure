# AGID/AOID App Feature Monetization Boundary

Last updated: 2026-06-18

この文書は、AGID/AOID関連アプリで「無料にすべき機能」と「有料にしてよい機能」の線引きを定義する。対応する機械可読モデルは `src/lib/appFeatureMonetizationBoundary.ts` に置く。

## 基本方針

課金するのは、運用、規模、SLA、長期保管、組織管理、マネージド証明、専用導入である。課金してはいけないのは、ローカル利用、安全機能、ユーザーの取消・削除・エクスポート、公開標準の検証、基本的な住所解決である。

一文で言うと、

> AGID/AOIDは、住所インフラの標準・検証・安全機能を無料/OSSで保ち、Hosted運用と企業向け統制を有料にする。

## 絶対に課金壁に入れない機能

| 機能 | 理由 |
| --- | --- |
| AGID生成・decode | 公開標準の基本機能だから。 |
| AGID-Sのローカル復号 | 鍵を持つ受信者が安全に読むための基本機能だから。 |
| ローカル住所表示・言語タブ・郵便番号補完・基本住所検証 | 中央サービスなしで使えることが信頼の核だから。 |
| QR/NFC受付・基本POS・offline queue・基本receipt | POSや災害現場で無料運用できる必要があるから。 |
| Address Element埋め込みUI | EC、CMS、買い物Agent、POSがHostedサービスなしで導入できる必要があるから。 |
| 高リスクモード | DV、避難、難民、人道支援で安全機能を有料化してはいけないから。 |
| no-raw-addressテスト・redaction | プライバシー保護は商品ではなく前提だから。 |
| ユーザーの同意確認・取消 | ユーザーが自分の住所許可を取り戻せる必要があるから。 |
| データexport/delete | ロックイン防止とプライバシー権利に直結するから。 |
| セキュリティ修正 | 脆弱性修正を有料化するとOSSとして信用を失うから。 |

## 無料で使えるべき機能

| アプリ | 無料機能 |
| --- | --- |
| AGID Map / Registration App | 地図検索、AGID生成、住所表示、言語タブ、郵便番号補完、住所登録、住所修正、ローカルフィードバック |
| AGID POS Terminal App | QR/NFC scan、AGID-Sローカル復号、ローカル検証、基本receipt、offline queue、基本端末診断 |
| Address Portal App | 接続一覧、scope確認、revoke、delete、export、ローカルcredential確認 |
| Address Console App | self-hosted向けOpenAPI表示、redacted event viewer、Webhook署名サンプル、launch checklist |
| AGID Address Element | 埋め込み住所入力UI、AddressIntent event、AGID/郵便番号補助、言語対応 |

無料版は、個人、小規模店舗、OSS検証者、災害現場の初期運用、研究者、自治体/NGOの検証環境が使える水準にする。

## 有料にしてよい機能

| 有料区分 | 機能 | 理由 |
| --- | --- | --- |
| Pro | Hosted Registry、revocation、freshness、nullifier、used-state同期 | 可用性、監視、運用が発生する。 |
| Business | 組織Dashboard、RBAC、APIキー、Webhook運用、長期ログ、review queue | 複数人・複数拠点・監査対応の価値。 |
| Business | POS端末fleet、スタッフ権限、プリンタ/計測器診断、拠点管理 | 端末運用とサポート負荷が高い。 |
| Business | Managed Evidence Vault、OCR、legal hold、保持期限管理 | 証跡保管とコンプライアンスが重い。 |
| Business | Address Radar高度リスク判定、異議申し立て、再照合 | 運用チューニングと人手審査が必要。 |
| Enterprise | Managed ZK proof generation、proof queue、prover infrastructure | 証明生成の計算資源と安全運用が高コスト。 |
| Enterprise | SSO、専用環境、SLA、監査支援、カスタム国/配送業者ルール | 大企業・自治体・配送業者向けの個別要件。 |

## アプリ別の線引き

### AGID Map / Registration App

無料:
- AGID生成、地図表示、住所表示、言語タブ、郵便番号補完
- 住所修正、フィードバック、基本品質状態
- ローカルResolverとローカル住所検証

有料:
- 高容量Hosted Resolver
- 公式データ更新監視
- 組織単位の品質分析
- managed feedback review queue

### AGID POS Terminal App

無料:
- QR/NFC受付
- AGID-Sローカル復号
- 受取人proofの基本確認
- 基本receipt
- offline queue
- scanner/printer/cash drawer/計測器の基本診断

有料:
- 端末fleet管理
- スタッフRBAC
- managed registry sync
- 長期監査保管
- certified device profile
- 複数拠点管理

### Address Portal App

無料:
- どの店舗・配送業者・支援団体に何を許可しているかの表示
- scope確認
- revoke
- delete
- export

有料:
- 企業向け同意通知workflow
- 組織監査用export bundle
- 法務/監査連携

ただし、ユーザー本人の取消・削除・エクスポートは無料のままにする。

### Address Console App

無料/self-hosted:
- OpenAPI viewer
- redacted event viewer
- Webhook署名サンプル
- launch checklist
- 最小Developer Console

有料:
- APIキー管理
- Webhook配送運用
- SLA monitoring
- 長期ログ
- Review Console高度版
- Address Radar
- Managed ZK
- Evidence Vault

### AGID Address Element

無料:
- 埋め込み住所入力UI
- 郵便番号補完
- AGID補完
- 言語タブ
- 住所品質の内部判定
- privacy-safe host events

有料:
- merchant analytics
- enterprise checkout support
- 高度な不正対策ルールパック
- managed integration support

## 課金でやってはいけないこと

- 有料にしないと住所を削除できない。
- 有料にしないと許可を取り消せない。
- 有料にしないと高リスクモードが使えない。
- 有料にしないとAGID-Sを復号できない。
- 有料にしないと公開AGID/AOID仕様を検証できない。
- 有料APIなしでは基本POSが動かない。
- 有料APIなしではAddress Elementが埋め込めない。
- 有料Dashboardだけに安全警告や拒否理由を出す。

## 価格階層の推奨

| 階層 | 位置づけ |
| --- | --- |
| Never Paywalled | 安全、取消、削除、export、local verification、高リスクモード |
| Free Local | 個人、小規模店舗、災害現場、研究、OSS検証 |
| Free Self-hosted | 開発者、自治体/NGOの検証環境、商用前PoC |
| Paid Pro | Hosted Registry、sync、少量Webhook、運用の手間を減らす層 |
| Paid Business | 端末fleet、RBAC、Review Console、Evidence Vault、長期ログ |
| Paid Enterprise | Managed ZK、SSO、専用環境、SLA、法務監査、カスタム連携 |

## 実装ルール

- UIでは「安全に必要な機能」を有料CTAの奥に置かない。
- 有料機能は「高度化」「自動化」「規模」「運用委託」として見せる。
- 無料版でも警告、拒否、要確認、失効、使用済み、削除、取消は扱える。
- 有料版でもraw address、raw AOID、AGID-S payload、proof codeをログに出さない。
- Pro/Business/Enterpriseは、OSS coreの上に載る運用サービスとして扱う。
