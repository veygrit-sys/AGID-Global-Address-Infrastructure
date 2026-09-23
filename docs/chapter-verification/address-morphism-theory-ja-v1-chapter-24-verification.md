# 住所写像論 日本語版 v1 第24章 検証ノート

対象: 第24章「ケーススタディ」

本ノートは、第24章で扱うケーススタディが、住所写像論の検証済み主張からはみ出していないかを確認するためのものである。対象例は、中央ビル501号室、同一郵便番号の複数住宅、1階店舗と2階事務所、旧住所から新住所、避難所と仮設住宅、山・湖・川・島、砂漠・湿地・氷原、世界遺産、配送可能だが住所非公開のECである。

結論を先に述べると、第24章は採用してよい。ただし、現在の原文は短いため、各例の末尾に必ず次の二つを入れるべきである。

1. AMTが解く部分。
2. AMTだけでは解かない部分。

第24章の安全な中心文は次である。

> ケーススタディは、AMTの定理を証明するものではない。ケーススタディは、非単射観測、垂直参照、履歴グラフ、自然地理、品質ゲート、秘匿属性という既に定義されたモデルが、具体的な住所問題でどのように働くかを示す説明装置である。

この表現なら、第24章が第6章や第11章を循環的に証明しているように見えず、安全に読者向けの実例章として機能する。

## 1. 検証結果の要約

| 事例 | 判定 | 根拠 |
|---|---:|---|
| 中央ビル501号室 | 採用 | 建物、部屋、配送到達点を分ける必要がある。PID発行ゲートと住所検証テストで支持される。 |
| 同一郵便番号の複数住宅 | 採用 | 郵便番号は単一実体識別子ではない。非単射観測、ambiguous、unresolvedで扱える。 |
| 1階店舗と2階事務所 | Leanで支持 | `projection_collision_prevents_vertical_resolution` が二次元射影の限界を示す。 |
| 旧住所から新住所 | Lean/実装で支持 | `functional_transition_cannot_represent_split`、append-only lineage、PID lifecycle split/merge tests。 |
| 避難所と仮設住宅 | 採用 | 一時的住所的対象として扱えるが、個人支援情報は公開AGIDに混ぜない。 |
| 山・湖・川・島 | 実装で支持 | `naturalAddress.test.ts`、`mapFeatureAddress.test.ts`、`addressUtils.natural.test.ts`。 |
| 砂漠・湿地・氷原 | 実装で支持 | sparse natural geography、品質ゲート、再検証対象として扱える。 |
| 世界遺産 | 実装で支持 | ruins、world heritage、landscape labelsを地物として扱うテストが通過。 |
| 配送可能だが住所非公開のEC | 境界付き採用 | AMT本体は配送可能性属性の意味論まで。暗号的秘匿証明は住所写像論IIに分離する。 |

## 2. 実行した検証

| 検証 | コマンド | 結果 |
|---|---|---:|
| Lean中核 | `lean formal\AMTCore.lean` | 成功 |
| Lean拡張 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | 成功 |
| GIS警告予算 | `npm run verify:gis:budget` | 成功 |
| 郵便ソース静的検証 | `npm run verify:postal-sources` | 成功 |
| ケーススタディ関連代表実装テスト | `npx tsx --test ...` | 97 tests pass |

GIS警告予算の結果は次である。

```text
features: 351
errors: 0/0
warnings: 149/149
registered sources: 408/408
result: pass
```

郵便ソース静的検証の結果は次である。

```text
addressFormatFiles: 281
registeredOpenSourceIds: 408
uniquePostalApis: 89
uniquePostalProbeTargets: 201
staticIssueCount: 0
liveProbeEnabled: false
```

代表実装テストには次の主なファイルを含めた。

```text
src/lib/addressMorphism.test.ts
src/lib/addressMorphismSources.test.ts
src/lib/addressVerificationEngine.test.ts
src/lib/addressVerificationPolicy.test.ts
src/lib/pidIssuanceAudit.test.ts
src/lib/pidLifecycleProof.test.ts
src/lib/naturalAddress.test.ts
src/lib/mapFeatureAddress.test.ts
src/lib/addressUtils.natural.test.ts
src/lib/addressTabQuality.test.ts
src/lib/addressQualitySummary.test.ts
src/lib/privateAddressPredicateProof.test.ts
src/lib/qualityThresholdProof.test.ts
src/lib/regionMembershipProof.test.ts
```

テスト結果は次である。

```text
tests 97
pass 97
fail 0
duration_ms 1545.0373
```

## 3. Leanで支えられるケース

### 3.1 垂直参照

Lean定理:

```text
projection_collision_prevents_vertical_resolution
```

意味:

同じ二次元射影を持つ複数の垂直対象は、二次元座標だけでは区別できない。したがって、1階店舗と2階事務所、建物と501号室、入口と配送ロッカーは、同じ緯度経度に見えても同じ住所的実体とは限らない。

第24章での使い方:

中央ビル501号室、1階店舗と2階事務所の例では、建物レベルの解決、部屋レベルの解決、配送到達点レベルの解決を分ける。

### 3.2 非発行状態

Lean定理:

```text
ambiguous_resolves_no_entity
unresolved_resolves_no_entity
ambiguous_emits_no_false_entity
unresolved_emits_no_false_entity
low_quality_prevents_issue
```

意味:

曖昧な入力や証拠不足の入力は、無理に単一PIDへ解決しない。郵便番号だけの入力、部屋番号不明、弱い自然地理出典、複数後継住所は、ambiguousまたはunresolvedとして扱える。

第24章での使い方:

同一郵便番号の複数住宅、中央ビル501号室、旧住所から新住所、砂漠・湿地・氷原の例に使う。

### 3.3 履歴グラフ

Lean定理:

```text
functional_transition_cannot_represent_split
append_only_lineage_preserves_node
append_only_lineage_preserves_edge
append_only_lineage_preserves_trace
```

意味:

旧住所から新住所への対応は、単純な関数では表せない場合がある。分割、統合、町名変更、再開発、仮設住宅への一時移動は、履歴グラフとaccepted transitionとして扱う必要がある。

第24章での使い方:

旧住所から新住所、避難所と仮設住宅、再建住所の例に使う。

### 3.4 文脈相対性

Lean定理:

```text
conflicting_context_optima_prevent_absolute_address
strictly_better_context_blocks_universal_optimum
```

意味:

配送、消防、観光、文化財管理、不動産では、最適な住所出力が異なることがある。湖そのもの、湖畔施設、観光入口、管理区域、配送可能地点は同じではない。

第24章での使い方:

山・湖・川・島、世界遺産、避難所、秘匿配送の例に使う。

## 4. ケース別検証

### 4.1 中央ビル501号室

原文の主張:

建物は特定できても、501号室が存在するか、配送可能か、入口はどこかは別問題である。

検証:

この主張は採用できる。`addressVerificationEngine.test.ts` では street and house-level addresses の検証、`pidIssuanceAudit.test.ts` では unresolved gate、history update、PID issuanceを通過した場合だけPID監査proofを出すことが確認されている。

AMTが解く部分:

建物レベル、部屋レベル、配送到達点レベルを分ける。部屋番号や入口情報が不足する場合、建物レベルではpartialまたはverifiedでも、部屋レベルではunresolvedになりうる。

AMTだけでは解かない部分:

実際に501号室が存在するか、入居者が正当か、配送業者がその入口を使えるかは、建物内部データ、配送事業者データ、credential、現地確認が必要である。

### 4.2 同一郵便番号の複数住宅

原文の主張:

郵便番号は配送区域や経路の圧縮であり、単一実体の識別子ではない。

検証:

この主張は採用できる。Leanの非単射観測と、`proxy_residual_forces_ambiguous_abstention`、住所検証テストの postcode-only partial behavior が対応する。郵便番号だけの入力は、候補集合を作る助けにはなるが、単一PIDを発行する根拠にはならない。

AMTが解く部分:

郵便番号を候補生成、地域制約、配送区域の証拠として扱う。

AMTだけでは解かない部分:

郵便番号だけで家、部屋、受取人、配送地点を特定しない。

### 4.3 1階店舗と2階事務所

原文の主張:

同じ緯度経度上に、1階店舗と2階事務所がある場合、二次元座標だけでは区別できない。

検証:

Leanの `projection_collision_prevents_vertical_resolution` により支持される。二次元座標は証拠の一つだが、階、部屋、入口、テナント、配送経路、建物内部参照なしに垂直対象を完全解決することはできない。

AMTが解く部分:

二次元座標、建物ID、階、部屋、入口、テナント、配送動線を別の証拠成分として扱う。

AMTだけでは解かない部分:

建物内部の正確な部屋台帳や入居者情報を、公開地図データだけから自動的に得ることはできない。

### 4.4 旧住所から新住所

原文の主張:

旧住所の現在住所への対応は一対一とは限らない。

検証:

Leanの `functional_transition_cannot_represent_split` と append-only lineage theorem、`pidLifecycleProof.test.ts` の merge/split proof tests により支持される。

AMTが解く部分:

旧住所を履歴グラフのノードとして扱い、accepted transition、correction edge、split、mergeを記録する。

AMTだけでは解かない部分:

行政変更の全履歴、地権者履歴、再開発境界、私的移転履歴を自動的に真とみなすことはできない。出典と更新時点が必要である。

### 4.5 避難所と仮設住宅

原文の主張:

災害時には、避難所、仮設住宅、支援拠点、物資受取地点が一時的な住所的対象になる。

検証:

この主張は概念的に採用できる。第12章の履歴グラフと第22章の高リスク住所情報原則に接続する。ただし、実装テストは主にPID lifecycle、private address predicate、region membership、quality gateを支えており、特定災害データセットの大規模検証は未実施である。

AMTが解く部分:

通常住所、避難所、仮設住宅、支援拠点、再建住所を、時間付き・目的付きの住所可能実体として扱う。

AMTだけでは解かない部分:

被災者の本人情報、支援資格、避難所内の居場所、物資配布履歴を公開地理参照に混ぜてはならない。人道支援IDや秘匿credentialは応用層で扱う。

### 4.6 山・湖・川・島

原文の主張:

山、湖、川、島は郵便住所ではない場合が多いが、検索、観光、災害対応、環境調査では重要である。

検証:

この主張は実装で強く支持される。`naturalAddress.test.ts`、`mapFeatureAddress.test.ts`、`addressUtils.natural.test.ts` では、mountain、lake、river、waterfall、island、archipelago、marine、waterfront、shorelineなどの表示と候補化が通過している。

AMTが解く部分:

自然地理を点ではなく、線、面、アクセス点、周辺施設、plus code、open source evidenceを持つ住所可能実体として扱う。

AMTだけでは解かない部分:

世界中の全ての山名、湖名、川名、島名を完全認識したとは主張しない。認識可能性はOpenStreetMap、GeoNames、Natural Earth、NASA、UNESCOなどのsource coverageに依存する。

### 4.7 砂漠・湿地・氷原

原文の主張:

砂漠、湿地、氷原では、通常住所よりも自然地理名、観測点、基地、経路、季節的到達可能性が重要になる。

検証:

この主張は実装で支持される。`naturalAddress.test.ts` は desert、desert-like sparse natural addresses、named wilderness、salt lake、ice fieldを扱う。`addressTabQuality.test.ts` は desert、sparse natural geography、polar、water、island、urban、ruralの品質制御を扱う。

AMTが解く部分:

自然地理名、座標、近傍地物、アクセス点、品質スコア、出典を組み合わせ、必要ならreverification-requiredまたはunresolvedにする。

AMTだけでは解かない部分:

季節的到達可能性、現地危険性、基地運用、軍事・保護区域の可否を自動的に保証しない。

### 4.8 世界遺産

原文の主張:

世界遺産は単一の点ではない場合があり、複数区域、緩衝地帯、管理施設、観光入口がある。

検証:

この主張は、`mapFeatureAddress.test.ts` の landscape、ruins、world heritage labels のテストにより部分的に支持される。ただし、UNESCO全リスト、各国文化財台帳、緩衝地帯ポリゴンの網羅的検証は未実施である。

AMTが解く部分:

世界遺産本体、区域、入口、管理施設、関連文化財を、文脈別の住所可能実体として分ける。

AMTだけでは解かない部分:

文化財境界の法的確定、緩衝地帯の管理権限、観光入口の最新運用は、公式出典と現地情報が必要である。

### 4.9 配送可能だが住所非公開のEC

原文の主張:

ECサイトや買い物Agentでは、完全な住所を渡さず、「配送可能である」ことだけを示せればよい場面がある。

検証:

この主張は、AMT本体では概念例として採用する。実装では `privateAddressPredicateProof.test.ts`、`regionMembershipProof.test.ts`、`qualityThresholdProof.test.ts` が、住所を出さずにdelivery region、residence predicate、quality thresholdなどを扱う方向を支持する。ただし、これは住所写像論IIの対象であり、AMT本体の数理的意味論から暗号プロトコルの完全安全性を導いてはならない。

AMTが解く部分:

配送可能性属性、地域所属、品質しきい値、監査エンベロープの意味論を定義する。

AMTだけでは解かない部分:

ゼロ知識証明のsoundness、zero-knowledge、witness leakage、回路監査、鍵管理、credential発行者の信頼性は別論文または応用層で扱う。

## 5. ケーススタディ章に入れるべき表

第24章には、次の表を追加すると全体が締まる。

| 例 | 解決粒度 | 返すべき状態 | 主な追加証拠 |
|---|---|---|---|
| 中央ビル501号室 | 建物、部屋、配送到達点 | partial、unresolved、verified | 建物内部台帳、入口、配送履歴 |
| 同一郵便番号 | 郵便区域 | ambiguous、additional-evidence-required | 町名、番地、建物名 |
| 1階店舗と2階事務所 | 垂直区画 | unresolved unless vertical evidence exists | 階、部屋、テナント、入口 |
| 旧住所 | 履歴ノード | resolved、ambiguous、unresolved | 行政変更履歴、lineage edge |
| 避難所 | 一時的住所的対象 | partial、verified with scope | 災害時公式情報、支援credential |
| 山・湖・川・島 | 自然地理対象 | partial、verified with source | OSM、GeoNames、hydrology、plus code |
| 砂漠・湿地・氷原 | sparse natural entity | reverification-required、unresolved | 座標、観測点、基地、季節情報 |
| 世界遺産 | 文化的地物 | partial、context-specific resolved | UNESCO、文化財台帳、入口情報 |
| 秘匿配送EC | 属性 | proof-ready predicate | credential、ZK proof、scope、freshness |

## 6. 反例と注意点

### 6.1 ケーススタディから定理を逆証明しない

反例:

第24章の山や湖の例がうまく動いたため、全世界の自然地理名が認識できる、と書く。

修正:

ケーススタディは、登録済みソースとテスト対象において自然地理表示が成立する例である。全世界coverageの証明ではない。

### 6.2 品質スコアを真理値にしない

反例:

砂漠や島の品質スコアが高いので、その住所が真である、と書く。

修正:

品質スコアは内部制御であり、真理ではない。低品質なら非表示、注意、再検証、unresolvedを選ぶための判断補助である。

### 6.3 ZKP例でAMT本体を暗号化しない

反例:

秘匿配送ができるので、AMT本体がゼロ知識証明を含む、と書く。

修正:

AMT本体は意味論を定義する。ゼロ知識住所述語は住所写像論IIで扱う。

## 7. 本文に採用できる原則

### 原則24.1 解決粒度分離原則

建物、部屋、入口、配送到達点、自然地理本体、アクセス点、文化財区域は、同じ住所粒度として扱ってはならない。

### 原則24.2 ケーススタディ非証明原則

ケーススタディは理論の直観を与えるが、定理の証明ではない。証明はLean、定義、補題、検証ログ、データセットで行う。

### 原則24.3 解く部分と解かない部分の併記原則

各例では、AMTが解く部分と、外部出典、credential、配送事業者、行政、暗号層に依存する部分を併記しなければならない。

### 原則24.4 自然地理source-bound原則

自然地理・文化地物の住所表示は、出典に束縛された主張であり、全世界網羅主張ではない。

### 原則24.5 秘匿配送分離原則

配送可能性や地域所属の意味論はAMTで扱えるが、住所を秘匿したまま証明する暗号プロトコルは別論文または応用層で扱う。

## 8. 第24章の結論

第24章は、抽象的な住所写像論を読者に理解させるための重要な章である。中央ビル501号室、郵便番号、垂直参照、旧住所、避難所、自然地理、世界遺産、秘匿配送の各例により、AMTが「住所を常に解く理論」ではなく、「どの粒度で解き、どこで保留し、どの証拠を追加し、どの情報を公開しないかを定義する理論」であることが見える。

したがって、第24章の最後は次のように閉じるのがよい。

> これらのケーススタディに共通するのは、住所が単なる文字列でも、単なる座標でも、単なる郵便番号でもないという点である。住所は、文脈、粒度、履歴、出典、到達可能性、公開可能性によって形を変える参照構造である。AMTは、その構造を解決、保留、履歴、監査、秘匿属性へ分解するための理論である。
