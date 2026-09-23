# 第10章 自然地理・文化地理・垂直参照・クロスドメイン参照

## 10.0 互換ノート

本章は、現行29章構成における第16章「自然地理・文化地理・垂直参照」、第24章「ケーススタディ」を保存し、v2構成の第10章として再記述する。

第3章は住所対象と登録可能実体を定義した。本章は、その対象範囲を、通常の街路住所や建物住所を越えて、海、島、山、砂漠、港、ロッカー、PUDO、階、入口、避難所、デジタルツイン、仮想空間上の対応先まで広げる。

本章の基本主張は次である。

- 住所写像論は、建物住所だけの理論ではない。
- 自然地理、文化地理、垂直空間、一時拠点、仮想拠点も、参照対象として扱える。
- ただし、これらをすべて「住所」と呼ぶのではなく、目的別の到達可能参照として扱う。
- 緯度経度は重要な証拠であるが、自然地理・文化地理・垂直参照の同一性を単独では決定しない。
- 海域、山岳、砂漠、島、港、災害避難所、ロッカーなどは、境界が曖昧、時間変化が大きい、目的依存性が強い。
- デジタルツインやXR上の住所は、物理実体との到達同値性を明示しなければならない。

本章の中心式は次である。

\[
X=(r,\operatorname{domain},B,Z,T,P,E)
\]

ここで、

- \(r\): 参照対象。
- \(\operatorname{domain}\): physical、natural、cultural、vertical、logistics、emergency、digital、hybrid などのドメイン。
- \(B\): 境界モデル。
- \(Z\): 垂直または層モデル。
- \(T\): 時間有効範囲。
- \(P\): 目的。
- \(E\): 証拠集合。

AMTは、通常住所を持たない対象を無理に通常住所へ押し込むのではなく、参照対象、境界、目的、証拠、時間、公開投影を分離して扱う。

---

## 10.1 なぜ通常住所だけでは足りないか

世界には、通常の「国、州、市区町村、道路、番地、建物、部屋番号」の階層で表せない参照対象が多い。

- 海域。
- 湾、海峡、港湾区域。
- 島、環礁、岩礁。
- 山、谷、砂漠、湖、川、氷河、洞窟。
- 文化地、遺跡、世界遺産、聖地、祭礼空間。
- 牧畜地、遊牧経路、季節的集落。
- 高層建物の階、地下街、駅構内、空港ゲート。
- ロッカー、PUDO、コンビニ受取、ホテルフロント。
- 災害避難所、仮設住宅、一時医療拠点。
- ドローン配送地点、ロボット配送地点。
- デジタルツイン、メタバース、XRイベント空間。

これらを既存住所の例外として処理すると、実装は壊れやすい。AMTでは、これらを cross-domain referent として扱う。

---

## 10.2 クロスドメイン参照対象

クロスドメイン参照対象を次で定義する。

\[
R^{X}_t
=
R^{\operatorname{admin}}_t
\cup
R^{\operatorname{natural}}_t
\cup
R^{\operatorname{cultural}}_t
\cup
R^{\operatorname{vertical}}_t
\cup
R^{\operatorname{logistics}}_t
\cup
R^{\operatorname{emergency}}_t
\cup
R^{\operatorname{digital}}_t
\]

通常住所は、この集合の一部にすぎない。

各参照対象 \(r\in R^X_t\) は、次の属性を持つ。

\[
\operatorname{DomainProfile}(r)
=
(
\operatorname{domain},
\operatorname{boundaryKind},
\operatorname{verticalKind},
\operatorname{temporalKind},
\operatorname{reachabilityKind},
\operatorname{privacyKind}
)
\]

例は次である。

| referent | domain | boundary | vertical | temporal | reachability |
| --- | --- | --- | --- | --- | --- |
| 海域 | natural | polygon / fuzzy region | none | stable-ish | maritime |
| 島 | natural / cultural | shoreline / admin / community | none | dynamic shoreline | ferry / air / boat |
| 港 | logistics / admin | facility polygon | gate / berth | operating hours | road / sea |
| ロッカー | logistics | point / facility | compartment | contract / session | carrier / user |
| 高層階 | vertical | building footprint | floor / unit | stable | elevator / stairs / access control |
| 避難所 | emergency | facility / temporary zone | room / tent | time-limited | emergency route |
| デジタルツイン | digital / hybrid | virtual geometry | layer | versioned | digital interaction |

---

## 10.3 境界モデル

境界は単一の多角形とは限らない。境界モデルを次で表す。

\[
B(r)
\in
\{
\operatorname{point},
\operatorname{polygon},
\operatorname{multipolygon},
\operatorname{polyline},
\operatorname{fuzzyRegion},
\operatorname{networkNode},
\operatorname{cellSet},
\operatorname{temporalZone},
\operatorname{unknown}
\}
\]

境界が unknown の場合、AMTは参照を禁止するのではなく、目的別に扱う。

\[
B(r)=\operatorname{unknown}
\Rightarrow
\rho_{t,p}(r)
\in
\{\bot_{\operatorname{unresolved}},\bot_{\operatorname{manual}},\operatorname{limited}\}
\]

海、砂漠、山、文化地、災害区域では、境界が法的、地理的、文化的、実務的に一致しないことがある。AMTでは、境界を一つに潰さず、境界種別を明示する。

---

## 10.4 緯度経度は証拠であって同一性ではない

緯度経度は強力な証拠である。しかし、緯度経度だけでは同一性を決められない。

\[
\operatorname{coord}(x)=\operatorname{coord}(y)
\centernot\Rightarrow
x=y
\]

理由は次である。

- 高層階では同じ水平座標に複数の到達対象がある。
- 地下街や駅構内では地上座標だけでは入口が決まらない。
- 港湾区域では同じ座標でもゲート、バース、倉庫、保安区域が異なる。
- 海域では境界が広く、点は海域全体を代表しない。
- 島では港、集落、行政区域、自然島、文化島の範囲が異なる。
- デジタルツインでは物理座標と仮想座標が一対一ではない。

したがって、座標は次のように扱う。

\[
\operatorname{coord}:R^X_t\rightharpoonup \mathbb{R}^2\cup\mathbb{R}^3
\]

\[
\operatorname{coord}(r)\subset E_t(r)
\]

座標は証拠集合の一部であり、参照対象そのものではない。

---

## 10.5 垂直参照

垂直参照は、地表面上の平面住所だけでは表せない参照である。

\[
Z(r)
=
(
\operatorname{floor},
\operatorname{unit},
\operatorname{entrance},
\operatorname{elevatorBank},
\operatorname{accessControl},
\operatorname{levelDatum}
)
\]

垂直参照には次の課題がある。

- 階番号が国・建物で異なる。
- 地下階、メザニン、屋上、連絡階がある。
- 同じ階に複数入口がある。
- 住所として公開してはいけない部屋番号がある。
- 配送可能入口と公的住所入口が違う。
- 高層ビル、病院、大学、空港、駅では内部ナビゲーションが必要。

AMTでは、垂直参照を公開PIDにそのまま入れない。

\[
\operatorname{PrivateVertical}(z)=1
\Rightarrow
z\notin\operatorname{PublicProjection}(r)
\]

必要な場合は、配送会社限定復号、ZK到達可能性証明、セッション限定トークン、建物内ルーティングIDとして扱う。

---

## 10.6 自然地理参照

自然地理参照は、行政住所体系に収まらない地物を扱う。

\[
R^{\operatorname{natural}}_t
=
\{\text{sea, bay, strait, island, mountain, desert, river, lake, glacier, cave, valley, wetland}\}
\]

自然地理では、次の証拠を組み合わせる。

- 地名。
- 多言語名。
- 旧名。
- 地形種別。
- 境界または代表点。
- 隣接地物。
- 所属海域、流域、山系、島嶼群。
- 近傍の港、道路、集落、POI。
- 行政上の関係。
- 季節変化、潮汐、氷河後退、水位変化。

自然地理の参照は、しばしば「最悪、緯度経度と地名だけでも役に立つ」。ただし、その場合は高精度住所として扱わず、低解像度参照として扱う。

\[
\operatorname{ResolutionLevel}(r)
\in
\{\operatorname{nameOnly},\operatorname{point},\operatorname{cell},\operatorname{region},\operatorname{routeReachable}\}
\]

---

## 10.7 文化地理参照

文化地理参照は、地理的境界だけでは定義しにくい。

\[
R^{\operatorname{cultural}}_t
=
\{\text{heritage site, sacred place, market, district, festival space, informal place, community name}\}
\]

文化地理では、社会的連続性、言語、慣習、利用実態、コミュニティ検証が重要になる。

ただし、文化的に呼ばれている範囲が、行政境界、所有権、配送可能範囲、公開してよい範囲と一致するとは限らない。

\[
\operatorname{CulturalName}(x)=\operatorname{CulturalName}(y)
\centernot\Rightarrow
\operatorname{AdminRegion}(x)=\operatorname{AdminRegion}(y)
\]

AMTは文化地理を「曖昧だから除外」しない。曖昧性を保存したまま、目的別の参照として扱う。

---

## 10.8 物流参照

物流参照は、配送・受取・引渡に特化した参照である。

\[
R^{\operatorname{logistics}}_t
=
\{\text{port, airport gate, warehouse, locker, PUDO, convenience pickup, loading dock, drone zone}\}
\]

物流参照では、通常住所より次の要素が重要になる。

- 到達可能入口。
- 搬入口。
- 営業時間。
- 車両制限。
- 受取権限。
- QRセッション。
- 署名済み引渡トークン。
- キャリア対応。
- 一時的な閉鎖。
- イベント混雑。

配送可能性を次で表す。

\[
\operatorname{Reachable}_{t,p}(r,c)
\in\{0,1,\operatorname{limited},\operatorname{unknown}\}
\]

ここで \(c\) は配送会社または移動主体である。

物流参照は、住所全文の代替ではなく、配送目的の参照である。ロッカーIDやQRセッションIDは、PIDではなく、目的別応用識別子である。

---

## 10.9 緊急時参照

災害時には、住所参照が急に変わる。

- 避難所。
- 仮設住宅。
- 臨時医療拠点。
- 道路閉鎖。
- 浸水区域。
- 火災区域。
- 立入禁止区域。
- 一時配送停止区域。

緊急時参照を次で表す。

\[
R^{\operatorname{emergency}}_{t_0,t_1}
\]

これは時間付き参照である。

\[
t\notin[t_0,t_1]
\Rightarrow
r\notin R^{\operatorname{emergency}}_{t}
\]

緊急時参照は、通常のPID発行に向かない場合が多い。代わりに、短期トークン、限定公開、監査ログ、多者承認、ZKまたは暗号化された到達可能性証明を使う。

---

## 10.10 デジタルツインとクロス現実参照

デジタルツインやXR空間では、物理空間と情報空間の対応が必要になる。

物理参照 \(r_p\) とデジタル参照 \(r_d\) の対応を次で表す。

\[
\Omega_t(r_p,r_d)
\in
\{\operatorname{equivalent},\operatorname{linked},\operatorname{representation},\operatorname{simulation},\operatorname{none}\}
\]

ここで重要なのは、デジタル表現が物理実体そのものではない点である。

\[
\Omega_t(r_p,r_d)=\operatorname{representation}
\centernot\Rightarrow
r_p=r_d
\]

デジタルツインの住所参照には、版、同期時刻、モデル所有者、物理対応の証拠、プライバシー境界が必要である。

---

## 10.11 到達同値性

通常の同一性ではなく、目的別の到達同値性を定義する。

\[
r_1\equiv^{\operatorname{reach}}_{t,p,c} r_2
\]

これは、時刻 \(t\)、目的 \(p\)、到達主体 \(c\) に対して、二つの参照が同じ到達結果を持つことを表す。

例として、建物の代表住所と配送入口は、本人確認では異なるが、ある配送会社の配送目的では到達同値かもしれない。

\[
r_{\operatorname{building}}
\equiv^{\operatorname{reach}}_{\operatorname{delivery},c}
r_{\operatorname{loadingDock}}
\]

しかし、

\[
r_{\operatorname{building}}
\not\equiv^{\operatorname{identity}}
r_{\operatorname{loadingDock}}
\]

である。

この分離により、AMTは「同じ場所か」ではなく「この目的で同じ参照として使えるか」を扱える。

---

## 10.12 クロスドメイン構造距離

第6章の構造距離を拡張し、クロスドメイン構造距離を定義する。

\[
d^X_{t,p}(x,y)
=
\alpha d_{\operatorname{admin}}
+\beta d_{\operatorname{geo}}
+\gamma d_{\operatorname{network}}
+\delta d_{\operatorname{vertical}}
+\eta d_{\operatorname{temporal}}
+\kappa d_{\operatorname{semantic}}
+\lambda d_{\operatorname{access}}
\]

ここで、

- \(d_{\operatorname{admin}}\): 行政階層差。
- \(d_{\operatorname{geo}}\): 空間境界・座標差。
- \(d_{\operatorname{network}}\): 道路、航路、フェリー、通路、POIグラフ上の距離。
- \(d_{\operatorname{vertical}}\): 階、入口、内部移動差。
- \(d_{\operatorname{temporal}}\): 有効期間差。
- \(d_{\operatorname{semantic}}\): 地物種別、文化名、用途の差。
- \(d_{\operatorname{access}}\): 権限、営業時間、配送可否の差。

通常住所では \(d_{\operatorname{admin}}\) と \(d_{\operatorname{geo}}\) が強く効くことが多い。ロッカー、港、避難所、海域、デジタルツインでは別の成分が重要になる。

---

## 10.13 公開投影

自然地理や文化地理は公開しやすいことが多い。しかし、垂直参照、物流参照、避難所、デジタルツインには秘密属性が含まれ得る。

公開投影を次で定義する。

\[
\pi^X_{\operatorname{public}}(r)
\]

公開投影は、参照対象の目的別に異なる。

```text
sea name                -> public
mountain name           -> public
port facility name      -> partially public
locker compartment      -> private/session scoped
hotel room              -> private
emergency shelter room  -> restricted
building floor route    -> restricted
digital twin unit       -> policy dependent
```

公開投影安全性を満たさない場合、AMTは公開PIDを発行してはならない。

\[
\operatorname{PublicProjectionSafe}^X(r,p)=0
\Rightarrow
\operatorname{PIDIssue}(r,p)=0
\]

---

## 10.14 国別Repo・海域Repo・地物Repoとの関係

AGIDの国別Repoや海域Repoは、本章の実装基盤になる。

```text
country repo
  -> administrative and postal referents

ocean / sea repo
  -> maritime referents

gazetteer repo
  -> natural and cultural names

POI graph
  -> logistics and reachability referents

vertical/local pack
  -> building and facility internal references
```

山や砂漠を必ず独立Repoにする必要はない。多くの場合、国別Repo、海域Repo、地名Repo、POIグラフ内に地物として収録すればよい。

ただし、海域は広域で国境をまたぐため、大洋・海・湾・海峡のように分割Repo化する価値がある。海域参照は、住所というより地理グラフの上位層として扱う。

---

## 10.15 ケーススタディ

### 10.15.1 郵便番号なし島しょ部

郵便番号がない島しょ部では、次の候補層を使う。

```text
island name
settlement name
port / pier
POI
cell
route
carrier reachability
```

この場合、住所参照は「郵便番号」ではなく、「島 + 集落 + 港 + 到達経路 + 目的別配送可否」として成立する。

### 10.15.2 港湾配送

港湾では、住所文字列よりゲート、バース、倉庫、保安区域、車両権限が重要になる。

\[
\operatorname{Reachable}(r,\operatorname{carrier})
\]

が通常住所より強い判断材料になる。

### 10.15.3 高層ビル

高層ビルでは、同じ緯度経度と建物名でも、階、入口、エレベーターバンク、セキュリティ、搬入口が異なる。

公開PIDには建物までを載せ、部屋番号や内部経路は秘密または配送会社限定にする。

### 10.15.4 災害避難所

避難所は時間付き参照である。平時の学校や体育館が、災害時には避難所になる。

\[
\operatorname{School}(r,t_0)
\to
\operatorname{EmergencyShelter}(r,t_1,t_2)
\]

これは同一物理施設でも目的別参照が変わる例である。

### 10.15.5 デジタルツイン

デジタルツインでは、物理施設と仮想モデルの版がずれることがある。AMTは、デジタル参照を物理参照と同一視せず、対応関係として扱う。

---

## 10.16 反例

### 反例10.1 座標一致は垂直同一性を含意しない

\[
\operatorname{coord}(x)=\operatorname{coord}(y)
\centernot\Rightarrow
x=y
\]

同じ平面座標に複数階、複数部屋、複数施設が存在する。

### 反例10.2 海域名は境界を一意にしない

\[
\operatorname{Name}(x)=\text{``Pacific Ocean''}
\centernot\Rightarrow
B(x)=B_{\operatorname{unique}}
\]

海域境界は、地理、国際機関、教育地図、EEZ、航行目的で異なる。

### 反例10.3 文化名は行政境界ではない

\[
\operatorname{CulturalName}(x)=\operatorname{CulturalName}(y)
\centernot\Rightarrow
\operatorname{AdminRegion}(x)=\operatorname{AdminRegion}(y)
\]

通称地域、商店街、歴史地区は行政境界と一致しない。

### 反例10.4 配送可能性は居住性を含意しない

\[
\operatorname{Reachable}_{delivery}(r)=1
\centernot\Rightarrow
\operatorname{Residence}(r)=1
\]

ロッカー、港、ホテル、職場、避難所、コンビニ受取は配送可能でも居住地ではない。

### 反例10.5 デジタルツインは物理実体ではない

\[
\Omega_t(r_p,r_d)=\operatorname{representation}
\centernot\Rightarrow
r_p=r_d
\]

デジタルモデルは版、同期遅延、抽象化、権限により物理実体とずれる。

---

## 10.17 命題と定理

**命題10.1 クロスドメイン参照は通常住所を含む。**

\[
R^{\operatorname{admin}}_t\subset R^X_t
\]

通常住所はクロスドメイン参照の一部である。

**命題10.2 座標は証拠であり同一性ではない。**

\[
\operatorname{coord}(r)\in E_t(r)
\]

しかし、

\[
\operatorname{coord}(x)=\operatorname{coord}(y)
\centernot\Rightarrow
x=y
\]

**命題10.3 到達同値性は目的相対的である。**

\[
r_1\equiv^{\operatorname{reach}}_{t,p,c}r_2
\centernot\Rightarrow
r_1\equiv^{\operatorname{identity}}r_2
\]

**定理10.1 垂直非可逆公開原則。**  
垂直参照が秘密属性を含む場合、その垂直情報を公開PIDへ非可逆に投影しなければならない。

\[
\operatorname{PrivateVertical}(z)=1
\Rightarrow
z\notin\pi^X_{\operatorname{public}}(r)
\]

**定理10.2 クロスドメイン安全解決条件。**  
クロスドメイン参照を解決するには、少なくとも境界、時間、目的、到達可能性、公開投影が目的に対して許容されなければならない。

\[
\operatorname{Resolve}^X_{t,p}(r)=1
\Rightarrow
\operatorname{BoundaryOK}
\land
\operatorname{TemporalOK}
\land
\operatorname{PurposeOK}
\land
\operatorname{ReachabilityOK}
\land
\operatorname{PublicProjectionSafe}
\]

**定理10.3 デジタル表現非同一性。**  
デジタル参照が物理参照を表現していても、それだけで同一性は成立しない。

\[
\Omega_t(r_p,r_d)=\operatorname{representation}
\centernot\Rightarrow
r_p=r_d
\]

---

## 10.18 実装アルゴリズム

クロスドメイン参照の基本手順は次である。

```text
1. 入力表現を受け取る
2. domain を推定する
3. boundaryKind を推定または未解決にする
4. verticalKind を確認する
5. temporalKind を確認する
6. reachabilityKind を目的別に評価する
7. privacyKind と public projection を評価する
8. 通常住所へ無理に変換せず、cross-domain referent として候補化する
9. 第6章の構造距離または cross-domain distance を計算する
10. 第7章の安全解決へ渡す
11. 必要なら第11章の暗号・ZK・監査境界へ渡す
```

擬似コードは次である。

```text
classifyCrossDomainReferent(input):
  domain = inferDomain(input)
  boundary = inferBoundary(input)
  vertical = inferVertical(input)
  temporal = inferTemporal(input)
  reachability = evaluateReachability(input, purpose)
  privacy = evaluatePublicProjection(input)

  if privacy.publicProjectionSafe == false:
    return candidate(blocked_public_pid, proofOnlyOrEncrypted = true)

  if boundary.unknown and purpose.requiresPreciseBoundary:
    return candidate(unresolved, reason = boundary-required)

  return candidate(cross_domain_referent)
```

---

## 10.19 実装フック

本章に対応する実装・検証フックは次である。

- cross-domain referent schema
- domain classifier fixture
- boundary kind matrix
- vertical privacy fixture
- reachability equivalence fixture
- natural geography name-only fixture
- maritime region fixture
- island/port route fixture
- locker/PUDO fixture
- emergency time-bounded fixture
- digital twin correspondence fixture
- coordinate non-identity counterexample
- cultural name non-admin counterexample
- public projection safety test

最低限のfixtureは次である。

| fixture | expected result | purpose |
| --- | --- | --- |
| sea-name-region | limited region reference | 海域 |
| island-port-route | route-reachable reference | 島しょ部 |
| high-rise-same-coordinate | distinct vertical references | 垂直参照 |
| locker-session | application identifier, not PID | 物流 |
| emergency-shelter-timebox | time-bounded referent | 災害 |
| cultural-district | fuzzy cultural boundary | 文化地理 |
| digital-twin-link | representation, not identity | XR |
| private-floor-public-projection | public PID blocked | プライバシー |

---

## 10.20 後半補強: 境界不確実性と到達同値性

本章の弱点は、自然地理、文化地理、垂直参照、物流参照、災害参照を列挙だけで終えると、通常住所の例外集に見えてしまう点である。AMTでは、これらを例外ではなく、境界不確実性、到達可能性、時間、公開可能性を持つ参照対象として統一する。

クロスドメイン参照対象を次で表す。

\[
r=(D,B,V,T,A,\rho,E,\pi)
\]

ここで、\(D\) はドメイン、\(B\) は境界表現、\(V\) は垂直層、\(T\) は時間範囲、\(A\) はアクセス経路、\(\rho\) は到達関係、\(E\) は証拠、\(\pi\) は公開投影政策である。

通常住所と異なる点は、境界 \(B\) が必ずしも一点や行政ポリゴンではないことである。

| domain | likely boundary |
| --- | --- |
| ocean/sea | fuzzyRegion, multipolygon, treaty-dependent |
| island | polygon plus port/route evidence |
| desert/mountain | fuzzyRegion plus named-feature evidence |
| cultural district | semantic region plus local usage evidence |
| vertical unit | internal route and restricted unit |
| locker/PUDO | networkNode plus session |
| emergency shelter | temporalZone plus authority/event evidence |
| digital twin | representation link plus version |

到達同値性を次で定義する。

\[
r_1 \equiv_{\mathrm{reach},p,t} r_2
\iff
\operatorname{Reach}(r_1,p,t)=\operatorname{Reach}(r_2,p,t)
\land
\operatorname{AccessPolicy}(r_1,p,t)=\operatorname{AccessPolicy}(r_2,p,t)
\]

これは同一性ではない。配送目的では同じ入口に到達できる二つの表現が同値でも、所有権、居住性、公的住所、本人性では同値でない。

境界不確実性は次で測る。

\[
U_B(r)=
w_g U_{\mathrm{geo}}(B)
+w_s U_{\mathrm{source}}(E)
+w_t U_{\mathrm{temporal}}(T)
+w_p U_{\mathrm{policy}}(\pi)
\]

境界不確実性が高い場合、

\[
U_B(r)>\theta_B
\Rightarrow
\operatorname{state}(r)\in\{\mathrm{limited},\mathrm{manualReview},\mathrm{unresolved}\}
\]

とする。

本章の追加反例は次である。

| counterexample | rejected claim |
| --- | --- |
| same coordinate, different floors | coordinate implies same referent |
| same island name, different port reachability | name implies delivery equivalence |
| same cultural district, changing local usage | cultural name has fixed boundary |
| same emergency shelter, expired event window | emergency reference is permanent |
| same digital twin object, stale version | digital representation equals physical state |
| same sea name, different boundary policies | sea name has single global polygon |

この補強により、第10章は「住所ではないものも入れる」章ではなく、「住所的に使われる参照対象を、目的・境界・到達・時間・公開可能性で統一する」章になる。

---

## 10.21 非主張

本章は、全世界の全自然地理・文化地理名を認識済みであるとは主張しない。

本章は、緯度経度が参照対象の同一性を完全に決定すると主張しない。

本章は、海域境界、文化地理境界、災害区域境界が一意に定まると主張しない。

本章は、配送可能性が居住性、公的住所、所有権、本人性を含意すると主張しない。

本章は、デジタルツインやXR空間が物理空間と完全同期していると主張しない。

本章は、垂直参照の秘密属性を公開PIDへ入れるべきだとは主張しない。

---

## 10.22 まとめ

本章では、通常住所を越える参照対象を、自然地理、文化地理、垂直参照、物流参照、緊急時参照、デジタル参照として整理し、クロスドメイン参照モデルを定義した。

第3章が「何が住所対象か」を定義したなら、本章は「住所対象が通常住所の外へ広がったとき、どのように安全に扱うか」を定義する。

本章の最重要分離は次である。

```text
coordinate
  != identity
  != reachability
  != public PID
```

そして、本章の中核は次である。

```text
Cross-domain referent
  = domain + boundary + vertical layer + time + purpose + evidence + privacy projection
```

住所写像論は、都市の建物住所だけでなく、海、島、港、山、砂漠、文化地、避難所、ロッカー、デジタルツインを、例外ではなく同じ参照理論の中で扱う。
