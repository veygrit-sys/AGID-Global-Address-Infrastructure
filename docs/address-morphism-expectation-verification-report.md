# 住所写像論 期待項目の検証結果

作成日: 2026-06-06

## 目的

`docs/address-morphism-executable-expectations.md` に整理した14個の期待項目について、現時点で実行可能な検証を行った。ここでの「通過」は、現行リポジトリ、現行テストデータ、現行ポリシーの範囲での通過であり、全世界・全住所・全API・完全な暗号学的安全性を証明するものではない。

## 実行した検証

| 区分 | コマンド | 結果 |
| --- | --- | --- |
| 期待レジストリ | `npx tsx --test src/lib/executableExpectations.test.ts` | 5 tests pass |
| AMT解決・PID監査 | `npx tsx --test src/lib/addressMorphism.test.ts src/lib/addressMorphismSources.test.ts src/lib/pidIssuanceAudit.test.ts src/lib/addressMorphismNetwork.test.ts` | 23 tests pass |
| 多言語検索・翻訳 | `npx tsx --test src/lib/searchQuery.test.ts src/lib/addressMultilingualCompatibility.test.ts src/lib/addressLanguageCompatibility.test.ts src/lib/addressLanguageSpheres.test.ts src/lib/addressEnglish.test.ts src/lib/eastAsiaAddressTranslation.test.ts src/lib/westernEuropeAddressTranslation.test.ts` | 56 tests pass |
| 自然・文化地物 | `npx tsx --test src/lib/naturalAddress.test.ts src/lib/mapFeatureAddress.test.ts src/lib/addressUtils.natural.test.ts src/services/NatureService.test.ts src/services/PolarService.test.ts src/services/SeaService.test.ts` | 27 tests pass |
| 住所タブ品質 | `npx tsx --test src/lib/addressTabQuality.test.ts src/lib/addressQualitySummary.test.ts src/data/address_formats/asiaAddressQuality.test.ts src/data/address_formats/americasAddressQuality.test.ts src/data/address_formats/europeAddressQuality.test.ts src/data/address_formats/oceaniaAddressQuality.test.ts` | 23 tests pass |
| 住所検証・ソース | `npx tsx --test src/lib/addressVerificationEngine.test.ts src/lib/addressVerificationBenchmark.test.ts src/lib/addressVerificationPolicy.test.ts src/data/postalSourceMetadata.test.ts scripts/verify-gis-data.test.ts scripts/verify-pwa-build.test.ts scripts/generate-agid-sdks.test.ts` | 28 tests pass |
| ZK-ready / Credential | `npx tsx --test src/lib/agidZkAddressProofs.test.ts ... src/lib/credentialIssuerTrustRegistry.test.ts` | 92 tests pass |
| AGID/AOID/API/MCP/Polkadot | `npx tsx --test src/lib/agidAoidGovernance.test.ts ... src/server/routes/routeAudit.test.ts` | 38 tests pass |
| Lean形式化 | `lean formal/AMTCore.lean` | pass |
| GISデータ | `npm run verify:gis` | 351 features, 0 errors, 149 warnings, GDAL ok |
| GIS warning budget | `npm run verify:gis:budget` | pass; registered sources 408/408 |
| 郵便ソース静的検証 | `npm run verify:postal-sources` | 281 format files, 408 source ids, 89 postal APIs, 201 probe targets, static issues 0 |
| PID衝突リスク | `npm run verify:pid-risk` | 128 bits, birthday upper bound 1.469e-15, pass |
| 型検査 | `npm run lint` | pass |
| 本番ビルド | `npm run build` | pass; large chunk and mixed static/dynamic import warnings remain |

## 期待項目ごとの判定

| ID | 期待 | 現在の判定 | 根拠 | まだ言えないこと |
| --- | --- | --- | --- | --- |
| candidate-coverage | 候補生成を強化すれば真の対象が候補集合に入りやすくなる | 部分検証 | AMT候補生成、OSSメタデータ、自然住所候補のテストは通過 | 国別gold datasetによるrecall@k改善は未検証 |
| multilingual-recall | 多言語展開は住所検索recallを上げる | 現行スコープ通過 | 多言語検索・翻訳・言語圏互換テスト56件通過 | 全言語・全旧地名・全別名でのrecall改善は未検証 |
| equivalence-class-stability | 同値類は表記揺れより安定する | 部分検証 | クラスタ維持、表記違い、翻訳、PID不変性のテストとLeanの同値類定理 | 行政変更・地名再利用・分筆統合の大規模実データ検証 |
| unresolved-reduces-false-issuance | unresolvedは誤発行を減らす | 実装検証通過 | near tie、弱証拠、未解決時PIDなし、Leanのunresolved安全性 | 実配送データ上のfalse issuance低下率 |
| pid-gate-auditability | PID発行ゲートは監査可能性を高める | 実装検証通過 | PID監査proof、AMN envelope、署名改ざん拒否、未解決PID拒否 | 実運用監査ログでの長期再現性 |
| lineage-graph-split-merge | 住所履歴は関数よりグラフ/関係が強い | 形式検証通過 | Leanで一対多splitを関数が表現できないこと、PID lifecycle split/merge proof | 実行政履歴データとの網羅的照合 |
| address-entropy | 識別対象数・粒度で住所情報需要が増える | 形式/実装の下支えあり | Leanの有限コード容量下限、候補数・品質・自然住所テスト | 都市・田舎・島・山地・砂漠を横断する統計ベンチマーク |
| context-relative-optimum | 文脈ごとに最適住所が変わる | 形式/実装の下支えあり | Leanの文脈相対性定理、AMTのpurpose別重み | 配送・消防・行政・不動産データでのtop candidate disagreement |
| natural-cultural-referents | 自然・文化地物は住所的参照になれる | 現行スコープ通過 | 川、湖、滝、島、砂漠、湿地、氷原、洞窟、谷、遺跡、世界遺産系テスト通過 | 世界全地物名の認識、全ソースcoverage |
| address-tab-quality-calibration | 住所タブ品質スコアは内部制御に使える | 現行スコープ通過 | 都市、田舎、島、山地、砂漠、湿地、極地の品質ルーティングテスト通過 | 実ユーザー入力でのfalse positive/negative率 |
| official-source-depth | 公式郵便・行政ソースで検証は強くなる | 静的検証通過 | 408 source ids、89 postal APIs、201 probe targets、static issue 0 | live API応答品質、商用利用条件の継続監査 |
| commercial-validator-competition | 商用住所検証APIに競争できる | 未検証 | 比較軸とhonest benchmark profileは通過 | Loqate/Experian/Melissa/Smartyとの同一条件ライブ比較 |
| zk-address-privacy | AMT属性は秘匿住所証明に有効 | ZK-ready検証通過 | nullifier、freshness、consent、AOID ownership、region membership、bundle互換性のテスト92件通過 | 実ZK回路のsoundness/zero-knowledge監査、witness leakage監査 |
| agent-mcp-integration | AGID/AOIDは買い物Agent/MCPに接続できる | 実装検証通過 | API endpoints、MCP endpoint、private material rejection、public bundle registration通過 | 外部MCPクライアント・実買い物Agentでの相互運用試験 |

## 検証で確認できた主張

現行スコープで安全に書ける主張は次の範囲である。

1. AMTは、候補生成、クラスタ、unresolved、履歴更新、PID発行を監査可能なenvelope/proofとして扱える。
2. unresolvedは、弱証拠や近接タイでPIDを出さない安全状態として実装されている。
3. 多言語住所処理は、同一性判定ではなく候補生成・検索recallの前段として実装されている。
4. 自然・文化地物は、郵便住所を置換するのではなく、source-bound referentとして住所的表示に組み込める。
5. 住所タブ品質スコアは、ユーザーに直接表示する真理値ではなく、非表示・注意・再検証・二重検証省略の内部制御に使える。
6. ZK関連実装は、住所本文を公開しないproof-ready envelope、nullifier、scope、freshness、revocation、bundle互換性を検査できる。
7. AGID/AOIDの公開API、MCP、Polkadot連携は、秘密住所やAOID秘密情報を公開しない方向でテストされている。

## まだ未検証として残すべき期待

以下は、現行テストだけでは「期待」として残すべきであり、論文では断定しない。

| 期待 | 未検証の理由 | 検証方法 |
| --- | --- | --- |
| 候補生成のrecall改善 | gold datasetが国別・地域別に固定されていない | country/region/feature type別のrecall@k、miss rate、unresolved rateを測る |
| 住所エントロピーの経験則 | 都市化・制度設計・グリッド効率が交絡する | 候補数、識別ビット、住所長、曖昧率を地域類型別に測る |
| 商用APIに勝つ | 商用APIの非公開データと配送事業者連携を未比較 | 同一入力、同一国、同一用途、同一評価指標で有料API比較を実施 |
| 公式ソースの実運用品質 | live probeを無効化している | `npm run verify:postal-sources:live` を対象APIの利用条件確認後に実施 |
| 完全なZK安全性 | 現状は回路ではなくproof-ready/envelope中心 | Noir/Circom/Rust-ZKVM回路、監査、witness leakage、匿名集合評価を行う |
| 世界全自然地名認識 | OpenStreetMap等のcoverageに依存する | OSM/GeoNames/Natural Earth/NASA/UNESCOなどsource-bound benchmarkを作る |

## 論文での書き換え指針

強く書ける:

```text
現行実装では、AMTの候補生成、同値類クラスタ、unresolved gate、PID発行監査、自然地理参照、住所タブ品質制御、ZK-ready envelopeを、単体テスト、Lean形式化、GIS静的検証、郵便ソース静的検証によって検査した。
```

避けるべき:

```text
AMTは世界中の全住所を完全に解決できる。
AMTは商用住所検証APIすべてに勝つ。
AMTは完全なZK住所証明を実装済みである。
```

安全な表現:

```text
AMTは、検証可能な条件の下で住所解決を監査可能にし、条件が不足する場合はunresolvedまたは追加証拠要求へ退避する。現行実装は、公開可能な証拠、品質ゲート、監査envelope、ZK-readyな属性証明基盤を備えるが、全世界coverage、商用API比較、完全なZK回路安全性は今後の経験検証対象である。
```

## 結論

期待14項目のうち、現行リポジトリで強く支えられているのは、unresolved安全性、PID発行監査、lineage/split-merge、自然・文化地物表示、住所タブ品質制御、ZK-ready envelope、AGID/AOID/API/MCP連携である。

一方、候補生成recall、住所エントロピー、商用API競争、公式API live品質、完全ZK安全性、世界全地物coverageは、まだ大規模データ・外部API・暗号回路監査を必要とする。したがって論文では、現行検証済みの主張と、今後検証すべき経験的期待を明確に分けるべきである。
