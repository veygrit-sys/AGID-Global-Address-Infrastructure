# 住所写像論 日本語版 v1 付録E/F/G 増補草稿

位置づけ: 付録E 用語集、付録F 英語国際論文版への変換規則、付録G 可換図式挿入計画の増補版。

本付録は、日本語版v1を読みやすくし、後で英語国際論文版へ変換しやすくするための補助付録である。用語はAMT本体、検証、応用層を分けて整理する。AGID、AOID、ZKPは重要だが、AMT本体の定義ではなく応用層として扱う。

# 付録E 用語集

## E.1 中核概念

| 用語 | 説明 | 位置づけ |
| --- | --- | --- |
| 住所写像論 | 住所を文字列ではなく、実体、表現、観測、候補、クラスタ、履歴、文脈、品質、解決状態の写像系として扱う理論。 | AMT本体 |
| AMT | Address Morphism Theoryの略称。住所写像論の英語名。 | AMT本体 |
| 住所可能実体 | 住所によって参照、到達、識別、登録、検証され得る対象。建物、部屋、入口、道路、橋、川、湖、島、山、砂漠、遺跡、仮想住所などを含む。 | 定義 |
| 表面住所表現 | 人間またはシステムが入力、表示、検索する住所表現。文字列、郵便番号、座標、コード、旧住所、施設名、自然地名などを含む。 | 定義 |
| 世界状態 | 時点ごとの地理、行政、社会、出典、履歴、配送制約、品質状態を含む状態。 | 数理モデル |
| 観測空間 | 解決器が直接扱う正規化文字列、トークン、座標、郵便照合、地図候補、出典メタデータなどの集合。 | 数理モデル |
| 観測写像 | 住所可能実体から観測空間へ写る写像。一般に非単射であり、完全解決不能性の根拠になる。 | 数理モデル |
| 文脈 | 配送、行政、消防、不動産、自然地理検索、災害支援など、解決の目的と評価基準を決める条件。 | 数理モデル |
| 粒度 | 国、地域、街区、建物、入口、部屋、ロッカー、自然地物範囲など、解決対象の細かさ。 | AMT本体 |
| 住所的参照 | 住所表現が何らかの対象を指すこと。単なる文字列一致ではなく、文脈と出典に依存する。 | AMT本体 |

## E.2 写像と処理

| 用語 | 説明 | 位置づけ |
| --- | --- | --- |
| 解析写像 | 入力表現を言語、トークン、階層、郵便成分、座標、地物型へ分解する処理。 | 数理モデル |
| 展開写像 | 別名、旧称、翻訳、略称、表記揺れ、近傍候補を展開する処理。 | 数理モデル |
| 候補生成写像 | 入力表現からあり得る住所可能実体の候補集合を生成する写像。 | 数理モデル |
| 候補被覆 | 真の対象が候補集合に含まれている度合い。候補欠落があると後段では回復できない。 | 検証対象 |
| 構造的非類似度 | 地理距離、行政階層、郵便互換性、名称、言語、型、履歴、出典、鮮度などを含む候補間の差。通常の対称距離とは限らない。 | 数理モデル |
| クラスタ分割 | 候補集合を、同一参照とみなせる候補群へ分ける処理。文脈としきい値に依存する。 | 数理モデル |
| 住所同値類 | ある時点、文脈、粒度において同じ参照と扱える表現または候補の集合。 | 数理モデル |
| クラスタ代表 | クラスタを表示またはPID発行に用いる代表値。最長ラベルではなく証拠合意に基づくべきである。 | 実装方針 |
| 評価関数 | 候補またはクラスタの証拠強度、品質、鮮度、リスク、文脈適合性を評価する関数。真理そのものではない。 | 数理モデル |
| 解決ゲート | resolvedへ進めるか、ambiguous, unresolved, rejected, conditionalに保留するかを決める安全ゲート。 | AMT本体 |

## E.3 解決状態

| 用語 | 説明 | PID発行 |
| --- | --- | --- |
| resolved | 十分な証拠と品質があり、指定文脈と粒度で一つの参照に解決できる状態。 | 条件付きで可 |
| ambiguous | 複数候補が残り、一意に選べない状態。 | 不可 |
| unresolved | 候補、出典、品質、鮮度、履歴、粒度などが不足し、安全に解決できない状態。 | 不可 |
| rejected | 入力、出典、用途、ポリシー、リスクなどにより処理すべきでない状態。 | 不可 |
| conditional | 追加情報や追加証拠があれば解決できる可能性がある状態。 | 不可 |
| 非発行状態 | ambiguous, unresolved, rejected, conditionalの総称。誤ったPID発行を防ぐための正式状態。 | 不可 |

## E.4 出典、品質、検証

| 用語 | 説明 | 位置づけ |
| --- | --- | --- |
| 出典メタデータ | authority, jurisdiction, coverage, freshness, granularity, license, reliability, allowedUseなどを含む出典情報。 | AMT本体 |
| 公式出典 | 郵便局、行政、地理機関、登記機関などの公式データ。強い証拠になり得るが、鮮度と範囲を確認する。 | データ検証 |
| オープンソース出典 | OpenStreetMap、OpenFreeMap、公式オープンデータ、NASA等の公開データ。ライセンスと範囲を確認する。 | データ検証 |
| GIS検証 | 地理境界、地物、警告予算、出典登録状態を検証する方法。 | 検証 |
| 郵便ソース検証 | 国別住所形式、公式郵便API、オープンソースID、郵便番号照合の登録状態を検証する方法。 | 検証 |
| 品質スコア | 国、言語、地域、対象種別、出典、鮮度、履歴、候補被覆を使う内部制御値。ユーザーへ直接表示しない。 | AMT本体 |
| 品質しきい値 | 低品質タブ非表示、注意表示、再検証、PID非発行を決める内部しきい値。 | 数理モデル |
| 評判 | 配送成功、失敗、返品率、キャリア多様性、鮮度などから得る到達可能性の証拠。真理ではない。 | 数理モデル |
| unresolved履歴 | 未解決が多い地域、言語、地物型を検出し、データ改善につなげる履歴。 | 運用 |

## E.5 履歴、PID、監査

| 用語 | 説明 | 位置づけ |
| --- | --- | --- |
| 履歴グラフ | 住所、実体、表面表現、PID、制度変更、分裂、統合、廃止、不明を有向グラフとして扱うモデル。 | 数理モデル |
| 住所保存則 | 住所は無条件に消滅しないという定理ではない。履歴出典がある場合、後継、分裂、統合、廃止、不明として記録できる条件付き原理。 | 概念整理 |
| PID | AMTの安全ゲートを通過した参照に発行される永続識別子。入力文字列そのものではない。 | AMT本体 |
| PID発行許容述語 | 候補被覆、クラスタ一意性、品質、鮮度、低リスク、履歴整合性、監査可能性などの条件。 | 数理モデル |
| PID監査エンベロープ | 入力コミットメント、候補、クラスタ、決定、品質ポリシー、履歴更新などを含む監査構造。 | AMT本体 |
| PID継承 | 旧PIDから新PIDへ履歴関係を持たせること。分裂、統合、廃止を含む。 | 応用前段 |
| 誤統合 | 異なる対象を同じクラスタやPIDへまとめてしまう失敗。 | 失敗モード |
| 誤分割 | 同じ対象を複数クラスタやPIDへ分けてしまう失敗。 | 失敗モード |

## E.6 自然地理、文化地理、垂直参照

| 用語 | 説明 | 位置づけ |
| --- | --- | --- |
| 自然地理実体 | 川、滝、池、湖、山、谷、洞窟、島、砂漠、荒野、湿地、塩湖、氷原、氷河、草原、森林など。 | 住所可能実体 |
| 文化地理実体 | 遺跡、世界遺産、文化財、観光地、保護区、管理区域など。 | 住所可能実体 |
| 線状地物 | 道路、川、橋、海岸線など、線として扱う地物。 | 地物型 |
| 面状地物 | 湖、湿地、砂漠、森林、保護区など、面として扱う地物。 | 地物型 |
| 体積的実体 | 建物階、地下施設、立体区画、3D空間など。 | 地物型 |
| 垂直参照 | 同じ2D座標上に異なる階、部屋、地下、屋上、入口がある場合の参照。 | 数理モデル |
| ラベル点 | 地図上で地物名を表示するための代表点。地物範囲や入口とは一致しないことがある。 | GIS |
| アクセス点 | 登山口、橋の入口、港、湖岸、施設入口、配送入口など、実際に到達する点。 | 文脈依存 |
| 配送可能点 | 配送文脈で荷物を届けられる点。自然地物そのものとは異なることがある。 | 文脈依存 |

## E.7 セキュリティと応用層

| 用語 | 説明 | 位置づけ |
| --- | --- | --- |
| 高リスク住所情報 | 個人住所、居住履歴、配送先、私的AOID、正確座標など、公開すると危険な情報。 | セキュリティ |
| AGID | AMTを応用した公開地理参照識別子。通信、登録、監査、SDKなどの実装責務を持つ。 | 応用層 |
| AOID | AMTを応用した私的操作住所識別子。所有、委譲、配送、QR、個人端末保存などの責務を持つ。 | 応用層 |
| ZK Address Predicate | 住所を公開せずに、地域所属、居住、配送可能性、品質しきい値などの住所由来属性を証明する述語。 | 別論文 |
| credential | 住所、居住、配送可能性、年齢、地域などの資格証明。issuer trust, revocation, freshnessが必要。 | 別論文 |
| nullifier | 同一住所や同一AOIDの重複登録を本人情報なしに防ぐための一回性識別値。 | 別論文 |
| proof bundle | 複数のZK proofを同じscope, challenge, domain separationで束ねる構造。 | 別論文 |
| domain separation | 異なる証明や用途が衝突しないよう、領域名、scope、challengeを分けること。 | 別論文 |

# 付録F 英語国際論文版への変換規則

## F.1 基本方針

英語版は逐語訳ではなく、国際論文として再構成する。日本語版の着想の勢いは残しつつ、英語版では主張の強さ、証明状態、検証範囲、未検証範囲を明確にする。

## F.2 題名候補

| 候補 | 用途 |
| --- | --- |
| Address Morphism Theory | 基本題名。 |
| Address Morphism Theory: Safe Address Resolution under Ambiguity, History, and Context | 安全な住所解決を前面に出す題名。 |
| Address Morphism Theory: A Formal Framework for Ambiguous, Historical, and Contextual Address Reference | 形式理論として見せる題名。 |

## F.3 翻訳ではなく再構成する部分

| 日本語版の要素 | 英語版での扱い |
| --- | --- |
| 強い仮説 | HypothesisまたはPrincipleとして置き、検証状態を添える。 |
| 住所参照不可能性 | Main impossibility theoremとして中心に置く。 |
| 反例集 | Related failure modes and counterexamplesとして早めに置く。 |
| AGID/AOID | Application identifiersとして分離し、AMT本体の定義にしない。 |
| ZKP | Companion paperに分離し、本文ではsemantic predicatesへの橋渡しに留める。 |
| 商用API比較 | benchmark methodologyに限定し、常勝主張を避ける。 |
| 自然地理対応 | source-bound geospatial referenceとして扱い、完全網羅を主張しない。 |

## F.4 英語版で避ける表現

| 避ける表現 | 推奨表現 |
| --- | --- |
| AMT resolves every address in the world. | AMT provides a safe resolution framework and may abstain under insufficient evidence. |
| AMT is better than all commercial APIs. | AMT should be evaluated under shared datasets, metrics, jurisdictions, and use cases. |
| Address identity is always preserved. | Address references can be represented as lineage states when sufficient historical evidence exists. |
| ZKP proves that an address is true. | ZKP can prove selected predicates over AMT-derived credentials under issuer and freshness assumptions. |
| Quality score is truth. | Quality score is an internal control signal, not a truth value. |

## F.5 英語版の章構成への変換

1. Problem and motivation.
2. Addressable entities and surface expressions.
3. Formal setup.
4. Impossibility results.
5. Candidate generation and clustering.
6. Safe abstention states.
7. PID issuance and audit.
8. History and lineage.
9. Contextual optimality.
10. Compression and entropy.
11. Natural, cultural, and vertical references.
12. Quality, reputation, and source policy.
13. Verification methodology.
14. Security boundaries.
15. Limitations and future companion papers.

# 付録G 可換図式挿入計画

可換図式は、本文の理解を助ける場所に限定して置く。図式は証明そのものではなく、定義と処理の対応関係を読者に示すための補助である。

## G.1 AMT写像連鎖

挿入位置: 第7章 7.1 の後。

目的: 住所解決が一回の変換ではなく、解析、展開、候補生成、クラスタ、評価、解決結果、PID発行、履歴更新の連鎖であることを示す。

```text
S_t
  -- parse pi -->
Token_t
  -- expand epsilon_t -->
Expanded_t
  -- candidate Gamma_c_t -->
Candidates_t
  -- cluster Pi_delta_c_t -->
Clusters_t
  -- evaluate Q_c_t -->
R_t
  -- issue gate -->
PID or NonIssue
  -- history update -->
H_t_plus_1
```

## G.2 非単射観測と不可能性

挿入位置: 第6章 6.2 の後。

目的: 異なる実体が同じ観測へ潰れると、観測から実体への一意な逆写像が存在しないことを示す。

```text
x1 in X_t  -- O_t --> y
x2 in X_t  -- O_t --> y
x1 != x2

No condition-free resolver F can satisfy
F(O_t(x)) = x
for every x in X_t.
```

## G.3 候補生成と欠落

挿入位置: 第8章 8.7 の後。

目的: 真候補が候補集合に入らない場合、後段の評価やクラスタでは正解を回復できないことを示す。

```text
surface expression s
  -- Gamma_c_t -->
candidate set C_s

truth x is not in C_s

Then any selector over C_s cannot return x.
```

## G.4 クラスタ、同値類、PID

挿入位置: 第9章 9.8 または第11章 11.8 の後。

目的: PIDは表面文字列ではなく、参照同値類と発行ゲートを通過した対象に対応することを示す。

```text
surface forms
  -- candidate generation -->
candidates
  -- reference equivalence -->
reference class
  -- issue gate -->
class PID
```

## G.5 文脈相対性

挿入位置: 第14章 14.3 の後。

目的: 同じ入力でも、配送、行政、消防、不動産で最適出力が変わることを示す。

```text
input s
  -- context c1 --> result r1
  -- context c2 --> result r2

In general, r1 and r2 need not be identical.
```

## G.6 履歴グラフと条件付き住所保存

挿入位置: 第12章 12.4 の後。

目的: 住所は単純な現在値ではなく、後継、分裂、統合、廃止、不明を持つ履歴グラフとして扱うことを示す。

```text
old address state
  -- rename / administrative change / redevelopment -->
new address state

old PID
  -- inherit / split / merge / retire / unknown -->
new PID state
```

## G.7 自然地理とアクセス点

挿入位置: 第16章 16.8 の後。

目的: 山、湖、川、島、遺跡などでは、地物そのもの、表示点、アクセス点、配送可能点を分ける必要があることを示す。

```text
named geographic feature
  -- geometry -->
extent
  -- labeling -->
label point
  -- access analysis -->
access point
  -- context gate -->
addressable reference
```

## G.8 AMTと暗号拡張の分離

挿入位置: 第18章 18.6 の置換候補。

目的: AMTが意味論を提供し、ZKPやcredentialが秘匿証明を提供するという境界を示す。

```text
address input
  -- AMT semantic pipeline -->
reference class / attributes / audit envelope
  -- predicate extraction -->
address predicate
  -- ZK or credential layer -->
public proof statement
```

## G.9 検証マップ

挿入位置: 第21章 21.6 または付録D。

目的: Lean、GIS、実装テスト、郵便ソース検証、セキュリティレビューがそれぞれ別の性質を検証することを示す。

```text
AMT claim
  -- abstract structure --> Lean
  -- geospatial source --> GIS validation
  -- runtime behavior --> implementation tests
  -- source registry --> postal/source verification
  -- privacy and abuse --> security review
```

## G.10 PDF化時の注意

日本語PDFでは、図式をASCII図として保持してもよい。英語版または正式PDFでは、LaTeXのtikz-cdまたは通常の図表へ変換する。図式は読者補助であり、証明済み主張とは分けて扱う。
