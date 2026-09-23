# 住所写像論 日本語版 v1 第25章 検証ノート

対象: 第25章「限界」

本ノートは、第25章で述べる「住所写像論は完全解決、暗号安全性、真理判定、全世界自然地理認識、社会的同一性、商用APIへの全面勝利を主張しない」という限界が、これまでのLean形式化、GIS検証、郵便ソース検証、PIDリスク検証、実装テスト、ベンチマーク結果と整合しているかを確認するためのものである。

結論を先に述べると、第25章は削らない方がよい。むしろ、第25章は論文全体の信頼性を上げるために強化すべき章である。AMTの強さは「何でも解ける」と主張することではなく、「どの条件では解いてよく、どの条件では保留、拒否、追加証拠要求にすべきか」を理論の中に入れる点にある。

第25章の安全な中心文は次である。

> AMTは、世界中の住所を無条件に完全解決する理論ではない。AMTは、住所解決が失敗し得る条件、証拠が足りない条件、秘匿証明へ渡すべき条件、出典が限定される条件、商用APIや行政データへ依存する条件を明示する住所意味論である。

この表現なら、第6章の住所参照不可能性定理、第11章のPID発行ゲート、第16章の自然地理、第22章のセキュリティ境界、第23章のベンチマークと矛盾しない。

## 1. 検証結果の要約

| 限界 | 判定 | 根拠 |
|---|---:|---|
| 完全解決は保証しない | Leanで支持 | `no_condition_free_perfect_resolver` が非単射観測下の完全解決不能性を示す。 |
| 保留状態は失敗だけではない | Leanで支持 | `ambiguous_emits_no_false_entity`、`unresolved_emits_no_false_entity`、`rejected_emits_no_false_entity`。 |
| 暗号安全性はAMT本体では保証しない | 採用 | AMT IIとZK runtime testsは境界を支持するが、実ZK回路監査は別作業である。 |
| 品質スコアは真理ではない | Lean/実装で支持 | `low_quality_prevents_issue`、品質タブテスト、quality threshold tests。 |
| 自然地理の網羅性は出典依存 | Lean/GIS/実装で支持 | `missing_entity_refutes_candidate_completeness`、GIS警告予算、自然地理テスト。 |
| 社会的連続性は地理的同一性を保証しない | 採用 | 履歴グラフ、PID lifecycle tests、文脈依存性の章と整合する。 |
| 商用APIに常に勝つとは主張しない | 採用 | 第23章ベンチマークで、delivery point depthなどは商用APIが強い可能性を認める。 |
| 本稿は完全な実証論文ではない | 採用 | Lean、GIS、実装テスト、ベンチマーク、ZK回路監査は層ごとに分ける必要がある。 |

## 2. 実行した検証

| 検証 | コマンド | 結果 |
|---|---|---:|
| Lean中核 | `lean formal\AMTCore.lean` | 成功 |
| Lean拡張 | `$env:LEAN_PATH='formal'; lean formal\AMTPaperExtensions.lean` | 成功 |
| GIS警告予算 | `npm run verify:gis:budget` | 成功 |
| 郵便ソース静的検証 | `npm run verify:postal-sources` | 成功 |
| PID衝突リスク予算 | `npm run verify:pid-risk` | 成功 |
| 限界章関連代表実装テスト | `npx tsx --test ...` | 108 tests pass |

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
src/lib/addressVerificationEngine.test.ts
src/lib/addressVerificationPolicy.test.ts
src/lib/addressVerificationBenchmark.test.ts
src/lib/pidIssuanceAudit.test.ts
src/lib/pidLifecycleProof.test.ts
src/lib/naturalAddress.test.ts
src/lib/mapFeatureAddress.test.ts
src/lib/addressUtils.natural.test.ts
src/lib/addressTabQuality.test.ts
src/lib/addressQualitySummary.test.ts
src/lib/privacyPolicy.test.ts
src/lib/zkProofRuntime.test.ts
src/lib/zkProofCompatibility.test.ts
src/lib/qualityThresholdProof.test.ts
src/lib/privateAddressPredicateProof.test.ts
src/data/postalSourceMetadata.test.ts
```

テスト結果は次である。

```text
tests 108
pass 108
fail 0
duration_ms 1913.2002
```

## 3. Leanで支えられる限界

### 3.1 完全解決は保証しない

Lean定理:

```text
no_condition_free_perfect_resolver
```

意味:

二つの異なる実体が同じ観測住所、同じ郵便番号、同じ座標、同じ正規化文字列、同じ地図ラベルを持つ場合、条件なしで常に単一実体を返す解決器は、両方に対して同時に正しくなれない。

第25章では、次を明記すべきである。

> AMTは完全解決器ではない。AMTは、完全解決できない場合を検出し、ambiguous、unresolved、conditional、rejectedとして扱う理論である。

### 3.2 保留状態は安全状態である

Lean定理:

```text
ambiguous_emits_no_false_entity
unresolved_emits_no_false_entity
rejected_emits_no_false_entity
```

意味:

ambiguous、unresolved、rejectedは、誤った実体を解決結果として発行しない。したがって、第25章では、保留を単なる失敗ではなく、誤発行を防ぐ安全状態として説明できる。

### 3.3 品質スコア不足はPID発行を止める

Lean定理:

```text
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
```

意味:

品質が低い、証拠が古い、リスクが高い場合、PID発行条件を満たさない。これは品質スコアが「真理」ではなく「発行ゲート、注意表示、再検証、追加証拠要求のための内部判定」であることを支持する。

### 3.4 自然地理の網羅性は候補生成に依存する

Lean定理:

```text
missing_entity_refutes_candidate_completeness
```

意味:

候補生成器がある川、島、湖、山、砂漠、湿地、遺跡を候補に含めていないなら、その観測系は完全候補生成を主張できない。したがって、第25章の自然地理の限界は必須である。

### 3.5 出典検証なしにverifiedへ昇格できない

Lean定理:

```text
unknown_source_prevents_verified_claim
rejected_source_prevents_verified_claim
```

意味:

出典が不明または拒否された場合、その地理・郵便・自然地物データをverified claimとして扱ってはならない。これは、OSM、GeoNames、Natural Earth、NASA、UNESCO、各国郵便局、配送会社データを利用するときの境界である。

### 3.6 ZKPは住所の真実性を作らない

Lean定理:

```text
injective_public_claim_identifies_private_value
missing_required_attribute_prevents_attribute_gate
```

意味:

公開述語が細かすぎる場合、ZKを使っても秘匿性が壊れる。また、必要属性がcredentialに存在しない場合、目的スコープ付き証明は通らない。したがって、第25章で「AMTは暗号安全性を保証しない」と書くことは正しい。

## 4. 実装検証で支えられる限界

### 4.1 住所検証エンジンは国・出典・郵便制度に依存する

`addressVerificationEngine.test.ts` と `addressVerificationPolicy.test.ts` は、対象国、郵便番号制度、公式ソース、参照住所、強い郵便API、弱い郵便ソースによって検証結果が変わることを示す。

主な確認点:

- 郵便番号だけではpartialになる場合がある。
- weak postal sourceはverifiedへ昇格しない。
- 郵便番号がない国や地域はgeo verificationやmanual confirmationを必要とする。
- invalid postcode formatはunresolvedへ落ちる。

これは第25章25.1と25.6に反映すべきである。

### 4.2 品質スコアは内部制御である

`addressTabQuality.test.ts`、`addressQualitySummary.test.ts`、`qualityThresholdProof.test.ts` は、品質スコアが表示用真理ではなく、低品質タブ非表示、注意表示、再検証、品質しきい値証明の内部制御に使われることを示す。

主な確認点:

- 都市部で安定した住所タブは高品質になり得る。
- 島、山地、湖、砂漠、湿地、極地では、強い地理証拠があれば可視化できる。
- sparse natural geographyは再検証対象になり得る。
- exact score、quality components、quality reasonsは公開証明から隠す。

これは25.3の「品質スコアは真理ではない」を支える。

### 4.3 自然地理はsource-boundである

`naturalAddress.test.ts`、`mapFeatureAddress.test.ts`、`addressUtils.natural.test.ts` は、道路、橋、山、川、湖、池、公園、島、砂漠、湿地、氷原、荒野、塩湖、洞窟、谷、遺跡、世界遺産系ラベルを住所的表示に組み込めることを示す。

ただし、これは「世界中のすべての自然地理名を認識できる」という証明ではない。テストは、登録済みソース、地図ラベル、自然地理データ、座標、plus code、警告、アクセス点の扱いを検証している。

したがって第25章では、次を明記すべきである。

> 自然地理名は、出典に含まれる範囲で住所的参照になり得る。出典にない地物、境界が不明な地物、季節的に変化する地物は、source-bound verified、partial、reverification-required、unresolvedとして扱う。

### 4.4 商用API比較は全面勝利ではない

`addressVerificationBenchmark.test.ts` は、現行AGIDのベンチマークプロファイルが商用APIと比較可能であることを示す。しかし、第23章でも確認した通り、現行AGIDはdelivery point depth、authoritative postal depth、global postal coverageで商用APIに劣る可能性がある。

第25章では、次を採用するのが安全である。

> AMTは商用APIに常に勝つとは主張しない。AMTの強みは、曖昧性、保留、履歴、自然地理、垂直参照、監査可能性を理論として明示できる点である。

### 4.5 暗号安全性は別レイヤである

`privacyPolicy.test.ts`、`zkProofRuntime.test.ts`、`zkProofCompatibility.test.ts`、`privateAddressPredicateProof.test.ts` は、ZK-ready envelope、proof bundle、scope、challenge、nullifier、private material strippingの境界を実装上で検証している。

ただし、現状は本格的なSNARK、STARK、zkVM回路の完全監査ではない。TypeScriptは証明オブジェクトの組み立て、検証方針、公開情報の削減、境界管理に向くが、実ZK回路のsoundnessやzero-knowledgeは別バックエンドと監査を必要とする。

したがって、第25章では次を明記すべきである。

> AMTは、住所由来の何を証明すべきかを定義する。どう秘匿証明するか、鍵をどう管理するか、回路が安全かは、住所写像論IIまたはAGID/AOID応用論文の責務である。

## 5. 第25章に入れるべき反例

### 5.1 同一観測反例

二つの部屋、二つの住宅、二つの店舗、二つの自然地物が同じ観測表現を持つ場合、単一出力を強制すると誤発行が起こる。

例:

- 同じ郵便番号の複数住宅。
- 同じ緯度経度の1階店舗と2階事務所。
- 同じ山名を持つ複数ピーク。
- 同じ地図ラベル点から参照される広い湖と観光施設。

### 5.2 出典欠落反例

公式データや地図データにない私道、仮設住宅、避難所、季節道路、非公式集落、自然地物名は、候補生成に入らない可能性がある。この場合、AMTは「存在しない」と断定してはならない。

安全な表現:

> 出典にないことは、不存在の証明ではない。出典にないことは、候補生成と検証の限界を示す。

### 5.3 品質スコア反例

品質スコアが高くても、現地改修、移転、災害、行政変更、配送業者の内部ルール、建物入口変更により、実際の到達可能性が変わる可能性がある。

品質スコアが低くても、地方、島、山地、砂漠、極地、研究基地、避難所、歴史的地名として正しく存在する可能性がある。

### 5.4 ZKP反例

「この住所はある地域内である」という証明が正しくても、credentialの発行者が信頼できない、credentialが失効済み、公開述語が細かすぎて本人を一意化する、目的スコープが違う、という場合は安全ではない。

### 5.5 商用API反例

AMTがオープンソースデータで候補を作れても、配送会社の非公開到達実績や国別公式郵便データを持つ商用APIの方が、特定国の配送可否では正確な場合がある。

## 6. 第25章の採用方針

第25章は、次の順で書くと論文全体が安定する。

1. 完全解決は保証しない。
2. 保留状態は安全機構である。
3. AMTは暗号安全性を保証しない。
4. 品質スコアは真理ではない。
5. 自然地理はsource-boundである。
6. 社会的連続性は地理的同一性ではない。
7. 商用APIに常に勝つとは主張しない。
8. 本稿は完全な実証論文ではなく、理論母艦である。

## 7. 第25章の結論

第25章は、AMTの弱さを書く章ではない。AMTの過大主張を防ぎ、理論を反証可能にし、実装で安全に扱える範囲を明確にする章である。

最終的には、次の一文で締めるとよい。

> AMTの目的は、すべての住所を無理に一意化することではない。AMTの目的は、住所参照が解ける条件、解けない条件、保留すべき条件、外部証拠へ委ねる条件を明示し、誤った確定を避けることである。
