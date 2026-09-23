# AGID郵便区画コード設計エンジン v0.1

この文書は、郵便番号が存在しない、または郵便番号・郵便データの機能が弱い国・地域に限って、AGIDを補助的な郵便区画コードとして設計するための仕様メモである。

重要な前提として、AGID郵便区画コードは公式郵便番号の置換ではない。公式郵便番号が十分に機能する国でも、国土・人口・地形・行政階層・既存郵便番号が採用されている理由は事前学習する。ただし、その学習結果は住所表示、逆ジオコーディング、品質判定、既存制度との互換性確認の内部ベースラインに限定し、利用者向け郵便番号を自作しない。

## 1. 対象国分類

国・地域は次の3分類に分ける。

| Class | 意味 | AGID郵便区画生成 |
| --- | --- | --- |
| A | 郵便番号あり・公式APIまたは信頼できる機械可読データがある | 原則禁止。ただし国土・人口・地形・既存制度理由は内部学習する |
| B | 郵便番号はあるが、API・公式データ・配送検証の機能が弱い | 補助コードとして許可 |
| C | 郵便番号なし、またはUPU資料上でpostal codeを要求しない国・地域 | 主コード候補として許可 |

実装では `src/lib/agidPostalCodeEngine.ts` の `classifyAgidPostalCountries()` がこの分類を返す。

## 2. C分類の初期対象リスト

現時点のC分類初期リストは、ユーザー提供のUPU 2025「postal codesを要求しない国・地域」リストをもとにする。これは「郵便番号が絶対に存在しない」とは同義ではない。一部地域・民間配送・P.O. Box・建物住所体系が使われる可能性があるため、実装上は `postal-code-not-required` の根拠として扱う。

| Code | Country / Territory |
| --- | --- |
| AO | Angola |
| AG | Antigua and Barbuda |
| AW | Aruba |
| BS | Bahamas |
| BZ | Belize |
| BJ | Benin |
| BO | Bolivia |
| BW | Botswana |
| BF | Burkina Faso |
| BI | Burundi |
| CM | Cameroon |
| CF | Central African Republic |
| TD | Chad |
| KM | Comoros |
| CG | Congo (Republic) |
| CK | Cook Islands |
| CI | Cote d'Ivoire |
| CW | Curacao |
| DM | Dominica |
| GQ | Equatorial Guinea |
| ER | Eritrea |
| FJ | Fiji |
| GA | Gabon |
| GM | Gambia |
| GD | Grenada |
| JM | Jamaica |
| KP | Korea (Democratic People's Republic) |
| LY | Libya |
| ML | Mali |
| MR | Mauritania |
| QA | Qatar |
| RW | Rwanda |
| ST | Sao Tome and Principe |
| SC | Seychelles |
| SL | Sierra Leone |
| SX | Sint Maarten |
| SB | Solomon Islands |
| SO | Somalia |
| SS | South Sudan |
| SR | Suriname |
| SY | Syria |
| TG | Togo |
| TK | Tokelau |
| TO | Tonga |
| TV | Tuvalu |
| AE | United Arab Emirates |
| VU | Vanuatu |
| YE | Yemen |
| ZW | Zimbabwe |

## 3. B分類の作り方

B分類は固定リストにしすぎない。各国の住所フォーマット、郵便番号API、公式郵便ソース、オープンデータIDを読み、`postal-weak-api` と判定された国をBに入れる。

再生成コマンド:

```bash
npm run report:agid-postal-engine
```

出力:

```text
test-results/agid-postal-code-engine.json
```

このレポートには Class A/B/C、AGID郵便区画生成の eligible/blocked、国コード一覧、判定理由が含まれる。

## 4. 生成ルール

AGID郵便区画コード生成では次を守る。

1. Class Aでは生成しない。
2. Class Bでは既存郵便番号を主とし、AGIDコードは補助候補に限定する。
3. Class CではAGIDコードを主コード候補として使える。
4. 選択国コードとAGID接頭辞が一致しない場合は生成しない。
5. AGID本体は内部キーとして保持し、表示コードは後から形を変えられるようにする。
6. 国境・係争地・海上・境界付近セルは `review-required` として扱う。

### 4.0 Class Aの事前学習と非置換原則

Class Aの国でも、AGIDは次のプロファイルを事前学習する。

```tex
\Phi_A(k)
=
(\Omega_k,\ Pop_k,\ Terrain_k,\ Admin_k,\ ExistingPostal_k,\ Reason_k).
```

ここで、`\Omega_k` は国土・境界、`Pop_k` は人口分布、`Terrain_k` は地形、`Admin_k` は行政階層、`ExistingPostal_k` は既存郵便番号体系、`Reason_k` はその体系が採用されている理由である。

Class Aの学習結果は次の用途に限定する。

```tex
\mathrm{Use}_A(k)
=
\mathrm{internal\mbox{-}baseline\mbox{-}only}.
```

つまり、住所表示品質、逆ジオコーディング、国別フォーマット選択、配送可能性の内部判定、既存郵便番号との衝突検出には使うが、公開AGID郵便番号の生成には使わない。

```tex
\mathrm{Class}(k)=A
\Rightarrow
\mathrm{Generate}^{AGIDPostal}(k)=\bot.
```

この制約により、郵便番号が十分な国では既存制度を尊重しつつ、AGID側の住所理解・品質評価だけを強化できる。

## 4.1 承認・公開ガバナンスモデル

AGID郵便区画コードは、技術的に生成できることと、公開コードとして利用してよいことを分離する。国または地域 `k` における承認信号を次で表す。

```tex
A_k = \{v_{\mathrm{gov}}, v_{\mathrm{muni}}, v_{\mathrm{carrier}}, v_{\mathrm{platform}}\},
\quad
v_i \in [0,1].
```

承認スコアは重み付き和で定義する。

```tex
\mathrm{ApprovalScore}(k)
=
0.40v_{\mathrm{gov}}
+0.25v_{\mathrm{muni}}
+0.25v_{\mathrm{carrier}}
+0.10v_{\mathrm{platform}}.
```

公開承認条件は次である。

```tex
\mathrm{ApprovalScore}(k) \geq \tau_A.
```

この条件を満たさない場合でも、内部ドラフト区画は生成できる。ただし、公開コード、配送事業者向け標準コード、行政文書上のコードとしては扱わない。

## 4.2 プライバシー・安全性モデル

表示用郵便区画コード `Z` に含まれる住所実体集合を `A(Z)`、人口を `Pop(Z)` とする。公開可能性は、最小匿名性制約を満たすときだけ成立する。

```tex
|A(Z)| \geq q_{\min}
\quad \land \quad
Pop(Z) \geq p_{\min}.
```

実装上の初期値は次である。

```tex
q_{\min}=10,
\quad
p_{\min}=50.
```

危険施設、重要インフラ、個人が特定されやすい孤立住宅、避難・難民・DV等の高リスク用途では、公開コード化を禁止または要審査に落とす。

```tex
\mathrm{Sensitive}(Z)=1
\Rightarrow
\mathrm{PublicCode}(Z)=\bot.
```

高リスク用途では、公開AGID郵便区画コードではなく、AGID-S、短期alias、redaction、失効付きcredentialを優先する。

## 4.3 データ信頼度モデル

国 `k` の住所・道路・行政界・人口・境界データの信頼度を、それぞれ次で表す。

```tex
Q_{\mathrm{addr}}(k),
Q_{\mathrm{road}}(k),
Q_{\mathrm{admin}}(k),
Q_{\mathrm{pop}}(k),
Q_{\mathrm{boundary}}(k)
\in [0,1].
```

総合信頼度は次で定義する。

```tex
Q_k
=
0.25Q_{\mathrm{addr}}(k)
+0.15Q_{\mathrm{road}}(k)
+0.25Q_{\mathrm{admin}}(k)
+0.15Q_{\mathrm{pop}}(k)
+0.20Q_{\mathrm{boundary}}(k).
```

データ信頼度が閾値を下回る場合、正式公開ではなくドラフト区画のみを出力する。

```tex
Q_k < \tau_Q
\Rightarrow
\mathcal{E}_{AGID}(k)
\text{ outputs draft zones only}.
```

## 4.4 既存郵便番号との衝突回避モデル

既存郵便番号がある国では、AGID補助コードが既存郵便番号と混同されてはならない。

```tex
Postal^{AGID}_k \cap ExistingPostal_k = \emptyset.
```

または、既存郵便番号にAGID補助suffixを付ける。

```tex
Postal^{AGID}_k = ExistingPostal_k \oplus Suffix.
```

実装では、Class Bの表示コードに `AGID-` namespaceを付与し、既存郵便番号と同じ見た目にならないようにする。

## 4.5 曖昧性低減・配送適合・可読性モデル

AGID導入が有効であるためには、既存郵便番号または住所表記より住所候補の曖昧性を下げる必要がある。

```tex
H(A_k \mid AGID)
\leq
H(A_k \mid ExistingPostal).
```

配送効率については、配送距離、遅延、失敗率を含むコスト関数を置く。

```tex
Cost(\mathcal{Z})
=
\sum_{\mathrm{route}} dist(route)
+\lambda delay(route)
+\mu failure(route).
```

導入効果は次で測る。

```tex
Gain
=
\frac{Cost_{\mathrm{before}}-Cost_{\mathrm{after}}}
{Cost_{\mathrm{before}}}.
```

また、郵便区画コードは人間が入力・読解するため、可読性も評価対象にする。

```tex
Readability(s)
=
r_1 Simplicity(s)
+r_2 Length(s)
-r_3 Ambiguity(s)
-r_4 SeparatorComplexity(s).
```

実装では、表示長、区切り記号数、紛らわしい文字を初期評価し、低スコアの場合はテンプレート変更を推奨する。

## 4.6 追加定理群

**定理1: 公開安全性定理**

```tex
|A(Z)| \geq q_{\min}
\land
Pop(Z) \geq p_{\min}
\land
\mathrm{Sensitive}(Z)=0
\Rightarrow
Z \text{ is privacy-publishable}.
```

この定理は、区画内の住所実体数と人口が十分であり、かつ危険施設・高リスク対象でない場合に限って、公開候補になれることを述べる。逆に、孤立住宅や危険施設を1つの区画として公開することは許さない。

**定理2: データ信頼度制約定理**

```tex
Q_k < \tau_Q
\Rightarrow
\mathrm{Mode}(k)=\mathrm{Draft}.
```

住所・道路・行政界・人口・境界データの信頼度が低い場合、AGID郵便区画コードは公式・公開コードではなく、内部ドラフトとして扱う。

**定理3: 既存郵便番号非衝突定理**

```tex
Postal^{AGID}_k \cap ExistingPostal_k = \emptyset
\quad \lor \quad
Postal^{AGID}_k = ExistingPostal_k \oplus Suffix.
```

既存郵便番号が存在する国では、AGID補助コードは既存制度と同一namespaceを使わない。実装では `AGID-` prefixまたはsuffix戦略で衝突を避ける。

**定理4: 曖昧性低減定理**

```tex
H(A_k \mid AGID)
\leq
H(A_k \mid ExistingPostal).
```

AGID郵便区画コードは、既存郵便番号または住所表記単体よりも候補集合を広げてはならない。実証では、同一入力から残る候補数、到達失敗率、配送修正率で検証する。

**定理5: 承認制約定理**

```tex
\mathrm{ApprovalScore}(k) \geq \tau_A
\Rightarrow
\mathrm{GovernanceApproved}(k)=1.
```

公開利用には、政府・自治体・配送会社・プラットフォーム等の承認信号が閾値を超える必要がある。これにより、AGIDが勝手に公的郵便番号を名乗ることを防ぐ。

したがって、公開コード化の十分条件は次でまとめられる。

```tex
\mathrm{Publishable}(Z,k)
\Leftarrow
\mathrm{Generated}(Z)
\land
\mathrm{GovernanceApproved}(k)
\land
\mathrm{PrivacySafe}(Z)
\land
Q_k \geq \tau_Q
\land
\mathrm{NoCollision}(Z,k)
\land
\mathrm{NonReplacement}(k).
```

実装ではこの条件を `publication.status` として `publishable / draft-only / review-required / blocked` に落としている。

## 5. 模倣できる郵便番号テンプレート

実装では他国の郵便番号体系を「似た形」として選べる。ただし、これは公式郵便番号ではなく、AGIDから作る補助コードである。

| Template | Format | 主な用途 |
| --- | --- | --- |
| Japan-like | `CC-NNN-NNNN` | 高密度・自治体階層・後から細分化 |
| US-like | `CC-NNNNN` | 広域・ルート仕分け・拡張余地 |
| India-like | `CC-NNNNNN` | 大人口・多地域・数字入力優先 |
| France-like | `CC-NN NNN` | 行政区画を先頭に出す設計 |
| UK-like | `CC-AN NAA` | 高密度都市・外向/内向風 |
| Singapore-like | `CC-NNNNNN` | コンパクト高密度都市国家 |
| Ghana-like | `CC-AA-NNN-NNNN` | デジタル住所・グリッド連携 |
| AGID-native | `CC-AAAA-NNN` | 低データ地域・オフライン・将来変形 |

## 6. AI提案の考え方

現時点では軽量な決定的ヒューリスティックをAI的推薦として使う。

- 島国・群島: `AGID-native`
- 砂漠・大面積低密度: `US-like`
- 山地・高低差が大きい国: `France-like`
- 高人口国: `India-like`
- 高密度コンパクト国: `Singapore-like`
- 中規模・混合地形: `AGID-native` または `Japan-like`

この判定は学習済みブラックボックスではなく、説明可能なルールである。将来、住所修正フィードバックや配送成功率を使う場合も、個人住所を学習データとして公開・共有しない。

## 7. 自治体・残AGID検出

自治体ごとの作りやすさは次で見積もる。

- 国土面積からAGID基礎セル数を概算する。
- 人口から必要な郵便区画数を概算する。
- 自治体数が分かる場合は、自治体あたりの郵便区画数を出す。
- 未割当AGIDは、国コード接頭辞と国境ポリゴンで検出する。

実装上の注意:

- AGID接頭辞だけで国境内と断定しない。
- 最終的には国境ポリゴン、行政界、配送可能性、係争地フラグで確認する。
- 形を変える場合はAGIDを不変キーにし、旧表示コードと新表示コードのalias tableを持つ。

## 8. ペンタブ・液タブ・Adobe/GIS編集モデル

郵便番号区画を実務で作る場合、自治体職員、配送業者、GIS担当者、デザイナーが、ペンタブ、液タブ、Adobe Illustrator、PDF注釈、QGIS/GeoJSONなどで境界を修正する可能性がある。ここで重要なのは、AGIDそのものを破壊的に書き換えるのではなく、郵便区画を構成するAGID集合を編集台帳として管理することである。

表示用郵便区画コードを `Z`、それを構成するAGIDセル集合を `G_Z` とする。

```tex
G_Z = \{g_1,g_2,\ldots,g_n\}.
```

ペンタブやAdobeでの編集は、AGIDセル集合に対する操作列として記録する。

```tex
e_i =
(
g_{\mathrm{original}},
g_{\mathrm{edited}},
op,
source,
t
)
```

ここで `op` は次を取る。

```tex
op \in
\{
include,
exclude,
reshape,
merge,
split,
adobe\mbox{-}import,
gis\mbox{-}import
\}.
```

編集後の郵便区画は、初期セル集合 `G_0` と編集操作列 `E` から得る。

```tex
G_Z(t+1)
=
\mathrm{Apply}(G_Z(t), E_t).
```

このとき、国境非越境制約を保つ。

```tex
\forall g \in G_Z,\quad prefix(g)=k.
```

異なる国コードのAGID、壊れたAGID、復号できないAGIDは `rejectedAgids` として記録し、郵便区画には統合しない。

編集台帳は次の情報を保持する。

- `postalCode`: 表示用郵便区画コード。
- `countryCode`: 対象国コード。
- `integratedAgids`: 郵便番号を構成する統合済みAGID集合。
- `editedAgids`: どのAGIDをどの操作で編集したか。
- `excludedAgids`: 意図的に除外したAGID集合。
- `source`: ペンタブ、液タブ、Adobe、PDF、GIS、手入力などの編集元。
- `revisionId`: 統合AGID集合と編集操作から作る監査用revision。

この方式により、次が可能になる。

1. ペンタブ・液タブで境界を描いた結果をAGID集合として保存できる。
2. Adobe IllustratorやPDF注釈から取り込んだ境界を、同じ台帳形式に正規化できる。
3. 1つの郵便番号が、どのAGID群で構成されているか後から監査できる。
4. 区画形状を後で変更しても、AGIDを不変キーとして旧版と新版を比較できる。
5. 個人住所や部屋番号を保存せず、区画設計に必要なセル集合だけを扱える。

実装では `createAgidPostalZoneEditRecord()` が初期台帳を作り、`updateAgidPostalZoneEditRecord()` が追加・除外・修正をrevision付きで更新する。

## 9. 島嶼階層型AGID郵便区画モデル

島国・群島・海外領では、国全体を単純な連番で切るよりも、次の階層を明示した方が安定する。

```text
国 -> 島 -> 都市・町 -> 配送区画
```

このモデルの重要点は、都市名の文字列ではなく、名称から独立した都市実体IDで判定することである。国 `k`、島 `i` に属する正式都市・町の集合を `L_{k,i}` とし、各都市実体に永続IDを与える。

```tex
\mathrm{LocalityID}: L_{k,i} \to U.
```

都市名は時刻 `t` に依存する属性である。

```tex
\mathrm{Name}_t(\ell).
```

したがって、名称が変わっても同じ都市実体であれば、郵便番号領域を変えない。

```tex
\mathrm{Name}_{t+1}(\ell) \neq \mathrm{Name}_t(\ell)
\land
\mathrm{LocalityID}_{t+1}(\ell)=\mathrm{LocalityID}_t(\ell)
\Rightarrow
\mathrm{PostalPrefix}_{t+1}(\ell)=\mathrm{PostalPrefix}_t(\ell).
```

逆に、異なる正式都市・町には異なる郵便番号集合を割り当てる。都市ごとの郵便番号集合を `C_{k,i,\ell}` とすると、都市別郵便番号分離制約は次である。

```tex
\mathrm{LocalityID}(\ell_a) \neq \mathrm{LocalityID}(\ell_b)
\Rightarrow
C_{k,i,\ell_a} \cap C_{k,i,\ell_b} = \emptyset.
```

表示コードは次の階層構造を基本形にする。

```tex
z=
E_K(k)
\Vert
E_I(i)
\Vert
E_L(\ell\mid i)
\Vert
E_Z(r\mid \ell)
\Vert
\chi.
```

ここで、`E_K(k)` は国コード、`E_I(i)` は島コード、`E_L(\ell|i)` は都市・町コード、`E_Z(r|\ell)` は都市内配送区画、`\chi` は任意のチェック文字である。

例:

```text
VU-03-01-00  国VU・島03・都市01・都市全体
VU-03-02-01  国VU・島03・都市02・第1配送区画
VU-03-02-02  国VU・島03・都市02・第2配送区画
```

この構造では、都市コードが異なれば最終コードも異なる。

```tex
E_L(\ell_a\mid i) \neq E_L(\ell_b\mid i)
\Rightarrow
z(\ell_a) \neq z(\ell_b).
```

名称文字列を番号生成に直接使ってはいけない。理由は、改名、多言語表記、ローマ字転写、旧植民地語名、略称、同名都市が存在するためである。識別キーは次にする。

```tex
(k,i,\mathrm{LocalityID}(\ell)).
```

都市名履歴は次のように保持する。

```tex
\mathrm{NameHistory}(\ell)
=
\{(n_j,t^{from}_j,t^{to}_j,lang_j)\}.
```

旧名称からも現在の都市IDへ解決できるようにする。

```tex
\mathrm{ResolveName}(n,t) \to \mathrm{LocalityID}(\ell).
```

郵便番号を変更すべきなのは、単なる改名ではなく、都市実体の構造が変わった場合である。たとえば都市分割では、

```tex
\ell \to \{\ell_1,\ell_2\}
```

となり、旧コードから新コード集合への移行写像を残す。

```tex
B_t(03\mbox{-}02\mbox{-}00)=\{03\mbox{-}02\mbox{-}01,03\mbox{-}03\mbox{-}01\}.
```

都市統合では、旧コードをすぐ消さず、移行期間中はaliasとして解決する。境界変更では、移動したAGID区画だけ都市コードを変更する。

```tex
Z \subseteq \ell_a \longrightarrow Z \subseteq \ell_b.
```

運用モードは三つに分ける。

| Mode | 意味 | 用途 |
| --- | --- | --- |
| Strict locality separation | 異なる正式都市・町は必ず異なる郵便番号集合を持つ | 政府公式制度 |
| Locality prefix separation | 都市接頭辞は必ず異なり、都市内に複数配送区画を持てる | AGID推奨 |
| Delivery-priority | 低密度集落では配送区画共有を許すが、表示上はLocalityIDを保持する | 島嶼・僻地配送 |

追加する定理は次の三つである。

**定理6: 都市分離定理**

都市コード写像 `E_L:L_{k,i}\to\Sigma_L^{L_L}` が単射であり、すべての郵便番号が都市コードを含むなら、次が成立する。

```tex
\mathrm{LocalityID}(\ell_a)\neq\mathrm{LocalityID}(\ell_b)
\Rightarrow
C_{\ell_a}\cap C_{\ell_b}=\emptyset.
```

**定理7: 改名不変性定理**

都市の名称が変化しても都市IDが保存されるなら、都市コードを保存できる。

```tex
\mathrm{Name}_{t+1}(\ell)\neq\mathrm{Name}_t(\ell)
\land
\mathrm{LocalityID}_{t+1}(\ell)=\mathrm{LocalityID}_t(\ell)
\Rightarrow
E_L^{t+1}(\ell)=E_L^t(\ell).
```

**定理8: 階層細分化保存定理**

都市内配送区画を分割しても、子区画が同じ都市コードを継承する限り、都市間の郵便番号分離性は保存される。

```tex
Z' \in F_t(Z)
\Rightarrow
E_L(Z')=E_L(Z).
```

実装では `buildAgidPostalHierarchicalCode()` が `国-島-都市-配送区画` の階層コードを生成し、`evaluateAgidPostalLocalitySeparation()` が都市別コード分離、改名不変性、配送優先モードの例外を検査する。

## 10. 可変階層・存在条件・運用段階モデル

郵便番号がない、国土が小さい、島が多い、街路名がない、住所データが粗い、といった事情は、それ自体では郵便区画コードを構成できない理由ではない。必要なのは、国ごとに適切な粒度と階層を選ぶことである。

### 10.1 存在条件

国 `k` の配送対象となる住所・施設・集落・到達点の集合を `A_k` とする。これを郵便区画に分けた有限分割を次で表す。

```tex
\Pi_k=\{Z_1,Z_2,\ldots,Z_m\}.
```

使用文字集合を `\Sigma`、コード長を `L` とすると、

```tex
|\Sigma|^L \geq m
```

なら、各区画へ異なるコードを割り当てる単射が存在する。

```tex
e_k:\Pi_k \hookrightarrow \Sigma^L.
```

したがって、住所実体 `a` が `Z_j` に属するとき、表示用郵便区画コードは次で定義できる。

```tex
\mathrm{Postal}_k(a)=e_k(Z_j)
\quad
(a\in Z_j).
```

極端な最小構成では、国全体を一つの区画にできる。

```tex
\Pi_k=\{\Omega_k\},
\quad
\mathrm{Postal}_k(a)=z_k
\quad
\forall a\in A_k.
```

このため、数学的には任意の有限な国・地域の郵便区画コードを構成できる。ただし、これは「公式制度として有効に運用できる」こととは別である。

実装では `evaluateAgidPostalExistenceCondition()` が、区画数 `m`、文字集合サイズ `|\Sigma|`、コード長 `L` から容量条件と最小必要長を検査する。

### 10.2 国土タイプ別の可変階層

すべての国に同じ形式を強制しない。AGID郵便区画は、固定階層ではなく可変深度の木として扱う。

```tex
T_k=(N_k,E_k).
```

ノード `n\in N_k` は、種類、領域、名称履歴、コード成分を持つ。

```tex
n=(u(n),\tau(n),\Omega(n),\mathrm{Name}_t(n),\mathrm{Code}(n)).
```

表示コードは、根から末端区画までの経路から生成する。

```tex
z(n)=
E_K(k)
\Vert
E_{n_1}
\Vert
E_{n_2}
\Vert
\cdots
\Vert
E_n
\Vert
\chi.
```

ここで `E_K(k)` は国の名前空間、`E_{n_j}` は地域単位・都市・集落・配送区画などのコード、`\chi` は任意のチェック文字である。不要な階層は省略できる。

| 国土タイプ | 推奨階層 |
| --- | --- |
| 小国・都市国家 | 国 -> 行政区 -> 街区 |
| 島嶼国 | 国 -> 島 -> 都市・集落 -> 配送区画 |
| 大陸国家 | 国 -> 州・県 -> 都市 -> 配送区画 |
| 山岳国 | 国 -> 地方 -> 谷・盆地 -> 集落 |
| 砂漠国 | 国 -> 地方 -> 道路回廊・オアシス -> 集落 |
| 河川・デルタ国家 | 国 -> 流域 -> デルタ -> 都市・集落 |
| 住所未整備地域 | 国 -> 行政地域 -> 生成集落クラスター -> 配送区画 |
| 街路名がない地域 | 国 -> 地理セル -> 集落 -> ランドマーク |
| 飛び地を持つ国 | 国 -> 連結領域 -> 都市 -> 配送区画 |
| 高層都市 | 国 -> 都市区 -> 街区 -> 建物群 |

島は例外ではなく、地域単位 `\tau(n)` の一種類である。したがって、島嶼モデルは可変階層モデルの特殊ケースになる。

実装では `recommendAgidPostalAdaptiveHierarchy()` が、国の地形・住所データ・証拠文字列から推奨階層を返し、`buildAgidPostalVariableHierarchyCode()` が任意深度のコードを生成する。

### 10.2.1 国別事前学習モデル

すべての国で、AGID郵便区画を生成または評価する前に、その国の国土、人口、地形、都市化、行政境界、道路・配送網、既存住所制度を学習する。ここでいう学習は、個人住所を収集してブラックボックスAIに投入することではない。国レベルの公開可能な設計特徴を、説明可能な設計priorとして構造化することである。

国 `k` の事前学習入力を次で表す。

```tex
L_k =
(\Omega_k,\mathrm{Pop}_k,\mathrm{Area}_k,\mathrm{Density}_k,
\mathrm{Terrain}_k,\mathrm{Urban}_k,\mathrm{Admin}_k,
\mathrm{PostalExisting}_k,\mathrm{DataQuality}_k).
```

事前学習器は次を返す。

```tex
\mathrm{Learn}(k)
\to
(\mathrm{scale}_k,\mathrm{terrain}_k,\mathrm{populationBand}_k,
\mathrm{areaBand}_k,\mathcal{S}_k,\mathrm{Template}_k).
```

ここで `\mathcal{S}_k` は参考にする既存郵便番号体系の集合である。ただし、これは他国の制度をそのまま移植するためではなく、採用理由を学ぶための集合である。

| 参考体系 | 学習する理由 | 注意 |
| --- | --- | --- |
| Japan-like | 高密度な都市・自治体階層・後からの細分化 | 成熟国では既存制度を置換しない |
| US-like | 広大な国土・粗い地域仕分け・後続suffix拡張 | 道路や配送ルートが弱い国ではドラフト扱い |
| India-like | 大人口・多言語入力・単純な数字入力 | Class Bでは補助コードに限定 |
| France-like | 広域行政prefix・安定自治体・山岳/地域単位 | 行政境界の品質が必要 |
| UK-like | 短い英数字で高容量・都市内高密度配送 | フォント、誤読、入力検証が重要 |
| Singapore-like | 小国・高密度都市・建物レベル配送 | 小国以外に過度な精密化をしない |
| Ghana-like | デジタル住所・地図/グリッド連携 | 安全リスク地域では公開精度を下げる |
| AGID-native | 低データ地域・オフライン・将来の再編 | 公的郵便番号を名乗らず段階運用する |

このモデルで重要なのは、既存郵便番号の「形」だけではなく、「なぜその形が採用され、どの条件で機能したか」を保持する点である。たとえば、人口が多い国では可読で容量の大きい数字体系が有利になり、島嶼国では島を上位階層に置く方が安定し、砂漠・山岳・河川地域では道路回廊、谷、流域を階層単位に含めた方が配送に適する。

実装では `learnAgidPostalCountryDesign()` がこの役割を持つ。Class Aでも `learningRequired=true` とし、既存郵便番号を主制度として保持したまま、学習結果を内部ベースラインだけに使う。Class Bでは既存郵便番号を主とし、AGIDは補助コードの設計priorとして学習する。Class Cでは、国土・人口・地形・データ信頼度を確認したうえで、AGID郵便区画を `simulation` または `draft` から開始する。

```tex
\mathrm{Class}(k)=A
\Rightarrow
\mathrm{LearningMode}(k)=\mathrm{maturePostalBaseline}.
```

```tex
\mathrm{Class}(k)=A
\Rightarrow
\mathrm{AllowedUse}(k)=\mathrm{internalBaselineOnly}
\land
\mathrm{Generate}^{AGIDPostal}(k)=\bot.
```

```tex
\mathrm{Class}(k)=B
\Rightarrow
\mathrm{AllowedUse}(k)=\mathrm{supplementalDesign}.
```

```tex
\mathrm{Class}(k)=C
\Rightarrow
\mathrm{AllowedUse}(k)=\mathrm{primaryDesign}.
```

したがって、郵便番号が十分な国では内部品質判定のために学習し、郵便番号が不十分な国ではAGIDコードをすぐに発行するのではなく、国土・人口・地形と既存制度の採用理由を先に学習し、その学習結果からテンプレート、階層、公開粒度、運用ステータスを決める。

### 10.3 街路名や正式住所が弱い地域の区画生成

街路名や番地が未整備でも、次のデータから郵便区画を作れる。

```tex
X_k=
(\mathrm{admin},\mathrm{population},\mathrm{building},\mathrm{road},
\mathrm{port},\mathrm{depot},\mathrm{settlement},\mathrm{terrain}).
```

住所集合が不十分な場合は、建物、集落、道路グラフ、港、配送拠点、地形障壁をクラスタリングする。目的関数は次のように置ける。

```tex
Z_k^\ast
=
\arg\min_Z
\left[
\alpha C_{\mathrm{route}}
+\beta C_{\mathrm{admin}}
+\gamma C_{\mathrm{barrier}}
+\delta C_{\mathrm{load}}
+\epsilon C_{\mathrm{ambiguity}}
+\eta C_{\mathrm{change}}
+\theta C_{\mathrm{complexity}}
\right].
```

この式は、配送効率だけでなく、行政境界、地形障壁、負荷分散、曖昧性、変更コスト、複雑さを同時に扱う。

### 10.4 識別面・郵便区画面・配送経路面の分離

郵便区画と配送ルートを混ぜない。AGIDでは少なくとも三つの面を分ける。

```tex
\mathrm{AGID}: a \mapsto g,
```

```tex
\mathrm{Postal}_t: g \mapsto z,
```

```tex
\mathrm{Route}_t: z \mapsto
(\mathrm{depot},\mathrm{route},\mathrm{sequence}).
```

道路、配送拠点、配送会社、交通事情が変わっただけなら、原則として `Route_t` を更新し、AGIDや郵便区画コードは変えない。

```tex
\Delta \mathrm{road}
\lor
\Delta \mathrm{depot}
\lor
\Delta \mathrm{carrier}
\Rightarrow
\Delta \mathrm{Route}_t,
\quad
\Delta \mathrm{Postal}_t=0.
```

一方、自治体分割、都市統合、境界変更、郵便区画そのものの再編が起きた場合は、`Postal_t` を更新できる。ただし旧コードから新コードへの後方互換写像を保存する。

```tex
B_t:z_{\mathrm{old}}\to \{z_{\mathrm{new},1},\ldots,z_{\mathrm{new},r}\}.
```

実装では `evaluateAgidPostalPlaneSeparation()` が、経路変更だけで郵便番号を変えていないか、郵便番号変更時に後方互換があるかを検査する。

### 10.5 細分化・可読性・変更予算

区画を細かくすれば常に良いわけではない。細分化は、曖昧性低減や配送効率改善の利益が、コード複雑化と移行コストを上回る場合だけ行う。

```tex
\mathrm{Benefit}_{split}
>
\lambda_{\mathrm{code}}+\lambda_{\mathrm{migration}}.
```

実装では `evaluateAgidPostalSplitDecision()` がこのMDL型の分割判定を行う。

また、郵便番号は社会インフラであり、頻繁に変えると運用が壊れる。年間変更率を次で制限する。

```tex
\frac{|\Delta Codes_t|}{|Codes_t|}
\leq
\beta_k.
```

初期値としては `\beta_k=0.005` 程度を置き、災害や行政再編などの例外時だけ上書きする。実装では `evaluateAgidPostalCodeChurnBudget()` がこの制約を検査する。

### 10.6 最低郵便番号数モデル

郵便番号の最低数は、単に人口や面積を割るだけでは決まらない。行政・地域分離、住所数、配送量、移動時間、地形、将来成長を満たす「最も粗い実用可能な区画数」として定義する。

国 `k` に必要な郵便番号数は、少なくとも四つに分ける。

| 記号 | 意味 |
| --- | --- |
| `m_k^{abs}` | 理論上の絶対最小数。郵便番号を一つでも作るなら `1` |
| `m_k^{struct}` | 必須地域分離を守るための最小数 |
| `m_k^{op}` | 住所数、人口、配送量、移動時間、曖昧性を満たす運用上の最小数 |
| `M_k^{plan}` | 将来成長と予備率を含めた必要コード容量 |

絶対最小は常に次である。

```tex
m_k^{abs}=1.
```

しかし、これは配送実務上の最低数ではない。実用上は、AGID原子区画集合を次で置く。

```tex
G_k=\{g_1,g_2,\ldots,g_n\}.
```

各原子区画 `g` は、住所・配送地点数、人口、ピーク配送需要、地理範囲、必須地域識別子を持つ。

```tex
g=(N_g,P_g,D_g,\Omega_g,\rho_g).
```

必須地域識別子 `\rho_g` は、名前ではなく永続IDで構成する。

```tex
\rho_g=(\mathrm{territoryId},\mathrm{regionId},\mathrm{stateId},\mathrm{localityId}).
```

同じ郵便番号にまとめられるのは、必須地域識別子が同じ原子区画だけである。

```tex
g_a\sim g_b
\Rightarrow
\rho_{g_a}=\rho_{g_b}.
```

郵便区画集合は、AGID原子区画の分割である。

```tex
\Pi_k=\{Z_1,Z_2,\ldots,Z_m\},
\quad
\bigcup_{j=1}^m Z_j=G_k,
\quad
Z_i\cap Z_j=\emptyset\ (i\neq j).
```

同じ番号を割り当てる関係 `\sim` を同値関係とみなすと、

```tex
\Pi_k=G_k/\sim.
```

したがって、運用上の最低郵便番号数は、制約集合 `\mathcal{P}_k` を満たす分割の中で最も粗い分割のクラス数である。

```tex
m_k^{op}
=
\min_{\Pi\in\mathcal{P}_k}|\Pi|.
```

重要なのは、サービス基準を指定しなければ答えは必ず `1` になる点である。実際には次のような政策パラメータを持つ。

```tex
m_k^{op}
=
m_k^{op}(\bar{N},\bar{P},\bar{D},\tau,\bar{U},\rho_k).
```

ここで、`\bar{N}` は1番号あたり住所数上限、`\bar{P}` は人口上限、`\bar{D}` はピーク配送需要上限、`\tau` は移動時間上限、`\bar{U}` は曖昧性上限である。

### 10.6.1 すぐ計算できる下限公式

厳密な整数最適化の前に、必須地域単位ごとの下限を計算できる。必須地域集合を `R_k` とし、各地域 `r` について次を定義する。

| 記号 | 意味 |
| --- | --- |
| `N_r` | 住所数 |
| `P_r` | 人口 |
| `D_r` | ピーク配送量 |
| `c_r` | 配送グラフ上の連結成分数 |
| `\kappa_\tau(r)` | 移動時間上限内で地域を覆うために必要な最小拠点数 |
| `q_r` | 人口ゼロでも番号を予約するか |

地域 `r` に必要な郵便番号数の下限は次である。

```tex
\underline{m}_r
=
\max
\left\{
q_r,
\left\lceil\frac{N_r}{\bar{N}}\right\rceil,
\left\lceil\frac{P_r}{\bar{P}}\right\rceil,
\left\lceil\frac{D_r}{\bar{D}}\right\rceil,
c_r,
\kappa_\tau(r)
\right\}.
```

国全体では、

```tex
\underline{m}_k
=
\sum_{r\in R_k}\underline{m}_r.
```

これは必ず次を満たす。

```tex
\underline{m}_k \leq m_k^{op}.
```

この式は、単に国全体の人口を1番号あたり人口で割るのではなく、地域ごとに最も厳しい条件を選び、それを合計する点が重要である。

移動時間カバー数は次で定義できる。

```tex
\kappa_\tau(r)
=
\min
\left\{
|S|:\forall g\in r,\exists s\in S,\ T(s,g)\leq\tau
\right\}.
```

人口が少なくても、山、川、海峡、港、道路分断、長い谷などにより `\kappa_\tau(r)` が2以上になれば、複数の郵便番号が必要になる。

実装では `estimateAgidPostalMinimumCodeCount()` がこの下限公式を計算する。例として、住所数上限4万、ピーク配送量上限1万の仮想国で、本土中央市3、内陸北市2、居住島1、無人島予約1となる場合、国全体の下限は `7` になる。

### 10.6.2 整数計画としての厳密モデル

すべての制約を満たす候補区画集合を `F_k` とする。候補区画 `Z\in F_k` を採用するかどうかを二値変数で表す。

```tex
x_Z=
\begin{cases}
1 & Z\text{を郵便区画として採用}\\
0 & \text{採用しない}
\end{cases}
```

最適化問題は次である。

```tex
\min \sum_{Z\in F_k}x_Z
```

制約は、すべてのAGID原子区画 `g\in G_k` を重複なく一度だけ覆うことである。

```tex
\sum_{Z\in F_k:g\in Z}x_Z=1
\quad
\forall g\in G_k.
```

候補区画 `F_k` には、必須地域をまたがない、道路網上で連結、住所数上限以下、人口上限以下、配送需要上限以下、配送時間上限以下、曖昧性上限以下、国境を越えない、という条件を満たす区画だけを入れる。

大規模国では候補区画数が大きくなるため、階層クラスタリング、グラフ分割、列生成法を組み合わせる。

### 10.6.3 最低数と最適形状の分離

最低数が決まっても、その数でどのように国土を分けるかは別問題である。まず最低数を求める。

```tex
m_k^{op}
=
\min_{\Pi\in\mathcal{P}_k}|\Pi|.
```

その後、同じ最低数を持つ分割の中から配送効率が最も高いものを選ぶ。

```tex
\Pi_k^\ast
=
\arg\min_{\Pi\in\mathcal{P}_k,\ |\Pi|=m_k^{op}}
J(\Pi).
```

目的関数は次のように置ける。

```tex
J(\Pi)
=
\alpha C_{\mathrm{route}}
+\beta C_{\mathrm{load}}
+\gamma C_{\mathrm{admin}}
+\delta C_{\mathrm{ambiguity}}
+\eta C_{\mathrm{change}}.
```

この二段階方式により、必要以上に番号を増やさず、最低数の中で最も配送しやすい区画を選べる。

### 10.6.4 将来容量と最低桁数

現在だけで最低数を決めると、人口増加、都市化、人工島、新都市、配送量増加によりすぐ不足する可能性がある。時点 `t` の必要数を `m_k^{op}(t)` とし、計画期間を `H` 年とする。

```tex
m_{k,H}^{future}
=
\max_{0\leq t\leq H}m_k^{op}(t).
```

不確実性を含める場合はシナリオ集合 `\Omega_H` を使う。

```tex
m_{k,H}^{rob}
=
\max_{\omega\in\Omega_H}m_k^{op}(\omega).
```

予備率を `r` とすると、確保すべきコード空間は次である。

```tex
M_k^{space}
=
\left\lceil
(1+r)m_{k,H}^{rob}
\right\rceil.
```

使用文字集合の大きさを `q=|\Sigma|` とすると、最小固定長は次である。

```tex
L_{\min}
=
\left\lceil
\log_q M_k^{space}
\right\rceil.
```

チェック文字を追加する場合、表示長は次になる。

```tex
L_{\mathrm{display}}=L_{\min}+1.
```

実装では `planAgidPostalFutureCapacity()` が、将来必要数、予備率、文字集合サイズから必要コード空間と最低固定長を計算する。

階層型コードの場合は、各階層ごとに容量を計算する。親地域 `p` の最大子地域数を `b_p`、予備率を `r_p` とすると、

```tex
L_p
=
\left\lceil
\log_q((1+r_p)b_p)
\right\rceil.
```

たとえば、最大島数60、島ごとの最大都市数80、都市ごとの最大配送区画数150で、数字のみを使うなら、

```tex
L_{\mathrm{island}}=2,
\quad
L_{\mathrm{city}}=2,
\quad
L_{\mathrm{zone}}=3.
```

この場合、`II-CC-ZZZ` の7桁体系にできる。実装では `estimateAgidPostalHierarchyCapacity()` がこの計算を行う。

### 10.6.5 数学的性質

**存在性**
`G_k` が有限で、各原子区画を単独の郵便区画にした場合にすべての制約を満たすなら、実行可能な分割が存在する。有限個の候補分割の中で区画数は自然数なので、最小値も存在する。

```tex
m_k^{op}\ \text{exists}.
```

ただし、一つの原子区画だけでも住所数・配送量・時間上限を超える場合は、モデルは原子区画の再細分化、配送拠点追加、サービス時間上限緩和、大口施設専用番号の発行を要求する。

**制約強化単調性**
配送時間上限を短くしたり、1番号あたり住所数を減らしたりすると、最低数は減らない。

```tex
\Theta'\ \text{is stricter than}\ \Theta
\Rightarrow
m_k^{op}(\Theta')\geq m_k^{op}(\Theta).
```

**地域分離単調性**
新しい都市分離、島分離、飛び地分離を追加すると、最低数は減らない。

```tex
R'_k\ \text{refines}\ R_k
\Rightarrow
m_k^{op}(R'_k)\geq m_k^{op}(R_k).
```

**改名不変性**
都市名や島名だけが変わり、永続ID、境界、人口、配送条件が同じなら、最低郵便番号数は変わらない。

```tex
m_k^{op}(t+1)=m_k^{op}(t).
```

### 10.7 仮想郵便ローカリティ

住所の名前が曖昧な土地では、正式な都市・町・村を新しく作ったように見せるべきではない。代わりに、非行政的な郵便・配送専用単位として **Virtual Postal Locality (VPL)**、すなわち仮想郵便ローカリティを定義する。

```text
Administrative Locality != Virtual Postal Locality
```

仮想郵便ローカリティは、正式な自治体ではなく、次の目的だけに使う。

- 郵便番号の区別。
- 住所候補の絞り込み。
- 配送経路の整理。
- 未命名地域や同名地名の識別。
- 将来の住所整備の基礎単位。

国 `k` の中で、正式な都市・町・集落に十分対応付けられない曖昧地域を `R` とし、そのAGID原子区画集合を `\mathcal{G}_R` とする。仮想郵便ローカリティ集合は次で表す。

```tex
\mathcal{V}_R=\{V_1,V_2,\ldots,V_m\},
\quad
V_i\subseteq \mathcal{G}_R.
```

必須条件は次である。

```tex
\bigcup_{i=1}^{m}V_i=\mathcal{G}_R,
\quad
V_i\cap V_j=\emptyset\ (i\neq j),
\quad
\Omega(V_i)\subseteq\Omega_k.
```

配送網上でも連結であることを原則とする。

```tex
G_k^{route}[V_i]\ \text{is connected}.
```

#### 10.7.1 生成条件

VPLは、単に「番号に変化を持たせたい」ために作らない。次のいずれかを満たす場合だけ生成候補にする。

```tex
Amb(R)>\tau_A
\quad\lor\quad
N(R)>\bar{N}
\quad\lor\quad
D(R)>\bar{D}
\quad\lor\quad
Radius_{route}(R)>\tau.
```

さらに、道路・船便・橋・港などの配送グラフが複数連結成分に分かれる場合、または移動時間上限内で複数拠点が必要な場合も対象にする。

曖昧地域 `R` に必要なVPL数の下限は、最低郵便番号数モデルと同じ形で定義できる。

```tex
\underline{m}_R
=
\max
\left\{
1,
\left\lceil\frac{N_R}{\bar{N}}\right\rceil,
\left\lceil\frac{P_R}{\bar{P}}\right\rceil,
\left\lceil\frac{D_R}{\bar{D}}\right\rceil,
c_R,
\kappa_\tau(R)
\right\}.
```

実装では `evaluateAgidPostalVirtualLocalityNeed()` が、曖昧性、住所数、人口、ピーク配送需要、移動時間、連結性からVPL作成要否と下限数を返す。作成理由がない場合は `do-not-create-vpl-for-visual-variety-alone` を返し、見た目の多様性だけで人工地域を増やさない。

#### 10.7.2 データモデル

住所データでは、行政地域、郵便地域、仮想郵便ローカリティを別フィールドにする。

```text
administrative_locality_id: null
postal_locality_id: VPL-0027
synthetic: true
legal_status: non_administrative
authority: National Postal Authority
valid_from: 2030-01-01
```

この分離により、VPLを公的な市町村と誤認させない。VPLに「市」「町」「村」などの法的地位を示す語を付ける場合は、政府または自治体の正式承認が必要である。

各VPLには永続IDを与える。

```tex
VID:\mathcal{V}_R\to U.
```

表示名は時刻依存の属性とする。

```tex
Label_t(V_i).
```

したがって、表示名が変わっても、`VID` が同じなら郵便コードを維持できる。

```tex
Label_{t+1}(V_i)\neq Label_t(V_i)
\land
VID_{t+1}(V_i)=VID_t(V_i)
\Rightarrow
Postal_{t+1}(V_i)=Postal_t(V_i).
```

#### 10.7.3 VPLコード構造

VPLを含む郵便コードは次のように構成できる。

```tex
z=
E_K(k)
\Vert
E_R(r)
\Vert
E_V(V_i)
\Vert
E_Z(Z_j)
\Vert
\chi.
```

ここで、`E_K` は国、`E_R` は上位地域、`E_V` は仮想郵便ローカリティ、`E_Z` は内部配送区画、`\chi` はチェック文字である。

例:

```text
KN-04-K7-2
KN-04-P2-8
KN-04-X8-5
KN-04-D5-1
```

実装では `buildAgidVirtualPostalLocalityCode()` がこのコードを生成する。

#### 10.7.4 空間分割とコード可読性の分離

VPLを増やす理由は、空間・住所・配送の曖昧性を下げるためである。一方、コードが似すぎる問題は、空間分割ではなく符号設計で扱う。

有効なVPLコード集合を `C_V` とし、最小ハミング距離を次で定義する。

```tex
d_{\min}
=
\min_{x\neq y\in C_V} d_H(x,y).
```

1文字の入力誤りを検出しやすくするには、少なくとも次を満たすコード集合を選ぶ。

```tex
d_{\min}\geq 3.
```

隣接するVPL同士は、さらに見分けやすいコードを割り当てる。

```tex
(V_i,V_j)\in E_V
\Rightarrow
d_H(Code(V_i),Code(V_j))\geq d_{\mathrm{adj}}.
```

実装では `generateAgidVirtualPostalLocalityCodes()` が、要求された最小ハミング距離を満たすVPLコード集合を生成する。要求長が短すぎる場合は、距離条件を満たすためにコード長を伸ばす。

#### 10.7.5 分割・統合・状態管理

VPLは時間とともに分割、統合、境界変更できる。

```tex
V_i\to\{V_{i1},V_{i2}\},
\quad
\{V_i,V_j\}\to V'.
```

旧コードから新コードへの後方互換写像を保存する。

```tex
B_t:
Postal_t(V)
\to
\mathcal{P}(Postal_{t+1}).
```

状態は次の集合で管理する。

```tex
Status(V)\in
\{\mathrm{draft},\mathrm{pilot},\mathrm{active},\mathrm{suspended},\mathrm{retired}\}.
```

AIが生成した時点では `draft` であり、すぐに公的な郵便地域として扱わない。少なくとも配送会社、自治体、郵便当局などの承認を経て `pilot` または `active` に進む。

### 10.8 運用段階

設計可能性と公式運用を分離する。国 `k` のAGID郵便区画状態を次の集合で表す。

```tex
\mathrm{Status}_k
\in
\{\mathrm{simulation},\mathrm{draft},\mathrm{pilot},\mathrm{supplementary},\mathrm{official}\}.
```

| Status | 意味 |
| --- | --- |
| Simulation | 数理モデル上の仮想区画 |
| Draft | 自治体・政府確認前の下書き |
| Pilot | 限定地域または配送会社による試験運用 |
| Supplementary | 既存住所や既存郵便番号を補う補助コード |
| Official | 政府または公的主体が正式承認した国家郵便番号 |

公式化には少なくとも、国境・行政境界基準、永続ID、発行主体、郵便・配送事業者との運用連携、分割・統合・改名時の更新制度、後方互換、データ品質評価、プライバシー安全性が必要である。

実装では `decideAgidPostalOperationalStatus()` が、生成済みか、ガバナンス承認があるか、データが信頼できるか、公開しても安全か、公的issuerと後方互換があるかをもとに段階を決める。

したがって、正確な結論は次である。

```text
すべての国は郵便番号体系を数学的に構成できる。
ただし、すべての国が同じ体系を採用すべきではない。
```

AGIDでは、郵便番号がない国には新規コード設計、郵便番号が弱い国には補助コード、成熟した国には内部補助、小国・特殊地域には単一コードまたは浅い階層、成長国には将来下位階層を追加できる可変深度方式を採用する。

## 11. 実装ファイル

- `src/lib/agidPostalCodeEngine.ts`: 分類、テンプレート推薦、生成、自治体見積もり、リシェイプ計画。
- `src/lib/agidPostalCodeEngine.test.ts`: A/B/C分類、生成許可、国境ガード、推薦、見積もり、最低数、VPLのテスト。
- `scripts/report-agid-postal-code-engine.ts`: 住所フォーマットJSONから分類レポートを生成。
- `src/components/PostalCodeLab.tsx`: UIから国、AGID、テンプレート、桁数を選び、AGID郵便区画コードを試作する画面。

## 12. 非目標

- 公式郵便番号の偽装。
- 国をまたいだAGIDコード生成。
- 個人住所・部屋番号・電話番号を含む郵便区画コード生成。
- 行政承認なしに公式郵便制度として主張すること。
- 仮想郵便ローカリティを行政上の市町村として表示または主張すること。
- 危険地域で精密AGIDを長期公開すること。
