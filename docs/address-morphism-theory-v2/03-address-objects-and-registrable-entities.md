# 第3章 住所対象と登録可能実体

## 3.0 互換ノート

本章は、現行29章構成における第3章、第4章、第16章を保存しつつ、v2構成の第3章として再記述する。

本章で保存する主張は次の通りである。

- 住所は、文字列、座標、郵便番号、地図上の点そのものではなく、何らかの対象を参照するための表現である。
- 登録可能実体は、建物や土地だけではない。社会的実体、制度的実体、自然地理、文化地理、一時的実体、垂直区画、配送上の受渡点も含まれ得る。
- 表面住所表現は、参照対象そのものではなく、参照対象に関する観測である。
- 自然地理、文化地理、海域、島、山、砂漠、港、ロッカー、入口、階、部屋、避難所、仮設拠点は、通常住所と同じ写像理論の中に置ける。ただし、検証済み範囲は明示しなければならない。
- 私的な垂直属性や部屋番号等は、公開PIDへ不可逆に埋め込んではならない。

本章で導入する数理対象は、参照対象集合、登録可能実体集合、表面表現集合、観測写像、実体型、到達可能性、公開投影、私的属性分離である。

候補生成は第5章、構造距離と同値類は第6章、PID発行は第7章、履歴は第8章、自然・文化・垂直参照の応用展開は第10章、プライバシー境界は第11章で詳述する。

---

## 3.1 住所が指しているもの

住所写像論において最初に決めるべきことは、住所表現ではなく、住所が指している対象である。

多くの実装では、住所は文字列として扱われる。

```text
東京都千代田区丸の内1-1-1
1600 Pennsylvania Ave NW
10 Downing Street
```

しかし、これらの文字列が重要なのは、文字列そのものが価値を持つからではない。これらが、建物、敷地、入口、行政上の場所、配送先、権限のある受渡点、または社会的に共有された場所を指すからである。

AMTでは、住所を次のように扱う。

```text
住所 = 参照対象へ到達するための、文脈依存の表面表現
```

ここで重要なのは、住所が常に一つの物理点を指すわけではないことである。

ある住所は建物全体を指す。別の住所は入口を指す。別の住所は郵便受けを指す。別の住所は集合住宅の部屋を指す。別の住所はキャンパス、港湾区域、工場敷地、倉庫、配送ロッカー、ホテル、仮設避難所、島、海域、山岳区域、文化財、あるいは地域名を指す。

したがって、AMTの最小単位は文字列ではなく、参照対象である。

---

## 3.2 参照対象

時刻 \(t\) における参照対象の集合を次で表す。

\[
R_t
\]

\(r \in R_t\) は、住所表現、地名、座標、ID、証拠、履歴、到達可能性によって参照され得る対象である。

参照対象は、必ずしも永久不変ではない。建物は解体され、行政区画は変わり、地名は改称され、ホテル滞在は終了し、避難所は閉鎖され、ロッカー割当は期限切れになる。

そのため、参照対象は時間付きで扱う。

\[
r_t \in R_t
\]

同じ社会的対象が時間を通じて続いているかどうかは、第8章の履歴グラフと社会的連続性で扱う。本章ではまず、ある時点で何が登録可能な対象かを定義する。

---

## 3.3 登録可能実体

登録可能実体とは、住所写像論において、候補生成、同一性判定、PID発行、検証、または監査の対象となり得る実体である。

登録可能実体集合を次で表す。

\[
E_t \subseteq R_t
\]

すべての参照対象が直ちに登録可能であるわけではない。

例えば、利用者が任意に「いつもの角」と呼ぶ場所は参照対象にはなり得る。しかし、出典、境界、到達可能性、権限、用途が不足しているなら、AGIDやPIDの発行対象にはならない。

登録可能性は、次の条件に依存する。

- 参照対象として区別できること。
- 最低限の証拠集合を持つこと。
- 用途に対して十分な到達可能性または識別可能性を持つこと。
- 出典または観測履歴を説明できること。
- 公開してよい属性と非公開にすべき属性を分離できること。
- 失効、変更、統合、分割、削除、非推奨化を記録できること。

登録可能性を判定する述語を次で表す。

\[
\operatorname{Reg}_t(r, p) \in \{0,1,\bot\}
\]

ここで \(p\) は目的である。値 \(1\) は目的 \(p\) に対して登録可能、\(0\) は登録不能、\(\bot\) は証拠不足または判断保留を表す。

重要なのは、登録可能性が目的依存であることだ。

ある対象は、地図検索には登録可能でも、本人確認には不十分かもしれない。観光案内には登録可能でも、医薬品配送には不十分かもしれない。災害時避難所としては登録可能でも、恒久的な住居PIDとしては登録不能かもしれない。

したがって、登録可能性は絶対属性ではない。

---

## 3.4 実体型

AMTでは、登録可能実体を型付きで扱う。

実体型集合を次で表す。

\[
T_E
\]

実体型付け写像を次で表す。

\[
\tau_t : R_t \to 2^{T_E}
\]

一つの参照対象は複数の型を持ち得る。

例えば、港は自然地理に接続する海域境界であり、物流拠点であり、行政管理区域であり、配送受渡点でもある。ホテルは建物であり、宿泊施設であり、一時配送先であり、旅行者のチェックイン地点でもある。

最低限、AMT v2では次の実体型を置く。

| 型 | 意味 | 例 |
| --- | --- | --- |
| physical | 物理的実体 | 建物、敷地、入口、部屋 |
| administrative | 行政的実体 | 国、州、県、市区町村 |
| postal | 郵便・配送実体 | 郵便番号区域、配送区画、郵便受け |
| social | 社会的実体 | 通称地名、商店街、集落、キャンパス |
| institutional | 制度的実体 | 学校、病院、役所、会社拠点 |
| natural | 自然地理実体 | 島、山、川、湖、砂漠、海域 |
| cultural | 文化地理実体 | 遺跡、世界遺産、寺社、歴史地区 |
| vertical | 垂直参照実体 | 階、部屋、区画、屋上、地下 |
| temporary | 一時的実体 | 避難所、イベント会場、短期滞在先 |
| logistic | 物流実体 | ロッカー、PUDO、倉庫、配送拠点 |
| digital_twin | デジタル対応実体 | デジタルツイン上の対応区画 |

この型体系は、世界中の全地物を既に収録したという主張ではない。これは、住所写像論が扱える参照対象の型を明示し、実装時に不足型を追加できるようにするための最小分類である。

---

## 3.5 表面住所表現

表面住所表現集合を次で表す。

\[
S_t
\]

\(s \in S_t\) は、人間、組織、フォーム、配送会社、地図サービス、行政文書、ホテル、EC、物流システム、または自然言語入力が生成した住所らしい表現である。

表面表現は、次のような形を取り得る。

- 自然言語住所
- 郵便用住所
- 行政住所
- ローマ字表記
- 現地語表記
- 旧地名
- 略称
- 通称
- POI名
- 建物名
- フロア名
- 部屋番号
- 港湾名
- 島名
- 海域名
- 緯度経度付き記述
- 「駅の北口近く」のような相対記述
- 「ホテルフロント受取」のような機能的記述

AMTでは、表面表現を参照対象そのものとは見なさない。

表面表現は観測である。

観測写像を次で表す。

\[
O_t : S_t \to \mathcal{O}_t
\]

\(\mathcal{O}_t\) は、正規化、言語、出典、時刻、入力者、信頼度、構文分解結果、地理的手がかりなどを含む観測空間である。

このとき、表面表現 \(s\) は次の流れで扱われる。

```text
surface expression s
  -> observation O_t(s)
  -> candidate generation
  -> evidence evaluation
  -> structural comparison
  -> safe resolution or abstention
```

この設計により、文字列が似ていることと、同じ対象を指すことを分離できる。

---

## 3.6 表現と対象を分離する理由

表現と対象を分離しないと、次の誤りが起きる。

第一に、同じ対象を異なる表記で重複登録する。

```text
Tokyo-to Chiyoda-ku Marunouchi 1-1-1
東京都千代田区丸の内一丁目一番一号
東京都千代田区丸の内1-1-1
```

これらが同じ対象を指し得る場合でも、文字列だけを見れば別物に見える。

第二に、異なる対象を同じ表記として誤統合する。

同じ建物名、同じ町名、同じ郵便番号、同じ道路名、同じ施設名が複数地域に存在することは珍しくない。

第三に、座標だけで対象を誤る。

座標は建物中心を指すかもしれないが、配送入口、受付、車両搬入口、ロッカー、病院棟、ホテルフロント、港湾ゲート、キャンパス内建物を区別しないことがある。

第四に、社会的に有効な通称を無効扱いする。

住民、配送員、観光客、行政、店舗が使う通称は、公式住所ではなくても実際の到達性を支える場合がある。

第五に、私的属性を公開識別子へ混入させる。

部屋番号、病室、避難所滞在、ホテル滞在、個人宅の入口などを公開PIDに埋め込むと、住所識別が監視基盤へ変わり得る。

AMTでは、この五つを避けるため、表面表現、観測、候補、参照対象、PID、公開投影を分離する。

---

## 3.7 参照対象候補

表面表現 \(s\) は、直接一つの参照対象へ写るとは限らない。

候補生成関数を簡略に次で表す。

\[
\Gamma_t : S_t \times P \to 2^{R_t}
\]

\(\Gamma_t(s,p)\) は、目的 \(p\) に対して表面表現 \(s\) が指し得る参照対象候補の集合である。

本章で重要なのは、候補集合の要素が文字列ではなく参照対象である点である。

```text
候補 = 住所文字列の別表記
```

ではなく、

```text
候補 = 表面表現が指し得る登録可能実体または参照対象
```

である。

候補生成のリコールが不足すると、真の参照対象が候補集合に入らない。この場合、どれだけ後段のスコアリングが優秀でも正しい解決はできない。したがって、候補生成の十分性は第5章で明示的な仮定として扱う。

---

## 3.8 住所対象の階層性

住所対象はしばしば階層を持つ。

```text
国
  -> 都道府県・州
    -> 市区町村
      -> 町域
        -> 街区
          -> 建物
            -> 入口
              -> 階
                -> 部屋
```

しかし、この階層は世界共通ではない。

ある国では郵便番号が強く、別の国では弱い。ある地域では通り名が中心で、別の地域では行政区画名が中心になる。ある国では建物番号が強く、別の地域ではPOIやランドマークが重要になる。島しょ部、海域、山岳地帯、砂漠、非公式居住地、災害時避難所では、通常の階層が崩れる。

したがって、AMTでは住所対象を木だけでなくグラフとして扱う。

参照グラフを次で表す。

\[
G_t = (R_t, L_t)
\]

ここで \(L_t\) は、包含、隣接、到達、別名、履歴、行政所属、郵便所属、配送所属、文化的関連、自然地理的接続などの関係を表すエッジ集合である。

木構造は便利だが、十分ではない。住所参照は、行政木、道路ネットワーク、配送ネットワーク、社会的通称、履歴グラフ、自然地理グラフの重ね合わせである。

---

## 3.9 自然地理と文化地理

AMTは、住所制度が強い都市部だけを対象にしない。

住所が弱い地域、郵便番号がない地域、海域、島、山岳地帯、砂漠、湿地、氷河、洞窟、谷、遺跡、文化財、世界遺産、港湾、水域、国境地帯も、参照対象として扱う必要がある。

自然地理実体集合を次で表す。

\[
R_t^{nat} \subseteq R_t
\]

文化地理実体集合を次で表す。

\[
R_t^{cul} \subseteq R_t
\]

自然地理実体は、行政住所ではなく境界、代表点、範囲、隣接、到達経路、名称、国際的表記、出典によって参照されることが多い。

文化地理実体は、法的境界よりも歴史的名称、保護区域、施設名、観光名、地域共同体の認識によって参照されることがある。

したがって、これらの対象では、次の情報が重要になる。

- 多言語名称
- 旧名称・別名
- 境界または近似範囲
- 代表点
- 隣接地物
- 関連する行政区画
- 到達可能な道路、港、駅、ゲート
- 出典と信頼度
- 季節性または一時的閉鎖
- 災害、規制、私有地、保護区域等の制約

ただし、本章は「全世界の自然・文化地名を認識済み」と主張しない。ここで定義するのは、AMTがそれらを登録可能実体として扱える型と境界である。

---

## 3.10 垂直参照

現代の住所問題では、水平位置だけでなく垂直参照が重要である。

同じ緯度経度、同じ建物、同じ入口であっても、階、部屋、病棟、店舗区画、倉庫区画、ロッカー、屋上、地下、搬入口、受付が異なれば、配送、本人確認、施設管理、緊急対応の意味は変わる。

垂直参照実体集合を次で表す。

\[
R_t^{vert} \subseteq R_t
\]

垂直参照は、次のような対象を含む。

- 階
- 部屋
- 住戸
- 店舗区画
- 病室
- ホテル客室
- 倉庫棚
- ロッカー
- 屋上
- 地下階
- 搬入口
- 受付
- エレベーターホール
- セキュリティゲート後の区画

垂直参照の難しさは、到達可能性とプライバシーが強く絡む点にある。

配送会社には部屋番号が必要な場合がある。しかし、EC、広告事業者、分析事業者、公開地図、一般検索には不要である場合が多い。

したがって、AMTでは垂直属性を公開識別子へ直接埋め込まない。

公開投影を次で表す。

\[
\pi_{\mathrm{pub}} : R_t \to R_t^{pub}
\]

私的属性を含む内部参照を \(r\)、公開参照を \(\pi_{\mathrm{pub}}(r)\) とすると、次の安全要件を置く。

\[
\pi_{\mathrm{pub}}(r_1)=\pi_{\mathrm{pub}}(r_2)
\]

であっても、公開情報だけから私的垂直属性を復元できてはならない。

これは第11章の公開投影安全性、ZK境界、AMT Envelopeと接続する。

---

## 3.11 到達可能性としての住所対象

住所対象は、単に存在するだけではなく、目的に対して到達可能でなければならないことがある。

配送目的の到達可能性述語を次で表す。

\[
\operatorname{Reach}_t(r, a, p) \in \{0,1,\bot\}
\]

ここで \(r\) は参照対象、\(a\) は行為者またはサービス、\(p\) は目的である。

例えば、ある建物は地図上に存在しても、配送会社が入れない私有地内にあるかもしれない。ある島は存在しても、フェリー便が季節運休しているかもしれない。ある部屋は存在しても、医薬品配送には本人確認が必要かもしれない。ある避難所は存在しても、受入期間が終了しているかもしれない。

したがって、登録可能実体は単なる「存在」ではなく、目的別の到達可能性と結び付く。

```text
存在する
  != 配送できる
  != 本人確認に使える
  != 公開してよい
  != 永続PIDを発行してよい
```

AMTは、この差を明示的に扱う。

---

## 3.12 一時的実体

住所対象には、一時的なものがある。

例として、次がある。

- ホテル滞在先
- 旅行中の受取先
- 災害時避難所
- イベント会場
- 仮設店舗
- 工事現場
- 移動販売拠点
- 期間限定ロッカー
- 一時的な医療拠点
- 選挙投票所

一時的実体集合を次で表す。

\[
R_t^{temp} \subseteq R_t
\]

一時的実体には有効期間が必要である。

\[
\operatorname{validity}(r) = [t_{\mathrm{start}}, t_{\mathrm{end}}]
\]

時刻 \(t\) がこの区間外であれば、その参照対象は目的によって無効、非推奨、または履歴参照のみとなる。

一時的実体を扱わない住所体系では、旅行、災害、イベント、ホテル配送、法人受付、代理受取、ロッカー受取をうまく扱えない。

ただし、一時的実体に永続的な住居PIDを発行してはならない。必要なのは、目的と期限を持つ参照である。

---

## 3.13 社会的実体と制度的実体

住所参照には、社会的に共有された対象も含まれる。

例えば、商店街、大学キャンパス、工業団地、団地、港湾地区、旧町名、通称地名、観光地名、地域共同体名などである。

社会的実体集合を次で表す。

\[
R_t^{soc} \subseteq R_t
\]

制度的実体集合を次で表す。

\[
R_t^{inst} \subseteq R_t
\]

社会的実体は、厳密な法的境界を持たない場合がある。制度的実体は、組織や権限に基づく境界を持つ場合がある。

AMTでは、社会的実体を無制限の真理として扱わない。社会的連続性は証拠であり、同一性の決定そのものではない。

この方針により、通称や利用者投稿を活用しつつ、誤った統合、政治的主張、私的情報の露出を避ける。

---

## 3.14 登録可能性と公開可能性の分離

ある対象が登録可能であることと、公開可能であることは異なる。

登録可能性は、内部的に参照対象を扱えるかどうかである。

公開可能性は、その対象または属性を公開識別子、検索結果、地図、API、監査ログ、証明のpublic signalとして出してよいかどうかである。

公開可能性述語を次で表す。

\[
\operatorname{Pub}_t(r, x, p) \in \{0,1,\bot\}
\]

ここで \(x\) は属性、\(p\) は目的である。

例として、建物単位の参照は公開可能でも、部屋番号は非公開である場合がある。避難所の位置は公開可能でも、滞在者の存在は非公開である場合がある。配送会社には復号可能でも、ECには非開示である場合がある。

AMTでは、次の原則を置く。

```text
登録できることは、公開してよいことを意味しない。
```

この原則が、ZK住所証明、Address Credential、Address Login、配送会社限定復号、監査ログの設計と接続する。

---

## 3.15 住所対象の最小データ構造

AMTにおける参照対象は、最低限、次の構造を持つ。

```ts
type AddressReferent = {
  referentId?: string;
  type: string[];
  names: {
    value: string;
    language?: string;
    script?: string;
    status: "official" | "alias" | "historical" | "local" | "translated";
  }[];
  geometry?: {
    kind: "point" | "polygon" | "line" | "cell" | "unknown";
    precision: "exact" | "approximate" | "representative" | "withheld";
  };
  hierarchy?: {
    parentIds: string[];
    relation: "contains" | "belongs_to" | "serves" | "near" | "inside" | "unknown";
  }[];
  reachability?: {
    purpose: string;
    state: "reachable" | "restricted" | "unknown" | "not_reachable";
  }[];
  temporal?: {
    validFrom?: string;
    validTo?: string;
    status: "active" | "temporary" | "deprecated" | "historical";
  };
  privacy?: {
    publicProjection: string;
    privateAttributes: string[];
    disclosurePolicy: "public" | "restricted" | "carrier_only" | "proof_only";
  };
  evidence: {
    sourceId: string;
    confidence: number;
    observedAt?: string;
    licenseStatus: "allowed" | "restricted" | "unknown";
  }[];
};
```

これは本番スキーマではなく、理論上の最小構造である。

重要なのは、文字列、幾何、階層、到達可能性、時間、プライバシー、証拠を同じ参照対象の下に束ねることである。

---

## 3.16 反例の数理モデル

本章の反例は、単なる事例ではなく、住所対象を文字列、座標、公式住所、登録可能性、公開投影へ単純化したときに壊れる普遍命題として表す。

反例の共通形式は次である。

\[
\exists x :
A(x)=1 \land B(x)=0
\]

これは、普遍含意

\[
\forall x : A(x) \Rightarrow B(x)
\]

が成立しないことを示す。

ここで \(A\) は単純化された判定条件、\(B\) はその条件から導きたい結論である。AMTでは、これらの反例を使って、住所表現、参照対象、到達可能性、登録可能性、公開可能性を分離する。

### 反例3.1 同じ文字列、異なる対象

壊れる命題は次である。

\[
\forall s_1,s_2 \in S_t :
s_1=s_2 \Rightarrow \rho_t(s_1)=\rho_t(s_2)
\]

ここで \(\rho_t\) は表面住所表現から参照対象へ写す理想的な解決写像である。

反例は次のように置ける。

\[
s_1=s_2=\text{``Central Station''}
\]

\[
\rho_t(s_1)=r_A,\quad
\rho_t(s_2)=r_B,\quad
r_A \neq r_B
\]

ただし、\(r_A\) は都市Aの中央駅、\(r_B\) は都市Bの中央駅である。

したがって、

\[
s_1=s_2
\centernot\Rightarrow
\rho_t(s_1)=\rho_t(s_2)
\]

文字列一致は、参照対象一致の十分条件ではない。

### 反例3.2 同じ座標、異なる配送対象

壊れる命題は次である。

\[
\forall r_1,r_2 \in R_t :
\operatorname{coord}_t(r_1)=\operatorname{coord}_t(r_2)
\Rightarrow r_1=r_2
\]

反例として、同じ建物中心座標を共有する二つの配送対象を考える。

\[
\operatorname{coord}_t(r_1)=\operatorname{coord}_t(r_2)=c
\]

\[
r_1=\text{main entrance},\quad
r_2=\text{loading dock},\quad
r_1 \neq r_2
\]

このとき、

\[
\operatorname{coord}_t(r_1)=\operatorname{coord}_t(r_2)
\centernot\Rightarrow
r_1=r_2
\]

座標は強い証拠になり得るが、入口、階、部屋、搬入口、受付、ロッカー等を同一化するには不十分である。

### 反例3.3 公式住所なし、到達可能性あり

壊れる命題は次である。

\[
\forall r \in R_t :
\operatorname{OfficialAddress}_t(r)=0
\Rightarrow
\operatorname{Reach}_t(r,\operatorname{carrier},\operatorname{delivery})=0
\]

反例として、公式郵便住所を持たないが、港、道路、ランドマーク、AGIDセル、現地配送経路によって到達可能な島の診療所を考える。

\[
\operatorname{OfficialAddress}_t(r)=0
\]

\[
\operatorname{Reach}_t(r,\operatorname{carrier},\operatorname{delivery})=1
\]

したがって、

\[
\operatorname{OfficialAddress}_t(r)=0
\centernot\Rightarrow
\operatorname{Reach}_t(r,\operatorname{carrier},\operatorname{delivery})=0
\]

公式住所の不在は、配送不能を意味しない。住所が弱い地域では、POI、経路、セル、港、学校、病院、ロッカー、現地名が到達可能性の証拠になる。

### 反例3.4 公式住所あり、配送不能

壊れる命題は次である。

\[
\forall r \in R_t :
\operatorname{OfficialAddress}_t(r)=1
\Rightarrow
\operatorname{Reach}_t(r,\operatorname{carrier},\operatorname{delivery})=1
\]

反例として、公式住所を持つが、私有地、災害、軍事施設、危険区域、閉鎖区域、季節運休により配送できない対象を考える。

\[
\operatorname{OfficialAddress}_t(r)=1
\]

\[
\operatorname{Reach}_t(r,\operatorname{carrier},\operatorname{delivery})=0
\]

したがって、

\[
\operatorname{OfficialAddress}_t(r)=1
\centernot\Rightarrow
\operatorname{Reach}_t(r,\operatorname{carrier},\operatorname{delivery})=1
\]

公式住所の存在は、目的別到達可能性の十分条件ではない。

### 反例3.5 登録可能だが公開不可

壊れる命題は次である。

\[
\forall r \in R_t,\forall p \in P,\forall x :
\operatorname{Reg}_t(r,p)=1
\Rightarrow
\operatorname{Pub}_t(r,x,p)=1
\]

反例として、ホテル客室、病室、避難所滞在、個人宅の部屋番号を考える。

\[
\operatorname{Reg}_t(r,\operatorname{delivery})=1
\]

\[
x=\text{room number}
\]

\[
\operatorname{Pub}_t(r,x,\operatorname{delivery})=0
\]

したがって、

\[
\operatorname{Reg}_t(r,p)=1
\centernot\Rightarrow
\operatorname{Pub}_t(r,x,p)=1
\]

登録可能性は、公開可能性を含意しない。

### 反例3.6 公開投影は逆写像を持たない

壊れる命題は次である。

\[
\forall r_1,r_2 \in R_t :
\pi_{\mathrm{pub}}(r_1)=\pi_{\mathrm{pub}}(r_2)
\Rightarrow
r_1=r_2
\]

反例として、同じ集合住宅内の二つの住戸を考える。

\[
r_1=\text{unit 301},\quad
r_2=\text{unit 802},\quad
r_1 \neq r_2
\]

\[
\pi_{\mathrm{pub}}(r_1)=\pi_{\mathrm{pub}}(r_2)=\text{apartment building}
\]

したがって、

\[
\pi_{\mathrm{pub}}(r_1)=\pi_{\mathrm{pub}}(r_2)
\centernot\Rightarrow
r_1=r_2
\]

これは欠陥ではない。プライバシー保護のため、公開投影は意図的に多対一でなければならない場合がある。

---

## 3.17 本章の定義の数理モデル

**定義3.1 参照対象。**  
時刻 \(t\) において、住所表現、地名、座標、ID、証拠、履歴、到達可能性によって参照され得る対象を参照対象と呼び、その集合を \(R_t\) と書く。

\[
R_t =
\{ r \mid r \text{ is referable at time } t
\text{ by expression, evidence, geometry, history, or reachability} \}
\]

**定義3.2 登録可能実体。**  
参照対象 \(r \in R_t\) が、目的 \(p\) に対して候補生成、同一性判定、PID発行、検証、または監査の対象となり得るとき、\(r\) は目的 \(p\) に対して登録可能であるという。

\[
E_t(p)=
\{ r \in R_t \mid \operatorname{Reg}_t(r,p)=1 \}
\]

**定義3.3 表面住所表現。**  
人間またはシステムが、参照対象を指すために生成した文字列、記号列、地名、フォーム入力、または自然言語記述を表面住所表現と呼び、その集合を \(S_t\) と書く。

\[
S_t =
\{ s \mid s \text{ is an address-like expression produced at time } t \}
\]

**定義3.4 観測。**  
表面住所表現 \(s\) から得られる、言語、構文、出典、時刻、地理的手がかり、信頼度等を含む情報を観測と呼び、観測写像を \(O_t : S_t \to \mathcal{O}_t\) と書く。

\[
O_t : S_t \to \Omega_t
\]

\[
O_t(s)=
(\operatorname{lang}(s),\operatorname{script}(s),\operatorname{tokens}(s),
\operatorname{source}(s),\operatorname{time}(s),\operatorname{geoCue}(s),
\operatorname{confidence}(s))
\]

**定義3.5 公開投影。**  
参照対象から、公開してよい属性のみを残して得られる対象を公開投影と呼び、\(\pi_{\mathrm{pub}} : R_t \to R_t^{pub}\) と書く。

\[
\pi_{\mathrm{pub}} : R_t \to R_t^{pub}
\]

\[
\operatorname{PrivateAttr}(r)
\not\subseteq
\operatorname{Attr}(\pi_{\mathrm{pub}}(r))
\]

特に、垂直属性、部屋番号、病室、ホテル客室、避難所滞在などは、目的に応じて公開投影から除外される。

**定義3.6 目的別到達可能性。**  
参照対象 \(r\) が、行為者またはサービス \(a\)、目的 \(p\)、時刻 \(t\) において到達可能かを表す述語を \(\operatorname{Reach}_t(r,a,p)\) と書く。

\[
\operatorname{Reach}_t(r,a,p) \in \{0,1,\bot\}
\]

\(\bot\) は、到達可能とも不能とも判断できない証拠不足状態を表す。

**定義3.7 参照グラフ。**  
参照対象と、その間の関係を持つグラフを参照グラフと呼ぶ。

\[
G_t=(R_t,L_t)
\]

\[
L_t \subseteq
R_t \times
\{\operatorname{contains},\operatorname{adjacent},\operatorname{reachable},
\operatorname{alias},\operatorname{historical},\operatorname{postal},
\operatorname{administrative},\operatorname{cultural}\}
\times R_t
\]

---

## 3.18 命題の数理モデル

**命題3.1 表面表現非同一性。**  
表面住所表現の一致は、参照対象の一致を一般には含意しない。

\[
\neg
\left(
\forall s_1,s_2 \in S_t :
s_1=s_2 \Rightarrow \rho_t(s_1)=\rho_t(s_2)
\right)
\]

**証明スケッチ。**  
反例3.1により、前件 \(s_1=s_2\) は成立するが、後件 \(\rho_t(s_1)=\rho_t(s_2)\) は成立しない。したがって、文字列一致のみから参照対象一致は導けない。

**命題3.2 座標非同一性。**  
座標の一致または近接は、参照対象の一致を一般には含意しない。

\[
\neg
\left(
\forall r_1,r_2 \in R_t :
\operatorname{coord}_t(r_1)=\operatorname{coord}_t(r_2)
\Rightarrow r_1=r_2
\right)
\]

**証明スケッチ。**  
反例3.2により、同一座標を共有する二つの異なる配送対象が存在する。したがって、座標だけでは参照対象同一性を決定できない。

**命題3.3 登録可能性の目的依存性。**  
ある参照対象が目的 \(p_1\) に対して登録可能であっても、目的 \(p_2\) に対して登録可能とは限らない。

\[
\exists r \in R_t,\exists p_1,p_2 \in P :
\operatorname{Reg}_t(r,p_1)=1
\land
\operatorname{Reg}_t(r,p_2)\neq 1
\]

**証明スケッチ。**  
観光案内、配送、本人確認、法的通知では必要な証拠と到達可能性が異なる。したがって、同じ \(r\) でも目的 \(p\) によって \(\operatorname{Reg}_t(r,p)\) の値は変わり得る。

**命題3.4 公開可能性の非包含。**  
登録可能性は公開可能性を含意しない。

\[
\neg
\left(
\forall r \in R_t,\forall p \in P,\forall x :
\operatorname{Reg}_t(r,p)=1
\Rightarrow
\operatorname{Pub}_t(r,x,p)=1
\right)
\]

**証明スケッチ。**  
反例3.5により、内部配送目的では登録可能だが、部屋番号等の私的属性は公開不能である対象が存在する。したがって、登録可能であっても公開可能とは限らない。

**命題3.5 公開投影の多対一性。**  
公開投影は一般に単射ではない。

\[
\exists r_1,r_2 \in R_t :
r_1 \neq r_2
\land
\pi_{\mathrm{pub}}(r_1)=\pi_{\mathrm{pub}}(r_2)
\]

**証明スケッチ。**  
反例3.6により、同じ建物公開投影を持つ複数の私的住戸が存在し得る。これは情報欠落ではなく、私的垂直属性を公開しないための設計である。

**命題3.6 公式住所と到達可能性の独立性。**  
公式住所の有無は、配送到達可能性と同値ではない。

\[
\operatorname{OfficialAddress}_t(r)=1
\centernot\Leftrightarrow
\operatorname{Reach}_t(r,\operatorname{carrier},\operatorname{delivery})=1
\]

**証明スケッチ。**  
反例3.3は公式住所がなくても到達可能な対象を示し、反例3.4は公式住所があっても到達不能な対象を示す。したがって、公式住所と配送到達可能性は同値ではない。

---

## 3.19 実装フック

本章に対応する実装・検証フックは次の通りである。

- 登録可能実体タクソノミーfixture
- 国別・言語別の表面住所表現例
- 自然地理・文化地理・垂直参照の型fixture
- 住所対象の公開投影テスト
- 同一文字列・異対象の反例fixture
- 同一座標・異対象の反例fixture
- 公式住所と到達可能性の非同値fixture
- 登録可能性と公開可能性の分離fixture
- 公開投影の多対一性fixture
- 一時的実体の有効期限fixture
- 到達可能性と存在の分離テスト

これらは、第5章以降の候補生成、構造距離、PID発行、ZK境界、検証マップと接続する。

---

## 3.20 非主張の数理モデル

本章は、次を主張しない。

- 世界中の全地物、全住所、全自然地名、全文化地名を収録済みであるとは主張しない。
- すべての表面住所表現から真の参照対象を必ず生成できるとは主張しない。
- すべての自然地理・文化地理を通常住所と同じ精度で検証できるとは主張しない。
- 垂直属性や部屋番号を公開識別子へ埋め込むべきだとは主張しない。
- 社会的通称を公式住所より常に優先すべきだとは主張しない。
- 座標、郵便番号、行政区画、POI IDが不要だとは主張しない。

これらは、次の禁止された普遍命題として表せる。

**非主張3.1 全自然・文化地理完全収録ではない。**

\[
\neg
\left(
\forall x :
\operatorname{NamedPlace}(x)
\land
\operatorname{NaturalOrCultural}(x)
\Rightarrow
x \in R_t \land \operatorname{Verified}_t(x)=1
\right)
\]

**非主張3.2 完全候補生成ではない。**

\[
\neg
\left(
\forall s \in S_t,\forall p \in P :
\operatorname{TrueReferent}_t(s,p)
\in
\Gamma_t(s,p)
\right)
\]

候補生成の十分性は仮定または地域別検証対象であり、無条件の定理ではない。

**非主張3.3 自然・文化地理が通常住所と同じ精度で検証済みではない。**

\[
\neg
\left(
\forall r \in R_t^{nat} \cup R_t^{cul} :
\operatorname{Precision}_t(r)
=
\operatorname{Precision}_t(\operatorname{ordinaryStreetAddress})
\right)
\]

**非主張3.4 垂直属性を公開識別子へ含める理論ではない。**

\[
\neg
\left(
\forall r \in R_t^{vert} :
\operatorname{PrivateVerticalAttr}(r)
\subseteq
\operatorname{Attr}(\operatorname{PublicID}(r))
\right)
\]

**非主張3.5 社会的通称が常に公式出典に勝つわけではない。**

\[
\neg
\left(
\forall r \in R_t :
\operatorname{Score}_t(\operatorname{socialName},r)
>
\operatorname{Score}_t(\operatorname{officialSource},r)
\right)
\]

**非主張3.6 座標・郵便番号・行政区画・POI IDが不要という主張ではない。**

\[
\neg
\left(
\forall e :
e \in
\{\operatorname{coordinate},\operatorname{postcode},
\operatorname{administrativeCode},\operatorname{poiId}\}
\Rightarrow
\operatorname{UsefulEvidence}_t(e)=0
\right)
\]

本章の主張はより限定的である。

住所写像論では、住所を文字列ではなく参照対象への写像として扱う。そのために、登録可能実体、表面表現、観測、実体型、到達可能性、公開投影を分離する必要がある、という主張である。

---

## 3.21 前半補強: 登録可能性と住所化の境界

本章の弱点は、建物、部屋、入口、海域、島、山、文化地、ロッカー、避難所まで扱うことで、「何でも住所になる」と誤読される点である。AMTでは、対象を広げることと、無制限に住所化することを分離する。

登録可能性を次で定義する。

\[
\operatorname{Registrable}_{t,p}(r)
\iff
\operatorname{Referable}_t(r)
\land
\operatorname{EvidenceAdmissible}_{t,p}(r)
\land
\operatorname{PurposeMeaningful}_{p}(r)
\land
\operatorname{ProjectionSafe}_{t,p}(r)
\]

ここで、\(\operatorname{Referable}\) は何らかの表現で参照できること、\(\operatorname{PurposeMeaningful}\) は目的に対して意味があること、\(\operatorname{ProjectionSafe}\) は公開や利用が安全であることを意味する。

したがって、

\[
\operatorname{NameExists}(r)
\centernot\Rightarrow
\operatorname{Registrable}_{t,p}(r)
\]

である。

また、登録可能であっても公開可能とは限らない。

\[
\operatorname{Registrable}_{t,p}(r)
\centernot\Rightarrow
\operatorname{Publicable}_{t,p}(r)
\]

例えば、建物内の部屋、病室、避難者の一時滞在先、学校周辺の安全区域、軍事施設周辺の制限区域は、配送・緊急・監査の目的では参照対象になり得る。しかし、公開PIDに秘密属性を含めてよいわけではない。

本章で追加する境界表は次である。

| object | registrable? | publicable? | reason |
| --- | --- | --- | --- |
| building entrance | often yes | often yes | delivery and access |
| apartment unit | purpose-dependent | usually no | private vertical attribute |
| port gate | yes | limited | logistics access |
| sea region | limited | yes if boundary policy is clear | natural geography |
| cultural district | limited | policy-dependent | fuzzy/social boundary |
| emergency shelter | time-bounded | limited | temporal and privacy risk |
| locker session | application-level | no as PID | session identifier |
| person residence | evidence only | no by default | privacy and safety |

AMTの重要な境界は次である。

```text
referable
  != registrable
  != resolvable
  != publicable
  != deliverable
  != credentialed
```

この補強により、第3章は対象を広げる章であると同時に、住所化してはいけない対象を止める章にもなる。

---

## 3.22 まとめ

本章では、住所が指す対象を定義した。

住所は単なる文字列ではない。座標でも、郵便番号でも、フォーム入力でもない。住所は、ある目的のもとで、ある参照対象へ到達し、識別し、通信し、記録し、検証するための表面表現である。

AMTの第3章が導入した中心的な分離は次である。

```text
表面住所表現
  != 観測
  != 候補
  != 参照対象
  != PID
  != 公開可能情報
```

この分離によって、建物、部屋、入口、港、島、海域、山、文化地、ホテル、避難所、ロッカー、配送拠点を同じ理論の中で扱える。

同時に、AMTは検証済みでない対象を検証済みとは呼ばない。登録可能性、到達可能性、公開可能性を目的別に分け、不足がある場合は未解決、制限付き、または手動確認へ送る。

次章では、この対象体系の上に、公理、記法、安全な棄却、未解決状態を定義する。
