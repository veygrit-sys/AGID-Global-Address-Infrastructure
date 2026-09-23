# AMT・ZK 住所研究日報 — 2026-07-28

## 新しい理論案

外部検証を `VerifyAttest : (proof, statement, policy, context) → receipt` という
**検証証明射**として扱う。受理条件は単なる `verified = true` ではなく、

`SemanticValid(s) ∧ CommitmentMatches(r,s) ∧ ContextBound(r) ∧ Authentic(r) ∧ CryptoVerified(r) ∧ Fresh(r)`

の論理積とする。各条件は独立した proof obligation であり、他軸の高い信頼度で
平均・上書きしてはならない。特に cross-border delivery では carrier と customs の
receipt を相互代用できず、claim、purpose、audience、challenge、policy、boundary
binding を全て保存する必要がある。

## 見つかった弱点と反例

- AddressQL v0.6 の `external_verifier_receipt` は二つの commitment 文字列だけであり、
  circuit、verification key、policy、challenge、audience、expiry を拘束しない。
- proof A の成功 receipt を statement B に添付する receipt substitution が可能な
  schema 形状である。
- 同じ proof を弱い circuit/VK、別 verifier backend、別 policy として表示する
  verification-key confusion / policy substitution を schema acceptance は検出できない。
- `result=verified` だけの success-only receipt は、署名真正性と暗号検証の実行を
  示さない。
- receipt TTL が proof TTL を超えると、失効後の proof を receipt で延命できる。
- binding が正しくても、小さい zone の辞書攻撃、時刻相関、carrier/customs 共謀は
  防げない。

## 提案した数学的精緻化

`Accepted(r,s,c)` を次で定義する。

1. `r.publicInputCommitment = H(C(s))`
2. proof、claim、purpose、audience、challenge、policy の各射影が期待 context と一致
3. proof system、backend、circuit、VK、binding version が一致
4. `verifiedAt ≤ now ≤ receiptExpiry ≤ proofExpiry`
5. receipt authenticity と cryptographic verification は外部 adapter が独立に証明

したがって `Accepted(r,s,c) → Bound(r,s,c)` は fixture 上で検査できる。一方、
署名健全性・SNARK soundness・VK 正当性は仮定であり、この TypeScript gate の定理ではない。

## 実装候補

- `src/lib/addressQlExternalVerifierReceipt.ts` に `ExternalVerifierReceiptV1` と
  fail-closed validator を追加した。
- 合成適合性ベクトルとして receipt/public-input substitution、policy/challenge/
  audience/purpose replay、circuit/VK/backend confusion、未認証 success-only receipt、
  receipt expiry と proof-expiry 超過を追加した。
- 次段階ではこの validator を `runAddressQlVerifierHook` の schema 判定とは別の
  production adapter 境界に接続する。

## 検証結果

- 対象回帰 48/48 tests pass。
- `git diff --check` pass。
- production traffic、実 recipient、raw personal address、private key、witness、
  prover job は使用していない。

## 残余リスク

`authenticityVerified` と `cryptographicVerificationPerformed` は現状 adapter 入力であり、
本実装自身は署名・proof・Merkle proof を検証しない。verifier compromise、悪意ある
circuit/setup、root fork、低エントロピー zone、adaptive query、通信メタデータ、
越境機関間の共謀は残る。次の bounded loop では署名済み receipt の canonical bytes、
key rotation/revocation、challenge 消費台帳、または external hook への明示接続を優先する。
