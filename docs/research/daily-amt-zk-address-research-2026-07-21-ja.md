# AMT / ZK 住所研究 日次ノート — 2026-07-21

## 範囲と安全境界

本ループは、既存の AMT / ZK 型、合成テスト、公開標準だけを対象とした。実住所、実受取人、秘密鍵、holder secret、witness、prover、production traffic は使用していない。一次資料として IETF Privacy Pass Architecture (RFC 9576)、Privacy Pass HTTP Authentication Scheme (RFC 9577)、W3C Verifiable Credentials Data Model 2.0 の相関・単回利用・抽象 claim に関する境界を確認した。

## 今日の新しい理論案

### 1. 観測コンテキスト付きプライバシー会計

住所述語の安全性を、一つの proof のフィールド検査ではなく、発行・提示・配送照会を通じた transcript の性質として扱う。観測者 `o` と期間 `T` に対し、

\[
\mathcal{T}_{o,T}=\{(context, audience, epoch, bucketNullifier, quota, timing, root, result)\}
\]

を定め、受理条件に `AnonymitySet(\mathcal{T}_{o,T}) >= k_min`、`LinkabilityBudget(\mathcal{T}_{o,T}) <= L_max`、`QueryBudget(\mathcal{T}_{o,T}) <= Q_max` を加える。個々の値が非住所でも、積集合から小さな地域・施設・同一主体を特定できるため、privacy は transcript 上で合成しなければならない。

### 2. 二種類の nullifier を分離する

現行 anonymous rate-limit model の `bucketNullifier` は quota 集計に必要だが、同じ window 内の全 request を意図的に結合する。一方 `requestNullifier` は replay 防止用である。この二つを同じ「privacy preserving」境界で評価せず、

- `spendNullifier`: 一回限り、redeem 後は再利用不可
- `quotaTag`: 限定された origin / action / epoch 内だけで集計可能

に分ける。`quotaTag` の開示は unlinkability の例外であり、対象 anonymity set、保持期間、非結託仮定を明示する。より強い匿名性が必要な用途では、複数の unlinkable single-use token を事前発行し、安定 bucket tag を origin に見せない設計を候補とする。

### 3. 住所照会差分プライバシー義務

配送可否、postal-equivalent、rate/capability の yes/no を繰り返すと、領域を二分する adaptive query により住所候補集合を狭められる。候補集合 `C_0` と応答列 `a_1..a_n` について、

\[
C_n=\{x\in C_0 \mid P_i(x)=a_i,\ 1\le i\le n\}
\]

とし、`|C_n| < k_min` になる次の照会は `coarsen | delay | manual_review | block` に単調 downgrade する。これは ZK の健全性とは別の proof obligation であり、正しい ZK proof でも oracle 型の特定攻撃は防げない。

## 発見した弱点と反例

1. `anonymousRateLimitProof` は `proofHint.zkpGenerated=false` で、実体は issuer HMAC 署名付き claim である。issuer secret と subject secret を同じ生成 API に渡すため、発行者非リンク性や blind issuance を提供しない。名称上の anonymous / proof を暗号学的匿名証明と解釈してはならない。
2. 同一 scope / action / audience / window / subject secret の `bucketNullifier` は安定する。ledger は quota を実現できる一方、同一時間窓内の要求を完全に link でき、時刻・検索 endpoint・結果と組み合わせれば住所探索パターンを推測できる。
3. `privacyPreserved` は秘密フィールドの不在を主に検査し、transcript correlation、IP/TLS metadata、issuer-origin collusion、anonymity-set partitioning を判定しない。
4. `maxRequests` と window が claim に公開され、scope/action/audience も公開される。希少な quota profile や短い固有 window は fingerprint となるが、uniform parameter set の義務がない。
5. rate-limit ledger の `remaining` と成功/失敗応答は、同じ bucket に属する要求の有無を探る side channel になり得る。複数 verifier 間で ledger や tag を共有する禁止境界もない。
6. AddressQL の `deliverable` / `postal_equivalent` と carrier capability / postal-zone generation を adaptive に照会した場合の候補集合縮小が、Chapter 11 の単発 `publicSignalLeakScore` では表現できない。
7. 越境経路では carrier、customs、merchant、issuer が異なる観測者になる。全者に同じ tag/root/epoch を見せると branch separation を破り、別 tag にしても timing と shipment commitment の組合せで再結合され得る。

## 提案する数学的精緻化と証明義務

- `ContextUnlinkable(o, T, policy)` を actor ごとに定義し、issuer-client、origin-client、attester-origin、carrier-customs の各リンク可能性を別軸にする。
- `QuotaSound` と `Unlinkable` を別定理にする。quota の正しさから匿名性を推論しない。
- `UniformContext` を要求し、issuer key、token type、window、quota、root、translation profile の細分化が anonymity set を partition しないことを検査する。
- `AdaptiveDisclosureSafe(history, nextPredicate)` を導入し、単発の coarse predicate でも履歴との積集合が anonymity floor を割れば拒否する。
- AMT morphism の合成に `ObservationNonIncreasing` を加える。ただし通常の delivery pipeline は観測情報を増やすため、無条件の定理ではなく policy budget 内に制限する refinement relation とする。
- 越境 branch は同一 referent/shipment commitment への整合を証明しつつ、共有可能な join key を最小化し、保持期間後の join を禁止する governance obligation を持つ。
- Privacy Pass 相当を採用する場合、blind/unlinkable issuance、redemption separation、deployment-specific non-collusion assumption、anonymity-set size を明記し、単なる HMAC envelope を同等と主張しない。

## 実装候補

1. `ObservationPrivacyPolicy` 型: observerRole、contextClass、epoch、uniformityProfile、minimumAnonymity、maxLinkableEvents、maxAdaptiveQueries、retention、allowedJoinKeys、collusionAssumption、decision。
2. anonymous rate-limit の non-claims に `not-a-zkp`、`not-blind-issued`、`same-bucket-requests-are-linkable`、`network-metadata-not-hidden` を追加する。
3. 合成 conformance vectors: 同一 bucket の二要求、固有 quota fingerprint、issuer key partition、origin 間 quotaTag reuse、ledger remaining probe、隣接 zone の adaptive bisection、carrier/customs timing join。
4. privacy-preserving mode 候補として、短期・単回・origin-scoped の unlinkable token batch と原子的 spend ledger を分離実装する。既存 HMAC mode は内部 fixture / pseudonymous quota と明示する。
5. AddressQL verifier に `observationHistoryCommitment` と privacy-accountant の決定を結合する。ただし履歴 commitment 自体を安定した追跡子にしないため、verifier-local・epoch-scoped とする。

## 検証が必要な事項

- quotaTag を隠したまま上限を証明する方式の暗号設計、監査、性能
- token batch 発行量と Sybil resistance の両立
- ledger の原子的 spend、並行要求、retry idempotency、失効
- uniform parameter set が国・carrier・低帯域環境の差を過度に隠して機能を壊さないか
- adaptive query accountant の保守的な候補数推定と、生成 postal zone の boundary epoch 更新
- proxy/VPN を含む network metadata、traffic analysis、issuer-origin-carrier collusion の実運用評価
- customs の法的監査可能性と privacy partitioning の両立

## 残余リスク

匿名 token や ZK proof を導入しても、利用時刻、配送結果、parcel profile、carrier 選択、通信経路の相関は残る。anonymity floor は人口統計・住所件数の誤差に依存し、過大推計すれば敏感施設を保護できない。query budget は攻撃者の複数アカウント・複数 origin 横断を完全には捉えない。したがって本提案は前日までの StatementBinding、AddressSessionBinding、PresentationAuthorityPolicy、semantic coarseness、authority vector、translation/boundary binding を置換せず、観測履歴を扱う追加層である。
