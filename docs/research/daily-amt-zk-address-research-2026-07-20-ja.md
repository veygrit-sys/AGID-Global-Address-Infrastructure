# AMT / ZK 住所研究 日次ノート — 2026-07-20

## 範囲と安全境界

本ループは、合成住所、公開仕様、既存の型・テスト・Lean 定義だけを対象とした。実受取人、実住所、秘密鍵、holder secret、witness、prover、production traffic は使用していない。W3C VC Data Model 2.0 と 2026-04-07 版 BBS Cryptosuites の holder binding、pseudonym、unlinkability、collusion 注意事項を一次資料として参照した。BBS の optional features は Candidate Recommendation Draft 上で at-risk であり、実装候補を production-ready と扱わない。

## 今日の新しい理論案

### 1. 提示権モーフィズム

住所述語の証明を単なる真偽値ではなく、次の対象として扱う。

\[
P=(B,C,M,D,E)
\]

- `B`: 前回提案した Statement / AddressSession Binding
- `C`: 証明を生成できる主体または能力のクラス
- `M`: `bearer | anonymous_holder_bound | verifier_local_pseudonym | delegated_carrier`
- `D`: 許可された委任辺と各辺の purpose、audience、TTL、回数上限
- `E`: 失効、境界 epoch、challenge 消費状態

提示または委任をモーフィズム `f : P_i -> P_j` とし、受理には `BindingPreserving(f)`、`AuthorityNonIncreasing(f)`、`DisclosureNonIncreasing(f)`、`Fresh(f)` をすべて要求する。配送会社への委任は証明のコピーではなく、元の binding digest と carrier audience を含む別の派生証明でなければならない。

### 2. 非転送性と非リンク性の二目的制約

非転送性を固定 holder ID で実現すると、issuer-verifier または verifier-verifier の結託時に追跡点になる。逆に bearer proof は匿名性を保ちやすいが転送可能である。したがって安全性を単一 boolean にせず、

\[
Safe(P) = TransferRisk(P) \le \tau_T \land LinkabilityRisk(P) \le \tau_L
\]

とする。用途ごとに mode を選ぶ。

- 一回限りの checkout: challenge-bound anonymous holder proof
- 同一 carrier 内の再照会: carrier-domain local pseudonym + 短 TTL
- carrier 間 handoff: audience を旧 carrier から新 carrier へ置換した限定再発行
- customs: 法的に必要な別 disclosure branch。merchant branch と join しない

### 3. 委任図式の非可換性

`holder -> merchant -> carrier` の転送と `holder -> carrier` の直接派生は一般に同値でない。merchant が carrier 用証明を再構成できれば権限昇格であり、同一 artifact を横流しできれば audience binding がない。正しい図式は「同じ private address を知る」ことで可換にせず、「同じ committed referent と許可済み delivery predicate に到達する」範囲だけで可換にする。

## 発見した弱点と反例

1. `AddressQlProofInput` は holder-binding mode、presentation authority、delegation chain、proof-of-possession、nym domain を持たない。valid proof artifact を別クライアントが取得した場合の転送可否を表現できない。
2. Address Login の `subjectAlias` / `proofRef` はセッション結合だけでなく、提示者が正当な holder であることとも未結合である。前回の session swap を塞いでも、artifact theft / forwarding は残る。
3. AMT v2 Chapter 11 の delegation fixture と `delegation expired -> blocked` は期限を扱うが、委任可能権限の上限、再委任、audience 置換、branch separation を証明義務にしていない。
4. `proof_only` は disclosure mode であって presentation-authority mode ではない。raw field がなくても proofRef の横流しで deliverable=true を再利用できる。
5. 固定 `subjectAlias`、固定 issuer key、小さい mandatory reveal pattern、固定 proof option は、各値が非住所でも褧数提示の結合キーになり得る。BBS 自体の unlinkability だけでは周辺プロトコルの相関を防げない。
6. 越境配送で customs と carrier の audience を一つにすると過剰開示になり、別々にして binding を共有しないと別荷物・別宛先の証明を合成する mix-and-match が可能になる。

## 提案する数学的精緻化と証明義務

- `PresentationAuthorized(P, actor, audience, purpose, challenge, time)` を AMT の受理条件に追加する。
- `Delegates(d, P, actorFrom, actorTo)` は authority と disclosure の単調非増加を満たす。
- `RebindAudience` は元 artifact の mutation ではなく、同じ referent commitment に対する新しい proof issuance とする。
- `VerifierLocal(nymDomain)` は verifier / carrier family / purpose / epoch を canonical encoding し、別 domain で同じ pseudonym を許さない。
- `BranchConsistent(customsProof, carrierProof)` は同じ shipment commitment、referent commitment、boundary epoch を共有しつつ、公開 claims は交差開示しない。
- holder binding を使わない bearer mode は一回限り challenge、消費 ledger、短い max TTL を必須にする。
- Lean では暗号学的性質を無条件に証明せず、`BindingSound`、`DomainSeparationSound`、`Unforgeable` を仮定として分離する。証明可能部分は「受理された委任は権限を増やさない」「期限切れ・audience 不一致は monotone downgrade」「異なる branch の commitment 不一致は合成不可」。

## 実装候補

1. `PresentationAuthorityPolicy` 型を追加する: mode、holderBindingRef、nymDomain、audience、purpose、challengeHash、singleUse、maxTTL、delegationDepth、allowedDelegateKinds、rotationEpoch。
2. Address Login の server-side transaction に presentation authority と consumed challenge を保持し、callback、proof receipt、consent、carrier handoff を同じ binding digest の pullback として検証する。
3. 合成 conformance vector を追加する: stolen proofRef、merchant-to-carrier forwarding、別 carrier audience、再委任超過、期限切れ委任、同一 nym domain の merchant 間再利用、customs/carrier shipment commitment swap。
4. privacy vector を追加する: holder binding は成功するが固定 subjectAlias で結託可能、issuer key subset が小さい、mandatory reveal pattern が一意、network metadata が同じ、というケースを `review/block` にする。
5. BBS は選択的開示・匿名 holder binding・verifier-local pseudonym の実験 backend 候補に留め、既存 Circom fixture や schema-only hook を暗号検証済みと昇格させない。

## 検証が必要な事項

- nym domain の canonicalization と carrier family 境界
- single-use ledger の原子的 challenge 消費、race、再送時 idempotency
- holder secret の回復・端末移行と、回復主体による追跡リスク
- 委任失効の配送オフライン環境への伝播
- issuer key rotation が anonymity set を縮小しない運用
- customs disclosure branch の各国法令・carrier 契約との整合
- BBS optional features の標準化状態、相互運用テスト、独立実装、監査

## 残余リスク

holder binding は盗難・転送を減らすが、端末侵害、強制提示、交通解析、issuer/verifier 結託を解決しない。verifier-local pseudonym も domain 設計が広すぎれば追跡子、狭すぎれば不正再利用検知不能になる。generated postal zone や area root が低エントロピーなら commitment は辞書攻撃可能であり、今回の提示権モデルは前回までの anonymity floor、semantic coarseness、authority vector、translation/boundary binding を置換せず、追加の必須層となる。
