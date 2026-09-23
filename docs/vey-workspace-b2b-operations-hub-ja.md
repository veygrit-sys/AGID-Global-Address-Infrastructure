# VeyWorkspace: B2B Operations Hub

## 結論

VeyWorkspace は、注文、在庫、配送、請求、チーム連携を一元管理する B2B 向け業務プラットフォームである。

ただし、VeyWorkspace は「顧客住所を溜め込むCRM」ではない。AGID/AOID 系の原則に合わせ、実住所、電話番号、メール、請求書本文、契約本文、銀行口座、カード番号は保存しない。

```text
VeyWorkspace
  -> 注文、在庫、配送、請求、タスク、通知、KPI

Operations
  -> WMS/TMS、ピッキング、配送計画、倉庫/輸送実行

VeyTrading
  -> 商品・資源・デジタル資産の取引Intent

VeyFinance
  -> 税、関税、資金予約、エスクロー、POD連動解放
```

## サービス定義

VeyWorkspace は、複数拠点を持つ企業、卸売業者、倉庫、配送会社、EC事業者、支援団体が、業務状態を一つの作業面で把握するための統合ハブである。

中核は `VeyWorkspaceHub` である。

```text
orders
inventory
shipments
invoices
collaboration channels
tasks
workflows
security controls
KPI
redacted notifications
```

## 注文管理

注文は、注文IDではなく操作用 alias と状態で扱う。

```text
draft
received
confirmed
allocated
partially-fulfilled
fulfilled
invoiced
paid
blocked
```

注文は `tradingIntentRef` と `financeIntentRef` を持てる。これにより、VeyTrading の売買Intent、VeyFinance の税・資金Intentと接続できる。

## 在庫管理

在庫は拠点別に管理する。

```text
skuId
locationId
onHand
allocated
openOrderDemand
available
reorderPoint
reorderQuantity
unitCost
inventoryValue
status
```

在庫ステータスは次の三つに絞る。

```text
healthy
low-stock
out-of-stock
```

低在庫時は自動発注候補を出す。複数拠点に同じSKUがあり、別拠点に余剰がある場合は倉庫間移動を提案する。

## 配送管理

配送は、配送業者 alias、追跡 alias、配送証跡 commitment だけを扱う。

```text
scheduled
in-transit
delivered
exception
blocked
```

実住所や受取人名は通知にもログにも出さない。配送例外が発生した場合は、Slack/Teams には redacted notification だけを送る。

## 請求書管理

注文から請求書を自動生成できる。

```text
draft
sent
partially-paid
paid
overdue
disputed
```

ただし、請求書本文、銀行口座、カード情報、顧客連絡先は保存しない。

売掛金は `amountDue - amountPaid` で計算し、期限超過の場合は `overdue` にする。

## Slack / Teams 連携

VeyWorkspace の通知は必ず redacted である。

通知できるイベントは次。

```text
order-blocked
inventory-low
shipment-exception
invoice-overdue
backup-stale
```

通知本文に入れてよいものは、alias、commitment、状態、KPI、作業指示だけである。

```text
OK:
  Order B2B-ORDER-1001 requires review
  SKU-A is low-stock
  Invoice INV-2001 is overdue

NG:
  実住所
  顧客氏名
  電話番号
  メールアドレス
  銀行口座
  請求書本文
```

## マルチロケーション

VeyWorkspace は複数拠点を前提にする。

```text
warehouse
store
office
fulfillment
supplier
cross-dock
```

拠点をまたぐ在庫移動、配送例外、請求フォロー、バックアップ状態を同じ画面で見られるようにする。

## セキュリティ

最低限必要な管理項目は次。

```text
role-based access control
audit log
encrypted backup
retention days
GDPR export workflow
deletion workflow
```

権限は、少なくとも次に分ける。

```text
admin
operations
finance
viewer
integration-bot
```

## プライバシー境界

VeyWorkspace は、次を保存しない。

```text
raw address
recipient name
customer name
phone
email
invoice body
contract body
private key
bank account
card PAN
webhook secret
raw webhook URL
```

保存してよいものは、alias、commitment、参照ID、状態、金額、KPI、redacted event である。

## OSSで作る範囲

```text
VeyWorkspaceHub state model
order / inventory / shipment / invoice schema
auto invoice draft
low-stock and transfer recommendation
redacted Slack/Teams notification model
RBAC metadata
audit / backup / GDPR readiness checks
no-raw-address / no-contact tests
```

## 商用または外部連携向きの範囲

```text
実Slack/Teams送信
会計ソフト同期
ERP/WMS/TMS接続
高度なBIダッシュボード
監査ログ長期保管
SLA付きバックアップ
企業SSO
多拠点権限管理
```

## 一文定義

VeyWorkspace は、注文、在庫、配送、請求、チーム連携を、実住所や個人連絡先を保存せずに統合する B2B 業務ハブである。
