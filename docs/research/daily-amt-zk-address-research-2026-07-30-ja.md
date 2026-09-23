# AMT・ZK住所研究日報 — 2026-07-30

## 範囲

前日までの AddressQL 外部検証 adapter、外部検証レシート、checkpoint
binding、住所状態 checkpoint、VATT、Postal Zone Designer を確認した。本日は
実受取人情報、住所本文、秘密鍵、witness、proof、配送操作を使わず、検証鍵の
ライフサイクルと challenge 一回性だけを synthetic fixture で検討した。

参照した一次資料は、OpenID 系仕様における nonce と audience への
presentation binding、RFC 9449 の nonce による replay 抑止、W3C Bitstring
Status List v1.0 の失効・有効期間・群プライバシーである。

## 新しい理論案

外部検証を単なる `Verify(proof) = true` ではなく、次の時刻付き部分射として
扱う。

`VerifyLife : (Receipt, KeyStatus_t, ChallengeLedger_t) ⇀ Accepted`

定義域は以下の積である。

1. レシートと検証鍵の `verifierId` と `verificationKeyDigest` が一致する。
2. 検証時刻が鍵の有効区間内にあり、認証済み status が active である。
3. challenge が verifier、audience、purpose に結合される。
4. challenge が当該 proof commitment と public-input commitment に対して
   原子的に一度だけ消費される。
5. status evidence と consumption evidence が認証されている。

したがって最終受理は
`SchemaSafe ∧ ReceiptBound ∧ CryptoExecuted ∧ KeyLive ∧ ChallengeConsumed`
であり、いずれの成功も他の失敗を昇格させない。

## 見つかった弱点・反例

- 有効な署名付きレシートでも、検証後に失効済みと判明した鍵、または検証時に
  有効区間外だった鍵なら受理できない。
- challenge hash の一致だけでは一回性を証明しない。同じ challenge を別
  audience、別 purpose、別 public input へ再利用できる反例が残る。
- `active` という文字列だけでは不十分で、status root、取得時刻、認証結果が
  必要である。検証時刻より古い status snapshot は TOCTOU を残す。
- challenge を `consumed` とするだけでは不十分で、消費対象の proof と
  public-input commitments が一致しなければ別証明による先取りが可能である。
- 国境越え配送では carrier、customs、postal-zone、translation の各 authority
  を積として保持すべきであり、carrier 側の成功で customs 鍵失効を平均化して
  はならない。
- status list や challenge ledger を細粒度で照会すると、住所本文がなくても
  小地域・国境処理・利用頻度を相関できる。

## 提案した数学的精緻化

- 鍵状態を `K(k,t) ∈ {active,suspended,revoked,retired,unknown}` とし、
  受理条件を `K(k,t_verify)=active` に限定する。
- challenge ledger を集合ではなく線形化可能な部分関数
  `Consume : Challenge ⇀ (proofCommitment, publicInputCommitment)` とする。
  同一 challenge に二つの像があれば安全性違反である。
- freshness は `checkedAt ≥ verifiedAt`、かつ未来時刻でないことを最低条件と
  する。ただし許容遅延は deployment policy として別途定義する。
- クロスボーダー判定を authority vector の最制限 meet とし、unknown、
  suspended、revoked、stale のいずれも fail-closed にする。
- status の群プライバシーを住所 proof にも移植し、地域別の小さな失効リストや
  個別オンライン照会を避ける。

## 実装候補

- `src/lib/addressQlVerifierLifecycle.ts` に非通信・非暗号の
  `verifyVerifierLifecycle` を追加した。
- `src/lib/addressQlVerifierLifecycle.test.ts` に、鍵期限外、失効・停止・退役・
  unknown、未消費 challenge、audience/purpose/public-input 再利用、未認証
  status/ledger、古い status の反例を追加した。
- 既存の schema、receipt、checkpoint、translation、postal-zone tests と
  合わせて 58/58 件が成功した。

## 今後必要な検証

- challenge 消費を実ストレージの compare-and-set または一意制約で原子的に
  実装し、並行二重消費テストを行う。
- 検証鍵 status root の署名、鍵ローテーション連鎖、失効 authority、
  clock-skew policy を実装・監査する。
- lifecycle gate を既存 external verifier adapter の必須構成要素として接続し、
  schema/receipt/lifecycle の三者 meet を conformance contract にする。
- status list の batching、cache、stapling と最低集合サイズを評価し、小地域の
  相関耐性を測る。
- Lean では、`Consumed c p₁ ∧ Consumed c p₂ → p₁ = p₂` と
  `Accepted → ActiveAt key verifiedAt` を抽象定理として追加する。

## 残余リスク

この実装は鍵 status の署名、status root、ledger consensus、ZK proof、
Merkle proof、回路安全性を検証しない。悪意ある verifier、改ざんされた
status adapter、challenge ledger の分断、時刻源の操作、低エントロピー郵便
zone の辞書攻撃、適応的照会、traffic analysis、carrier/customs の共謀は残る。
生成された郵便 zone の匿名集合が小さい場合は、暗号学的に正しい proof でも
公開述語が対象を特定し得る。
