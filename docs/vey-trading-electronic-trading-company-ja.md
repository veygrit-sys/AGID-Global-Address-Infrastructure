# VeyTrading: Electronic Trading Company Platform

## 結論

VeyTrading は「決済アプリ」でも「単なるECモール」でもない。商品、資源、デジタル資産、先物ヘッジ、エスクローを扱う電子商社プラットフォームである。

ただし、最初から取引所・金融商品取引・商品先物の実執行まで行う設計にしてはいけない。初期版では、次を扱う。

```text
listing
quote
RFQ
counterparty KYC/KYB evidence
sanctions/export-control evidence
title/inventory evidence
finance intent link
escrow requirement
contract status
fulfillment evidence
settlement state
```

つまり、VeyTrading は売買そのものの入口と契約実行状態を管理し、VeyFinance は税・関税・資金・POD連動エスクローを実行する。

## サービス定義

VeyTrading は、世界中の実物商品、資源、デジタル資産、エスクロー案件を、住所・配送・通関・証跡・資金実行と接続する市場オーケストレーション層である。

```text
VeyTrading
  -> 商品/資産/市場/相手/価格/契約状態

VeyFinance
  -> 税/関税/送料/保険/資金予約/エスクロー解放

AGID/AOID
  -> 配送先/住所権限/受取人proof/到達証跡
```

## 扱う市場

### 1. 商品取引

現物商品の卸売・小売、価格比較、在庫確認、一括発注を扱う。

初期MVPでは、現物商品は最も現実的である。

```text
catalog
RFQ
spot order
auction
escrow-backed purchase
cross-border delivery
```

必要な証拠は次。

```text
listing evidence
inventory evidence
market data evidence
counterparty KYC/KYB
sanctions screen
title of goods
finance intent
carrier/POD evidence
```

### 2. 資源取引

エネルギー、鉱物、金属、農産物を扱う。

この領域は商品価値が大きく、制裁、輸出管理、原産地、紛争鉱物、船積み、品質等級、倉庫証券が重要になる。

初期版では実売買を急がず、次に限定する。

```text
RFQ
price indication
grade evidence
origin evidence
sanctions/export-control check
warehouse receipt reference
manual review
```

エネルギー市場や電力市場は国ごとの規制が強いため、ローカルOSS版で実執行しない。

### 3. デジタル資産取引

NFT、デジタルコンテンツ、ライセンス、知的財産の取引を扱う。

ここでは「秘密鍵を預かる取引所」にはしない。初期版は、所有証明、ライセンス権利、販売条件、エスクロー条件を扱う。

```text
digital asset ownership proof
license rights evidence
creator / issuer evidence
wallet risk screening
no private-key custody
no raw identity storage
```

FATFは virtual assets をデジタルに取引・移転・支払い利用できる価値表現として扱い、VASPにはCDD、記録保存、疑わしい取引報告、originator/beneficiary情報の安全な伝達などを求める。したがって、デジタル資産の実取引・保管・移転を行う場合は、国別VASP規制を前提にする。

### 4. 先物取引

商品先物、価格ヘッジ、デリバティブを扱う構想は魅力的だが、最も危険である。

CFTCの説明では、Designated Contract Markets は futures や option contracts を上場できる取引所であり、Swap Execution Facilities も登録と中核原則遵守が必要になる。

そのため初期VeyTradingでは、先物は次に限定する。

```text
futures simulation
hedge intent
risk exposure report
licensed venue routing
```

ローカルOSS版で先物・デリバティブを実執行してはいけない。

### 5. エスクローサービス

VeyTrading はエスクロー案件を作れるが、実際の資金保全・送金・返金は VeyFinance またはライセンス済みアダプタで行う。

```text
trade contract
escrow required
escrow funded evidence
fulfillment evidence
POD
settlement confirmed
dispute state
```

## Trading Intent

Tradingの中核は `VeyTradingIntent` である。

```text
assetKind
marketMode
side
listingAlias
orderAlias
assetCommitment
quantity
unitPrice
currency
originCountry
destinationCountry
evidence
financeIntentRef
escrow state
contract state
fulfillment state
settlement state
```

状態は次のようにする。

```text
requires-listing
requires-counterparty-kyc
requires-compliance-screening
requires-market-data
quoted
rfq-open
match-ready
requires-finance-intent
requires-escrow
ready-to-contract
contract-pending
in-escrow
fulfilled
settled
requires-licensed-venue
requires-review
disputed
rejected
```

この状態機械により、EC、卸売、資源RFQ、NFT販売、エスクロー案件、将来の先物ヘッジが同じ基盤で扱える。

## Financeとの分離

Tradingは決済しない。Tradingは取引を成立可能な状態へ持っていく。

```text
Trading:
  listing, quote, RFQ, market mode, compliance, contract state

Finance:
  landed cost, tax reserve, escrow, remittance instruction, POD release
```

この分離により、VeyTradingが金融規制の中心に不用意に突っ込むことを防げる。

## 必須コンプライアンス

### 全取引

```text
counterparty KYC/KYB
sanctions screening
audit log
market-data evidence
no raw address by default
no private key custody
```

### 資源・エネルギー

```text
export-control screen
origin evidence
resource grade
warehouse receipt
manual review
```

OFACは複数の制裁プログラムを運用し、資産凍結や貿易制限を通じて外交・国家安全保障目的を達成すると説明している。資源・エネルギー取引では、制裁対象、国、企業、船舶、貨物の確認が必須になる。

### デジタル資産

```text
ownership proof
license rights evidence
wallet risk screening
VASP / securities / consumer-protection review
```

SECは crypto markets の投資家保護とサイバー関連脅威への対応を扱う専門体制を持ち、fraud、market manipulation、fake websites、account intrusion などを執行対象としている。NFTやデジタルコンテンツ取引でも、詐欺・知財・証券性・消費者保護リスクを分けて扱う必要がある。

### 先物・デリバティブ

```text
licensed venue
clearing / margin / risk disclosure
no local execution
simulation only by default
```

## OSSで作る範囲

安全にOSS化しやすい範囲は次。

```text
VeyTradingIntent state machine
listing / RFQ / quote model
evidence schema
no-private-key/no-raw-address tests
manual review rules
Finance intent link
escrow state model
digital ownership proof placeholder
futures simulation mode
licensed venue routing model
```

## OSSだけでは提供しない範囲

次はライセンス、運用者承認、外部専門家、または商用/プライベートデプロイが必要になる。

```text
先物・デリバティブの実執行
エネルギー市場の実取引
資金保全としてのエスクロー
証券性のあるデジタル資産売買
暗号資産のカストディ
AML/CFT報告
制裁対象取引の判断
通関・輸出管理の最終判断
```

## 画面案

### Marketplace / Listings

商品・資源・デジタル資産の一覧、価格、在庫、取引条件を表示する。

### RFQ Desk

大口注文、資源、長期契約、相場確認を行う。

### Trade Review Console

KYC、制裁、輸出管理、所有権、ライセンス、倉庫証券、価格証拠を審査する。

### Escrow Desk

契約、資金予約、POD、紛争、返金、保険請求を表示する。

### Risk Dashboard

市場リスク、取引先リスク、商品リスク、国/制裁リスク、デジタル資産リスクを追跡する。

## ロードマップ

### Phase 0: Trading Intent

売買Intent、証拠スキーマ、状態機械、no-private-dataテストを作る。

### Phase 1: Spot Goods Marketplace

現物商品のカタログ、RFQ、価格証拠、Finance連携を実装する。

### Phase 2: Resource RFQ

資源・金属・農産物を、実執行ではなくRFQと審査フローとして扱う。

### Phase 3: Digital Asset Desk

NFT・デジタルコンテンツ・ライセンスを、所有証明と権利証拠ベースで扱う。

### Phase 4: Escrow Operations

VeyFinanceと接続して、エスクロー状態、配送証跡、紛争解決を管理する。

### Phase 5: Licensed Venue Adapters

先物・デリバティブは、認可された取引施設・ブローカー・清算機関へのルーティングだけを扱う。

## 一文定義

VeyTrading は、商品・資源・デジタル資産・エスクロー案件を、KYC、制裁、所有権、価格証拠、Finance Intent、配送証跡へ接続する電子商社プラットフォームである。
