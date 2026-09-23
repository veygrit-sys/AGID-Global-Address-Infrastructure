# 第5章 候補生成と出典政策

## 5.0 互換ノート

本章は、現行29章構成における第7章、第8章、第10章、第21章を保存しつつ、v2構成の第5章として再記述する。

本章で保存する主張は次の通りである。

- AMT写像連鎖は、表面住所表現から直接PIDを作るのではなく、観測、正規化、候補生成、証拠評価、構造比較、安全解決を段階的に通す。
- 候補生成はリコール層であり、同一性証明ではない。
- 多言語展開、旧地名、別名、ローマ字化、非ラテン文字、方言、POI名、自然地名、文化地名は候補集合を広げるための処理であり、それ自体は参照対象の同一性を証明しない。
- 出典政策は、どの証拠を、どの目的で、どの鮮度・ライセンス・地域範囲・地物型のもとで使えるかを制御する。
- 郵便番号が弱い国、公式住所が不足する地域、自然地理、海域、島しょ部、災害時避難所では、出典不足や候補不足を形式的な状態として返す。
- 検証済みでない地域や地物型について、全世界完全候補生成を主張してはならない。

本章で導入する数理対象は、AMT写像連鎖、正規化写像、候補生成写像 \(\Gamma_t\)、候補集合 \(C_t(s,p)\)、出典集合、証拠許容述語、鮮度関数、ライセンス許容述語、多言語展開、地域出典充足度、候補十分性仮定である。

構造距離と同値類は第6章、有限推定とPID発行は第7章、品質・確率・評判は第9章、検証とベンチマークは第12章で扱う。

---

## 5.1 候補生成の役割

住所解決において、候補生成は最初の危険な段階である。

候補生成に失敗すると、後段がどれほどよくできていても正しい参照対象には到達できない。真の参照対象が候補集合に入っていなければ、構造距離、品質評価、確率推定、PID発行、ZK証明はすべて間違った対象の上で動いてしまう。

しかし、候補生成は答えを決める処理ではない。

AMTでは、候補生成を次のように定義する。

```text
候補生成 = 表面住所表現が指し得る参照対象を、有限集合として広めに集める処理
```

したがって、候補生成の目的は精密性ではなく、リコールである。

\[
\text{candidate generation is recall, not identity}
\]

候補集合に入ったことは、「その候補が正しい」ことを意味しない。候補集合に入ったことは、「後段で比較すべき対象である」ことを意味する。

### 5.1.1 候補生成が安全性を左右する理由

住所解決の失敗は、多くの場合、最後のスコアリング段階ではなく、候補生成段階ですでに発生している。後段のモデルは、与えられた候補集合の内部でしか比較できない。したがって、候補集合が不完全であれば、どれほど精密な距離関数や機械学習モデルを置いても、真の対象には到達しない。

この性質を候補閉包問題と呼ぶ。

\[
\operatorname{ClosureProblem}_t(s,p)
\equiv
r^\star_{t,p}(s)\notin C_t(s,p)
\]

候補閉包問題が発生しているとき、解決器が返す最良の候補は、候補集合内の最良候補にすぎない。

\[
\arg\min_{r\in C_t(s,p)} d_{t,p}(s,r)
\neq
r^\star_{t,p}(s)
\]

この不一致は、後段の計算では修復できない。したがって、AMTでは候補生成を単なる検索前処理ではなく、安全性に関わる独立した理論対象として扱う。

### 5.1.2 目的相対性

同じ表面住所でも、目的 \(p\) が変わると候補集合は変わる。

\[
C_t(s,p_1)\neq C_t(s,p_2)
\]

例えば、本人確認目的では行政住所や公的証拠が重要である。一方、配送目的では入口、搬入口、道路接続、配送会社のサービス区域が重要になる。自然地理目的では境界、代表点、隣接地物が重要になり、ZK証明目的では公開してよい属性と証明可能な述語が重要になる。

したがって、候補生成は目的非依存の検索ではない。

\[
\Gamma_t(x,p)
\]

は、常に目的 \(p\) を引数に持つ。

---

## 5.2 AMT写像連鎖

AMTの基本写像連鎖を次で表す。

\[
S_t
\xrightarrow{O_t}
\Omega_t
\xrightarrow{\nu_t}
N_t
\xrightarrow{\Lambda_t}
X_t
\xrightarrow{\Gamma_t}
2^{R_t}
\xrightarrow{\operatorname{Eval}_{t,p}}
2^{R_t}
\xrightarrow{\rho_{t,p}}
R_t\cup\{\bot\}
\]

それぞれの意味は次である。

- \(S_t\): 表面住所表現集合。
- \(O_t\): 観測写像。
- \(\Omega_t\): 観測空間。
- \(\nu_t\): 正規化写像。
- \(N_t\): 正規化表現空間。
- \(\Lambda_t\): 多言語・別名・旧地名・空間手がかり展開。
- \(X_t\): 展開済み検索手がかり空間。
- \(\Gamma_t\): 候補生成写像。
- \(2^{R_t}\): 参照対象候補集合。
- \(\operatorname{Eval}_{t,p}\): 目的別の証拠・出典・鮮度・ライセンス評価。
- \(\rho_{t,p}\): 安全解決写像。

この連鎖の重要点は、表面表現から直接解決対象へ飛ばないことである。

```text
surface address
  -> observation
  -> normalization
  -> recall expansion
  -> candidate set
  -> evidence policy
  -> structural decision
  -> safe resolution or abstention
```

AMTは、この各段階を分離することで、どこでリコール不足、出典不足、曖昧性、プライバシー制約が生じたかを説明できる。

### 5.2.1 連鎖不変条件

AMT写像連鎖には、次の不変条件を置く。

**不変条件5.A 段階分離。**

\[
\Gamma_t\circ\Lambda_t\circ\nu_t
\]

は候補集合を返すだけであり、\(\rho_{t,p}\) の役割を代替しない。

**不変条件5.B 有限性。**

\[
|C_t(s,p)|<\infty
\]

でなければ、後段の評価、監査、再現性、手動レビューが成立しない。

**不変条件5.C 出典追跡可能性。**

候補 \(r\in C_t(s,p)\) には、少なくとも一つの証拠集合または出典不足状態が対応しなければならない。

\[
r\in C_t(s,p)
\Rightarrow
\left(
\exists E_r\subseteq E_t
\right)
\lor
\operatorname{State}(r)=\operatorname{source\_insufficient}
\]

**不変条件5.D 非公開属性分離。**

候補生成ログは、raw住所、受取人、部屋番号、秘密配送指示、証明 witness を保存してはならない。

**不変条件5.E 棄却可能性。**

候補生成段階は、候補不足、出典不足、ライセンス不明、鮮度不足、プライバシー不適合を状態として返せなければならない。

---

## 5.3 正規化は候補生成の入口である

正規化写像を次で表す。

\[
\nu_t:S_t\rightharpoonup N_t
\]

正規化は、表記ゆれ、文字種、順序、国名、行政区画名、旧地名、翻字、略称などを扱いやすい形にする。

しかし、第2章で述べた通り、正規化は同一性を決めない。

\[
\nu_t(s_1)=\nu_t(s_2)
\centernot\Rightarrow
\rho_{t,p}(s_1)=\rho_{t,p}(s_2)
\]

第5章における正規化の役割は、候補生成の入力を安定させることである。

正規化に失敗した場合、候補生成は次の状態を返し得る。

\[
\operatorname{CandidateState}_t(s,p)
=
\operatorname{normalization\_insufficient}
\]

この状態は、入力文字列が悪いという意味ではない。正規化規則、言語判定、スクリプト判定、国別テンプレート、または出典が不足しているという意味である。

---

## 5.4 多言語・別名展開

多言語展開写像を次で表す。

\[
\Lambda_t:N_t\to 2^{X_t}
\]

\(\Lambda_t(n)\) は、正規化表現 \(n\) から得られる検索手がかり集合である。

この集合には、次が含まれ得る。

- 現地語表記
- 英語表記
- ローマ字表記
- 非ラテン文字表記
- 旧地名
- 別名
- 通称
- 方言名
- 略称
- POI名
- 建物名
- 施設名
- 行政区画コード
- 郵便番号
- 地理セル
- 近傍ランドマーク
- 自然地名
- 文化地名

多言語展開の目的は、候補集合から真の対象を落としにくくすることである。

しかし、多言語展開は同一性証明ではない。

\[
x_i,x_j\in\Lambda_t(n)
\centernot\Rightarrow
\operatorname{referent}(x_i)=\operatorname{referent}(x_j)
\]

同じ地名の翻訳に見えても、実際には別の対象を指すことがある。旧地名が現在の行政区画と完全に一致しないこともある。ローマ字表記は複数の現地語表記へ戻り得る。

したがって、\(\Lambda_t\) はリコール層であり、証明層ではない。

---

## 5.5 候補生成写像

候補生成写像を次で表す。

\[
\Gamma_t:X_t\times P\to 2^{R_t}
\]

表面表現 \(s\)、目的 \(p\) に対する候補集合は次である。

\[
C_t(s,p)
=
\bigcup_{x\in \Lambda_t(\nu_t(s))}
\Gamma_t(x,p)
\]

候補集合は有限でなければならない。

\[
|C_t(s,p)|<\infty
\]

この有限性は、探索範囲、出典集合、地理範囲、言語展開数、時間範囲、候補上限によって確保する。

候補生成写像は、国や地域、地物型、目的によって構成が変わる。

例えば、都市部の住所では行政階層と道路名が強く働く。島しょ部では港、桟橋、学校、病院、地名、AGIDセルが重要になる。海域では海域名、境界、隣接海域、港、EEZ関係が手がかりになる。高層建築では建物、入口、階、部屋、受付、搬入口が候補になる。

---

## 5.6 候補型

候補集合 \(C_t(s,p)\) は、参照対象の集合である。

候補には型がある。

\[
\tau_t:C_t(s,p)\to 2^{T_E}
\]

候補型には、少なくとも次を含む。

- administrative
- postal
- physical
- entrance
- unit
- road
- poi
- logistic
- natural
- cultural
- temporary
- vertical
- digital_twin

候補型は、目的別に重要度が変わる。

配送目的では、道路、入口、建物、ロッカー、配送拠点が重要になる。本人確認では行政住所、公的証拠、居住性が重要になる。観光や自然地理ではPOI、地名、境界、代表点が重要になる。ZK住所証明では、公開してよい属性と証明対象の条件が重要になる。

したがって、候補生成は単なる検索結果リストではない。

候補生成は、目的別に型付けされた参照対象集合を作る処理である。

### 5.6.1 候補型と目的の対応

候補型は、目的ごとの証拠重みを決める。代表的な対応は次である。

| 目的 | 主要候補型 | 補助候補型 | 注意点 |
| --- | --- | --- | --- |
| 本人確認 | administrative, physical | postal, road | 公的証拠と居住実体を混同しない |
| 通常配送 | physical, entrance, road, logistic | postal, poi | 郵便番号だけで配送可能性を決めない |
| 匿名配送 | logistic, entrance, public projection | physical | ECへ住所全文を渡さない |
| ホテル配送 | temporary, poi, physical | entrance | 滞在期間と受取権限が必要 |
| ロッカー/PUDO | logistic, poi, entrance | road | ロッカー権限と住所参照を分ける |
| 自然地理 | natural, cultural | administrative | 境界と代表点を分ける |
| 災害時 | temporary, logistic, road | administrative | 時間付き状態を必須にする |
| ZK述語 | public projection, administrative, postal | physical | 証明可能属性と秘密属性を分離する |

この表は固定規格ではなく、候補政策の初期値である。国、地域、配送会社、災害状態、法域、利用目的によって重みは変化する。

---

## 5.7 出典集合

出典集合を次で表す。

\[
\Sigma_t
\]

各出典 \(\sigma\in\Sigma_t\) は、次の属性を持つ。

\[
\sigma =
(
\operatorname{id},
\operatorname{kind},
\operatorname{jurisdiction},
\operatorname{coverage},
\operatorname{license},
\operatorname{version},
\operatorname{updatedAt},
\operatorname{freshnessTTL},
\operatorname{trustClass}
)
\]

出典種別には、次がある。

- official
- postal
- municipal
- cadastral
- open_geo
- poi
- carrier
- community
- field_observation
- satellite_or_imagery
- emergency
- historical
- commercial_restricted

AMTでは、出典を単なるURLとして扱わない。出典は、目的、地域、地物型、鮮度、ライセンス、公開可能性によって使えるかどうかが変わる。

### 5.7.1 出典政策マトリクス

出典は、目的に応じて利用できる強さが異なる。たとえば、歴史地名には historical source が有用だが、現在配送可能性の証拠としては弱い。コミュニティ投稿は、候補生成のリコールには役立つが、単独で本人確認に使うべきではない。

| 出典種別 | 候補生成 | 本人確認 | 配送可能性 | 歴史参照 | 災害時 | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| official | 強 | 強 | 中 | 中 | 中 | 更新遅延に注意 |
| postal | 強 | 中 | 強 | 低 | 中 | 郵便番号なし地域では弱い |
| municipal | 強 | 強 | 中 | 中 | 中 | 行政変更の履歴が重要 |
| cadastral | 中 | 強 | 低 | 中 | 低 | 公開制限が強い場合がある |
| open_geo | 強 | 低 | 中 | 中 | 中 | ライセンスと品質差に注意 |
| poi | 強 | 低 | 中 | 中 | 強 | 地域補助候補として有効 |
| carrier | 中 | 低 | 強 | 低 | 強 | 商用・非公開境界に注意 |
| community | 中 | 低 | 低 | 中 | 中 | reputation と review が必要 |
| field_observation | 中 | 低 | 中 | 低 | 強 | 監査ログと時刻が必要 |
| emergency | 中 | 低 | 強 | 低 | 強 | 短期・時間付き状態 |
| historical | 中 | 低 | 低 | 強 | 低 | 現在性を主張しない |

このマトリクスの目的は、出典を序列化することではない。出典を目的相対的に扱い、過剰主張を防ぐことである。

### 5.7.2 出典負債

候補生成が失敗したとき、単に failed を返すだけでは研究・運用上不十分である。どの出典政策が不足しているかを記録する必要がある。これを出典負債と呼ぶ。

\[
\operatorname{SourceDebt}_t(s,p)
=
\{
q\mid q\in Q_{\Sigma},\ q(s,p)\neq 1
\}
\]

ここで \(Q_{\Sigma}\) は、ライセンス、鮮度、カバレッジ、プライバシー、追跡可能性、有限候補予算などの出典政策ゲート集合である。

出典負債は、次の用途を持つ。

- どの国・地域のデータ整備を優先すべきかを決める。
- どの目的では利用でき、どの目的では利用できないかを説明する。
- OSS公開時に、未検証項目と非主張を機械的に示す。
- 手動レビューが必要な理由を監査可能にする。

---

## 5.8 証拠と出典の関係

証拠集合を \(E_t\) とする。

証拠 \(e\in E_t\) は、ある出典から得られる。

\[
\operatorname{src}(e)\in\Sigma_t
\]

証拠が候補 \(r\) を支持する関係を次で表す。

\[
\operatorname{Supports}_t(e,r,p)\in\{0,1,\bot\}
\]

ただし、証拠が候補を支持するためには、その証拠の出典が目的 \(p\) に対して許容されている必要がある。

\[
\operatorname{Supports}_t(e,r,p)=1
\Rightarrow
\operatorname{Admissible}_t(e,p)=1
\]

証拠許容性は、第4章の公理であり、本章ではその構成要素を定義する。

---

## 5.9 ライセンス許容性

ライセンス許容述語を次で表す。

\[
\operatorname{LicenseOK}_t(\sigma,p)\in\{0,1,\bot\}
\]

出典 \(\sigma\) のライセンスが目的 \(p\) に対して利用可能なら \(1\)、利用不可なら \(0\)、不明なら \(\bot\) である。

AMTでは、ライセンスが不明な出典を、検証済みの根拠として使ってはならない。

\[
\operatorname{LicenseOK}_t(\sigma,p)\neq 1
\Rightarrow
\operatorname{Admissible}_t(e,p)\neq 1
\]

これは、法務的な慎重さだけではない。OSSとして研究・実装を公開する場合、出典ライセンスが曖昧なデータは再利用不能になり、検証再現性を壊す。

したがって、出典政策には必ずライセンス状態を含める。

---

## 5.10 鮮度

住所データは時間で変わる。

出典の鮮度関数を次で表す。

\[
\operatorname{Fresh}_t(\sigma,p)=
\begin{cases}
1 & \text{if } t-\operatorname{updatedAt}(\sigma)\le \operatorname{TTL}_p(\sigma) \\
0 & \text{if } t-\operatorname{updatedAt}(\sigma)> \operatorname{TTL}_p(\sigma) \\
\bot & \text{if updatedAt or TTL is unknown}
\end{cases}
\]

鮮度が不足している出典は、目的によっては候補生成に使えても、解決証拠としては使えない。

例えば、歴史的地名を探すためには古い出典が有用である。しかし、現在配送可能かどうかを判断するには、古い出典だけでは不十分である。

したがって、

\[
\operatorname{Fresh}_t(\sigma,p)\neq 1
\Rightarrow
\operatorname{Admissible}_t(e,p)\neq 1
\]

ただし、歴史参照目的では、古い出典がむしろ必要になることがある。この場合、目的 \(p\) の定義が異なる。

---

## 5.11 地域・地物型カバレッジ

出典 \(\sigma\) が対象地域 \(a\)、地物型 \(k\) を覆うかを次で表す。

\[
\operatorname{Covers}_t(\sigma,a,k)\in\{0,1,\bot\}
\]

地域・地物型カバレッジが不足している場合、その出典だけで候補十分性を主張してはならない。

\[
\operatorname{Covers}_t(\sigma,a,k)\neq 1
\Rightarrow
\operatorname{CoverageOK}_t(a,k,p)\neq 1
\]

このモデルは、未解決国理論と接続する。

郵便番号が弱い国、公式住所がない地域、自然地理、文化地理、海域、島しょ部、山岳地帯、災害時避難所では、出典カバレッジは目的別に評価しなければならない。

---

## 5.12 出典許容述語

証拠 \(e\)、出典 \(\sigma=\operatorname{src}(e)\)、目的 \(p\) に対して、出典許容述語を次で定義する。

\[
\operatorname{Admissible}_t(e,p)=1
\]

であるための十分条件は次である。

\[
\operatorname{LicenseOK}_t(\sigma,p)=1
\land
\operatorname{Fresh}_t(\sigma,p)=1
\land
\operatorname{Covers}_t(\sigma,a,k)=1
\land
\operatorname{PrivacyOK}_t(e,p)=1
\land
\operatorname{SourceTraceable}_t(\sigma)=1
\]

いずれかが \(0\) または \(\bot\) の場合、その証拠は目的 \(p\) の解決証拠として使えない。

\[
\exists q\in
\{\operatorname{LicenseOK},\operatorname{Fresh},\operatorname{Covers},
\operatorname{PrivacyOK},\operatorname{SourceTraceable}\} :
q\neq 1
\Rightarrow
\operatorname{Admissible}_t(e,p)\neq 1
\]

### 5.12.1 証拠オブジェクト

実装上、証拠 \(e\) は次の属性を持つべきである。

```text
evidence_id
source_id
source_version
observed_at
feature_type
region_scope
purpose_scope
license_state
freshness_state
privacy_state
claim
public_projection
content_hash
```

ここで `content_hash` は証拠本文の完全性確認に使う。ただし、raw住所や個人情報をハッシュ化すれば安全になるわけではない。低エントロピー住所、部屋番号、病室、ホテル客室、配送指示は辞書攻撃で復元され得る。したがって、content-addressed evidence は完全性確認の仕組みであり、プライバシー保護そのものではない。

### 5.12.2 候補カバレッジ証明書

AMTでは、候補生成段階の中間成果物として Candidate Coverage Certificate を導入する。

\[
\operatorname{CCC}_t(s,p)
=
(
\operatorname{scope},
\operatorname{state},
\operatorname{gates},
\operatorname{sourceDebt},
\operatorname{nonClaims}
)
\]

この証明書は、候補集合が後段の解決処理へ進めるかどうかを記録する。重要なのは、CCCはPIDではないという点である。

\[
\operatorname{CCC}_t(s,p)\neq \operatorname{PID}(s,p)
\]

CCCが主張できるのは、次の限定された内容だけである。

- 正規化が候補生成に十分である。
- 出典カバレッジが目的に対して十分である。
- ライセンス、鮮度、プライバシー、追跡可能性ゲートが通っている。
- 候補集合が有限である。
- 後段の解決処理に進める。

CCCが主張してはならない内容は次である。

- どの候補が真の対象か。
- 配送が必ず成功するか。
- PIDを発行してよいか。
- ZK証明が成立するか。
- 全世界で候補生成が完全か。

---

## 5.13 候補十分性仮定

候補生成に関する最重要の安全条件は、候補十分性である。

真の参照対象を \(r^\star_{t,p}(s)\) とする。

候補十分性仮定は次である。

\[
\operatorname{CoverageOK}_t(s,p)=1
\land
r^\star_{t,p}(s)\ \text{exists}
\Rightarrow
r^\star_{t,p}(s)\in C_t(s,p)
\]

これは仮定であって、全世界の定理ではない。

もし、

\[
\operatorname{CoverageOK}_t(s,p)\neq 1
\]

なら、AMTは候補生成が十分であるとは言わない。

このとき、解決器は次の状態を返すべきである。

\[
\rho_{t,p}(s)=(\bot,\operatorname{candidate\_insufficient})
\]

または

\[
\rho_{t,p}(s)=(\bot,\operatorname{source\_insufficient})
\]

---

## 5.14 未解決国・弱出典地域

地域 \(a\) における出典充足度を次で表す。

\[
\operatorname{SourceCoverage}_t(a,p)\in[0,1]
\]

目的 \(p\) に必要な最小出典充足度を \(\theta_p\) とする。

\[
\operatorname{SourceCoverage}_t(a,p)<\theta_p
\Rightarrow
\operatorname{RegionState}_t(a,p)=\operatorname{source\_insufficient}
\]

この状態は、地域を排除するためのものではない。

むしろ、次の設計を可能にする。

- 公式住所がない地域では、POI、道路、港、学校、病院、ランドマーク、AGIDセルを補助候補にする。
- 郵便番号がない国では、postal-equivalent区域や配送可能区域を候補生成に使う。
- 自然地理や海域では、境界、代表点、隣接地物、港、航路を候補生成に使う。
- 災害時には、避難所、臨時集積所、閉鎖区域、危険区域を時間付き候補として扱う。
- 出典不足は、resolvedではなく、source_insufficientまたはmanual_reviewへ送る。

AMTは、弱出典地域を「住所がない場所」として扱わない。

AMTは、弱出典地域を「追加の証拠政策が必要な場所」として扱う。

### 5.14.1 郵便番号なし地域の候補生成

郵便番号が存在しない地域では、郵便番号を前提にした候補生成は成立しない。この場合、AMTは postal-equivalent を導入する。

\[
\operatorname{PostalEquivalent}_t(a,p)
\]

これは郵便番号そのものではなく、配送、行政、検索、検証の目的で郵便番号の代替として使える区域または参照単位である。

郵便番号なし地域の候補生成では、次の手がかりを組み合わせる。

```text
country / region
+ locality
+ road or path
+ POI
+ carrier service zone
+ AGID cell
+ landmark
+ delivery hub
+ optional coordinate envelope
```

このとき、AMTは「郵便番号を生成した」とは主張しない。主張できるのは、目的 \(p\) に対して候補生成に使える postal-equivalent 参照を構成した、という点である。

### 5.14.2 自然地理・文化地理の候補生成

自然地理や文化地理では、住所のような階層が存在しないことが多い。川、湖、滝、島、砂漠、山、谷、洞窟、遺跡、世界遺産、海域などは、行政住所とは異なる参照規則を持つ。

この場合、候補生成は次の対象を使う。

- 地物名
- 別名
- 現地語名
- 境界
- 代表点
- 隣接地物
- 所属行政区域
- 到達拠点
- 保護区域
- 時間付き状態

自然地理の候補生成では、点と領域を混同してはならない。

\[
\operatorname{point}(r)\neq \operatorname{extent}(r)
\]

代表点が一致しても、地物の範囲が一致するとは限らない。したがって、候補生成では `representative_point_candidate` と `area_candidate` を区別する。

---

## 5.15 候補生成とプライバシー

候補生成は、利用者の入力や住所らしい表現を扱うため、プライバシー境界が必要である。

候補生成段階で保存してよいものと、保存してはいけないものを分ける。

公開または共有可能なもの:

- 候補型
- 出典ID
- 出典版
- 信頼度
- coarse region
- AGIDセル
- public projection
- 非個人の地物ID

原則として保存・公開してはいけないもの:

- raw住所
- 受取人名
- 部屋番号
- 病室
- ホテル客室
- 秘密の配送指示
- private witness
- proof secret

候補生成の公開投影を次で表す。

\[
\operatorname{CandPub}_t(C_t(s,p))
\]

これは、候補集合から公開可能な属性だけを取り出したものである。

\[
\operatorname{PrivateAttr}(C_t(s,p))
\not\subseteq
\operatorname{Attr}(\operatorname{CandPub}_t(C_t(s,p)))
\]

候補生成は、リコールを上げるほどプライバシー漏えいリスクも増える。したがって、候補生成は第11章のAMT EnvelopeとZK境界に接続される。

---

## 5.16 候補生成の反例

### 反例5.1 候補集合に真の対象がない

\[
r^\star_{t,p}(s)\notin C_t(s,p)
\]

この場合、どの候補を選んでも正しくない。

\[
\forall r\in C_t(s,p):
r\neq r^\star_{t,p}(s)
\]

したがって、

\[
\rho_{t,p}(s)\neq(r,\operatorname{resolved})
\]

### 反例5.2 多言語展開は同一性を証明しない

\[
x_i,x_j\in\Lambda_t(\nu_t(s))
\]

であっても、

\[
\operatorname{referent}(x_i)\neq \operatorname{referent}(x_j)
\]

となることがある。

したがって、

\[
x_i,x_j\in\Lambda_t(\nu_t(s))
\centernot\Rightarrow
\operatorname{referent}(x_i)=\operatorname{referent}(x_j)
\]

### 反例5.3 ライセンス不明出典

\[
\operatorname{LicenseOK}_t(\sigma,p)=\bot
\]

なら、その出典に由来する証拠 \(e\) は、目的 \(p\) の解決証拠として使えない。

\[
\operatorname{Admissible}_t(e,p)\neq 1
\]

### 反例5.4 古い出典

\[
\operatorname{Fresh}_t(\sigma,p)=0
\]

なら、現在配送可能性の証拠としては不十分である。

ただし、歴史参照目的では別の目的 \(p_{\mathrm{history}}\) のもとで許容され得る。

### 反例5.5 弱出典地域での過剰解決

\[
\operatorname{SourceCoverage}_t(a,p)<\theta_p
\]

にもかかわらず、

\[
\rho_{t,p}(s)=(r,\operatorname{resolved})
\]

を返すなら、AMTの棄却安全性に反する。

### 反例5.6 郵便番号一致は配送点一致ではない

\[
\operatorname{postal}(r_1)=\operatorname{postal}(r_2)
\]

であっても、

\[
r_1\neq r_2
\]

であり得る。同じ郵便番号は広い区域、複数建物、複数道路、私書箱、事業所、配送センターを含み得る。したがって、

\[
\operatorname{postal}(r_1)=\operatorname{postal}(r_2)
\centernot\Rightarrow
\operatorname{referent}(r_1)=\operatorname{referent}(r_2)
\]

である。

### 反例5.7 POI名一致は入口一致ではない

同じ施設名が複数の入口、搬入口、棟、受付、ロッカー、駐車場を持つことがある。

\[
\operatorname{name}(r_1)=\operatorname{name}(r_2)
\land
\operatorname{poi}(r_1)=\operatorname{poi}(r_2)
\centernot\Rightarrow
\operatorname{entrance}(r_1)=\operatorname{entrance}(r_2)
\]

これは配送目的で特に重要である。POI候補は有用だが、配送可能候補としては入口、道路接続、受取権限の確認が必要である。

### 反例5.8 代表点一致は領域一致ではない

自然地理では、地物の代表点が同じでも、境界や対象範囲が異なる場合がある。

\[
\operatorname{repPoint}(r_1)=\operatorname{repPoint}(r_2)
\centernot\Rightarrow
\operatorname{extent}(r_1)=\operatorname{extent}(r_2)
\]

したがって、自然地理候補では、点候補、線候補、面候補、境界候補を区別しなければならない。

---

## 5.17 命題

**命題5.1 候補生成非同一性。**  
候補集合に含まれることは、参照対象の同一性を含意しない。

\[
r\in C_t(s,p)
\centernot\Rightarrow
\rho_{t,p}(s)=(r,\operatorname{resolved})
\]

**証明スケッチ。**  
候補生成はリコール層であり、複数の候補を広く含める。候補集合には誤候補、別名候補、近傍候補、旧地名候補、同名候補が含まれ得る。したがって、候補集合への所属は同一性証明ではない。

**命題5.2 出典許容性の必要性。**  
証拠 \(e\) を目的 \(p\) の解決に使うなら、出典許容性が必要である。

\[
\operatorname{Use}_t(e,r,p)=1
\Rightarrow
\operatorname{Admissible}_t(e,p)=1
\]

**証明スケッチ。**  
ライセンス、鮮度、地域カバレッジ、地物型カバレッジ、プライバシー制約が不足する証拠は、再現可能で安全な解決証拠にならない。したがって、解決に使う証拠は許容されていなければならない。

**命題5.3 カバレッジ不足時の非解決。**  
候補生成のカバレッジが不足している場合、AMTはresolvedを返してはならない。

\[
\operatorname{CoverageOK}_t(s,p)\neq 1
\Rightarrow
\rho_{t,p}(s)\neq(r,\operatorname{resolved})
\]

**証明スケッチ。**  
候補集合に真の参照対象が含まれている保証がない場合、後段の選択は安全ではない。したがって、candidate_insufficient、source_insufficient、manual_review等を返す。

**命題5.4 多言語展開はリコール改善である。**  
多言語展開は候補集合を拡張するが、同一性判定ではない。

\[
|\Gamma_t(\Lambda_t(n),p)|\ge |\Gamma_t(\{n\},p)|
\]

となり得るが、

\[
x_i,x_j\in\Lambda_t(n)
\centernot\Rightarrow
\operatorname{referent}(x_i)=\operatorname{referent}(x_j)
\]

である。

**命題5.5 候補十分性証明書の非PID性。**  
Candidate Coverage Certificate が発行されても、PID発行は含意されない。

\[
\operatorname{CCC}_t(s,p)=\operatorname{ready}
\centernot\Rightarrow
\exists pid:\operatorname{PIDIssue}_t(s,p,pid)=1
\]

**証明スケッチ。**  
CCCは、候補生成段階のゲートが通ったことだけを示す。PID発行には、後段の構造比較、同値類判定、品質閾値、履歴整合性、非公開境界、目的別ポリシーが必要である。したがって、CCCはPID発行の前提条件の一部であって、PID発行そのものではない。

**命題5.6 カバレッジ証明なし完全性不可。**  
出典カバレッジ証明がない場合、候補生成の完全性を主張できない。

\[
\operatorname{CoverageOK}_t(s,p)\neq1
\Rightarrow
\neg\operatorname{CompleteCandidateGeneration}_t(s,p)
\]

**証明スケッチ。**  
候補完全性は、真の参照対象が候補集合に含まれることを必要とする。しかし、対象地域、地物型、目的に対する出典カバレッジが不足しているなら、真の参照対象を列挙できた保証がない。したがって完全性主張はできない。

**命題5.7 単調リコールは安全な出典集合の包含に依存する。**  
展開集合 \(X_1\subseteq X_2\) かつ利用する出典集合が同じ政策で許容されている場合、候補数は減少しない。

\[
X_1\subseteq X_2
\land
\Sigma_1\subseteq \Sigma_2
\Rightarrow
|\Gamma_t(X_1,p)|\le |\Gamma_t(X_2,p)|
\]

ただし、この命題は同一性精度の向上を意味しない。候補数が増えることは、誤候補も増えることを意味し得る。

**命題5.8 出典負債の局所性。**  
出典負債は、地域、目的、地物型に依存する。

\[
\operatorname{SourceDebt}_t(a,p,k)
\neq
\operatorname{SourceDebt}_t(a,p',k')
\]

したがって、ある地域で配送目的の候補生成が不十分であっても、歴史参照や自然地理参照では十分である可能性がある。

---

## 5.18 候補生成の実装モデル

実装上、候補生成は次の段階で構成できる。

```text
1. observe input
2. normalize
3. detect country / script / language
4. expand multilingual aliases
5. query official sources
6. query open geo sources
7. query postal sources
8. query POI / road / logistics / natural-cultural sources
9. apply source policy
10. deduplicate by weak keys
11. attach evidence and source versions
12. return finite candidate set or abstention state
```

疑似コードで書くと次である。

```ts
function generateCandidates(input, purpose, policy) {
  const observation = observe(input);
  const normalized = normalize(observation);
  const expanded = expandRecallKeys(normalized, policy.languages);
  const rawCandidates = querySources(expanded, policy.allowedSources);
  const admissible = rawCandidates.filter(candidate =>
    candidate.evidence.every(evidence =>
      licenseOk(evidence.source, purpose) &&
      fresh(evidence.source, purpose) &&
      covers(evidence.source, candidate.region, candidate.type) &&
      privacyOk(evidence, purpose)
    )
  );

  if (!policy.coverageOk) return { state: "source_insufficient" };
  if (admissible.length === 0) return { state: "candidate_insufficient" };
  if (admissible.length > policy.maxCandidates) return { state: "manual_review" };

  return { state: "candidate_ready", candidates: admissible };
}
```

この関数はPIDを発行しない。これは、第7章の安全解決へ渡す候補集合を作るだけである。

### 5.18.1 実装上の状態遷移

候補生成器は、少なくとも次の状態を返す。

```text
candidate_ready
normalization_insufficient
source_insufficient
candidate_insufficient
license_blocked
stale_source
privacy_blocked
manual_review
```

これらの状態は、失敗を隠すためではなく、失敗理由を次の改善サイクルへ渡すためにある。

```text
normalization_insufficient -> 国別テンプレート、文字種、言語判定を改善する
source_insufficient        -> 出典カバレッジを増やす
candidate_insufficient     -> 展開語彙、POI、道路、AGIDセルを増やす
license_blocked            -> 出典を差し替える、または利用目的を制限する
stale_source               -> 更新頻度、TTL、履歴参照目的を見直す
privacy_blocked            -> 公開投影または秘匿証明へ切り替える
manual_review              -> 候補数を絞る、または人間の判断へ送る
```

### 5.18.2 Candidate Coverage Certificateの型

実装上の型は次のように置ける。

```ts
type CandidateCoverageCertificate = {
  scope: {
    purpose: string;
    region: string;
    featureType: string;
  };
  state:
    | "candidate_ready"
    | "normalization_insufficient"
    | "source_insufficient"
    | "candidate_insufficient"
    | "license_blocked"
    | "stale_source"
    | "privacy_blocked"
    | "manual_review";
  canClaimCandidateSufficiency: boolean;
  canIssuePid: false;
  minimumRequiredGates: string[];
  sourceDebt: string[];
  nonClaims: string[];
};
```

この型で重要なのは `canIssuePid: false` である。候補生成器がPID発行を直接許可しないことを型で固定する。

---

## 5.19 実装フック

本章に対応する実装・検証フックは次の通りである。

- 候補生成fixture
- 出典政策matrix
- 多言語リコールtest vector
- ライセンス許容test vector
- 鮮度test vector
- 地域・地物型カバレッジtest vector
- 弱出典地域fixture
- no-postcode地域fixture
- POI/港/学校/病院/ロッカー補助候補fixture
- 候補集合の有限性チェック
- raw住所を公開候補ログへ出さない検査

### 5.19.1 ベンチマーク指標

候補生成は、次の指標で評価できる。

\[
\operatorname{RecallAtK}_t(p,a,k)
\]

目的 \(p\)、地域 \(a\)、地物型 \(k\) において、真の対象が上位 \(K\) 候補に含まれる割合である。

\[
\operatorname{CandidateBudget}_t(s,p)=|C_t(s,p)|
\]

候補集合の大きさである。大きすぎる候補集合は、後段の計算量と手動レビュー負荷を増やす。

\[
\operatorname{EvidenceAdmissibilityRate}_t
=
\frac{|\{e\in E_t:\operatorname{Admissible}_t(e,p)=1\}|}{|E_t|}
\]

候補を支える証拠のうち、実際に解決証拠として使える割合である。

\[
\operatorname{SourceDebtRate}_t
=
\frac{|\{(a,p,k):\operatorname{SourceDebt}_t(a,p,k)\neq\emptyset\}|}
{|\{(a,p,k)\}|}
\]

地域、目的、地物型ごとの出典負債率である。

### 5.19.2 合成fixture

第5章の検証には、実住所を含まない合成fixtureを使うべきである。

代表fixtureは次である。

- `postal_strong_city_fixture`
- `postal_weak_region_fixture`
- `no_postcode_island_fixture`
- `multilingual_alias_collision_fixture`
- `stale_source_fixture`
- `license_unknown_source_fixture`
- `natural_feature_boundary_fixture`
- `poi_multi_entrance_fixture`
- `temporary_shelter_fixture`
- `privacy_blocked_unit_fixture`

これらは、実住所、受取人、秘密配送指示を含まない。目的は、理論上の安全条件を再現可能に検証することである。

---

## 5.20 非主張

本章は、次を主張しない。

**非主張5.1 全世界完全候補生成ではない。**

\[
\neg
\left(
\forall s,p:
r^\star_{t,p}(s)\in C_t(s,p)
\right)
\]

**非主張5.2 多言語展開だけで同一性を証明できるとは主張しない。**

\[
\neg
\left(
x_i,x_j\in\Lambda_t(n)
\Rightarrow
\operatorname{referent}(x_i)=\operatorname{referent}(x_j)
\right)
\]

**非主張5.3 オープンデータだけで全地域が十分とは主張しない。**

\[
\neg
\left(
\forall a,p:
\operatorname{OpenSourceCoverage}_t(a,p)\ge\theta_p
\right)
\]

**非主張5.4 公式出典だけで常に十分とは主張しない。**

\[
\neg
\left(
\forall a,p:
\operatorname{OfficialCoverage}_t(a,p)\ge\theta_p
\right)
\]

**非主張5.5 候補生成はPID発行ではない。**

\[
C_t(s,p)\neq \operatorname{PID}(s,p)
\]

**非主張5.6 ライセンス不明データを検証済み根拠として扱わない。**

\[
\operatorname{LicenseOK}_t(\sigma,p)=\bot
\Rightarrow
\operatorname{Admissible}_t(e,p)\neq1
\]

**非主張5.7 Candidate Coverage Certificateは配送成功保証ではない。**

\[
\operatorname{CCC}_t(s,p)=\operatorname{ready}
\centernot\Rightarrow
\operatorname{Deliverable}_t(s,p)=1
\]

**非主張5.8 出典負債ゼロは世界完全性ではない。**

\[
\operatorname{SourceDebt}_t(s,p)=\emptyset
\centernot\Rightarrow
\forall s',p':
r^\star_{t,p'}(s')\in C_t(s',p')
\]

出典負債ゼロは、特定の地域、目的、地物型、時点において、定義済みゲートが通ったことを意味するだけである。

---

## 5.21 前半補強: 候補負債と段階的リコール

本章の弱点は、候補生成を定義すると、候補集合に真の対象が必ず入るように見えてしまう点である。AMTでは、候補生成は完全性の定理ではなく、出典政策、地域、言語、目的ごとの負債を明示する工程である。

候補生成の負債を次で定義する。

\[
\operatorname{Debt}_C(s,p)
=
\{
d\mid
\operatorname{RequiredEvidenceType}(d,p)=1
\land
\operatorname{Covered}(d,s,p)=0
\}
\]

負債が空でない場合、

\[
\operatorname{Debt}_C(s,p)\neq\emptyset
\Rightarrow
\operatorname{CandidateCoverage}(s,p)<\operatorname{ready}
\]

となる。

候補生成は、次の段階を持つ。

| stage | role | non-claim |
| --- | --- | --- |
| lexical recall | 表記ゆれ、別名、旧地名を拾う | identity proofではない |
| administrative recall | 行政階層候補を拾う | current boundary proofではない |
| spatial recall | 座標・ポリゴン・セル候補を拾う | referent identityではない |
| POI/logistics recall | 駅、港、ロッカー、入口を拾う | residence proofではない |
| temporal recall | 災害、一時滞在、移転を拾う | permanent addressではない |
| source recall | 公式、OSS、地域出典を結合する | license/freshnessを自動保証しない |

段階的リコールを

\[
C_t(s,p)=
C^{lex}\cup C^{admin}\cup C^{spatial}\cup C^{poi}\cup C^{temp}\cup C^{source}
\]

と置く。

しかし、

\[
r^\star\notin C_t(s,p)
\]

は常に起こり得る。これを隠すのではなく、AMTは次を出力する。

```text
candidate coverage certificate:
  status: ready | partial | insufficient | blocked
  sourceDebt: [...]
  recallLayersUsed: [...]
  unsupportedLayers: [...]
  nonClaims: [...]
```

本章の追加反例は次である。

| counterexample | lesson |
| --- | --- |
| old village name absent from sources | multilingual recall remains incomplete |
| island reachable only by seasonal ferry | spatial candidate without route is insufficient |
| hotel delivery uses temporary guest name | public address is not enough |
| locker has session identifier only | application ID is not referent PID |
| unofficial local district name | social evidence needs policy |

この補強により、第5章は候補をたくさん作る章ではなく、候補生成の限界と負債を公開する章になる。

---

## 5.22 まとめ

本章では、表面住所表現から有限候補集合を作る方法と、その候補を支える出典政策を定義した。

中心的な分離は次である。

```text
候補生成
  != 同一性判定
  != PID発行
  != 配送可能性証明
  != ZK証明
```

候補生成は、真の参照対象を落とさないためのリコール層である。多言語展開、旧地名、別名、POI、自然地理、文化地理、ロッカー、港、学校、病院、AGIDセルは、候補を広げるために使われる。

しかし、候補集合に入っただけでは正しいとは言えない。候補は、第6章の構造距離と同値類、第7章の安全解決、第9章の品質・確率、第11章のプライバシー境界を通ってはじめて、目的に対して安全に利用できる。

本章で追加した新しい中間成果物は Candidate Coverage Certificate である。これは、候補生成が後段へ進めるかどうかを記録するが、PID発行、配送成功、ZK証明成立、全世界完全性を主張しない。

本章の最重要式は次である。

\[
r\in C_t(s,p)
\centernot\Rightarrow
\rho_{t,p}(s)=(r,\operatorname{resolved})
\]

候補生成は必要である。しかし、それだけでは十分ではない。
