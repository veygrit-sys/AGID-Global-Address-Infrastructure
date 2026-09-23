# 住所写像論 日本語版 v1 第2章以降 章別検証・編集バンドル

作成日: 2026-06-06

対象: `docs/address-morphism-theory-ja-v1-master.md` 第2章から第26章

目的: 第2章以降について、Leanで支えられる主張、GIS/実装/実験で支えられる主張、概念仮説として弱める主張、本文へ反映すべき編集差分を章別にまとめる。

## 0. 再実行した検証ログ

本バンドルでは、第2章以降に関係する検証を次の範囲で再実行した。

| 検証 | コマンド | 結果 | 用途 |
| --- | --- | --- | --- |
| Lean中核形式化 | `lean formal\AMTCore.lean` | pass | 参照不可能性、非発行状態、PID発行ゲート、同値関係、文脈相対性などの中核命題。 |
| GIS Lean証明書 | `npm run verify:gis:lean` | pass | `AMTCore.olean`, `AMTPaperExtensions.olean`, `GeneratedGisCertificate.lean` の生成と検証。 |
| GIS警告予算 | `npm run verify:gis:budget` | pass, features 351, errors 0, warnings 149/149, sources 408/408 | 自然地理・地物・ソース登録の検証予算。 |
| PID衝突リスク | `npm run verify:pid-risk` | pass, 128-bit, birthday upper bound 1.4693679385263966e-15 | PID発行章、監査章、限界章。 |
| 実装テスト | `npx tsx --test ...` | pass, 59 tests | 住所写像、自然住所、地物表示、住所タブ品質、住所検証、検索言語、PIDリスク。 |

注意: `formal\AMTPaperExtensions.lean` は単体の `lean` では import path が通らない。`npm run verify:gis:lean` が正しい再現経路であり、この経路では生成証明書まで通過した。

## 1. 第2章以降の編集原則

第2章以降は、導入ではなく理論本体である。したがって、第1章よりも厳しく、主張を次の四種類へ分ける。

1. Leanで証明済みの主張。
2. GIS、実装テスト、ベンチマークで経験的に支持される主張。
3. 理論的に有望だが、現時点では仮説として置く主張。
4. 応用論文、ZKP論文、AGID/AOID論文へ分離すべき主張。

本文では、1と2を強く書き、3は「仮説」「作業モデル」「評価対象」と明示し、4は境界章または別論文へ移す。

章同士の検証結果は、別紙 `address-morphism-theory-ja-v1-cross-chapter-evidence-map.md` のルールに従って相互参照してよい。特に、第6章、第10章、第11章、第12章、第14章は後続章の共通根拠として扱う。ただし、後続のケーススタディや応用実装を、前半の形式定理の証明根拠として逆向きに使ってはならない。

## 第2章 住所の基本仮説 - 参照、圧縮、通信、履歴

### 採用できる核

第2章は仮説章として残すのがよい。住所参照仮説、住所圧縮仮説、住所通信仮説、住所履歴仮説、社会的実体仮説は、すべて同じ強度で扱わない。参照仮説と圧縮仮説はLeanの不可能性命題と接続しやすい。履歴仮説は履歴グラフの形式化と接続できる。通信仮説と社会的実体仮説は、現時点では応用的・哲学的仮説として弱める。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 住所は対象を指す観測である | Leanで支持 | `no_condition_free_perfect_resolver`, `normalization_collision_prevents_perfect_resolution` |
| 住所は損失を伴う圧縮表現である | Leanで一部支持 | `noninjective_compression_no_perfect_decoder` |
| 住所は通信先として振る舞う | 概念仮説 | ルーティングモデル、配送/登録モデルの実装検証が必要 |
| 住所は履歴を持つ | Leanで支持 | `append_only_lineage_preserves_node`, `append_only_lineage_preserves_edge`, `append_only_lineage_preserves_trace` |
| 住所の同一性は社会的連続性を含む | 概念仮説 | 事例検証と履歴グラフによる制約が必要 |

### 本文への編集指示

第2章では、各仮説の末尾に「検証状態」を短く入れる。特に通信仮説と社会的実体仮説は、「本稿では主張ではなく作業仮説として採用する」と書く。

## 第3章 住所可能実体

### 採用できる核

第3章は、郵便住所を持つ建物だけでなく、道路、橋、水系、山地、島、文化財、仮想住所を住所写像論の対象に入れる章である。ここでは「住所可能性」と「配送可能性」を分離することが最重要である。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 住所可能実体は物理実体に限られない | 実装/GISで支持 | 自然住所、地物表示、GIS警告予算 |
| 必須属性が欠けると安全な属性ゲートを通過できない | Leanで支持 | `missing_required_attribute_prevents_attribute_gate` |
| 地物ソースは検証済み/未知/拒否を分ける必要がある | Leanで支持 | `unknown_source_prevents_verified_claim`, `rejected_source_prevents_verified_claim` |
| 世界中のすべての対象を完全に扱える | 不採用 | 対象範囲とデータソースを固定しない限り検証不能 |

### 本文への編集指示

「住所可能実体」の定義に、参照可能性、到達可能性、監査可能性、説明可能性を含める。ただし、郵便配送可能性は別属性として扱う。自然地理の列挙は残してよいが、「登録済みデータソースの範囲で」と限定する。

## 第4章 表面住所表現

### 採用できる核

第4章は、住所文字列、多言語表現、旧住所、郵便番号、座標コード、混合表現を、実体そのものから分離する章である。これはLeanの正規化衝突や改名不変性と相性がよい。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 表面表現は実体そのものではない | Leanで支持 | `normalization_collision_prevents_perfect_resolution` |
| 参照保存的な改名では同値類が保たれる | Leanで支持 | `equivalence_class_invariant_under_renaming`, `renamed_address_has_same_reference_class` |
| 検索言語はアプリ設定や住所表示言語から分離できる | 実装テストで支持 | `placeSearchLanguage.test.ts` |
| すべての言語表記を完全に展開できる | 不採用 | 言語資源と地名DBの範囲を明記する必要がある |

### 本文への編集指示

第4章には、表面表現を「観測値」として扱う図式を追加する。多言語検索については、「表示言語」と「検索リコールのための入力言語推定」を分けると明記する。

## 第5章 形式的準備

### 採用できる核

第5章は理論の型を揃える章である。世界状態、実体集合、表面表現、観測空間、文脈、候補生成、非類似度、クラスタ、評価関数、履歴グラフ、PIDをここで定義する。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 解決結果型は解決と保留を同じ型で扱う | Leanで支持 | `ResolutionOutcome`, `Abstains`, `ResolvesEntity` |
| 候補健全性は候補集合への所属を与える | Leanで支持 | `candidate_soundness_yields_membership`, `outcome_candidate_soundness_yields_membership` |
| 評価関数はしきい値とマージンを要する | Leanで支持 | `ScoreSelectable`, `score_selection_requires_threshold`, `tied_evidence_prevents_score_selection` |
| PID一意性は注入性または衝突リスク分析に依存する | Lean/実験で支持 | `injective_pid_has_no_collision`, `verify:pid-risk` |

### 本文への編集指示

第5章には記法表を追加する。特に、`Address`, `Observation`, `Entity`, `Context`, `Candidate`, `Cluster`, `Outcome`, `PID` を分ける。第5章で曖昧な言葉を残すと後続章全体が崩れるため、ここは最も慎重に整える。

## 第6章 住所参照不可能性定理

### 採用できる核

第6章はAMT本体の理論的中核である。完全解決器が無条件に存在しないことを、非単射観測、候補欠落、射影損失、正規化衝突、文脈衝突から説明する。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 非単射観測の下で無条件完全解決器は存在しない | Leanで証明済み | `no_condition_free_perfect_resolver` |
| 候補欠落は完全性を破る | Leanで証明済み | `missing_entity_refutes_candidate_completeness` |
| 地表射影だけでは垂直対象を区別できない | Leanで証明済み | `projection_collision_prevents_vertical_resolution` |
| 正規化衝突は完全解決を妨げる | Leanで証明済み | `normalization_collision_prevents_perfect_resolution` |
| 文脈衝突は絶対的最適住所を妨げる | Leanで証明済み | `conflicting_context_optima_prevent_absolute_address` |

### 本文への編集指示

第6章は強く書いてよい。ただし、「住所の真理は存在しない」とは書かない。正しくは「有限観測と非単射観測だけでは、対象の真の同一性を無条件に完全決定できない」である。

## 第7章 AMT写像連鎖

### 採用できる核

第7章は、住所解決を単発の変換ではなく、解析、展開、候補生成、構造比較、クラスタリング、評価、解決または保留、PID発行、履歴更新の連鎖として書く章である。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 候補がなければ発行できない | Leanで支持 | `missing_candidate_prevents_issue` |
| 高エネルギー、低マージン、低品質、低鮮度、高リスクは発行を止める | Leanで支持 | `high_energy_prevents_issue`, `low_margin_prevents_issue`, `low_quality_prevents_issue`, `stale_freshness_prevents_issue`, `high_risk_prevents_issue` |
| 明確候補はPIDへ解決できる | 実装テストで支持 | `addressMorphism.test.ts` |
| 近接タイは強制解決ではなく ambiguous になる | Lean/実装で支持 | `tied_evidence_prevents_score_selection`, `addressMorphism.test.ts` |

### 本文への編集指示

第7章には写像連鎖の可換図式を入れる。図式では、候補返却とPID発行を別ノードにする。これにより「候補を出す」ことと「永続識別子を発行する」ことの危険度差が明確になる。

## 第8章 候補生成と出典政策

### 採用できる核

第8章は、候補生成の品質がAMT全体の上限を決める章である。候補生成は多言語、別名、自然地理、履歴、公式ソース、地図ソースを扱うが、出典を検証済みとして扱うには条件が必要である。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 未知ソースや拒否ソースは検証済み主張に使えない | Leanで支持 | `unknown_source_prevents_verified_claim`, `rejected_source_prevents_verified_claim` |
| GIS証明書が受理されるにはエラー0が必要 | Lean/GISで支持 | `accepted_gis_certificate_has_no_errors`, `verify:gis:lean` |
| 多言語検索は入力文字列からヒントを作る | 実装テストで支持 | `placeSearchLanguage.test.ts` |
| 自然地理候補は地図ソースで補える | 実装/GISで支持 | `naturalAddress.test.ts`, `mapFeatureAddress.test.ts`, `verify:gis:budget` |

### 本文への編集指示

第8章には「候補生成は完全性を主張しない」と明記する。候補欠落がある場合は `unresolved` へ送る。公式郵便データとオープン地図データは同じ重みではなく、用途別に評価する。

## 第9章 クラスタと住所同値類

### 採用できる核

第9章は、表記の違いを同じ参照クラスへまとめる章である。ただし、クラスタは万能ではない。誤統合と誤分割があるため、同値関係、代表選択、粒度、安定性を分ける。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 参照同値関係は反射、対称、推移を持つ | Leanで支持 | `ref_equivalent_is_reflexive`, `ref_equivalent_is_symmetric`, `ref_equivalent_is_transitive` |
| 同じ参照は同じ参照クラスを与える | Leanで支持 | `same_reference_yields_same_reference_class` |
| 参照同値ならクラスPIDは保たれる | Leanで支持 | `class_pid_invariant_under_ref_equivalence` |
| 矛盾する証拠は参照同値を止める | Leanで支持 | `conflict_gate_prevents_ref_equivalence` |
| クラスタは近接連鎖で無制限に広がらない | 実装テストで支持 | `addressMorphism.test.ts` |

### 本文への編集指示

第9章では「同値類は表記より安定である」と書ける。ただし、「常に安定」ではない。安定性は改名、行政変更、履歴、証拠衝突の条件に依存する。

## 第10章 未解決状態の理論

### 採用できる核

第10章は、AMTの安全性を支える章である。`ambiguous`, `unresolved`, `rejected`, `conditional` は失敗ログではなく、誤発行を防ぐ正式状態である。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| ambiguous は対象を解決しない | Leanで証明済み | `ambiguous_resolves_no_entity` |
| unresolved は対象を解決しない | Leanで証明済み | `unresolved_resolves_no_entity` |
| rejected は対象を解決しない | Leanで証明済み | `rejected_resolves_no_entity` |
| 非発行状態は誤対象を発行しない | Leanで証明済み | `ambiguous_emits_no_false_entity`, `unresolved_emits_no_false_entity`, `rejected_emits_no_false_entity` |
| 近接タイは ambiguous、弱証拠は unresolved になる | 実装テストで支持 | `addressMorphism.test.ts` |

### 本文への編集指示

第10章は強く書いてよい。章末に「安全な非発行命題」を置く。UI、API、監査ログでこの状態がPID発行へ誤接続されないことは、実装テスト対象として残す。

## 第11章 安全な解決とPID発行

### 採用できる核

第11章は、候補表示とPID発行を分ける章である。PID発行は、候補、品質、鮮度、リスク、履歴整合性を満たす場合だけ許される。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 発行許容条件が満たされると候補を発行できる | Leanで支持 | `issue_if_admissible_emits_candidate` |
| 発行許容条件が満たされないと保留する | Leanで支持 | `issue_if_not_admissible_abstains` |
| 発行条件は復元可能で監査できる | Leanで支持 | `issue_if_admissible_requires_conditions` |
| PIDの衝突リスクは実装予算で扱う | 実験で支持 | `verify:pid-risk`, `pidCollisionRisk.test.ts` |

### 本文への編集指示

PIDを「絶対に衝突しない」と書いてはいけない。注入的PIDは理論モデルであり、実装上の有限長PIDは衝突リスク予算で扱う、と明記する。

## 第12章 履歴グラフと住所保存則

### 採用できる核

第12章は、住所を現在値ではなく履歴グラフとして扱う章である。住所保存則は強い名前だが、物理的に住所が消えないという意味ではない。参照関係が履歴写像により追跡される、という意味に限定する。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| append-onlyな履歴拡張は既存ノードを保つ | Leanで支持 | `append_only_lineage_preserves_node` |
| append-onlyな履歴拡張は既存エッジを保つ | Leanで支持 | `append_only_lineage_preserves_edge` |
| 履歴トレースは拡張後も保たれる | Leanで支持 | `append_only_lineage_preserves_trace` |
| 単純関数では分割を表せない | Leanで支持 | `functional_transition_cannot_represent_split` |

### 本文への編集指示

「住所は消滅せず写像される」は弱める。正しくは「AMTでは、住所参照の変化を履歴グラフ上の写像、分割、統合、訂正として記録する」である。

## 第13章 社会的連続性

### 採用できる核

第13章は挑戦的な章である。会社、店舗、世帯、避難者、施設の同一性は、地理だけでは決まらない。この主張は重要だが、Leanで完全に証明する対象ではなく、履歴グラフと制度的証拠により制約する仮説として扱う。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 地理だけでは社会的同一性を決められない | 概念的に支持 | 反例、移転、災害、法人継続 |
| 履歴グラフは社会的連続性の証拠を保持できる | Leanで一部支持 | 履歴グラフ保存命題 |
| 社会的連続性が住所同一性を常に決める | 不採用 | 事例ごとの制度判断が必要 |

### 本文への編集指示

この章は「定理」ではなく「社会的連続性仮説」として書く。反例を必ず置く。特に、なりすまし、商号継承、居住者変更、所有者変更、施設用途変更を限界として挙げる。

## 第14章 文脈相対的最適性

### 採用できる核

第14章は、配送、消防、行政、不動産、観光、災害支援で最適住所が変わることを扱う。これはLeanで比較的強く支えられる。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 二つの文脈で厳密に優れる解が異なれば普遍最適は壊れる | Leanで支持 | `strictly_better_context_blocks_universal_optimum` |
| 文脈衝突は絶対的住所を妨げる | Leanで支持 | `conflicting_context_optima_prevent_absolute_address` |
| 相対的レンダリングでもクラスPIDは保てる | Leanで支持 | `relative_rendering_preserves_class_pid` |

### 本文への編集指示

「住所の正しさは用途に依存する」と書ける。ただし、同一参照クラスを保つ場合と、参照対象そのものが変わる場合を分ける。

## 第15章 住所圧縮と住所エントロピー

### 採用できる核

第15章は魅力があるが、強く書きすぎると危険である。住所を圧縮として見ることは有効だが、都市化と住所情報量増加は経験的検証が必要である。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 非単射圧縮には完全復号器がない | Leanで支持 | `noninjective_compression_no_perfect_decoder` |
| ビット容量が不足すると全実体を覆えない | Leanで支持 | `insufficient_bit_capacity_prevents_capacity_cover` |
| 候補が複数なら残差ゼロとはいえない | Leanで支持 | `multiple_candidates_prevent_zero_residual` |
| 都市化と住所エントロピーの増加 | 実験課題 | 住所長、必要識別ビット数、候補集合エントロピーの国別測定が必要 |

### 本文への編集指示

第15章は「理論モデル」と「予想」を分ける。都市化の主張は、まだ「住所エントロピー仮説」として置く。

## 第16章 自然地理・文化地理・垂直参照

### 採用できる核

第16章は実装とGIS検証に強く支えられる章である。水系、山、島、砂漠、湿地、氷原、氷河、洞窟、谷、遺跡、世界遺産などを扱う。ただし完全網羅ではない。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 水系、山、湖、川、滝、島、砂漠などは表示可能な住所的文脈になる | 実装テストで支持 | `naturalAddress.test.ts`, `mapFeatureAddress.test.ts` |
| 垂直参照は2D座標だけでは扱えない | Leanで支持 | `projection_collision_prevents_vertical_resolution` |
| GIS検証対象はエラー0である | GISで支持 | `verify:gis:budget`, `verify:gis:lean` |
| 世界中のすべての島名や地物を認識できる | 不採用 | ソース範囲、名称範囲、ライセンス範囲が必要 |

### 本文への編集指示

第16章には「地図から取得してよいが、ソース、ライセンス、鮮度、地物型を明示する」と入れる。郵便住所のない地物は、配送可能住所ではなく参照住所として扱う。

## 第17章 評価関数、品質、評判

### 採用できる核

第17章は、スコアを真理ではなく運用上の判断補助として扱う章である。内部品質スコアはユーザーへ直接表示しない方針と整合する。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 選択にはしきい値とマージンが必要 | Leanで支持 | `score_selection_requires_threshold`, `tied_evidence_prevents_score_selection` |
| positive evidence は評判スコアを単調に上げる | Leanで一部支持 | `positive_evidence_monotone_reputation` |
| 都市、島、山地、砂漠、水域、極地を品質判定に反映できる | 実装テストで支持 | `addressTabQuality.test.ts` |
| 評価関数は住所真理そのものである | 不採用 | 評価は証拠重みであり、真理ではない |

### 本文への編集指示

「品質スコアをユーザーに表示しない」は設計方針として残す。品質スコアは非表示、注意表示、再検証対象、低品質タブ非表示などの内部判断に使う。

## 第18章 AMTと暗号拡張の境界

### 採用できる核

第18章は、AMT本体とZKP論文を分離するための境界章である。AMTは住所意味論、ZKPは秘匿証明である。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 公開述語が非単射なら秘密値を隠せる | Leanで支持 | `predicate_proof_collision_hides_private_value` |
| 公開主張が注入的なら秘密値を特定し得る | Leanで支持 | `injective_public_claim_identifies_private_value` |
| 受理された証明バンドルは秘密素材を露出しない | Leanで支持 | `accepted_proof_bundle_exposes_no_private_material` |
| 証明バンドルはドメイン分離を要求する | Leanで支持 | `accepted_proof_bundle_requires_domain_separation` |

### 本文への編集指示

ZKPの詳細は別論文へ送る。本章には「AMTだけでは暗号的秘匿を保証しない」「ZKPだけでは住所意味論の真実性を保証しない」と明記する。

## 第19章 PIDと応用識別子の境界

### 採用できる核

第19章は、PID、AGID、AOIDを混ぜないための章である。PIDはAMT本体の参照識別子、AGID/AOIDは応用または実装上の識別子である。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| PID一意性は注入性なら成立する | Leanで支持 | `injective_pid_has_no_collision` |
| 有限長PIDは衝突リスク予算で扱う | 実験で支持 | `verify:pid-risk` |
| AGID/AOIDはAMT本体を再定義しない | 設計方針 | 応用論文へ分離 |

### 本文への編集指示

第19章には「PIDは理論上の出力、AGID/AOIDは応用層」とする表を入れる。応用仕様の細部はAGID/AOID論文へ移す。

## 第20章 通信・登録・監査モデル

### 採用できる核

第20章は、住所を通信、登録、監査の対象として扱う応用寄りの章である。ここはAMT本体の中では軽くし、AGID/AOID応用論文で詳細化するのがよい。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 候補返却と登録は別操作である | Lean/実装で支持 | `issueIfAdmissible`, `addressMorphism.test.ts` |
| 監査エンベロープは発行条件を保存すべき | 設計方針 | PID発行ゲートと履歴更新ログが必要 |
| AGID/AOID全体の通信・登録・監査モデル | 応用論文対象 | AMT本体では境界だけ書く |

### 本文への編集指示

第20章では、通信モデルを抽象化する。具体的なAPI、MCP、買い物Agent、Polkadot連携は、応用章または別文書に分ける。

## 第21章 検証と再現性

### 採用できる核

第21章は、Lean、GIS、実装テスト、ベンチマーク、未検証項目を一つの再現性マップにまとめる章である。

### 検証対応

| 検証領域 | 状態 | 注意 |
| --- | --- | --- |
| Lean | `AMTCore.lean` pass, GIS Lean証明書 pass | 抽象命題は証明できるが、現実データの完全性は証明しない |
| GIS | 警告予算 pass | 登録済みソースと検証対象に限定 |
| 実装テスト | 59 tests pass | 実装ケースは代表例であり、世界全体の網羅ではない |
| ベンチマーク | 未完 | 商用API比較はデータセット固定が必要 |

### 本文への編集指示

第21章には、検証不能な主張を正直に書く。検証不能なものを削るのではなく、「検証可能な形へ変換する方法」を併記する。

## 第22章 セキュリティ・悪用・ガバナンス

### 採用できる核

第22章は、住所が高リスク情報であることを明示する章である。オープンソース化できる部分と公開すべきでない部分を分ける。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 住所処理はプライバシー、詐欺、誤配送、追跡リスクを持つ | 脅威モデル | セキュリティレビュー対象 |
| ZKやcredentialはAMT本体とは別レイヤで扱う | Leanで一部支持 | proof bundle 関連命題 |
| オープンソース化しても安全なコアと秘匿すべき運用情報を分ける | 設計方針 | AGID/AOIDセキュリティ文書へ接続 |

### 本文への編集指示

第22章には「攻撃者モデル」を追加する。住所そのもの、AOID秘密鍵、credential、配送履歴、監査ログ、nullifierを混ぜない。

## 第23章 ベンチマークと比較

### 採用できる核

第23章は、商用APIとの比較を扱うが、現時点では強い勝利宣言を書かない。Loqate、Experian、Melissa、Smartyに負けない品質を目指すことは目標として書けるが、実証にはデータセット、国、用途、指標が必要である。

### 検証対応

| 主張 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 比較には同一データセットと同一指標が必要 | 方法論として採用 | recall@k, precision, unresolved率, false issue率 |
| 商用APIに全用途で勝てる | 不採用 | 有料APIの非公開データと国別差がある |
| AMTは安全な非発行を指標化できる | Lean/実装で支持 | 非発行状態、PID発行ゲート |

### 本文への編集指示

第23章は「比較方針」に留める。勝敗ではなく、評価軸を定義する章にする。

## 第24章 ケーススタディ

### 採用できる核

第24章は、理論を読者に理解させるための事例章である。第1章の抽象主張を、部屋、郵便番号、垂直参照、旧住所、避難所、山、湖、川、砂漠、湿地、世界遺産、秘匿配送に落とす。

### 検証対応

| 事例 | 検証状態 | 対応する根拠 |
| --- | --- | --- |
| 1階店舗と2階事務所 | Leanで支持 | `projection_collision_prevents_vertical_resolution` |
| 同一郵便番号の複数住宅 | Lean/実装で支持 | 非単射観測、住所検証テスト |
| 山・湖・川・島 | 実装で支持 | `naturalAddress.test.ts`, `mapFeatureAddress.test.ts` |
| 砂漠・湿地・氷原 | 実装で支持 | `naturalAddress.test.ts`, `addressTabQuality.test.ts` |
| 配送可能だが住所非公開のEC | ZKP別論文対象 | AMT本体では概念例に留める |

### 本文への編集指示

第24章は例を多く入れてよい。ただし、各例の末尾に「AMTが解く部分」と「AMTだけでは解かない部分」を入れる。

## 第25章 限界

### 採用できる核

第25章は論文の信頼性を上げる章である。完全解決、暗号安全性、品質スコア、自然地理、社会的連続性、商用API比較の限界を明記する。

### 検証対応

| 限界 | 根拠 |
| --- | --- |
| 完全解決は保証しない | `no_condition_free_perfect_resolver` |
| 暗号安全性はAMT本体では保証しない | ZKP境界章 |
| 品質スコアは真理ではない | 評価関数章、評判章 |
| 自然地理はソース範囲に依存する | GIS検証境界 |
| 商用API比較はデータセット固定が必要 | ベンチマーク章 |

### 本文への編集指示

第25章は削らない。むしろ強くする。反例と限界を書くことで、第6章の不可能性定理と全体が整合する。

## 第26章 結論

### 採用できる核

第26章では、AMTの核を次のようにまとめる。

1. 住所は文字列、座標、郵便番号、地名のいずれか一つではなく、対象参照を形成する観測と証拠の体系である。
2. 非単射観測、候補欠落、射影損失、正規化衝突、文脈衝突の下では、無条件完全解決器は存在しない。
3. したがって、住所解決には `resolved` だけでなく、`ambiguous`, `unresolved`, `rejected` が必要である。
4. PID発行は候補表示より強い操作であり、品質、鮮度、リスク、履歴整合性、監査性を必要とする。
5. AGID/AOID、ZKP、Credential、MCP、買い物Agent、Polkadotなどは応用層であり、AMT本体から分離して扱う。

### 本文への編集指示

結論では、過剰な未来予測を避ける。AMTは「世界中の住所を完全解決する理論」ではなく、「解決、保留、拒否、履歴、評価、識別子発行を安全に分ける住所意味論」として締める。

## 2. 章別PDF化の提案

第2章以降は、最終的には次の単位でPDF化するのがよい。

```text
chapter-02-verification-bundle.pdf
chapter-03-verification-bundle.pdf
...
chapter-26-verification-bundle.pdf
```

ただし、最初から25本のPDFを手で編集すると管理が重くなる。まず本バンドルを母艦として作り、各章の内容が固まったら分割PDFにする方が安全である。

推奨する最終構成は次の通りである。

1. 論文本体PDF。
2. 章別検証PDF一式。
3. Lean証明対応表PDF。
4. GIS/実装/実験検証PDF。
5. 未検証・反例・限界PDF。

本文に統合するのは、各章の「採用できる核」と「本文への編集指示」である。検証対応表は、本文では短く、付録または companion PDF で詳しく扱う。
