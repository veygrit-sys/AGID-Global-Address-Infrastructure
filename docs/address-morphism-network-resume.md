# Address Morphism Network Resume

Last updated: 2026-06-07

## 目的

Address Morphism Network (AMN) は、住所写像論 (AMT) の候補生成、クラスタリング、未解決判定、履歴更新、PID 発行の流れを、外部から監査できる公開 envelope として扱うためのプロトコル層である。

現時点では暗号通貨や L1/L2 チェーンを先に作るのではなく、AGID/AOID アプリ内で再現可能な解決結果、公開コミットメント、証拠 root、proof bundle ID、registry record を生成する MVP として実装する。

## 位置づけ

AMN は住所写像論本体ではなく、AMT の解決過程を公開監査可能な形へ写す応用プロトコルである。AGID は公開地理・住所・地物の識別層、AOID は所有者管理の私的住所層、AMN はその解決過程・登録・監査を扱う envelope 層として分ける。

安全な読み方:

- AMN は「全住所を完全に一意化するネットワーク」ではない。
- AMN は「住所本文や AOID 本文をオンチェーンに載せる仕組み」ではない。
- AMN は「ZK 回路が完成済みである」という主張ではない。
- AMN は、policy hash、evidence root、workflow gate、commitment、proof bundle ID などを使い、解決過程を後から検証しやすくする層である。

したがって、ホワイトペーパーでは AMN を暗号通貨・分散台帳の大きな構想として書けるが、現在の実装済み主張は MVP の公開 envelope / registry / API surface に限定する。

## 実装済み MVP

- AMT 解決器から AMN resolution envelope を作成する。
- 生住所、候補ラベル、クラスタ本体、AOID、受取人、連絡先、厳密な私有座標は公開 envelope に出さない。
- 公開するのは `policyHash`、`evidenceRoot`、workflow gate、`proofBundleId`、PID/RPID/DPID、opaque commitment のみ。
- `candidate-generation`、`clustering`、`unresolved-gate`、`history-update`、`pid-issuance` の通過状態を envelope に記録する。
- in-memory AMN registry で envelope の登録、重複検出、検証、統計取得を行う。
- REST API と OpenAPI に AMN surface を追加した。

## API

- `POST /api/amn/resolve`
  - AMT 解決を実行し、AMN public envelope を生成して registry に登録する。
- `POST /api/amn/registry/:envelopeId/verify`
  - 登録済み envelope の有効性を検証する。
- `GET /api/amn/registry/stats`
  - AMN registry の公開統計を返す。

`/api/v1` 用のクライアント helper も追加済み。

## セキュリティ境界

AMN は public-by-design の層として扱う。

- 公開 API は秘密鍵、AOID 本文、受取人情報、電話番号、部屋番号、配送指示を保存しない。
- registry record は envelope 全体を保存せず、公開 claim から作った record と commitment hash のみを保持する。
- proof bundle、revocation/freshness、Polkadot anchor と接続する場合も、チェーン側に載せるのは commitment、policy hash、evidence root、proof bundle ID のみに限定する。
- ZK 回路は後段で導入し、まずは envelope の入力/出力契約を固定する。

## ZK/Polkadot への接続方針

AMN envelope は、将来次の証明に接続できる。

- PID 発行監査: 規定の workflow gate を通過したことだけを証明する。
- 重複登録防止: 同一 scope 内で nullifier が再利用されていないことを証明する。
- AOID 所有証明: 秘密鍵や credential を持つことだけを証明する。
- 地域所属証明: 国、都市、配送可能領域などへの所属だけを証明する。
- 品質しきい値証明: 解決品質が内部基準以上であることだけを証明する。

Polkadot 連携は、AMN registry record を直接オンチェーン化するのではなく、公開 commitment と root を anchor する用途に限定するのが安全である。

## ホワイトペーパー上の安全な言い換え

強い表現にするなら、「世界初」や「完全な一意性」を前面に出すより、次のように書く方が堅い。

> AMN is a verifiable geo-semantic registry layer that turns uncertain human address expressions into auditable resolution envelopes. It does not claim that every address can be absolutely resolved; instead, it records the evidence, policy, confidence, unresolved status, and identifier issuance process in a privacy-preserving public form.

日本語では次の表現が安全。

> AMN は、曖昧で変動する住所表記を、証拠・方針・品質・未解決状態を含む監査可能な解決 envelope に変換する地理意味論レジストリ層である。すべての住所を無条件に一意化すると主張するのではなく、どの根拠で、どの品質で、どの識別子を発行したかを秘匿性を保って公開検証可能にする。

## 今後の強化点

- registry を永続化し、署名付き envelope と replay protection を追加する。
- ZK proof bundle registry と AMN envelope を双方向に関連付ける。
- Polkadot adapter へ AMN commitment anchor stage を追加する。
- 住所検証エンジンの品質スコアと AMN の `qualityThreshold` を接続する。
- 買い物 Agent/MCP が「配送可能性だけ」を問い合わせられる AMN tool を追加する。
- AMT 論文側には、AMN envelope を「実装可能な監査モデル」として別節に置く。
