# 住所写像論のゼロ知識証明関連資料整理・検証ロードマップ

作成日: 2026-06-07
最終再検証: 2026-06-07
対象: Address Morphism Theory II / ZK Address Proof / AGID / AOID / PID audit / private address predicates

## 1. 目的

本資料は、住所写像論 (Address Morphism Theory, AMT) とゼロ知識証明 (ZKP) の関係について、既存資料、実装、検証済み事項、未検証事項、今後追加すべき予想を整理するための統合ノートである。

結論を先に述べると、現行リポジトリで強く支えられているのは、完全な暗号学的 ZKP ではなく、次の範囲である。

```text
AMT semantic layer
  -> proof-ready envelope
  -> credential / issuer trust / freshness / revocation
  -> nullifier / scope / challenge / bundle compatibility
  -> TypeScript + Rust-WASM predicate runtime boundary
```

したがって、論文では次のように書くのが安全である。

```text
AMT supplies address semantics.
Current implementation supplies ZK-ready proof envelopes and predicate gates.
Production zero-knowledge claims require audited circuits or zkVM backends.
```

避けるべき表現は次である。

```text
AMT has already implemented complete zero-knowledge proofs.
ZK alone proves that an address is true.
Every address predicate is privacy-preserving.
Delivery eligibility proves final delivery success.
```

## 2. 既存資料の整理

### 2.1 中核資料

| 資料 | 役割 | 推奨扱い |
| --- | --- | --- |
| `docs/address-morphism-theory-ii-zero-knowledge-address-predicates.md` | AMT II 英語版の中核草稿。witness、public statement、predicate、bundle、security analysis がまとまっている。 | 国際論文版の親資料にする。 |
| `docs/zero-knowledge-address-proofs-from-address-morphism-theory-ja.md` | 日本語版の理論草稿。AMTとの境界、非主張、主関係、証明ファミリが明確。 | 日本語母艦の親資料にする。 |
| `docs/zk-address-proofs-and-address-morphism-theory-paper-draft.md` | 英語コンパニオン論文の別案。表現が比較的簡潔。 | 英語版導入・概要の素材にする。 |
| `docs/zk-address-theorem-evaluation.md` | ZK Address Theorem の評価・修正案・反例・検証結果。 | 修正方針と査読対策の根拠にする。 |

### 2.2 関連する AMT 本体資料

| 資料 | ZKとの関係 |
| --- | --- |
| `docs/address-morphism-theory-ja-v1-chapters-13-18.md` | 第18章で ZKP は AMT 本体ではなく応用層と明記。 |
| `docs/address-morphism-theory-full-english-paper-v3.md` | AMT本体から AGID/AOID/ZK を分離する方針がある。 |
| `docs/address-morphism-theory-hypotheses-verification-matrix.md` | ZK Address Theorem、匿名集合補題、反例を整理済み。 |
| `docs/address-morphism-lean-gis-cross-verification.md` | Lean と GIS 検証をどう接続するかの資料。 |
| `docs/address-morphism-expectation-verification-report.md` | ZK-ready envelope と未検証事項の境界を整理。 |
| `docs/executable-unverified-verification-report-2026-06-07.md` | 実行可能な未検証事項の検証結果。AOID/ZK/API の現状証拠。 |

### 2.3 AGID/AOID/PID 関連資料

| 資料 | ZKとの関係 |
| --- | --- |
| `docs/agid-detailed-paper-ja.md` | AGID は公開地理参照であり、ZK witness ではなく public context になる。 |
| `docs/aoid-detailed-paper-ja.md` | AOID は private owner relation であり、AOID ownership proof の witness source になる。 |
| `docs/agid-aoid-design.md` | AGID/AOID の公開/非公開境界。ZK資料ではこの境界を前提にする。 |
| `docs/address-morphism-network-resume.md` | proof bundle、registry、Polkadot anchor、commitment公開の方針。 |

## 3. 実装資料の整理

### 3.1 Proof family modules

| 実装 | Proof family | 現在の状態 |
| --- | --- | --- |
| `src/lib/agidZkAddressProofs.ts` | ZK Address / Residence / Delivery named proofs | ZK-ready envelope |
| `src/lib/privateAddressPredicateProof.ts` | verified-address, delivery-region, same-address, country, city | ZK-ready envelope + predicate runtime |
| `src/lib/regionMembershipProof.ts` | AGID/AOID/POINT region membership | ZK-ready envelope |
| `src/lib/aoidOwnershipProof.ts` | AOID owner key / credential possession | ZK-ready envelope |
| `src/lib/addressDuplicateNullifier.ts` | duplicate prevention nullifier | ZK-ready envelope |
| `src/lib/addressCredentialFreshnessProof.ts` | credential freshness and non-revocation | ZK-ready envelope |
| `src/lib/consentPurposeScopeProof.ts` | consent and purpose scope | ZK-ready envelope |
| `src/lib/anonymousRateLimitProof.ts` | anonymous rate limiting | ZK-ready envelope |
| `src/lib/pidIssuanceAudit.ts` | PID issuance audit | ZK-ready envelope / audit proof |
| `src/lib/pidLifecycleProof.ts` | PID merge/split/history proof | ZK-ready envelope / lineage proof |
| `src/lib/qualityThresholdProof.ts` | quality threshold proof | ZK-ready envelope + predicate runtime |
| `src/lib/addressCredential.ts` | signed address credential | credential layer |
| `src/lib/credentialIssuerTrustRegistry.ts` | issuer trust registry | trust layer |
| `src/lib/revocationFreshnessRootAnchoring.ts` | revocation/freshness root anchoring | public root layer |
| `src/lib/zkProofCompatibility.ts` | proof compatibility and collision detection | bundle policy layer |
| `src/lib/zkProofBundleRegistry.ts` | proof bundle registry | registry layer |
| `src/lib/zkProofRuntime.ts` | runtime policy and predicate backend boundary | TypeScript/Rust-WASM/circuit boundary |

### 3.2 Formal / Lean

| 実装 | 内容 |
| --- | --- |
| `formal/AMTCore.lean` | AMT中核、freshness gate、predicate privacy caveat、attribute gate、candidate residual等。 |
| `formal/AMTPaperExtensions.lean` | GIS certificate、proof bundle compatibility policy、private material exposure prevention。 |
| `formal/GeneratedGisCertificate.lean` | GIS warning budget を Lean certificate として受ける橋渡し。 |

## 4. 今回実行した検証

### 4.1 ZK / credential / proof bundle tests

実行コマンド:

```powershell
node node_modules\tsx\dist\cli.mjs --test `
  src\lib\agidZkAddressProofs.test.ts `
  src\lib\privateAddressPredicateProof.test.ts `
  src\lib\regionMembershipProof.test.ts `
  src\lib\addressCredential.test.ts `
  src\lib\addressCredentialFreshnessProof.test.ts `
  src\lib\aoidOwnershipProof.test.ts `
  src\lib\addressDuplicateNullifier.test.ts `
  src\lib\pidIssuanceAudit.test.ts `
  src\lib\pidLifecycleProof.test.ts `
  src\lib\qualityThresholdProof.test.ts `
  src\lib\consentPurposeScopeProof.test.ts `
  src\lib\anonymousRateLimitProof.test.ts `
  src\lib\zkProofCompatibility.test.ts `
  src\lib\zkProofBundleRegistry.test.ts `
  src\lib\revocationFreshnessRootAnchoring.test.ts `
  src\lib\credentialIssuerTrustRegistry.test.ts `
  src\lib\zkProofRuntime.test.ts
```

結果:

```text
101 tests pass
0 fail
```

この結果から書けること:

- 住所本文を公開しない proof-ready envelope は実装テストで支持される。
- credential、issuer trust、freshness、revocation、nullifier、scope、challenge、bundle compatibility は実装テストで支持される。
- AOID ownership、delivery eligibility、residence、same-address、quality threshold、anonymous rate limit、PID audit、PID merge/split の envelope 検査は通過している。
- TypeScript は envelope / API / registry orchestration に留め、実 ZK 回路は Noir/Circom/Rust-ZKVM 等へ分ける方針が実装にある。

書いてはいけないこと:

- 101 tests pass だけで cryptographic zero-knowledge が証明された、とは言えない。
- TypeScript envelope は SNARK/STARK/zkVM proof ではない。

### 4.2 Lean

実行コマンド:

```powershell
$env:ELAN_HOME='C:\Users\kitau\.elan'
C:\Users\kitau\.elan\bin\lake.exe env lean formal\AMTCore.lean
```

結果:

```text
pass
```

拡張定理と GIS certificate は、`LEAN_PATH=formal` を設定して検証した。

```powershell
$env:ELAN_HOME='C:\Users\kitau\.elan'
$env:LEAN_PATH='formal'
C:\Users\kitau\.elan\bin\lake.exe env lean formal\AMTPaperExtensions.lean
C:\Users\kitau\.elan\bin\lake.exe env lean formal\GeneratedGisCertificate.lean
```

Lean 実行時に次の警告が出た。

```text
failed to query latest release, using existing version 'leanprover/lean4:v4.30.0'
```

これはネットワーク確認の警告であり、検証失敗ではない。

### 4.3 再検証サマリ

今回の再検証では、ZK関連 TypeScript テスト 101 件、Lean 中核ファイル 3 件を確認した。

| 種別 | 対象 | 結果 | 扱い |
| --- | --- | --- | --- |
| 実装テスト | 17個のZK/credential/bundle系 test file | 101 pass / 0 fail | envelope実装の検証済み根拠 |
| Lean | `formal/AMTCore.lean` | pass | AMT gate、freshness、quality、述語再識別反例の形式根拠 |
| Lean | `formal/AMTPaperExtensions.lean` | pass | proof bundle policy、domain separation、private material非公開の形式根拠 |
| Lean | `formal/GeneratedGisCertificate.lean` | pass | GIS certificateをLean側に受ける形式根拠 |

ただし、この再検証で確認されたのは **cryptographic ZK circuit** ではなく、ZK-ready envelope、predicate runtime、policy gate、compatibility gate である。論文ではこの区別を必ず明示する。

## 5. 現時点で検証済みとして扱えるもの

| 項目 | 検証方法 | 論文での安全な主張 |
| --- | --- | --- |
| AMT/ZKP 非代替性 | 論理証明、既存資料 | AMTは意味論、ZKPは秘匿証明であり、互いに代替しない。 |
| 公開述語が粗い場合の witness 非一意性 | Lean | 同じ公開述語を満たす複数 private value があれば、公開述語だけでは private value を一意決定できない。 |
| 公開述語が injective/狭すぎる場合の再識別危険 | Lean | ZK transcript が安全でも、public predicate から住所が推測され得る。 |
| required attributes gate | Lean | 用途に必要な属性が欠ける場合、purpose-scoped proof は通らない。 |
| proof bundle compatibility policy | Lean + tests | accepted bundle は private material を公開せず、domain separation を要求する。 |
| address credential envelope | tests | signed credential、tamper rejection、private salt stripping は通過。 |
| freshness/revocation | tests | stale/revoked/tampered proof は拒否される。 |
| duplicate nullifier | tests | 同じ hidden address/AOID/region で同じ nullifier、違えば変わる。 |
| AOID ownership | tests | owner key / registered credential possession envelope は住所本文を公開しない。 |
| private address predicates | tests | country/city/same-address/delivery-region は address body を公開しない envelope として通過。 |
| region membership | tests | AGID/AOID/POINT が region 内であることを住所や座標を出さずに envelope 化できる。 |
| quality threshold | tests | exact quality evidence を出さずに threshold を満たすことを示す envelope は通過。 |
| anonymous rate limit | tests | bucket nullifier と request nullifier により匿名レート制限を実装できる。 |
| PID audit | tests | candidate generation、cluster、unresolved gate、history update、PID issuance の監査 envelope が通過。 |
| PID merge/split | tests | hidden history roots を公開せずに merge/split lineage proof envelope が通過。 |
| proof compatibility | tests | private material、duplicate nullifier、scope mismatch、challenge mismatch、cross-role collision を検出する。 |
| proof bundle registry | tests | raw proof material を保存せず、bundle registration、replay、expired/revoked state を処理する。 |

## 6. 未検証として残すべきもの

| 項目 | 未検証の理由 | 検証方法 |
| --- | --- | --- |
| 実 ZK 回路の soundness | 現在は envelope と predicate runtime が中心。 | Noir/Circom/Halo2/Rust-zkVM 回路を作り、形式監査・外部監査する。 |
| 実 ZK 回路の zero-knowledge | transcript から witness が漏れないことは未監査。 | 回路、証明システム、setup、witness assignment、proof transcript を監査する。 |
| witness leakage | private fields は envelope では除外されるが、回路・ログ・metadata漏洩は未検証。 | side-channel/log/serialization/telemetry監査。 |
| anonymity set | 述語が狭すぎると再識別される。現状は明示的 `anonymitySetMin` が未十分。 | 地域・人口・住所密度ごとの k-anonymity / entropy analysis。 |
| GIS point-in-polygon 大規模性能 | bbox/circle/polygon envelope はあるが、世界規模境界と回路コストは未検証。 | 国境、市境、配送ゾーンで benchmark。 |
| merchant/carrier 二段階配送フロー | 理論上有効だが実配送 UX は未検証。 | EC checkout と carrier disclosure の A/B test。 |
| issuer trust の実運用 | local registry tests は通るが、外部 issuer 監査・鍵運用・失効配布は未検証。 | issuer onboarding、key rotation、SLA、incident drill。 |
| Polkadot anchor の実運用 | commitment/root だけ載せる方針はあるが、本番チェーンでの費用・遅延・削除不能性は未検証。 | testnet anchor、cost analysis、privacy review。 |
| 法的妥当性 | 国や用途により住所証明・居住証明の法的扱いが違う。 | jurisdiction review。 |
| 商用API比較 | 住所検証品質の比較はZK以前の問題として未完。 | 同一datasetで Loqate/Experian/Melissa/Smarty 等と比較。 |

## 7. これから追加すべき検証

### 7.1 すぐ追加・拡張できる実装テスト

| 追加・拡張テスト | 目的 |
| --- | --- |
| `anonymitySetMin` が不足する地域 predicate を拒否する | 一軒家だけの polygon など、ZKでも再識別される述語を防ぐ。 |
| `entropyFloor` が低い predicate を warning または reject にする | 地域粒度の安全性を情報量で評価する。 |
| proof kind に `simulated-envelope` / `predicate-runtime-only` / `cryptographic-zk` を明示する | 実ZKと envelope を混同しない。 |
| delivery eligibility と final delivery disclosure を別 proof scope にする | merchant に住所を渡さず、carrier だけに必要情報を渡す。 |
| nullifier domain が issuer / scope / epoch / purpose ごとに分離されることを検査する | cross-service linkability を減らす。 |
| proof bundle の common validity window 拒否を registry/aggregation 経路にも広げる | compatibility layer では実装テスト済み。古い proof と新しい proof の危険な合成を全経路で防ぐ。 |
| proof bundle 内の `commitment` と `nullifier` の同値衝突拒否を registry/chain anchor 経路にも広げる | compatibility layer では実装テスト済み。role collision と不可逆公開を防ぐ。 |
| public chain anchor に private field が混入した場合を拒否する | irreversible publication risk を下げる。 |
| unresolved AMT envelope から positive residence/delivery proof を作れないことを検査する | 意味論的未解決状態をZKで隠して通すことを防ぐ。 |
| AOID public reference だけでは ownership proof にならないことを検査する | public QR のなりすまし登録を防ぐ。 |

### 7.2 Leanで検証しやすいもの

| 形式化対象 | Leanでの形 |
| --- | --- |
| AMT/ZKP non-substitution | `SemanticValid -> Privacy` は成り立たない、`ZkValid -> AddressTruth` は成り立たない。 |
| Predicate privacy caveat | public predicate が injective なら private value は識別される。 |
| Minimum disclosure lemma | `Req(p) subset Attr(q)` なら目的評価に不要な属性は開示不要。 |
| Required attribute gate | 必須属性欠落なら proof issuance は不可能。 |
| Scope mismatch rejection | proof scope と expected scope が一致しないなら reject。 |
| Challenge mismatch rejection | challenge hash が違えば replay として reject。 |
| Common validity window | bundle の有効期間 intersection が空なら reject。 |
| Domain separation necessity | 同一 nullifier domain を複数目的で使うと linkability が残る。 |
| Positive proof cannot follow unresolved | unresolved outcome から positive residence/delivery proof は発行不可。 |

### 7.3 GIS/実験で検証すべきもの

| 検証対象 | 方法 |
| --- | --- |
| 国境内 proof | 国境 polygon dataset と hidden point membership の benchmark。 |
| 都市内 proof | 都市境界 dataset と population/address-density を組み合わせた anonymity analysis。 |
| 配送可能地域 proof | carrier zone / postal route / no-service area dataset による false positive/false negative 測定。 |
| 島・山地・砂漠・湿地・氷原 | sparse region で predicate が一意化しないかを測る。 |
| disaster relief zone | 避難所・仮設住宅・支援区域の temporal freshness を検証。 |
| same-address proof | 世帯・集合住宅・施設などで group predicate が過度に識別的でないかを測る。 |

### 7.4 暗号実装で検証すべきもの

| 対象 | 方法 |
| --- | --- |
| Range/threshold proof | Noir/Circom/Rust-zkVM で quality threshold / freshness window を回路化。 |
| Point-in-bbox / circle | Rust-WASM predicate を回路または zkVM に移植。 |
| Point-in-polygon | 効率、境界誤差、antimeridian、holes、multi-polygons を検証。 |
| Revocation membership | Merkle proof / sparse Merkle tree / accumulator を比較。 |
| Credential signature verification | 署名検証を回路内で行うか、外部credential verification + commitmentにするか比較。 |
| Nullifier uniqueness | domain separation、salt、epoch、scope の安全性監査。 |
| Proof aggregation |複数 proof を bundle 化した時の proof size、verification time、linkability を測る。 |

## 8. 追加すべき予想

ここでは、論文に追加すると強くなるが、まだ検証が必要な予想を整理する。

### 予想 Z1: 住所述語匿名集合予想

**主張。** 公開述語 \(P\) が対象母集団 \(D\) 上で十分大きな匿名集合を持つなら、ZK Address Proof は住所本文を公開する方式より再識別リスクを低減する。

\[
\operatorname{PrivacySafe}(P,D,k) \iff |\{q\in D : P(Attr(q))=1\}| \ge k.
\]

**検証方法。**

- Lean では「匿名集合が1なら識別可能」という反例を形式化する。
- GIS/人口データでは country/city/delivery zone ごとに anonymity set を推定する。
- 実装では `anonymitySetMin` と `entropyFloor` を proof policy に入れる。

**注意。** これは ZK の暗号安全性ではなく、公開述語の意味論的安全性である。

### 予想 Z2: 目的スコープ分離による非リンク性予想

**主張。** nullifier、commitment、challenge、issuer、epoch を purpose scope ごとに domain-separated にすると、同一ユーザー・同一住所の cross-service linkability は低下する。

\[
N_{p} = H(domain_p \Vert secret \Vert epoch \Vert salt)
\]

であり、\(domain_p \ne domain_{p'}\) なら \(N_p\) と \(N_{p'}\) は同一性を直接示さない。

**検証方法。**

- 実装テストで scope/epoch/issuer 違いの nullifier が異なることを確認する。
- proof bundle で同一 single-use nullifier 再利用を拒否する。
- 暗号監査で salt と domain の混同がないか確認する。

### 予想 Z3: 二段階配送開示予想

**主張。** EC checkout では delivery eligibility proof だけを提示し、購入後に carrier-only encrypted disclosure を行う二段階方式は、通常の住所先出し方式より住所曝露面を減らし、配送成功率を大きく損なわない。

```text
merchant stage:
  delivery eligible = true

carrier stage:
  minimum necessary delivery address disclosure
```

**検証方法。**

- checkout UX 実験。
- 住所入力タイミング比較。
- 配送失敗率、キャンセル率、再配達率、問い合わせ率を測る。

### 予想 Z4: AMT gate 付き証明健全性予想

**主張。** unresolved、ambiguous、low-quality の AMT envelope から positive residence/delivery proof を発行しない rule を導入すると、false positive な住所証明が減る。

**検証方法。**

- 実装テストで unresolved から positive proof を拒否する。
- AMT candidate/cluster quality と proof issuance failure の関係を測る。
- false eligibility dataset を作る。

### 予想 Z5: 鮮度・失効必須性予想

**主張。** Residence、AOID ownership、delivery eligibility は、freshness と revocation を必須にしないと stale proof replay に弱い。

**反例。**

引っ越し済みユーザーが古い居住 credential を使い続ける。

**検証方法。**

- stale freshness window の rejection は現行テスト済み。
- 今後、実 issuer rotation / revocation propagation delay を測る。

### 予想 Z6: 最小開示優越予想

**主張。** 用途 \(p\) に必要な属性集合 \(Req(p)\) が \(Attr(q)\) に含まれるなら、\(Req(p)\) だけを証明する方式は、住所全文開示方式より情報漏洩が少なく、同じ意思決定を可能にする。

\[
Req(p)\subseteq Attr(q) \Rightarrow Decision_p(q)=Decision_p(Req(p)).
\]

**検証方法。**

- Lean で必要属性ゲートを形式化する。
- 用途別に必要属性表を作る。
- UI/API で不要属性を出さないことをテストする。

### 予想 Z7: Proof bundle 互換性予想

**主張。** proof bundle が common scope、common challenge、common validity window、nullifier collision absence、private material absence を満たす場合、複数 proof family を一つの操作に安全に合成しやすくなる。

**検証方法。**

- 現行テストで一部検証済み。
- Lean で policy-gate level の定理は検証済み。
- 今後、実 ZK proof aggregation で検証する。

### 予想 Z8: 回路表現可能性境界予想

**主張。** 住所述語のうち、quality threshold、freshness window、bbox/circle membership、Merkle non-revocation は比較的回路化しやすい。一方、full geocoding、large polygon membership、文字列曖昧性解消、libpostal相当処理、配送ルート最適化は回路化しにくく、credential化または zkVM 化が適する。

**検証方法。**

- Noir/Circom/Rust-zkVM で proof size と constraint 数を比較する。
- TypeScript envelope、Rust-WASM predicate、zkVM proof の分担を決める。

### 予想 Z9: メタデータ漏洩境界予想

**主張。** proof transcript が witness を隠しても、発行時刻、issuer、region id、challenge reuse、IP、user agent、bundle composition から再識別が起き得る。metadata minimization と batching は ZK住所証明の実用プライバシーを改善する。

**検証方法。**

- proof logs / API logs / telemetry の private field scan。
- issuer/region/bundle metadata の uniqueness analysis。
- batching、delayed submission、privacy-preserving relay の比較。

### 予想 Z10: Humanitarian privacy utility 予想

**主張。** 災害・難民・仮設住所では、住所全文の公開より、支援資格・配送可能性・重複防止の ZK-ready proof の方が安全性と支援到達性のバランスがよい。

**検証方法。**

- 災害支援ユースケースで必要属性を定義する。
- duplicate nullifier と proof freshness を使った支援重複防止を試験する。
- 被災者住所の再識別リスクを評価する。

## 8.5 予想の現在検証ステータス

上記 Z1--Z10 は、すべて同じ成熟度ではない。現時点で「証明済み」と書けるもの、「実装テスト済み」と書けるもの、「まだ予想として残すべきもの」を分ける。

| 予想 | 現在の検証状態 | 根拠 | 論文での扱い |
| --- | --- | --- | --- |
| Z1 住所述語匿名集合予想 | 部分検証済み / 実装未導入 | Lean の `predicate_proof_collision_hides_private_value` と `injective_public_claim_identifies_private_value` は、粗い述語では witness が一意でないこと、狭すぎる述語では再識別されることを示す。`anonymitySetMin` と `entropyFloor` は未実装。 | 「暗号ではなく公開述語の意味論的安全性」として定義し、実装課題を明記する。 |
| Z2 目的スコープ分離による非リンク性予想 | 実装部分検証済み | `zkProofCompatibility.test.ts` は scope/challenge mismatch、duplicate nullifier、cross-role collision を拒否する。暗号的非リンク性は未監査。 | domain separation は必須設計として書ける。非リンク性の完全保証は予想扱い。 |
| Z3 二段階配送開示予想 | 未検証 | merchant stage と carrier stage のUX/配送実験は未実施。 | ユースケース・実験計画として残す。 |
| Z4 AMT gate付き証明健全性予想 | 部分検証済み | `pidIssuanceAudit.test.ts` は unresolved PID の監査証明を拒否する。Lean の `IssueAdmissible` 系定理は候補・score・quality・freshness・risk gate を要求する。全 proof family への共通適用は未完。 | AMT gate を設計原則として採用し、全proof familyへの実装拡張を課題にする。 |
| Z5 鮮度・失効必須性予想 | 実装検証済み / 運用未検証 | freshness/revocation tests は stale/revoked/tampered proof を拒否する。issuer rotation や失効伝播遅延は未検証。 | stale replay 反例と、必須gateとして書ける。運用SLAは未検証。 |
| Z6 最小開示優越予想 | 部分検証済み | Lean の `missing_required_attribute_prevents_attribute_gate` と実装の private material stripping tests が根拠。用途別 decision equivalence は未検証。 | 最小開示原則として書けるが、「同じ意思決定を可能にする」は用途条件付きにする。 |
| Z7 Proof bundle互換性予想 | Lean + 実装検証済み / 実ZK集約未検証 | `accepted_proof_bundle_exposes_no_private_material`、`accepted_proof_bundle_requires_domain_separation`、`zkProofCompatibility.test.ts` の common scope/challenge/validity/nullifier/collision tests。 | envelope/bundle policy としては検証済み。proof aggregation の暗号安全性は別課題。 |
| Z8 回路表現可能性境界予想 | 実装方針検証済み / 回路未検証 | `zkProofRuntime.test.ts` は TypeScript を envelope 層に置き、Noir/Circom/Rust-zkVM を優先する方針を検査する。実回路の constraint 数は未計測。 | 回路化ロードマップとして書く。性能主張はしない。 |
| Z9 メタデータ漏洩境界予想 | 未検証 | ログ、telemetry、issuer/region/bundle metadata の uniqueness scan は未実施。 | セキュリティ分析と検証計画に置く。 |
| Z10 Humanitarian privacy utility予想 | 未検証 | 災害支援・難民支援のfield simulationは未実施。 | 応用仮説として残し、実証研究を要求する。 |

この表により、ZKP論文では次の分類を採用する。

```text
verified theorem:
  Leanで証明済みの論理命題

verified implementation invariant:
  TypeScript envelope/policy testsで確認済みの実装不変条件

partially verified conjecture:
  Leanまたは実装の一部根拠はあるが、GIS・暗号回路・運用実験が未完の主張

unverified operational hypothesis:
  まだ実運用・UX・field simulation・外部監査が必要な主張
```

## 9. 論文に追加すべき章・節

既存の AMT II / ZK論文には、次の節を追加すると強くなる。

1. **Claim Taxonomy**
   - semantic claim
   - credential claim
   - cryptographic claim
   - policy claim
   - anonymity claim
   - operational claim

2. **Proof Status Labels**
   - `proof-ready-envelope`
   - `predicate-runtime-only`
   - `cryptographic-zk-circuit`
   - `audited-production-proof`

3. **Anonymity and Entropy Gate**
   - \(k\)-anonymity
   - entropy floor
   - one-house polygon counterexample

4. **AMT Gate Before Proof Issuance**
   - unresolved/ambiguous/low-quality から positive proof を発行しない。

5. **Two-Stage Delivery Disclosure**
   - merchant eligibility
   - carrier-only disclosure

6. **Circuit Representability**
   - threshold
   - region membership
   - revocation
   - credential verification
   - string/GIS heavy predicates

7. **Metadata Leakage**
   - issuer
   - timing
   - region
   - challenge
   - bundle composition

8. **Proof Bundle Safety**
   - scope
   - challenge
   - common validity
   - nullifier/commitment collision
   - private material stripping

## 10. 実装に追加すべき項目

優先度順に実装候補を並べる。

| 優先度 | 実装項目 | 理由 |
| --- | --- | --- |
| S | proof status label | envelope と実ZKを混同しないため。 |
| S | anonymitySetMin / entropyFloor policy | 狭すぎる述語による再識別を防ぐため。 |
| S | unresolved AMT gate for positive proof issuance | 意味論的に未解決な住所をZKで正当化しないため。 |
| S | proof bundle common validity enforcement | 実装テスト済み。今後は実ZK aggregation と registry 運用でも継続監査する。 |
| A | merchant/carrier two-stage delivery proof API | 買い物Agent・ECで最小開示を実現するため。 |
| A | circuit representability manifest | どの述語が回路化済みかを明示するため。 |
| A | metadata leakage audit | ZK transcript外の漏洩を減らすため。 |
| A | chain anchor private-field scanner | irreversible chain publicationを安全にするため。 |
| B | ZK circuit prototype for threshold + bbox | 最初の本物ZK化対象として小さいため。 |
| B | polygon membership benchmark | 地域所属proofの実用性を測るため。 |

## 11. 本文への統合方針

### 11.1 日本語版

日本語版は `docs/zero-knowledge-address-proofs-from-address-morphism-theory-ja.md` を母艦にする。今回の資料から次を追加する。

- 第3章「非主張と信頼境界」に proof status label を追加。
- 第4章または第12章に匿名集合・エントロピー gate を追加。
- 第6章の主関係に `RepresentableInCircuit(P)` を追加。
- 第8章の証明ファミリに proof status と検証方法を表で追加。
- 第10章に bundle compatibility の検証済み結果を追加。
- 第15章に今回の 101 tests / Lean pass を追加。
- 第16章に回路化ロードマップを追加。

### 11.2 英語版

英語版は `docs/address-morphism-theory-ii-zero-knowledge-address-predicates.md` を親にする。今回の資料から次を追加する。

- "Claim Taxonomy and Proof Status Labels"
- "Anonymity-Set and Entropy Leakage Conditions"
- "AMT-Gated Proof Issuance"
- "Two-Stage Delivery Eligibility"
- "Circuit Representability Frontier"
- "Verification Matrix"
- "Conjectures and Experimental Roadmap"

### 11.3 AMT本体

AMT本体では ZKP の詳細を書きすぎない。AMT本体には次だけを置く。

```text
AMT supplies semantic envelopes and attribute maps that can be consumed by
privacy-preserving proof systems. ZK address predicates are a companion layer,
not part of AMT's core semantic validity.
```

詳細は AMT II に分離する。

## 12. 結論

住所写像論のゼロ知識証明関連資料は、すでに次の形に整理できる。

```text
AMT I:
  住所意味論、候補生成、クラスタ、unresolved、PID、履歴、属性写像

AMT II:
  住所由来の属性を、住所を出さずに証明する companion framework

Current implementation:
  ZK-ready envelope、credential、scope、challenge、freshness、revocation、
  nullifier、proof bundle compatibility

Future cryptographic layer:
  Noir / Circom / Halo2 / Rust-zkVM / audited circuits
```

今後の最重要課題は、次の三つである。

1. `proof-ready envelope` と `cryptographic ZK proof` を明確にラベル分けする。
2. 匿名集合・エントロピー条件を入れて、ZKでも再識別される述語を防ぐ。
3. 最初の小さな ZK 回路として、quality threshold、freshness window、bbox/circle membership、revocation membership を実装・監査する。

これにより、住所写像論 II は「雰囲気としてのプライバシー論」ではなく、意味論、credential、暗号、政策、運用を分離した本格的な privacy-preserving address predicate framework として書ける。
