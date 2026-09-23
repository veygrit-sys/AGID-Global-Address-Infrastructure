# Smart Locker OS Research

Last updated: 2026-06-20

## 結論

AGID/AOIDにおけるスマートロッカーOSは、現時点では「実機を直接制御する組込みOS」として作るべきではない。

最も安全で強い定義は次である。

```text
Smart Locker OS
= redacted locker endpoint orchestration layer
+ reservation / access / health / simulator / audit receipt
```

つまり、AGIDのスマートロッカーOSは、ロッカーを住所可能な配送エンドポイントとして扱うための運用OSである。LinuxやRTOSのようにハードウェアを起動する層ではなく、POS、Field Handoff、Dashboard、Review Console、Address Portalと接続する業務・証跡・プライバシー層である。

既存コードはこの方向にかなり合っている。

```text
src/lib/lockerSystemOs.ts
src/lib/warehouseLockerLocalSimulator.ts
src/components/DroneLockerOpsScreen.tsx
```

すでに強い点は、raw address、raw AGID/AOID、raw waybill、PIN、QR/NFC payload、biometric template、hardware secretを保存しない境界である。これはスマートロッカー領域では非常に重要で、OSS公開にも向いている。

ただし、本番の「ロッカーOS」と名乗るにはまだ足りない。特に、物理アクセス制御、端末ライフサイクル、ファームウェア更新、デバイス証明、実機adapter適合試験、現場安全認証が未成熟である。

## 参考標準・OSS

| 領域 | 参考 | AGIDでの扱い |
|---|---|---|
| IoT messaging | [MQTT](https://mqtt.org/) | ロッカーセンサー、ACK、低帯域通信。既存 simulator が対応済み。 |
| Local/REST gateway | HTTP callbacks | ゲートウェイやPOSとの簡易連携。署名・replay対策が必須。 |
| Industrial gateway | [libmodbus / Modbus](https://libmodbus.org/) | 扉、リレー、温度、電源、legacy controller。既存 simulator がModbus風frameに対応済み。 |
| Access control | [SIA OSDP](https://www.securityindustry.org/industry-standards/open-supervised-device-protocol/) | NFC/カードリーダー、secured pickup room、扉制御の候補。自作暗号化reader protocolは避ける。 |
| Device lifecycle | [OMA Lightweight M2M](https://www.openmobilealliance.org/release/LightweightM2M/) | provisioning、firmware update、diagnostics、decommissionの参考。 |
| Geospatial IoT | [OGC SensorThings API](https://docs.ogc.org/is/18-088/18-088.html) | ロッカーの位置、温度、扉、電池、故障観測を標準化。ただし受取人情報は出さない。 |
| Digital twin | [Eclipse Ditto](https://projects.eclipse.org/projects/iot.ditto) | desired/reported/live state、device-as-a-service、権限付きdevice APIの参考。 |
| OSS IoT platform | [OpenRemote](https://openremote.io/) | 管理画面、asset、rules、map、multi-protocol運用の参考。AGID中核依存にはしない。 |

## AGIDで作るべきOSの境界

### 作るもの

```text
locker site identity
AGID-linked locker endpoint
compartment reservation
recipient proof commitment
carrier proof commitment
door/sensor/battery/temperature health
MQTT/HTTP/Modbus-shaped local frames
offline queue
redacted audit receipt
review case handoff
operator maintenance workflow
```

### 作らないもの

```text
embedded boot OS
autopilot / robot control
raw hardware register UI
raw card/NFC/PIN storage
biometric template storage
public precise recipient address
public precise locker usage history
vendor-certified safety controller claim
```

ここを曖昧にすると危険である。AGIDは「ロッカーを開けるOS」ではなく、「ロッカー受け渡しが正当か、監査できるか、住所を漏らしていないか」を扱う層にする。

## 推奨アーキテクチャ

```mermaid
flowchart LR
  POS["POS / Field Handoff"] --> Contract["Redacted Locker OS Contract"]
  Contract --> Twin["Device Twin: desired / reported / live"]
  Twin --> Sim["Local MQTT / HTTP / Modbus Simulator"]
  Sim --> Adapter["Certified Protocol Adapters"]
  Adapter --> Device["Locker Controller / Reader / Sensors"]
  Device --> Receipt["Signed Redacted Receipt"]
  Receipt --> Review["Dashboard / Review Console"]
  Contract -. "no raw address" .-> Privacy["Privacy Boundary"]
```

### Layer 1: Redacted Locker OS Contract

既存の `lockerSystemOs.ts` が担当する層。

役割:

```text
site
connector
compartment
reservation
access attempt
health
hardware command envelope
notification
audit hash
```

ここでは実機packetを作らない。必ず安全なcommand envelopeにする。

### Layer 2: Device Twin

本番化するなら追加が必要。

少なくとも次の3状態を分ける。

```text
desired state:
  open requested
  reserve requested
  disable requested

reported state:
  door closed
  sensor healthy
  battery low
  temperature reading

live session:
  operator is scanning
  recipient proof pending
  command awaiting ACK
```

重要なのは、desired stateとphysical stateを混同しないこと。`open` commandを送っただけでは「開いた」と言ってはいけない。センサーACKまたは署名receiptが必要である。

### Layer 3: Local Simulator

既存の `warehouseLockerLocalSimulator.ts` が担当する層。

これは良い設計である。理由は、実機・broker・秘密鍵・Modbus portなしで、次を再現できるからである。

```text
door jam
low ACK rate
stale heartbeat
offline queue
duplicate event
Modbus delayed ack
HTTP callback
MQTT sensor publish
```

実機adapterを作る前に、この simulator parity test を通すべきである。

### Layer 4: Certified Protocol Adapters

実機連携は最後でよい。

推奨順:

```text
1. HTTP mock adapter
2. MQTT broker adapter
3. Modbus gateway adapter
4. OSDP-style access reader adapter
5. vendor-certified adapter
```

この層では、raw addressやraw proofを絶対に扱わない。扱うのは次だけにする。

```text
payloadCommitment
commandId
deviceId
connectorId
signedCallback
receiptHash
auditHash
```

## 主要な研究判断

### 1. MQTTは採用価値が高い

MQTTは軽量なpublish/subscribeで、遠隔・低帯域・不安定ネットワークに向く。AGIDでは、ロッカーセンサー、heartbeat、command ACK、offline recoveryに使いやすい。

ただし、topic名やpayloadに住所・waybill・AOIDを入れてはいけない。

推奨topic:

```text
locker/{siteAlias}/device/{deviceAlias}/event
locker/{siteAlias}/device/{deviceAlias}/ack
locker/{siteAlias}/device/{deviceAlias}/health
```

禁止topic:

```text
locker/{rawAddress}/...
locker/{agid}/...
locker/{recipientName}/...
locker/{waybillNumber}/...
```

### 2. Modbusは直接UIから叩かない

Modbusは現場機器との接続に便利だが、raw register writeをUIや外部APIに出すと危険である。

AGIDでは、

```text
open compartment
lock compartment
read door sensor
read temperature
disable compartment
```

のような抽象commandを作り、adapterが安全なregister操作へ変換する。

### 3. OSDPは研究すべきだが、自作しない

SIA OSDPはアクセス制御機器の相互運用標準であり、NFC/カードリーダーやsecured roomとの接続候補になる。

ただし、AGIDがreader protocolを自作するのは危険である。採用するなら、OSDP準拠製品・テストツール・認証済みadapter境界として扱う。

### 4. LwM2M的な端末ライフサイクルが必要

本番ロッカーfleetでは、以下がないと運用できない。

```text
device provisioning
device decommission
firmware version
firmware update window
diagnostic report
connectivity health
configuration drift
key rotation
lost/stolen device status
```

今のAGIDはhealth snapshotは強いが、lifecycleは未成熟である。

### 5. SensorThingsは公開観測データに向く

温度、電池、扉状態、故障、サイト位置などの公開可能な機器観測にはOGC SensorThingsが合う。

ただし、SensorThings exportに受取人・住所・raw AGID/AOID・waybillを混ぜてはいけない。

## 必要な状態機械

### Reservation State

```text
draft
reserved
occupied
recipient-proof-pending
release-ready
released
expired
failed
review-required
```

### Compartment State

```text
available
reserved
occupied
disabled
maintenance
jammed
expired-hold
quarantined
```

### Command State

```text
created
queued-offline
sent
acknowledged
sensor-confirmed
failed
manual-required
cancelled
```

### Device Lifecycle State

```text
factory
provisioned
active
maintenance
compromised
retired
decommissioned
```

## 最低限の画面

### 1. Locker Fleet

端末一覧。

表示:

```text
site alias
device alias
protocol
online/offline
firmware ref
config version
last heartbeat
ack rate
battery/power
maintenance state
```

### 2. Compartment Board

区画状態。

表示:

```text
available / reserved / occupied / jammed
temperature
door sensor
reservation commitment
expiration
high-risk flag
```

### 3. Access Session

受取人・配送員・operatorの受け渡し。

主ボタン:

```text
Scan proof
Require stronger proof
Open with proof
Reject
Manual review
Emergency disable
```

### 4. Maintenance Console

保守。

主ボタン:

```text
Disable compartment
Mark jammed
Run sensor check
Queue technician
Rotate connector key
Export redacted maintenance report
```

### 5. Simulator Lab

ローカル試験。

主ボタン:

```text
Run normal flow
Inject offline gateway
Inject door jam
Inject stale heartbeat
Inject duplicate ACK
Inject low battery
Export frames
```

## セキュリティ・プライバシー必須条件

```text
No raw address by default
No raw AGID/AOID in public logs
No raw waybill body
No raw QR/NFC/PIN payload
No biometric template storage
No hardware endpoint secret in app state
Short TTL for high-risk reservation
Device signature for access receipt
Operator override requires scoped reason
Offline duplicate becomes review
Public telemetry is coarse and redacted
```

## 研究上の不足

| 不足 | 重要度 | 理由 |
|---|---:|---|
| Device twin contract | 高 | desired/reported/liveが混ざると誤開錠や誤報告が起きる。 |
| OSDP reader adapter study | 高 | NFC/カード/secured room連携に必要。 |
| LwM2M-style lifecycle | 高 | firmware updateやdecommissionなしにfleet運用できない。 |
| SensorThings export | 中 | 自治体/施設/研究向けのIoT観測互換に有効。 |
| Hardware conformance suite | 高 | 実機adapterごとの安全性を比較できない。 |
| Safety disclaimer | 高 | 現時点で安全認証済みOSと誤解されると危険。 |

## 実装ロードマップ

### Phase 0: Local simulator and redacted OS contract

既存実装を強化する段階。

```text
MQTT/HTTP/Modbus-shaped frames
reservation planning
committed access proofs
health snapshot
redacted receipts
```

### Phase 1: Device twin and lifecycle model

追加すべき中核。

```text
desired/reported/live state
device identity
firmware ref
configuration version
provision/deprovision states
key rotation status
```

### Phase 2: Certified adapters

実機に近づける段階。

```text
MQTT broker adapter
local HTTP gateway adapter
Modbus gateway adapter
OSDP reader study adapter
```

### Phase 3: Field pilot

現場検証。

```text
carrier/PUDO pilot
humanitarian site pilot
offline sync drill
jammed door drill
recipient proof failure drill
review console escalation
```

## 最終評価

現時点の評価は次の通り。

```text
Smart locker concept: strong
Privacy boundary: strong
Local simulator: good
Real hardware readiness: not yet
Fleet lifecycle: weak
Access reader standardization: weak
Research maturity: medium-high
Production OS claim: not allowed yet
```

したがって、次にやるべきことは「実機OSを作る」ではなく、

```text
1. Device twin contract
2. Device lifecycle model
3. Certified adapter boundary
4. No-raw-address hardware conformance tests
5. Operator maintenance UX
```

である。

この順番なら、AGID/AOIDの思想である privacy-first、local-first、optional registry、redacted audit を守ったまま、スマートロッカー運用へ進められる。
