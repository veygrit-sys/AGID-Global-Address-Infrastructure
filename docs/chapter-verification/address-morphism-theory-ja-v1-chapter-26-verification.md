# 住所写像論 日本語版 v1 第26章 検証ノート

対象: 第26章「結論」

本ノートは、第26章が、住所写像論日本語版v1の結論として、これまでの章で検証された主張だけを安全に総括しているかを確認するためのものである。結論章は新しい定理を導入する章ではない。第2章から第25章までの定義、反例、Lean形式化、GIS検証、郵便ソース検証、PIDリスク検証、実装テスト、ベンチマーク、セキュリティ境界を、過大主張を避けてまとめる章である。

結論を先に述べると、第26章は採用してよい。ただし、現行本文は短いため、次の五つを明確に束ねるとさらに強くなる。

1. 住所は文字列、座標、郵便番号、地名のいずれか一つではなく、観測と証拠から形成される参照である。
2. 非単射観測、候補欠落、射影損失、正規化衝突、文脈衝突があるため、条件なしの完全住所解決器は存在しない。
3. `ambiguous`、`unresolved`、`rejected`、`conditional` は失敗だけではなく、安全状態である。
4. PID発行は候補表示より強い操作であり、品質、鮮度、リスク、履歴整合性、監査性を必要とする。
5. AGID/AOID、ZKP、Credential、MCP、買い物Agent、Polkadotなどは重要な応用だが、AMT本体とは分離して扱う。

第26章の安全な中心文は次である。

> AMTは、世界を無理に一意化する理論ではない。AMTは、住所参照が解ける条件、解けない条件、保留すべき条件、履歴へ接続すべき条件、PIDを発行してよい条件、応用層へ分離すべき条件を記述する住所意味論である。

この表現なら、第6章の不可能性定理、第10章の未解決状態、第11章のPID発行ゲート、第12章の履歴グラフ、第14章の文脈依存、第16章の自然地理、第22章のセキュリティ境界、第23章のベンチマーク、第25章の限界と整合する。

## 1. 検証結果の要約

| 結論で述べる核 | 判定 | 根拠 |
|---|---:|---|
| 住所は観測と証拠の体系である | 採用 | 文字列、座標、郵便番号、自然地理、履歴、文脈を統合する各章と実装テストに整合する。 |
| 条件なしの完全住所解決器は存在しない | Leanで支持 | `no_condition_free_perfect_resolver`。 |
| 保留状態は正式な安全状態である | Leanで支持 | `ambiguous_emits_no_false_entity`、`unresolved_emits_no_false_entity`、`rejected_emits_no_false_entity`。 |
| PID発行は強い操作である | Lean/実装で支持 | `issue_if_not_admissible_abstains`、`low_quality_prevents_issue`、PID audit/lifecycle tests。 |
| 履歴と文脈は住所解決に不可欠である | Lean/実装で支持 | append-only lineage、merge/split tests、context optimum theorems。 |
| 自然地理は住所的参照になり得るがsource-boundである | Lean/GIS/実装で支持 | `missing_entity_refutes_candidate_completeness`、GIS警告予算、natural/map feature tests。 |
| 品質スコアは内部制御であり真理ではない | Lean/実装で支持 | quality threshold tests、address tab quality tests。 |
| 応用層はAMT本体から分離すべきである | 採用 | ZK runtime boundary、privacy tests、Chapter 22/25の境界と整合する。 |
| AMTは商用APIへの全面勝利を主張しない | 採用 | Chapter 23 benchmark tests、Chapter 25の限界と整合する。 |

## 2. 実行した検証

| 検証 | コマンド | 結果 |
|---|---|---:|
| Lean中核 | `lean formal\AMTCore.lean` | 成功 |
| Lean拡張 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | 成功 |
| GIS警告予算 | `npm run verify:gis:budget` | 成功 |
| 郵便ソース静的検証 | `npm run verify:postal-sources` | 成功 |
| PID衝突リスク予算 | `npm run verify:pid-risk` | 成功 |
| 結論章関連代表実装テスト | `npx tsx --test ...` | 118 tests pass |

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

PID衝突リスク予算の結果は次である。

```text
Hash bits: 128
Max issued: 1000000000000
Birthday upper bound: 1.4693679385263966e-15
Required bits: 119
Safety margin bits: 9
Budget: pass
```

代表実装テストには次の主なファイルを含めた。

```text
src/lib/addressMorphism.test.ts
src/lib/addressMorphismSources.test.ts
src/lib/searchQuery.test.ts
src/lib/placeSearchLanguage.test.ts
src/lib/addressVerificationEngine.test.ts
src/lib/addressVerificationPolicy.test.ts
src/lib/addressVerificationBenchmark.test.ts
src/lib/pidIssuanceAudit.test.ts
src/lib/pidLifecycleProof.test.ts
src/lib/naturalAddress.test.ts
src/lib/mapFeatureAddress.test.ts
src/lib/addressTabQuality.test.ts
src/lib/addressQualitySummary.test.ts
src/lib/privacyPolicy.test.ts
src/lib/zkProofRuntime.test.ts
src/lib/zkProofCompatibility.test.ts
src/lib/privateAddressPredicateProof.test.ts
src/lib/qualityThresholdProof.test.ts
src/data/postalSourceMetadata.test.ts
```

テスト結果は次である。

```text
tests 118
pass 118
fail 0
duration_ms 3102.5497
```

## 3. 第26章で言い切ってよい主張

### 3.1 住所は単一形式ではない

第26章では、住所を「文字列」「座標」「郵便番号」「地名」のいずれかに還元しない方がよい。

安全な表現:

> 住所は、人間社会が空間、制度、履歴、到達可能性、文脈を扱うための圧縮された参照である。

根拠:

- 文字列住所は多言語、別名、旧称、略称を持つ。
- 郵便番号は配送区域や候補生成の証拠であり、単一実体識別子ではない場合がある。
- 座標は垂直参照、入口、部屋、社会的連続性を失う場合がある。
- 自然地理名は地物、区域、アクセス点、出典を必要とする。
- 履歴や文脈により、同じ表面表現の意味が変わる。

### 3.2 無条件完全解決器は存在しない

Lean定理:

```text
no_condition_free_perfect_resolver
```

結論章では、次のようにまとめるのが安全である。

> 観測が非単射である限り、条件なしで常に単一の正解実体を返す完全住所解決器は存在しない。

ただし、注意が必要である。これは「住所解決は不可能」という意味ではない。条件、出典、文脈、候補集合、品質、履歴が十分であれば、解決は可能である。AMTの核は、解決可能な場合と保留すべき場合を分けることである。

### 3.3 保留状態は安全状態である

Lean定理:

```text
ambiguous_emits_no_false_entity
unresolved_emits_no_false_entity
rejected_emits_no_false_entity
```

結論章では、次のようにまとめるのがよい。

> `ambiguous`、`unresolved`、`rejected`、`conditional` は、失敗ではなく、誤った確定を避けるための正式な出力型である。

これにより、AMTは「常に答えを返す」住所エンジンではなく、「証拠不足を証拠不足として扱う」住所理論として位置付く。

### 3.4 PID発行は候補表示より強い

Leanと実装の根拠:

```text
issue_if_not_admissible_abstains
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
PID audit proof tests
PID lifecycle merge/split tests
PID collision risk budget
```

結論章では、次を明記するとよい。

> 候補を表示できることと、PIDを発行してよいことは同じではない。PID発行には、候補生成、クラスタ、unresolved判定、履歴更新、品質、鮮度、リスク、監査性が必要である。

これは、アプリ実装やAGID/AOID応用に接続する重要な橋になる。

### 3.5 履歴と文脈は付属情報ではない

住所は現在値だけではなく、履歴グラフと文脈を持つ。

結論章で言えること:

> 住所は現在値だけではない。旧住所、行政変更、分割、統合、再開発、移転、災害時仮想住所、PID継承は、履歴グラフとして扱う必要がある。

> 住所の最適な解決結果は、配送、消防、行政、不動産、観光、災害支援などの文脈によって変わり得る。

この主張は、住所相対性原理やNo Free Lunch系の章と整合する。

### 3.6 応用層は分離する

結論章では、AGID/AOIDやZKPを本体へ混ぜ込みすぎないことが重要である。

安全な表現:

> AMTは住所参照の意味論を提供する。AGID/AOID、ZKP住所証明、Credential、MCP、買い物Agent、Polkadot連携などは、AMTを利用する応用層であり、それぞれ別の脅威モデル、API仕様、実装監査を必要とする。

この分離により、AMT本体は理論として安定し、応用はそれぞれ独立に改良できる。

## 4. 第26章で避けるべき表現

結論章では、次の表現は避けるべきである。

| 避ける表現 | 理由 | 安全な言い換え |
|---|---|---|
| AMTは世界中の住所を完全解決する | 第6章、第25章と矛盾する | AMTは解決可能条件と保留条件を分ける |
| AMTは商用APIに必ず勝つ | 第23章ベンチマークと矛盾する | AMTは比較軸を定義し、曖昧性や監査性を明示する |
| ZKPにより住所は安全になる | ZKP回路、issuer、scope、revocationが必要 | AMTはZKPで証明すべき述語の意味論を提供する |
| 品質スコアが高いなら真である | 第17章、第25章と矛盾する | 品質スコアは内部制御である |
| 出典にない地物は存在しない | 自然地理、災害、非公式集落で危険 | 出典にないことは候補生成の限界である |
| 住所は現在値である | 履歴グラフ章と矛盾する | 住所は現在値と履歴の両方である |

## 5. 第26章の採用方針

第26章は、次の順で締めると論文全体が読みやすくなる。

1. 住所は圧縮された参照である。
2. 住所表現は観測であり、観測は非単射であり得る。
3. 完全解決できない場合があるため、保留状態が必要である。
4. PID発行は強い操作であり、候補表示とは分ける。
5. 履歴と文脈を扱うことで、住所変更、自然地理、災害、社会的連続性を扱える。
6. AMT本体とAGID/AOID/ZKPなどの応用を分離する。
7. 最後に、AMTの目的は「世界を無理に一意化することではない」と締める。

## 6. 最終結論として使える文章

第26章の末尾には、次の文章を採用できる。

> 住所写像論の目的は、世界中の住所を無条件に完全解決することではない。住所写像論の目的は、住所参照がどの条件で解決でき、どの条件で解決できず、どの条件で保留され、どの条件で履歴へ接続され、どの条件で永続識別子を発行してよいかを明示することである。

> 住所は、人間社会が空間、制度、履歴、到達可能性を扱うための圧縮された参照である。住所写像論は、その参照を、文字列、座標、郵便番号、地名、自然地理、履歴、文脈、品質、監査の間の写像として記述する。

> AMTの中心的立場は、曖昧な世界を無理に一意化することではなく、曖昧性を安全状態として扱い、証拠が十分なときだけ参照を固定し、証拠が不足するときは保留できる理論を作ることである。

## 7. 第26章の結論

第26章は、これまでの章を安全に閉じる結論章として採用できる。修正の中心は、未来予測を増やすことではなく、次を明確にすることである。

- AMT本体は住所意味論である。
- 完全解決ではなく、安全な解決と保留を扱う。
- PID発行は監査可能な強い操作である。
- 履歴と文脈は住所理論の中心にある。
- 応用層は本体から分離する。

この方針なら、日本語版v1は、理論母艦として閉じた形になる。
