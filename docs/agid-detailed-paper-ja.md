# AGID: Address Grid Identifier

## 住所写像論に基づく公開地理識別子の数理・仕様・実装・検証

版: 日本語詳細論文ドラフト v0.1
日付: 2026-06-07
位置づけ: 住所写像論本体、AOID論文、零知識住所述語論文とは分離したAGID応用論文

## 要旨

AGID (Address Grid Identifier) は、住所写像論 (Address Morphism Theory, AMT) の意味論を基盤にしつつ、地球上の位置、公開住所、建物、公共地物、自然地理、文化地物を扱うための公開地理識別子である。AGIDの目的は、既存の住所制度、郵便制度、地籍制度、私的配送記録を置き換えることではない。AGIDは、座標と公開証拠から導かれる小さなグローバル格子セルに、公開可能な住所・建物・地物証拠を結びつけるための、決定的で移植可能な識別子である。

現行のAGIDコアは、WGS84風の緯度経度入力を単位球へ写し、cubed-sphere face を選択し、等面積風の tangent 補正を行い、各面を \(2^{21}\times 2^{21}\) 個のセルへ量子化する。その後、面内の \((q_x,q_y)\) を Hilbert 曲線で一次元化し、面番号と Hilbert 値を45 bitに詰め、10文字の曖昧性除去Base32 hashへ変換し、2文字の地域prefixを付ける。したがって、現行仕様のAGIDは12文字である。例えば、現行test vectorでは東京駅のサンプル座標は `JP05AV8TJGHD` になる。

本稿の中心主張は、AGIDを住所写像論そのものとして扱うのではなく、住所写像論の上に構築される公開地理参照レイヤーとして扱うべきだ、という点にある。AMTは住所表現、候補生成、クラスタ、unresolved、履歴、品質ゲート、PID発行を扱う。AGIDは公開地理セルと公開証拠を扱う。AOIDは受取人、部屋番号、電話番号、配送指示、所有者権限などの私的操作住所を扱う。零知識住所述語は、住所を秘匿したまま地域所属、配送可能性、居住、所有、監査通過などを証明する。これらを混同しないことが、AGIDを標準化し、オープンソース化し、配送・地図・災害支援・MCP・Agent連携へ拡張するための条件である。

## キーワード

AGID、Address Grid Identifier、住所写像論、公開地理識別子、グローバル格子、cubed sphere、Hilbert curve、住所証拠、地物証拠、自然地理、公開住所、AOID分離、オープンソース安全性。

## 1. はじめに

住所は、単なる座標ではない。住所は人間が読める言葉であり、行政、郵便、配送、土地利用、建物、社会的慣習、歴史、言語に支えられている。一方で、住所は均質ではない。ある国では郵便番号と番地が強く標準化されているが、別の地域では村名、道路名、島名、山名、橋、川、湖、ランドマーク、避難所、私書箱、宅配ロッカー、または口頭の慣習が重要になる。

ソフトウェアから見ると、普通の住所文字列には三つの問題がある。

第一に、住所文字列は曖昧である。同じ地名、同じ道路名、同じ建物名、同じ自然地物名が複数存在することがある。

第二に、住所文字列は変化する。行政変更、町名変更、再開発、建物改名、災害、道路整備、国境・領有権・自治制度の変化により、表記と実体の関係は時間とともに変わる。

第三に、住所文字列は私的情報を含みやすい。部屋番号、受取人、電話番号、配送指示、アクセスコードなどは、配送には必要でも公開識別子に含めるべきではない。

AGIDはこの問題に対して、公開可能な地理参照を与える。AGIDは「誰が住んでいるか」や「どう配送するか」を表すのではなく、「どこにある公開地理セルか」「そのセルにどのような公開住所・建物・地物証拠があるか」を扱う。

AGIDの基本的な流れは次のように表せる。

```text
座標または公開地物証拠
  -> AGIDコアによる決定的セル化
  -> 公開セル形状
  -> 公開住所・建物・地物証拠
  -> 品質・出典・鮮度の管理
```

同時に、AGIDは次の境界を守らなければならない。

```text
AGIDには、受取人、電話番号、部屋番号、個人宛配送指示、
アクセスコード、所有者秘密鍵、デバイス鍵、暗号化AOID本文を入れない。
```

この境界により、AGIDは公開標準として扱いやすくなる。SDK、API、QR、データパック、MCP、Agent、ロボット、地図アプリ、災害支援システムがAGIDを共有しても、それだけで個人の私的住所情報を漏らさない。

## 2. AGIDの位置づけ

AGIDは住所写像論の応用である。住所写像論そのものではない。

本システムでは、少なくとも四つの層を分ける必要がある。

```text
AMT  = 住所参照の意味論、候補生成、クラスタ、unresolved、履歴、PID発行
AGID = 公開地理セル、公開住所、公開建物、公開地物の参照
AOID = 所有者管理の私的操作住所、受取人、部屋番号、配送指示、権限
ZKP  = 住所を出さずに住所由来の属性だけを証明する秘匿証明層
```

AMTは、住所表現がどの実体を参照し得るかを扱う。候補が複数ある場合、どのようにクラスタ化し、どの時点でresolved、ambiguous、unresolved、rejectedとするかを定義する。PIDはAMTの意味論と監査ゲートを通過した後に発行される。

AGIDは、AMTが扱う住所意味論のうち、公開できる地理参照部分を実装するための識別子である。AGIDは座標セルを提供し、公開住所・公開建物・公開地物の証拠を結びつける。AGIDはPIDの代替ではない。AGIDはPID発行の補助証拠になり得るが、AMTの解決過程そのものを置き換えない。

AOIDは、AGIDとは逆に、私的配送・所有・更新・委譲・失効の層である。AOIDはAGIDに紐づくことができるが、AOID本文は公開AGIDデータパックや公開QRに入れてはならない。

ZKPは、住所そのものを公開せずに、住所由来の述語だけを証明する層である。例えば「日本在住」「東京都内」「配送可能地域内」「同一住所の居住者」「AOID所有者」「PID発行監査を通過した」などを証明する。しかし、その暗号学的soundness、zero-knowledge、issuer trust、revocation、freshnessは、AGIDではなく別論文の責務である。

## 3. 設計目標と非目標

AGIDの設計目標は次の通りである。

1. 決定性。固定された仕様・実装バージョンでは、同じ座標から同じセル状態とAGID hashが得られる。
2. 移植性。TypeScript、Rust/WASM、将来の各言語SDKで同じtest vectorを通過できる。
3. 公開性。AGIDそのものは秘密ではなく、公開QR、公開API、公開データパック、公開SDKで使える。
4. 公開地物対応。道路、橋、建物、公園、川、湖、島、山、砂漠、湿地、氷河、洞窟、谷、滝、遺跡、世界遺産など、公開証拠のある地物を住所的参照として扱える。
5. 不確実性の明示。AGIDが数学的に有効でも、住所が配送可能・公式・最新・法的に正確であるとは限らない。

一方で、AGIDには明確な非目標がある。

| 非目標 | 理由 |
| --- | --- |
| 郵便局・配送会社の完全な代替 | 配送可否は国、事業者、建物入口、受取条件に依存する。 |
| 居住証明・所有証明 | それはAOID、credential、ZKP、本人確認の領域である。 |
| 私的配送情報の格納 | 受取人、部屋、電話、アクセス指示はAGIDに入れない。 |
| 厳密な等面積セルの証明 | 現行実装は等面積風の補正を使うが、厳密性はGIS歪み検証が必要である。 |
| すべての住所の完全解決 | AMTはunresolvedやambiguousを正当な結果として持つ。 |
| 国境・領有権の法的証明 | prefixは表示・ルーティング・出典上のヒントであり、法的主張ではない。 |

この非目標を明記することは、AGID論文の品質を上げる。できないことを隠すと、AGIDは万能住所APIのように見えてしまう。正しくは、AGIDは公開地理参照を安定化する基盤であり、配送や本人確認や所有証明は別層で補う。

## 4. AGIDの数理モデル

### 4.1 入力空間

緯度を \(\varphi\)、経度を \(\lambda\) とする。入力空間を

\[
X=\{(\varphi,\lambda)\mid -90\leq \varphi\leq 90,\ -180\leq \lambda\leq 180\}
\]

とする。

実装では、経度を \([-180,180]\) に正規化して地域判定やantimeridian処理に使う。AGIDコアの数学は、WGS84風の緯度経度入力を球面モデルへ写す。ここで重要なのは、「WGS84風入力」と「厳密なWGS84楕円体幾何」を混同しないことである。現行AGIDのセル幾何は球面近似であり、楕円体測地線の厳密セルではない。

### 4.2 単位球への写像

度をラジアンへ変換する。

\[
\Phi=\varphi\frac{\pi}{180},\qquad
\Theta=\lambda\frac{\pi}{180}.
\]

単位球上の点を

\[
x=\cos\Phi\cos\Theta,\qquad
y=\cos\Phi\sin\Theta,\qquad
z=\sin\Phi
\]

とする。

さらに

\[
a_x=|x|,\qquad a_y=|y|,\qquad a_z=|z|
\]

とおく。

### 4.3 cubed-sphere face の選択

AGIDは球面を6つのcube faceへ写す。支配的な絶対軸を

\[
m=\max(a_x,a_y,a_z)
\]

とする。

現行実装のface規約は次の通りである。

| face | 支配軸 | 条件 | 局所raw座標 |
| --- | --- | --- | --- |
| 0 | \(+X\) | \(a_x\geq a_y,\ a_x\geq a_z,\ x>0\) | \((u_c,v_c)=(y,z)\) |
| 1 | \(-X\) | \(a_x\geq a_y,\ a_x\geq a_z,\ x\leq 0\) | \((u_c,v_c)=(-y,z)\) |
| 2 | \(+Y\) | \(a_y\geq a_x,\ a_y\geq a_z,\ y>0\) | \((u_c,v_c)=(-x,z)\) |
| 3 | \(-Y\) | \(a_y\geq a_x,\ a_y\geq a_z,\ y\leq 0\) | \((u_c,v_c)=(x,z)\) |
| 4 | \(+Z\) | \(a_z>a_x,\ a_z>a_y,\ z>0\) | \((u_c,v_c)=(-x,-y)\) |
| 5 | \(-Z\) | その他の負極側 | \((u_c,v_c)=(-x,y)\) |

局所face座標は

\[
\xi=\frac{u_c}{m},\qquad \eta=\frac{v_c}{m}
\]

である。face境界でtieが生じる場合も、実装の条件分岐順序により決定的に処理される。

### 4.4 等面積風tangent補正

現行AGIDコアは、次の補正対を用いる。

\[
E(t)=\tan\left(\frac{\pi t}{4}\right),
\qquad
E^{-1}(s)=\frac{4}{\pi}\arctan(s).
\]

encode時には

\[
u=\frac{E^{-1}(\xi)+1}{2},\qquad
v=\frac{E^{-1}(\eta)+1}{2}
\]

とする。

decode時には

\[
\xi=E(2q_x/K-1),\qquad
\eta=E(2q_y/K-1)
\]

を用いる。

この補正は、単純な緯度経度格子よりも極域・赤道・face分布の偏りを抑えるためのものである。ただし、本稿では「厳密な等面積が証明済み」とは書かない。正確には、現行実装は「等面積風tangent補正」または「near-uniform cubed-sphere grid」と表現するのが安全である。厳密な面積歪みについては、全球サンプリングによる面積・辺長・標準偏差・最大最小の検証が必要である。

### 4.5 量子化

現行定数は

\[
L=21,\qquad K=2^{21}=2,097,152,\qquad M=K-1=2,097,151
\]

である。

量子化は

\[
q_x=\operatorname{clamp}(\lfloor uK\rfloor,0,M),
\qquad
q_y=\operatorname{clamp}(\lfloor vK\rfloor,0,M)
\]

である。

各faceのセル数は

\[
K^2=(2^{21})^2=2^{42}
\]

である。全6faceでは

\[
6\cdot 2^{42}=26,388,279,017,472
\]

セルになる。

地球半径を \(R\approx 6,371,000\) m とすると、平均セル面積の目標値は

\[
\bar A=\frac{4\pi R^2}{6\cdot 2^{42}}
\]

であり、平均辺長の目安は

\[
\sqrt{\bar A}\approx 4.4\text{ m}
\]

である。この 4.4 m は平均目標であり、全セルが厳密に4.4 m四方であることを意味しない。

### 4.6 Hilbert曲線

face内の二次元量子化座標 \((q_x,q_y)\) を、次数 \(L=21\) のHilbert曲線により一次元値へ写す。

\[
h=H_L(q_x,q_y).
\]

逆変換は

\[
(q_x,q_y)=H_L^{-1}(h)
\]

である。

Hilbert値は \(2L=42\) bitを使う。Hilbert曲線を使う理由は、行優先順序よりも空間局所性を保ちやすいためである。将来的には近傍検索、range scan、cache grouping、地物証拠の近傍探索、配送エリア判定に有利になる。

### 4.7 bit packing

faceを \(f\in\{0,\dots,5\}\)、Hilbert値を \(h\in\{0,\dots,2^{42}-1\}\) とする。

AGIDのpacked値は

\[
p=(f\ll 42)\ |\ h
\]

である。

使用bitは

\[
\text{face}=3\text{ bit},\qquad
\text{Hilbert}=42\text{ bit},\qquad
\text{total}=45\text{ bit}
\]

である。

有効な最大packed値は

\[
p_{\max}=6\cdot 2^{42}-1
\]

であり、これは \(2^{45}-1\) より小さい。45 bitに入っていても、faceが6または7になる値はAGIDとして拒否される。

### 4.8 Base32 hash とAGID文字列

AGIDのBase32 alphabetは次である。

```text
0123456789ABCDEFGHJKMNPQRSTVWXYZ
```

これは `I`, `L`, `O`, `U` のような視認上紛らわしい文字を避ける。

packed値 \(p\) を10文字Base32へ写す。

\[
b=B_{32}^{10}(p).
\]

10文字Base32は50 bit分の表現容量を持つが、現行AGIDは45 bitを使用する。余った5 bitを任意データ領域として扱ってはならない。現行標準では予約領域であり、SDKは45 bit rangeとface rangeを検査する。

2文字prefixを \(r\) とすると、AGID文字列は

\[
\operatorname{AGID}=r\parallel b
\]

であり、

\[
|\operatorname{AGID}|=12
\]

である。

### 4.9 prefix model

prefixは座標hashとは分離された2文字の公開hintである。prefixはセル幾何のsource of truthではない。prefixは国、海、沿岸海域、特別地域、非ISO地域、fallback領域などの表示・ルーティング・出典管理に用いる。

現行の分類は次の通りである。

| 領域種別 | prefix形式 | 例 |
| --- | --- | --- |
| ISO alpha-2が使える陸域 | 英字 + 英字 | `JP`, `US` |
| 外洋 | 英字 + 数字 | 太平洋・大西洋などの大区分 |
| 沿岸海・名称付き海域 | 数字 + 英字 | 国コードとの衝突を避ける |
| その他fallback | 数字 + 数字 | 非ISO・未確定・特殊fallback |

海域prefixを英字2文字にしないことは重要である。英字2文字は国コードと衝突しやすい。AGIDは、海域、紛争地域、海外領土、自治領、無主地、特別地域などを扱うため、prefixを法的主張ではなく表示・出典・routing hintとして扱う。

## 5. 定義

**定義1 (AGID core encoding).**
\((\varphi,\lambda)\in X\) に対して、AGID core encodingを

\[
E_{\mathrm{AGID}}(\varphi,\lambda)
=(r,b,f,q_x,q_y,C)
\]

と定義する。ここで \(r\) は2文字prefix、\(b\) は10文字Base32 hash、\(f\) はcubed-sphere face、\((q_x,q_y)\) は量子化座標、\(C\) はセル形状である。

**定義2 (有効AGID文字列).**
文字列 \(s\) が有効AGIDであるとは、trimおよび大文字化の後に

```text
^[A-Z0-9]{2}[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{10}$
```

を満たし、かつhash部をdecodeしたpacked値のfaceが \(0,\dots,5\) に入ることをいう。

**定義3 (公開証拠 envelope).**
公開AGID証拠 envelope を

\[
\mathcal{E}_{pub}
=(\text{agid},\text{label},\text{featureType},\text{source},\text{confidence},\text{freshness},\text{license})
\]

とする。ここには受取人、電話番号、部屋番号、アクセスコード、私的配送指示、所有者鍵、デバイス鍵、暗号化AOID本文を入れてはならない。

**定義4 (AGID cell).**
AGID cell は

\[
(f,q_x,q_y),\quad
(f,q_x+1,q_y),\quad
(f,q_x+1,q_y+1),\quad
(f,q_x,q_y+1)
\]

を逆投影して得られる閉じた四辺形である。antimeridian付近では、描画上の線が世界全体を横断しないように、最初のcornerを基準として経度をshiftしてよい。

**定義5 (AGID public layer).**
AGID public layerとは、有効AGID文字列、セル形状、公開証拠 envelope、出典metadata、品質状態、SDK parity vector、OpenAPI契約、release artifactのうち、AGID security policyを満たすものの集合である。

## 6. 命題・定理

### 命題1: 固定core下の決定性

projection、face選択、補正関数、量子化定数、Hilbert実装、bit packing、Base32 alphabet、prefix policyが固定されていれば、\(E_{\mathrm{AGID}}\) は決定的である。

**証明略.**
各段階は前段階の出力に対する決定的関数である。決定的関数の合成は決定的である。したがって固定された仕様バージョンでは、入力座標から同じAGID core stateが得られる。

### 命題2: 有限セル容量

現行AGID coreは \(6\cdot 2^{42}\) 個のface-cell状態を持つ。

**証明.**
faceは6個である。各faceには \(K^2=(2^{21})^2=2^{42}\) 個のセルがある。よって全体は \(6\cdot 2^{42}\) 個である。

### 命題3: packed値の範囲

有効AGIDのpacked値 \(p\) は

\[
0\leq p<6\cdot 2^{42}<2^{45}
\]

を満たす。

**証明.**
有効face \(f\in\{0,\dots,5\}\) と \(0\leq h<2^{42}\) に対して

\[
p=f2^{42}+h\leq 5\cdot 2^{42}+(2^{42}-1)=6\cdot 2^{42}-1.
\]

したがって \(p<6\cdot 2^{42}\)。また \(6<8\) より \(6\cdot 2^{42}<8\cdot 2^{42}=2^{45}\) である。

### 命題4: decode domain safety

format、Base32 alphabet、packed値範囲、face範囲、finite coordinateを検査するdecoderは、malformedまたはover-rangeのAGIDを拒否できる。

**証明略.**
形式不正はregexで拒否される。AGID alphabet外の文字はhash decode前に拒否される。45 bit範囲外またはface 6/7はrange検査で拒否される。逆投影結果がfiniteでなければ拒否される。この検査は `src/lib/agidSecurity.ts` と `src/lib/agid.ts` の実装方針に対応している。

### 定理1: 条件付きセル整合性

encodeとdecodeが同一のprojection、量子化、Hilbert曲線、packing、Base32関数を用いるなら、encodeしたAGIDをdecodeすると、AGID hash構築に使われた \((f,q_x,q_y)\) cell stateが復元される。

**証明略.**
\((f,h)\) は有効範囲内で \(p=(f\ll 42)|h\) へ一意にpackingされる。Base32 encode/decodeは有効payload領域で逆写像である。Hilbert encode/decodeは \(K\times K\) 格子上で逆写像である。したがってdecodeは元の \(f,q_x,q_y\) を復元する。復元座標がセルcornerか代表点かは呼び出し側の扱いに依存するが、cell stateは保存される。

### 定理2: AGID非私的住所証明定理

AGID文字列だけでは、居住、所有、配送権限、受取人本人性、アクセス許可を証明できない。

**証明.**
AGIDは公開座標・公開格子・公開証拠から生成される。生成・decode・共有に所有者秘密鍵、credential、受取人witness、配送権限witnessを必要としない。したがってAGIDの所持や表示は私的住所関係の証明ではない。私的住所関係の証明にはAOID、credential、ZK companion protocolが必要である。

### 系1: AGIDは境界管理によりオープンソース安全になり得る

公開data pack、QR payload、SDK vector、OpenAPI example、release fixtureからAOID本文と私的配送情報を除外するなら、AGIDは識別子自体を秘密にせず公開標準として配布できる。

この系は、AGIDが私的住所証明ではないことと、公開payload境界を検査できることから従う。

## 7. 公開証拠モデル

AGIDは二つの成分を分離する。

```text
cell identity    = 座標hashとセル幾何
public semantics = 地域、住所、建物、地物、出典、confidence
```

座標hashは地域databaseがなくてもdecodeできる。一方、住所ラベル、建物名、道路名、湖名、遺跡名、行政名、郵便番号、配送可能性などはsource evidenceに依存する。

公開証拠sourceは次のようなtupleとして扱うとよい。

\[
S=(\text{authority},\text{provider},\text{url},\text{license},\text{jurisdiction},\text{freshness},\text{coverage},\text{allowedUse})
\]

AGIDが扱える公開証拠の例は次である。

- 公式郵便住所、住所台帳、行政住所
- 公開建物名、施設名、公共建築
- 道路、橋、トンネル、駅、港、空港
- 公園、広場、庭園、競技場
- 川、用水路、運河、湖、池、貯水池、湾、海岸、泉、礁、滝
- 島、群島、半島、岬、谷、山、火山、洞窟、氷河、氷原
- 砂漠、乾燥地、草原、森林、湿地、塩湖、湿原、荒野
- 遺跡、考古学的地点、寺社、記念碑、文化遺産、世界遺産
- 公開された避難所、仮設施設、物流拠点、研究基地

重要なのは、これらが「公開証拠」であることだ。公開建物名はAGIDに含められる。個人の部屋番号は含めない。川や島や山の名前は表示できる。そこに誰が住んでいるかは推測しない。

## 8. 住所品質と検証

AGIDが有効であることと、住所が有効であることは異なる。

AGIDは数学的に有効でも、住所証拠が弱い、古い、誤っている、配送できない、または地域制度と合わない場合がある。したがって、住所検証はAGIDの上にあるevidence layerとして扱う。

品質判定には次の情報を使える。

- 公式郵便番号metadata
- 郵便局・行政機関の公式APIまたは公開dataset
- OpenStreetMap、OpenAddresses、Overtureなどの公開地理dataset
- geocoder、reverse geocoder
- 建物footprint、入口、道路、到達可能性
- 自然地理・文化地物dataset
- ユーザー確認、管理者確認、配送履歴

品質状態は、ユーザーに「絶対スコア」として見せるよりも、内部制御に使うのがよい。

| 状態 | 意味 |
| --- | --- |
| `verified` | 公式または強い複数sourceで整合する。 |
| `geo-verified` | 座標・地理・地物は妥当だが、郵便配送までは保証しない。 |
| `partial` | 一部の住所要素はあるが深度やsource agreementが弱い。 |
| `no-postal-code` | 郵便番号が存在しない、または取得できない。 |
| `manual-required` | 自動解決せず、人間確認を求めるべきである。 |
| `unresolved` | AMT上の発行・登録・配送判断を保留する。 |

都市、田舎、島、山地、砂漠、湿地、氷原、水域、極地では、住所品質の意味が変わる。郵便番号がないから悪い住所とは限らない。逆に、郵便番号があるから正しい配送先とは限らない。

## 9. 自然地理・文化地物の住所性

AGIDは自然地理と文化地物を住所的参照として扱える。これは重要である。世界には、番地よりも「橋」「港」「湖畔」「滝」「山小屋」「島」「洞窟」「砂漠の基地」「湿地観測所」「遺跡」「世界遺産地区」の方が実用的な参照になる場所がある。

ただし、自然地物名はしばしば多義的である。

例えば「富士山」は、山頂、火口、五合目、登山口、山小屋、行政区域、観光地、保護区域を指す可能性がある。「Lake Victoria」は巨大な湖全体、湖岸都市、港、島、国境付近の水域を指し得る。「Sahara」は広大な地域であり、単独では配送地点ではない。

したがって、自然・文化地物は次のように扱う。

\[
\text{FeatureReference}
=(\text{name},\text{type},\text{geometry},\text{source},\text{granularity},\text{confidence})
\]

AGIDは、その地物を小さなセルまたはsource-backed polygonへ結びつける。しかし、「世界中のすべての島名・川名・遺跡名を完全認識済み」とは書かない。sourceが欠ける場合はconfidenceを下げ、manual-requiredやunresolvedを許す。

## 10. AGIDとAOIDの分離

AGIDとAOIDの差は、AGID論文で必ず明記する必要がある。

| 層 | 公開性 | 表すもの | 私的情報 | 更新権限 |
| --- | --- | --- | --- | --- |
| AGID | 公開 | 場所、セル、公開住所、建物、公開地物 | 含めない | 標準・仕様・公開source policy |
| AOID | 私的 | 所有者管理の操作住所、配送先、権限 | 含み得る | 所有者または委譲先 |
| PID | AMT本体 | 解決済み参照classの永続識別子 | 仕様次第 | AMT発行・監査規則 |

AGIDは共有、cache、公開QR、公開API、公開SDK vector、公開data packに使える。

AOIDはAGIDに紐づけられるが、AOID本文は公開しない。現行AOID実装では、AOID IDは9から16文字の曖昧性除去Base32であり、AGIDの10文字hash anchorを含めることができる。16文字すべて同じ文字のIDと、4文字連続の昇順・降順runは禁止される。これはAOIDの安全性と可読性のための規則であり、AGID本体の12文字形式を変更するものではない。

この分離により、公開位置IDがいつの間にか個人住所DBになることを防ぐ。

## 11. 通信・APIモデル

AGIDの通信面はpublic-safeでなければならない。

AGID APIやSDKで許されるpayloadは次である。

- AGID文字列
- セルboundsまたはpolygon
- 公開証拠lookupに必要な座標
- 国、海、地域code
- 公開住所label
- 公開建物名、公開place名、公開map feature名
- source、confidence、freshness、license
- 公開品質状態

AGID payloadに入れてはいけないものは次である。

- 受取人
- 電話番号
- 部屋、unit、floor
- access code
- 私的配送指示
- 私的所有証明
- owner key id
- device key id
- encrypted AOID payload

現行OpenAPIは `/api/v1` を基準とし、住所、郵便、geocoding、geography、credentials、proof、Polkadot、AMN、MCPなどのsurfaceを持つ。この事実は実装・統合面の主張であり、AGID数理定理ではない。論文では「integration contract」として扱う。

SDKの最小APIは次である。

```text
encode(latitude, longitude) -> AgidResult
decode(agid) -> AgidDecoded | null
cellBounds(agid) -> bounds
cellPolygon(agid) -> lon/lat polygon
```

SDKは、少なくとも `encode`, `decode`, `cellBounds` の共有parity vectorを通過しなければconformantとはいえない。

## 12. QRと公開payload security

AGID QRは、地図セル、公開住所、公開建物、公共施設、物流地点、自然地物、文化地物の共有に使える。しかしQRは私的情報混入のリスクが高い。

公開AGID QRに含めてよいものは次である。

- AGID
- 国codeまたは海域code
- 公開住所label
- 公開建物、道路、橋、公園、水域、自然地物、遺跡、世界遺産、ランドマーク、place label
- sourceとconfidence metadata

公開AGID QRに含めてはいけないものは次である。

- 受取人
- 電話番号
- unitまたはroom
- private delivery instruction
- access code
- private ownership proof
- owner key id
- device key id
- opaque encrypted AOID payload

QR readerは、payload作成時だけでなくparse時にも再sanitizationを行うべきである。悪意あるQRがpublicを名乗りつつprivate fieldを含む場合、そのfieldを拒否または除去する。

## 13. オープンソースrelease model

AGIDは、境界を守ればオープンソース標準に向いている。

release gateは次を含むべきである。

1. core contractが変わったらlanguage-neutral specを更新する。
2. 期待値が変わったらparity vectorを更新する。
3. SDK parity testを通す。
4. OpenAPIがpublic standard/security extension metadataを公開していることを確認する。
5. source metadataにURL、kind、licenseまたはtermsがあることを確認する。
6. public QR payloadがAOID private fieldを再混入できないことを確認する。
7. secret、API key、private token、owner key、private address fixtureがcommitされていないことを確認する。
8. spec、vector、OpenAPI artifact、SDK package、public data packにchecksumまたはdetached signatureを付ける。

基本原則は次である。

\[
\text{public identifier}+\text{public evidence}\neq \text{private address record}
\]

## 14. 例

### 14.1 東京駅

現行parity vector:

```text
input:  lat 35.681236, lon 139.767125
AGID:   JP05AV8TJGHD
prefix: JP
face:   1
qx:     111082
qy:     2056297
```

decode代表点は次である。

```text
lat 35.68121961131576
lon 139.76712226867676
```

この例は、公開ランドマークと公開座標から決定的AGIDが作られることを示す。東京駅に誰かが住んでいることや、誰かがそこで荷物を受け取れることは証明しない。

### 14.2 Null Island

現行parity vector:

```text
input:  lat 0, lon 0
AGID:   3B0200000000
prefix: 3B
face:   0
qx:     1048576
qy:     1048576
```

これは赤道・本初子午線・中心cellのテストに有用である。prefix `3B` は国コードではなくfallback形式の地域hintである。

### 14.3 New York City

現行parity vector:

```text
input:  lat 40.7128, lon -74.006
AGID:   US0ECWVG02V9
prefix: US
face:   3
qx:     1421263
qy:     2023382
```

これは通常の陸域prefixと都市座標の例である。

### 14.4 同一AGIDに複数の私的配送先がある場合

高層建物、集合住宅、駅ビル、商業施設、物流拠点では、同じAGID cellに複数の配送先が含まれ得る。この場合、公開AGIDだけでは配送に十分でない。

配送には、次が必要になることがある。

- 建物入口
- floor
- unit
- recipient
- phone
- access instruction
- delivery time window

これらはAOIDまたはprivate credentialの領域であり、AGIDの領域ではない。

### 14.5 自然地物

滝が公開名称とsource-backed geometryを持つ場合、AGIDはその滝の公開feature labelをセルまたはpolygonへ結びつけられる。しかし、「その滝」は郵便配送先ではないかもしれない。この場合、品質状態は `geo-verified` または `manual-required` が適切であり、`verified delivery address` と書くべきではない。

## 15. 実装対応

現行repositoryにおける対応関係は次である。

| 論文概念 | 実装・文書 |
| --- | --- |
| AGID core encode/decode | `src/lib/agid.ts` |
| AGID public security profile | `src/lib/agidSecurity.ts` |
| AGID/AOID layer boundary | `src/lib/addressIdentity.ts` |
| AOID private ID and encrypted sync policy | `src/lib/aoid.ts` |
| Public QR build/parse and sanitization | `src/lib/registeredAddressQr.ts` |
| OpenAPI v1 contract | `src/lib/openApiSpec.ts` |
| language-neutral standard | `sdk/agid-spec/agid-spec.json` |
| parity vectors | `sdk/agid-spec/test-vectors.json` |
| Rust/WASM acceleration core | `native/agid-core/src/lib.rs` |
| standard and conformance document | `docs/agid-standard.md` |
| security policy document | `docs/agid-security.md` |
| mathematical resume | `docs/agid-math-model-resume.md` |

文書があることと、機能が本番完成していることは同じではない。標準として主張するには、test vector、SDK parity、security test、source license、release gate、GIS検証が必要である。

## 16. 検証計画

AGID検証は四層に分ける。

### 16.1 形式検証

Leanなどの形式検証は、次を証明できる。

- 決定的関数合成
- 有限range
- lossy observation下の完全復元不可能性
- public identifierとprivate owner dataの分離
- AMT unresolved safety
- reference-preserving transformation下の同値類安定性

AGID専用には、決定性、有限容量、packed range、公開・私的境界をLean化できる。一方、実世界geodataの完全性はLean単独では証明できない。

### 16.2 SDK parity検証

SDK parityでは次を検証する。

- `encode` output
- `decode` output
- `cellBounds`
- `cellPolygon`
- Base32 alphabet
- face range
- over-range rejection
- antimeridian case
- pole-adjacent case
- land, sea, island, mountain, desert, urban sample

現行の最小vectorには東京駅、Null Island、New York Cityがある。これは最低限として有用だが、成熟した標準としては不足である。次のvector setには、antimeridian、極域、外洋、face edge、紛争・特殊地域、島、砂漠、自然地物を追加するべきである。

### 16.3 GIS・歪み検証

GIS検証では次を測る。

- cell area distribution
- edge length distribution
- face-edge continuity
- pole stability
- antimeridian rendering
- selected-cell polygon と rendered grid boundary の一致
- TypeScript core と Rust/WASM core の誤差

これは「等面積風」という表現を「厳密な等面積」と強めてよいか、あるいは弱めるべきかを判断するために必要である。

### 16.4 security/privacy検証

security検証では次を確認する。

- malformed AGID rejection
- over-range packed value rejection
- face 6/7 rejection
- public QR private-field rejection
- public data packにAOID private dataがないこと
- repositoryやfixtureにsecretがないこと
- OpenAPI public/private boundary metadata
- SDK artifact checksumまたはsignature

## 17. threat model

AGIDは公開識別子であるため、AGID文字列そのものの秘匿は資産ではない。守るべき資産は、整合性、公開・私的境界、source quality、誤解防止である。

| threat | failure mode | mitigation |
| --- | --- | --- |
| private-data contamination | 公開AGID payloadにroom、phone、recipient、access instructionが入る。 | forbidden field検査、QR parse sanitization、AOID分離。 |
| deliverability overclaim | 有効AGIDを配送会社確認済み住所と誤解する。 | 数学的有効性と配送検証状態を分ける。 |
| prefix misuse | prefixを領有権・法的国境証明と誤解する。 | prefixは表示・routing・source hintと明記する。 |
| source poisoning | 公開map sourceが古い、悪意ある、誤っている。 | source trust tier、freshness、多source検証、manual review。 |
| SDK divergence | 言語ごとに同じ座標から違うAGIDが出る。 | versioned specとparity vector。 |
| grid drift | UI gridとselected cellが別幾何から生成される。 | 量子化cell boundaryを同じsource of truthにする。 |
| linkability creep | AGIDとログを組み合わせて行動履歴を推測する。 | AGIDは公開位置、user activityとAOIDはprivateに保つ。 |
| false ownership | AGIDやpublic AOID referenceを所有証明と誤認する。 | 所有にはAOID credentialや別proofを要求する。 |

## 18. 住所圧縮としてのAGID

AGIDは住所圧縮方式の一つとして理解できる。普通住所、郵便番号、Plus Codes、geohash、AGID、AOID anchorは、いずれも空間・社会・配送に関する情報を短い記号へ圧縮する。

ただし、圧縮している対象が異なる。

| code | 圧縮するもの | 主な限界 |
| --- | --- | --- |
| 郵便番号 | 郵便配送区域・routing unit | 国ごとに制度が違い、点を表すとは限らない。 |
| 普通住所 | 社会的・行政的な場所記述 | 曖昧で、言語・制度・履歴に依存する。 |
| 座標 | 数値的位置 | 人間的意味や住所証拠を含まない。 |
| Plus Code/geohash | 空間格子 | 住所・建物・地物証拠の意味論は薄い。 |
| AGID | 公開格子セルと公開証拠envelope | 私的住所、所有、配送可否は証明しない。 |
| AOID | 所有者管理の私的住所関係 | 公開住所証拠ではない。 |

この観点は有用だが、「AGIDが住所エントロピーをゼロにする」と書いてはならない。AGIDは空間的不確実性を減らす。建物内、施設内、自然地物、同名地物、配送先単位の不確実性は残り得る。

## 19. governance model

AGID governanceが扱うのは公開標準であり、個人住所所有ではない。

標準・運営主体が管理できるものは次である。

- core version
- Base32 alphabet
- prefix policy
- reserved/deprecated ranges
- parity vectors
- source-pack conformance
- public evidence confidence policy
- OpenAPI and SDK conformance
- release integrity

標準・運営主体が勝手に管理すべきでないものは次である。

- AOID private payload
- recipient
- room
- phone
- owner secret
- private delivery instruction
- owner-controlled revocation contents

紛争地域や特別地域では、次を分ける。

```text
coordinate hash    = 数学的cell identity
region prefix/code = 表示・routing・source policy
legal sovereignty  = AGIDの証明範囲外
```

この分離により、AGIDが政治的・法的主張そのものになることを避ける。

## 20. 限界

AGIDの限界は明確に書くべきである。

1. AGIDは万能な郵便住所検証engineではない。
2. AGIDは居住、所有、本人性、配送権限を証明しない。
3. AGIDは私的配送情報を格納しない。
4. 現行平均セルサイズは約4.4 mだが、全球歪み検証は未完了である。
5. 一つのAGID cellに複数の実世界住所実体が含まれることがある。
6. region lookupはgeodataの品質とcoverageに依存する。
7. 自然・文化地物はsource-boundであり、多義性を持つ。
8. 公開証拠は古い、欠けている、またはpoisonedである可能性がある。
9. SDK parityはvector setとtest範囲に依存する。
10. オープンソース安全性は、一度の方針文書ではなく継続的な境界検査で維持される。

## 21. 今後の作業

AGIDを論文・標準として強くするには、次を優先する。

1. cubed-sphere tangent補正の全球distortion reportを作る。
2. antimeridian、極域、外洋、島、砂漠、山地、face edge、特殊地域のparity vectorを追加する。
3. 生成済みSDK全体のcross-language parity automationを整える。
4. AGID専用Lean moduleを作り、決定性、有限range、public-private separationを形式化する。
5. UNESCO、各国文化財、自然地物、研究基地などのlicense-compatible source governanceを整える。
6. 住所検証engineを商用APIと比較し、勝敗ではなく補完性と弱点を明確化する。
7. 国別・言語別・都市/田舎/島/自然地理別の内部品質評価を作る。
8. AGID/AOID/ZKPの統合例を、private data境界付きで示す。
9. release artifactにchecksumまたはdetached signatureを付ける。
10. 日本語版が安定した後に、国際論文版の英語AGID paperを作る。

## 22. 結論

AGIDは、狭く正確に書くほど強くなる。AGIDは公開地理・公開住所証拠の識別子であり、私的住所ではない。郵便局ではない。居住証明ではない。住所写像論そのものでもない。

AGIDの数理的核心は次である。

```text
lat/lon
  -> unit sphere
  -> cubed-sphere face
  -> tangent-corrected face coordinates
  -> 2^21 by 2^21 quantized cell
  -> Hilbert index
  -> 45-bit packed value
  -> 10-character Base32 hash
  -> 2-character prefix + hash
```

AGIDの実用的価値は、次の分離にある。

```text
AGID = public where / public feature evidence
AOID = private who / how delivery and authority
AMT  = semantic resolution and PID discipline
ZKP  = private proof of selected address-derived facts
```

この分離を守るなら、AGIDは公開空間意味論、SDK相互運用、物流、災害支援、地図地物住所、住所検証、MCP、買い物Agent連携の基盤になり得る。同時に、AGIDが個人住所情報を吸収してしまう危険を避けられる。

## 付録A. 正準アルゴリズム

```text
Input:
  latitude phi_deg
  longitude lambda_deg

Radians:
  phi = phi_deg * pi / 180
  theta = lambda_deg * pi / 180

Unit sphere:
  x = cos(phi) * cos(theta)
  y = cos(phi) * sin(theta)
  z = sin(phi)

Face selection:
  choose dominant axis among |x|, |y|, |z|
  assign face f and local raw coordinates (uc, vc)

Face-local:
  m = max(|x|, |y|, |z|)
  xi = uc / m
  eta = vc / m

Tangent correction:
  invE(t) = atan(t) * 4 / pi
  u = 0.5 * (invE(xi) + 1)
  v = 0.5 * (invE(eta) + 1)

Quantization:
  K = 2^21
  M = K - 1
  qx = clamp(floor(u * K), 0, M)
  qy = clamp(floor(v * K), 0, M)

Hilbert:
  h = Hilbert_21(qx, qy)

Packing:
  packed = (face << 42) | h

Base32:
  hash = base32_10(packed)

Prefix:
  prefix = regionPrefix(latitude, longitude)

Output:
  AGID = prefix + hash
```

## 付録B. 現行定数

| 定数 | 値 |
| --- | --- |
| prefix length | 2 |
| hash length | 10 |
| total AGID length | 12 |
| face count | 6 |
| face-axis bits | 21 |
| face-axis divisions | 2,097,152 |
| Hilbert bits | 42 |
| packed bits used | 45 |
| Base32 hash capacity | 50 bit |
| Base32 alphabet | `0123456789ABCDEFGHJKMNPQRSTVWXYZ` |
| average grid size target | 約4.4 m |

## 付録C. 採用可能な主張と保留すべき主張

| 主張 | 状態 | 根拠 |
| --- | --- | --- |
| AGIDは12文字の公開formatである。 | 採用可 | specと実装 |
| AGIDは2文字prefix + 10文字Base32 hashである。 | 採用可 | specと実装 |
| coreはcubed-sphere face選択を使う。 | 採用可 | TypeScript/Rust core |
| coreはface axisあたり \(2^{21}\) 分割を使う。 | 採用可 | specと実装 |
| coreはHilbert orderingを使う。 | 採用可 | TypeScript/Rust core |
| packed payloadは45 bitを使う。 | 採用可 | specと実装 |
| 平均解像度は約4.4 mである。 | 平均目標として採用可 | 数学推定とdocs |
| 厳密な等面積挙動が証明済みである。 | 主張不可 | GIS歪みreportが必要 |
| AGIDは配送可能性を証明する。 | 主張不可 | 郵便・配送会社・AOIDが必要 |
| AGIDは居住・所有を証明する。 | 偽 | AOID/credential/ZKPが必要 |
| 自然・文化地物を公開証拠にできる。 | source-boundとして採用可 | 実装testと設計docs |
| AGIDはオープンソース安全である。 | 条件付き | security boundaryとrelease gate |

## 付録D. AGID論文の最小定理一覧

1. 固定core下のAGID決定性。
2. AGID有限セル容量。
3. packed値範囲命題。
4. decode domain safety。
5. 条件付きセル整合性。
6. AGID非私的住所証明定理。
7. AGID/AOID分離による公開・私的境界保存。
8. 公開証拠品質はcell validityとは独立である。
9. 一つのAGID cellは一つの実世界住所実体を保証しない。
10. prefixは領有権・郵便当局性を証明しない。
