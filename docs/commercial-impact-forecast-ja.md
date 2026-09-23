# AGID/AOID Commercial Impact Forecast

Last reviewed: 2026-06-18

## 結論

AGID/AOID の商用部分は、かなり大きな事業余地があります。ただし、稼ぎ方を間違えるとプロジェクトの哲学を壊します。

一番安全で強い位置付けは、住所データ販売や暗号通貨事業ではなく、**住所・配送・証明・端末・監査を支える運用信頼インフラ**です。

現実的な基準ケースは次です。

| 期間 | 低位 ARR | 基準 ARR | 高位 ARR | 解釈 |
| --- | ---: | ---: | ---: | --- |
| 12か月 | USD 30k | USD 185k | USD 935k | 有償PoC、導入支援、少数のPrivate Deployment中心 |
| 24か月 | USD 730k | USD 2.7M | USD 11.5M | Hosted Registry、POS fleet、Dashboard、Reviewが早期B2B化 |
| 36か月 | USD 2.55M | USD 10.9M | USD 43.5M | 物流、公共、NGO、EC/POSのどれか一つで縦に刺さった場合 |

これは保証値ではありません。実証実験、導入先、セキュリティレビュー、運用品質、法務整理、住所品質ベンチマークが揃うほど上振れします。

## 収益化してよい領域

| 商用領域 | インパクト | 売り方 | 12か月基準 | 24か月基準 | 36か月基準 |
| --- | ---: | --- | ---: | ---: | ---: |
| Private Deployment | 88 | 自治体、NGO、配送業者、倉庫、大企業向け専用導入 | USD 60k | USD 600k | USD 1.8M |
| Hosted Registry API | 86 | issuer、revocation、freshness、nullifier、used-state のホスト運用 | USD 25k | USD 350k | USD 1.2M |
| Advanced POS Management | 84 | 端末fleet、スタッフ権限、端末診断、拠点管理 | USD 15k | USD 300k | USD 1.8M |
| Address Radar / Signal | 80 | QR再利用、不正登録、低品質住所、高リスクhandoff検知 | USD 5k | USD 180k | USD 1.0M |
| Enterprise Dashboard | 78 | API、Webhook、監査、端末、issuer、レビュー、SLA可視化 | USD 20k | USD 300k | USD 1.2M |
| Evidence Vault managed版 | 77 | OCR、redaction、暗号化証跡、legal hold、保持期限 | USD 10k | USD 220k | USD 900k |
| Commercial Support | 74 | 導入支援、監査対応、カスタム連携、訓練 | USD 30k | USD 300k | USD 900k |
| Advanced Review Console | 72 | 要確認、拒否、異議申し立て、住所衝突の人手審査 | USD 10k | USD 180k | USD 700k |
| Payment / Carrier Label Service | 70 | 送り状、着払い/先払い、carrier API、escrow、receipt | USD 5k | USD 150k | USD 800k |
| Managed ZK Proof Service | 64 | proof queue、prover infrastructure、verifier連携 | USD 5k | USD 120k | USD 600k |

最初に売りやすいのは `Private Deployment` と `Commercial Support` です。これは仕様や標準を閉じずに収益化できます。

SaaSとして伸ばしやすいのは `Hosted Registry API`、`Advanced POS Management`、`Enterprise Dashboard` です。ここは実運用の可用性、監査、端末管理、Webhook、ログ保全が価値になります。

## 無料のまま残すべき領域

- AGID/AOID/AGID-S の公開仕様
- AGID encode/decode SDK
- Address Element の基本部品
- Local Resolver
- 基本POSのローカル受付、QR/NFC、AGID-S復号、基本receipt
- Address Portal の同意、scope、失効、削除、export
- ZK基礎回路、public signal schema、test vectors
- no-raw-address test、脅威モデル、セキュリティ境界

これらを有料化すると、寄付・助成・OSS採用・公共利用の信用を失います。

## 参考になる外部相場

住所検証や配送、認証、POSは、無料SDKではなく運用・従量・端末・管理機能で収益化されています。

- Google Address Validation API は pay-as-you-go で、リクエスト単位の課金、課金有効化、API key/OAuth、quota管理を前提にしています。
- EasyPost は配送API、住所検証、tracking、label、insuranceをまとめ、無料枠の後にラベル単位やBYOCA月額、enterprise custom pricingを持っています。
- Twilio Verify は pay-as-you-go で、成功verificationごとの基本料金とチャネル料金、volume pricingを持っています。
- Stripe Terminal はPOS端末、端末管理、決済、hardware logistics、reporting、developer toolsを束ね、端末価格、決済手数料、readerごとの管理費、custom pricingを持っています。

AGID/AOIDも、OSS標準を無料にしながら、Hosted Registry、POS fleet、監査、端末、証跡、ZK prover、carrier/payment連携で課金する構造が自然です。

## 強い顧客セグメント

| 顧客 | 買う理由 | 最初に売る機能 |
| --- | --- | --- |
| 配送業者 / parcel shop | 住所不備、QR再利用、受取人proof、端末管理を減らしたい | POS fleet、Registry、Radar |
| EC / marketplace | 住所入力失敗、返品、誤配送、高額配送リスクを減らしたい | Address Element、Validation、Review |
| NGO / 災害支援 | 住所を公開せず支援対象・未使用・配送可能性を確認したい | AGID-S、Portal、Registry、Private Deployment |
| 自治体 / 公共 | 住所制度、避難所、支援拠点、監査可能な配布を扱いたい | Private Deployment、Dashboard、Evidence Vault |
| 倉庫 / WMS/TMS | 送り状、handoff、POD、端末、配送不能報告を統合したい | POS、Label Intent、Operations連携 |
| 暗号/ID事業者 | ZK住所述語、issuer trust、revocation、nullifierを使いたい | ZK baseline、Managed ZK、Registry |

## インパクト予測

社会的インパクトは、収益よりも次の順で測るべきです。

1. 住所を公開せずに配送可能性や居住地域を証明できる。
2. 住所不備、重複登録、QRコピー、偽handoffを減らせる。
3. 災害時や低住所地域でも、ローカル・オフラインで受付できる。
4. 公共・NGO・配送業者が、raw address を中央に集めず監査できる。
5. EC/CMS/POS/買い物Agentが同じ住所コンポーネントを使える。

事業インパクトは、最初は大きな市場を横断するより、狭い現場で深く刺す方が強いです。

推奨する最初の縦市場は次です。

1. parcel shop / PUDO / pickup counter
2. NGO / humanitarian field logistics
3. cross-border EC seller
4. warehouse shipping desk
5. public-sector disaster or address-quality pilot

## 稼ぐために改善すべきこと

収益を上げるために哲学を曲げる必要はありません。必要なのは、実運用品質です。

- 5分で分かるPOSデモを作る。
- Local Resolver / Address Element / POS のセットアップを1コマンドにする。
- Hosted Registry API のSLA、監視、Webhook署名、rate limitを固める。
- no-raw-address、AGID-S payload非保存、proof witness非保存のテストをrelease gateにする。
- 端末管理、スタッフ権限、プリンタ/スキャナ/計測器診断をPOSで安定化する。
- 住所品質ベンチマークを公開し、国・地域・言語ごとの弱点を正直に出す。
- Private Deployment 用に、自治体/NGO/配送業者向け導入資料を分ける。
- 商用版でも self-host / local fallback / export を残す。

## やってはいけないこと

- raw address やrecipient identity graphを販売しない。
- 高リスクモード、削除、失効、local decrypt、基本Portalを有料化しない。
- Ethereum、ZK、Hosted Registryを基本配送/POSに必須化しない。
- 「住所の真実を完全証明できる」と言わない。
- 暗号通貨・トークン収益を前面に出さない。
- 住所データの中央集権台帳にしない。

## 実装上の参照

この予測は `src/lib/commercialImpactForecast.ts` で機械可読に管理します。数字や前提を変えた場合は、`src/lib/commercialImpactForecast.test.ts` の合計・ガードレール・優先順位テストも更新します。

## Source URLs

- https://developers.google.com/maps/documentation/address-validation/usage-and-billing
- https://www.easypost.com/pricing/
- https://www.twilio.com/en-us/verify/pricing
- https://stripe.com/terminal
