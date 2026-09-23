# 暗号通貨事業者向け AGID/AOID 開発参加ガイド

Last updated: 2026-06-18

この文書は、暗号通貨取引所、ウォレット事業者、カストディ事業者、決済事業者、ZK proof 事業者、relayer / node operator、監査会社、POS / 配送連携事業者が AGID/AOID の開発に参加できるようにするための開発ガイドである。

対応する実装台帳:

```text
src/lib/cryptoBusinessDevelopment.ts
src/lib/cryptoBusinessDevelopment.test.ts
docs/web3-zk-sdk-usage-plan.md
docs/pos-ethereum-payment-gate.md
```

## 位置付け

AGID/AOID は暗号資産発行プロジェクトではなく、住所・配送・証明・監査のためのプライバシー保護型インフラである。
暗号通貨事業者が参加する領域は、主に次の補助レイヤーである。

- registry read / write
- issuer、revocation、freshness、nullifier の検証
- Ethereum / L2 payment gate
- wallet operator UI
- ZK proof workflow
- external SDK / ABI examples
- relayer / batch anchoring
- security audit

通常の住所表示、AGID生成、AGID-S復号、POSローカル受付は、Ethereum、ZK、ウォレットなしでも動く必要がある。
したがって、開発の基本姿勢は `Mode 0 Local Only` と `Mode 1 Server Registry` を壊さず、必要な場面だけ Mode 3 / Mode 4 を足すことである。

## 開発参加トラック

| Track | 向いている事業者 | OSSで扱う範囲 | 商用/運用に回せる範囲 | Risk |
| --- | --- | --- | --- | --- |
| Registry read adapter | 取引所、ウォレット、カストディ、配送/POS | read-only viem例、ABI、receipt parsing、commitment-only schema | hosted監視、SLA、enterprise alert | Low |
| Registry write adapter | relayer、カストディ、監査 | tx plan schema、server-side viem、receipt確認、no-raw event test | managed relayer、承認workflow、multi-tenant key管理 | High |
| POS payment escrow gate | 決済、stablecoin、取引所、配送/POS | prepaid / COD receipt、payment commitment、任意Ethereum settlement | merchant reconciliation、dispute、treasury operations | Medium |
| Operator wallet UI | ウォレット、取引所、カストディ | wagmi config、chain labels、署名前purpose preview | enterprise wallet policy、multi-approver、environment segregation | Medium |
| ZK proof workflow | ZK事業者、監査、relayer | baseline circuits、proof input schema、public signal tests | managed prover、proof queue、prover infrastructure | High |
| External SDK | 全事業者 | ABI fixture、web3.py/Web3j/Nethereum/Alloy例、test vectors | certified connector、partner onboarding | Low |
| Relayer worker | relayer、カストディ、監査 | batch root anchoring、allowlisted tx plan、receipt monitor | HSM/KMS signing、fleet monitoring、incident response | High |
| Security audit | 監査、取引所、カストディ、ZK事業者 | threat model、privacy tests、contract/ZK review | formal audit、private deployment review | Medium |
| Documentation / Conformance | 全事業者 | onboarding、mode選択、privacy checklist、conformance index | partner certification、training | Low |

## 公開チェーンに載せてよいもの

原則として、チェーンや公開registryへ載せるのは private field の commitment と status だけである。

載せてよい例:

- issuer identifier / issuer status
- credential commitment
- revocation root
- freshness root
- nullifier hash
- payment commitment
- public payment status
- verifier metadata
- scope / purpose
- audit receipt hash

## 載せてはいけないもの

次のデータは、public chain、public registry、public webhook、public QR、public log に載せない。

- 実住所
- raw AGID。ただし公開用途で明示許可された通常地図/ローカル用途を除く
- raw AOID
- AGID-S ciphertext
- AGID-S復号payload
- 氏名、電話番号、メールアドレス
- 部屋番号、階、建物内アクセス情報、配送メモ
- proof code、recipient secret、passkey secret
- ZK witness、witness log
- 詳細な配送履歴

## 参加前チェックリスト

1. 最小modeを選ぶ

   最初から Ethereum / ZK / wallet を必須にしない。
   Mode 0 / Mode 1 で足りるならそれを使う。

2. public/private separation を通す

   registry、event、webhook、QR、chain export の前に `separatePublicPrivatePayload` を通す。

3. no raw on-chain をテストする

   contract event、tx plan、receipt、webhookに raw address / raw AOID / AGID-S が混ざらないことをテストする。

4. wallet署名のpurpose previewを出す

   署名前に network、contract、method、public fields、purpose を見せる。
   raw住所やAOIDを署名させない。

5. 法務・業務義務はprotocol codeへ埋め込まない

   規制対応や業務許可の確認は導入組織の責任としてdeployment noteに分ける。
   コードが自動的に法規制準拠を保証するとは書かない。

6. SDKはcanonical ABI / OpenAPI / test vectorから生成する

   言語ごとに手書きで仕様がズレるのを避ける。

7. high-risk pathはsecurity review必須

   write adapter、relayer、escrow、custody、ZK proof、managed prover は本番前に脅威モデルと監査を必要とする。

## 最初に取り組みやすいPR

暗号通貨事業者が最初に出すPRは、いきなり本番決済やcustodyに入らない方がよい。
安全で価値がある順番は次の通り。

1. read-only registry adapter example

   issuer / revocation / nullifier / payment status を読むだけの例を追加する。
   private payload がないので始めやすい。

2. wallet transaction purpose preview

   wallet署名前に何を送るかを見せるUIまたはmodelを追加する。

3. POS payment gate conformance

   prepaid と collect-on-delivery のreceiptとテストを追加する。
   payment commitmentだけを扱う。

4. ZK public-signal leakage test

   circuitを増やす前に、public signal にprivate fieldが混ざらないテストを追加する。

5. external SDK example

   ABIから `web3.py`、`Web3j`、`Nethereum`、`Alloy` のどれか1つのread-only exampleを作る。

## OSSと商用の境界

OSSにする:

- registry ABI
- read-only / write tx plan schema
- no-raw-address tests
- POS payment gate model
- wallet privacy rules
- ZK public input / witness boundary
- SDK examples
- threat model
- conformance tests

商用にしてよい:

- hosted registry operations
- managed relayer
- managed ZK prover
- merchant reconciliation
- enterprise dashboard
- SLA monitoring
- multi-tenant API key management
- private deployment security review
- enterprise support

重要なのは、商用機能がなくてもAGID/AOIDの標準検証とローカル運用が成立することである。
商用機能は「運用を任せたい事業者向けの便利な層」であり、標準利用の必須条件ではない。

## 開発時に通すべきテスト

基本:

```powershell
npm run lint
npx tsx --test src/lib/cryptoBusinessDevelopment.test.ts src/lib/web3ZkSdkPlan.test.ts src/lib/agidWalletConfig.test.ts src/lib/publicPrivateSeparation.test.ts
```

POS payment gate:

```powershell
npx tsx --test src/lib/posEthereumPayment.test.ts src/lib/posAcceptance.test.ts src/lib/carrierLabelIntent.test.ts
```

ZK:

```powershell
npm run verify:zk:circuit
npx tsx --test src/lib/zkProofRuntime.test.ts src/lib/zkProofCompatibility.test.ts scripts/verify-zk-circuit-fixture.test.ts
```

Web3 stack:

```powershell
npm run verify:web3-zk-stack
```

## まとめ

暗号通貨事業者がAGID/AOIDに貢献する最善の形は、住所をチェーンへ載せることではない。
commitment、nullifier、revocation、freshness、payment、proof verification を扱い、実住所・AOID・AGID-S・受取人情報は出さないことである。

AGID/AOIDの価値は、暗号通貨を前面に出すことではなく、必要なときだけ検証・支払い・監査・ZKを接続できる住所インフラとして成立する点にある。
