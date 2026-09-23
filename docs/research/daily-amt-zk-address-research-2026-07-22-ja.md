# AMT / ZK 住所研究 日次ノート — 2026-07-22

## 範囲と安全境界

本ループは、AMT Lean 定義、AddressQL ZK hook、住所翻訳、Postal Zone Designer、公開標準だけを対象とした。実住所、実受取人、秘密鍵、holder secret、witness、prover、production traffic は使用していない。一次資料として [RFC 9162 Certificate Transparency v2](https://www.rfc-editor.org/rfc/rfc9162.html)、[IETF Key Transparency Architecture draft-08](https://datatracker.ietf.org/doc/draft-ietf-keytrans-architecture/)、[W3C VC Data Model 2.0](https://www.w3.org/TR/vc-data-model/)、[W3C Bitstring Status List v1.0](https://www.w3.org/TR/vc-bitstring-status-list/) を確認した。

## 新しい理論案

### 1. 住所状態の非同時分岐性（non-equivocation）

proof が root に包含され、root が新鮮であることと、全 verifier が同じ状態系列を見ていることは別である。発行者は merchant に「配送可能・未失効」の root `R_m`、carrier や customs に矛盾する root `R_c` を提示でき、各 proof は局所的には正しく新鮮でもよい。

住所状態を単一 root ではなく署名済み checkpoint

\[
C_e=(logId,\ epoch,\ treeSize,\ root,\ previousCheckpoint,\ policyVersion,\ boundaryEpoch)
\]

として扱う。受理には `Inclusion(x,C_e)` だけでなく、既知 checkpoint からの `Consistent(C_old,C_e)` と、同一 `(logId, epoch, treeSize)` に異なる root がないことを監査する `NonEquivocating` が必要である。RFC 9162 も append-only consistency と「全 query source に同じ view」を別の監査性質としており、gossip なしでは split-view を回避できると明記している。

### 2. AMT 履歴グラフと透明性ログの分離

AMT の `LineageExtends` は、ある old/new グラフの間で旧ノードと辺を保存する。しかし、発行者が二つの互いに見えない fork を提示する反例を排除しない。したがって次を分ける。

- `LocalExtension(G_i,G_j)`: 一つの履歴系列で削除がない。
- `GloballyConsistent(V,e)`: 観測者集合 `V` が epoch `e` で比較可能な checkpoint を持つ。
- `ForkAccountable(C_1,C_2)`: 同じ log/size/epoch の不整合な署名 checkpoint が、秘密情報を出さずに発行者の不正証拠になる。

これは consensus を仮定する定理ではない。witness quorum、cross-logging、または gossip という運用仮定を明示した条件付き安全性である。

### 3. 越境配送の root product と単調 downgrade

越境 claim は issuer、revocation、freshness、area、postal-zone、translation profile、carrier、customs の複数 root に依存する。一つの合成 hash に潰さず、authority ごとの checkpoint vector `\mathbf C` として保持する。任意の軸が forked、unknown、stale、boundary-mismatched なら最終状態は `manual_review | block` に downgrade し、他軸の強さで平均・上書きしてはならない。

## 発見した弱点と反例

1. `AddressQlProofInput.roots` は四つの opaque string であり、署名者、log ID、tree size、epoch、発行時刻、包含証明、整合性証明、witness quorum を持たない。
2. validator は freshness/revocation root の文字列存在だけを確認する。同じ claim に対して `root:A` と `root:B` を verifier ごとに差し替えても schema acceptance を妨げない。これは 7月18日の statement binding を満たしても残る issuer-equivocation 反例である。
3. Lean の `LineageExtends old new` と `freshRoot` は局所述語であり、二つの fork がそれぞれ old を extend する場合を排除しない。
4. Postal Zone Designer は split/merge 前の transition mapping 公開を要求するが、mapping の append-only log、boundary epoch checkpoint、過去 checkpoint との consistency proof は未定義である。同じ zone code が国境・自治体境界の別 view へ再解釈され得る。
5. 翻訳 profile と zone root の組が verifier ごとに違うと、同一 visible label が別 referent class または別 deliverability predicate を表し得る。単なる reference-preserving translation テストでは発行者分岐を検出できない。
6. revocation/status を verifier が issuer に個別照会すると相関漏えいを起こし得る。W3C VC Data Model 2.0 も credential ごとに固有な status 照会が verifier-holder 関係を漏らし得ると警告する。非同時分岐対策は、個別 query を増やして privacy を悪化させてはならない。

## 提案する数学的精緻化と証明義務

- `CheckpointWellFormed(C)`: domain-separated signature、単調 epoch/tree size、policy/boundary version binding。
- `AppendOnly(C_i,C_j,pi)`: consistency proof `pi` が同じ log の前後 checkpoint を結ぶ。
- `SameViewOrBlame(C_1,C_2)`: 比較可能な checkpoint、または署名付き fork evidence を返す。
- `RootVectorCoherent(\mathbf C,B)`: StatementBinding `B` の purpose、audience、translation profile、authority vector、boundary epoch と各 checkpoint が一致する。
- `PrivateAudit`: checkpoint/gossip は root と集約 metadata のみを共有し、住所 membership、holder、照会 predicate を共有しない。
- `MonotoneForkDowngrade`: 一度 fork evidence が得られた authority 軸は、明示的な governance recovery checkpoint まで `accepted` に戻らない。
- `ZoneMeaningStable`: zone split/merge は旧意味を黙って変更せず、旧 checkpoint から新 zone 集合への versioned transition relation を公開する。

## 実装候補

1. `AddressStateCheckpoint` 型を追加する: `logId, authorityKind, epoch, treeSize, rootHash, previousRootHash, policyVersion, boundaryEpoch, issuedAt, maxMergeDelay, signature, witnessCosignatures`。
2. proof input の各 root を `CheckpointRef + inclusionProofRef + consistencyProofRef` に置換し、外部 verifier receipt だけを production 候補にする。schema-only fixture は非暗号検証のまま残す。
3. synthetic conformance vectors を追加する: 同一 size の異なる root、両方 fresh な二 fork、正しい inclusion + 不正 consistency、tree rollback、stale boundary epoch、postal-zone split mapping 欠落、translation-profile fork、witness quorum 不足。
4. verifier-local checkpoint cache と privacy-preserving gossip を設計する。共有対象は署名 checkpoint のみに限定し、照会した住所/credential/status index を含めない。
5. carrier/customs/merchant の branch ごとに authority checkpoint を検証し、`RootVectorCoherent` の meet が失敗すれば shipment creation を `manual_review` にする。
6. Lean にはまず抽象的な `SignedCheckpoint`、`ExtendsCheckpoint`、`Fork` を追加し、「同一 key が比較不能な checkpoint を署名したなら accountability evidence がある」という定理形を置く。hash collision resistance、署名 unforgeability、witness honesty は仮定として明記する。

## 検証が必要な事項

- checkpoint canonical encoding、署名 key rotation、clock/epoch 規則、最大 merge delay
- sparse Merkle / append-only log / status-list の選択と更新・証明サイズ
- witness quorum の独立性、結託耐性、障害時可用性、cross-border governance
- fork recovery 後に旧 proof、旧 zone、配送中 shipment をどう扱うか
- gossip metadata、tree size、更新頻度が小規模地域や災害イベントを fingerprint しないか
- Bitstring Status List 等を使う場合の最低リスト長、ランダム index、キャッシュ方式、issuer への個別照会回避
- carrier/customs が offline または低帯域のときの checkpoint pinning と安全な猶予期間

## 残余リスク

透明性ログは誤った住所解決や不正な authority 自体を正しくしない。全 witness が結託すれば fork は隠せる。公開 checkpoint の更新時刻・サイズも地域活動を漏らし得る。境界紛争では「唯一の正しい root」が存在しない場合があるため、複数 authority view を消去せず `disputed/manual_review` として保持する必要がある。本提案は StatementBinding、PresentationAuthority、semantic coarseness、観測 privacy accountant、失効、carrier-only disclosure を置換せず、root 一貫性と不正説明責任を追加する層である。

## 実行検証

`addressQlZkProofHooks`、AMT Chapter 11/12、`verifiedAddressTranslation`、`postalZoneDesigner` の synthetic test は 44/44 成功した。これは既存の schema/privacy/translation/zone gate の回帰がないことだけを示し、本ノートの non-equivocation 性質を実証するものではない。
