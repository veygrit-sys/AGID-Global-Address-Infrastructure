# 第4章 公理・記法・安全な棄却

## 4.0 互換ノート

本章は、現行29章構成における第5章、第6章、第10章、第29章を保存しつつ、v2構成の第4章として再記述する。

本章で保存する主張は次の通りである。

- 住所解決を計算可能にするには、表面表現、参照対象、証拠、目的、候補生成、構造距離、順序、未解決状態を明示しなければならない。
- 住所解決写像は全域写像ではなく、部分写像である。
- 候補生成、証拠、出典、目的、公開投影、履歴、同値判定のいずれかの前提が壊れた場合、AMTは偽の精密解を返してはならない。
- 未解決、曖昧、証拠不足、出典不足、地域未対応、手動確認は、失敗ではなく安全な出力状態である。
- 郵便番号が弱い国、住所制度が未整備な地域、係争地域、自然地理、垂直参照では、未解決状態を第一級のモデル状態として扱う必要がある。
- 公開識別子や公開投影は、私的住所属性を復元可能にしてはならない。

本章で導入する数理対象は、AMTタプル、部分写像、底要素 \(\bot\)、状態集合、候補十分性公理、証拠許容公理、目的相対性公理、有限性公理、棄却安全性公理、公開投影安全性公理、未解決地域状態である。

候補生成の具体的な構成は第5章、構造距離と同値類は第6章、有限推定とPID発行は第7章、確率的意思決定は第9章、プロトコルとプライバシー境界は第11章で扱う。

---

## 4.1 なぜ公理が必要か

住所写像論は、住所を「文字列から正規化文字列へ変換する処理」としてではなく、「表面表現から参照対象へ安全に写像する計算」として扱う。

しかし、住所解決には常に不完全性がある。

- 入力が不完全である。
- 表記ゆれがある。
- 旧地名や別名がある。
- 同じ名前の場所が複数ある。
- 公式住所が存在しない地域がある。
- 郵便番号がない国がある。
- 緯度経度が建物の中心を指し、入口や部屋を指さないことがある。
- 出典が古い、欠けている、または利用条件が不明である。
- 政治的・行政的に扱いが分かれる地域がある。
- 自然地理や文化地理では境界が曖昧なことがある。
- 垂直属性や部屋番号は公開してはいけないことがある。

この状況で、解決器が常に一つの答えを返すなら、それは精密に見えるだけで安全ではない。

AMTの公理系は、次のためにある。

```text
解ける場合にだけ解き、
解けない場合には解けないと返す。
```

したがって、本章の中心命題は次である。

\[
\text{failed assumption}
\Rightarrow
\text{abstention or review}
\]

AMTにおいて、棄却は失敗ではない。安全な未解決出力は、誤ったPID発行や誤配送、過剰開示、監視化を防ぐための正しい振る舞いである。

### 4.1.1 可換図式の型

AMTでは、処理経路が複数ある場合に「同じ結果に到達するか」を可換図式として扱う。ただし、住所処理における可換性は、文字列一致ではない。多言語、履歴、自然地理、垂直参照、ZK証明、匿名配送では、同じ文字列に戻すことが正しくない場合が多い。

したがって、AMTの可換図式を次の4種類に分ける。

| 型 | 意味 |
| --- | --- |
| strict | 同じスキーマ版・同じ入力条件の下で、両経路が同一の形式対象を返す。 |
| weak | 両経路の文字列や表現は異なるが、同じ候補上位集合、同じ同値類、または同じ安全判定に落ちる。 |
| conditional | 出典、時刻、目的、品質、公開投影、プライバシー条件が成立する時だけ可換になる。 |
| intentionally-non-commutative | 逆向きに戻ってはならない。公開PID、ZK public signal、監査ログ、匿名配送承認から、私的住所属性を復元できてはならない。 |

厳密可換な正方形は次を主張する。

\[
g(f(x)) = k(h(x))
\]

弱可換または条件付き可換なAMT図式では、同一性ではなく、目的相対的な同値または安全判定の一致を主張する。

\[
\mathsf{Gate}(x,p,t,E)=1
\Rightarrow
g(f(x)) \sim_p k(h(x))
\]

非可換であるべき図式では、次を主張する。

\[
\nexists i : W \to X_{\mathrm{private}}
\]

つまり、公開出力 \(W\) から私的住所属性、部屋番号、受取人、witness、秘密鍵、proof secret へ戻る写像は存在してはならない。

可換図式の一覧は [AMT v2 Commutative Diagrams](commutative-diagrams.md) に置く。本章では公理語彙として導入し、第7章ではPID発行境界、第11章ではZK・匿名配送・監査の非可換境界として参照する。

---

## 4.2 基本記法

本章で使う基本集合を次のように置く。

| 記号 | 意味 |
| --- | --- |
| \(t\) | 時刻またはデータ版 |
| \(S_t\) | 時刻 \(t\) における表面住所表現集合 |
| \(R_t\) | 時刻 \(t\) における参照対象集合 |
| \(E_t\) | 証拠集合 |
| \(P\) | 目的集合 |
| \(C_t(s,p)\) | 表現 \(s\)、目的 \(p\) に対する候補集合 |
| \(\Omega_t\) | 観測空間 |
| \(\nu_t\) | 正規化写像 |
| \(\Gamma_t\) | 候補生成写像 |
| \(D_{t,p}\) | 目的 \(p\) に対する構造距離 |
| \(\delta_p\) | 目的 \(p\) に対する同値閾値 |
| \(Q_{t,p}\) | 品質・証拠評価関数 |
| \(\preceq_{t,p}\) | 目的 \(p\) に対する候補順序 |
| \(\rho_{t,p}\) | 安全解決写像 |
| \(\bot\) | 未解決または棄却を表す底要素 |
| \(\pi_{\mathrm{pub}}\) | 公開投影 |

住所写像論では、多くの写像は部分写像である。

\[
f : X \rightharpoonup Y
\]

は、すべての \(x \in X\) に対して値を返すとは限らない写像である。

部分写像を明示的な底要素付き写像として扱う場合は、次のように書く。

\[
f^\bot : X \to Y \cup \{\bot\}
\]

ここで \(\bot\) は、未解決、証拠不足、出典不足、候補不足、曖昧、手動確認などの安全な非解決状態を代表する。

---

## 4.3 AMTタプル

時刻 \(t\) におけるAMTシステムを次のタプルとして置く。

\[
\mathcal{A}_t =
(
S_t,
R_t,
E_t,
P,
\Omega_t,
\nu_t,
\Gamma_t,
D_{t,p},
\delta_p,
Q_{t,p},
\preceq_{t,p},
\rho_{t,p},
\pi_{\mathrm{pub}},
\mathcal{U}_t,
\bot
)
\]

各要素の意味は次である。

- \(S_t\): 表面住所表現集合。
- \(R_t\): 参照対象集合。
- \(E_t\): 証拠集合。
- \(P\): 目的集合。
- \(\Omega_t\): 観測空間。
- \(\nu_t\): 表面表現を正規化観測へ写す写像。
- \(\Gamma_t\): 正規化観測と目的から候補集合を生成する写像。
- \(D_{t,p}\): 目的別構造距離。
- \(\delta_p\): 目的別同値閾値。
- \(Q_{t,p}\): 候補と証拠の品質評価。
- \(\preceq_{t,p}\): 候補間の選好順序。
- \(\rho_{t,p}\): 安全解決写像。
- \(\pi_{\mathrm{pub}}\): 公開投影。
- \(\mathcal{U}_t\): 未解決・制限状態集合。
- \(\bot\): 底要素。

このタプルは、AMTが単一アルゴリズムではなく、住所解決を安全に定義するための構造であることを示す。

---

## 4.4 状態集合

AMTは、成功または失敗の二値だけを返さない。

解決状態集合を次のように置く。

\[
\mathcal{Z}
=
\{
\operatorname{resolved},
\operatorname{ambiguous},
\operatorname{unresolved},
\operatorname{source\_insufficient},
\operatorname{candidate\_insufficient},
\operatorname{manual\_review},
\operatorname{invalid},
\operatorname{deprecated},
\operatorname{disputed},
\operatorname{restricted}
\}
\]

安全解決写像は、参照対象または状態を返す。

\[
\rho_{t,p} :
S_t
\to
(R_t \times \mathcal{Z}) \cup \{\bot\}
\]

このとき、

\[
\rho_{t,p}(s)=(r,\operatorname{resolved})
\]

なら、目的 \(p\) に対して表面表現 \(s\) は参照対象 \(r\) へ安全に解決されたことを意味する。

一方、

\[
\rho_{t,p}(s)=\bot
\]

または

\[
\rho_{t,p}(s)=(\bot,z),\quad z\neq \operatorname{resolved}
\]

なら、AMTはその入力を安全に解決しない。

重要なのは、\(\operatorname{unresolved}\) や \(\operatorname{manual\_review}\) が失敗ではなく、誤った解決を避けるための明示的な状態である点である。

---

## 4.5 候補十分性公理

候補生成は、真の参照対象を候補集合に含めることを目指す。しかし、これは無条件には保証されない。

候補集合を次で表す。

\[
C_t(s,p)=\Gamma_t(\nu_t(s),p)
\]

目的 \(p\) に対して真の参照対象が定義される場合、それを \(r^\star_{t,p}(s)\) と書く。

候補十分性公理は次である。

\[
r^\star_{t,p}(s)\ \text{exists}
\land
\operatorname{CoverageOK}_t(s,p)=1
\Rightarrow
r^\star_{t,p}(s)\in C_t(s,p)
\]

ただし、\(\operatorname{CoverageOK}_t(s,p)\) は、対象地域、言語、出典、ライセンス、地物型が候補生成の対象範囲に入っていることを表す。

この公理は、全世界完全リコールを主張しない。むしろ、次を明確にする。

\[
\operatorname{CoverageOK}_t(s,p)\neq 1
\Rightarrow
\rho_{t,p}(s)\neq (r,\operatorname{resolved})
\]

候補生成の対象外であれば、解決ではなく未解決または手動確認へ送る。

---

## 4.6 証拠許容公理

AMTは、候補を証拠によって支える。

証拠許容述語を次で表す。

\[
\operatorname{Admissible}_t(e,p) \in \{0,1,\bot\}
\]

ここで \(e \in E_t\) は証拠、\(p\) は目的である。

証拠許容公理は次である。

\[
\operatorname{Use}_t(e,r,p)=1
\Rightarrow
\operatorname{Admissible}_t(e,p)=1
\]

つまり、候補 \(r\) を目的 \(p\) に対して支持する証拠として使うなら、その証拠は目的 \(p\) に対して許容されていなければならない。

許容性には、少なくとも次を含む。

- 出典が明示されている。
- ライセンス上利用可能である。
- 更新時刻または版が追跡できる。
- 地域と地物型に対して適切である。
- プライバシー上公開または内部利用が許される。
- 政治的主張と技術的識別が分離されている。

証拠が許容されない場合、AMTはその証拠を使って解決してはならない。

---

## 4.7 目的相対性公理

同じ住所表現でも、目的によって必要な解決粒度と許容リスクは異なる。

目的集合を \(P\) とする。

目的相対性公理は次である。

\[
\rho_{t,p_1}(s)
\text{ need not equal }
\rho_{t,p_2}(s)
\]

より形式的には、

\[
\exists s \in S_t,\exists p_1,p_2 \in P :
\rho_{t,p_1}(s)=(r_1,z_1)
\land
\rho_{t,p_2}(s)=(r_2,z_2)
\land
(r_1,z_1)\neq(r_2,z_2)
\]

例えば、国レベルの統計には国が分かれば十分である。通常配送には建物または入口が必要である。医薬品配送には本人確認や受取認証が必要である。ZK証明では住所全文ではなく、条件だけを証明すればよい場合がある。

したがって、AMTは「唯一の正しい住所」を返す理論ではない。

AMTは、目的に対して十分で安全な参照を返す理論である。

---

## 4.8 有限候補公理

計算可能な解決には、有限の候補集合が必要である。

有限候補公理は次である。

\[
|C_t(s,p)| < \infty
\]

ただし、これは世界全体が有限であるという哲学的主張ではない。実装時の候補生成が、時刻、地域、出典、目的、探索深さ、言語展開、空間範囲によって有限に制限されるという計算上の条件である。

候補集合が有限でなければ、後段の構造距離、同値類、スコアリング、argmin、手動確認キューを定義しにくい。

候補集合が有限に構成できない場合、AMTは次を返す。

\[
\rho_{t,p}(s)=(\bot,\operatorname{candidate\_insufficient})
\]

または

\[
\rho_{t,p}(s)=(\bot,\operatorname{manual\_review})
\]

---

## 4.9 構造比較公理

候補間の比較には、文字列一致や座標一致だけではなく、構造距離が必要である。

目的 \(p\) に対する構造距離を次で表す。

\[
D_{t,p}: R_t \times R_t \to \mathbb{R}_{\ge 0}\cup\{\infty\}
\]

構造比較公理は次である。

\[
D_{t,p}(r_i,r_j)
\text{ must be defined or explicitly undefined before equivalence is claimed}
\]

同値候補を作る場合、閾値 \(\delta_p\) を用いて次のように書く。

\[
r_i \sim_{t,p,\delta} r_j
\quad\text{iff}\quad
D_{t,p}(r_i,r_j)\le \delta_p
\]

ただし、\(D_{t,p}\) が未定義である場合は、同値と判定してはならない。

\[
D_{t,p}(r_i,r_j)=\bot
\Rightarrow
r_i \not\sim_{t,p,\delta} r_j
\text{ by automatic resolution}
\]

この詳細は第6章で扱う。

---

## 4.10 順序・選好公理

候補集合が有限で、証拠評価が可能でも、候補間の比較規則がなければ安全な選択はできない。

目的 \(p\) に対する候補順序を次で表す。

\[
\preceq_{t,p} \subseteq C_t(s,p)\times C_t(s,p)
\]

順序・選好公理は次である。

\[
C_t(s,p) \neq \emptyset
\land
\operatorname{Comparable}_t(C_t(s,p),p)=1
\Rightarrow
\exists \min_{\preceq_{t,p}} C_t(s,p)
\]

ただし、候補が比較不能、または同点で安全な決定規則がない場合、解決してはならない。

\[
\operatorname{Comparable}_t(C_t(s,p),p)\neq 1
\Rightarrow
\rho_{t,p}(s)=(\bot,\operatorname{ambiguous})
\]

この公理は、曖昧な候補に対して「もっともらしい一つ」を勝手に選ばないためのものである。

---

## 4.11 棄却安全性公理

本章の中心公理は、棄却安全性である。

AMTの安全ゲート集合を次で表す。

\[
\mathcal{G}_{t,p}(s)=
\{
g_1,g_2,\ldots,g_n
\}
\]

各ゲート \(g_i\) は、候補十分性、証拠許容性、目的適合性、有限性、構造比較可能性、順序決定可能性、公開投影安全性などを表す。

棄却安全性公理は次である。

\[
\exists g_i \in \mathcal{G}_{t,p}(s):
g_i=0 \ \text{or}\ g_i=\bot
\Rightarrow
\rho_{t,p}(s)\neq(r,\operatorname{resolved})
\]

つまり、一つでも必須ゲートが失敗または未確認なら、AMTは解決済み参照対象を返してはならない。

この公理は、AMTを保守的にする。だが、住所基盤では保守性が必要である。誤った住所解決は、誤配送、本人確認失敗、監査不能、私的情報漏えい、係争地域への政治的主張、危険区域への誘導につながる。

したがって、AMTでは次の設計を採る。

```text
unknown is not false,
but unknown is also not resolved.
```

---

## 4.12 公開投影安全性公理

AMTは、参照対象を公開識別子、ログ、API応答、証明public signalへ投影することがある。

公開投影安全性公理は次である。

\[
\pi_{\mathrm{pub}}(r)
\text{ must not reveal }
\operatorname{PrivateAttr}(r)
\]

情報論的に書くなら、私的属性を \(X\)、公開投影を \(Y=\pi_{\mathrm{pub}}(r)\) としたとき、目的に対して許容された漏えい量 \(\epsilon_p\) を超えてはならない。

\[
I(X;Y) \le \epsilon_p
\]

ここで \(I(X;Y)\) は相互情報量である。

より実装寄りには、次を満たす必要がある。

\[
\operatorname{RecoverPrivateAttr}(\pi_{\mathrm{pub}}(r))=0
\]

公開投影は、多対一でよい。むしろ、部屋番号、病室、ホテル客室、避難所滞在、配送ロッカー割当などを守るためには、多対一でなければならない場合がある。

---

## 4.13 未解決国・弱出典地域の状態

AMTでは、住所制度が弱い国や地域を例外としてではなく、正式な状態として扱う。

地域 \(a\) に対して、出典充足度を次で表す。

\[
\operatorname{SourceCoverage}_t(a,p)\in[0,1]
\]

目的 \(p\) に必要な最小出典充足度を \(\theta_p\) とする。

未解決地域条件は次である。

\[
\operatorname{SourceCoverage}_t(a,p)<\theta_p
\Rightarrow
\operatorname{RegionState}_t(a,p)=\operatorname{source\_insufficient}
\]

この状態では、AMTは対象地域全体を「エラー」とは呼ばない。むしろ、次のように扱う。

- 候補生成範囲を限定する。
- 公式出典が不足していることを明示する。
- オープンデータ、POI、道路、港、学校、病院、ロッカー、AGIDセル等を補助証拠として扱う。
- 必要なら手動確認へ送る。
- 検証済みでないことを検証済みと呼ばない。

郵便番号が存在しない国、郵便番号が弱い国、海域、島しょ部、自然地理、非公式居住地、災害時避難所では、この状態が重要になる。

---

## 4.14 安全な解決関数

以上の公理を用いて、安全な解決関数を次のように定義する。

\[
\rho_{t,p}(s)=
\begin{cases}
(r,\operatorname{resolved}) &
\text{if all required gates pass and } r \text{ is selected safely} \\
(\bot,\operatorname{ambiguous}) &
\text{if candidates remain indistinguishable} \\
(\bot,\operatorname{source\_insufficient}) &
\text{if source coverage is insufficient} \\
(\bot,\operatorname{candidate\_insufficient}) &
\text{if candidate generation is insufficient} \\
(\bot,\operatorname{manual\_review}) &
\text{if automated safety is not enough} \\
(\bot,\operatorname{restricted}) &
\text{if privacy or access policy blocks disclosure} \\
\bot &
\text{otherwise}
\end{cases}
\]

この関数の性質は、正解を常に返すことではない。

重要な性質は、危険なときに解決しないことである。

---

## 4.15 存在定理

**定理4.1 有限安全解決の存在。**  
表面表現 \(s\)、目的 \(p\)、時刻 \(t\) について、次が成り立つとする。

1. \(C_t(s,p)\) は有限である。
2. 必須証拠が許容されている。
3. 候補間の比較関数が定義されている。
4. 候補順序 \(\preceq_{t,p}\) が少なくとも一つの最小候補を持つ。
5. 棄却安全性ゲートがすべて通過している。
6. 公開投影が目的 \(p\) に対して安全である。

このとき、安全解決写像 \(\rho_{t,p}\) は、\((r,\operatorname{resolved})\) または安全な非解決状態を返す。

**証明スケッチ。**  
候補集合は有限なので、順序が最小候補を持つなら候補選択は定義できる。証拠許容性、目的相対性、公開投影安全性、棄却安全性が満たされているため、選ばれた候補は目的 \(p\) に対して安全に返せる。いずれかの条件が満たされない場合、棄却安全性公理により非解決状態を返す。したがって、\(\rho_{t,p}\) は危険な精密解を返さず、解決または安全な非解決状態として存在する。

---

## 4.16 一意性定理

**定理4.2 安全一意性。**  
候補集合 \(C_t(s,p)\) において、目的 \(p\) に対する最小候補が一意であり、すべての安全ゲートが通過し、公開投影安全性が満たされるなら、\(\rho_{t,p}(s)\) は一意の解決対象を返す。

\[
\exists! r^\star \in C_t(s,p):
\forall r \in C_t(s,p),\ r^\star \preceq_{t,p} r
\]

かつ

\[
\operatorname{AllGatesPass}_{t,p}(s)=1
\]

なら、

\[
\rho_{t,p}(s)=(r^\star,\operatorname{resolved})
\]

**証明スケッチ。**  
一意最小候補 \(r^\star\) が存在するため、選択規則は一意である。全ゲートが通過しているため棄却条件は発火しない。したがって、安全解決写像は \(r^\star\) を返す。

逆に、最小候補が一意でない場合は、AMTは勝手に一つを選ばず、\(\operatorname{ambiguous}\) または \(\operatorname{manual\_review}\) を返す。

---

## 4.17 反例

本章の公理が必要であることを示す反例を挙げる。

### 反例4.1 候補不足

\[
r^\star_{t,p}(s)\notin C_t(s,p)
\]

このとき、どの候補を選んでも真の参照対象にはならない。したがって、解決器が返すべき状態は次である。

\[
\rho_{t,p}(s)=(\bot,\operatorname{candidate\_insufficient})
\]

### 反例4.2 証拠不許容

\[
\operatorname{Admissible}_t(e,p)=0
\]

である証拠 \(e\) のみが候補 \(r\) を支持している場合、その候補を解決済みとして返してはならない。

\[
\rho_{t,p}(s)\neq(r,\operatorname{resolved})
\]

### 反例4.3 比較不能候補

\[
r_1,r_2 \in C_t(s,p)
\]

かつ

\[
r_1 \npreceq_{t,p} r_2
\land
r_2 \npreceq_{t,p} r_1
\]

なら、候補順序は解決を支えるだけ十分ではない。

\[
\rho_{t,p}(s)=(\bot,\operatorname{ambiguous})
\]

### 反例4.4 公開投影漏えい

\[
I(\operatorname{PrivateAttr}(r);\pi_{\mathrm{pub}}(r))>\epsilon_p
\]

なら、解決対象 \(r\) が内部的に正しくても、公開出力として返してはならない。

\[
\rho_{t,p}^{public}(s)=(\bot,\operatorname{restricted})
\]

---

## 4.18 実装フック

本章に対応する実装・検証フックは次の通りである。

- AMTタプルfixture
- 公理依存グラフ
- 候補十分性ゲート
- 証拠許容ゲート
- 目的相対性ゲート
- 有限候補ゲート
- 構造比較可能性ゲート
- 順序決定可能性ゲート
- 棄却安全性ゲート
- 公開投影安全性ゲート
- 未解決国・弱出典地域fixture
- 候補不足、証拠不許容、比較不能、公開投影漏えいの反例fixture

これらのfixtureは、第7章の安全解決、第11章のZK境界、第12章の検証マップへ接続する。

---

## 4.19 前半補強: 公理破れを例外ではなく状態として扱う

本章の弱点は、公理を列挙すると、AMTが理想的なデータ環境を仮定しているように見える点である。AMTでは、公理は「常に成り立つ世界の仮定」ではなく、「破れたときに解決してはいけない条件」である。

公理集合を

\[
\mathcal{A}=\{A_1,\ldots,A_n\}
\]

とし、各公理に対応するゲートを

\[
g_i(s,p,E)\in\{1,0,\bot\}
\]

と置く。

通常の解決器が危険なのは、\(g_i=0\) または \(\bot\) のときにも値を返すことである。AMTでは、状態遷移を次で固定する。

\[
\exists i:g_i(s,p,E)\neq1
\Rightarrow
\rho_{t,p}(s,E)\in
\{\operatorname{unresolved},\operatorname{manualReview},\operatorname{blocked}\}
\]

この規則により、公理破れは runtime exception ではなく、監査可能な出力状態になる。

公理破れの代表例は次である。

| broken gate | safe state | reason |
| --- | --- | --- |
| candidate sufficiency unknown | unresolved | true referent may be missing |
| evidence license unknown | blocked | cannot publish or validate |
| source freshness stale | unresolved | current purpose may differ |
| structural comparability false | manual_review | distance is not meaningful |
| ordering tie unsafe | manual_review | deterministic choice would be arbitrary |
| public projection unsafe | resolved but PID blocked | resolution and publication differ |
| privacy boundary violated | blocked | safety dominates convenience |

したがって、公理は強い主張ではなく、失敗検出器である。

\[
\operatorname{Axiom}(A_i)
=
\operatorname{RequiredGate}(g_i)
+\operatorname{FailureState}(z_i)
\]

この補強により、第4章は抽象的な形式準備ではなく、安全な住所計算のエラーモデルになる。

---

## 4.20 非主張

本章は、次を主張しない。

**非主張4.1 AMTは全住所を解決できるとは主張しない。**

\[
\neg
\left(
\forall s \in S_t,\forall p \in P:
\exists r \in R_t,\rho_{t,p}(s)=(r,\operatorname{resolved})
\right)
\]

**非主張4.2 候補生成が常に完全であるとは主張しない。**

\[
\neg
\left(
\forall s,p:
r^\star_{t,p}(s)\in C_t(s,p)
\right)
\]

**非主張4.3 弱出典地域をエラー扱いするとは主張しない。**

\[
\operatorname{SourceCoverage}_t(a,p)<\theta_p
\Rightarrow
\operatorname{RegionState}_t(a,p)=\operatorname{source\_insufficient}
\]

これはエラーではなく、状態である。

**非主張4.4 公開PIDが私的住所属性を含むとは主張しない。**

\[
\operatorname{PrivateAttr}(r)
\not\subseteq
\operatorname{Attr}(\pi_{\mathrm{pub}}(r))
\]

**非主張4.5 棄却は失敗であるとは主張しない。**

\[
\rho_{t,p}(s)=(\bot,z),\ z\neq\operatorname{resolved}
\]

は、誤った解決を避ける安全な出力であり得る。

---

## 4.21 まとめ

本章では、住所写像論を計算可能な理論として扱うための公理、記法、状態、安全な棄却を定義した。

AMTは、常に一つの住所を返す解決器ではない。むしろ、次の構造を持つ。

```text
表面表現
  -> 正規化
  -> 候補生成
  -> 証拠評価
  -> 構造比較
  -> 順序決定
  -> 安全ゲート
  -> 解決 or 棄却 or 手動確認
```

この章の最重要原則は次である。

\[
\exists g_i : g_i=0 \text{ or } \bot
\Rightarrow
\rho_{t,p}(s)\neq(r,\operatorname{resolved})
\]

つまり、必須前提が壊れたら、AMTは解決しない。

この保守性によって、AMTは住所を安全な計算対象として扱える。次章では、この公理系の上で、表面住所表現から有限候補集合を生成する方法と、出典政策を定義する。
