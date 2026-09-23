# AMT / ZK 住所研究 日次ノート — 2026-07-25

## 範囲

前回の checkpoint binding を canonical encoding と proof public-input binding へ進めた。合成識別子のみを使い、実住所、実受取人、秘密鍵、witness、production traffic は扱っていない。

## 新しい理論案

住所 proof の公開入力を値の集合ではなく型付き transcript

`C = H(domain || Enc(version, claim, purpose, authority product, transition))`

への commitment とする。`Enc` は各 tag/value を UTF-8 byte length 付きで符号化し、authority ref は正規順序へ整列する。これにより、同じ意味の authority 集合は入力順序に依存せず、異なる claim、purpose、root、checkpoint、boundary epoch、zone transition、referent は同じ commitment を共有できない。

AMT 上では proof の受理義務を `VerifyCryptography(P) ∧ Commitment(P)=C(B) ∧ VerifyBinding(B)` と分離する。暗号 proof が正しくても binding commitment が不一致なら受理しない。

## 弱点・反例

1. `a|b` 型の区切り文字連結は field 内の区切り文字と構造上の区切りを区別できない。
2. root だけを commitment して claim/purpose を拘束しなければ、delivery proof を address-login 等へ再利用できる。
3. transition の epoch だけを拘束して写像・referent を拘束しなければ、同一 proof に別 split/merge を添付できる。
4. 同じ authority kind の ref が複数あると、検証器ごとの first/last 選択差で曖昧性が生じる。
5. 今回の SHA-256 commitment は protocol fixture であり、SNARK circuit の public input や署名済み receipt へ実際に接続されていない。

## 数学的精緻化

- `Canonical(B)`：field tag、byte length、値、正規順序が一意。
- `PurposeBound(P,B)`：claim kind と purpose が proof commitment に含まれる。
- `AuthorityFunctional(B)`：必要 authority kind ごとに ref はちょうど一つ。
- `TransitionBound(P,T)`：source/codomain、全写像、epoch、翻訳前後 referent を同時に拘束。
- `SubstitutionSafe(P,B,B')`：`B ≠ B'` なら collision resistance の仮定下で `C(B) ≠ C(B')`。

最後の性質はハッシュ衝突耐性を仮定する条件付き主張であり、今回のテストは証明ではない。

## 実装候補・今回の成果

- `addressQlCheckpointBinding.ts` の checkpoint digest を length-prefixed、domain-separated SHA-256 へ変更。
- statement binding 全体の `publicInputCommitment` 生成・照合を追加。
- ref 順序正規化、transition relation と referent の完全拘束、authority 重複検出を追加。
- 区切り文字曖昧性、purpose/root substitution、transition 差替え、重複 authority の合成 conformance tests を追加。
- 関連 39/39 tests と `git diff --check` が成功。

## 検証が必要

- canonical CBOR または確定 JSON profile との相互運用ベクトル
- Unicode normalization、整数上限、重複 key、巨大入力、異なる実装言語での byte-for-byte parity
- proof circuit / recursive receipt が commitment を公開入力として実際に検証すること
- Lean での encoding injectivity（hash 前）と authority functional relation の形式化
- 紛争国境の複数 view を、重複攻撃ではなく明示的な view-id 付き直和として扱う定義

## 残余リスク

SHA-256 の利用だけでは署名、Merkle inclusion、SNARK soundness、issuer 正当性を保証しない。正規化規則の実装差、hash agility、巨大 transition による DoS、commitment metadata の相関、低匿名性 zone、悪意ある authority の一貫した虚偽は残る。production 利用には audited circuit/receipt binding、上限付き schema、複数言語 conformance、privacy budget、multi-view governance が必要である。
