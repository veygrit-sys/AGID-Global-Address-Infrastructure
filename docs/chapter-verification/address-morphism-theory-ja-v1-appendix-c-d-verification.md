# 住所写像論 日本語版 v1 付録C/D 検証ノート

対象: 付録C「反例集」および付録D「検証マップ」

結論: 付録C/Dは採用できる。特に付録Cの反例集は、住所写像論が「完全解決器」ではなく「完全解決不能な状況を検出し、安全に保留する理論」であることを示すために重要である。ただし、各反例がどの主張を制限するのか、どの検証で支えられるのか、どこから先は未検証なのかを明示する必要がある。

## 1. 検証結果の要約

| 項目 | 判定 | 理由 |
| --- | --- | --- |
| 付録C 反例集 | 採用可 | 住所参照不可能性、安全な非発行、履歴、自然地理、文脈相対性を説明する反例として有効。 |
| 同名ビル | 採用可 | 表面名だけでは解決できない反例として強い。 |
| 同一郵便番号内の多数住宅 | 採用可 | 郵便番号を単一実体識別子にできない根拠になる。 |
| 垂直衝突 | 採用可 | 2D座標だけでは階、部屋、地下、入口を区別できない根拠になる。 |
| 旧住所衝突 | 採用可 | 履歴グラフと分裂、統合、不明状態の必要性を示す。 |
| 自然地名衝突 | 採用可 | 地物型、範囲、出典、アクセス点が必要であることを示す。 |
| 社会的移転 | 採用可 | 地理的同一性だけで社会的同一性を決められないことを示す。 |
| 災害時住所 | 採用可 | 一時住所、鮮度、用途、再検証の必要性を示す。 |
| 世界遺産・遺跡 | 採用可 | 文化的範囲、管理範囲、観光入口、配送入口を分ける必要がある。 |
| 砂漠・湿地・氷原 | 採用可 | 境界が曖昧な面状地物では品質、季節性、観測点が必要になる。 |
| 付録D 検証マップ | 条件付き採用 | 検証方法の一覧として有効。ただし「可」という表現を、形式化済み、形式化可能、実験検証、未検証に分けるべき。 |

## 2. 実行した検証

| 検証 | 結果 |
| --- | --- |
| `lean formal/AMTCore.lean` | pass |
| `LEAN_PATH=formal lean formal/AMTPaperExtensions.lean` | pass |
| `npm run verify:gis:budget` | pass, 351 features, 0 errors, 149 warnings within budget, 408 registered sources |
| `npm run verify:postal-sources` | pass, 281 address format files, 408 open-source ids, 89 postal APIs, 201 probe targets, 0 static issues |
| `npm run verify:pid-risk` | pass, 128 bits, birthday upper bound 1.4693679385263966e-15, safety margin 9 bits |
| representative TypeScript tests | pass, 118 tests |

## 3. 付録Cの反例対応

| 反例 | 壊す素朴な主張 | 支えるAMTの主張 | 根拠 |
| --- | --- | --- | --- |
| 同名ビル | 建物名だけで一意に解決できる | 表面表現だけでは一般に不十分 | `normalization_collision_prevents_perfect_resolution`, ambiguous tests |
| 同一郵便番号内の多数住宅 | 郵便番号だけで建物や住戸を特定できる | 郵便番号は区域証拠でありPID発行根拠ではない | postal policy tests, address verification tests |
| 垂直衝突 | 2D座標だけで住所実体を解決できる | 垂直参照、階、部屋、入口が必要になる | `projection_collision_prevents_vertical_resolution` |
| 旧住所衝突 | 旧住所は必ず現在住所へ一意変換できる | 履歴は後継、分裂、統合、不明を持つ | `functional_transition_cannot_represent_split`, lineage tests |
| 自然地名衝突 | 自然地名は一つの対象だけを指す | 地物型、範囲、近傍、出典で分ける | natural/map feature tests, GIS warning budget |
| 社会的移転 | 住所同一性は地理同一性だけで決まる | 社会的連続性と地理的連続性を分ける | lineage model, context chapters |
| 災害時住所 | 住所は安定した恒久値である | 一時住所、鮮度、再検証が必要 | freshness gates, quality tests |
| 世界遺産・遺跡 | 名称だけで範囲と入口が決まる | 文化的範囲、管理範囲、到達点を分ける | natural feature tests, source-bound interpretation |
| 砂漠・湿地・氷原 | 面状自然地理は住所にならない、または完全に境界確定できる | 面状地物は住所的参照になりうるが、品質と季節性を要する | desert, wetland, ice field tests, GIS budget |

## 4. Leanで支えられる反例

Leanで強く扱えるのは、データ固有の反例そのものではなく、反例が示す抽象構造である。

| 抽象構造 | Lean名 | 対応反例 |
| --- | --- | --- |
| 非単射観測 | `no_condition_free_perfect_resolver` | 同名ビル、同一郵便番号、自然地名衝突 |
| 正規化衝突 | `normalization_collision_prevents_perfect_resolution` | 同名表記、翻訳、略称、旧称 |
| 射影損失 | `projection_collision_prevents_vertical_resolution` | 1階店舗と2階事務所、地下施設 |
| 候補欠落 | `missing_entity_refutes_candidate_completeness` | 未登録地物、弱い自然地理出典 |
| 分裂を関数で表せない | `functional_transition_cannot_represent_split` | 旧住所の分裂、再開発、行政変更 |
| 低品質非発行 | `low_quality_prevents_issue` | 災害時住所、境界不明な自然地理 |
| 低鮮度非発行 | `stale_freshness_prevents_issue` | 古い住所資格、古い地図、古い避難所情報 |
| 高リスク非発行 | `high_risk_prevents_issue` | 私的住所、秘匿すべき対象、高リスク配送 |
| 文脈衝突 | `conflicting_context_optima_prevent_absolute_address` | 配送、消防、行政、不動産の粒度差 |

## 5. GIS・実装で支えられる反例

| 反例群 | 実装またはGIS根拠 | 限界 |
| --- | --- | --- |
| 道路、橋、山、川、湖、池、公園 | `mapFeatureAddress.test.ts`, `naturalAddress.test.ts` | 全世界完全認識ではなく、出典範囲内の表示能力を支持する。 |
| 島、環礁、群島、キー、ケイ | island descriptor tests | 島名の完全リスト登録を保証しない。 |
| 砂漠、荒野、塩湖、湿地、氷原、氷河、洞窟、谷 | natural address rendering tests | 境界と季節性は出典依存である。 |
| 郵便番号と住所検証 | address verification tests, postal source verification | 商用API全体との同一条件比較ではない。 |
| 品質スコアと再検証 | address tab quality tests, quality threshold tests | 品質スコアは真理ではなく内部制御値である。 |
| GIS出典登録 | `verify:gis:budget` | 警告は許容予算内だが、警告がゼロという意味ではない。 |

## 6. 付録Dの修正方針

付録Dの「可」「不要」「部分可」は読者に誤解されやすい。次の分類へ変えるとよい。

| 表記 | 意味 |
| --- | --- |
| 形式化済み | 現在のLeanファイルに対応定理がある。 |
| 形式化可能 | 抽象モデルを置けばLeanで扱えるが、現在は未形式化。 |
| 実装検証済み | テストまたは検証スクリプトで支持される。 |
| GIS検証済み | GISまたは地理出典検証で支持される。 |
| データ依存 | データセット、国、時点、出典に依存する。 |
| 概念整理 | 論文上の枠組みとして採用するが、証明済みとは言わない。 |
| 別論文 | ZKP、AGID、AOIDなど、AMT本体とは責任範囲が異なる。 |

## 7. 付録Dで特に注意すべき主張

| 主張 | 修正理由 | 推奨表現 |
| --- | --- | --- |
| 住所保存則 | 無条件に「住所は消滅しない」と書くと強すぎる | 履歴出典がある場合、旧参照を後継、分裂、統合、廃止、不明として記録できる。 |
| 住所エントロピー | 都市化と情報量増加は実験命題であり、一般定理ではない | データセットを定めた上で候補集合エントロピーや必要識別ビットを測る。 |
| 自然地理対応 | 表示可能性と全世界完全認識は異なる | 出典付き地物について住所的参照として扱える。 |
| 商用API比較 | Loqate, Experian, Melissa, Smartyへの完全勝利は未検証 | 同一データ、同一指標、同一国で限定比較する。 |
| 暗号拡張 | ZKPはAMT本体の証明ではない | AMTは住所述語の意味論を与え、ZKPは別論文で秘匿証明層として扱う。 |

## 8. 採用方針

付録Cは、各反例に「壊す素朴な主張」「AMTの応答」「検証方法」を加えて残す。付録Dは、検証方法の一覧として残すが、検証状態をより細かく分ける。

これにより、論文は次の形で強くなる。

1. 反例により、完全解決器を主張しない理由を示す。
2. Leanにより、反例の抽象構造を証明する。
3. GISと実装により、現実データ上の扱い方を検証する。
4. 未検証の範囲は、断定ではなく検証計画として残す。
5. AGID、AOID、ZKPなどの応用層は別論文へ分離する。
