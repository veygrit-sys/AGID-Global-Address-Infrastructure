# ethereum.org掲載水準までAGIDを引き上げる作戦

## 目的

AGIDをethereum.orgに「Ethereum開発者向けの有用なオープンソースツール」として余裕を持って提案できる状態まで引き上げる。

ethereum.orgは第三者プロジェクトを公式に「採択」するというより、条件を満たすdeveloper tool、product、content resourceをGitHub issue/PR経由で掲載・紹介する運用に近い。そのため、最初の到達目標は「developer tool listingに耐えるOSS品質」に置く。

## 公式基準から見た合格ライン

developer toolとして見られる観点:

- 既存ツールとの差別化が明確である。
- ドキュメントが存在し、実際に使える十分な内容で、最近更新されている。
- GitHub stars、download、既知プロジェクトでの利用など、利用実績がある。
- recurring bugsが少なく、信頼でき、active maintainedである。
- open sourceで、コード確認とcommunity contributionが可能である。

dapp/productとして見られる観点:

- security-testedである。
- liveから6か月以上経過している。
- active teamがある。
- 掲載情報が正直で正確である。
- wallet互換、実際に試せる体験、onboarding、non-custodial、global access、open source、communityがある。

AGIDは現時点では、dappよりもdeveloper tool / infrastructure / identity & address proof toolkitとして出す方が通しやすい。

## AGIDの勝ち筋

AGIDを「住所アプリ」として出すとEthereum文脈が弱く見える。次のように切る。

```text
AGID: Privacy-preserving physical address identity and delivery proof toolkit for Ethereum applications
```

強調する価値:

- raw addressをオンチェーンに出さない。
- 住所、配送、POS、ホテル、DB連携をcommitment / proof / redacted payloadで扱う。
- ZK address predicate、revocation freshness、duplicate nullifier、proof bundleを持つ。
- Solidity/TypeScript/Rust/Python/Goなど複数SDKを提供する。
- EVM contractはoptionalで、AGID resolverとproof verificationを統合できる。
- 実世界の配送・住所・受け渡しをEthereumアプリの安全な境界に接続する。

## 90日ロードマップ

### Phase 1: OSSとして信頼される形に整える

必須:

- `README.md`を「5分で動く」構成にする。
- `LICENSE`、`SECURITY.md`、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`を揃える。
- public/private境界を明文化する。
- raw addressを保存しない/送らないrelease gateをCIに入れる。
- npm package、CLI、OpenAPI、SDKを最小セットで安定化する。

成果物:

- `docs/ethereum-integration.md`
- `docs/no-raw-address-onchain.md`
- `docs/security-model.md`
- `docs/developer-quickstart.md`
- `examples/ethereum-zk-address-proof`
- `examples/pos-delivery-proof`

### Phase 2: Ethereum向けに見せ方を絞る

必須:

- 「住所をブロックチェーンに載せる」ではなく「住所条件を証明する」説明にする。
- Solidity verifier / registry contractの最小例を作る。
- Sepoliaなどのtestnet deploy scriptを用意する。
- viem / ethers連携例を作る。
- OpenAPIとSDKのサンプルを1ページにまとめる。

推奨API:

```text
POST /api/v1/zk/mode2/private-address-predicate/verify
POST /api/v1/zk/proof-bundles/register
POST /api/v1/ethereum/mode3/registry
POST /api/v1/revocation-freshness/anchor
POST /api/v1/pos/external/handoff-complete
POST /api/v1/delivery/external/delivery-proof
```

### Phase 3: 掲載前の外部評価を作る

必須:

- GitHub Actionsで全SDKのテストを通す。
- `npm run lint`、`npm run build`、security scan、secret scanを必須化する。
- 監査前セルフチェックレポートを公開する。
- 2つ以上の小さいサンプルアプリを作る。
- issue templateとdiscussionを整備する。

掲載前に欲しい指標:

- GitHub stars: 50以上
- 外部contributor: 3人以上
- npm downloads: 継続的に発生
- examplesを動かした第三者フィードバック
- security policyに従った修正履歴
- demo siteまたはdocs site

### Phase 4: ethereum.orgへ提案する

先にdeveloper toolとしてissueを作る。いきなりdapp/product申請を狙わない。

提案先:

- Adding developer tools
- 必要に応じてDecentralized identity / Privacy / Developer tools関連ページ

issue本文で書くこと:

- Tool name: AGID
- Category: identity, privacy, ZK proof, address/delivery infrastructure
- One-line value: privacy-preserving physical address proof toolkit for Ethereum apps
- Open source license
- GitHub repo
- Docs
- Quickstart
- Security model
- Test status
- Maintenance status
- Difference from ENS/SIWE/verifiable credentials
- Why ethereum.org readers benefit

## AGIDが満たすべき「余裕ライン」

公式基準ぎりぎりではなく、次を満たしてから出す。

| 項目 | 最低ライン | 余裕ライン |
| --- | --- | --- |
| OSS license | あり | SPDX明記、依存license表つき |
| Docs | READMEのみ | Quickstart, architecture, security, API, examples |
| Test | 一部通る | CIで主要SDK、API、privacy leak testが通る |
| Security | SECURITY.md | threat model、no raw address release gate、secret scan |
| Ethereum連携 | contractあり | Sepolia example、viem/ethers、proof verification |
| Differentiation | 住所ID | ZK physical address predicates + delivery/POS proof |
| Community | repo公開 | issue template、discussion、contribution guide |
| Maintenance | active commits | changelog、release cadence、maintainer policy |
| Usage | demoのみ | examples、npm package、small pilot feedback |

## リスクと対策

### 誤解: 住所をオンチェーンに載せる危険なプロジェクトに見える

対策:

- 「raw address never on-chain」を最上位に書く。
- commitment、predicate proof、redacted eventだけを扱う図を出す。

### 誤解: ENSやDIDと競合するだけに見える

対策:

- ENSはhuman-readable name、SIWEはlogin、VCはcredential、AGIDはphysical address predicate and delivery proof boundaryと説明する。

### 誤解: 物流SaaSでEthereum開発者向けではない

対策:

- SDK、contract、proof verifier、test vectors、OpenAPIを前面に出す。
- UIアプリはdemo扱いに下げる。

### 掲載拒否: 利用実績不足

対策:

- 先にcontent resourceやdeveloper tutorialとして小さく貢献する。
- ethereum.org repoで関連ページの改善PRを出し、コミュニティ接点を作る。

## 提案文のたたき台

```text
AGID is an open-source toolkit for privacy-preserving physical address proofs in Ethereum applications.
It helps developers verify address-related predicates, delivery handoffs, and POS/shipping events without putting raw addresses on-chain.

AGID provides TypeScript, Rust, Python, Go, Solidity/EVM examples, OpenAPI contracts, test vectors, and a no-raw-address security model.
It is differentiated from ENS, SIWE, and generic verifiable credentials by focusing on physical address resolution, redacted delivery proof, and ZK-compatible address predicates.
```

## 最初に実装すべきGitHub向け整備

1. `docs/ethereum-integration.md`
2. `docs/no-raw-address-onchain.md`
3. `examples/ethereum-zk-address-proof/`
4. GitHub ActionsのCI整理
5. `SECURITY.md`とthreat modelの短縮版
6. `package.json`のpublic package情報整備
7. release tag `v0.1.0-alpha`

## 最終判断

AGIDはethereum.orgに対して、今すぐ「product」として出すより、まず「developer tool / open-source resource」として出すべき。

狙う分類:

```text
Developer tool
Privacy / identity / ZK proof infrastructure
Physical address and delivery proof toolkit
```

この順番なら、UIの完成度よりもAPI、SDK、セキュリティ、ドキュメント、差別化で勝負できる。
