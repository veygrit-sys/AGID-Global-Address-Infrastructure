# Postal Context repository boundary

Status: `accepted-for-japan-singapore-netherlands-united-kingdom-france-and-new-zealand-reference-implementations`

AGIDとPostal Contextのデータ本体は、別リポジトリにする。分離の目的は、
データ量だけではなく、更新頻度、出典、ライセンス、訂正、国別制度、release rollbackを
AGIDアプリのreleaseから独立させることである。

この決定は [GOVERNANCE.md](../GOVERNANCE.md) のRepository Split Policyを具体化する。
新しいremote repositoryの作成や公開をこの文書だけで承認するものではない。

## 1. Repository topology

```text
Address-Grid-ID
  |  owns: PCG contract, resolver, API adapter, SDK types, light fixtures
  |  pins: country release manifest + SHA-256
  v
agid-postal-{country}
  |  owns: country source profiles, transforms, validation, release metadata
  |  examples: agid-postal-jp, agid-postal-sg, agid-postal-nl, agid-postal-gb, agid-postal-fr, agid-postal-nz
  |  publishes: immutable artifact manifest
  v
content-addressed object storage / CDN
     owns: GeoParquet, FlatGeobuf/PMTiles, indexes, checksums

agid-postal-forge
  owns: reusable ETL operators, schema verifier, release builder
  is used by country repositories, but does not own country truth
```

### `Address-Grid-ID`

AGID本体に置くもの:

- Postal Context Graphのversioned TypeScript contractとJSON Schema。
- country release manifestの検証、digest pin、last-known-good selection。
- evidence-aware pure resolverとAPI/SDKの互換surface。
- 実在住所を含まない小さなconformance fixture。
- AGID cell coverを候補索引として読むadapter。

AGID本体に置かないもの:

- 日本郵便、ABR、自治体、PLATEAU、登記所備付地図、GSI等のraw dump。
- 全国のPostal polygon、建物footprint、Parcel geometry。
- 国別ETLの中間成果物、tile cache、検索index。
- 私的Unit、受取人、電話番号、配送指示、顧客データ。

### `agid-postal-forge`

国に依存しないsource intake、normalization、geometry validation、lineage、diff、
quality gate、manifest生成を持つ。国別ruleをcoreへhard-codeせず、versioned profileとして
注入する。日本固有の住居表示・地番・大口事業所ruleは`agid-postal-jp`が所有する。
Singapore-specific delivery-point and sector rules belong to `agid-postal-sg`.
Netherlands-specific PC6 range, BAG address/building, and attributed CBS/Esri
derived-area rules belong to `agid-postal-nl`.
United Kingdom unit-postcode, PAF, ONSPD, UPRN, building, derived-area, and BT
rights-partition rules belong to `agid-postal-gb`.
France-specific La Poste assignment, BAN address, BD TOPO building-link, COG,
derived-area, CEDEX, and overseas-partition rules belong to `agid-postal-fr`.
New Zealand-specific PNF/PAF rights, urban/RD/box/bag delivery semantics, LINZ
address and building lineage, Stats NZ context, and Pacific territory rules
belong to `agid-postal-nz`.

### `agid-postal-jp`

日本Reference Implementationの正本とする。source catalog、license ledger、JP profile、
source-specific importer、crosswalk、例外分類、合成fixture、検証結果、release manifestを持つ。
再配布できないraw sourceはGitにも公開artifactにも置かず、隔離されたvalidation環境から
集計済みquality evidenceだけを渡す。

### `agid-postal-sg`

Singapore's canonical country repository owns SingPost contract metadata,
OneMap receipt policy, named data.gov.sg source lineage, six-digit point-first
rules, postal-sector exceptions, synthetic fixtures, and release validation.
Subscription rows, API tokens, and unreviewed API caches remain outside Git and
public artifacts.


### `agid-postal-nl`

The Netherlands repository owns PostNL contract and API receipt policy, BAG
address/building lineage, attributed CBS/Esri PC4/PC5/PC6 derived geometry,
PC6 address-range rules, PO-box exceptions, synthetic fixtures, and release
validation. PostNL licensed rows and API keys remain outside Git. BAG geometry
does not become postal-operator geometry, and CBS/Esri derived areas never
become official PostNL boundaries.

### `agid-postal-gb`

The United Kingdom repository owns Royal Mail PAF rights metadata, ONSPD
release and attribution lineage, OS UPRN/address/building lineage, derived
unit-postcode surfaces, large-user, PO Box, BFPO, historical-reuse, and
Northern Ireland licensing exceptions. PAF and premium OS rows remain outside
Git unless reviewed rights permit an artifact. ONS address-mean coordinates are
not delivery points or postcode boundaries, open UPRNs are not complete
addresses, generalized buildings are not exact premise links, and generated
surfaces never become official Royal Mail boundaries.

### `agid-postal-fr`

The France repository owns La Poste postal-code-to-INSEE assignment lineage,
BAN address-point evidence, IGN BD TOPO address-to-building links, COG
administrative history, derived postal surfaces, CEDEX/BP/CS/TSA exceptions,
synthetic fixtures, and release validation. Postal-code areas generated from
BAN points or commune geometry remain derived and never become official La
Poste boundaries. CEDEX and other special routing codes are non-areal unless
independent evidence proves otherwise. Overseas territories and Monaco are
published as separately governed ISO country packs rather than silently mixed
into the France runtime.

### `agid-postal-nz`

The New Zealand repository owns NZ Post PNF and PAF rights metadata,
Address Checker receipt policy, four-digit and leading-zero rules, urban and
Rural Delivery network geometry, box and bag exceptions, LINZ address and roof
outline lineage, Stats NZ context, synthetic fixtures, and release validation.
Licensed NZ Post rows and geometry remain outside Git unless publication rights
permit an artifact. RD number and mailtown remain routing fields, box and bag
postcodes do not become surrounding residential areas, LINZ roof proximity does
not become an exact address-to-building link, and Cook Islands, Niue, Tokelau,
and other independent ISO territories remain separate country packs.



一国一repoは、source、license、更新周期、訂正窓口、制度ruleを独立させる単位として採用する。
一方、PCG schema、共通ETL、API型を国ごとにcopyしてはならない。

### Heavy artifact store

巨大なgeometryやindexは通常のGit objectとして配布しない。immutable URLとSHA-256を持つ
object storage/CDN releaseとして配布し、Git repositoryにはmanifest、source metadata、
small sample、reproducible build recipeだけを置く。Git LFSを唯一のruntime依存にしない。

## 2. Versioned integration contract

AGIDはcountry repositoryのbranchや`main`を直接読まない。次を固定して読む。

```text
countryCode + releaseId + manifestDigest + policyVersion
```

Release manifestは最低限、次を含む。

- `schemaVersion`, `repositoryId`, `countryCode`, `releaseId`, `policyVersion`。
- `releasedAt`, `validTime`, `previousReleaseId`。
- manifest自身のdigestを検証するためのcanonicalization rule。
- artifactごとのrelative pathまたはHTTPS URL、media type、byte length、record count、SHA-256。
- source release、license reference、attribution、transformation method、quality report digest。
- geometry、assignment、AGID coverの各artifactを独立検証できる構成。

Manifest digestは、`manifestDigest` fieldを除外したcanonical JSONに対して計算するか、
release catalog側のdetached digestとして持つ。自己参照digestを定義してはならない。

AGID runtimeは次の順でreleaseを導入する。

1. 許可されたrepository/catalogからmanifestを取得する。
2. pin済みmanifest digest、schema、country、policy互換性を検証する。
3. artifactをstaging cacheへ取得し、sizeとdigestを検証する。
4. schema、geometry、lineage、privacy、country conformanceを検証する。
5. 全gate通過後にactive pointerをatomicに切り替える。
6. 失敗時はactive releaseを変更せず、last-known-goodを維持する。

`git submodule`、mutable `latest` URL、branch HEAD、未検証のpackage postinstallを
production連携に使わない。

## 3. Japan production flow

```text
Japan Post assignment records
  -> ABR municipality / town-aza identity crosswalk
  -> regular / partial-town / multi-town / large-user classification
  -> licensed atomic geometry selection
  -> municipal civic address or cadastral path
  -> independently evidenced building / entrance link
  -> bitemporal PCG assertions
  -> optional AGID cell cover
  -> immutable release artifacts
```

重要な権限分離:

- 日本郵便の公式なコード割当は`assignment_authority`であり、公式Polygonを意味しない。
- ABR町字IDは住所identityの基軸だが、未提供の下位geometryを意味しない。
- PLATEAUやGSIの建物外形はgeometry evidenceであり、郵便番号・番地・建物名の割当を
  単独では証明しない。
- 自治体の住居番号と法務省系の地番は別のAddress Pathであり、相互代入しない。
- 大口事業所番号はorganization assignmentであり、周辺の面Postal areaに拡張しない。

Postal polygonはwhole-town assignmentが証明できる場合だけ町字geometryをdissolveする。
部分町域、番地範囲、階層範囲、個別事業所でatomic geometryが不足する場合は、
`partial`、point、または`no spatial geometry`として残し、Voronoi等で公式らしい面を作らない。

## 4. Artifact families

一つの巨大GeoJSONをAPIの正本にしない。目的別にartifactを分ける。

| Artifact | 主用途 | 備考 |
| --- | --- | --- |
| GeoParquet | canonical analytical release | columnar、source/provenance保持、batch検証 |
| FlatGeobufまたはPMTiles | bbox/tile配信 | HTTP range、地図表示、候補抽出 |
| compact lookup index | postal code / entity lookup | exact code、stable ID、release pin |
| AGID cover index | coarse spatial candidate search | AGID model/version/resolutionを明記 |
| JSON/GeoJSON sample | conformanceとdebug | 小さな合成または公開可能sampleのみ |
| quality report | promotion/rollback判断 | source別、例外別、holdout別に集計 |

AGID coverはcanonical geometryではなく再生成可能なprojectionとする。少なくとも
`agidModelVersion`、resolution、cover algorithm version、source geometry digest、
boundary-cell handlingを記録し、最終判定は元geometryで行う。

## 5. API ownership

Public contractはAGID側が所有し、country releaseはデータを供給する。

```text
GET  /api/v1/postal/capabilities
POST /api/v1/postal/resolve
GET  /api/v1/postal/{country}/{postalCode}
GET  /api/v1/postal/releases/{country}
GET  /api/v1/postal/intersects?country=JP&bbox=...
```

Hosted APIのstable base pathは`/api/v1`とする。`/api`はserver内部のlegacy aliasであり、
`/v1`単独のaliasは提供しない。

精密な座標を受けるresolveは`POST`、`Cache-Control: private, no-store`、raw query logging無効を
原則とする。M2の公開resolveは住所文字列、Unit、受取人、電話番号、配送指示を受け取らない。
`validAt`は現実世界の評価時刻、`knownAt`はシステムの知識時刻であり、resolveでは`validAt`を
必須とする。公開Polygon/tile/manifestはimmutable URLとdigestで長期cacheできる。

API responseはrelease ID、manifest digest、policy version、status、resolved levelを返す。
componentの`assertionId`やlookupの`assertionIds`を返す場合は、country releaseに含まれるstableな
source/release IDだけを公開する。`runtime:*`の一時Assertion ID、query node ID、address-point ID、
path IDはredactする。

郵便番号lookupのgeometryは`geometry=geojson`を明示した場合だけ返し、省略時と`geometry=none`は
住所contextだけを返す。M2ではlookup geometryを最大16 feature/20,000 position、bbox intersectsを
`limit=1..16`（default 16）に制限し、未返却のmatchがある場合は`truncated`を明示する。

同一郵便番号に複数の住所階層branchがある場合、lookupは最大32件の`alternatives`へbranch別の
`postalFeature + contexts + assertionIds`を分離し、top-levelの`contexts`と`assertionIds`には全branchの
共通部分だけを返す。上限超過時は`ambiguous`とwarningを返し、top-level共通部分を空にして誤結合を
避ける。

Hosted APIは利便性のためのsurfaceであり、public contractやpin済みpackのlocal resolutionを
独占してはならない。

## 6. Release, correction, and rollback

- Releaseはimmutableとし、訂正は新releaseで行う。
- 現実の有効期間`validTime`と、システムが知った期間`knownTime`を別に持つ。
- Source refreshごとにfeature count、covered area、exception class、link rate、holdoutをdiffする。
- material driftは自動昇格せずreviewを要求する。
- active pointerとlast-known-good pointerを分ける。
- M2 runtimeはactive release、またはactiveが無効な場合の検証済みLKGだけをserveする。
- M2のrelease selectorは`active`、または現在serve中の`releaseId + manifestDigest + policyVersion`の
  完全一致を受ける。不一致pinはHTTP 409とし、任意の過去releaseへ暗黙fallbackしない。
- APIの時間入力は`validAt`と`knownAt`とする。
- M3以降でimmutable historical catalogを導入した場合だけ、過去release pinをpublic capabilityとして
  宣言できる。廃止releaseのmanifestとlicense lineageは、その監査・再現要件に従って保持する。

## 7. Privacy and licensing boundary

Public graphは郵便、行政、町域、公開建物、公開施設、公開source provenanceまでを対象にする。
Unit、受取人、電話、私的入口、配送指示、私有 precise pointはAOIDまたは暗号化・権限制御された
private layerに残す。Country repositoryの公開releaseへ入れない。

License compatibilityはprovider名ではなくsource releaseごとに判断する。Artifactを少なくとも
`open-core`、`source-specific-terms`、`approval-required`、`validation-only`に分け、
制約の強いsourceを混ぜたためにopen artifact全体の権利が不明になることを避ける。

現行のowner routingでは、公開仕様・conformance・public country indexは
`dawnportinfo-design`、hosted operations・managed registry・customer integrationは
`veygrit-sys`が既定である。`agid-postal-jp`のremote ownerは公開範囲と運用範囲を
確定してから選び、ownerの違いでsource licenseが変わるとは扱わない。

## 8. First Japan milestone

最初のmilestoneは全国Polygon完成ではなく、境界が正しいvertical sliceとする。

1. PCG contract、manifest verifier、synthetic JP conformanceを固定する。
2. 日本郵便とABR町字のmetadata/license/release pin pipelineを作る。
3. 通常、部分町域、複数町域、大口事業所を100%分類する。
4. license-clearedな限定区域でatomic geometryとbuilding linkを実証する。
5. AGID coverを生成し、coarse candidateからoriginal geometryで再判定する。
6. Shadow APIで`postal-area -> premise -> building -> entrance`のclaim ceilingを検証する。
7. 二回連続のsource refresh、holdout、drift、rollback試験後にstable候補とする。

日本referenceがこの境界を満たしてから、同じPCG contractで次の国repoを追加する。
