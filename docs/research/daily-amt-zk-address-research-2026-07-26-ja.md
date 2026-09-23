# AMT / ZK Address Research — 2026-07-26

## 新しい理論アイデア

AMT の証明 statement は、意味だけでなく「正準化可能性」を満たす必要がある。そこで production acceptance を

`SemanticValid ∧ Canonicalizable ∧ CommitmentMatches ∧ CryptographicallyVerified`

の積として扱う。`Canonicalizable` は NFC Unicode、非負 safe integer、集合として一意な authority/zone、有限サイズ制約を含む。これは hash の衝突耐性とは別の proof obligation であり、異なる言語・runtime が同じ byte string を構成するための前提である。

## 見つかった弱点・反例

- UTF-8 length-prefixing だけでは、見た目が同じ NFC/NFD 文字列が異なる commitment になる。
- JavaScript の unsafe integer は別 runtime の任意精度整数と異なる値を encode し得る。
- 重複 source zone、重複 edge、過大な split/merge fan-out は parser 選択差、DoS、検証漏れを生む。
- duplicate authority ref は曖昧性攻撃なので manual review では弱く、block が妥当。
- fixed cross-language vector がなければ、仕様に従った独立実装の一致を conformance test できない。

## 提案した数学的改善

正準化関数 `C : Statement ⇀ Bytes` を部分関数として定義し、受理には `C(s)` の存在を要求する。さらに、実装可能な範囲で

`C(s₁) = C(s₂) → s₁ = s₂`

を示す。ただし SHA-256 digest の injectivity は主張せず、`H(C(s))` の安全性は collision resistance 仮定に分離する。zone transition は有限関係で、source の一意性、edge の一意性、totality、target closure、fan-out 上限を同時に課す。

## 実装候補と今回の変更

- `addressQlCheckpointBinding` に NFC、safe integer、UTF-8 byte 長、authority 数、zone 数、fan-out、重複 key/edge の gates を追加。
- 曖昧な authority ref と正準化不能入力を block に変更。
- 日本語を含む固定 SHA-256 checkpoint vector を追加し、Rust/Python/Lean 側の独立実装用 oracle とした。
- 次候補は canonical preimage の versioned binary fixture 公開、Rust/Python verifier、AddressQL external receipt との明示的 binding。

## 必要な検証

- Node 以外の Rust/Python 実装で固定 vector と完全 statement commitment が一致すること。
- JSON object key order、surrogate、NUL、最大 UTF-8 長、最大 zone 数の境界 vectors。
- Circom/Noir/RISC-style verifier が同じ public input digest を実際に拘束すること。
- Lean では pre-hash encoding injectivity、authority functionality、有限 transition 制約を定理化すること。
- cross-border では issuer/postal/translation/carrier/customs 各 authority の view id を保持し、係争地域の合法的 multi-view と duplicate-ref 攻撃を区別すること。

## 残存リスク

正準化は raw address leakage、低 entropy zone の辞書攻撃、traffic analysis、悪意ある authority、root fork、carrier/customs collusion を解決しない。現在の hash と checkpoint verifier は protocol fixture であり、監査済み ZK circuit や署名・Merkle proof verifier ではない。実住所、受取人、秘密鍵、witness、production traffic は扱っていない。
