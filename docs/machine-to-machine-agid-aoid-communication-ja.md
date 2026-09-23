# Machine-to-Machine AGID/AOID Communication

Last updated: 2026-06-20

## 結論

機械同士でAGID/AOIDを通信できるようにすると、AGID/AOIDは「人間が読む住所コード」から、配送・POS・EC・ロッカー・ドローン・倉庫・支援現場・買い物Agentが相互運用できる住所プロトコルになる。

ただし、設計上の中心は次である。

```text
AGID = 場所・配送到達点の参照
AOID = 住所権限・credential・開示制御の参照
AGID-S = AGIDを限定共有する暗号化封筒
AddressIntent = 機械同士の目的付きワークフロー
Address Access/Auth = scopeと権限の判定
Address DNS / ARS = resolver、issuer、revocation、carrier endpointの発見
```

重要なのは、AGIDやAOIDをそのまま広く配ることではない。機械同士の通信では、用途ごとに必要最小限の情報だけを渡す。

## 何ができるか

### 1. EC・買い物Agentが配送可能性だけを確認できる

買い物AgentやECカートは、購入前に次を確認できる。

```text
この商品は配送可能地域内か
高額配送なので受取人proofが必要か
P.O. Box不可の商品か
冷蔵ロッカーが必要か
越境配送で追加確認が必要か
```

この段階では、店舗やAgentは詳細住所を受け取る必要がない。

機械同士の問い合わせは次のようになる。

```text
Shopping Agent
  -> Address Resolver
  -> delivery eligibility
  -> accept / review / reject
```

できること:

- checkout前の配送可否判定
- 配送不可商品を早期に除外
- 国・都市・粗い地域だけで送料や配送方法を仮計算
- final disclosureを購入確定後に遅らせる
- ユーザーが許可した範囲だけ渡す

### 2. POSと配送業者が送り状・受取人proof・使用済み状態を同期できる

POS、配送業者端末、倉庫端末は、送り状QRやAGID-Sを読み取って同じ状態機械を共有できる。

```text
Address OK
Carrier Scan OK
Recipient Pending
Handoff Complete
```

できること:

- POS受付時に住所品質と配送可否を判断
- 配送業者側スキャンでcarrier acceptedを記録
- 受取人側のpasskey/NFC/AOID credentialでrecipient controlledを確認
- 双方スキャンと端末署名でdelivery completed receiptを作る
- QRコピーや重複使用をnullifier/used-stateで検出
- オフライン運用後に衝突をreviewへ送る

### 3. ロッカーやPUDOが住所の代替endpointになれる

ロッカーは、住所の代替ではなく「受け渡しendpoint」として扱う。

```text
AGID -> ロッカー拠点
AOID credential -> 受取権限
AddressIntent -> 予約・受取・返却
```

できること:

- 配送先が不在・到達不能のときロッカーへfallback
- 温度帯、サイズ、危険物、高額配送を考慮して区画割当
- QR/NFC/passkey/AOID credentialをcommitmentとして受け付ける
- MQTT/HTTP/Modbus simulatorで実機なしに運用テスト
- ロッカー扉詰まり、低ACK率、オフラインqueueを監査対象にする

### 4. ドローンや配送ロボットが「到達不可」を安全に報告できる

ドローンOS本体や自動操縦ではなく、到達可否APIとして使う。

報告できるもの:

```text
drone landing impossible
no-fly condition
unsafe area
weather temporary
terrain unreachable
water crossing
private access required
```

できること:

- 配送ルートが成立しない地点を機械的に報告
- 次回配送で別carrier、ロッカー、Field Handoffへ回す
- 到達不可レポートを住所品質改善に使う
- 高リスク地域では精密位置を出さずrestricted receiptだけ共有

### 5. 倉庫・WMS/TMSが配送先の条件を機械的に扱える

倉庫・配送センターでは、住所文字列よりも状態と制約が重要になる。

できること:

- 出荷前に配送不可・要確認・高リスクを分類
- P.O. Box不可、オートロック、冷蔵、危険物、重量物をルール化
- carrier label intentとAddressIntentを紐付ける
- ピッキング、梱包、配送handoff、監査receiptをつなぐ
- 最終住所を倉庫全体へ広げず、必要端末だけが扱う

### 6. 自治体・NGO・災害支援で支援対象判定ができる

人道支援では、住所を公開せずに地域・資格・未受領だけを確認したい。

できること:

- 支援対象地域内か確認
- 同一支援イベントで二重受領していないことを確認
- 避難所・仮設住宅・支援拠点をAGIDで扱う
- オフラインで受付し、後でused-stateを同期
- 高リスクモードでは住所履歴を残さない

## 通信相手の分類

| Actor | 目的 | 主に使うもの |
|---|---|---|
| EC / merchant | 配送可否、送料、label作成 | AddressIntent, Address Element |
| shopping-agent | 購入前の配送条件確認 | delivery eligibility, coarse region |
| POS terminal | scan, decision, handoff, report | AGID-S, waybill alias, recipient proof |
| carrier | 配送受付、追跡、POD | delivery scope, terminal receipt |
| warehouse | 出荷前検証、梱包、ロッカー割当 | AddressIntent, Locker assignment |
| locker/PUDO | 予約、開錠判断、受取証跡 | AOID credential, proof commitment |
| drone/robot | 到達可否報告 | reachability report |
| municipality | issuer、住所制度、補助コード承認 | issuer trust, postal zone governance |
| NGO | 支援資格、重複防止、配布 | aid eligibility, nullifier |
| auditor | 後から再照合 | redacted audit report |

## 通信レイヤー

### Layer 0: Local

同じ端末・同じ店舗・同じ倉庫内で完結する。

用途:

- POSスキャン
- QR/NFC受付
- ローカルAGID生成
- ロッカー simulator
- オフラインfield handoff

利点:

- 無料
- 速い
- ネット不要
- プライバシーが強い

### Layer 1: Server Registry

自前APIや自己ホストregistryで、失効・鮮度・使用済み状態を確認する。

用途:

- QR再利用防止
- issuer trust
- revocation
- webhook
- dashboard

### Layer 2: Federated Resolver

複数のresolver、carrier、issuer、自治体、NGOが、公開可能なcommitmentとendpointだけを交換する。

用途:

- 国・地域・carrierごとの問い合わせ先発見
- Address DNS
- route advertisement
- local-first fallback

### Layer 3: ZK / Public Ledger Optional

必要な場合だけZKやEthereum等を使う。

用途:

- 組織間で信頼がない
- 監査可能性が必要
- 住所を出さずに条件だけ証明したい
- 二重使用防止を公開検証したい

## メッセージ種別

機械同士のAGID/AOID通信では、以下のメッセージを標準化すると強い。

| Message | 内容 | 公開範囲 |
|---|---|---|
| AddressIntent | 住所操作の目的と状態 | public-safe |
| AddressLinkGrant | ユーザーが許可したscope | commitment |
| EligibilityQuery | 配送可否・地域所属の問い合わせ | coarse / proof |
| ResolutionResponse | accept/review/reject | public-safe |
| HandoffReceipt | POS/配送/受取完了証跡 | redacted |
| ReachabilityReport | 到達不可・要確認 | public-safe or restricted |
| LockerAssignment | ロッカー予約・区画割当 | commitment |
| RevocationCheck | credential/QR/aliasの失効確認 | commitment |
| UsedStateCheck | 使用済み・重複登録確認 | nullifier |
| WebhookEvent | 状態変化通知 | signed envelope |

## 最小プロトコル例

### 配送可能性の問い合わせ

```json
{
  "type": "delivery_eligibility_query",
  "version": "agid-m2m-v1",
  "audience": "carrier.example",
  "purpose": "delivery",
  "scope": ["delivery:eligible", "address:quality"],
  "addressReference": {
    "kind": "commitment",
    "value": "commitment-ref"
  },
  "constraints": {
    "poBoxAllowed": false,
    "autolockRequiresRecipientProof": true,
    "coldChainRequired": false,
    "highRiskMode": false
  },
  "freshness": {
    "issuedAt": "2026-06-20T00:00:00Z",
    "ttlSeconds": 900
  }
}
```

### 返答

```json
{
  "type": "delivery_eligibility_response",
  "version": "agid-m2m-v1",
  "decision": "review",
  "operatorState": "Address Review",
  "reasons": [
    "recipient-proof-required",
    "carrier-policy-po-box-blocked"
  ],
  "nextAction": "request_recipient_proof",
  "expiresAt": "2026-06-20T00:15:00Z",
  "receiptCommitment": "receipt-ref"
}
```

この例では、住所本文やAOID本文は送らない。

## 機械同士通信で重要な安全原則

### 1. AOIDを公開固定IDにしない

AOIDをそのまま各サービスに渡すと、店舗、配送、支援、本人確認、買い物Agentの行動が横断追跡される。

したがって、機械同士では次を使う。

```text
purpose-specific commitment
domain-separated nullifier
short-lived alias
audience-bound token
```

### 2. AGID-Sの復号はscopeで分離する

`delivery:read` は AGID-S envelope を扱えるだけであり、復号権限ではない。

復号には追加で必要:

```text
agid-s:decrypt
audience binding
device trust
freshness
revocation check
encrypted channel
no plaintext persistence
```

### 3. AddressIntentを中心にする

機械同士で「住所をください」と言わせない。

代わりに、

```text
配送したい
返送ラベルを作りたい
受取人を確認したい
支援対象か確認したい
ロッカーに割り当てたい
```

というIntentにする。

### 4. 返答は状態と次の行動にする

機械が欲しいのは文章ではなく、状態遷移である。

```text
accept
review
reject
challenge
expired
revoked
conflict
restricted
```

### 5. 監査はredacted receiptにする

後から検証できる必要はあるが、詳細住所やproof secretを保存してはいけない。

監査に残すもの:

```text
receipt id
commitment
nullifier
issuer status
device signature
timestamp
decision reason
policy version
```

## 実現できる新機能

### Address Negotiation

機械同士が「何をどこまで開示してよいか」を交渉する。

例:

```text
carrier: delivery:read が必要
holder: AGID-S envelopeなら許可
carrier: 高額配送なので recipient:verify も必要
holder: passkey proofを提示
```

### Delivery Capability Discovery

Address DNS / SRV / route advertisement を使って、ある地域の配送可能サービスを発見する。

例:

```text
AGID zone -> carrier endpoint
AGID zone -> locker endpoint
AGID zone -> revocation endpoint
AGID zone -> issuer trust endpoint
```

### Machine-Readable Delivery Policy

配送業者がルールを機械可読に公開する。

例:

```text
P.O. Box不可
オートロックはrecipient proof必須
高額商品はlive challenge必須
冷蔵品はcold locker必須
高リスク地域はAGID-Sのみ
```

### Autonomous Handoff

POS、配送端末、ロッカー、受取人端末が同じhandoff state machineを共有する。

```text
scan -> decision -> challenge -> handoff -> report
```

### Reachability Feedback Network

配送業者、ドローン、一般配送者、支援者が「到達できない」を報告し、次回の住所解決に使う。

公開してよいもの:

```text
粗い地域
問題種別
信頼度
TTL
review status
```

閉じるべきもの:

```text
精密地点
住人情報
詳細な侵入経路
防犯上危険なメモ
端末秘密情報
```

### Address SLA

機械同士で住所解決のサービス品質を表現できる。

例:

```text
resolver latency
freshness window
revocation check availability
carrier acceptance rate
handoff completion rate
offline sync conflict rate
```

## 代表ユースケース

### EC checkout

```text
Address Element
 -> AddressIntent(delivery)
 -> Address Resolver
 -> delivery eligible / review / reject
 -> Carrier Label Intent
```

### POS handoff

```text
POS scans QR/NFC
 -> Access/Auth checks scope
 -> revocation + used-state check
 -> recipient challenge
 -> signed handoff receipt
```

### Locker fallback

```text
Carrier cannot reach
 -> ReachabilityReport
 -> Locker assignment
 -> Recipient proof
 -> Locker access receipt
```

### Humanitarian aid

```text
Aid station
 -> region eligibility proof
 -> nullifier check
 -> offline receipt
 -> delayed sync
```

### Drone reachability

```text
Drone operator
 -> landing impossible report
 -> restricted receipt
 -> manual review or locker fallback
```

## リスク

| リスク | 対策 |
|---|---|
| AOIDの横断追跡 | 用途別commitment、domain separation |
| AGIDによる場所露出 | AGID-S、coarse region、short TTL |
| QRコピー再利用 | jti、used-state、live challenge |
| 住所総当たり | rate limit、abuse control、proof requirement |
| 端末偽装 | device trust、署名receipt、key rotation |
| issuer偽装 | trust registry、signature、transparency log |
| 高リスク地域漏洩 | restricted projection、no history、review-first |
| オフライン衝突 | CRDT/vector clock、conflict to review |

## 実装順

### Phase 1: Local M2M Contract

```text
AddressIntent
Access/Auth
Delivery eligibility query/response
Handoff receipt
No-plaintext persistence check
```

### Phase 2: Registry M2M

```text
revocation
freshness
used-state
issuer trust
webhook
```

### Phase 3: Discovery

```text
Address DNS SRV
carrier endpoint discovery
locker endpoint discovery
resolver health
cache policy
```

### Phase 4: Field / Locker / Drone

```text
Reachability API
Locker simulator
protocol-shaped MQTT/HTTP/Modbus frames
redacted Ops report
```

### Phase 5: Optional ZK / public audit

```text
delivery eligibility proof
residence proof
nullifier proof
public registry verification
```

## 最終評価

機械同士でAGID/AOID通信ができると、AGID/AOIDは次のような基盤になる。

```text
住所入力UI
配送可否API
受取人確認API
ロッカー/PUDO endpoint
到達不可フィードバック
買い物Agentの配送判断
倉庫/配送センターの出荷判断
災害支援の資格確認
監査可能なhandoff receipt
```

ただし、成功条件は明確である。

```text
AOIDを公開固定IDにしない
AGIDは必要に応じてAGID-Sや粗い地域へ落とす
目的・scope・audience・TTLを必須にする
機械同士の返答は住所本文ではなく状態と次の行動にする
監査はredacted receiptで行う
```

一文でまとめるなら、

```text
Machine-to-machine AGID/AOID communication lets software agents, POS terminals, carriers, lockers, drones, warehouses, and aid systems negotiate delivery, eligibility, authority, reachability, and audit states without turning addresses into a plaintext tracking layer.
```
