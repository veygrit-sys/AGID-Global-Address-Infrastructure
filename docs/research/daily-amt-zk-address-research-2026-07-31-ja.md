# AMT / ZK Address 日次研究報告（2026-07-31）

## 新しい理論案

外部 ZK 検証を、次の「ライフサイクル付き検証 Meet」として扱う。

\[
Accept =
SchemaSafe \land ReceiptBound \land CryptoExecuted
\land KeyLive \land ChallengeConsumed
\]

これは AMT の写像を、証明生成だけでなく、検証鍵の有効時点と単回チャレンジの状態遷移まで含む部分写像として扱う案である。どの正の要素も、他要素の失敗を上書きしてはならない。

## 発見した弱点・反例

- 昨日までの外部検証アダプタは、鍵失効・停止とチャレンジ消費を独立に検査できても、最終 accept の必須条件にはしていなかった。
- 正しい署名付き receipt でも、検証時点で鍵が失効済みなら受理できない。
- 正しい receipt でも、チャレンジが issued のまま、または別 proof/public input に消費されたなら replay を排除できない。
- `state = consumed` というスナップショットだけでは、二つの並行要求がともに成功した後で記録される二重消費を排除できない。原子的 compare-and-set、一意制約、線形化点、確定性が別の証明義務になる。
- 国際配送では carrier、customs、translation、postal-zone の各 authority を別軸の積として維持する必要がある。一軸の成功は別軸の失効・replay を修復しない。

## 数理的改良

`ChallengeConsumed` を単なる述語でなく、状態機械

\[
issued \rightarrow consumed(proof, publicInput, verifier, audience, purpose)
\]

上の一回限りの遷移として定義する。必要条件は、同じ challenge に対する成功遷移が高々一つであること、消費レコードが receipt の全 replay domain に一致すること、観測が検証後に確定していることである。

鍵については `KeyLive(k,t)` を、active 状態、有効区間、認証済み status root、検証時刻以後の観測の積として定義する。暗号学的健全性、台帳合意、時刻の信頼性は明示的な仮定として残す。

## 実装候補と実施内容

- `addressQlExternalVerifierAdapter` に鍵ライフサイクル証拠とチャレンジ消費証拠を必須引数として接続した。
- schema、receipt、lifecycle の全判定を最終 accept の連言にした。
- 失効鍵、未消費 challenge、public-input 置換に対する合成反例を追加した。
- 次候補は、ストレージ非依存の `ChallengeConsumptionStore` 契約と並行二重消費ベクトル、authority-product receipt の most-restrictive 合成である。

## 検証結果

対象 8 モジュールの合成テスト 60/60 件が成功した。実データ、本番通信、秘密鍵、witness、実 proof、prover job は使用していない。

## 残存リスク

TypeScript ゲートは署名、Merkle proof、ZK proof、台帳合意、原子的ストレージ、回路/VK の安全性を検証しない。悪意ある verifier/adapter、split ledger、時計操作、低エントロピー郵便区域の辞書攻撃、適応的照会、通信量解析、carrier/customs 結託も残る。
