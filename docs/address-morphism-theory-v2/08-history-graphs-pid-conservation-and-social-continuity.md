# 第8章 履歴グラフ、PID保存、社会的連続性

## 8.0 互換ノート

本章は、現行29章構成における第12章「履歴グラフと住所保存則」、第13章「社会の連続性」、第19章「PIDと応用識別子の境界」を保存し、v2構成の第8章として再記述する。

第5章は候補を作り、第6章は候補同士の同値性を扱い、第7章は有限候補集合から安全に解決する条件を定義した。本章は、解決された参照が時間と社会変化の中でどのように保存、分岐、統合、失効、後継化されるかを定義する。

本章の基本主張は次である。

- 住所参照は静止した値ではなく、履歴を持つ対象である。
- PIDは、表面住所文字列、郵便番号、座標、配送ID、アプリ内IDと同一ではない。
- 名前変更、行政区画変更、建物建替え、入口変更、分割、統合、移転、廃止は、PIDを即座に破壊しない。
- しかし、PIDを無条件に再利用してはならない。
- 社会的連続性は重要な証拠であるが、数学的同一性そのものではない。
- RPID、DPID、application identifier を分離しなければ、配送・本人確認・ZK証明・監査で危険な混同が起きる。

本章の中心式は次である。

\[
G^H_t=(V^H_t,E^H_t)
\]

\[
\operatorname{Lineage}_t(x)
=
\{y\mid x\leadsto y \text{ in }G^H_t\}
\]

住所写像論における保存とは、文字列が変わらないことではない。保存とは、変更の前後で何が同一で、何が後継で、何が廃止され、何が別対象になったのかを、監査可能な履歴グラフとして保つことである。

---

## 8.1 なぜ履歴が必要か

住所は、実務では頻繁に変化する。

- 市町村合併。
- 行政区画変更。
- 郵便番号変更。
- 建物名変更。
- 町名変更。
- 道路名変更。
- 建物建替え。
- 入口変更。
- 配送会社の担当区域変更。
- ホテル名・施設名変更。
- 災害による避難所化。
- 一時拠点の開設と閉鎖。
- 国境、係争、管轄の変更。
- デジタルツインや仮想空間上の対応先変更。

このとき、単純な正規化システムは古い住所を「古い文字列」として扱うだけになりやすい。単純な地理IDシステムは、座標が近ければ同じ、座標が変われば別、と扱いやすい。配送システムは、配送可能であれば現住所、配送不能であれば失効、と扱いやすい。

しかしAMTでは、これらを区別する。

```text
同じ表面住所である
  != 同じ参照対象である
  != 同じ配送先である
  != 同じPIDである
  != 同じ社会的実体である
```

住所参照に必要なのは、変更を消すことではなく、変更を保存することである。

---

## 8.2 履歴グラフ

履歴グラフを次で定義する。

\[
G^H_t=(V^H_t,E^H_t)
\]

ここで、

- \(V^H_t\): 時刻 \(t\) までに観測された参照状態、PID状態、表面表現状態、配送状態、社会的実体状態のノード集合。
- \(E^H_t\): 状態間の遷移集合。

ノードは次の情報を持つ。

\[
v
=
(
\operatorname{id},
\operatorname{kind},
\operatorname{pidKind},
\operatorname{status},
\operatorname{validTime},
\operatorname{sourceVersion},
\operatorname{publicProjection}
)
\]

主な `kind` は次である。

```text
referent
surface_expression
delivery_state
social_entity
pid_state
application_identifier
```

主な `status` は次である。

```text
active
deprecated
split
merged
superseded
blocked
```

辺は次の情報を持つ。

\[
e
=
(
v_i,
v_j,
\operatorname{transitionKind},
\operatorname{effectiveTime},
\operatorname{evidence},
\operatorname{preservationClaim}
)
\]

主な遷移は次である。

```text
rename
relocation
split
merge
deprecation
successor
delivery-change
application-alias
social-continuity-claim
```

履歴グラフは、住所の版管理システムである。ただし、単なるファイル履歴ではない。履歴グラフは、社会的・空間的・配送的・識別子的な変化を同時に扱う。

---

## 8.3 RPID、DPID、応用識別子

AMTでは、少なくとも次の識別子を分離する。

### RPID

RPID は Referent Persistent Identifier である。登録可能実体または参照対象の持続的識別子を表す。

\[
\operatorname{RPID}:R_t\rightharpoonup I_R
\]

RPIDは、建物名変更や表面住所変更でただちに変わるとは限らない。

### DPID

DPID は Delivery Persistent or Delivery Purpose Identifier である。配送目的の参照可能性を表す識別子である。

\[
\operatorname{DPID}_{p}:R_t\rightharpoonup I_D
\]

DPIDは、入口変更、配送会社の区域変更、ロッカー受取、ホテル受取、時間帯制約、災害時経路変更により変わり得る。

### Application Identifier

応用識別子は、アプリ、事業者、配送会社、ホテル、EC、行政システム、ブロックチェーン、ZK verifier が内部で使う識別子である。

\[
\operatorname{AID}_{a}:R_t\rightharpoonup I_A
\]

応用識別子はPIDではない。アプリ内IDは、AMTの履歴グラフへ接続することはできるが、AMTの公共PIDを置き換えない。

---

## 8.4 識別子境界

次の含意は成り立たない。

\[
\operatorname{AID}_a(x)=\operatorname{AID}_a(y)
\centernot\Rightarrow
\operatorname{RPID}(x)=\operatorname{RPID}(y)
\]

\[
\operatorname{DPID}_p(x)=\operatorname{DPID}_p(y)
\centernot\Rightarrow
\operatorname{RPID}(x)=\operatorname{RPID}(y)
\]

\[
\operatorname{RPID}(x)=\operatorname{RPID}(y)
\centernot\Rightarrow
\operatorname{DPID}_p(x)=\operatorname{DPID}_p(y)
\]

例として、同じ建物でも入口が複数あれば配送DPIDは複数になり得る。逆に、同じ配送拠点で受け取れる複数の利用者が同じDPID空間を共有しても、同一RPIDにはならない。

この分離は、ZK Address Predicates にも重要である。ZK証明が使う commitment や nullifier は、目的別スコープに束縛されるべきであり、住所対象のRPIDと常に一対一にしてはならない。

---

## 8.5 履歴遷移

履歴遷移を次で表す。

\[
\tau:V^H_t\to \mathcal{P}(V^H_{t'})
\]

主な遷移は次である。

### rename

名称だけが変わる。

\[
\tau_{\operatorname{rename}}(v)=v'
\]

通常、RPIDは保存され得る。

\[
\operatorname{RPID}(v)=\operatorname{RPID}(v')
\]

ただし、名前変更が別法人・別施設・別管理主体への移行を伴う場合、社会的連続性を追加評価する。

### relocation

社会的実体は移転するが、配送参照は変わる。

\[
\operatorname{SocialEntity}(v)=\operatorname{SocialEntity}(v')
\]

であっても、

\[
\operatorname{DPID}(v)\neq\operatorname{DPID}(v')
\]

となり得る。

### split

一つの参照対象が複数へ分かれる。

\[
\tau_{\operatorname{split}}(v)=\{v_1,\ldots,v_n\}
\]

\[
n\ge 2
\]

このとき、親PIDを新しい子のどれかへ無条件に引き継いではならない。親は deprecated または split 状態になり、子へ successor edge を張る。

### merge

複数の参照対象が一つへ統合される。

\[
\tau_{\operatorname{merge}}(\{v_1,\ldots,v_n\})=v'
\]

統合前のPIDは廃止または後継化され、新しい統合先へ履歴辺を張る。

### deprecation

PIDまたは参照状態が現役ではなくなる。

\[
\operatorname{status}(v)=\operatorname{deprecated}
\]

deprecation は削除ではない。履歴、監査、後継解決、古い住所の解釈に必要である。

### successor

ある状態が別の状態の後継である。

\[
\operatorname{Successor}(v)=\{v_1,\ldots,v_n\}
\]

successor は同一性を意味しない。後継関係は、履歴上の接続であって、常に完全な同一性ではない。

---

## 8.6 PID保存則

PID保存則は、PIDが絶対に変わらないという法則ではない。正しくは次である。

**PID保存則。**  
あるPIDが変更、分割、統合、廃止される場合、その変更は履歴グラフ上で監査可能に保存されなければならない。

\[
\operatorname{PIDChange}(i,t,t')
\Rightarrow
\exists e\in E^H_{t'}:
\operatorname{Explains}(e,i,t,t')
\]

すなわち、PIDの保存とは「同じIDを使い続ける」ことではなく、「IDの変化を失わない」ことである。

この保存則は、次を禁止する。

- 古いPIDを無関係な新対象へ再利用する。
- 分割後に親PIDを一つの子へ黙って移す。
- 統合前のPIDを削除して履歴を失う。
- アプリ内IDを公共PIDとして扱う。
- 配送DPIDを参照対象RPIDとして扱う。
- 廃止済みPIDを active として返し続ける。

---

## 8.7 履歴ルート

履歴グラフは大きくなり得るため、外部プロトコルやZK証明では全履歴を渡さない。代わりに、履歴ルートを使う。

\[
\operatorname{LineageRoot}(G^H_t)
=
H(\operatorname{canonical}(V^H_t,E^H_t))
\]

履歴ルートは、履歴グラフの完全な代替ではない。履歴ルートは、ある履歴集合が固定されていることを検証するためのアンカーである。

AMT Envelope や ZK Address Predicates では、次のように使う。

```text
lineageRoot
freshnessRoot
revocationRoot
sourceSetVersion
```

これにより、住所全文や完全履歴を公開せずに、あるPIDが正しい履歴版に束縛されていることを確認できる。

---

## 8.8 社会的連続性

社会的連続性とは、名称、利用者、運営主体、地域共同体、配送実績、法的記録、慣習、案内板、オンライン情報などにより、ある対象が「同じものとして扱われ続けている」ことを示す証拠である。

社会的連続性スコアを次で表す。

\[
S_t(v,v')
=
\lambda_1 O_{\operatorname{operator}}
+\lambda_2 U_{\operatorname{usage}}
+\lambda_3 L_{\operatorname{legal}}
+\lambda_4 D_{\operatorname{delivery}}
+\lambda_5 C_{\operatorname{community}}
+\lambda_6 H_{\operatorname{history}}
\]

ここで、

- \(O_{\operatorname{operator}}\): 運営主体の継続性。
- \(U_{\operatorname{usage}}\): 利用実態の継続性。
- \(L_{\operatorname{legal}}\): 法的・行政記録の継続性。
- \(D_{\operatorname{delivery}}\): 配送成功履歴の継続性。
- \(C_{\operatorname{community}}\): 地域・利用者コミュニティの認識。
- \(H_{\operatorname{history}}\): 既存履歴グラフとの接続。

ただし、

\[
S_t(v,v')\ge \theta
\centernot\Rightarrow
v=v'
\]

社会的連続性は証拠であり、同一性そのものではない。

---

## 8.9 社会的連続性の安全な使い方

社会的連続性は、次の用途で有用である。

- 古い表面住所から新しい候補を探す。
- 施設名変更後も履歴をつなぐ。
- 行政区画変更後の住所検索を補助する。
- 災害時の臨時施設を既存施設履歴へ接続する。
- 旧地名・通称・別名を候補生成に使う。
- 配送成功履歴を候補スコアの証拠にする。

しかし、次の用途では危険である。

- 社会的に同じと呼ばれているだけでPIDを統合する。
- SNSや口コミだけで公的住所を上書きする。
- 配送履歴だけで本人住所を確定する。
- 施設のブランド継続だけで物理場所の同一性を主張する。
- コミュニティ投稿だけで係争地域の中立境界を確定する。

したがって、AMTでは社会的連続性を次のように扱う。

\[
\operatorname{SocialContinuity}
\subset
\operatorname{Evidence}
\]

\[
\operatorname{SocialContinuity}
\not\subset
\operatorname{IdentityProof}
\]

---

## 8.10 分割と統合

分割と統合は、履歴グラフでもっとも危険な操作である。

### 分割

分割では、親ノードを active のまま残して子の一つへ暗黙に継承してはならない。

\[
v\to\{v_1,v_2\}
\Rightarrow
\operatorname{status}(v)\in\{\operatorname{deprecated},\operatorname{split}\}
\]

かつ、

\[
\forall i,\ \operatorname{successor}(v,v_i)=1
\]

とする。

### 統合

統合では、子ノードの履歴を失ってはならない。

\[
\{v_1,\ldots,v_n\}\to v'
\Rightarrow
\forall i,\ \operatorname{predecessor}(v',v_i)=1
\]

統合先が新PIDを持つか、既存PIDを継承するかは、目的、法域、出典、社会的連続性、公開投影安全性によって決まる。

---

## 8.11 廃止と後継

廃止は削除ではない。

\[
\operatorname{Deprecated}(i)
\centernot\Rightarrow
\operatorname{Delete}(i)
\]

廃止済みPIDは、次の目的で必要である。

- 古い住所の読解。
- 配送履歴の監査。
- 係争や誤発行の説明。
- 後継PIDへの案内。
- ZK証明での失効確認。
- 引越し、法人移転、建替えの履歴保存。

後継関係は次で表す。

\[
\operatorname{Successor}:I\rightharpoonup \mathcal{P}(I)
\]

後継が複数ある場合、単一IDへ強制的に潰してはならない。

---

## 8.12 公開投影と履歴プライバシー

履歴は便利であるが、危険でもある。履歴グラフには、居住履歴、配送履歴、部屋番号、滞在先、避難所、医療施設、学校、勤務先など、強いプライバシー情報が混ざり得る。

したがって、履歴グラフには公開投影を定義する。

\[
\pi_{\operatorname{public}}:G^H_t\to G^{H,\operatorname{public}}_t
\]

公開投影は、秘密属性を取り除いた履歴グラフである。

\[
\operatorname{PrivateAttribute}(x)=1
\Rightarrow
x\notin G^{H,\operatorname{public}}_t
\]

ただし、完全削除ではなく、必要に応じてハッシュ、commitment、ZK証明、監査限定開示へ変換する。

```text
raw unit number       -> hidden
delivery history      -> aggregate or commitment
hotel stay interval   -> purpose-scoped proof
emergency shelter     -> time-limited disclosure
lineage proof         -> root or membership proof
```

---

## 8.13 応用識別子境界

応用識別子は実務上不可欠である。

- EC注文ID。
- 配送会社伝票番号。
- ホテル予約番号。
- ロッカー受取ID。
- POS取引ID。
- QRセッションID。
- ZK nullifier。
- DID。
- VC credential id。
- スマートコントラクト上のroot anchor。

しかし、これらはAMT PIDではない。

\[
\operatorname{ApplicationID}
\centernot\Rightarrow
\operatorname{AMT\ PID}
\]

応用識別子は、AMT PIDへ写像されることがある。

\[
\chi_a:I_A\rightharpoonup I_R\cup I_D
\]

しかし、\(\chi_a\) は部分写像であり、常に定義されるわけではない。さらに、応用識別子は目的別・事業者別・期限付きであることが多い。

この境界を守ることで、商用アプリ、配送会社、ホテル、EC、ブロックチェーン、ZK proof system がAMTと接続しながらも、AMTの公共識別子空間を汚染しない。

---

## 8.14 反例

### 反例8.1 名前が同じでも同一とは限らない

\[
\operatorname{Name}(v)=\operatorname{Name}(v')
\centernot\Rightarrow
\operatorname{RPID}(v)=\operatorname{RPID}(v')
\]

同名の学校、ホテル、店舗、ビル、港、橋、自然地理は世界中に存在する。

### 反例8.2 座標が同じでも配送IDは同じとは限らない

\[
\operatorname{coord}(v)=\operatorname{coord}(v')
\centernot\Rightarrow
\operatorname{DPID}(v)=\operatorname{DPID}(v')
\]

高層建物、地下街、複合施設、港湾ゲート、ロッカー、駅構内では、同じ座標でも配送参照が異なる。

### 反例8.3 移転した法人は同じ配送先ではない

\[
\operatorname{SocialEntity}(v)=\operatorname{SocialEntity}(v')
\centernot\Rightarrow
\operatorname{DPID}(v)=\operatorname{DPID}(v')
\]

会社や店舗が移転した場合、社会的実体は継続しても配送先は変わる。

### 反例8.4 配送成功履歴は居住証明ではない

\[
\operatorname{DeliverySuccess}(u,a)=1
\centernot\Rightarrow
\operatorname{ResidenceProof}(u,a)=1
\]

ホテル、職場、家族宅、ロッカー、代理受取では配送成功と居住が一致しない。

### 反例8.5 アプリ内IDはPIDではない

\[
\operatorname{AID}_{shop}(x)
\centernot\Rightarrow
\operatorname{PID}(x)
\]

アプリ内IDは、アプリのDB設計、退会、統合、再発行、事業者変更で変わる。

### 反例8.6 後継は同一性を含意しない

\[
\operatorname{Successor}(v,v')=1
\centernot\Rightarrow
v=v'
\]

後継関係は履歴の接続であり、同一性そのものではない。

---

## 8.15 命題と定理

**命題8.1 表面表現変更によるRPID非破壊。**  
名称変更だけでは、RPIDは必ずしも変わらない。

\[
\operatorname{Rename}(v,v')
\centernot\Rightarrow
\operatorname{RPID}(v)\neq\operatorname{RPID}(v')
\]

**命題8.2 DPIDは目的相対的である。**  
配送目的 \(p\) が変われば、同じ参照対象でもDPIDが変わり得る。

\[
p_1\neq p_2
\Rightarrow
\operatorname{DPID}_{p_1}(r)
\neq
\operatorname{DPID}_{p_2}(r)
\ \text{may hold}
\]

**命題8.3 応用識別子はPIDを含意しない。**

\[
\operatorname{AID}_a(x)=i
\centernot\Rightarrow
i\in I_{\operatorname{PID}}
\]

**定理8.1 PID保存則。**  
PIDの変更、分割、統合、廃止、後継化が起きるなら、それを説明する履歴辺が存在しなければならない。

\[
\operatorname{PIDChange}(i,t,t')
\Rightarrow
\exists e\in E^H_{t'}:
\operatorname{Explains}(e,i,t,t')
\]

**定理8.2 分割安全性。**  
分割遷移で親PIDを active のまま一つの子へ黙って継承する実装は、履歴保存則に反する。

\[
\operatorname{Split}(v,\{v_1,\ldots,v_n\})
\land
\operatorname{SilentReuse}(\operatorname{PID}(v),v_1)
\Rightarrow
\operatorname{Unsafe}
\]

**定理8.3 社会的連続性は証拠であり同一性ではない。**

\[
S_t(v,v')\ge\theta
\centernot\Rightarrow
v=v'
\]

**定理8.4 公開履歴非漏えい条件。**  
公開履歴グラフに秘密属性が含まれるなら、公開投影は安全ではない。

\[
\exists x\in G^{H,\operatorname{public}}_t:
\operatorname{PrivateAttribute}(x)=1
\Rightarrow
\operatorname{PublicProjectionSafe}=0
\]

---

## 8.16 実装アルゴリズム

履歴遷移処理の基本手順は次である。

```text
1. 現在ノード v と変更イベント event を受け取る
2. event kind を rename / relocation / split / merge / deprecation / successor に分類する
3. RPID, DPID, AID のどれに影響するかを判定する
4. 必要な successor / predecessor edge を生成する
5. 親PIDや旧PIDを黙って再利用していないか確認する
6. 公開投影に秘密属性が混ざらないか確認する
7. lineageRoot を更新する
8. deprecated / split / merged / active の状態を保存する
9. 応用識別子との対応がある場合は部分写像として保存する
10. 変更理由、出典、時刻、監査情報を記録する
```

擬似コードでは次のようになる。

```text
applyHistoryTransition(graph, event):
  assert event.evidence is admissible
  assert event.effectiveTime is defined

  if event.kind == split:
    mark parent as split or deprecated
    create successor edges to every child
    forbid silent PID reuse

  if event.kind == merge:
    create predecessor edges from every source
    choose new PID or audited successor PID
    deprecate or supersede old PIDs

  if event.kind == rename:
    preserve RPID only if referent evidence remains compatible
    add surface expression version

  if event.kind == relocation:
    preserve social continuity only as evidence
    recompute DPID

  if event.kind == deprecation:
    keep node in graph
    expose successor if safe

  update lineageRoot
  return graph
```

---

## 8.17 実装フック

本章に対応する実装・検証フックは次である。

- history graph schema
- RPID/DPID/application identifier type separation
- transition kind table
- split fixture
- merge fixture
- rename fixture
- relocation fixture
- deprecation fixture
- successor resolution fixture
- lineage root fixture
- public projection safety fixture
- social continuity score fixture
- application identifier non-PID test
- silent PID reuse counterexample
- delivery success is not residence proof counterexample

最低限のfixtureは次である。

| fixture | expected result | purpose |
| --- | --- | --- |
| rename-same-referent | same RPID allowed | 名称変更 |
| relocation-same-social-entity | DPID changes | 移転 |
| split-parent-to-children | parent deprecated/split, successors created | 分割 |
| merge-multiple-to-one | predecessors preserved | 統合 |
| deprecation-with-successor | old ID not deleted | 廃止 |
| application-id-alias | AID is not PID | 応用識別子境界 |
| social-continuity-high | evidence only | 社会的連続性 |
| public-history-private-leak | blocked projection | 履歴プライバシー |

---

## 8.18 後半補強: 履歴変更の衝突と監査不変量

本章の弱点は、履歴グラフを「便利な変更履歴」として読むと、PID保存則が過度に単純化される点である。実際には、名称変更、行政区画変更、建物分割、法人移転、災害移転、配送経路変更は、同じ種類の履歴ではない。したがって、AMTでは履歴イベントを一つの update として扱わず、参照対象、配送対象、社会的対象、公開識別子、応用識別子のどれに影響するかを分離する。

履歴イベントを次で表す。

\[
e=(v_i,v_j,\kappa,t,E_e,\pi_e)
\]

ここで、\(v_i,v_j\) は履歴グラフ上の前後ノード、\(\kappa\) は遷移種別、\(t\) は発効時刻、\(E_e\) は遷移証拠、\(\pi_e\) は公開投影政策である。

遷移は、次の保存ベクトルを持つ。

\[
C(e)=
(
c_R(e),
c_D(e),
c_S(e),
c_P(e),
c_A(e)
)
\]

各成分は次を意味する。

| component | meaning |
| --- | --- |
| \(c_R\) | referent identity が保存されるか |
| \(c_D\) | delivery reachability が保存されるか |
| \(c_S\) | social continuity が保存されるか |
| \(c_P\) | public PID projection が安全か |
| \(c_A\) | application alias とPIDが混同されないか |

重要なのは、すべての成分が同時に保存されるとは限らない点である。

例として、法人が移転した場合、

\[
c_S(e)=1,\quad c_R(e)\ \text{may be }1,\quad c_D(e)=0
\]

となり得る。つまり、社会的な主体は継続していても、配送可能地点は変わる。このときDPIDを保存してはならない。

建物が二つに分割された場合、

\[
\kappa=\mathrm{split}
\Rightarrow
\operatorname{status}(v_i)=\mathrm{split}
\land
\exists v_a,v_b:
\operatorname{succ}(v_i)=\{v_a,v_b\}
\]

でなければならない。親PIDをそのまま一方の子に流用すると、他方の子を消してしまうため、これは履歴保存則違反である。

AMTの履歴監査不変量は次である。

\[
\forall e\in E_H:
\operatorname{validTransition}(e)
\land
\operatorname{lineagePreserved}(e)
\land
\operatorname{publicProjectionSafe}(e)
\]

さらに、公開履歴では次を要求する。

\[
\operatorname{PublicHistory}(H)
=
\operatorname{project}(H,\pi_{\mathrm{public}})
\]

\[
\operatorname{privateUnit}(v)\notin \operatorname{PublicHistory}(H)
\]

これにより、履歴グラフは監査可能性を持つが、部屋番号、内部経路、個人居住情報を公開する装置にはならない。

本章で追加すべき検証fixtureは次である。

| fixture | expected result |
| --- | --- |
| relocation-preserves-social-not-delivery | RPID may continue, DPID must change |
| split-parent-not-reused-as-child | parent deprecated, successors required |
| merge-keeps-predecessor-lineage | merged node stores predecessor set |
| public-history-redacts-private-unit | projection blocks private vertical detail |
| application-alias-cannot-become-pid | alias remains application identifier |

この補強により、第8章は「履歴を保存する」章ではなく、「何を保存し、何を保存してはいけないか」を判定する章になる。

---

## 8.19 非主張

本章は、PIDが永遠に変わらないと主張しない。

\[
\neg(\operatorname{PID}(t)=\operatorname{PID}(t')\ \text{always})
\]

本章は、社会的連続性が同一性を証明すると主張しない。

\[
\neg(S_t(v,v')\ge\theta\Rightarrow v=v')
\]

本章は、配送成功履歴が居住証明であるとは主張しない。

本章は、アプリ内ID、配送伝票番号、QRセッションID、DID、VC credential id、ZK nullifier がAMT PIDであるとは主張しない。

本章は、公開履歴グラフに全履歴を載せるべきだとは主張しない。

本章は、履歴グラフが政治的・法的所有権を決定すると主張しない。履歴グラフは、住所参照と識別子遷移を監査可能にするための技術的構造である。

---

## 8.20 まとめ

本章では、AMTにおける履歴グラフ、PID保存、RPID/DPID/応用識別子の分離、社会的連続性、分割・統合・廃止・後継の扱いを定義した。

第7章が「安全に選ぶ、または選ばない」章であるなら、第8章は「選ばれた参照が時間の中でどう変化するか」を扱う章である。

本章の最重要分離は次である。

```text
surface expression
  != RPID
  != DPID
  != application identifier
  != social continuity evidence
```

そして、本章の保存則は次である。

```text
PID conservation
  != never change PID
  = never lose the audited lineage of PID change
```

住所写像論は、住所を一度だけ解決する理論ではない。住所参照が、社会・空間・配送・制度の変化を受けながらも、どのように監査可能に継続するかを扱う理論である。
