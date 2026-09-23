# ZK Address Eligibility Model

## Ethereum系ZK × 住所インフラの実装理論

ZK Address Eligibility Model、またはゼロ知識住所適格性モデルは、住所全文を公開せずに、住所に関する条件だけを検証するための数理・実装モデルである。

結論は明確である。

> 住所そのものをブロックチェーンに置いてはいけない。オンチェーンに置くのは、証明スキーマ、発行者、失効root、nullifier、検証結果、期限、ルールID、commitmentなどに限定する。

住所は候補空間が有限であり、単純なハッシュでも総当たり推測される危険がある。そのため、AGIDでは住所をオンチェーンデータではなく、ZK witness、暗号化payload、credential、commitment、AOID権限として扱う。

## 1. 何を証明するか

ZK住所証明が証明すべきなのは、住所本文ではなく住所由来の属性である。

| 証明 | 例 | 住所本文 |
| --- | --- | --- |
| 国・地域証明 | 日本在住、東京都内、EU域内 | 出さない |
| 配送可能性証明 | 配送可能区域内、冷蔵配送対応、離島除外ではない | 出さない |
| 重複防止証明 | 1世帯1回、1住所1回、1人1回 | 出さない |
| 複合証明 | 20歳以上かつ日本在住、本人確認済みかつ配送可能 | 出さない |
| 住所変更証明 | 住所変更済み、旧住所と新住所が同一主体に紐づく | 出さない |
| 翻訳対応証明 | 日本語住所と英語配送住所が同一地点を指す | 原則出さない |

## 2. 住所構造体

住所を文字列ではなく、構造体として扱う。

```text
A = {c, r, m, d, p, z, g, b, u}
```

| 記号 | 意味 |
| --- | --- |
| `c` | country |
| `r` | region / prefecture / state |
| `m` | municipality |
| `d` | district / town |
| `p` | postal code |
| `z` | delivery zone |
| `g` | geospatial cell / AGID cell / H3 / S2 / Geohash |
| `b` | building |
| `u` | unit / room / handoff unit |

例:

```text
A = {
  c = JP,
  r = Tokyo,
  m = Shibuya,
  d = Jinnan,
  p = 150-0041,
  z = JP-TKY-SBY-001,
  g = AGID_CELL_...,
  b = BuildingHash,
  u = UnitHash
}
```

ここで `b` と `u` は個人特定性が高いため、公開AGIDへ混ぜない。ZK witnessまたはAOID側で扱う。

## 3. 住所コミットメント

住所そのものではなく、salt付きcommitmentを作る。

```text
C_A = H(A, s)
```

実装上は、ZK向けにはPoseidonやPedersen commitmentなどを検討する。アプリの通常ハッシュとZK回路内ハッシュは混同しない。

```text
C_A = Poseidon(c, r, m, d, p, z, g, b, u, s)
```

単純な `SHA256(address)` は危険である。住所候補は有限であり、郵便番号や地域が絞られると辞書攻撃が成立しやすい。

## 4. 住所証明Credential

住所を確認した発行者 `I` が、住所commitmentに署名する。

```text
Cred_A = Sig_I(C_A, E, t_exp)
```

| 記号 | 意味 |
| --- | --- |
| `Cred_A` | 住所証明Credential |
| `I` | 発行者。AGID、配送会社、KYC会社、自治体、ホテル、大学、法人管理者など |
| `E` | 証明属性 |
| `t_exp` | 有効期限 |

証明属性の例:

```json
{
  "verified": true,
  "residence": true,
  "delivery_available": true,
  "issuer_level": "trusted",
  "credential_scope": "delivery_eligibility"
}
```

Credentialの本文を公開する必要はない。ZK proofでは、発行者署名、有効期限、失効状態、属性条件だけを検証する。

## 5. 住所述語

住所条件を述語として定義する。

```text
P(A) ∈ {0,1}
```

### 国条件

```text
P_country(A, c*) = 1 iff c = c*
```

### 地域条件

```text
P_region(A, r*) = 1 iff r = r*
```

### 配送区域条件

配送可能区域集合を `Z_allowed` とする。

```text
P_delivery(A, Z_allowed) = 1 iff z ∈ Z_allowed
```

### 郵便番号接頭辞条件

```text
P_postal(A, q) = 1 iff prefix(p) = q
```

### 地理セル条件

```text
P_geo(A, G_allowed) = 1 iff g ∈ G_allowed
```

郵便番号が弱い国、離島、山間部、海上施設、災害地では、`P_geo` とAGID cell membershipが重要になる。

## 6. 基本証明形

ユーザーは住所 `A` を公開せずに、次を証明する。

```text
π = Prove(A, s, Cred_A ; public_inputs)
```

公開入力:

```text
public_inputs = {
  C_A,
  rule_id,
  issuer_id,
  t_now,
  nullifier
}
```

秘密入力:

```text
private_inputs = {
  A,
  s,
  Cred_A
}
```

証明命題:

```text
VerifySig(I, Cred_A, C_A, E, t_exp) = 1
∧ C_A = H(A, s)
∧ t_now < t_exp
∧ P(A) = 1
```

検証者が知るのは、条件を満たしたこと、証明が有効であること、必要なら二重利用ではないことだけである。

## 7. 一般化モデル

複数条件を組み合わせる。

```text
P_total(A) = P_1(A) ∧ P_2(A) ∧ ... ∧ P_n(A)
```

例:

```text
P_total(A)
= P_country(A, JP)
∧ P_delivery(A, Z_allowed)
∧ P_geo(A, G_allowed)
∧ P_valid(Cred_A)
```

意味:

```text
日本国内住所であり、
配送可能区域内であり、
地理的にも許可区域内であり、
住所証明が有効である。
```

## 8. Nullifierと二重利用防止

### ユーザー単位

```text
N_user = H(user_secret, rule_id)
```

同じユーザーが同じキャンペーンで2回使えない。

### 住所単位

```text
N_addr = H(C_A, rule_id, k)
```

同じ住所が同じルールで2回使えない。

### 世帯単位

```text
C_household = H(c, r, m, d, p, b, household_salt)
N_household = H(C_household, rule_id)
```

1世帯1回、1建物1回、災害物資配布などで使う。

Nullifierは必ずdomain-separatedにする。グローバルnullifierは追跡IDになりうるため危険である。

## 9. 配送会社だけが住所を取得するモデル

ECサイトには住所を見せず、配送会社だけに復号させる。

```text
Enc_A = Enc_PK_carrier(A)
```

ECサイトが見るもの:

```text
π
N
eligible = true
delivery_token
```

配送会社が見るもの:

```text
Enc_A
復号権限
配送ラベル用住所
```

ZKで証明する命題:

```text
C_A = H(A, s)
∧ Enc_A = Enc_PK_carrier(A)
∧ P_delivery(A, Z_allowed) = 1
```

これにより、ZKでは東京住所を証明し、配送会社には別住所を暗号化して渡す不正を防げる。

## 10. 地域限定クーポンモデル

地域限定キャンペーン `Campaign_j` の条件を次のように置く。

```text
R_j = {
  country = JP,
  region = Tokyo,
  one_per_user = true
}
```

ユーザーは次を証明する。

```text
π_j = Prove(A, s, Cred_A, user_secret ; C_A, rule_id_j, N_user)
```

命題:

```text
C_A = H(A, s)
∧ VerifySig(I, Cred_A) = 1
∧ P_country(A, JP) = 1
∧ P_region(A, Tokyo) = 1
∧ N_user = H(user_secret, rule_id_j)
```

スマートコントラクトまたはAPIは次を確認する。

```text
Verify(π_j) = 1
∧ N_user ∉ UsedNullifiers
```

使用後:

```text
UsedNullifiers ← UsedNullifiers ∪ {N_user}
```

## 11. 配送可否証明モデル

商品 `x` に対して配送可能区域集合を定義する。

```text
Z_x = {z_1, z_2, ..., z_k}
```

住所 `A` の配送区域を `z(A)` とする。

```text
D(A, x) = 1 iff z(A) ∈ Z_x
```

より細かくすると:

```text
D(A, x)
= CountryAllowed(c, x)
∧ ZoneAllowed(z, x)
∧ CarrierAvailable(z, x)
∧ NotRestricted(g, x)
```

例:

```text
日本国内
冷蔵配送可能区域
離島除外
危険物配送不可区域ではない
```

## 12. 住所翻訳との接続

住所翻訳後の住所を次のように置く。

```text
A' = T(A, L, F)
```

| 記号 | 意味 |
| --- | --- |
| `L` | 目標言語 |
| `F` | 出力形式。配送ラベル、ECフォームなど |

理想的には、次を証明する。

```text
C_A = H(A, s)
∧ C_A' = H(A', s')
∧ Equivalent(A, A') = 1
```

ただし住所翻訳全体をZK回路へ入れるのは重い。現実的には、AGIDが翻訳対応を署名する。

```text
Sig_AGID(C_A, C_A', translation_rule_id)
```

これにより、「この英語住所は、この日本語住所と同一地点を指す」を証明できる。

## 13. AGID発行モデル

公開AGIDと秘密AGIDを分離する。

### 公開AGID

```text
AGID_public = H(c, r, m, d, z, g, version)
```

用途:

```text
町域
配送区域
行政区画
郵便番号区域
```

### 秘密AGID

```text
AGID_private = H(c, r, m, d, p, z, g, b, u, s)
```

用途:

```text
個人配送
匿名配送
ZK住所証明
本人確認
```

公開AGIDに部屋番号、電話番号、受取人、個人配送指示を混ぜてはいけない。

## 14. Merkle treeによる配送可能区域証明

配送可能区域集合をMerkle treeにする。

```text
Z_allowed = {z_1, z_2, ..., z_n}
R_Z = MerkleRoot(Z_allowed)
```

ユーザーは自分の配送区域 `z` が集合に含まれることを証明する。

```text
MerkleVerify(z, path_z, R_Z) = 1
```

ZK回路内では、`z ∈ Z_allowed` をMerkle membershipで表現する。

## 15. 完全なZK住所証明式

```text
π = ZKProve {
  private:
    A = {c, r, m, d, p, z, g, b, u}
    s
    Cred_A
    path_z
    user_secret

  public:
    C_A
    R_Z
    issuer_id
    rule_id
    t_now
    N

  constraints:
    C_A = H(A, s)
    VerifySig(issuer_id, Cred_A, C_A) = 1
    t_now < t_exp
    MerkleVerify(z, path_z, R_Z) = 1
    P_country(A, c*) = 1
    N = H(user_secret, rule_id)
}
```

検証者は次を確認するだけでよい。

```text
Verify(π) = 1
```

## 16. モデル定義

ZK-AEMを次の6要素で定義する。

```text
ZK-AEM = (A, C_A, Cred_A, P, π, N)
```

| 記号 | 意味 |
| --- | --- |
| `A` | 住所構造体 |
| `C_A` | 住所commitment |
| `Cred_A` | 住所証明Credential |
| `P` | 住所条件述語 |
| `π` | ZK proof |
| `N` | 二重利用防止nullifier |

定義:

```text
ZK-AEMは、住所Aを公開せずに、住所に関する条件P(A)=1をZK proof πによって検証可能にし、必要に応じてnullifier Nで二重利用を防ぐ数理モデルである。
```

AGID向けの検証式:

```text
Verify_ZKAGID(π, C_A, R_Z, rule_id, N) = 1
```

証明内では次が成立している。

```text
C_A = H(A, s)
∧ Cred_A = Sig_I(C_A, E, t_exp)
∧ t_now < t_exp
∧ z(A) ∈ Z_allowed
∧ P_rule(A) = 1
∧ N = H(secret, rule_id)
```

## 17. Ethereum系構成

### EAS型住所証明

Ethereum Attestation Service型の構成では、発行者が住所属性に関するattestationを出す。ただし住所本文は載せない。

載せてよいもの:

```text
schema id
issuer id
attestation hash
revocation status
credential commitment
expiration
rule id
```

載せてはいけないもの:

```text
raw address
name
phone
full postal code
building name
unit
precise coordinates
simple unsalted address hash
```

### ZK Address Credential

ユーザー端末またはAGID walletに住所Credentialを保存し、必要な時だけproofを作る。

```text
postal_country == JP
delivery_zone ∈ allowed_zones
credential_not_expired == true
issuer_signature_valid == true
nullifier_unused == true
```

### AGID Address Interlingua + ZK

AGID Address InterlinguaをZK witnessの正規化形式として使う。

```text
Source Address → AGID Address Interlingua → ZK Predicate
```

これにより住所翻訳、配送可否、郵便番号生成、匿名配送を同じモデルに接続できる。

## 18. スマートコントラクト構成

最小構成:

```text
AddressCredentialRegistry
AddressProofVerifier
AddressNullifierRegistry
AddressRevocationRegistry
DeliveryAccessControl
```

| Contract | 役割 |
| --- | --- |
| `AddressCredentialRegistry` | 発行者、スキーマ、有効期限、credential rootを管理 |
| `AddressProofVerifier` | ZK proof、rule id、public inputsを検証 |
| `AddressNullifierRegistry` | 二重利用防止nullifierを登録 |
| `AddressRevocationRegistry` | 住所credentialの失効rootを管理 |
| `DeliveryAccessControl` | 配送会社だけが復号リクエストできるよう制御 |

## 19. MVP順序

### MVP 1: ZK Region Proof

```text
東京都在住である
日本国内在住である
EU域内在住である
```

最初に作りやすく、地域限定クーポン、配送可否、イベント参加条件に使える。

### MVP 2: ZK Delivery Eligibility API

```json
{
  "eligible": true,
  "proof_verified": true,
  "reason": "delivery_zone_match",
  "address_disclosed": false
}
```

ECサイトは住所を見ずに配送可否だけ確認できる。

### MVP 3: ZK Anonymous Shipping

```text
ECに住所を見せない
配送会社だけが見る
購入者と受取人の住所を分離
```

AGIDの差別化になる。

## 20. 事業展開順

1. 住所確認済みバッジ
   - `Address Verified`
   - `Japan Resident Verified`
   - `Tokyo Resident Verified`
2. 住所非公開配送
   - ECには住所を見せない
   - 配送会社だけが見る
   - 購入者と受取人の住所を分離
3. 地域限定証明API
   - クーポン
   - 補助金
   - 災害支援
   - チケット
   - 限定販売
4. 国際住所ZK
   - 国・州・EU域内・配送規制・税区分対応

## 21. 最大リスク

ZKを使っていても、周辺情報で個人が特定されることがある。

例:

```text
東京都渋谷区神南の配送可能証明
購入日時
商品
配送会社
IPアドレス
ウォレット履歴
```

これらを組み合わせると、住所を出していなくても特定される可能性がある。したがって、AGIDのZK層では次を必須にする。

- predicate granularity policy
- anonymity set check
- domain-separated nullifier
- challenge binding
- purpose scope
- short expiry
- metadata minimization
- no raw address on-chain
- no simple address hash
- no global address nullifier

## 22. 一文説明

AGID ZK Address Layerは、住所全文をECサイトやDAppに開示せず、Ethereum系ゼロ知識証明によって「本人確認済み」「配送可能地域内」「特定地域在住」「二重利用なし」などの条件だけを検証可能にする住所プライバシー基盤である。
