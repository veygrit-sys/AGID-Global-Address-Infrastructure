# 住所写像論 日本語版 v1 第23章 検証ノート

対象: 第23章「ベンチマークと比較」

本ノートは、第23章で述べられている「AMTは商用住所検証API、地図API、郵便番号データベース、ジオコーディングAPI、Plus Codes、DID、DNS/IP、配送事業者システムと比較できるが、現時点で全面的な勝利宣言をすべきではない」という主張を、Lean形式化、住所検証ベンチマーク実装、郵便ソース静的検証、GIS警告予算、自然地理・多言語検索・品質ゲート・PID監査テストに照らして検証したものである。

結論を先に述べると、第23章は採用してよい。ただし、章の中心は「商用APIに勝つ」ではなく、「どの入力集合、どの用途、どの指標、どの出典条件で比較するかを定義する」ことでなければならない。

第23章の安全な中心文は次である。

> AMTのベンチマークは、勝敗を宣言するための広告文ではなく、住所解決がどの条件で成功し、どの条件で保留し、どの条件で既存サービスや追加証拠へ依存するかを測るための反証可能な評価手続きである。

この表現なら、商用住所検証APIの強さを認めつつ、AMTの独自性である曖昧性検出、unresolved、履歴、自然地理、垂直参照、監査可能PID発行を安全に位置付けられる。

## 1. 検証結果の要約

| 観点 | 判定 | 理由 |
|---|---:|---|
| 同一データセットと同一指標で比較すべき | 採用 | 住所解決は国、用途、出典、粒度、言語で結果が変わる。 |
| 商用APIに全用途で勝てる | 不採用 | 商用APIには非公開配送データ、公式郵便データ、企業運用がある。現行実装は delivery point depth が弱い。 |
| AMTは安全な非発行を指標化できる | Lean/実装で支持 | `unresolved_emits_no_false_entity`、PID audit、unresolvedテストが対応する。 |
| AMTは自然地理と文化地物を評価軸に入れられる | 実装で支持 | mountain、river、lake、waterfall、island、desert、wetland、ruins、world heritage系テストが通過。 |
| AMTはオープンソース監査性を強みにできる | 実装で支持 | source registry、postal source health、GIS budget、audit envelopeが対応する。 |
| 現行AGIDが有料APIと同等の配送地点検証を持つ | 不採用 | 内部ベンチマーク上、deliveryPointDepth、authoritativePostalDepth、globalPostalCoverageに大きな差がある。 |

## 2. 実行した検証

| 検証 | コマンド | 結果 |
|---|---|---:|
| Lean中核 | `lean formal\AMTCore.lean` | 成功 |
| Lean拡張 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | 成功 |
| 郵便ソース静的検証 | `npm run verify:postal-sources` | 成功 |
| GIS警告予算 | `npm run verify:gis:budget` | 成功 |
| ベンチマーク関連代表実装テスト | `npx tsx --test ...` | 84 tests pass |

郵便ソース静的検証の結果は次である。

```text
addressFormatFiles: 281
registeredOpenSourceIds: 408
uniquePostalApis: 89
uniquePostalProbeTargets: 201
staticIssueCount: 0
liveProbeEnabled: false
```

GIS警告予算の結果は次である。

```text
features: 351
errors: 0/0
warnings: 149/149
registered sources: 408/408
result: pass
```

代表実装テストには次の主なファイルを含めた。

```text
src/lib/addressVerificationBenchmark.test.ts
src/lib/addressVerificationEngine.test.ts
src/lib/addressVerificationPolicy.test.ts
src/data/postalSourceMetadata.test.ts
src/lib/searchQuery.test.ts
src/lib/addressMultilingualCompatibility.test.ts
src/lib/naturalAddress.test.ts
src/lib/mapFeatureAddress.test.ts
src/lib/addressUtils.natural.test.ts
src/lib/addressTabQuality.test.ts
src/lib/addressQualitySummary.test.ts
src/lib/pidIssuanceAudit.test.ts
src/lib/addressMorphism.test.ts
src/lib/addressMorphismSources.test.ts
```

テスト結果は次である。

```text
tests 84
pass 84
fail 0
duration_ms 2026.4091
```

## 3. Leanで支えられる比較上の主張

### 3.1 完全比較器は存在しない

Lean定理:

```text
no_condition_free_perfect_resolver
```

意味:

すべての住所入力、すべての国、すべての用途、すべてのデータ品質で完全に正しい住所解決器がある、という無条件主張は採用できない。したがって、第23章で「AMTは全サービスに勝つ」と書くと、第6章の不可能性定理と矛盾する。

### 3.2 unresolvedは評価指標に含めるべきである

Lean定理:

```text
unresolved_emits_no_false_entity
low_quality_prevents_issue
```

意味:

解決しないことは失敗だけではない。低品質、弱証拠、近接タイ、未登録出典の場合にPIDを発行しないことは、安全な住所システムの正の性質である。したがって、ベンチマークは正解率だけではなく、false issue率、unresolved precision、追加証拠要求率を測るべきである。

### 3.3 用途別比較が必要である

Lean定理:

```text
conflicting_context_optima_prevent_absolute_address
strictly_better_context_blocks_universal_optimum
```

意味:

配送、消防、行政、不動産、観光、災害支援では、最適な住所表現と解決器が異なる場合がある。したがって、第23章の比較は、単一ランキングではなく、用途別ランキングまたは用途別評価表に分ける必要がある。

### 3.4 出典検証なしにverifiedへ昇格できない

Lean定理:

```text
unknown_source_prevents_verified_claim
rejected_source_prevents_verified_claim
```

意味:

出典が不明または拒否された場合、その結果をverified claimとして扱ってはならない。これは、商用API比較だけでなく、OpenStreetMap、GeoNames、Natural Earth、NASA、UNESCO、各国郵便局データを使う場合にも重要である。

## 4. 現行AGIDベンチマークプロファイル

`src/lib/addressVerificationBenchmark.ts` は、現行AGIDと商用・地図・OSS系プロファイルを同じ内部評価軸で比較する。ただし、このスコアは計画用ヒューリスティックであり、ユーザー向け品質表示でも、外部APIに対する実証済み勝敗でもない。

現行抽出結果は次である。

| 項目 | 値 |
|---|---:|
| AGID内部計画スコア | 6.0 |
| address format country files | 281 |
| explicit verification policy countries | 22 |
| globalPostalCoverage | 5.1 |
| deliveryPointDepth | 3.0 |
| authoritativePostalDepth | 4.6 |
| correctionAndStandardization | 5.8 |
| fuzzyMatching | 5.7 |
| geocodingDepth | 5.5 |
| autocompleteCapture | 4.8 |
| languageAndScriptHandling | 7.1 |
| naturalFeatureContext | 8.8 |
| openSourceAuditability | 9.7 |
| privacyLocalFirst | 9.4 |
| costControl | 9.2 |

内部ランキングは次である。

| profile | score | 備考 |
|---|---:|---|
| Experian Address Validation | 7.9 | 商用配送・郵便検証が強い想定 |
| GBG Loqate Verify | 7.9 | delivery point depthが強い想定 |
| Melissa Global Address Verification | 7.8 | geocoding depthが強い想定 |
| Smarty Address Validation | 7.3 | 郵便・配送地点検証が強い想定 |
| Google Address Validation | 6.9 | geocoding、autocompleteが強い想定 |
| AGID address verification engine | 6.0 | 監査性、privacy、自然地理で強い |
| Nominatim/libpostal OSS profile | 5.6 | OSS監査性とcostで強い |

この結果から、第23章は「AGIDはすでに商用APIに勝っている」と書いてはならない。むしろ、次のように書くべきである。

> 現行AGIDは、配送地点深度、公式郵便深度、グローバル郵便カバレッジでは商用APIに劣る。一方で、自然地理参照、公開監査性、local-first privacy、コスト制御では差別化できる。したがって、AMTは商用APIの単純な置換ではなく、監査可能な住所意味論と安全な非発行を提供する補完層として評価すべきである。

## 5. 現行AGIDの弱点

内部比較で大きなgapが出ている項目は次である。

| dimension | AGID | best competitor | delta | 優先度 |
|---|---:|---:|---:|---|
| deliveryPointDepth | 3.0 | 9.3 | 6.3 | high |
| authoritativePostalDepth | 4.6 | 9.2 | 4.6 | high |
| globalPostalCoverage | 5.1 | 9.5 | 4.4 | high |
| autocompleteCapture | 4.8 | 8.8 | 4.0 | high |
| geocodingDepth | 5.5 | 8.9 | 3.4 | high |
| correctionAndStandardization | 5.8 | 9.1 | 3.3 | high |
| fuzzyMatching | 5.7 | 9.0 | 3.3 | high |
| languageAndScriptHandling | 7.1 | 8.7 | 1.6 | low |

したがって、実装面の次課題は、商用APIの強みである配送地点深度、公式郵便深度、候補補正、autocomplete、geocodingをどう補うかである。

## 6. AMTが比較に入れるべきデータセット族

第23章の原文にあるデータセット族は妥当である。さらに、各データセット族には目的を明示するとよい。

| データセット族 | 目的 |
|---|---|
| 都市の多階層建物 | 垂直参照、部屋番号、同一建物内のPID粒度を測る。 |
| 田舎の粗い住所 | 低密度・曖昧地名・広域郵便番号でのunresolvedを測る。 |
| 島、港、無人島、小島 | 島名、海岸、港、配送可能性の境界を測る。 |
| 山地、谷、洞窟 | 郵便住所外の自然参照と安全な部分解決を測る。 |
| 砂漠、湿地、氷原、氷河 | sparse natural geographyと出典不足時の保留を測る。 |
| 川、湖、滝、海岸 | 水辺地物、橋、岸、河川区間名を測る。 |
| 遺跡、世界遺産、文化財 | 文化的地物名と行政住所の分離を測る。 |
| 旧住所と行政変更 | lineage、split、merge、旧名検索を測る。 |
| 同一郵便番号内の複数候補 | 郵便番号だけでは非単射であることを測る。 |
| 多言語・別名・旧名 | candidate recallと誤統合を測る。 |
| 配送不可または条件付き配送地域 | delivery eligibilityと追加証拠要求を測る。 |
| 公式データ不足地域 | verifiedへ昇格しない安全性を測る。 |

都市だけの評価、郵便住所だけの評価、英語表記だけの評価では、AMTの本質である曖昧性、自然地理、履歴、保留、安全な非発行が測れない。

## 7. 評価指標の整理

第23章の指標は採用できるが、本文では定義を補うべきである。

| 指標 | 定義の方向 |
|---|---|
| candidate recall@k | 正解対象が上位k候補に含まれる割合。 |
| candidate miss rate | 正解対象が候補集合から欠落する割合。 |
| precision@1 | 最上位候補が正解である割合。 |
| ambiguity detection rate | 複数候補が残るべき入力をambiguousにできた割合。 |
| false issue rate | 誤ったPIDまたはverified resultを発行した割合。 |
| unresolved precision | unresolvedにすべき入力を安全に保留した割合。 |
| over-abstention rate | 解決可能な入力を過剰にunresolvedへ落とした割合。 |
| cluster stability | 表記揺れ、翻訳、旧名で同じ同値類を保つ割合。 |
| false merge rate | 異なる実体を同一クラスタへ統合した割合。 |
| false split rate | 同一実体を複数クラスタへ分割した割合。 |
| lineage consistency | 旧住所、行政変更、split、mergeの履歴整合率。 |
| country/language quality | 国別・言語別のrecall、miss、unresolved、false issue。 |
| natural feature coverage | 自然・文化地物を候補化できる割合。 |
| vertical reference support | 階、部屋、地下、ロッカー、3次元区画の区別率。 |
| audit reproducibility | 同じ証拠からPID発行判断を再現できる割合。 |
| license compliance | 使用データのライセンス・出典・更新時点が記録されている割合。 |

## 8. 形式的なベンチマーク単位

本文には、次のような単位を導入するとよい。

```text
BenchmarkCase =
  input address expression
  context or purpose
  allowed source set
  gold reference object or allowed abstention
  expected granularity
  privacy constraint
```

出力は次に分類する。

```text
verified
partial
ambiguous
unresolved
rejected
additional-evidence-required
```

この分類により、AMTの失敗を単なる不正解ではなく、保留、部分解決、追加証拠要求、出典拒否として評価できる。

## 9. 商用API比較の安全な表現

第23章では、次の表現を避けるべきである。

| 避ける表現 | 理由 |
|---|---|
| AMTはLoqate、Experian、Melissa、Smartyに勝つ。 | 同一条件のライブ比較をしていない。 |
| AMTは世界中の住所検証を完全に実現する。 | 全世界gold datasetとdelivery point dataがない。 |
| AGIDは商用住所APIの代替である。 | 現時点では補完層として書く方が正確。 |
| 正解率だけで比較すれば十分である。 | false issue、unresolved、監査、privacy、licenseを見落とす。 |

安全な表現は次である。

> AMTは、商用住所検証APIを単純に置換するものではない。AMTは、曖昧性、保留、履歴、自然地理、垂直参照、出典監査、PID発行監査を評価軸として明示することで、商用APIが公開しにくい判断根拠と失敗状態を可視化する補完的な理論基盤である。

## 10. 反例と注意点

### 10.1 商用API全面勝利という反例

反例:

ある国では、商用APIが郵便局や配送事業者の非公開delivery point databaseを持つ。AMT側が公開ソースだけで同じ入力を解く場合、配送地点深度では商用APIに負ける。

結論:

商用API比較は、国、データアクセス、用途、粒度を固定しなければならない。

### 10.2 都市だけの評価という反例

反例:

都市部の郵便住所だけでベンチマークすると、山、湖、川、島、砂漠、湿地、世界遺産の住所的参照を評価できない。

結論:

AMTの評価データセットには、都市、田舎、島、自然地理、文化地物、旧住所、配送不可地域を含める必要がある。

### 10.3 正解率だけの評価という反例

反例:

常に最も近い候補をverifiedとして返すシステムは、単純な正解率では高く見える場合がある。しかし、曖昧な入力で誤ったPIDを発行するなら、安全な住所システムとしては失敗である。

結論:

false issue率、unresolved precision、over-abstention rateを含める必要がある。

## 11. 本文に採用できる原則

### 原則23.1 同一条件比較原則

住所解決器を比較するときは、入力集合、用途、国、出典条件、粒度、privacy制約、評価指標を固定しなければならない。

### 原則23.2 非発行評価原則

住所解決ベンチマークでは、正しくPIDを発行する能力だけでなく、発行すべきでないときに発行しない能力を評価しなければならない。

### 原則23.3 用途別最適性原則

配送、消防、行政、不動産、観光、災害支援では、最適な住所表現と最適な評価関数が異なるため、単一の総合順位だけで評価してはならない。

### 原則23.4 出典境界原則

公式郵便データ、商用配送データ、OSS地図データ、自然地理データ、文化財データは、同じ信頼度として扱ってはならない。

### 原則23.5 反証可能性原則

ベンチマークで期待が外れた場合、論文は主張を隠さず、反例、条件、不足データ、unresolved policy、追加証拠要求として書き換えなければならない。

## 12. 第23章の結論

第23章は、AMTの商用競争力を宣伝する章ではなく、AMTを測定可能な住所参照理論にする章である。現行検証では、AMTはunresolved、PID発行ゲート、自然地理、品質制御、出典監査、公開可能な検証を支える。一方で、商用APIに対する全面勝利、delivery point depth、公式郵便深度、全世界coverage、ライブAPI品質は未検証または弱い。

したがって、第23章は次の結論で閉じるのがよい。

> AMTは、商用住所検証APIと同じ土俵で一つの総合勝敗を争う理論ではない。AMTは、住所解決の成功、保留、失敗、出典依存、監査可能性を分解し、各用途においてどの能力が必要かを測るための理論である。
