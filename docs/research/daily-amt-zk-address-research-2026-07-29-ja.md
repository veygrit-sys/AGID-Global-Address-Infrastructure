# AMT / ZK 住所研究 日次レポート — 2026-07-29

## 新しい理論案

外部 ZK 検証を **合流射（Verification Join）** として扱う。AddressQL の意味論・
公開面検査を `S`、外部検証レシートの真正性・束縛・暗号検証を `R` とすると、
受理は `Accept(S, R) := Safe(S) ∧ Bound(R, S) ∧ Authentic(R) ∧ CryptoOK(R) ∧ Fresh(R)`
である。`S` と `R` のどちらも、他方の失敗を昇格させてはならない。

配送、税関、翻訳、郵便ゾーンの複数レシートは一つの平均スコアにせず、権限軸ごとの
積として保存し、最も制限的な結果を採用する。

## 発見した弱点・反例

- 従来の AddressQL 外部 hook は常に `verified: false` で安全だったが、実レシート判定へ
  接続する明示的な合成契約がなかった。
- 正しいレシートでも、入力に raw-address 相当フィールドが混入すれば受理してはならない。
- 安全なスキーマでも、別の `publicInputCommitment` を持つレシートへの差し替えは拒否が必要。
- `result = verified` だけの成功レシートは、真正性確認と実暗号検証の証拠にならない。
- 現状の `authenticityVerified` と `cryptographicVerificationPerformed` は信頼された
  adapter の主張であり、それ自体を TypeScript が暗号学的に検証してはいない。

## 数学的改善

証明義務を次の独立した条件に分解する。

1. `SchemaSafe(S)`: 非公開素材がなく、claim/purpose/policy が正規形である。
2. `ReceiptBinds(R,S)`: proof、public input、policy、challenge、audience、purpose、
   circuit、VK、backend、binding version が一致する。
3. `ReceiptAuthentic(R)`: 検証者署名と鍵状態が有効である。
4. `CryptoExecuted(R)`: 指定回路・VK に対して実検証が成功した。
5. `TemporalSafe(R,S)`: レシートが現在有効で、証明期限を越えない。

単調性要件は、いずれかの条件を `false` にしたとき `accept` が維持されないことである。

## 実装候補

- `addressQlExternalVerifierAdapter.ts` を追加し、AddressQL 外部 hook とレシート検証を
  fail-closed に合成した。
- 合成成功、unsafe input、public-input 差し替え、成功フラグのみの四つの合成テストを追加した。
- 次候補は canonical signed-receipt bytes、verifier key rotation/revocation、
  challenge-consumption registry、税関・carrier レシートの権限軸別合成である。

## 必要な検証

- COSE 等による署名レシート検証と、鍵ローテーション・失効・アルゴリズム固定。
- challenge の一回消費または用途別 nullifier による二重利用防止。
- Node/Rust/Python 間の signed preimage 完全一致ベクトル。
- 本物の回路/VK に対する soundness、constraint、serialization、setup の監査。
- cross-border で carrier が成功しても customs/translation/postal-zone 軸の失敗を
  上書きしない conformance test。

## 残存リスク

悪意ある検証者・回路・setup、鍵侵害、root fork、低エントロピー zone の辞書攻撃、
適応的照会、時刻・通信メタデータ、carrier/customs の共謀は未解決である。今回も
実受取人、raw address、private key、witness、production traffic は使用していない。
