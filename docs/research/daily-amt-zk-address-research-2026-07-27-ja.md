# Daily AMT / ZK Address Research — 2026-07-27

## 今日の結論

今日の最重要ギャップは、正規化済み AddressQL checkpoint commitment と外部 ZK 検証結果の間に、検証対象を改変不能に結ぶ **検証 receipt 関係** がまだないことである。

現在の実装は `proofArtifact.publicInputCommitment` を必須にするが、`external_verifier_receipt` も文字列の `proofCommitment` と `publicInputCommitment` だけで表す。したがって schema acceptance は、外部検証器が実際に同じ commitment、circuit、verification key、policy、challenge、expiry を検証したことを意味しない。これは意図された non-claim と整合する一方、次のプロトコル実装境界として明示する必要がある。

本調査では production traffic、実 recipient、raw personal address、private key、witness、prover job を扱っていない。使用した住所・root・commitment は repository 内の synthetic fixture のみである。

## 新しい理論アイデア

### 1. Attested Verification Morphism

statement を `s`、部分的 canonical encoder を `C_v`、commitment を `h = H(C_v(s))`、proof を `π`、verification key を `vk`、policy を `p`、外部 receipt を `r` とする。

外部検証器は単なる真偽値ではなく、次の型付き射を発行するものとして扱う。

`VerifyAttest_v(vk, π, h, p, challenge, t) ⇀ r`

受理条件は少なくとも次の積である。

`Accept(s, r) := Canonical_v(s) ∧ h = H(C_v(s)) ∧ ReceiptAuthentic(r) ∧ ReceiptBinds(r, v, vk, h, p, challenge, expiry) ∧ ProofVerified(r) ∧ SemanticValid(s)`

重要なのは、`ProofVerified(r)` だけから `ReceiptBinds(...)` を導けないことである。証明の正しさと、AGID が意図した address statement を証明したことは別の proof obligation である。

### 2. Receipt naturality

Node、Rust、Python の各実装を `C_Node`, `C_Rust`, `C_Python` とする。共通の抽象 statement `s` に対し、相互運用性には hash の一致だけでなく preimage byte の一致が必要である。

`C_Node(s) = C_Rust(s) = C_Python(s)`

そのうえで receipt 化が commitment を保存することを要求する。

`commitment(receipt(verify(π, C_i(s)))) = H(C_i(s))`

この可換性が破れると、同じ JSON 的意味から異なる proof public inputs を作る実装差、または別 statement の receipt を流用する置換攻撃が生じる。

### 3. Acceptance の単調性

receipt の検証軸は平均点にしない。以下のどれかが `block` なら、carrier、postal、customs の別軸が強くても全体を `accept` に昇格させない。

- canonical encoding/version
- circuit / verification-key identity
- public-input commitment equality
- verifier-policy hash
- challenge/audience/purpose binding
- freshness/expiry
- issuer/revocation/checkpoint authority product
- cryptographic verification result

これは AMT の abstention と cross-border authority product を、実際の ZK verifier 境界へ接続する。

## 見つかった弱点と反例

1. **Receipt substitution**: proof A が正しく検証済みでも、その receipt の横に statement B の `publicInputCommitment` を置ける。現 schema は receipt 内部の署名対象を解析・照合しない。
2. **Verifier-policy substitution**: public signal に `verifierPolicyHash` はあるが、外部 receipt がその hash を検証対象として含んだ証拠がない。
3. **Verification-key confusion**: `proofArtifact` に circuit id、verification-key digest、backend id、proof-system id がない。同じ byte blob を異なる verifier contract として解釈する余地がある。
4. **Success-only receipt**: `verified=true` 相当だけでは、どの public inputs、時刻、challenge、policy を検証したか分からない。
5. **Cross-language blind spot**: 固定 checkpoint digest vector はあるが、完全な binary preimage と full-statement public-input commitment の Node/Rust/Python 共通 vector はまだない。
6. **Unicode sorting ambiguity**: NFC gate はあるが、配列の `.sort()` / `localeCompare()` の仕様を protocol byte ordering として固定していない。特に authority ref sorting は locale-sensitive API に依存する。現在の authority kind は ASCII enum なので直ちに衝突しにくいが、protocol primitive としては UTF-8 bytewise ordering を規定すべきである。
7. **Low-entropy dictionary attack**: commitment が正しく receipt に結ばれても、候補 zone や referent が小さい場合、公開 commitment の総当たり耐性は得られない。canonicalization と confidentiality は別問題である。

## 提案する数学的・仕様上の修正

`ExternalVerifierReceiptV1` を次の必須フィールドで定義する候補がよい。

- `receiptVersion`
- `proofSystemId`, `backendId`, `circuitId`, `verificationKeyDigest`
- `proofCommitment`
- `publicInputCommitment`
- `bindingVersion`, `encodingProfile`
- `verifierPolicyHash`, `claimKind`, `purpose`, `audience`
- `challengeHash`, `nullifierDomain`, `proofExpiry`
- `checkpointAuthorityProductDigest`
- `verificationResult`
- `verifiedAt`, `receiptExpiry`
- `verifierIdentity`, `signatureAlgorithm`, `signature`

署名対象は上記の deterministic binary representation 全体とし、自由形式 JSON の再 serialize に依存しない。RFC 8949 の deterministic CBOR は最短表現、map key ordering、数値表現などを明示的に制限するため候補になる。ただし既存の AGID tagged length-prefix encoding から移行するなら、version を上げ、両方式を暗黙同値扱いしない。

COSE_Sign1 を使う場合、protected header、payload、`external_aad` の責務を AGID profile で固定する。特に public-input commitment や audience を非認証 unprotected header のみに置かない。

Lean 側の候補定義:

- `CanonicalEncoding : Statement → Option Bytes`
- `ReceiptBinds : Receipt → Statement → Prop`
- `ReceiptAuthentic : Receipt → Prop`
- `VerifierAccepted : Receipt → Prop`
- theorem shape: `AcceptedReceipt r s → receipt.publicInputCommitment = H(C(s))`
- countertheorem shape: `VerifierAccepted r ↛ ReceiptBinds r s`

hash collision resistance、signature unforgeability、SNARK soundness、trusted/transparent setup、external verifier correctness は公理・外部仮定として分離し、Lean が実証したとは記述しない。

## 実装候補

優先順:

1. `addressQlExternalVerifierReceipt.ts` を追加し、synthetic receipt の canonical validation と binding verification を実装する。
2. `runAddressQlVerifierHook` の返却を schema acceptance と receipt acceptance に分離する。現在の `verified: false` は維持し、署名・proof verification adapter がない限り true にしない。
3. `proofArtifact.publicInputCommitment` と receipt 内 commitment の不一致を必ず block する。
4. full statement の binary preimage hex、checkpoint digest、public-input commitment を一組にした versioned fixture JSON を作る。
5. Node の fixture を Rust/Python の独立実装で再生成する CI conformance test を追加する。単に期待 hash をコピーするテストでは不十分。
6. sorting を locale 依存から UTF-8 bytewise comparator へ変更し、NFC、空文字、最大長、U+0000、非 BMP、unsafe integer、最大 fan-out を vector 化する。
7. cross-border vector として、customs receipt substitution、carrier-only receipt reuse、異なる boundary epoch、異なる translation profile、disputed-border `viewId` mismatch を追加する。

## 今日の検証

次の synthetic test 群は 42/42 pass:

- AddressQL checkpoint binding
- address-state checkpoint
- AddressQL ZK hooks
- verified address translation
- Postal Zone Designer

この pass は schema、canonicalization、synthetic transition、privacy gate の回帰がないことを示す。実 SNARK、signature、Merkle inclusion/consistency、receipt authenticity の検証を示さない。

## 一次仕様との対応

- RFC 8949 は deterministic CBOR について preferred/shortest serialization、map ordering、数値表現の追加制約が必要であることを示す: https://www.rfc-editor.org/rfc/rfc8949.html
- RFC 9052 は COSE signing structure が protected headers、payload、external authenticated data を署名計算へ結ぶ構造を定義する: https://www.rfc-editor.org/rfc/rfc9052.html
- Noir の recursive proof API でも proof と associated public inputs は別入力であり、backend 提供 verification library と proof type の正しい設定が必要とされる: https://noir-lang.org/docs/libraries/standard_library/recursion

## 追加検証が必要な点

- Node/Rust/Python が完全に同じ preimage bytes を生成すること
- receipt signature と key rotation/revocation の運用
- proof system ごとの public-input ordering と field-element encoding
- circuit id / verification-key digest の downgrade・substitution 耐性
- receipt TTL と proof expiry/checkpoint freshness の整合
- canonical decoding の rejection behavior と resource limits
- low-entropy postal zone に対する commitment salt/secret-binding 設計
- disputed-border multi-view の明示的 `viewId` と正当な並存規則

## 残余リスク

receipt binding は verifier compromise、悪意ある circuit、setup compromise、side channel、traffic analysis、carrier/customs collusion、adaptive query correlation、small-zone dictionary attack を解決しない。署名済み receipt は検証内容の監査可能性を上げるが、検証内容そのものが真であることは underlying proof、authority checkpoint、source quality に依存する。raw address を receipt や gossip log に含めないという privacy boundary は継続して必須である。
