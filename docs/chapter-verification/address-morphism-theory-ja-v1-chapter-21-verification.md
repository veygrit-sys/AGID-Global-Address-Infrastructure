# 住所写像論 日本語版 v1 第21章 検証ノート

対象: 第21章「検証と再現性」

本ノートは、第21章で述べられている「AMTは単一の方法では検証できず、Lean、GIS、実装テスト、ベンチマーク、未検証項目を分けて再現性マップへ記録すべきである」という主張を、現在の形式化、GIS証明書、PID衝突リスク計算、実装テスト、既存章の検証結果に照らして検証したものである。

結論を先に述べると、第21章は強く採用してよい。むしろ、住所写像論を通常のアイデア論文から研究論文へ引き上げるための中核章である。ただし、「全て検証済み」と書いてはならない。正確には、各主張を検証様式ごとに分け、証拠、コマンド、対象データ、結果、限界、反証時の書き換え方を記録する章にする。

第21章の安全な中心文は次である。

> AMTの主張は、形式証明、GIS検証、実装テスト、セキュリティレビュー、運用観測、ベンチマークのいずれか、またはその組合せによって検証される。どの方法で何が検証されたかを明示し、未検証の主張は断定せず、検証可能な形へ分解する。

この章は、新しい巨大な定理を足す章ではない。論文全体に対する「証拠台帳」と「再現性マップ」を定義する章である。

## 1. 検証結果の要約

| 観点 | 判定 | 理由 |
|---|---:|---|
| 単一の検証方法では不十分 | 採用 | Leanは抽象定理、GISは空間データ、実装テストは挙動、監査は公開面を扱う。対象が異なる。 |
| Leanで現実住所の完全性まで証明できる | 不採用 | Leanは形式命題を証明する。現実データの完全性、鮮度、合法性は証明しない。 |
| GIS検証で社会的同一性まで証明できる | 不採用 | GISは形状、座標、地物、出典、空間関係に強いが、居住、所有、社会的連続性は別証拠が必要である。 |
| 実装テストは代表ケース検証として有効 | 採用 | 101 tests passにより、現在の実装範囲ではPID監査、ZK、自然住所、API境界などが再現可能に確認された。 |
| 未検証主張を削るだけでよい | 不採用 | 未検証主張は、検証不能理由と検証可能化の方法を添えて管理すべきである。 |
| 商用APIに勝つ等の広い主張 | 要弱化 | 固定データセットと評価指標なしには断定できない。項目別ベンチマークへ分解する。 |

## 2. 実行した検証

| 検証 | コマンド | 結果 |
|---|---|---:|
| Lean中核 | `lean formal\AMTCore.lean` | 成功 |
| Lean拡張 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | 成功 |
| GIS Lean証明書 | `npm run verify:gis:lean` | 成功 |
| GIS警告予算 | `npm run verify:gis:budget` | 成功 |
| PID衝突リスク予算 | `npm run verify:pid-risk` | 成功 |
| 再現性関連の代表実装テスト | `npx tsx --test ...` | 101 tests pass |

代表実装テストには次の主なファイルを含めた。

```text
scripts/verify-gis-data.test.ts
src/data/postalSourceMetadata.test.ts
src/server/routes/routeAudit.test.ts
src/server/routes/coreRoutes.test.ts
src/components/GridDetailPanel.test.ts
src/lib/addressQualitySummary.test.ts
src/lib/addressMorphismSources.test.ts
src/lib/addressDuplicateNullifier.test.ts
src/lib/addressCredentialFreshnessProof.test.ts
src/lib/aoidOwnershipProof.test.ts
src/lib/naturalAddress.test.ts
src/lib/pidLifecycleProof.test.ts
src/lib/pidIssuanceAudit.test.ts
src/lib/pidCollisionRisk.test.ts
src/lib/regionMembershipProof.test.ts
src/lib/qualityThresholdProof.test.ts
src/lib/zkProofBundleRegistry.test.ts
src/lib/zkProofCompatibility.test.ts
```

実装テストの結果は次である。

```text
tests 101
pass 101
fail 0
duration_ms 2531.9279
```

GIS警告予算の結果は次である。

```text
Features: 351
Errors: 0/0
Warnings: 149/149
Registered sources: 408/408
Result: pass
```

PID衝突リスク検証の結果は次である。

```text
Hash bits: 128
Max issued: 1000000000000
Birthday upper bound: 1.4693679385263966e-15
Required bits: 119
Safety margin bits: 9
Budget: pass
```

## 3. Leanで検証できる部分

Leanは、現実世界の住所データの完全性ではなく、AMTの抽象構造を検証する。第21章ではこの境界を明記する必要がある。

### 3.1 完全解決器の不可能性

Lean定理:

```text
no_condition_free_perfect_resolver
normalization_collision_prevents_perfect_resolution
projection_collision_prevents_vertical_resolution
```

意味:

> 非単射観測、正規化衝突、二次元射影衝突がある場合、条件なしの完全住所解決器は存在しない。

この部分は、第1章、第7章、第13章、第15章の理論的根拠になる。第21章では、これを「Leanで証明できる抽象命題」として扱う。

### 3.2 非発行状態の安全性

Lean定理:

```text
ambiguous_emits_no_false_entity
unresolved_emits_no_false_entity
rejected_emits_no_false_entity
issue_if_admissible_requires_conditions
issue_if_not_admissible_abstains
missing_candidate_prevents_issue
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
```

意味:

> ambiguous、unresolved、rejectedは、誤った実体を発行しない安全側の出力である。候補欠落、品質不足、鮮度不足、リスク超過がある場合、AMTは発行を止める。

これは第10章、第11章、第17章、第20章、第22章の根拠として使える。

### 3.3 同値類とPIDの安定性

Lean定理:

```text
ref_equivalent_is_reflexive
ref_equivalent_is_symmetric
ref_equivalent_is_transitive
same_reference_yields_same_reference_class
class_pid_invariant_under_ref_equivalence
```

意味:

> 参照先で定義された同値類に基づいてPIDを定義するなら、表記揺れや参照保存的な改名に対してPIDは安定する。

この主張は採用できる。ただし、現実の参照関係が正しいかどうかは別の検証を必要とする。

### 3.4 GIS証明書の形式的接続

Lean構造:

```text
GisValidationCertificate
GisCertificateAccepted
```

生成済み定理:

```text
current_gis_certificate_accepted
current_gis_certificate_has_no_errors
current_gis_feature_floor_met
current_gis_source_floor_met
current_gis_warning_budget_met
```

意味:

> GIS検証の結果を機械可読な証明書へ変換し、エラー数、警告予算、地物数、登録ソース数の条件をLeanで確認できる。

ただし、Leanが証明するのは証明書内の数値条件である。個々の地物形状が現実世界と一致するかはGISソフト、出典、運用観測の責任である。

## 4. GISで検証できる部分

GIS検証は、地理的対象の形状、座標、ID、出典、境界、空間関係を扱う。第21章では次のように書くのが安全である。

| 対象 | GISで検証できること | GISだけでは検証できないこと |
|---|---|---|
| 国境・行政区域 | ポリゴン、範囲、重複、境界所属 | 法的管轄の最終判断 |
| 島・湖・川・山 | 地物型、代表点、周辺関係、出典 | すべての言語名の完全収録 |
| 砂漠・湿地・氷河 | 自然地理候補の表示可能性 | 現地での配送可能性 |
| 建物・公園・遺跡 | 地図上の対象候補 | 所有権、居住、権限 |
| 配送可能区域 | 区域内判定、境界条件 | 実際の配送成功 |

今回の検証では、351件のGIS特徴、0件のエラー、149件の警告、408件の登録ソースが警告予算内で確認された。これは強い再現性証拠であるが、世界全体の網羅性を証明するものではない。

## 5. 実装テストで検証できる部分

実装テストは、形式証明だけでは見えないバグを検出するために必要である。今回の101件の代表テストは、次の範囲を確認した。

| 領域 | 検証内容 |
|---|---|
| 自然住所 | 海、山、湖、川、滝、島、砂漠、荒野、塩湖、氷原などの表示。 |
| 住所品質 | 内部スコア、低品質表示、ユーザーへの過剰なスコア露出防止。 |
| PID | 衝突リスク、発行監査、履歴更新、merge、split。 |
| ZK関連 | 重複防止、AOID所有、地域所属、品質しきい値、鮮度、proof bundle互換性。 |
| API境界 | credential issuer trust、freshness anchor、AMN envelope、Polkadot、MCP公開面。 |
| 出典 | postal source metadata、ライセンス方針、登録ソースURL。 |

この結果により、現在の実装範囲では再現性がある。ただし、実装テストは代表ケースであり、全世界の住所、全言語、全配送業者、全災害状況を網羅しない。

## 6. ベンチマークで検証すべき部分

第21章では、次の主張を未検証またはベンチマーク予定として扱うべきである。

| 主張 | 必要な検証 |
|---|---|
| 商用APIに負けない | 固定データセット、国別評価、誤受理率、誤拒否率、再現率、処理時間、コスト比較。 |
| 多言語検索が高品質 | 言語別クエリ集合、表記揺れ集合、正解候補、ランキング指標。 |
| 自然地物名を広く扱える | 地物型別データセット、出典別カバレッジ、地域別失敗率。 |
| 配送可能性を正しく判定する | 配送業者別区域、実配送ログ、失敗理由、鮮度。 |
| 住所品質スコアが誤発行を減らす | しきい値別の誤発行率と未解決率のトレードオフ。 |

特に「Loqate、Experian、Melissa、Smartyに負けない」という表現は、現時点では論文本文で断定してはならない。書くなら「項目別ベンチマークを設計し、国別・用途別に比較する」と弱める。

## 7. 検証不能または未検証の主張

第21章は、次の主張を正直に分類するために必要である。

| 主張 | 現状 | 書き換え方 |
|---|---|---|
| 世界中すべての住所を完全解決できる | 検証不能 | 対象地域、対象出典、対象種別を限定する。 |
| すべての公式データが常に最新である | 検証不能 | 更新日時、取得元、鮮度、失効条件を書く。 |
| すべての自然地物名を認識できる | 未検証 | 登録済みソースと地物型別のカバレッジに限定する。 |
| 社会的連続性を完全判断できる | 未検証 | 履歴グラフ、行政記録、出典競合の処理として限定する。 |
| ZKPにより住所の真実性が保証される | 不採用 | ZKPは秘匿証明であり、住所真実性はcredentialとAMT証拠に依存する。 |
| 実装テスト通過で世界品質が保証される | 不採用 | 実装テストは代表ケース検証である。 |

この整理により、論文は強くなる。弱くなるのではない。未検証主張を隠さず、検証可能な主張へ変換することが、研究論文としての信頼性を上げる。

## 8. 再現性マップの形式

第21章には、次の形式を導入するとよい。

```text
ClaimRecord = {
  claimId: string
  claimText: string
  verificationClass: lean | gis | implementation | benchmark | security | operational | unverified
  evidenceFile: string
  commandOrDataset: string
  result: pass | fail | partial | pending | out-of-scope
  limitation: string
  rewriteIfFailed: string
  nextVerificationStep: string
}
```

例:

```text
claimId: AMT-21-LEAN-001
claimText: Non-injective observations block condition-free perfect address resolution.
verificationClass: lean
evidenceFile: formal/AMTCore.lean
commandOrDataset: lean formal\AMTCore.lean
result: pass
limitation: Formal model only; does not validate real postal data.
rewriteIfFailed: Weaken the impossibility theorem to the verified assumptions.
nextVerificationStep: Keep theorem names synchronized with the paper.
```

GISの例:

```text
claimId: AMT-21-GIS-001
claimText: Current registered GIS data stays within the configured warning budget.
verificationClass: gis
evidenceFile: test-results/gis-validation/gis-warning-budget-report.json
commandOrDataset: npm run verify:gis:budget
result: pass
limitation: Warning budget acceptance is not global source completeness.
rewriteIfFailed: Mark affected regions as revalidation-required.
nextVerificationStep: Add source-specific freshness and geometry-quality audits.
```

実装テストの例:

```text
claimId: AMT-21-IMPL-001
claimText: Current representative tests pass for PID audit, natural address rendering, quality gates, and public proof boundaries.
verificationClass: implementation
evidenceFile: selected Node test output
commandOrDataset: npx tsx --test ...
result: pass
limitation: Representative tests do not exhaust all countries and languages.
rewriteIfFailed: Scope the claim to passing cases and add regression tests.
nextVerificationStep: Build country and feature stratified benchmark suites.
```

## 9. 章間接続

第21章は、他章の証拠をまとめる章として機能する。

| 根拠章 | 第21章での使い方 |
|---|---|
| 第1章 | 完全解決不能性をLean検証済み命題として記録する。 |
| 第7章 | 非単射、正規化衝突、射影衝突を不可能性の証拠として記録する。 |
| 第10章 | ambiguous、unresolved、rejectedを安全側状態として記録する。 |
| 第11章 | PID発行条件、衝突リスク、監査証拠を記録する。 |
| 第16章 | 自然地物表示は登録済みソースとテスト対象に限定して記録する。 |
| 第17章 | 品質スコアは内部制御であり、真理ではないと記録する。 |
| 第20章 | 登録、通信、監査の再現性を記録する。 |
| 第22章 | セキュリティレビューと悪用可能性の検証項目へ接続する。 |

## 10. 反例と注意点

### 10.1 Lean検証の過大解釈

反例:

> Leanで不可能性定理が通ったので、現実の住所データも正しい。

これは誤りである。Leanは抽象命題を検証する。現実の住所データの正しさは、出典、GIS、郵便データ、運用観測で検証する。

### 10.2 GIS検証の過大解釈

反例:

> GISでポリゴンが妥当なので、居住者や所有者も正しい。

これは誤りである。GISは空間的関係を扱うが、居住、所有、委任、配送受取資格は別のcredentialや監査を必要とする。

### 10.3 実装テストの過大解釈

反例:

> 101件のテストが通ったので、世界中すべての住所に対応できる。

これは誤りである。テストは現在の代表ケースを保証する。世界全体の対応には、国別、言語別、自然地物型別、配送事業者別のベンチマークが必要である。

### 10.4 未検証主張の隠蔽

反例:

> 検証できない主張は論文から完全に消す。

これも必ずしも良くない。研究計画として重要な主張は、未検証であること、なぜ未検証か、どう検証可能にするかを明記すれば、論文の将来性として残せる。

## 11. 本文に採用できる命題

### 原則21.1 検証多元性原則

> AMTの主張は、形式命題、地理空間命題、実装命題、運用命題、セキュリティ命題に分解され、それぞれに異なる検証方法を割り当てる必要がある。

### 原則21.2 検証範囲分離原則

> ある検証方法で得られた証拠は、その方法が扱う対象を越えて拡張してはならない。

### 原則21.3 未検証主張明示原則

> 検証されていない主張は、未検証であること、検証不能理由、検証可能化の方法、反証時の書き換えを伴って記録される。

### 原則21.4 再現性マップ原則

> 各主張は、主張ID、検証方法、証拠ファイル、コマンドまたはデータセット、結果、限界、失敗時の書き換え方に対応付けられる。

## 12. 第21章の結論

第21章は、住所写像論にとって非常に重要である。AMTは、住所、GIS、郵便、履歴、PID、ZK、セキュリティ、応用システムにまたがるため、単一の検証方法では評価できない。

したがって、第21章では、次を断言してよい。

> AMTは、主張ごとに検証様式を割り当てることで、証明できるもの、実験で支持されるもの、実装で再現できるもの、未検証のものを分離する理論である。

一方で、次は断言してはならない。

> AMTは現時点で世界中すべての住所を完全に検証した。

論文として強い書き方は、「全て検証済み」ではなく、「どの主張が、どの方法で、どの範囲まで検証されたかを再現可能に示す」である。
