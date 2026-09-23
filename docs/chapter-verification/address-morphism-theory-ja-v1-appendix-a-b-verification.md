# 住所写像論 日本語版 v1 付録A/B 検証ノート

対象: 付録A「中核記法」および付録B「定義・命題・補題・定理・系一覧」

結論: 付録A/Bは採用できる。ただし、付録Bは「証明済み一覧」ではなく「本文全体の主張カタログ」として扱うべきである。各項目には、Leanで形式化済み、実装テストで支持、GISまたはデータ検証で支持、概念整理、今後検証、のいずれかを明記する必要がある。

## 1. 検証結果の要約

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| 付録Aの中核記法 | 採用可 | 第1章から第26章の本文で使われる概念と概ね一致する。 |
| `E_t` | 注意して採用 | 住所可能実体集合として使うならよい。ただし評価関数と混同しないよう、評価側は `Q_t` または `Score_t` に固定する。 |
| `Q_t` | 採用可 | 第17章、第25章、第26章、品質しきい値テストと整合する。 |
| `R_t` | 採用可 | resolved, ambiguous, unresolved, rejected, conditional を含む結果型として、Leanと実装に支持される。 |
| `H_t` | 採用可 | append-only lineageのLean定理とPID lifecycle testsに支持される。 |
| PID | 採用可 | PID発行は安全ゲート、監査、品質、鮮度、リスクの条件付きで扱う必要がある。 |
| 付録Bの定義一覧 | 採用可 | 章ごとの用語整理として有効。 |
| 付録Bの補題・命題・定理一覧 | 条件付き採用 | Leanで証明済みのものと、実験または概念整理のものを分ける必要がある。 |
| AGID/AOID/ZKP関連項目 | 本体から分離 | AMT本体では応用例または別論文への橋渡しに留める。 |

## 2. 実行した検証

以下を再実行し、付録A/Bが参照する中核概念と検証済み主張が現在のリポジトリ状態で崩れていないことを確認した。

| 検証 | 結果 |
| --- | --- |
| `lean formal/AMTCore.lean` | pass |
| `LEAN_PATH=formal lean formal/AMTPaperExtensions.lean` | pass |
| `npm run verify:gis:budget` | pass, 351 features, 0 errors, 149 warnings within budget, 408 registered sources |
| `npm run verify:postal-sources` | pass, 281 address format files, 408 open-source ids, 89 postal APIs, 201 probe targets, 0 static issues |
| `npm run verify:pid-risk` | pass, 128 bits, max issued 1000000000000, birthday upper bound 1.4693679385263966e-15, required bits 119, safety margin 9 bits |
| representative TypeScript tests | pass, 118 tests |

## 3. 付録Aの記法検証

付録Aは、本文で散らばる記法を一か所に集約する役割を持つ。これは読者にとって重要であり、英語国際論文版へ展開するときにも有効である。

ただし、記法は次のように整えるとよい。

| 現行記法 | 推奨 | 理由 |
| --- | --- | --- |
| `t` | 維持 | 時点依存性はAMT全体の基礎である。 |
| `W_t` | 維持 | 世界状態を明示すると、地理、行政、出典、履歴の変化を扱いやすい。 |
| `E_t` | 維持。ただし実体集合専用にする | 住所可能実体集合を表すには適切。評価関数には使わない。 |
| `S_t` | 維持 | 表面住所表現集合を表す。第4章と整合する。 |
| `C` | 維持 | 文脈相対性原理と第14章に接続する。 |
| `O_t` | 維持 | 観測写像は参照不可能性定理の入口である。 |
| `pi` | 維持 | 解析写像として使う。ただし本文PDFではUnicode記号だけに依存しない説明を併記する。 |
| `epsilon_t` | 維持 | 展開写像として多言語、旧称、別名、近傍候補に接続する。 |
| `Gamma_t` | 維持 | 候補生成写像。候補完全性を主張しすぎない注記が必要。 |
| `D_t` | 維持 | 構造的非類似度。対称距離ではなく、方向付きまたは多成分非類似度として説明する。 |
| `Pi_delta_t` | 維持 | クラスタ分割。しきい値依存性を明記する。 |
| `Q_t` | 維持 | 品質評価関数。真理値ではなく内部制御値であると書く。 |
| `R_t` | 維持 | 解決結果型。非発行状態を正式状態として含める。 |
| `H_t` | 維持 | 履歴グラフ。第12章とAddress Lineageに接続する。 |
| PID | 維持 | AMT本体ではPID発行条件と監査だけを扱い、AGID/AOIDの詳細は応用論文に分離する。 |

## 4. Leanで形式化済みの主要対応

付録Bに載せるべき主張のうち、形式検証により強く書けるものは次である。

| 主張 | Lean名 | 付録Bでの分類 |
| --- | --- | --- |
| 非単射観測の下では無条件完全解決器は存在しない | `no_condition_free_perfect_resolver` | 定理 |
| 候補健全性は候補集合所属を与える | `candidate_soundness_yields_membership`, `outcome_candidate_soundness_yields_membership` | 補題 |
| ambiguous, unresolved, rejected は特定実体を解決しない | `ambiguous_resolves_no_entity`, `unresolved_resolves_no_entity`, `rejected_resolves_no_entity` | 命題 |
| ambiguous, unresolved, rejected は誤実体を発行しない | `ambiguous_emits_no_false_entity`, `unresolved_emits_no_false_entity`, `rejected_emits_no_false_entity` | 命題 |
| 発行許容条件が満たされないと発行しない | `issue_if_not_admissible_abstains` | 定理または命題 |
| 候補欠落は発行を防ぐ | `missing_candidate_prevents_issue` | 補題 |
| 高エネルギー、低マージン、低品質、低鮮度、高リスクは発行を防ぐ | `high_energy_prevents_issue`, `low_margin_prevents_issue`, `low_quality_prevents_issue`, `stale_freshness_prevents_issue`, `high_risk_prevents_issue` | 補題 |
| 候補欠落は候補完全性を破る | `missing_entity_refutes_candidate_completeness` | 補題 |
| 正規化衝突は完全解決を妨げる | `normalization_collision_prevents_perfect_resolution` | 補題 |
| 2D射影だけでは垂直対象を区別できない | `projection_collision_prevents_vertical_resolution` | 補題 |
| 関数的履歴遷移は分裂を表せない | `functional_transition_cannot_represent_split` | 補題 |
| 同値関係としての住所同値類 | `ref_equivalent_is_reflexive`, `ref_equivalent_is_symmetric`, `ref_equivalent_is_transitive` | 定義と補題 |
| 同値類PIDは参照同値性の下で不変 | `class_pid_invariant_under_ref_equivalence` | 補題 |
| 文脈衝突は絶対的住所を妨げる | `conflicting_context_optima_prevent_absolute_address` | 定理 |
| 二つの文脈で厳密優位が分かれると普遍最適は壊れる | `strictly_better_context_blocks_universal_optimum` | 定理 |
| 付録D系のGIS検証証明書はエラーなしを要求する | `accepted_gis_certificate_has_no_errors` | 検証補題 |

## 5. 実装・GIS・郵便データで支持される対応

付録Bの一部はLean単独ではなく、実装テスト、GIS検証、郵便ソース検証により支えられる。

| 主張 | 検証 |
| --- | --- |
| 候補生成、クラスタ、unresolved、履歴更新、PID発行の監査流れ | `pidIssuanceAudit.test.ts` |
| PID merge/splitの履歴正当性 | `pidLifecycleProof.test.ts` |
| 自然地理名、道路、橋、山、川、湖、島、砂漠、湿地、氷原、遺跡、世界遺産の表示 | `naturalAddress.test.ts`, `mapFeatureAddress.test.ts` |
| 国別・言語別の住所タブ品質制御 | `addressTabQuality.test.ts`, `addressQualitySummary.test.ts` |
| 住所検証エンジンの郵便番号・国別ポリシー | `addressVerificationEngine.test.ts`, `addressVerificationPolicy.test.ts`, `addressVerificationBenchmark.test.ts` |
| 多言語地名検索はアプリ設定や住所表示言語から分離 | `placeSearchLanguage.test.ts`, `searchQuery.test.ts` |
| 住所を秘匿したまま配送可能性や居住述語を証明する方向 | `privateAddressPredicateProof.test.ts`, `qualityThresholdProof.test.ts`, `zkProofCompatibility.test.ts` |
| GIS出典の登録と警告予算 | `verify:gis:budget` |
| 公式郵便・オープンソース登録 | `verify:postal-sources` |

## 6. 付録Bで修正すべき点

付録Bは現状でも有用だが、次の修正が必要である。

1. 「状態」列だけでは弱い。`検証状態` 列を追加し、Lean、実装、GIS、データ、概念、未検証を分ける。
2. 「後続で形式化」という表現は曖昧なので、「未形式化だが検証計画あり」または「実装テストで支持」に分ける。
3. 定理名は、実際のLean定理名と対応付ける。対応がない場合は論文上の定理として扱い、形式証明済みとは書かない。
4. AGID、AOID、ZKP、Polkadot、MCP、買い物AgentなどはAMT本体の定理ではなく、応用層として分離する。
5. `住所保存則` は「住所は消滅せず必ず写像される」と無条件に書くと強すぎる。履歴出典がある場合、旧参照を新参照、廃止、分裂、統合、不明へ写像できる、という条件付き原理にする。
6. `住所エントロピー` はデータセット依存の実験命題であり、一般定理としては書かない。
7. `ZK Address Theorem` はAMT本体ではなく、別論文「住所写像論II」の主題とする。

## 7. 採用方針

付録Aはそのまま残してよいが、記号の読み替えと責任範囲を加える。付録Bは「AMTの主張一覧」ではなく、「本文主張、検証状態、根拠、今後の検証先を結ぶ索引」として作り直す。

この修正により、読者は次を区別できる。

1. Leanで証明された抽象定理。
2. 実装テストで支持されたシステム性質。
3. GISまたは郵便データで支持されたデータ性質。
4. 論文の概念整理として提案される仮説。
5. 今後の検証が必要な主張。

この区別は、住所写像論を強く見せるためではなく、強く言える部分とまだ慎重に扱うべき部分を分けるために必要である。
