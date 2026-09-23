# 陸運・海運・空運に必要な機能研究

作成日: 2026-06-18

この資料は、AGID/AOID、POS、Operations、Address Label / Carrier Intent を、陸運・海運・空運の実運用に広げるための機能要件を整理する。結論として、3モードを1つの配送モデルに無理に押し込むのではなく、共通の `TransportIntent` と、陸運・海運・空運ごとの adapter / evidence / document profile に分けるのがよい。

## 1. 結論

AGID/AOID側で共通化すべき中核は次の6つである。

| 共通基盤 | 必要性 |
| --- | --- |
| TransportIntent | 陸・海・空をまたぐ配送意思決定オブジェクト。住所検証、輸送手段、証跡、例外、次アクションを統一する。 |
| Mode-specific Leg | トラック、船、航空機、鉄道、徒歩、ドローン、倉庫引渡しなどを leg として分割する。 |
| EPCIS-like Event Ledger | 出荷、積込、出港、到着、通関、引渡し、失効、再照合を `what / where / when / why / who` 型の可監査イベントにする。 |
| Address Privacy Boundary | raw address, raw AGID, raw AOID, recipient identity を operational dashboard に出さず commitment / alias / receipt reference にする。 |
| Document & Compliance Adapter | eCMR、B/L、AWB、税関、危険物、通関、送り状、領収書をモードごとの document profile で扱う。 |
| Reachability & Exception Report | 道路閉鎖、港湾hold、空港cut-off、天候、通関hold、配送不可、受取人不在を標準化する。 |

3モードごとの優先度は次の通り。

| モード | 最重要機能 | AGID/AOIDでの意味 |
| --- | --- | --- |
| 陸運 | eCMR的な電子運送状、車両/ドライバー、ルート、POD、再配達、PUDO/ロッカー | 最終到達点と受取人確認が中心。POS / QR / NFC / AGID-S と最も近い。 |
| 海運 | booking、B/L、container、vessel/voyage、port、terminal、customs hold、transshipment | 港・コンテナ・書類・通関が中心。既存の Ocean Control Tower を拡張する。 |
| 空運 | AWB/e-AWB、flight leg、airport、security screening、cut-off、dangerous goods、temperature chain | 速度・期限・危険物・航空保安が中心。IATA ONE Record / Cargo-XML互換の外部表現が重要。 |

## 2. 共通データモデル案

### 2.1 TransportIntent

`TransportIntent` は Stripe の Intent 型と同じく、配送処理を状態機械として管理する。

```text
TransportIntent
  id
  mode: land | sea | air | multimodal
  purpose: delivery | return | aid | customs | warehouse-transfer
  status:
    requires-address
    requires-mode-selection
    requires-carrier-acceptance
    requires-documents
    in-transit
    requires-handoff
    completed
    requires-review
    rejected
    expired
  address_ref
  agid_ref
  aoid_ref
  legs[]
  cargo_profile
  document_profile
  evidence[]
  exception_reports[]
  privacy_profile
  next_action
```

`address_ref`、`agid_ref`、`aoid_ref` は原則として commitment / alias / encrypted reference であり、生の住所や正確なAGIDを保存しない。

### 2.2 TransportLeg

```text
TransportLeg
  leg_id
  mode
  carrier_ref
  origin_place_ref
  destination_place_ref
  scheduled_departure
  scheduled_arrival
  actual_departure
  actual_arrival
  status
  compliance_flags
  handoff_required
```

陸運では origin/destination は住所・倉庫・PUDOでよい。海運では port / terminal / inland ramp が必要になる。空運では airport / cargo terminal / flight / ULD まで扱う。

### 2.3 TransportEvent

EPCISに近い可視化イベントとして、全モードで同じ形に寄せる。

```text
TransportEvent
  event_id
  event_type:
    accepted
    picked_up
    loaded
    departed
    arrived
    customs_submitted
    customs_released
    hold
    out_for_delivery
    recipient_verified
    delivered
    returned
    revoked
  object_ref
  location_ref
  actor_ref
  timestamp
  source
  signature_ref
  public_projection
```

`actor_ref` は配送員、港湾事業者、航空貨物代理店、POS端末などを表す。ただし個人名を直接出さず、端末署名・組織署名・role aliasで扱う。

## 3. 陸運に必要な機能

陸運はAGID/AOIDの中心ユースケースである。住所不備、建物入口、部屋番号、受取人確認、再配達、PUDO、ロッカー、現地POSが直接効く。

### 必須機能

| 機能 | 内容 | 実装先 |
| --- | --- | --- |
| 電子運送状 / eCMR profile | sender, carrier, consignee, goods, pickup, delivery, signature を電子化する。ただし個人情報はcommitment化。 | `TransportIntent.document_profile.land` |
| Driver / vehicle trust | ドライバー資格、車両、端末ID、端末署名、勤務時間、スキルを管理。 | `deliveryOperationsIntelligence` / `Operations` |
| Route optimization | 時間枠、交通、車両容量、危険物、冷蔵、PUDO、ロッカーを考慮。 | `Operations` |
| POS handoff | 店舗、倉庫、配送員、受取人のスキャンを状態機械化。 | `CarrierLabelIntent` / POS |
| Recipient proof | Passkey、AOID credential、NFC、ワンタイムコード、署名チャレンジ。 | `Address Identity` |
| Offline sync | 災害現場・倉庫・店舗でネットなしでも使用済み台帳と後同期。 | CRDT / local ledger |
| Delivery reachability report | 通行止め、入口不明、ゲート閉鎖、治安リスク、配送不可を報告。 | `deliveryReachabilityReport` |

### 強化すべき画面

- 配送受付画面: Address OK / Carrier Scan OK / Recipient Pending / Handoff Complete を大きく出す。
- ドライバー端末画面: 次停止、AGID-S復号、粗い位置、チャレンジ署名、失敗理由報告。
- 管理画面: 未完了、再配達、衝突nullifier、端末不信頼、ルート遅延。
- 監査画面: 送り状ID、端末署名、recipient proof、失効/鮮度、判定理由。

### 陸運で注意すること

陸運は最も個人住所に近い。したがって、ログには raw address, raw AGID, recipient name, phone を保存しない。地図表示も高リスク用途では粗いAGIDまたはAGID-Sだけにする。

## 4. 海運に必要な機能

海運は住所よりも、港、コンテナ、船、航海、書類、通関、terminal hold が中心である。既存の `coscoInspiredOceanControlTower` は良い出発点だが、国際標準との接続を強化する必要がある。

### 必須機能

| 機能 | 内容 | 実装先 |
| --- | --- | --- |
| Booking profile | booking request、carrier acceptance、space confirmation。 | Ocean Control Tower |
| Bill of Lading profile | B/L番号、shipper、consignee、notify party、goods。ただし公開面はcommitment。 | Document profile |
| Container validation | ISO 6346形式・check digit、container commitment、seal commitment。 | 既存 `validateIso6346ContainerNumber` の拡張 |
| Vessel / voyage | vessel alias、voyage、ETD/ETA、transshipment legs。 | Ocean Control Tower |
| Port / terminal model | UN/LOCODE、terminal code、gate、CY/CFS、free time。 | Place Record |
| Maritime Single Window mapping | IMO FAL / IMO Compendiumに寄せ、行政手続きデータを分離。 | Compliance adapter |
| Customs / port hold | customs hold、port hold、terminal hold、document rejected を例外化。 | Exception report |
| Final-mile handoff | 港到着後に陸運の CarrierIntent へ渡す。 | Multimodal handoff |

### 海運で必要な状態

```text
requires-schedule
  -> requires-booking
  -> docs-required
  -> waiting-departure
  -> in-transit
  -> discharged
  -> pickup-ready
  -> final-mile-required
  -> completed
```

例外状態:

- `customs-hold`
- `port-hold`
- `terminal-hold`
- `document-rejected`
- `rollover`
- `transshipment-delayed`

### 海運で公開してよいもの / 秘匿すべきもの

| 公開してよい | 秘匿・commitment化 |
| --- | --- |
| coarse port、status、ETD/ETA window、document count、hold type | raw B/L、raw booking、raw container、seal number、precise AGID、荷主個人情報 |

海運はB2B寄りなので公開してよい情報が多く見えがちだが、B/Lやcontainer番号は追跡・商流推定につながる。公開面ではcommitmentを基本にする。

## 5. 空運に必要な機能

空運は、速さ、航空保安、危険物、cut-off、温度管理、AWB/e-AWBが重要である。住所解決よりも、航空貨物の文書と時刻制約が失敗原因になりやすい。

### 必須機能

| 機能 | 内容 | 実装先 |
| --- | --- | --- |
| AWB / e-AWB profile | MAWB/HAWB、shipper、consignee、agent、goods、charges。ただし公開面はcommitment。 | `document_profile.air` |
| IATA ONE Record mapping | shipment / pieces / logistics events を外部表現へ変換できるようにする。 | Air adapter |
| Flight leg model | origin airport、destination airport、flight number alias、cut-off、departure/arrival。 | `TransportLeg.air` |
| Security screening | known shipper、screened status、regulated agent、保安hold。 | Compliance adapter |
| Dangerous goods | lithium battery、hazmat、restricted commodity、梱包指示、申告状態。 | Cargo profile |
| Temperature / pharma | cold chain、temperature excursion、sensor commitment。 | Event ledger |
| ULD / cargo terminal | ULD reference、warehouse terminal、breakdown、pickup readiness。 | Air operations |
| Fast exception routing | cut-off missed、flight delayed、security hold、DG rejected を即時表示。 | Exception report |

### 空運で必要な状態

```text
requires-awb
  -> requires-screening
  -> requires-dg-check
  -> accepted-by-airline
  -> tendered
  -> loaded
  -> departed
  -> arrived
  -> customs-release
  -> pickup-ready
  -> final-mile-required
  -> completed
```

例外状態:

- `cutoff-missed`
- `security-hold`
- `dg-rejected`
- `temperature-excursion`
- `flight-disrupted`
- `customs-hold`

### 空運で注意すること

空運は住所表示よりも「運べる貨物か」「期限に間に合うか」「航空保安と危険物条件を満たすか」が重要になる。AGID/AOIDは最終配送先や受取人proofに使い、航空区間ではAWB・航空イベント・保安/危険物チェックを主役にする。

## 6. 複合輸送で必要な設計

実務では、陸運だけ、海運だけ、空運だけで終わらない。多くは次のような複合輸送になる。

```text
warehouse
  -> truck
  -> port / airport
  -> vessel / aircraft
  -> port / airport
  -> customs
  -> truck / rail
  -> POS / locker / recipient
```

したがって、AGIDでは `TransportIntent` の下に複数 `TransportLeg` を持たせる。

```text
TransportIntent(multimodal)
  leg[0] land: warehouse -> port
  leg[1] sea: port -> port
  leg[2] land: port -> recipient
```

各legは別のcarrier、別のdocument、別のcomplianceを持つ。handoff時には、前legの完了receiptと次legのacceptance receiptをつなぐ。

## 7. POS / Operations 画面に追加すべきもの

### 共通画面

| 画面 | 目的 |
| --- | --- |
| Transport Intent一覧 | 全モードの配送状態を一覧化。requires-review / hold / delayed を優先表示。 |
| Leg detail | 陸・海・空ごとのleg、予定/実績、carrier、document、eventを表示。 |
| Document console | eCMR、B/L、AWB、税関、危険物、送り状の不足・却下・署名状態を確認。 |
| Exception console | 道路閉鎖、港湾hold、航空保安hold、通関hold、配送不可を集約。 |
| Handoff console | leg間の引渡し、POS受付、受取人proof、端末署名を確認。 |
| Audit report | completion後にイベント、署名、失効、鮮度、判定理由を再照合。 |

### モード別画面

| モード | 追加画面 |
| --- | --- |
| 陸運 | driver dispatch、vehicle capacity、route map、PUDO/locker、recipient proof、offline queue |
| 海運 | ocean control tower、container list、port/terminal hold、smart documents、final-mile creation |
| 空運 | AWB console、flight cut-off、security/DG check、ULD/temperature、arrival breakdown |

## 8. API / Adapter 境界

外部carrier APIは直接中核モデルに混ぜない。adapterが外部payloadを受け取り、AGID内では安全な `TransportEvidence` に変換する。

```text
Carrier API payload
  -> adapter validation
  -> redaction
  -> commitment/reference/signature
  -> TransportEvidence
```

AGID本体に保存するもの:

- status
- next_action
- commitment
- signed receipt reference
- document count
- validation result
- exception code
- event hash

保存しないもの:

- carrier API key
- raw label payload
- raw AWB / B/L / booking / container when sensitive
- full recipient address
- phone
- recipient secret

## 9. Address Radar / Risk Rules

輸送モードごとに不正検知ルールを変える。

| ルール | 陸運 | 海運 | 空運 |
| --- | --- | --- | --- |
| nullifier reused | block | review | review |
| untrusted device | require recipient proof | review terminal event | reject tender / review |
| address partial | review if high value | acceptable until final-mile | review before last-mile |
| document missing | review | block booking/doc phase | block AWB/tender |
| customs hold | cross-border review | customs-hold | customs-hold |
| dangerous goods mismatch | review | review | block/reject |
| short TTL QR expired | reject | usually not QR-based | reject recipient handoff |

## 10. 優先ロードマップ

### Phase 1: 共通TransportIntent

- `TransportIntent`
- `TransportLeg`
- `TransportEvent`
- `TransportEvidence`
- `TransportException`
- privacy boundary
- document profile type

既存の `CarrierLabelIntent` と競合させず、上位の複合輸送オーケストレーターとして置く。

### Phase 2: 陸運MVP

- eCMR-like profile
- driver / vehicle / route / recipient proof
- POS handoff
- offline sync
- delivery reachability report

AGID/AOIDの価値が一番早く出る。

### Phase 3: 海運拡張

- 既存 Ocean Control Tower を `TransportLeg.sea` に接続
- UN/LOCODE port model
- booking / B/L / container / terminal hold / customs hold
- final-mile CarrierIntent生成

### Phase 4: 空運拡張

- AWB/e-AWB profile
- IATA ONE Record互換マッピング
- flight leg / cut-off / security / DG / temperature
- final-mile handoff

### Phase 5: Multimodal Control Tower

- 陸海空のleg chain
- handoff receipt chain
- customs/tax/compliance data layer
- audit report
- Address Radar mode-specific policy

## 11. 既存実装との接続

| 既存資産 | 接続方針 |
| --- | --- |
| `src/lib/carrierLabelIntent.ts` | 陸運・最終配送・POS受付の下位intentとして使う。 |
| `src/lib/operations.ts` | 倉庫、ピッキング、TMS、車両割当の中核にする。 |
| `src/lib/deliveryOperationsIntelligence.ts` | ドライバー、ルート、KPI、労務、スキル管理を担当。 |
| `src/lib/coscoInspiredOceanControlTower.ts` | 海運legの専用control towerとして拡張。 |
| `src/lib/deliveryReachabilityReport.ts` | 陸海空の配送不可・到達不可・hold報告に拡張。 |
| `src/lib/addressRadar.ts` / `addressSignal.ts` | モード別リスクルールに拡張。 |
| `src/lib/addressAccessAuth.ts` | carrier, driver, port, warehouse, airport, POS権限に拡張。 |
| `src/lib/ciscoInspiredNetworkAssurance.ts` | POS/倉庫/端末/edge resolverの通信健全性に使う。 |

## 12. 実装反映

この研究の必須機能は `src/lib/transportModeRequirements.ts` にコード化した。POS、Operations、CarrierIntent、Ocean Control Tower、将来のAir Cargo adapterは、このプロファイルを参照して「どの証跡・書類・状態が足りないか」を判断できる。

最小実装単位:

- 陸運: `ecmr-consignment-note`, `driver-vehicle-trust`, `proof-of-delivery`, `pos-handoff`, `recipient-proof`, `offline-sync`
- 海運: `booking`, `bill-of-lading`, `container`, `vessel-voyage`, `port-terminal`, `terminal-hold`, `customs`, `final-mile-handoff`
- 空運: `awb-eawb`, `flight-leg`, `cutoff`, `aviation-security`, `dangerous-goods`, `temperature-control`, `iata-one-record-compatibility`

## 13. 標準・データソースとの対応

この研究では、無料または公開仕様として参照可能な標準・公式資料を優先する。

| 領域 | 参照先 | AGIDでの使い方 |
| --- | --- | --- |
| Traceability event | GS1 EPCIS | `TransportEvent` の設計参考。 |
| Maritime Single Window | IMO Maritime Single Window / IMO Compendium | 海運の行政・通関・port callデータ項目の参考。 |
| Air cargo data | IATA e-freight / e-AWB / Cargo-XML / ONE Record | 空運document profileとevent mappingの参考。 |
| Cross-border customs | WCO Data Model | 税関・Single Window・通関データの共通語彙。 |
| Road consignment | UN e-CMR | 陸運電子運送状profileの参考。 |
| Ports | UN/LOCODE | 港・空港・物流地点のコード体系。 |
| Postal items | UPU S10 | 郵便/小包識別子の参考。 |

## 14. 最終判断

陸運・海運・空運をAGID/AOIDに入れる価値は高い。ただし、AGIDを「全部の物流番号」にしない方がよい。AGID/AOIDは住所・到達点・受取人proof・秘匿共有の層として扱い、B/L、AWB、container、eCMR、税関、危険物、route、PODは `TransportIntent` の周辺証跡として接続するのが安全で拡張性が高い。

一文でまとめるなら、AGID/AOIDの輸送拡張は「住所ID」ではなく、陸海空の配送イベント、書類、例外、到達証明を安全に接続する privacy-preserving transport control layer として設計するべきである。

## 参考リンク

- GS1 EPCIS: https://www.gs1.org/standards/epcis
- IMO Maritime Single Window: https://www.imo.org/en/ourwork/facilitation/pages/maritimesinglewindow-default.aspx
- IMO Compendium: https://www.imo.org/en/ourwork/facilitation/pages/imocompendium.aspx
- IATA e-freight / e-AWB: https://www.iata.org/en/programs/cargo/e/efreight/
- IATA ONE Record: https://www.iata.org/en/programs/cargo/e/one-record/
- IATA ONE Record API specification: https://iata-cargo.github.io/ONE-Record/2025-07/
- WCO Data Model: https://www.wcoomd.org/DataModel
- UN e-CMR treaty status: https://treaties.un.org/pages/ViewDetails.aspx?chapter=11&clang=_en&mtdsg_no=XI-B-11-b&src=TREATY
- UN/LOCODE: https://unece.org/trade/cefact/unlocode-code-list-country-and-territory
- UPU Standards: https://www.upu.int/en/postal-solutions/programmes-services/standards
- IATA lithium batteries guidance page: https://www.iata.org/en/programs/cargo/dgr/lithium-batteries/
