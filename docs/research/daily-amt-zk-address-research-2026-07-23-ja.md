# AMT / ZK 住所研究 日次ノート — 2026-07-23

## 範囲と結論

前日の root non-equivocation 課題を、実住所・実受取人・秘密鍵・witness・production traffic を使わない合成モデルへ落とした。結論は、ZK proof の局所的正しさだけでは住所状態の同一ビューを保証できず、受理条件に署名 checkpoint、包含、append-only consistency、fork 比較、boundary/policy version、privacy-safe gossip を同時に含める必要がある、である。

## 新しい理論案

住所状態 checkpoint を `C=(log, authority, epoch, size, root, prevRoot, policyVersion, boundaryEpoch, time)` とする。受理述語を

`Accept(C) = WellFormed(C) ∧ Signed(C) ∧ Included(C) ∧ Consistent(Cprev,C) ∧ SameViewOrBlame(C,Peers) ∧ Fresh(C) ∧ PrivateAudit(C)`

と精緻化する。越境配送では issuer、revocation、postal zone、translation profile、carrier、customs の checkpoint を積として保持し、各軸の判定を最も制限的な結果で合成する。強い carrier 証拠が、fork した customs root や古い postal boundary を修復してはならない。

`SameViewOrBlame` は consensus の主張ではない。同じ `(log, epoch, treeSize)` に署名済みの異なる root があれば fork evidence とし、それ以外の比較可能性は consistency proof と witness/cross-log 運用を仮定する条件付き性質である。

## 発見した弱点と反例

1. 現行 AddressQL の root は opaque string で、同じ claim に二つの新鮮な root を配っても schema gate は通り得る。
2. 包含証明が正しくても、既知 checkpoint との consistency が偽なら append-only history は成立しない。
3. translation profile と postal-zone boundary の一方だけを更新すると、同じ表示住所・zone code が異なる referent/predicate を指し得る。
4. tree size または epoch の rollback は、失効済み credential や旧 zone meaning の再受理を可能にする。
5. gossip に credential status index、holder、照会住所を混ぜると、非分岐監査自体が相関チャネルになる。
6. 現モデルの peer 比較は同一 log position の直接衝突を検出するが、異なる tree size の隠れ fork は外部 consistency verifier または gossip witness が必要である。

## 提案した数学的精緻化

- `LocalAppendOnly` と `GlobalSameView` を分離し、前者から後者を無条件に導かない。
- `ForkEvidence(C1,C2)` は同一 log/epoch/size、異 root、検証済み署名を条件とする。本 TypeScript 層は署名検証結果を入力として受け、暗号学的真正性を証明しない。
- `BoundaryStable(Cprev,C,Transition)` を postal-zone split/merge と住所翻訳の proof obligation にする。mapping 欠落時は `manual_review` とする。
- `PrivateAudit` は共有可能 metadata の allowlist を用い、membership query、credential index、holder identifier を checkpoint gossip から分離する。
- `MonotoneForkDowngrade` として、fork/rollback/private audit leakage は block、consistency・quorum・version 不足は少なくとも manual review とする。

## 実装候補と今回の成果

- `src/lib/addressStateCheckpoint.ts` に checkpoint、evidence、policy、三値判定を追加した。
- `src/lib/addressStateCheckpoint.test.ts` に安全系列、同一位置 fork、包含成功＋整合性失敗、rollback、境界不一致、witness 不足、private gossip の合成ベクトルを追加した。
- 既存 AddressQL ZK、AMT Chapter 11/12、VATT、Postal Zone Designer と合わせて 49/49 tests が成功した。
- 次の統合候補は AddressQL の各 root を `CheckpointRef` にし、StatementBinding が checkpoint digest、authority kind、boundary epoch を拘束することである。

## 検証が必要

- checkpoint canonical encoding、domain-separated signature、key rotation、署名済み fork evidence の永続化
- Merkle consistency verifier、inclusion verifier、cross-log/witness quorum の実装と監査
- 異なる tree size の fork、最大 merge delay、offline carrier/customs の猶予規則
- zone split/merge transition の全域性、翻訳 profile naturality、旧 proof の失効・再発行
- 小規模地域で tree size、更新時刻、authority kind が活動量を漏らさない padding/batching
- 国境紛争で複数の正当な authority view を `dishonest fork` と誤分類しない governance model

## 残余リスク

本モデルは暗号署名、Merkle proof、witness 独立性を検証せず、それらの結果を信頼する protocol-level gate である。透明性は誤った住所解決、悪意ある issuer、結託 witness、endpoint compromise を正さない。また checkpoint の一貫性は、低匿名性 predicate、proof replay、holder transfer、alias linkability、adaptive query leakage を解消しない。production 利用には外部暗号 verifier、永続 checkpoint cache、recovery governance、越境 authority policy が必要である。
