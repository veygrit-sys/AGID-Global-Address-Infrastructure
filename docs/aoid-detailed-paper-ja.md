# AOID: Address Owner Identifier

## 住所写像論に基づく所有者管理型・私的住所識別子の数理・仕様・セキュリティ・検証

版: 日本語詳細論文ドラフト v0.2
日付: 2026-06-07
位置づけ: 住所写像論本体、AGID論文、零知識住所述語論文とは分離したAOID応用論文

## 要旨

AOID (Address Owner Identifier) は、住所写像論 (Address Morphism Theory, AMT) の応用として設計される、所有者管理型の私的住所識別子である。AGID (Address Grid Identifier) が公開地理セル、公開住所、公開建物、公開地物を扱うのに対し、AOID は受取人、部屋番号、電話番号、配送指示、アクセス指示、所有者権限、委譲、失効、暗号化同期など、公開すべきではない操作住所情報を扱う。

本稿の中心主張は、AOID を「公開住所コード」ではなく、「公開 AGID 文脈に結びついた owner-managed private address relation」として定義すべきだ、という点にある。AOID の公開面は、曖昧性の少ない Base32 handle、linked AGID anchor、公開参照 handle、状態、バージョン、proof metadata に限定される。一方、受取人、電話番号、部屋番号、詳細な配送指示、正確な私的座標、owner private key、credential private salt は、端末内または所有者デバイスで暗号化された envelope 内に置く。

現行実装では、AOID は 9 から 16 文字の不曖昧 Base32 ID として正規化される。linked AGID が存在する場合、AOID は AGID の 10 文字 hash anchor を含まなければならない。16 桁すべて同一文字の ID と、Base32 alphabet 上の連続 4 文字 run は拒否される。生成関数は 16 文字 AOID を生成し、linked AGID がある場合は AGID hash anchor から始める。この仕様により、AOID は AGID を内包し得るが、AGID そのものでも、PID そのものでも、住所真実性の証明そのものでもない。

本稿は、AOID の数理モデル、登録モデル、公開/非公開射影、同期、QR、所有証明、重複登録防止、失効・鮮度、監査、API/MCP/Polkadot 連携、オープンソース安全性を整理する。同時に、現時点で検証済みの主張と未検証の主張を分離する。ローカル実装テスト、Lean 形式化、GIS warning budget、郵便ソース検証により、AOID の公開/非公開境界、暗号化同期 gate、所有証明 envelope、duplicate nullifier、revocation/freshness root、public commitment surface は支持される。一方、実 ZK 回路の soundness/zero-knowledge、実配送成功率、全世界 coverage、商用住所検証 API への全面勝利は未検証であり、本稿では完成済みの事実として扱わない。

## キーワード

AOID、Address Owner Identifier、住所写像論、AGID、PID、所有者管理住所、私的住所、配送可能性、公開/非公開射影、暗号化同期、重複登録防止、nullifier、失効、鮮度、ZK-ready envelope、MCP、買い物 Agent、オープンソース安全性。

## 1. はじめに

住所には二つの顔がある。

第一に、住所は公開できる地理参照である。道路、建物、橋、川、湖、島、山、地区、郵便番号、行政区画、公開施設名、遺跡、世界遺産などは、公開地図や公開データとして扱える場合がある。この領域は AGID の責務である。

第二に、住所は私的な到達情報である。荷物を実際に届けるには、受取人名、部屋番号、階、棟、電話番号、インターホン名、宅配ロッカー番号、アクセスコード、現在の一時避難先、配送指示、受取可能時間帯が必要になることがある。これらは配送には重要だが、公開住所コード、公開地図データ、公開 QR、公開 API、公開ブロックチェーン registry に載せるべきではない。

この二つを混ぜると、住所システムは二つの危険を抱える。

一つ目は、公開識別子が個人情報を含んでしまう危険である。便利な住所 ID を作るために、部屋番号、電話番号、受取人、詳細な配送指示を公開 ID に入れると、その ID を共有するだけで個人情報が漏れる。

二つ目は、私的住所を中央サービスに固定してしまう危険である。所有者が引っ越し、部屋を変え、配送指示を変え、AOID を失効・回転したい場合、中央サービスが唯一の更新者になると、本人の制御が弱くなる。

AOID は、この二つの危険を避けるための識別子である。

```text
AGID = 公開地理・公開住所・公開建物・公開地物の識別子
AOID = 所有者が管理する私的住所・配送・権限の識別子
PID  = AMT の解決過程を通過した永続的参照識別子
ZKP  = 住所を出さずに住所由来の属性だけを証明する秘匿証明層
```

AOID は、AGID を補完する。AGID が「どこか」を扱うなら、AOID は「誰が、どの私的条件で、どう受け取るか」を扱う。ただし AOID は、公開 API に平文で流すものではない。AOID の公開面は opaque handle と linked AGID anchor に制限される。私的情報は所有者端末、所有者鍵、暗号化 envelope、credential、proof bundle の側に置く。

## 2. AOID の位置づけ

### 2.1 住所写像論との関係

住所写像論は、住所表現を実体へ写す意味論である。AMT は、入力住所、候補生成、展開、構造距離、クラスタ、unresolved 判定、履歴更新、PID 発行を扱う。

AOID は、AMT の中核定理そのものではない。AOID は AMT の応用層であり、AMT が扱う参照実体や PID に対し、所有者管理の私的操作関係を与える。

形式的には、AMT が次の問題を扱うとする。

\[
s \in S \quad \mapsto \quad C_t(s) \subseteq X_t
\]

ここで \(S\) は住所表現空間、\(X_t\) は時刻 \(t\) における住所可能実体空間、\(C_t(s)\) は候補集合である。

AOID は、候補集合や PID の上に次の私的関係を追加する。

\[
a \in A_t \quad \mapsto \quad (g, o, \sigma, \rho, \kappa, \tau)
\]

ここで、\(A_t\) は時刻 \(t\) の AOID 集合、\(g\) は linked AGID または公開地理文脈、\(o\) は所有者または所有者デバイス、\(\sigma\) は私的配送 payload、\(\rho\) は権限・同意・用途 scope、\(\kappa\) は鍵・credential・commitment、\(\tau\) は状態と履歴である。

この写像は公開写像ではない。公開されるのは、次のような射影である。

\[
\operatorname{Pub}(a)=(\operatorname{id}(a),\operatorname{anchor}(a),\operatorname{status}(a),\operatorname{version}(a),\operatorname{handle}(a)).
\]

私的 payload \(\sigma\) と所有者 witness \(\kappa\) は、公開射影から除外される。

### 2.2 AGID との関係

AGID は公開可能な地理参照である。AOID は AGID の上に置かれる私的住所関係である。

```text
公開地理文脈
  AGID
    |
    | linked AGID anchor
    v
私的操作住所
  AOID
    |
    | encrypted payload / owner credential / proof bundle
    v
受取・配送・委譲・失効・履歴
```

AOID が linked AGID anchor を含む理由は、AOID を完全に孤立した秘密 ID にしないためである。配送や住所検証では、ある私的住所がどの公開地理文脈に属するかを、必要最小限で示す必要がある。AOID が AGID hash anchor を含むことで、公開 AGID と私的 AOID の関係を扱える。

ただし、この anchor は住所内容の公開ではない。linked AGID は公開地理セルや公開住所文脈を示すが、AOID の受取人、電話番号、部屋番号、配送指示は示さない。

### 2.3 PID との関係

PID は、AMT の候補生成、クラスタ、unresolved 判定、履歴更新、発行監査を通過した永続的参照識別子である。AOID は PID とは異なる。

PID は「どの参照実体へ解決されたか」の永続的状態を扱う。AOID は「その参照実体または公開地理文脈に対して、所有者がどの私的到達情報を管理するか」を扱う。

例えば、同じ建物や同じ AGID に複数の AOID が存在し得る。1 階店舗、2 階事務所、個人宅、倉庫、宅配ロッカー、仮設避難先が同じ公開 AGID 文脈に結びつく場合がある。このとき、AGID は共通でも AOID は異なる。

### 2.4 零知識住所述語との関係

AOID は零知識証明の材料になり得るが、AOID そのものが ZKP ではない。現行実装の AOID ownership proof は proof-ready envelope であり、実 ZK 回路そのものではない。

安全な表現は次である。

```text
AOID provides an owner-managed private address relation and proof-ready commitments.
It can be used as a witness source for ZK Address, ZK Residence, ZK Delivery,
and AOID Ownership predicates, but the zero-knowledge property belongs to the
audited circuit system, not to AOID syntax alone.
```

## 3. 設計目標と非目標

### 3.1 設計目標

AOID の設計目標は次の通りである。

1. 所有者管理性。AOID の私的内容は所有者が作成、更新、失効、回転、委譲する。
2. ローカル優先。受取人、電話番号、部屋番号、配送指示などの平文は端末内を基本とする。
3. 暗号化同期。クラウドやサーバー同期は、所有者同意、所有者デバイス暗号化、owner key id、device key id がある場合だけ許可する。
4. 公開参照の最小化。公開 QR、公開 API、MCP、OpenAPI、チェーン anchor には AOID public reference、linked AGID、status、version、commitment、proof metadata だけを出す。
5. AGID 連携。AOID は linked AGID anchor を含み得るため、公開地理文脈と私的配送文脈を分けたまま結合できる。
6. 失効・回転。AOID は active、revoked、rotated などの状態を持ち、古い AOID や漏洩 AOID を無効化できる。
7. 重複登録防止。住所や AOID を公開せずに、同一住所・同一 AOID・同一地域での二重登録を nullifier により検出できる。
8. 監査可能性。公開監査には安全な fingerprint、decision、payload class、proof root を残し、私的 payload は保存しない。
9. オープンソース安全性。コードを公開しても、ユーザーの AOID 本文、鍵、credential salt、配送指示が漏れない構造にする。

### 3.2 非目標

AOID は強力だが、万能ではない。次のことは AOID の非目標である。

| 非目標 | 理由 |
| --- | --- |
| 住所真実性の単独証明 | AOID ID だけでは、その住所が実在・正当・最新であることは証明できない。 |
| 実配送成功の保証 | 配送可否は配送業者、天候、入口、受取人、規制、災害状況に依存する。 |
| 完全な ZKP 実装 | AOID は ZK-ready witness source になり得るが、実 ZK 回路と監査は別責務である。 |
| 商用住所検証 API の即時代替 | Loqate、Experian、Melissa、Smarty などと同一条件で比較する benchmark が必要である。 |
| 公開データパックへの私的住所格納 | AOID 本文を公開データパックに入れると、AOID の目的に反する。 |
| 中央サービスによる所有者情報の自由更新 | AOID は owner-managed であり、中央サービスは仕様・公開状態・暗号化同期支援に限る。 |

## 4. AOID の数理モデル

### 4.1 基本集合

時刻 \(t\) における基本集合を次のように置く。

\[
\begin{aligned}
G_t &: \text{公開 AGID 文脈の集合},\\
A_t &: \text{AOID handle の集合},\\
O_t &: \text{所有者または所有者デバイス主体の集合},\\
P_t &: \text{AMT による PID または参照実体の集合},\\
S_t &: \text{私的住所 payload の集合},\\
K_t &: \text{鍵、credential、commitment、proof witness の集合},\\
R_t &: \text{権限、同意、用途 scope、配送 policy の集合},\\
H_t &: \text{履歴イベントの集合}.
\end{aligned}
\]

AOID record は次の tuple として表せる。

\[
a_t=(i,\alpha,g,o,c,\operatorname{Enc}_{k}(\sigma),r,h,v,q)
\]

ここで、

- \(i \in A_t\) は AOID ID である。
- \(\alpha\) は linked AGID hash anchor である。
- \(g \in G_t\) は linked AGID または公開地理文脈である。
- \(o \in O_t\) は owner または owner device である。
- \(c\) は public handle または commitment である。
- \(\sigma \in S_t\) は私的 payload である。
- \(k \in K_t\) は owner/device encryption key material の抽象である。
- \(r \in R_t\) は scope、consent、delivery policy である。
- \(h \in H_t\) は履歴である。
- \(v\) は仕様または record version である。
- \(q\) は状態であり、active、revoked、rotated などを取る。

実装上、\(\operatorname{Enc}_{k}(\sigma)\) は `AOID_SYNC_ENVELOPE` の `encryptedPayload` に相当する。ただし本稿は暗号方式の詳細を固定しない。重要なのは、公開面には \(\sigma\) が出ないことである。

### 4.2 公開射影と私的 witness

AOID の公開射影を次で定義する。

\[
\operatorname{Pub}: A_t \to Y_t
\]

\[
\operatorname{Pub}(a_t)=(i,\alpha,g,c,q,v)
\]

ここで \(Y_t\) は公開参照空間である。

AOID の私的 witness を次で定義する。

\[
\operatorname{Wit}(a_t)=(o,\sigma,k,r,h)
\]

AOID の安全設計は、公開射影と私的 witness を分離することである。

\[
\operatorname{Pub}(a_t) \cap \operatorname{Fields}(\sigma) = \varnothing
\]

現行実装では、私的 field として少なくとも次を除外対象にしている。

```text
recipient, name, phone, room, floor, unit,
deliveryInstructions, accessInstructions, privateNote,
lat, lon, lng
```

### 4.3 AOID は実体ではなく関係である

AOID を「人」や「住所」や「建物」と同一視すると、設計が壊れる。AOID は、公開地理文脈、所有者、私的配送 payload、権限 scope、履歴の関係である。

\[
\operatorname{AOIDRelation}_t \subseteq G_t \times O_t \times S_t \times R_t \times H_t.
\]

この関係モデルにより、次が自然に表現できる。

- 同じ AGID に複数 AOID が存在する。
- 同じ owner が複数 AOID を持つ。
- 同じ AOID が rotation により新旧 handle を持つ。
- 同じ物理住所でも用途 scope が違えば異なる AOID relation になる。
- 避難所、仮設住宅、宅配ロッカー、倉庫、店舗なども AOID relation で扱える。

### 4.4 状態遷移

AOID 状態集合を

\[
Q=\{\operatorname{active},\operatorname{revoked},\operatorname{rotated}\}
\]

とする。状態遷移は部分関数として表せる。

\[
\delta_A: A_t \times E_t \rightharpoonup A_{t+1}
\]

ここで \(E_t\) は更新、暗号化同期、QR 再発行、委譲、失効、回転などのイベントである。

安全条件は次である。

\[
\delta_A(a,e) \text{ is valid} \Rightarrow \operatorname{Auth}(o,e,a)=1.
\]

つまり、AOID の私的内容や owner-managed state を変更するイベントは、所有者または正当な委譲権限を持つ主体に限られる。

## 5. AOID ID 仕様

### 5.1 文字集合

AOID は曖昧性の少ない Base32 文字集合を使う。現行実装では AGID hash alphabet と同じ alphabet を用いる。

\[
\Sigma_A=\{0,1,\ldots,9,A,\ldots,Z\}\setminus\{\text{ambiguous symbols}\}
\]

実装パターンは次である。

```text
^[0-9A-HJKMNP-TV-Z]{9,16}$
```

これにより、I、L、O など読み間違いやすい文字は除外される。

### 5.2 長さ

AOID の長さは 9 から 16 文字である。

\[
9 \le |i| \le 16.
\]

9 文字を許す理由は、短い表示・既存 record・人間入力・将来の compact handle を許容するためである。16 文字を標準生成長にする理由は、AGID anchor を内包しつつ suffix を持たせるためである。

### 5.3 linked AGID anchor

AGID が存在する場合、AOID は linked AGID の hash anchor を含まなければならない。現行実装では、AGID の 2 文字 prefix を除いた 10 文字 hash 部分を anchor とする。

\[
\operatorname{anchor}(g)=g[2:12]
\]

AOID が AGID と linked である条件を次で定義する。

\[
\operatorname{Linked}(i,g)=
\begin{cases}
1 & \text{if } \operatorname{anchor}(g) \subseteq i,\\
0 & \text{otherwise.}
\end{cases}
\]

生成関数は通常、次を満たす。

\[
i=\operatorname{anchor}(g)\Vert r
\]

ここで \(r\) は安全乱数由来の suffix である。

### 5.4 禁止パターン

AOID は次の pattern を禁止する。

1. 16 桁すべて同一文字。
2. Base32 alphabet 上で連続する 4 文字の昇順 run。
3. Base32 alphabet 上で連続する 4 文字の降順 run。

形式的には、\(i=i_1i_2\cdots i_n\) とし、alphabet index を \(\nu(i_j)\) とする。ある \(j\) について

\[
\nu(i_{j+1})-\nu(i_j)=d,\quad
\nu(i_{j+2})-\nu(i_{j+1})=d,\quad
\nu(i_{j+3})-\nu(i_{j+2})=d,\quad
d\in\{1,-1\}
\]

が成り立つ場合、その AOID は拒否される。

この禁止は暗号学的安全性そのものではない。目的は、人間が見て不自然な予約文字列、テスト用文字列、誤入力、連番発行のように見える ID を避けることである。

### 5.5 定義: Valid AOID

**定義 1 (Valid AOID).** 文字列 \(i\) が valid AOID であるとは、次を満たすことをいう。

1. \(i \in \Sigma_A^{9..16}\)。
2. \(i\) は 16 桁 all-same ではない。
3. \(i\) は 4 文字 sequential run を含まない。
4. linked AGID \(g\) が指定された場合、\(\operatorname{Linked}(i,g)=1\)。

## 6. 公開/非公開分離定理

### 6.1 公理

**公理 A1 (AOID private payload separation).** AOID の私的 payload \(\sigma\) は、受取人、電話番号、部屋番号、配送指示、アクセス指示、正確な私的座標、owner key、credential salt を含み得る。これらは公開射影 \(\operatorname{Pub}\) の値域に含めてはならない。

**公理 A2 (Public reference sufficiency).** 公開面で必要なのは、AOID handle、linked AGID anchor、status、version、public handle、commitment、proof metadata に限定される。

**公理 A3 (Owner-controlled mutation).** AOID の私的 payload および owner-managed authority state を変更できるのは、所有者または正当な委譲者だけである。

### 6.2 命題

**命題 1 (公開射影の非漏洩条件).** AOID public descriptor が

\[
\operatorname{Pub}(a)=(i,\alpha,g,c,q,v)
\]

のみを返すなら、\(\operatorname{Pub}(a)\) は \(\sigma\) の field 名を直接含まない。

**証明.** \(\operatorname{Pub}\) の定義により、返却される成分は \(i,\alpha,g,c,q,v\) に限られる。私的 payload \(\sigma\) は成分に含まれない。したがって \(\sigma\) 内の field は直接公開されない。これは構文的な非含有性であり、統計的推測可能性や side channel 不存在までは主張しない。□

### 6.3 定理

**定理 1 (AOID public/private surface separation).** 公理 A1 と A2 が実装上 enforcement されるなら、公開 QR、公開 API、MCP、OpenAPI、チェーン anchor に AOID public descriptor を渡しても、AOID 私的 payload の平文は公開されない。

**証明の骨子.** 公開 surface が AOID public descriptor または encrypted envelope のみを受け付けるとする。public descriptor は命題 1 により \(\sigma\) を含まない。encrypted envelope は opaque payload として扱われ、owner-device encryption、owner key id、device key id を要求する。したがって公開 surface に平文 payload は到達しない。ただし、暗号方式の安全性、鍵管理、traffic analysis、metadata leakage は別途評価が必要である。□

### 6.4 実装上の対応

現行実装では次の対応がある。

- `buildAOIDPublicDescriptor` は AOID public descriptor を構築する。
- `redactAOIDForPublicUse` は公開 QR や公開参照向けに AOID を redaction する。
- `isAOIDEncryptedSyncEnvelope` は AOID 同期 envelope の形式を検査する。
- `findAoidPrivateFields` は AOID private field の公開 surface 混入を検出する。
- `evaluateAgidAoidGovernance` は layer、operation、surface、payload class ごとに許可/拒否を決定する。

## 7. 登録モデル

### 7.1 AOID 登録の意味

AOID 登録とは、公開住所登録ではない。AOID 登録とは、所有者が自分の私的住所 relation を作り、必要に応じて linked AGID、public handle、credential、暗号化 payload、revocation state、proof bundle を結びつけることである。

```text
owner device
  -> AOID generation
  -> private payload creation
  -> optional linked AGID anchor
  -> local storage
  -> optional encrypted sync
  -> optional proof bundle / public reference
```

### 7.2 ローカル登録

ローカル登録では、AOID record は端末内に保存される。初期 `storageMode` は `device-local`、`syncReadiness` は `local-only` である。

この段階では、クラウドや公開 API に私的 payload を送る必要はない。公開地理文脈が必要なら AGID を使い、私的配送文脈は AOID に残す。

### 7.3 暗号化同期登録

クラウド同期を使う場合、AOID は平文で同期されない。同期 payload は次の条件を満たさなければならない。

1. envelope type が `AOID_SYNC_ENVELOPE` である。
2. `id` が valid AOID である。
3. `encryptedPayload` が十分な長さの opaque payload であり、私的 field を raw JSON として含まない。
4. `encryption` が `owner-device` である。
5. `ownerKeyId` が存在する。
6. `deviceKeyId` が存在する。

この条件を満たさない場合、同期は `blocked` になるか、公開 descriptor に落とされて `requiresEncryptedPayload` が付く。

### 7.4 公開参照登録

公開登録として許されるのは、AOID public reference だけである。これは所有者であることを証明しない。公開 QR をスキャンした第三者が、その AOID を自分の owner-managed AOID として登録してはならない。

このルールは重要である。公開 AOID QR を所有証明と混同すると、なりすまし登録が起きる。

## 8. 通信モデル

AOID 通信は AGID 通信と異なる。AGID は公開地理・公開住所・公開建物・公開地物を扱えるため、公開 API、SDK、QR、cache、data pack と相性がよい。AOID は私的配送 payload を含み得るため、通信 surface を制限する必要がある。

| surface | AOID の許可 payload | 禁止 payload |
| --- | --- | --- |
| local-device | AOID private record | なし。ただし端末保護が必要。 |
| private-qr | trusted-device transfer payload | 不特定多数への共有。 |
| public-qr | AOID public reference | 受取人、電話、部屋、配送指示、正確な私的座標。 |
| encrypted-sync | owner-device encrypted envelope | 平文 private AOID record。 |
| public-api | public reference、proof metadata | AOID plaintext、owner private key、credential salt。 |
| MCP | public proof bundle、commitment、safe metadata | private argument material。 |
| chain anchor | root、commitment、registry id | raw address、AOID plaintext、電話、部屋、配送指示。 |

このモデルにより、買い物 Agent や配送 Agent は AOID を直接読むのではなく、次のように動く。

```text
shopping agent
  -> asks for delivery eligibility / residence / ownership proof
  -> receives proof bundle or public commitment
  -> never receives plaintext recipient, phone, unit, access instruction
  -> delivery execution uses encrypted owner-authorized channel
```

## 9. QR モデル

### 9.1 AGID QR と AOID QR

AGID QR は公開地理参照である。AOID QR は、公開参照 QR と私的移行 QR に分ける必要がある。

```text
AGID public QR
  -> public location/address/building/feature

AOID public QR
  -> public AOID reference + linked AGID
  -> not ownership proof

AOID private QR
  -> trusted device transfer
  -> may contain encrypted or owner-only material
```

### 9.2 公開 AOID QR の安全条件

公開 AOID QR は次だけを含める。

- AOID id。
- linked AGID。
- public handle。
- status。
- version。
- public-reference privacy marker。

公開 AOID QR は次を含めてはならない。

- 受取人。
- 電話番号。
- 部屋番号。
- 階・棟・ユニット。
- 配送指示。
- アクセスコード。
- 正確な私的座標。
- owner private key。
- credential private salt。

### 9.3 私的 AOID QR

私的 AOID QR は、所有者が信頼する端末間で移行する場合に限る。さらに、理想的には payload を暗号化し、短命 challenge、失効、用途 scope、デバイス binding を含める。

本稿では、私的 AOID QR の完全仕様は今後の課題とする。少なくとも、公開 QR と同じ surface で私的 QR を共有してはならない。

## 10. 所有証明モデル

### 10.1 AOID ownership proof の目的

AOID ownership proof の目的は、AOID 本文や住所本文を公開せずに、証明者が AOID owner key または登録済み住所 credential を持つことを示すことである。

証明したい公開命題は次の形を取る。

\[
\exists w \in W.\ \operatorname{Owns}(w,i,\operatorname{scope})=1
\]

ここで \(i\) は AOID public handle または commitment、\(w\) は owner key、credential、private salt などの witness である。

### 10.2 現行 envelope

現行実装の AOID ownership proof は次の method を持つ。

1. `owner-key`
2. `address-credential`
3. `owner-key-and-address-credential`

proof claim は method、scope、challenge hash、issuedAt、expiresAt、AOID commitment、owner key fingerprint、credential summary、privacy metadata を持つ。

重要なのは、privacy metadata が次を隠すと宣言することである。

```text
aoid, aoid-body, input-address, recipient, phone, unit,
credential-private-salt, owner-private-key
```

### 10.3 ZK-ready と ZK 完成の区別

現行 proof hint は `zkReady: true` である一方、`zkpGenerated: false` である。したがって、現状は ZK-ready envelope であり、完全な ZK proof system ではない。

本稿では次の区別を採用する。

| 段階 | 意味 |
| --- | --- |
| proof-ready envelope | witness、public statement、commitment、scope、challenge、expiry を整理した実装。 |
| ZK circuit relation | statement を回路制約として表したもの。 |
| audited ZK proof | soundness、zero-knowledge、witness leakage、domain separation が監査されたもの。 |

AOID 論文は一段目と二段目の橋渡しを扱う。三段目は零知識住所述語論文と実回路監査の責務である。

## 11. 重複登録防止と nullifier

### 11.1 問題

同じ住所、同じ AOID、同じ地域で二重登録が起きると、配送、不正利用、補助金、災害支援、アカウント作成、credential 発行で問題になる。一方で、二重登録を防ぐために住所を公開すると、プライバシーが壊れる。

### 11.2 Nullifier

nullifier は、秘密情報を公開せずに同一性の再利用を検出する値である。

\[
N=\operatorname{Hash}(\operatorname{domain}\Vert \operatorname{scope}\Vert \operatorname{secretAddress}\Vert \operatorname{AOID}\Vert \operatorname{region}\Vert s)
\]

ここで \(s\) は private salt である。

望ましい性質は次である。

1. 同じ hidden address、同じ AOID、同じ region、同じ scope では同じ \(N\) になる。
2. hidden address、AOID、region、scope のいずれかが変われば、異なる \(N\) になる。
3. \(N\) から hidden address や AOID 本文を復元できない。
4. domain separation により、別用途の nullifier が衝突・連結されない。

### 11.3 命題

**命題 2 (Nullifier duplicate detection).** registry が過去に提出された \(N\) の集合を保存している場合、新しい提出 \(N'\) について \(N'=N\) となる既存値があれば、同一 scope 内の重複登録候補として検出できる。

**証明.** registry は集合 membership を確認するだけでよい。\(N'\in \mathcal{N}\) なら過去提出と一致する。\(N'\notin \mathcal{N}\) なら少なくとも registry 上は新規である。ただし、hash collision、salt 管理、scope 設計、ZK 回路の正当性は別途必要である。□

### 11.4 AOID における注意

nullifier は強力だが、使い方を誤ると追跡可能性を生む。同じ nullifier を複数サービスで使い回すと、ユーザーがリンクされる。したがって AOID の nullifier は scope、issuer、region、purpose、epoch で domain separation するべきである。

## 12. 失効・鮮度

### 12.1 なぜ必要か

AOID は所有者管理なので、失効と鮮度が必須である。

- 引っ越した。
- 電話番号が変わった。
- 鍵が漏洩した。
- 宅配ロッカー番号が変わった。
- 災害時の仮住所が期限切れになった。
- 代理受取権限を取り消した。
- credential issuer が信頼できなくなった。

これらの場合、古い AOID credential や proof を受け付けると危険である。

### 12.2 Revocation root

失効集合を \(\mathcal{R}_t\) とする。公開可能なのは失効集合そのものではなく、root である。

\[
r_t=\operatorname{Root}(\mathcal{R}_t)
\]

検証者は proof が \(r_t\) に対して失効していないことを確認する。ここでも、AOID 本文や住所本文を root に平文で含めてはならない。

### 12.3 Freshness window

proof の有効期限を

\[
[\operatorname{issuedAt}, \operatorname{expiresAt}]
\]

とする。検証時刻 \(T\) がこの範囲外なら proof は拒否される。

\[
T \notin [\operatorname{issuedAt}, \operatorname{expiresAt}] \Rightarrow \operatorname{Reject}.
\]

### 12.4 系

**系 1 (AOID proof freshness).** AOID proof が expiration、revocation root、issuer trust の検査を必要条件として持つなら、期限切れまたは失効済みの AOID credential は検証に失敗する。

これは現行テストで支持される。ただし、issuer の現実世界での失効運用、root 配布遅延、鍵漏洩対応 SLA は実運用課題である。

## 13. 同意・用途 scope

AOID は用途 scope を持たなければならない。住所や配送情報は、目的外利用されやすいからである。

例:

- 配送用だけ。
- 年齢確認には使わない。
- 居住国証明だけ。
- 災害支援 credential 発行だけ。
- 買い物 Agent の配送可能性確認だけ。
- 一回限り。
- 24 時間以内。

形式的には、scope を \(r\in R_t\) とし、proof の public statement に含める。

\[
\operatorname{Statement}=(\operatorname{predicate},\operatorname{scope},\operatorname{challenge},\operatorname{expiry})
\]

検証者が期待する scope と proof scope が一致しない場合、proof は拒否される。

\[
r_{\text{proof}}\ne r_{\text{expected}} \Rightarrow \operatorname{Reject}.
\]

これにより、配送用に発行した AOID proof を、本人確認やマーケティングに転用することを防ぎやすくなる。

## 14. 委譲・共有・相続

AOID は owner-managed だが、現実には委譲が必要である。

- 家族が受け取る。
- 会社の担当者が更新する。
- 店舗の管理者が配送指示を変更する。
- 倉庫の operator が受取条件を更新する。
- 相続により AOID 権限を移す。
- 災害時に避難所担当者へ一時委譲する。

委譲 relation を次で表す。

\[
\operatorname{Delegated}(o,d,a,r,[t_0,t_1])=1
\]

ここで \(o\) は owner、\(d\) は delegate、\(a\) は AOID、\(r\) は scope、\([t_0,t_1]\) は有効期間である。

委譲の安全条件は次である。

1. 委譲 scope を明示する。
2. 有効期限を持つ。
3. revocation 可能にする。
4. 委譲先が owner private key を直接持たなくてもよい設計にする。
5. 公開 audit には delegate の個人情報を直接出さない。

相続は、より重い委譲として扱うべきである。AOID inheritance は、guardian、timelock、multi-signature、法的証拠、失効猶予、紛争処理を必要とするため、本稿では基本モデルのみ示す。

## 15. AOID と配送可能性

AOID は配送可能性と相性がよい。配送可能性は住所そのものではなく、条件付き述語だからである。

例:

```text
この AOID は配送可能地域内である。
この AOID は正当な受取 credential を持つ。
この AOID は現在失効していない。
この AOID は配送用途 scope に限定されている。
```

これを公開住所なしで証明できれば、買い物 Agent、EC、配送業者、ロッカー、災害支援で有用である。

ただし、AOID は「配送成功を保証する」ものではない。配送可能性は、配送業者、商品種別、サイズ、危険物規制、時間帯、天候、災害、受取人状態に依存する。したがって AOID は delivery eligibility proof の witness にはなり得るが、最終配送 SLA の保証ではない。

## 16. API・MCP・買い物 Agent 連携

### 16.1 API

公開 API は AOID plaintext を受け取ってはならない。API が受け取れるものは次に限る。

- AOID public handle。
- linked AGID。
- encrypted sync envelope。
- proof bundle。
- commitment。
- revocation/freshness root。
- issuer trust registry reference。
- audit-safe metadata。

### 16.2 MCP

MCP は買い物 Agent や外部ツールが AOID 系の能力を呼び出す入口になり得る。このとき MCP は、AOID owner data を直接渡すのではなく、次の API を提供するのが安全である。

- delivery eligibility proof request。
- residence proof request。
- AOID ownership proof request。
- duplicate nullifier check。
- credential freshness check。
- public AGID context lookup。
- encrypted owner channel handoff。

### 16.3 買い物 Agent

買い物 Agent では、ユーザーの住所を Agent に渡さずに次の判断ができる。

```text
配送可能地域内か。
同一住所の重複登録ではないか。
AOID 所有者か。
credential が失効していないか。
配送用途に同意しているか。
```

この構造により、Agent は住所の詳細を知らなくても配送判断を補助できる。ただし最終配送の実行には、配送業者または owner-authorized encrypted channel が必要になる。

## 17. Polkadot・分散台帳連携

AOID をチェーンに載せる場合、載せてよいのは commitment、root、registry record、proof bundle metadata である。AOID plaintext、住所本文、電話番号、部屋番号、配送指示、owner private key は載せない。

安全な on-chain/off-chain 分離は次である。

| on-chain | off-chain |
| --- | --- |
| proof bundle id | AOID private payload |
| revocation root | address credential private salt |
| freshness root | recipient / phone / unit |
| issuer registry commitment | owner private key |
| delegation commitment | detailed delivery instruction |
| lineage commitment | raw address history |

Polkadot 連携は、AOID ownership、delegation、QR reissue、sharing commitment、inheritance policy、history proof、proof bundle registry に有効である。ただし、チェーンは個人情報を忘れにくい。したがって AOID では、チェーンに載せる情報は削除不能性を前提に最小化しなければならない。

## 18. セキュリティモデル

### 18.1 保護対象

AOID で保護すべき情報は次である。

- AOID 本文。
- 受取人名。
- 電話番号。
- 部屋番号。
- 建物内の到達経路。
- 配送指示。
- アクセスコード。
- 正確な私的座標。
- owner private key。
- device key。
- credential private salt。
- hidden address。
- nullifier の domain salt。

### 18.2 攻撃者モデル

想定する攻撃者は次である。

1. 公開 QR を拾う第三者。
2. 公開 API を呼ぶ第三者。
3. MCP client として private arguments を渡そうとするツール。
4. クラウド同期に平文 AOID を混ぜようとする実装。
5. 失効済み credential を再利用する攻撃者。
6. 同じ住所で重複登録を試みる攻撃者。
7. AOID public handle から住所本文を推測しようとする攻撃者。
8. proof scope を別用途に転用する verifier。
9. 鍵漏洩後に古い proof を replay する攻撃者。
10. オープンソースコードから秘密仕様や隠し鍵を探す攻撃者。

### 18.3 安全要件

AOID の安全要件は次である。

| 要件 | 内容 |
| --- | --- |
| S1 | AOID public descriptor は私的 field を含まない。 |
| S2 | 公開 QR は owner-managed registration にならない。 |
| S3 | encrypted sync は owner-device envelope のみ許可する。 |
| S4 | AOID plaintext は public API、MCP、OpenAPI、chain に出ない。 |
| S5 | ownership proof は scope、challenge、expiration を持つ。 |
| S6 | revocation/freshness root を検証できる。 |
| S7 | duplicate nullifier は domain-separated である。 |
| S8 | audit は raw private payload を保存しない。 |
| S9 | issuer trust registry は layer、country、schema、policy を確認する。 |
| S10 | proof bundle 同士の互換性と衝突を検査する。 |

### 18.4 残存リスク

AOID には残存リスクがある。

- public handle と linked AGID だけでも、地域粒度によっては推測リスクがある。
- 配送業者には最終的に配送に必要な情報が渡る可能性がある。
- 端末が侵害されると local-first payload が漏れる。
- owner key のバックアップを失うと復旧が難しい。
- ZK-ready envelope は、実 ZK 回路の代替ではない。
- nullifier の scope 設計を誤ると、サービス間 linkability が起きる。
- 失効 root の伝播遅延により、短時間だけ古い proof が通る可能性がある。

## 19. オープンソース安全性

AOID をオープンソースにする場合、コード公開によって漏れてはならないものを明確にする必要がある。

公開してよいもの:

- AOID ID 仕様。
- Base32 alphabet。
- linked AGID anchor rule。
- public descriptor schema。
- encrypted envelope schema。
- redaction policy。
- governance policy。
- test vectors。
- API/OpenAPI/MCP schema。
- proof-ready envelope schema。

公開してはいけないもの:

- ユーザーの AOID private payload。
- owner private key。
- device key。
- credential private salt。
- hidden address database。
- 本番 issuer secret。
- 本番 HMAC secret。
- 生配送ログ。
- 個人の電話番号や部屋番号。

オープンソース化の原則は次である。

```text
Security should come from cryptographic separation, access control,
redaction, and verification, not from hiding the AOID source code.
```

つまり、コードを公開しても安全であるためには、秘密はコードに埋め込まれず、ユーザー端末や鍵管理、暗号化 envelope、credential、root registry 側に分離されていなければならない。

## 20. 検証結果

### 20.1 実行可能な未検証項目の検証

2026-06-07 に、未検証事項のうち現行リポジトリで実行可能なものを検証した。記録は `docs/executable-unverified-verification-report-2026-06-07.md` にまとめた。

結果の要約は次である。

| 領域 | 結果 |
| --- | --- |
| AOID 形式、公開/非公開境界、所有証明、同期、proof bundle | 63 tests pass |
| 自然地理、住所検証、多言語検索、品質しきい値 | 49 tests pass |
| API/MCP/OpenAPI、秘匿述語、重複防止、地域所属 | 83 tests pass |
| 合計 | 195 tests pass |
| Lean AMTCore | pass |
| Lean AMTPaperExtensions | pass |
| Lean GeneratedGisCertificate | pass |
| PID collision budget | pass |
| GIS warning budget | pass |
| GIS strict validation | fail expected: 0 errors, 149 warnings |
| postal source static verification | pass |
| official postal source coverage | pass with caveat |
| address coverage policy | pass |

### 20.2 AOID について検証済みと言えること

現行検証に基づき、本稿で比較的強く言えることは次である。

1. AOID は 9 から 16 文字の不曖昧 Base32 ID として正規化される。
2. linked AGID がある場合、AOID は AGID hash anchor を含まなければならない。
3. 16 桁 all-same と 4 文字 sequential run は拒否される。
4. AOID public descriptor は private fields を含まない。
5. public AOID QR は owner-managed AOID として登録されない。
6. AOID encrypted sync envelope は owner-device encryption、owner key id、device key id を要求する。
7. malformed encrypted envelope は拒否される。
8. AOID ownership proof envelope は owner key、address credential、combined method を扱える。
9. duplicate nullifier は同一 hidden address/AOID/region/scope の再利用検出に使える。
10. revocation/freshness root anchoring は credential 本文を公開せずに検証できる。
11. OpenAPI、MCP、Polkadot integration は AOID plaintext を公開しない方向で gate されている。

### 20.3 まだ未検証として残すべきこと

次は未検証として残す。

1. 実 ZK 回路の soundness/zero-knowledge。
2. 実配送での成功率改善。
3. 全世界の全 AOID/住所/自然地理 coverage。
4. 商用住所検証 API への全面的優位。
5. GIS strict warning zero。
6. country-specific official postal source の完全網羅。
7. 大規模攻撃下の鍵管理・失効伝播・metadata leakage。

論文では、これらを完成済みの事実として書かない。検証計画、将来課題、実験設計として書く。

## 21. 反例と弱点

### 21.1 AOID だけでは住所真実性を保証できない

反例として、攻撃者が valid AOID 形式の文字列を作り、linked AGID anchor を含めたとしても、その攻撃者が本当にその住所の正当な owner であるとは限らない。

したがって、AOID ID の形式検査は ownership proof ではない。owner key、credential、issuer trust、revocation、freshness、challenge、scope が必要である。

### 21.2 linked AGID は部屋番号を表さない

同じ AGID に複数の部屋、店舗、倉庫、ロッカー、仮設住所が存在する。linked AGID anchor が一致しても、AOID payload が同じとは限らない。

したがって、AGID anchor は公開地理文脈の結合条件であり、私的住所の完全同一性ではない。

### 21.3 public handle は推測耐性を完全保証しない

AOID public handle が十分短い、地域が狭い、利用者が少ない、公開文脈が特殊である場合、handle と AGID anchor から何らかの推測が可能になることがある。

したがって、高リスク用途では、public handle の露出、linked AGID 粒度、rotation、scope、匿名化、batching を検討する必要がある。

### 21.4 local-first は端末侵害に弱い

AOID の平文を端末に置くことは、中央漏洩を減らすが、端末侵害には弱い。暗号化ストレージ、生体認証、OS keychain、端末ロック、バックアップ暗号化、remote revocation が必要である。

### 21.5 ZK-ready envelope は ZKP ではない

proof-ready envelope を持っていても、それだけで zero-knowledge は証明されない。回路、制約、witness assignment、commitment scheme、proof system、verifier、trusted setup の有無、監査が必要である。

## 22. 論文上の安全な主張境界

AOID 論文で採用すべき表現は次である。

```text
AOID is an owner-managed private address identifier linked to public AGID
context but separated from public geographic identity. Its public surface is
limited to opaque handles, linked AGID anchors, commitments, status, version,
and proof metadata. Recipient names, phone numbers, unit numbers, exact private
coordinates, delivery instructions, owner keys, and credential salts are kept
local or encrypted.
```

避けるべき表現は次である。

```text
AOID proves the real address.
AOID is a complete zero-knowledge proof system.
AOID can be safely published as plaintext.
AOID guarantees delivery success.
AOID replaces all postal and commercial delivery validation.
```

AOID の強さは、万能性ではなく、境界の明確さにある。公開地理は AGID、意味論は AMT、永続解決は PID、秘匿証明は ZKP、私的所有者管理は AOID、という分離が保たれるほど、システム全体は安全になる。

## 23. 今後の検証計画

### 23.1 ZK 回路化

AOID ownership、delivery eligibility、residence、duplicate nullifier、quality threshold、freshness、revocation、consent scope を ZK circuit relation として実装する。

候補言語は次である。

- Noir。
- Circom。
- Rust zkVM。
- Halo2 系。
- RISC Zero / SP1 系。

評価項目は、constraint 数、proof size、verification time、witness leakage、domain separation、mobile generation feasibility である。

### 23.2 実配送実験

AOID が配送成功率を改善するかは、実配送ログが必要である。

必要な指標:

- 初回配送成功率。
- 誤配率。
- 返品率。
- 再配達率。
- 配送時間。
- 住所入力エラー率。
- ユーザー訂正回数。
- AOID rotation 後の失敗率。

### 23.3 商用 API 比較

Loqate、Experian、Melissa、Smarty などと比較するには、同一入力、同一国、同一評価粒度、同一 ground truth が必要である。

評価軸:

- parse accuracy。
- normalize accuracy。
- deliverability judgment。
- postal code correction。
- rural/island/desert/mountain coverage。
- multilingual recall。
- false positive。
- unresolved/reject safety。
- privacy and data retention。

### 23.4 世界 coverage

AOID は AGID と住所検証 engine に依存するため、世界 coverage は国別・地域別・地形別に測る必要がある。

分類例:

- 都市。
- 田舎。
- 島。
- 山地。
- 砂漠。
- 湿地。
- 氷原。
- 草原。
- 森林。
- 洞窟。
- 谷。
- 川。
- 滝。
- 遺跡。
- 世界遺産。
- 仮設住所。

## 24. 実装準拠スキーマ

本章では、AOID を論文上の抽象概念にとどめず、実装可能なデータ構造として定義する。ここで重要なのは、AOID を「住所本文を短くした文字列」として扱わないことである。AOID は、公開参照、私的 payload、暗号化同期、所有証明、失効、監査を分離するための schema family である。

### 24.1 名称の固定

本稿では AOID を **Address Owner Identifier** と呼ぶ。これは、AOID の中心が「住所 object」ではなく「所有者が管理する私的住所 relation」にあるためである。

一部の初期資料では AOID を Address Object Identifier と説明していたが、本稿ではこれを互換 alias として扱う。標準名は Address Owner Identifier とする。

```text
preferred: Address Owner Identifier
legacy alias: Address Object Identifier
reason: AOID controls owner authority, delegation, private delivery payload,
        credential binding, revocation, and encrypted sync.
```

### 24.2 AOID record

AOID record は、所有者端末または owner-authorized encrypted storage に置かれる内部 record である。形式的には次である。

\[
\mathsf{AOIDRecord}
=
(\mathsf{id},\mathsf{agid},\mathsf{country},\mathsf{version},
\mathsf{status},\mathsf{storageMode},\mathsf{syncReadiness},
\mathsf{publicHandle},\mathsf{privatePayload},\mathsf{timestamps})
\]

ここで、\(\mathsf{privatePayload}\) は公開 schema から除外される。実装上は `recipient`、`phone`、`unit`、`room`、`floor`、`deliveryInstructions`、`accessInstructions`、`privateNote`、`lat`、`lon`、`lng` などが private field として扱われる。

### 24.3 AOID public descriptor

AOID public descriptor は、AOID を外部 surface に出すときの最小公開表現である。

\[
\mathsf{AOIDPublicDescriptor}
=
(\mathsf{type},\mathsf{id},\mathsf{agid},\mathsf{country},
\mathsf{version},\mathsf{status},\mathsf{publicHandle},\mathsf{privacy})
\]

安全条件は次である。

\[
\mathsf{privacy}=\texttt{public-reference}
\]

かつ

\[
\mathsf{AOIDPublicDescriptor}\cap \mathsf{PrivateFields}=\varnothing.
\]

この descriptor は所有証明ではない。公開 QR、公開 API、MCP、OpenAPI、分散台帳 registry に出してよいのはこの descriptor または commitment/root/proof metadata に限る。

### 24.4 AOID encrypted sync envelope

クラウドやサーバーへ AOID を同期する場合、平文 record を送ってはならない。同期に許される形式を次で定義する。

\[
\mathsf{AOIDSyncEnvelope}
=
(\mathsf{type},\mathsf{id},\mathsf{agid},\mathsf{publicHandle},
\mathsf{version},\mathsf{status},\mathsf{encryptedPayload},
\mathsf{encryption},\mathsf{ownerKeyId},\mathsf{deviceKeyId},\mathsf{updatedAt})
\]

必要条件は次である。

```text
type = AOID_SYNC_ENVELOPE
encryption = owner-device
encryptedPayload is opaque
ownerKeyId is present
deviceKeyId is present
id is a valid AOID
```

ここで `opaque` とは、少なくとも AOID private field を raw JSON として含まないことを意味する。これは暗号学的安全性の完全証明ではないが、平文混入を防ぐための実装 gate である。

### 24.5 ownership proof envelope

AOID ownership proof envelope は、AOID 本文や住所本文を出さずに、所有者鍵または登録済み住所 credential の保持を示すための proof-ready object である。

\[
\mathsf{OwnershipEnvelope}
=
(\mathsf{claim},\mathsf{issuerSignature},
\mathsf{ownerSignature?},\mathsf{publicOwnerKey?},
\mathsf{privateProofSalt?},\mathsf{localCacheKey})
\]

claim は次を含む。

- method。
- scope。
- challenge hash。
- issuedAt。
- expiresAt。
- AOID commitment。
- owner key fingerprint。
- credential summary。
- privacy metadata。
- proof hint。

ここで `proofHint.zkReady = true` は、ZK 回路へ移植可能な statement/witness 分離があることを意味する。一方、`proofHint.zkpGenerated = false` の場合、それは実 ZK proof ではない。

## 25. AOID 発行・正規化アルゴリズム

### 25.1 発行アルゴリズム

AOID 発行は次の手順で行う。

```text
Input:
  optional linked AGID g

Procedure:
  1. If g is present, compute anchor(g).
  2. Choose random suffix r from the AOID Base32 alphabet.
  3. Construct i = anchor(g) || r if g is present.
     Otherwise construct i = r.
  4. Normalize i.
  5. Reject if i violates length, alphabet, all-same, sequential-run,
     or linked AGID consistency rules.
  6. Return i.
```

生成仕様では linked AGID anchor を先頭に置く。ただし検証仕様では、将来の互換性を考慮し、linked AGID が指定された場合に anchor を含むことを必要条件とする。実装をより厳格にしたい場合は、`contains` ではなく `startsWith(anchor)` を要求する variant を導入できる。

### 25.2 正規化関数

正規化関数を

\[
\mathsf{norm}_A:\mathsf{String}\times (G_t\cup\{\bot\})\rightharpoonup A_t
\]

とする。入力文字列と任意の linked AGID を受け取り、valid AOID なら正規化済み AOID を返し、そうでなければ未定義になる。

\[
\mathsf{norm}_A(x,g)=
\begin{cases}
\operatorname{upper}(x) & \text{if } \operatorname{ValidAOID}(\operatorname{upper}(x),g),\\
\bot & \text{otherwise.}
\end{cases}
\]

### 25.3 補題: 予約パターン拒否

**補題 1 (reserved-pattern rejection).** AOID 正規化関数が 16 桁 all-same と 4 文字 sequential run を拒否するなら、代表的なテスト文字列、見せかけの連番、予約値、低品質な人間入力を valid AOID として受け入れにくくなる。

**証明の骨子.** 16 桁 all-same は \(\exists c. i=c^{16}\) で特徴付けられる。4 文字 sequential run は alphabet index の差分が連続して \(+1\) または \(-1\) になる window で検出できる。これらを拒否すれば、単純反復列と短い連番列は valid language から除外される。ただしこれは乱数強度や衝突耐性の証明ではない。□

### 25.4 補題: linked AGID 整合性

**補題 2 (linked anchor consistency).** linked AGID \(g\) が指定された AOID \(i\) について、\(\operatorname{anchor}(g)\not\subseteq i\) なら \(i\) は \(g\) に linked された AOID として受理されない。

**証明.** Valid AOID の定義に linked AGID consistency が含まれるため、anchor を含まない \(i\) は valid condition を満たさない。□

### 25.5 命題: AOID は AGID を内包し得るが AGID ではない

**命題 3.** AOID が linked AGID anchor を含むとしても、AOID と AGID は同一ではない。

**証明.** AGID は公開地理文脈を表す。AOID は所有者、私的 payload、scope、credential、状態、暗号化同期、委譲を含む relation を表す。AOID の ID 文字列が AGID anchor を含んでも、AOID record の意味は AGID record の意味と一致しない。したがって AOID は AGID を参照・内包し得るが、AGID そのものではない。□

## 26. 状態機械と監査イベント

### 26.1 状態集合

AOID の基本状態集合を次で置く。

\[
Q_A=\{\mathsf{active},\mathsf{revoked},\mathsf{rotated}\}.
\]

必要に応じて、実運用では `pending`, `suspended`, `expired`, `delegated`, `recovery` などを追加できる。ただし本稿の最小状態機械は上記三状態である。

### 26.2 イベント集合

AOID event を次で分類する。

| event | 意味 | owner authority 必須 |
| --- | --- | --- |
| create | AOID を作成する | yes |
| update-private-payload | 受取・配送 payload を更新する | yes |
| publish-public-descriptor | 公開参照を出す | yes または policy |
| encrypt-sync | encrypted envelope を作る | yes |
| rotate | 新 AOID へ回転する | yes |
| revoke | AOID を失効させる | yes |
| delegate | 委譲を作る | yes |
| revoke-delegation | 委譲を取り消す | yes |
| prove-ownership | 所有証明 envelope を作る | witness required |
| prove-delivery-eligibility | 配送可能性を証明する | credential or policy required |

### 26.3 遷移表

最小遷移表は次である。

| from | event | to | 条件 |
| --- | --- | --- | --- |
| none | create | active | valid AOID、owner authority |
| active | update-private-payload | active | owner or delegate scope |
| active | encrypt-sync | active | encrypted envelope valid |
| active | rotate | rotated | successor AOID present |
| active | revoke | revoked | owner authority |
| rotated | revoke | revoked | owner authority |
| revoked | update-private-payload | rejected | 失効済み |
| revoked | prove-ownership | rejected | freshness/revocation fail |

### 26.4 不変条件

AOID 状態機械は次の不変条件を守るべきである。

\[
\mathsf{Inv}_1(a):\operatorname{ValidAOID}(\mathsf{id}(a)).
\]

\[
\mathsf{Inv}_2(a):\operatorname{Pub}(a)\cap\mathsf{PrivateFields}=\varnothing.
\]

\[
\mathsf{Inv}_3(a):\mathsf{syncReadiness}(a)=\mathsf{encrypted\text{-}sync\text{-}ready}
\Rightarrow \mathsf{SyncEnvelopeValid}(a).
\]

\[
\mathsf{Inv}_4(a):\mathsf{status}(a)=\mathsf{revoked}
\Rightarrow \mathsf{OwnershipProofAccept}(a)=0.
\]

### 26.5 監査イベント

監査ログは必要だが、生の AOID private payload を保存してはならない。監査 event は次のようにする。

\[
\mathsf{AuditEvent}
=
(\mathsf{eventType},\mathsf{layer},\mathsf{surface},
\mathsf{decision},\mathsf{payloadClass},\mathsf{publicFingerprint},
\mathsf{policyVersion},\mathsf{timestamp})
\]

禁止される監査項目は、受取人、電話番号、部屋番号、配送指示、private coordinate、owner private key、credential private salt である。

## 27. プロトコル仕様

### 27.1 ローカル作成プロトコル

```text
OwnerDevice:
  1. Resolve or select public AGID context if available.
  2. Generate AOID id.
  3. Create private payload locally.
  4. Store AOID record in device-local storage.
  5. Optionally create owner key pair and address credential binding.
  6. Return public descriptor only when explicitly requested.
```

このプロトコルでは、AOID private payload は作成時点で外部 server に送られない。

### 27.2 暗号化同期プロトコル

```text
OwnerDevice:
  1. User opts in to cloud sync.
  2. Device obtains ownerKeyId and deviceKeyId.
  3. Private AOID payload is encrypted locally.
  4. Device constructs AOID_SYNC_ENVELOPE.
  5. Server accepts only valid encrypted envelope.
  6. Server stores opaque payload and public metadata.
```

サーバーは AOID plaintext を復号できない設計にする。復号が必要な場合は、所有者端末または owner-authorized device が行う。

### 27.3 公開参照プロトコル

```text
PublicSurface:
  1. Receive AOID public descriptor.
  2. Validate AOID id.
  3. Check privacy = public-reference.
  4. Reject if private fields are present.
  5. Treat descriptor as reference, not as ownership proof.
```

### 27.4 所有証明プロトコル

```text
Prover:
  1. Hold owner private key or AOID address credential.
  2. Receive verifier challenge and scope.
  3. Build AOID commitment and challenge hash.
  4. Sign or bind claim with owner key / credential summary.
  5. Include expiry and privacy metadata.

Verifier:
  1. Check issuer signature.
  2. Check owner signature if provided.
  3. Check scope and challenge.
  4. Check expiry, revocation, issuer trust if available.
  5. Accept authority only for the declared scope.
```

### 27.5 重複防止プロトコル

```text
Prover:
  1. Compute domain-separated nullifier for hidden tuple.
  2. Prove knowledge of tuple opening or provide ZK-ready envelope.

Registry:
  1. Check whether nullifier exists.
  2. If exists, reject duplicate or require review.
  3. If new, store nullifier only.
```

### 27.6 配送可能性プロトコル

```text
Prover:
  1. Hold AOID private payload or credential.
  2. Bind hidden AOID to public delivery policy.
  3. Prove delivery-eligible predicate for a declared scope.

Delivery verifier:
  1. Learns only delivery eligibility decision.
  2. Does not learn raw address, phone, unit, or access instruction.
  3. Receives actual delivery details only through an owner-authorized channel.
```

## 28. 詳細セキュリティ分析

### 28.1 公開 handle 推測

AOID public handle は opaque であるべきだが、linked AGID anchor や公開文脈が狭すぎる場合、攻撃者が地域や施設を推測する可能性がある。対策は次である。

- AGID 粒度を用途に応じて粗くする。
- 高リスク用途では public handle を頻繁に rotation する。
- proof bundle では AOID id ではなく commitment を使う。
- 公開 registry では batch root を使い、個別 handle を減らす。

### 28.2 public QR の取り違え

公開 AOID QR は所有証明ではない。第三者が QR を読み取っても owner になれないようにするには、public QR import を `public-reference` として扱い、owner-managed registration には owner key または credential proof を要求する。

### 28.3 cloud sync 漏洩

クラウド同期は最も危険な surface の一つである。対策は次である。

- user opt-in がない場合は `local-only`。
- encrypted payload、ownerKeyId、deviceKeyId が揃わない場合は `blocked`。
- AOID private fields を含む raw object は public descriptor に redaction する。
- malformed envelope は拒否する。
- サーバー監査 log は payload fingerprint のみにする。

### 28.4 owner key 漏洩

owner private key が漏洩すると、AOID 更新や proof 生成が危険になる。対策は次である。

- 短命 proof。
- revocation root。
- key rotation。
- device binding。
- recovery credential。
- multi-signature または guardian model。
- 高リスク操作の step-up authentication。

### 28.5 nullifier linkability

同じ nullifier を複数 domain で使うと、住所や owner を知らなくても同一主体をリンクできる。対策は、domain、purpose、region、issuer、epoch を public domain separator として入れることである。

\[
N=\operatorname{Hash}(\mathsf{domain}\Vert \mathsf{purpose}\Vert
\mathsf{region}\Vert \mathsf{epoch}\Vert \mathsf{hiddenTuple}\Vert s)
\]

### 28.6 実 ZK への移行リスク

ZK-ready envelope は便利だが、ZK 回路化すると新しいリスクが生じる。

- witness assignment が private field を漏らす。
- public inputs が細かすぎて住所を推測させる。
- range proof が境界情報を漏らす。
- issuer trust と revocation root が古い。
- proof bundle 同士が同じ commitment を使い回して linkability を生む。

したがって AOID ZK 化では、零知識住所述語論文の proof bundle compatibility、scope、freshness、revocation、anonymous rate limit と合わせて設計する必要がある。

## 29. AOID と AGID/PID/ZKP の境界設計

AOID の論文で最も重要なのは、他の識別子との境界である。

| 層 | 中心概念 | 公開性 | AOID との関係 |
| --- | --- | --- | --- |
| AMT | 住所意味論、候補、クラスタ、unresolved、履歴 | 理論 | AOID の前段意味論を与える。 |
| PID | 解決済み参照の永続識別 | 条件付き公開 | AOID が参照し得るが、所有者権限ではない。 |
| AGID | 公開地理・地物文脈 | 原則公開 | AOID が anchor として内包し得る。 |
| AOID | owner-managed private address relation | private by default | 本稿の対象。 |
| ZKP | 住所由来属性の秘匿証明 | proof のみ公開 | AOID は witness/commitment source になる。 |

境界を誤ると、次の事故が起きる。

- AGID に AOID private payload を入れる。
- PID 発行を AOID 所有証明と混同する。
- public QR を owner credential と誤認する。
- ZK-ready envelope を完成済み ZKP と誤記する。
- linked AGID anchor を部屋番号や受取人証明のように扱う。

AOID の安全な設計は、これらの混同を防ぐことにある。

## 30. 評価指標

AOID の性能は、単純な住所解決精度だけでは測れない。次の指標群で評価する。

### 30.1 ID 品質

| 指標 | 意味 |
| --- | --- |
| valid acceptance rate | 正しい AOID が受理される割合。 |
| invalid rejection rate | 不正文字、短すぎる文字列、all-same、sequential-run が拒否される割合。 |
| anchor consistency | linked AGID anchor 不一致を拒否できるか。 |
| collision estimate | 生成空間に対する衝突予算。 |
| readability | I/L/O など曖昧文字を避けた人間可読性。 |

### 30.2 privacy 品質

| 指標 | 意味 |
| --- | --- |
| private field leakage rate | 公開 descriptor/API/QR/MCP に private field が混入する割合。 |
| encrypted sync compliance | sync payload が encrypted envelope 条件を満たす割合。 |
| public QR safety | public QR が owner registration に誤用されないか。 |
| metadata inference risk | linked AGID、status、handle から推測されるリスク。 |
| audit raw-payload absence | 監査 log が raw private payload を保存しないか。 |

### 30.3 ownership/credential 品質

| 指標 | 意味 |
| --- | --- |
| challenge binding | challenge の再利用を拒否できるか。 |
| scope binding | 用途違い proof を拒否できるか。 |
| expiry enforcement | 期限切れ proof を拒否できるか。 |
| revocation enforcement | 失効済み credential を拒否できるか。 |
| issuer trust validation | issuer、schema、policy の不一致を拒否できるか。 |

### 30.4 配送・運用品質

AOID の実配送効果は実験で測る必要がある。

- 初回配送成功率。
- 再配達率。
- 誤配率。
- 返品率。
- ロッカー配送成功率。
- 仮設住所/避難所配送成功率。
- owner update 後の配送失敗率。
- AOID rotation 後の復旧時間。

これらは現時点で本稿が証明するものではない。将来の field benchmark の対象である。

## 31. 論文としての主張体系

本稿の主張は、検証可能性ごとに分ける。

### 31.1 形式的に扱える主張

1. Valid AOID の言語定義。
2. 公開射影が private field を含まないこと。
3. linked AGID anchor の整合性。
4. 状態機械の基本不変条件。
5. scope/challenge/expiry による replay・用途転用防止の必要条件。

### 31.2 実装テストで支持される主張

1. AOID 正規化は不正 ID を拒否する。
2. public descriptor は private field を含まない。
3. encrypted sync envelope は owner-device encryption と key id を要求する。
4. malformed envelope は拒否される。
5. AOID ownership proof envelope は owner key、credential、combined method を扱う。
6. public API/MCP/OpenAPI/Polkadot surface は AOID plaintext を公開しない方向で gate されている。

### 31.3 実験・監査が必要な主張

1. AOID が実配送成功率を改善する。
2. AOID が商用住所検証 API に品質面で勝る。
3. AOID ZKP 回路が soundness と zero-knowledge を満たす。
4. 全世界で自然地理・住所・配送可能性 coverage が十分である。
5. 大規模攻撃下で metadata leakage が許容範囲に収まる。

### 31.4 定理: AOID の責務分離

**定理 2 (AOID responsibility separation).** AMT、AGID、PID、ZKP をそれぞれ意味論、公開地理参照、永続解決参照、秘匿証明とし、AOID を owner-managed private address relation として定義するなら、AOID は各層を置き換えずに接続する応用層として位置づけられる。

**証明の骨子.** AMT は候補生成と解決意味論を与える。AGID は公開地理文脈を与える。PID は解決済み参照の永続性を与える。ZKP は選択的開示を与える。AOID は所有者、私的 payload、権限、credential、同期、失効を管理する。各層の入出力と公開性が異なるため、AOID はそれらの代替ではなく、接続 relation として働く。□

## 32. 結論

AOID は、住所写像論の上に構築される、所有者管理型の私的住所識別子である。AGID が公開地理を扱うのに対し、AOID は private delivery relation、owner authority、credential、encrypted sync、revocation、delegation、proof-ready envelope を扱う。

AOID の重要性は、住所を公開しなくても、住所由来の操作や証明を行える基盤を与える点にある。配送可能性、AOID 所有、同一住所の重複防止、居住属性、失効・鮮度、用途 scope は、AOID と ZK-ready envelope によって整理できる。

ただし AOID は万能ではない。AOID ID だけでは住所真実性を証明しない。AOID は実 ZK 回路そのものではない。AOID は実配送成功を保証しない。これらを正直に分離することが、AOID を本格的な論文・仕様・オープンソース実装へ育てるために不可欠である。

本稿の推奨は明確である。

```text
AGID は公開する。
AOID は所有者が管理する。
AOID 本文は公開しない。
公開面は handle、linked AGID、commitment、proof metadata に限定する。
配送や本人確認には、credential、revocation、freshness、scope、ZK proof を組み合わせる。
```

この分離により、AOID は住所写像論の応用として、買い物 Agent、MCP、配送、災害支援、credential marketplace、Polkadot 連携、ZK Address Proof に接続できる。

## 付録 A: AOID 仕様要約

| 項目 | 仕様 |
| --- | --- |
| 名称 | Address Owner Identifier |
| 略称 | AOID |
| 主体 | owner、family、company、organization、facility |
| 目的 | 私的住所・配送・所有者権限の管理 |
| 公開性 | private by default |
| 公開面 | id、linked AGID、public handle、status、version、commitment、proof metadata |
| 私的面 | recipient、phone、unit、delivery instructions、owner key、credential salt |
| ID 長 | 9 から 16 文字 |
| alphabet | unambiguous Base32 |
| linked AGID | AGID hash anchor を含む |
| 禁止 pattern | 16 all-same、4 sequential run |
| default storage | device-local |
| optional sync | owner-device encrypted envelope |
| status | active、revoked、rotated |
| public QR | reference-only |
| private QR | trusted-device transfer |
| ZK | proof-ready witness source、実回路は別途 |

## 付録 B: AOID の主要命題

**定義 B1 (AOID public descriptor).** AOID public descriptor は \((id,agid,status,version,publicHandle,privacy)\) からなる公開参照である。

**定義 B2 (AOID private payload).** AOID private payload は、所有者が管理する受取・配送・権限・住所詳細情報である。

**命題 B1 (AGID/AOID separation).** AGID は公開地理文脈、AOID は私的所有者操作文脈を扱う。両者を同一 payload に平文混在させると、公開地理参照が個人情報漏洩面になる。

**命題 B2 (Public QR non-ownership).** AOID public QR は所有証明ではない。したがって public QR を読み込んだ主体が owner-managed AOID を取得したとはみなせない。

**命題 B3 (Encrypted sync gate).** AOID sync が owner-device encrypted envelope を要求するなら、平文 private AOID record は sync surface に到達しない。

**命題 B4 (Scope-bound proof).** AOID proof が scope と challenge を含むなら、異なる用途または古い challenge への転用は検出可能になる。

**命題 B5 (Revocation/freshness necessity).** AOID は所有者管理・委譲・回転を含むため、proof と credential は revocation と freshness を持たなければ安全に使えない。

## 付録 C: 可換図式

### C.1 AGID/AOID/AMT 分離

```text
住所表現 s
   |
   | AMT candidate / cluster / unresolved / PID
   v
参照実体または PID  ---------> 公開地理文脈 AGID
       |                              |
       | owner-managed private layer  | public evidence
       v                              v
      AOID -----------------------> public descriptor
       |
       | witness / credential / encrypted payload
       v
   ZK-ready proof bundle
```

この図式で、AOID から public descriptor への射影は可逆であってはならない。public descriptor から private payload を復元できると、AOID の設計目的が壊れる。

### C.2 公開/非公開射影

```text
AOID record a
  |\
  | \ private witness
  |  \
  |   v
  |  owner key / credential / private payload
  |
  v public projection
public descriptor
  |
  v
QR / API / MCP / chain commitment
```

公開 surface は右下へ進むが、private witness は公開 surface に合流しない。

### C.3 配送可能性 proof

```text
AOID private payload + linked AGID + delivery policy
        |
        | hidden witness
        v
ZK-ready delivery eligibility relation
        |
        | public statement
        v
"delivery eligible within scope" proof
```

公開 statement は配送可能性だけを示し、住所本文は公開しない。

## 付録 D: 実装対応表

| 概念 | 実装または文書 |
| --- | --- |
| AOID ID 正規化 | `src/lib/aoid.ts` |
| AOID public descriptor | `src/lib/aoid.ts` |
| AOID encrypted sync envelope | `src/lib/aoid.ts` |
| AOID ownership proof | `src/lib/aoidOwnershipProof.ts` |
| AGID/AOID governance | `src/lib/agidAoidGovernance.ts` |
| privacy redaction | `src/lib/privacyPolicy.ts` |
| QR model | `src/lib/registeredAddressQr.ts` |
| sync queue policy | `src/lib/syncQueue.ts` |
| issuer trust | `src/lib/credentialIssuerTrustRegistry.ts` |
| revocation/freshness | `src/lib/revocationFreshnessRootAnchoring.ts` |
| duplicate nullifier | `src/lib/addressDuplicateNullifier.ts` |
| region membership | `src/lib/regionMembershipProof.ts` |
| proof bundle compatibility | `src/lib/zkProofCompatibility.ts` |
| proof bundle registry | `src/lib/zkProofBundleRegistry.ts` |
| OpenAPI | `src/lib/openApiSpec.ts` |
| MCP | `src/lib/mcpServer.ts` |
| Polkadot integration | `src/lib/polkadotIntegration.ts` |
| 検証結果 | `docs/executable-unverified-verification-report-2026-06-07.md` |

## 付録 E: 採用できる主張と未採用主張

| 主張 | 状態 | 本稿での扱い |
| --- | --- | --- |
| AOID は AGID anchor を含み得る private identifier である | 採用 | 実装テストで支持。 |
| AOID public descriptor は private field を含まない | 採用 | 実装テストで支持。 |
| AOID sync は encrypted envelope を要求する | 採用 | 実装テストで支持。 |
| AOID ownership proof envelope は ZK-ready である | 採用 | ただし実 ZK ではない。 |
| AOID は住所真実性を単独証明する | 不採用 | credential と証明が必要。 |
| AOID は実配送成功を保証する | 不採用 | 実配送実験が必要。 |
| AOID は商用 API に全面勝利している | 不採用 | 同一条件 benchmark が必要。 |
| AOID は全世界の住所を完全に扱える | 不採用 | coverage 検証が必要。 |
| AOID は完全な ZKP である | 不採用 | 回路と監査が必要。 |

## 付録 F: AOID 数理仕様総覧

本付録は、本文に散在する定義、補題、命題、定理を AOID 仕様として一覧化する。

### F.1 基本空間

\[
\begin{aligned}
G_t &: \text{公開 AGID 文脈空間},\\
A_t &: \text{AOID ID 空間},\\
O_t &: \text{所有者・所有者端末空間},\\
S_t &: \text{私的住所 payload 空間},\\
K_t &: \text{鍵・credential・commitment 空間},\\
R_t &: \text{権限・同意・用途 scope 空間},\\
H_t &: \text{履歴 event 空間},\\
Q_A &: \{\mathsf{active},\mathsf{revoked},\mathsf{rotated}\}.
\end{aligned}
\]

### F.2 AOID record

\[
a_t=(i,\alpha,g,o,c,\operatorname{Enc}_{k}(\sigma),r,h,v,q)
\]

ここで

\[
i\in A_t,\quad g\in G_t,\quad o\in O_t,\quad
\sigma\in S_t,\quad k\in K_t,\quad r\in R_t,\quad h\in H_t,\quad q\in Q_A.
\]

### F.3 公開射影

\[
\operatorname{Pub}(a_t)=(i,\alpha,g,c,q,v)
\]

\[
\operatorname{Wit}(a_t)=(o,\sigma,k,r,h)
\]

安全条件:

\[
\operatorname{Pub}(a_t)\cap\operatorname{Fields}(\sigma)=\varnothing.
\]

### F.4 Valid AOID language

\[
\operatorname{ValidAOID}(i,g)
\Leftrightarrow
i\in\Sigma_A^{9..16}
\land \neg\operatorname{AllSame16}(i)
\land \neg\operatorname{SequentialRun4}(i)
\land \operatorname{AnchorOK}(i,g).
\]

\[
\operatorname{AllSame16}(i)
\Leftrightarrow |i|=16\land \exists c.\ i=c^{16}.
\]

\[
\operatorname{SequentialRun4}(i)
\Leftrightarrow
\exists j,d\in\{1,-1\}.
\bigwedge_{m=0}^{2}
\nu(i_{j+m+1})-\nu(i_{j+m})=d.
\]

\[
\operatorname{AnchorOK}(i,g)
\Leftrightarrow
g=\bot \lor \operatorname{anchor}(g)\subseteq i.
\]

### F.5 状態遷移

\[
\delta_A:A_t\times E_t\rightharpoonup A_{t+1}
\]

\[
\delta_A(a,e)\neq\bot\Rightarrow \operatorname{Auth}(o,e,a)=1.
\]

不変条件:

\[
\mathsf{Inv}_1(a):\operatorname{ValidAOID}(\mathsf{id}(a)).
\]

\[
\mathsf{Inv}_2(a):\operatorname{Pub}(a)\cap\mathsf{PrivateFields}=\varnothing.
\]

\[
\mathsf{Inv}_3(a):\mathsf{syncReady}(a)\Rightarrow\mathsf{SyncEnvelopeValid}(a).
\]

\[
\mathsf{Inv}_4(a):\mathsf{revoked}(a)\Rightarrow\neg\mathsf{ProofAccept}(a).
\]

### F.6 公理

**公理 F-A1 (private payload separation).** AOID private payload は公開 descriptor に含めない。

**公理 F-A2 (owner-controlled mutation).** AOID private payload と authority state の変更は owner または正当 delegate に限る。

**公理 F-A3 (encrypted cloud sync).** cloud/server sync は owner-device encrypted envelope を必要条件とする。

**公理 F-A4 (public QR non-ownership).** AOID public QR は owner-managed registration や ownership proof を意味しない。

**公理 F-A5 (scope-bound proof).** AOID proof は scope、challenge、freshness を含むべきである。

### F.7 補題・命題・定理

**補題 F-L1 (reserved-pattern rejection).** all-same16 と sequential-run4 を拒否すれば、単純反復・短連番の AOID は valid language から除外される。

**補題 F-L2 (linked anchor consistency).** linked AGID が指定され、AOID が anchor を含まない場合、その AOID は linked AOID として受理されない。

**命題 F-P1 (AOID is not AGID).** AOID が AGID anchor を含んでも、AOID は AGID ではない。

**命題 F-P2 (public descriptor non-ownership).** AOID public descriptor は所有証明ではない。

**命題 F-P3 (encrypted sync gate).** encrypted sync envelope を必要条件にすれば、公開同期 surface へ平文 private payload が到達しにくくなる。

**命題 F-P4 (nullifier duplicate detection).** domain-separated nullifier registry は同一 scope 内の重複登録候補を検出できる。

**定理 F-T1 (public/private surface separation).** public descriptor と encrypted envelope gate が enforcement されるなら、公開 surface に AOID private payload の平文は現れない。

**定理 F-T2 (responsibility separation).** AOID は AMT、AGID、PID、ZKP を置き換えず、owner-managed private address relation として接続する。

## 付録 G: 実装チェックリスト

### G.1 ID 実装

- AOID alphabet は不曖昧 Base32 である。
- 長さは 9 から 16 文字である。
- 生成時は 16 文字を標準とする。
- linked AGID がある場合、AGID hash anchor を内包する。
- 16 桁 all-same を拒否する。
- 4 文字 sequential run を拒否する。
- 将来の strict mode では `startsWith(anchor)` を検討する。

### G.2 privacy 実装

- public descriptor は private field を含まない。
- public QR は `public-reference` として扱う。
- private QR は trusted-device transfer に限定する。
- sync は encrypted envelope のみ許可する。
- public API/MCP/OpenAPI/chain は AOID plaintext を受け付けない。
- audit log は raw private payload を保存しない。

### G.3 proof 実装

- ownership proof は scope を必須にする。
- challenge hash を含める。
- expiration を含める。
- issuer signature を検査する。
- owner signature を検査できる場合は検査する。
- credential score、status、issuer trust を検査する。
- `zkReady` と実 ZKP 完成を混同しない。

### G.4 operation 実装

- revoked AOID の proof を拒否する。
- rotated AOID は successor relation を持つ。
- delegation は scope、expiry、revocation を持つ。
- inheritance は通常の delegation より強い証拠と紛争処理を要求する。
- emergency/disaster AOID は短命 credential と再検証を要求する。

## 付録 H: 論文で使う安全な日本語表現

AOID については、次のように書くのが安全である。

```text
AOID は、公開 AGID 文脈に結びつく所有者管理型の私的住所識別子である。
AOID は、受取人、部屋番号、電話番号、配送指示、所有者鍵、credential salt
などを公開識別子から分離する。
AOID の公開面は public descriptor、commitment、proof metadata に限定される。
AOID は ZK-ready witness source になり得るが、実 ZK 回路そのものではない。
AOID は配送可能性や所有証明の材料を提供するが、実配送成功を保証しない。
```

避けるべき表現は次である。

```text
AOID は住所そのものを証明する。
AOID を公開すれば配送できる。
AOID は完全なゼロ知識証明である。
AOID はすべての住所 API に勝つ。
AOID は AGID と同じである。
```

## 付録 I: 追加研究課題

1. AOID strict anchor mode: AGID anchor を `contains` ではなく `prefix` として固定すべきか。
2. AOID entropy budget: 16 文字 ID と AGID anchor 内包時の suffix entropy をどう評価するか。
3. owner-device encryption: WebCrypto、OS keychain、hardware-backed key のどれを標準推奨にするか。
4. private QR transfer: 短命 challenge、device binding、one-time import をどう設計するか。
5. AOID recovery: owner key 紛失時の guardian、multi-sig、credential recovery をどう扱うか。
6. inheritance: 法的相続、家族委譲、企業拠点移管をどう形式化するか。
7. metadata privacy: linked AGID 粒度、public handle、rotation policy の推測リスクをどう測るか。
8. field benchmark: AOID が初回配送成功率、誤配率、再配達率を改善するか。
9. ZK migration: AOID ownership、delivery eligibility、duplicate nullifier をどの proof backend へ移すか。
10. internationalization: 国別住所制度、離島、山地、砂漠、湿地、氷原、仮設住所に対する AOID policy をどう分けるか。
