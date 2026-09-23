# VeyFinance / AGID Finance: Trade Execution Robot

## 結論

VeyFinance は「決済アプリ」ではない。カフェでコーヒーを買うような一般決済を扱うのではなく、物流・通関・税・保険・売掛・配送証跡を束ねる越境取引実行ロボットである。

中心に置くべき概念は、支払いではなく Trade Execution Intent である。

```text
商品
  -> HS分類
  -> 住所・配送可否
  -> 関税/VAT/GST/送料/保険料/通関手数料
  -> 資金徴収
  -> 税金・関税の予約
  -> 通関
  -> 配送
  -> POD
  -> エスクロー解放 / 返金 / 保険請求
```

つまり VeyFinance は、Stripe などの決済処理の上に乗る「貿易実行レイヤー」であり、決済処理そのものを主役にしない。

## 位置付け

Stripe Tax は sales tax / VAT / GST の計算、登録、申告、ファイリング支援を提供できる。一方、VeyFinance が担うべき領域は、関税、HSコード、通関証拠、配送完了、保険、エスクロー、住所検証を一つの実行状態として接続する部分である。

WCO の Harmonized System は国際貿易で使われる商品分類体系であり、税関関税や貿易統計の基盤になる。WITS は貿易・関税・非関税措置データへのアクセスを提供する。Frankfurter は為替参照データの取得やセルフホスト可能な FX キャッシュの候補になる。

ただし、これらのデータはそのまま法的な通関判定や納税完了を意味しない。VeyFinance は、初期段階では「証拠付き推定」「税金予約」「納付指示」までを担い、実際の納税・送金・エスクロー資金移動はライセンス済み事業者やオペレーター承認アダプタへ委譲する。

## Border Suite

### 1. Landed Cost Engine

住所、AGID/AOID、配送先国、商品金額、送料、保険料、通関手数料、HSコード、税率証拠から着地コストを算出する。

出力は次の形にする。

```text
goods value
+ shipping
+ insurance
+ customs brokerage fee
+ duty
+ VAT/GST/sales tax
= total landed cost
```

POSやECカートでは、ユーザーに細かい内部スコアを見せず、次の操作判断だけを出す。

```text
Ready to collect
Needs tax evidence
Needs product classification
Needs manual trade review
Rejected
```

### 2. Smart Tax Reserve and Remittance Instruction

「Veyが全世界の税務署へ直接納税する」と断定すると、規制・ライセンス・税理士業務・通関業務の問題が大きくなる。

安全な初期表現は次の通り。

```text
税額を推定する
税金・関税分を分離して予約する
納付先・証拠・期限・必要書類を生成する
ライセンス済みアダプタまたはオペレーター承認で納付する
```

つまり、Smart Tax Remittance の初期実装は「納税実行」ではなく「税予約 + 納付指示 + 証拠パック生成」として扱う。

### 3. Global Escrow

購入者から預かった資金を、配送完了や損害検知に応じて自動分岐する。

```text
POD signed + customs cleared + no dispute
  -> seller release

damaged / lost / dispute
  -> refund or insurance claim

no POD / expired / suspicious handoff
  -> review
```

この機能は AGID POS Terminal、Carrier Label Intent、Field Handoff App と強く連携する。

### 4. Trade Evidence Pack

後から監査・税務確認・紛争対応できるように、次の証拠だけを保存する。

```text
HS classification evidence ref
tariff snapshot ref
VAT/GST evidence ref
FX snapshot ref
carrier acceptance ref
customs clearance ref
POD receipt ref
insurance claim ref
```

保存してはいけないものは次。

```text
raw address
raw AGID
raw AOID
recipient name
phone
email
card number
bank account
private key
customs document body
tax document body
```

## AGID/AOIDとの接続

VeyFinance は AGID/AOID の上位アプリではなく、横断モジュールである。

```text
Address Registration
  -> 住所と配送可否を確認

AGID/AOID
  -> 配送地点、住所権限、受取人proof

Carrier Label Intent
  -> 送り状、QR、配送業者受理、POD

POS Terminal
  -> Scan -> Decision -> Handoff -> Report

Evidence Vault
  -> OCR・PDF・写真証拠をredactionして参照化

Dashboard / Review Console
  -> 要確認、拒否、紛争、監査

VeyFinance
  -> 着地コスト、税予約、エスクロー、精算
```

## Intent状態

Finance の状態は支払い状態だけでは足りない。物流と通関を含む状態機械にする。

```text
requires-product-classification
requires-address-evidence
requires-tax-evidence
estimated
requires-review
ready-to-collect
collected
tax-reserved
customs-cleared
in-transit
pod-confirmed
release-ready
released
refund-required
disputed
rejected
```

この状態機械により、カート、POS、配送、管理画面、監査レポートが同じ判断を共有できる。

## 競争優位

### vs Stripe

Stripe は決済、PaymentIntent、Tax、Checkout、Connect に強い。VeyFinance は Stripe を置き換えない。Stripe を payment adapter として使い、その上で貿易・関税・配送・POD・保険・エスクローの実行状態を管理する。

```text
Stripe = payment / tax calculation / checkout
VeyFinance = trade execution / landed cost / customs evidence / POD-linked release
```

### vs 従来の税務サービス

従来の税務サービスは税計算や申告支援が中心になりやすい。VeyFinance は物流イベントを資金解放条件に直接接続する。

```text
tax evidence
customs clearance
carrier acceptance
POD
damage report
escrow release
```

を一つの実行ログで扱う点が違う。

### vs 配送API

配送APIはラベル作成や追跡に強い。VeyFinance は配送APIの結果を資金・税・保険の判断材料として使う。

## 無料・OSSで始める範囲

初期段階で無料・OSS寄りにできる範囲は次。

```text
HSコード静的データによる分類補助
WTO/WITSなどのoperator-imported tariff evidence
Frankfurter self-host/local FX cache
open-source tax evidence
AGID住所検証
Carrier Label Intent
POD receipt ref
local-only finance intent state machine
no-raw-address tests
```

無料でやりきれない、または有料/ライセンス/専門家が必要な範囲は次。

```text
実際の納税代行
エスクロー資金保全
銀行送金
AML/KYC/KYB
通関業者としての申告
税務代理
保険金支払い
国ごとの公式API接続
```

## リスク

### 法務・規制

税金を預かる、エスクローする、送金する、納税する、保険金を払う、通関申告する、という行為はそれぞれ別の規制を持つ。初期MVPでは「推定・予約・指示・監査」までに留める。

### 精度

HS分類、原産地、輸入国、用途、素材、数量、価格、インコタームズがずれると税額が変わる。AI分類は補助であり、確信度が低い場合は人手確認へ回す。

### プライバシー

関税・税金処理は住所・氏名・電話番号・商品詳細・価格を集めやすい。AGIDの思想に合わせて、Financeは raw address by default を禁止し、commitment、alias、evidence ref、redaction済み文書だけを扱う。

### 不正

低く申告した商品価格、誤ったHS分類、偽POD、偽配送事故、二重返金が起きる。Address Radar / Signal と連携し、次のルールを入れる。

```text
if hs_confidence low then review
if high_value and tax_evidence open-source only then review
if pod unsigned then block release
if damage_detected then refund_or_insurance_review
if raw_address_present then reject
```

## 実装ロードマップ

### Phase 0: Evidence-only

着地コスト推定、HS分類補助、税率証拠、FX参照、住所検証をローカルで動かす。資金移動はしない。

### Phase 1: Finance Intent API

`VeyFinanceTradeIntent` を実装し、EC、POS、買い物Agent、Dashboardから同じ状態を参照できるようにする。

### Phase 2: Tax Reserve / Escrow Instruction

支払い後、税金・関税分を分離予約し、納付指示と監査証跡を生成する。実際の納付は未実行。

### Phase 3: Licensed Adapter

Stripe、銀行、エスクロー事業者、通関業者、税務サービス、保険サービスのアダプタを追加する。

### Phase 4: Managed Operations

高額配送、複数国、B2B、通関、保険、紛争解決を含む運用ダッシュボードを提供する。

## 一文定義

VeyFinance は、越境配送に伴う着地コスト、税金・関税予約、配送証跡、エスクロー解放、返金・保険判断を、住所と物流イベントに接続して自動実行する Trade Execution Robot である。
