# 第6章 構造距離と住所同値類

## 6.0 互換ノート

本章は、現行29章構成における第9章「クラスタと住所同値類」、第15章「住所圧縮と住所エントロピー」、第29章「数学的モデル中核」を保存し、v2構成の第6章として再記述する。

第5章は、表面住所表現から有限候補集合を作る章であった。本章は、その候補集合の内部で、候補同士が同じ参照対象を指すと言えるか、言えないか、または判断を棄却すべきかを扱う。

本章で保存する主張は次である。

- 住所同一性は、文字列一致、郵便番号一致、座標近接、POI名一致のいずれか単独では定義できない。
- 候補同士の比較には、目的別の構造距離が必要である。
- 構造距離が小さいだけでは同値類を作れない。比較可能性、証拠許容性、候補十分性が必要である。
- 近い候補を推移的に結合するだけでは、クラスタ直径が膨張し、誤った同値類が生じる。
- 住所圧縮は、曖昧性を減らす操作であり、真理を保証する操作ではない。
- PID発行は、候補または距離ではなく、目的別同値類、証拠、履歴、安全境界を確認した後の部分写像である。

本章の中心式は次である。

\[
r_i\sim_{t,p,\epsilon}r_j
\iff
d_{t,p}(r_i,r_j)\le\epsilon_p
\land
\operatorname{Comparable}_t(r_i,r_j,p)=1
\land
\operatorname{EvidenceOK}_t(r_i,r_j,p)=1
\land
\operatorname{CandidateSufficient}_t(s,p)=1
\]

距離だけでは足りない。比較可能性、証拠条件、候補十分性が必要である。

---

## 6.1 なぜ構造距離が必要か

住所は文字列ではなく、参照対象へ到達するための構造を持つ。住所表現には、国、行政区画、道路、郵便区域、建物、入口、階、部屋、POI、自然地物、時間、配送目的、本人確認目的などが重なっている。

そのため、単純な文字列距離はしばしば失敗する。

```text
同じ文字列 -> 別の場所
違う文字列 -> 同じ場所
同じ座標 -> 別の階・部屋・入口
同じ郵便番号 -> 複数の道路・建物・私書箱
同じPOI名 -> 複数の入口・棟・搬入口
```

AMTでは、住所候補を単なる文字列ではなく、構造特徴を持つ対象として扱う。構造距離は、二つの候補がどれだけ同じ参照対象らしいかを、目的別に測るための関数である。

---

## 6.2 参照候補と構造特徴ベクトル

第5章で得られた候補集合を \(C_t(s,p)\) とする。各候補 \(r\in C_t(s,p)\) に対し、構造特徴ベクトルを次で定義する。

\[
\phi_t(r)=
(
\phi_{country},
\phi_{admin},
\phi_{postal},
\phi_{road},
\phi_{building},
\phi_{entrance},
\phi_{unit},
\phi_{cell},
\phi_{natural},
\phi_{temporal}
)
\]

実装上は次のようなフィールドに対応する。

```text
country
adminPath
postalZone
roadSegment
building
entrance
unit
coordinateCell
naturalOrCulturalFeature
temporalScope
```

これらの成分は、すべての候補に存在するわけではない。郵便番号がない地域では `postalZone` が欠損し得る。自然地理では `roadSegment` や `unit` は存在しない。高層建築では `coordinateCell` が同じでも `unit` が重要になる。

したがって、構造距離は欠損を失敗として扱うのではなく、欠損そのものを評価対象にしなければならない。

---

## 6.3 目的別構造距離

目的 \(p\) における構造距離を次で定義する。

\[
d_{t,p}(r_i,r_j)
=
\frac{
\sum_{k\in K_{ij}}
w_{p,k}\cdot\delta_k(\phi_k(r_i),\phi_k(r_j))
}{
\sum_{k\in K_{ij}} w_{p,k}
}
\]

ここで、

- \(K_{ij}\) は、少なくとも片方の候補に値が存在する特徴集合。
- \(w_{p,k}\) は、目的 \(p\) における特徴 \(k\) の重み。
- \(\delta_k\) は特徴 \(k\) の不一致関数。

両方に欠損している特徴は、距離にも比較可能性にも寄与しない。片方だけ欠損している特徴は、完全不一致ではなく、部分不一致として扱うことができる。

\[
\delta_k(a,b)=
\begin{cases}
0 & a=b \land a\neq\bot \land b\neq\bot\\
\lambda_k & (a=\bot \land b\neq\bot)\lor(a\neq\bot \land b=\bot)\\
1 & a\neq b \land a\neq\bot \land b\neq\bot
\end{cases}
\]

通常、\(0<\lambda_k<1\) とする。欠損は情報不足であって、ただちに別物であるとは限らない。

---

## 6.4 目的別重み

同じ候補ペアでも、目的が変われば距離は変わる。

\[
d_{t,p_1}(r_i,r_j)\neq d_{t,p_2}(r_i,r_j)
\]

配送目的では、道路、建物、入口、搬入口、ロッカー、配送拠点が重い。本人確認目的では、行政区画、公的住所、居住実体、時点が重い。自然地理目的では、地物型、境界、代表点、隣接地物が重い。ZK住所述語では、公開可能属性と証明対象の粒度が重い。

目的別重みを例示すると次である。

| 特徴 | 配送 | 本人確認 | 自然地理 | ZK述語 |
| --- | ---: | ---: | ---: | ---: |
| country | 1 | 2 | 1 | 4 |
| adminPath | 2 | 5 | 2 | 4 |
| postalZone | 2 | 2 | 0 | 3 |
| roadSegment | 4 | 2 | 0 | 1 |
| building | 5 | 4 | 0 | 1 |
| entrance | 5 | 2 | 0 | 1 |
| unit | 4 | 3 | 0 | 0 |
| coordinateCell | 2 | 1 | 4 | 3 |
| naturalOrCulturalFeature | 1 | 1 | 6 | 1 |
| temporalScope | 2 | 3 | 2 | 2 |

この表は標準規格ではなく、目的相対的距離を説明するための初期重みである。実運用では、国、地域、配送会社、法域、出典品質、災害状態によって重みは変わる。

---

## 6.5 比較可能性

距離を計算できることと、同値判定できることは別である。比較可能性を次で定義する。

\[
\operatorname{Comparable}_t(r_i,r_j,p)\in\{0,1,\bot\}
\]

比較可能性が成立するには、目的 \(p\) において識別力を持つ特徴が、候補ペアの間で十分に観測されていなければならない。

例えば、配送目的で国だけ一致している二候補は比較可能ではない。

\[
\phi_{country}(r_i)=\phi_{country}(r_j)
\centernot\Rightarrow
\operatorname{Comparable}_t(r_i,r_j,\operatorname{delivery})=1
\]

配送では、少なくとも道路、建物、入口、配送拠点、AGIDセルなどの識別特徴が必要である。本人確認では、行政階層、公的証拠、居住性が必要である。自然地理では、地物型、境界、代表点、隣接地物が必要である。

---

## 6.6 証拠条件

構造特徴が一致していても、その特徴を支える証拠が弱ければ同値判定はできない。

証拠条件を次で表す。

\[
\operatorname{EvidenceOK}_t(r_i,r_j,p)\in\{0,1,\bot\}
\]

これは、第5章の出典許容性と接続する。二候補の比較に使う証拠は、目的 \(p\) に対して許容されていなければならない。

\[
\operatorname{EvidenceOK}_t(r_i,r_j,p)=1
\Rightarrow
\forall e\in E_{ij}:
\operatorname{Admissible}_t(e,p)=1
\]

ライセンス不明、鮮度不足、地域カバレッジ不足、プライバシー不適合の証拠は、同値判定の根拠にしてはならない。

---

## 6.7 目的別同値関係

閾値 \(\epsilon_p\) に対し、目的別同値関係を次で定義する。

\[
r_i\sim_{t,p,\epsilon}r_j
\iff
d_{t,p}(r_i,r_j)\le\epsilon_p
\land
\operatorname{Comparable}_t(r_i,r_j,p)=1
\land
\operatorname{EvidenceOK}_t(r_i,r_j,p)=1
\land
\operatorname{CandidateSufficient}_t(s,p)=1
\]

ここで重要なのは、距離条件が必要条件の一つにすぎないことである。

\[
d_{t,p}(r_i,r_j)\le\epsilon_p
\centernot\Rightarrow
r_i\sim_{t,p,\epsilon}r_j
\]

同値関係を軽く扱うと、異なる建物、異なる入口、異なる部屋、異なる配送拠点、異なる自然地物を一つの対象として圧縮してしまう。

---

## 6.8 住所同値類

候補 \(r\) の目的別同値類を次で定義する。

\[
[r]_{t,p,\epsilon}
=
\{r'\in C_t(s,p)\mid r'\sim_{t,p,\epsilon}r\}
\]

この同値類は、永遠不変の対象ではない。時点 \(t\)、目的 \(p\)、閾値 \(\epsilon_p\)、出典集合、証拠状態が変われば変化する。

\[
[r]_{t,p,\epsilon}
\neq
[r]_{t',p,\epsilon}
\]

となり得る。

AMTでは、PID発行は候補単体ではなく、目的別同値類とその履歴・品質・安全境界に対して検討する。

---

## 6.9 クラスタと直径制約

実装では、候補集合をクラスタに分けたくなる。ここで危険なのは、近い候補を推移的に結合するだけのクラスタリングである。

二候補が近い関係を次で表す。

\[
\operatorname{Near}_{t,p}(r_i,r_j)
\iff
d_{t,p}(r_i,r_j)\le\epsilon_p
\]

この `Near` を推移閉包すると、次が起き得る。

\[
r_1\text{ near }r_2,\quad
r_2\text{ near }r_3,\quad
\ldots,\quad
r_{n-1}\text{ near }r_n
\]

しかし、

\[
d_{t,p}(r_1,r_n)>\epsilon_p
\]

であり得る。これを連鎖結合問題と呼ぶ。

したがって、AMTでは、クラスタに直径制約を置く。

\[
\operatorname{diam}_{t,p}(K)
=
\max_{r_i,r_j\in K}d_{t,p}(r_i,r_j)
\le\epsilon_p
\]

直径制約を満たさないクラスタは、同値類として扱ってはならない。

---

## 6.10 商写像と住所圧縮

同値類が得られたとき、候補集合から同値類集合への商写像を定義できる。

\[
q_{t,p,\epsilon}:C_t(s,p)\to C_t(s,p)/\sim_{t,p,\epsilon}
\]

これは住所圧縮の一種である。複数の表現や候補を一つの同値類へまとめることで、曖昧性を減らす。

しかし、商写像は真理を作るわけではない。

\[
q_{t,p,\epsilon}(r_i)=q_{t,p,\epsilon}(r_j)
\centernot\Rightarrow
r_i=r_j\ \text{as physical objects}
\]

同値類は、目的 \(p\) と証拠状態の下で同じ参照として扱える、という操作的な対象である。

---

## 6.11 曖昧性とエントロピー

候補集合に確率分布 \(\pi\) があるとき、住所曖昧性をエントロピーで表す。

\[
H(C_t(s,p))
=
-
\sum_{r\in C_t(s,p)}
\pi(r)\log \pi(r)
\]

同値類へ商写像を適用すると、同値類上の分布が得られる。

\[
\bar{\pi}([r])
=
\sum_{r'\in [r]}\pi(r')
\]

圧縮後のエントロピーは次である。

\[
H(C_t(s,p)/\sim)
=
-
\sum_{[r]}
\bar{\pi}([r])\log\bar{\pi}([r])
\]

住所圧縮の目的は、不要な表現差を減らし、判断可能な同値類へ候補を整理することである。ただし、エントロピー低下は真理の証明ではない。

\[
H(C/\sim)<H(C)
\centernot\Rightarrow
\text{correct resolution}
\]

---

## 6.12 垂直参照と微小距離の失敗

座標距離は、垂直参照に弱い。

同じ緯度経度でも、次は異なる参照対象であり得る。

```text
1階店舗
2階診療所
10階オフィス
地下搬入口
ホテル客室
病室
ロッカー
屋上ドローン受取点
```

したがって、

\[
\operatorname{coord}(r_i)=\operatorname{coord}(r_j)
\centernot\Rightarrow
r_i=r_j
\]

である。配送、本人確認、ホテル、病院、ロッカー、ドローン配送では、垂直構造が参照対象を分ける。

---

## 6.13 自然地理と領域距離

自然地理では、点距離だけでは不十分である。川、湖、山、砂漠、島、海域は点ではなく、線、面、境界、代表点、隣接関係を持つ。

自然地理候補 \(r\) には、少なくとも次のいずれかが必要である。

```text
representative_point
boundary
extent
adjacent_features
access_points
protected_area_state
temporal_state
```

自然地理の距離は、代表点距離だけでなく、境界距離や包含関係を含む。

\[
d_{natural}(r_i,r_j)
=
\alpha d_{point}
+\beta d_{boundary}
+\gamma d_{containment}
+\delta d_{adjacency}
\]

ここでも、距離が小さいだけでは同値ではない。出典、境界、名称体系、時点が必要である。

---

## 6.14 安全な棄却

次の場合、同値判定は棄却される。

\[
\operatorname{Comparable}_t(r_i,r_j,p)\neq1
\]

または、

\[
\operatorname{EvidenceOK}_t(r_i,r_j,p)\neq1
\]

または、

\[
\operatorname{CandidateSufficient}_t(s,p)\neq1
\]

このとき、AMTは同一とも別物とも断言しない。

\[
\operatorname{EquivDecision}_t(r_i,r_j,p)=\operatorname{abstain}
\]

棄却は失敗ではなく、誤った同一化を避けるための安全状態である。

---

## 6.15 反例

### 反例6.1 文字列一致

\[
label(r_1)=label(r_2)
\centernot\Rightarrow
r_1=r_2
\]

同じ建物名、同じ道路名、同じ地名が複数の場所に存在し得る。

### 反例6.2 文字列不一致

\[
label(r_1)\neq label(r_2)
\centernot\Rightarrow
r_1\neq r_2
\]

翻訳、旧地名、略称、現地語、ローマ字、施設名変更により、同じ対象が異なる文字列表現を持ち得る。

### 反例6.3 郵便番号一致

\[
postal(r_1)=postal(r_2)
\centernot\Rightarrow
r_1=r_2
\]

郵便番号は区域、配送経路、私書箱、事業所番号を表し得るため、個別実体の同一性を保証しない。

### 反例6.4 座標近接

\[
\operatorname{dist}_{geo}(r_1,r_2)<\eta
\centernot\Rightarrow
r_1=r_2
\]

隣接店舗、上下階、ホテル客室、病室、ロッカーでは、座標が近くても別対象である。

### 反例6.5 POI名一致

\[
\operatorname{poi}(r_1)=\operatorname{poi}(r_2)
\centernot\Rightarrow
\operatorname{entrance}(r_1)=\operatorname{entrance}(r_2)
\]

同じ施設でも、正面入口、搬入口、駐車場入口、ロッカー入口、従業員入口が分かれる。

### 反例6.6 推移的近接クラスタ

\[
d(r_1,r_2)\le\epsilon,\quad
d(r_2,r_3)\le\epsilon,\quad
d(r_1,r_3)>\epsilon
\]

このとき、推移閉包だけで \(\{r_1,r_2,r_3\}\) を一つの同値類にすると、直径制約に反する。

---

## 6.16 命題と定理

**命題6.1 構造距離の目的相対性。**  
同じ候補ペアでも、目的が異なれば距離は変わる。

\[
\exists r_i,r_j,p_1,p_2:
d_{t,p_1}(r_i,r_j)\neq d_{t,p_2}(r_i,r_j)
\]

**命題6.2 距離閾値だけでは同値を定義できない。**

\[
d_{t,p}(r_i,r_j)\le\epsilon_p
\centernot\Rightarrow
r_i\sim_{t,p,\epsilon}r_j
\]

比較可能性、証拠条件、候補十分性が必要である。

**命題6.3 棄却は安全性の一部である。**

\[
\operatorname{Comparable}_t(r_i,r_j,p)\neq1
\lor
\operatorname{EvidenceOK}_t(r_i,r_j,p)\neq1
\Rightarrow
\operatorname{EquivDecision}_t(r_i,r_j,p)=\operatorname{abstain}
\]

**定理6.1 直径制約なし推移クラスタの危険性。**  
`Near` 関係の推移閉包だけでクラスタを作ると、クラスタ内に閾値を超える候補ペアが含まれ得る。

\[
\exists K:
\forall r_i,r_j\text{ adjacent in chain}, d(r_i,r_j)\le\epsilon
\land
\operatorname{diam}(K)>\epsilon
\]

したがって、AMTの同値類クラスタには直径制約が必要である。

**定理6.2 同値類圧縮は曖昧性を増やさない。**  
同値類への商写像が確率質量を合算する場合、同値類上のエントロピーは候補上のエントロピー以下である。

\[
H(C/\sim)\le H(C)
\]

ただし、これは正解保証ではない。圧縮が誤っていれば、低エントロピーの誤解決が起きる。

---

## 6.17 アルゴリズム

構造同値判定の基本手順は次である。

```text
1. 候補 r_i, r_j を受け取る
2. 目的 p を固定する
3. 構造特徴ベクトル phi_t(r_i), phi_t(r_j) を作る
4. 比較可能な識別特徴があるか確認する
5. 目的別重み w_p を選ぶ
6. 距離 d_{t,p}(r_i,r_j) を計算する
7. 証拠条件 EvidenceOK を確認する
8. 候補十分性 CandidateSufficient を確認する
9. 距離、比較可能性、証拠、候補十分性が通れば equivalent
10. 距離が閾値を超えれば distinct
11. 条件不足なら abstain
```

クラスタ化では、候補を追加する前に、その候補がクラスタ内の全候補と閾値内にあるか確認する。

```text
canJoinCluster(r, K)
  iff
  forall r' in K:
    d(r, r') <= epsilon
    and comparable(r, r') = true
    and evidenceOk(r, r') = true
```

この全対制約により、連鎖結合問題を抑制する。

---

## 6.18 実装フック

本章に対応する実装・検証フックは次である。

- 構造特徴ベクトル
- 目的別重み
- 距離成分
- 欠損処理
- 比較可能性ゲート
- 証拠ゲート
- 候補十分性ゲート
- 閾値付き同値判定
- 直径制約付きクラスタ
- 商写像
- エントロピー圧縮
- 文字列一致反例
- 文字列不一致反例
- 郵便番号一致反例
- 座標近接反例
- POI入口反例
- 推移的近接クラスタ反例

---

## 6.19 前半補強: 距離の局所性と比較不能性

本章の弱点は、構造距離を導入すると、住所同一性を一つの万能な距離で決められるように見える点である。AMTの距離は、目的、出典、地物型、比較可能性に依存する局所的な道具である。

距離関数を

\[
d_{t,p,\Omega}(r_i,r_j)
\]

と書く。ここで \(\Omega\) は比較文脈であり、地域、地物型、出典集合、公開政策、時間範囲を含む。

\[
\Omega=(a,k,E,\pi,\tau)
\]

したがって、同じ二つの候補でも、目的や文脈が変われば距離は変わる。

\[
d_{t,p_1,\Omega_1}(r_i,r_j)
\neq
d_{t,p_2,\Omega_2}(r_i,r_j)
\]

であり得る。

比較不能性を明示するために、距離は全域関数ではなく部分関数として扱う。

\[
d_{t,p,\Omega}:R_t\times R_t\rightharpoonup \mathbb{R}_{\ge0}
\]

もし比較条件が満たされないなら、

\[
d_{t,p,\Omega}(r_i,r_j)=\bot
\]

であり、距離が小さいとは言えない。

比較不能の代表例は次である。

| pair | reason |
| --- | --- |
| apartment unit vs building centroid | vertical layer missing |
| sea region vs port gate | different boundary/access type |
| cultural district vs postal code | semantic vs administrative compression |
| emergency shelter vs permanent residence | temporal scope mismatch |
| locker session vs physical address | application identifier boundary |

また、クラスタリングでは連鎖結合を防ぐ必要がある。

\[
r_1\sim r_2,\quad r_2\sim r_3
\centernot\Rightarrow
r_1\sim r_3
\]

AMTでは、クラスタ \(K\) に候補 \(r\) を追加する条件を全対制約にする。

\[
\forall r'\in K:
d(r,r')\le\epsilon
\land
\operatorname{Comparable}(r,r')=1
\land
\operatorname{EvidenceOK}(r,r')=1
\]

この補強により、第6章は「住所を距離で潰す」章ではなく、「距離を使ってよい場合と使ってはいけない場合を分ける」章になる。

---

## 6.20 非主張

本章は、構造距離が住所同一性を完全に解決すると主張しない。

\[
\neg
(
d_{t,p}(r_i,r_j)\le\epsilon_p
\Rightarrow
r_i=r_j
)
\]

本章は、座標距離、文字列距離、郵便番号距離、POI名のいずれか単独で十分と主張しない。

本章は、機械学習スコアだけでPIDを発行してよいとは主張しない。

本章は、同値類圧縮により必ず正解が得られるとは主張しない。

本章は、目的 \(p\) を無視した普遍距離を主張しない。

---

## 6.21 まとめ

本章では、候補集合の内部で候補同士を比較するための構造距離と住所同値類を定義した。

第5章が「真の対象を落とさないための候補生成」であるなら、本章は「候補同士を安全に比較するための距離、同値類、クラスタ、商写像」の章である。

本章の最重要式は次である。

\[
r_i\sim_{t,p,\epsilon}r_j
\iff
d_{t,p}(r_i,r_j)\le\epsilon_p
\land
\operatorname{Comparable}_t(r_i,r_j,p)=1
\land
\operatorname{EvidenceOK}_t(r_i,r_j,p)=1
\land
\operatorname{CandidateSufficient}_t(s,p)=1
\]

距離だけでは足りない。比較可能性、証拠条件、候補十分性が必要である。
