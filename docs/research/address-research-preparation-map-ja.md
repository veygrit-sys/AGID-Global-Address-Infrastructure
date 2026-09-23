# 住所研究準備マップ

本メモは、住所を扱う研究領域を、論文、仕様、数理モデル、実装テストへ分解するための準備表である。対象は住所データモデル、正規化、検索、インデックス、写像、検証、プライバシー、認証、更新・履歴、分散データベースである。

本メモの目的は、各研究を混ぜすぎず、しかし相互運用できるように境界を定めることである。住所写像理論は中核意味論として扱うが、AddressQL、AGID/AOID、Address Wallet、Skipship、ZK住所述語は応用・実装・検証の接続先として分離する。

## 0. 共通研究方針

住所研究は、完全解決を主張しない。住所は国、地域、言語、時代、制度、配送網、建物構造、社会慣習によって変化するため、研究の中心は「常に一意に解くこと」ではなく、「どの条件で解けるか、どの条件で保留するか、どの証拠を追加すべきか」を定義することに置く。

共通成果物:

- 形式定義: 集合、関係、写像、グラフ、確率、時系列、証明系。
- 仕様: JSON Schema、OpenAPI、SQL/AddressQL関数、SDK型。
- 合成fixture: raw住所ではなく、参照、別名、ハッシュ、commitment、合成文字列。
- テスト: 正常系、異常系、衝突、欠落、古い住所、別名、プライバシー漏洩。
- 非主張: 全世界完全住所、実在住所保証、配送SLA保証、暗号安全性の無条件保証、公式データ完全収録。

共通記法:

```text
S_t: 時刻tに観測される住所表現集合
X_t: 時刻tに存在する参照対象集合
C_t: 候補集合
E_t: 証拠集合
H: 住所履歴グラフ
P: 住所属性述語集合
Q: 品質・信頼度・鮮度の評価空間
R: 権限・目的・開示範囲
```

## 1. 住所データモデル

研究目的:

住所を文字列ではなく、構造、地理、制度、配送、履歴、権限、品質を持つデータ型として定義する。

中心問い:

- 世界共通の最小住所要素は何か。
- 国別住所制度を、共通モデルへどう射影するか。
- 建物、入口、部屋、階、キャンパス、施設、島、自然地名、POIをどこまで含めるか。
- 住所と配送先、居住地、登記地、連絡先、訪問先をどう分けるか。

数理対象:

```text
Address = (Administrative, Postal, Topological, Spatial, Delivery, Identity, Evidence)
Administrative = country -> region -> locality -> district
Postal = postalCode, route, deliveryZone
Topological = street, block, building, entrance, floor, unit
Spatial = coordinate, polygon, gridCell, uncertainty
Delivery = carrierReachability, accessConstraint, serviceLevel
Identity = pid, agid, aoid, externalRefs
Evidence = sourceRefs, timestamps, confidence, license
```

準備する成果物:

- `AddressCoreModel v0.1` JSON Schema。
- 国別拡張可能な `countryProfile`。
- `address_kind`: residential, commercial, government, natural_feature, island, facility, locker, temporary。
- 合成fixture: 郵便住所、3D建物、自然地名、旧住所、配送不可住所。

弱点・注意:

- 国別制度を過度に共通化すると情報落ちが起きる。
- 住所は「場所」だけでなく「利用目的」を含むため、単一モデルに押し込むと危険。

## 2. 住所正規化理論

研究目的:

表記ゆれを統一しつつ、情報を失った正規化を検出できる理論を作る。

中心問い:

- 正規化は同一性判定ではなく、候補生成の前処理に留めるべきか。
- 言語、文字種、略称、旧名、ローマ字転写、郵便番号補完をどの順序で扱うか。
- 正規化衝突をどう検出するか。

数理モデル:

```text
normalize: S -> N
loss: S x N -> L
collision(n) = {s in S | normalize(s) = n}
safe_normalize(s) = (n, lossReport, collisionRisk)
```

研究仮説:

- 住所正規化は冪等性 `normalize(normalize(s)) = normalize(s)` を満たすべきである。
- ただし、冪等性だけでは同一住所性を保証しない。
- 正規化結果には必ず損失レポートを添付すべきである。

準備する成果物:

- `ADDRESS_NORMALIZE()` の関数仕様。
- 正規化衝突fixture。
- 国別ローマ字転写profile。
- 異常系: 旧字、略称、順序反転、郵便番号欠落、同名町域。

非主張:

- 正規化済み文字列の一致は、同一住所の証明ではない。

## 3. 住所検索理論

研究目的:

曖昧・多言語・部分入力・旧地名・自然地名を含む検索を、同一性判定と分離して定義する。

中心問い:

- 検索は recall 重視、解決は precision 重視に分けるべきか。
- 多言語検索、別名検索、読み仮名、略称、郵便番号検索をどう統合するか。
- 検索結果を候補集合としてどう説明可能にするか。

数理モデル:

```text
query q -> retrieve(q) = C
rank: C x context -> score
explain(c) = matchedTokens, sourceRefs, languagePath, risk
```

評価指標:

- recall@k
- precision@k
- unresolved rate
- false merge rate
- language coverage
- stale-name hit rate

準備する成果物:

- 多言語・旧地名・別名fixture。
- `ADDRESS_SEARCH(query, locale, purpose)`。
- `ADDRESS_SEARCH_EXPLAIN()`。
- 検索とPID発行を分離する仕様。

非主張:

- 検索上位候補は、同一住所の確定ではない。

## 4. 住所インデックス理論

研究目的:

郵便番号、行政区画、座標、道路網、ランドマーク、建物、島、自然地名を組み合わせた住所専用インデックスを定義する。

中心問い:

- B-tree、trigram、全文検索、R-tree、H3、GeoHash、行政階層indexをどう組み合わせるか。
- 近い住所と早く届く住所が違う場合、配送indexをどう作るか。
- 国別郵便番号が存在しない地域をどう扱うか。

数理モデル:

```text
I = I_text x I_admin x I_postal x I_spatial x I_route x I_landmark
candidate(q) = union/intersection/weightedJoin(I_i(q))
```

準備する成果物:

- `ADDRESS_INDEX_PROFILE(country)`。
- AddressQL index hints。
- PostgreSQL/PostGIS/DuckDB向け試験仕様。
- 島・自然地名・POIのsource completeness gate。

非主張:

- 単一インデックスで全住所検索を最適化できるとは主張しない。

## 5. 住所写像理論

研究目的:

住所表現、候補、参照対象、履歴、品質、未解決状態を写像の連鎖として扱う中核意味論を定義する。

中心問い:

- 住所表記から参照対象へ写像できる条件は何か。
- 候補欠落、正規化衝突、射影損失、履歴分裂があるとき、なぜ保留が必要か。
- PID/AGID/AOIDをどの層に置くか。

数理モデル:

```text
parse: S -> Parts
normalize: Parts -> N
generate: N -> C
resolve: C x E x Q -> X | unresolved
identify: X -> PID
audit: (S, C, E, Q, decision) -> envelope
```

主要命題:

- 候補集合に真の対象が含まれなければ完全解決は不可能。
- 非単射な観測から無条件に一意PIDを発行してはならない。
- unresolved は失敗ではなく、安全状態である。

準備する成果物:

- AMT定義集。
- 可換図式集。
- 反例集。
- Lean/TypeScript/GIS検証の分担表。

非主張:

- 住所写像理論は暗号安全性や配送SLAを単独では保証しない。

## 6. 住所検証理論

研究目的:

住所が構造的、郵便的、地理的、配送的、証拠的に妥当かを分けて評価する。

中心問い:

- 形式検証と存在検証をどう分けるか。
- 公式データ、OSM、GeoNames、Wikidata、商用API、配送会社応答をどう重み付けするか。
- 検証失敗時に修正、保留、追加証拠要求をどう選ぶか。

検証レイヤー:

```text
format_valid
country_profile_valid
postal_format_valid
postal_exists_valid
admin_exists_valid
geospatial_consistent
deliverability_claimed
source_evidence_sufficient
freshness_valid
```

準備する成果物:

- `ADDRESS_VALIDATE()`。
- `POSTAL_VALIDATE_FORMAT()` と `POSTAL_VALIDATE_EXISTS()` の分離。
- source evidence schema。
- 公式fallback依存を国別公式bulk/APIへ置換する計画。

非主張:

- 検証成功は、居住事実や本人性の証明ではない。

## 7. 住所プライバシー理論

研究目的:

住所を利用可能にしながら、不要な開示、再識別、横断追跡、目的外利用を防ぐ。

中心問い:

- 住所情報の最小開示単位は何か。
- 配送、本人確認、地域判定、友達配送で開示粒度をどう変えるか。
- 住所ID、pairwise alias、nullifier、consent envelope をどう使うか。

数理モデル:

```text
disclose(address, purpose, actor, policy) -> view
view in {proof_only, selective_claims, carrier_decryptable, merchant_visible}
privacyRisk = f(granularity, linkability, retention, actor, purpose)
```

準備する成果物:

- privacy boundary matrix。
- no-raw-address test。
- consent envelope schema。
- carrier-only handoff fixture。
- friend delivery privacy tests。

非主張:

- 参照化だけで完全匿名になるとは主張しない。

## 8. 住所認証理論

研究目的:

住所に関する主張を、本人認証、住所credential、配送承認、ZK住所述語に分けて扱う。

中心問い:

- ログイン済みであることと住所利用承認はどう違うか。
- Credential issuer、wallet、merchant、carrier、verifierの責務をどう分けるか。
- 住所を公開せずに、地域内、配送可能、住所credential有効を証明できるか。

モデル:

```text
subject_auth != address_claim_valid
address_claim = (issuer, subjectAlias, predicate, evidenceRef, freshness, revocation)
verify(statement, proofRef, policy) -> accepted | rejected | stale
```

準備する成果物:

- Address Login要求仕様。
- ZK proof input schema。
- verifier hook。
- non-claim tests。
- credential freshness/revocation fixture。

非主張:

- ZK証明は、issuerや元データの正しさを単独では保証しない。

## 9. 住所更新・履歴理論

研究目的:

住所変更、行政区画変更、建物改称、郵便番号変更、災害時仮設住所、旧地名を履歴グラフとして扱う。

中心問い:

- 旧住所と新住所を同一対象としてつなぐ条件は何か。
- merge/split/rename/reassign をどう区別するか。
- 履歴更新がPID、AGID、AOID、配送先IDに与える影響は何か。

数理モデル:

```text
H = (V, E)
edgeType in {renamed, moved, split, merged, reassigned, deprecated, temporary}
valid_at, observed_at, source_ref, confidence
```

準備する成果物:

- Address Lineage schema。
- `ADDRESS_AS_OF(addressRef, time)`。
- `ADDRESS_HISTORY(addressRef)`。
- merge/split反例fixture。
- stale credential handling。

非主張:

- 履歴接続は常に社会的同一性を保証するわけではない。

## 10. 住所分散データベース理論

研究目的:

国、自治体、配送会社、OSS gazetteer、商用API、wallet、registryが分散して持つ住所データを、安全に同期・検証・監査する理論を作る。

中心問い:

- 住所データのsource of truthは単一か、多元か。
- 国別repository、continent index、ocean index、P0/P1/P2 gazetteer packをどう設計するか。
- conflict、staleness、license、provenanceをどう扱うか。
- raw住所を持たないpublic registryと、権限付きprivate vaultをどう分けるか。

モデル:

```text
Replica_i = (data, sourcePolicy, license, freshness, trust)
merge(replica_i, replica_j) -> accepted | conflict | unresolved
publicLayer = refs, commitments, metadata
privateLayer = encrypted address material, consent, credentials
```

準備する成果物:

- geodata/source catalog。
- source completeness gate。
- country repository template。
- signed manifest。
- conflict resolution fixture。
- offline/online sync policy。

非主張:

- 分散DB化しても、公式データ欠落、ライセンス制限、古い地名問題は自動解決しない。

## 11. 研究ロードマップ

Phase 1: 研究分類を固定する。

- 本メモを母表にする。
- 10領域それぞれに1ページ仕様を作る。
- 住所写像理論、AddressQL、Address Login、Skipshipの責務境界を表にする。

Phase 2: executable specへ落とす。

- JSON Schema。
- TypeScript model。
- AddressQL関数表。
- 合成fixture。
- failure/non-claim tests。

Phase 3: 評価データを作る。

- 国別住所形式。
- 郵便番号形式/存在。
- 多言語・旧地名・別名。
- 島・自然地名・POI。
- 履歴更新。
- privacy redaction。

Phase 4: 論文化する。

- 住所情報工学: 全体の総論。
- 住所写像理論: 意味論と解決可能性。
- 住所検索・インデックス理論: 検索と候補生成。
- 住所プライバシー・認証理論: Address Login/ZK述語。
- 住所分散DB理論: source completenessと同期。

## 12. 最初に作るべき最小成果物

1. `AddressResearchDomain` registry。
2. 10領域の `researchQuestion`, `model`, `fixture`, `nonClaim` を持つJSON。
3. `verify:address-research-prep`。
4. `docs/research/address-research-preparation-map-ja.md` から registry へのリンク。
5. AddressQL関数、AMT章、Address Login、Skipshipの対応表。

この順序なら、研究が抽象論だけで終わらず、仕様、SDK、テスト、論文へ自然に接続できる。
