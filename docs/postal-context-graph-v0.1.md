# Postal Context Graph v0.1

Status: `draft-specification`

Machine-readable schema: [`postal-context-graph-v0.1.schema.json`](schemas/postal-context-graph-v0.1.schema.json)

この文書は、郵便番号領域、行政区域、番地、建物、入口、組織などを、
根拠と時間を失わずに住所表示へ解決するための共通モデルを定義する。
実装済み範囲を宣言する文書ではなく、国別データ pack、resolver、API が共有する
互換性契約である。

本書の `MUST`、`MUST NOT`、`SHOULD`、`MAY` は規範要件を表す。

## 1. 目的と非目標

中心となる処理は次である。

```text
coordinate / AGID / address query
  -> postal and spatial candidate generation
  -> evidence-backed address context graph
  -> purpose-specific coherent address path
  -> country-specific display
```

Postal polygon は候補抽出と郵便コンテキストの重要な証拠だが、番地、建物、
配送可否を単独で保証しない。システムは Postal polygon から番地や建物を推測して
断定するのではなく、その領域に関連付けられた独立の住所・建物データへ到達する。

本仕様は次を非目標とする。

- 郵便区域と行政区域を同一視すること。
- 全郵便番号を強制的に Polygon 化すること。
- 一つの緯度経度だけから部屋、居住者、受取人、配送可否を推定すること。
- 各国の住所を `street + house number` という単一階層へ変換すること。
- 単一の `confidence` 数値で、出典、時間、位置精度、権威を代用すること。

## 2. グラフモデル

Postal Context Graph は、Entity と Assertion からなる二時点 property graph とする。

\[
G_{v,k}=(V,A_{v,k})
\]

- `v`: 現実世界で有効な時点 (`valid time`)
- `k`: システムが証拠を知っていた時点 (`known time`)
- `V`: 安定した identity を持つ Entity
- `A`: Entity 間の関係、名称、住所要素、geometry を述べる Assertion

### 2.1 Entity types

| Entity | 意味 |
| --- | --- |
| `PostalFeature` | 郵便制度上のコードまたは配送識別子。コード文字列自体ではない。 |
| `AdministrativeArea` | 国、都道府県、市区町村などの行政領域。 |
| `Locality` | 町域、集落、地区、通称地域など。 |
| `Thoroughfare` | 道路、通り、経路。各国で存在しない場合がある。 |
| `AddressRecord` | 番地等を構造化した意味的住所。geometry と分離する。 |
| `AddressPoint` | 入口、屋上、敷地代表点など、住所の空間表現。 |
| `Parcel` | 地籍・土地単位。公開可能性と制度は国別に異なる。 |
| `Building` | 建物 identity。建替え後の建物は原則として別 identity とする。 |
| `BuildingPart` | 棟、ウイング、階層など、建物の構造的部分。 |
| `Entrance` | 建物またはUnitへアクセスする入口。 |
| `Unit` | 部屋、区画、店舗区画等。公開 pack には原則含めない。 |
| `Organization` | 組織 identity。建物名や所在地とは分離する。 |
| `DeliveryEndpoint` | 私書箱、ロッカー、局留め等、必ずしも面を持たない配送先。 |

住所要素は固定された世界共通ツリーではなく、`AddressRecord` に順序付きで関連する。
例えば日本は都道府県、市区町村、町字、丁目、街区、住居番号、地番等を使え、
道路名を必須にしない。国別 profile は要素の意味、正規化、表示順を定義するが、
共通 Entity の意味を変更してはならない。

### 2.2 Core predicates

| Predicate | 意味 |
| --- | --- |
| `addresses` | `AddressRecord` が Parcel、Building、Unit 等を識別する。 |
| `locates` | `AddressPoint` が住所または住所対象の空間表現になる。 |
| `stands_on` | Building と Parcel の物理的関係。 |
| `part_of` | BuildingPart、Unit 等の構造的包含。 |
| `accesses` | Entrance がアクセス可能な Building、BuildingPart、Unit。 |
| `occupies` | Organization が Building または Unit を使用する時間付き関係。 |
| `receives_mail_at` | Organization 等と配送用 AddressRecord の関係。 |
| `postal_assigned` | 郵便当局、住所台帳等による明示的な郵便番号割当。 |
| `postal_contains` | Postal geometry による空間包含。派生関係である。 |
| `delivery_served_by` | 配送制度または事業者が明示するサービス関係。 |
| `admin_within` | 行政領域との関係。郵便割当を意味しない。 |
| `same_as` / `probable_same_as` | 出典をまたぐ identity 対応。破壊的 merge を意味しない。 |
| `supersedes` / `split_into` / `merged_into` | identity または制度変更の履歴。 |

`postal_assigned`、`postal_contains`、`delivery_served_by` は別の事実であり、
一致しなくてもよい。resolver はその不一致を隠してはならない。

## 3. Assertion contract

すべての表示可能な claim は、少なくとも次を持つ Assertion に到達できなければならない。

```json
{
  "id": "assert-jp-...",
  "fromNodeId": "address-jp-...",
  "relation": "postal_assigned",
  "toNodeId": "postal-jp-...",
  "validTime": { "from": "2026-04-01T00:00:00Z", "to": null },
  "knownTime": { "from": "2026-05-01T00:00:00Z", "to": null },
  "source": {
    "sourceId": "source-jp-...",
    "sourceType": "official",
    "assignmentAuthority": "official_postal_operator",
    "geometryAuthority": "none"
  },
  "method": "explicit_assignment",
  "quality": {
    "status": "authoritative"
  }
}
```

Assertion は `validTime` と `knownTime` を混同してはならない。訂正は過去のAssertionを
消去せず、`knownTime.to` を閉じた新しいAssertionとして表現する。API は `asOf` と
`knownAt` を受け取れるようにし、応答に採用 release と policy version を含める。

### 3.1 Geometry revision

Geometry は Entity の永続属性ではなく、Entity に対するversioned Assertionとする。
Geometry record は少なくとも次を持つ。

- `geometryRole`: `postal-area`, `building-footprint`, `entrance-point`,
  `address-point`, `parcel`, `route`, `representative-point` 等。
- `geometryType`: `Polygon`, `MultiPolygon`, `Point`, `LineString`, `none`。
- CRS、位置精度、簡略化方法、valid/known time、artifact digest。
- `official`, `statistical`, `derived`, `virtual` を区別するauthority class。

`po_box`、`organization`、`large_user` は geometry type ではなく、
`PostalFeature` または `DeliveryEndpoint` の意味分類とする。

## 4. Identity rules

- Entity ID は不変であり、郵便番号文字列、住所文字列、座標、建物名をIDにしてはならない。
- 各ソースの識別子は `sourceIdentifier` として保持し、canonical ID と分離する。
- `same_as` は根拠付きAssertionであり、データ行を不可逆に統合してはならない。
- 建物の解体・建替え、Parcelの分割・統合、郵便コードの廃止後再利用では、
  原則として新しいEntityを作り、履歴edgeで結ぶ。
- 名称、AddressRecord、組織入居、入口、郵便割当は独立した有効期間を持つ。

## 5. Evidence and claim ceiling

Evidence は次の階層を基準とし、国別 policy が具体的なsource tierを割り当てる。

| Tier | 例 | 原則的な上限 |
| --- | --- | --- |
| `E0` | 公式な直接割当、安定IDによる対応 | その割当が明示するEntity |
| `E1` | 公式Entity間link、検証済み台帳crosswalk | link先Entity |
| `E2` | 厳密なgeometry包含・交差 | 空間関係。郵便・住所割当は別途必要 |
| `E3` | holdout検証済みの派生crosswalk | policyが定める範囲 |
| `E4` | 距離上限付き最近傍 | 候補のみ。通常は確定不可 |
| `E5` | AGID virtual fallback | virtual contextのみ |

品質は一つの確率へ潰さず、少なくともauthority、method、freshness、coverage、
positional accuracy、validation statusを分離する。校正済みholdoutがない場合、
`confidence: 1.0` のような確率的表現をしてはならない。

Resolver が返す安全な解像度は次の `claimLevel` で表す。

```text
country
administrative
locality
postal-area
street-or-block
premise
building
entrance
unit
organization
delivery-endpoint
```

Postal polygon の包含だけでは原則 `postal-area` を超えない。番地にはAddressRecord、
建物にはそのAddressRecordとBuildingのcoherentなlinkが必要である。2D座標だけで
`unit`を返してはならない。Organizationは有効な入居・配送関係がある場合だけ返す。

## 6. Purpose-specific resolution

同じ地点でも目的により正解が異なるため、解決要求は `purpose` を必須にする。

| Purpose | 優先する意味 |
| --- | --- |
| `display` | 人が理解できる現在の住所表記。 |
| `delivery` | 明示的な郵便割当、配送endpoint、配送用入口。 |
| `navigation` | 到達可能な入口、アクセス経路、建物。 |
| `cadastral` | Parcel、地番、地籍上の関係。 |
| `validation` | 入力住所と独立証拠の整合性。 |

Country renderer は選択済みpathを表示するだけであり、候補選択や証拠強度を変更しては
ならない。Hosted serviceがなくても、pin済みpackによるlocal/self-hosted resolutionを
実行できなければならない。

### 6.1 Resolution algorithm

1. `purpose`、`asOf`、`knownAt`、pack releaseを固定する。
2. AGID cell、bbox、Postal polygon等で候補を抽出する。
3. 元geometryで包含・交差・境界を厳密に判定する。
4. 候補ごとに、時間整合したEntityとAssertionからAddress Pathを生成する。
5. 明示的な割当を単なる空間包含より優先する。
6. evidence tier、authority、temporal validity、spatial relation、qualityを
   決定的なpolicy tupleで比較する。
7. 上位候補が一意に安全とはいえない場合は棄却せず、複数候補を返す。
8. 選択したpathをcountry rendererへ渡す。

重み付きscoreだけで候補を黙って一つに決めてはならない。policy IDとversion、
比較理由、候補差を応答または監査可能なevidenceに残す。

## 7. Coherent Address Path

表示住所は、同じ目的・時点で互換なAssertionからなる一つのpathでなければならない。

```text
PostalFeature
  <- postal_assigned - AddressRecord
  - addresses -> Building
  <- accesses - Entrance
  - admin_within -> AdministrativeArea
```

異なる候補から、郵便番号、番地、建物名を都合よく混ぜた
`Franken-address` を作ってはならない。複数ソースを合成する場合も、canonical identity、
有効期間、country policy、行政・郵便整合性を検証し、各componentにAssertion IDを残す。

## 8. Ambiguity and abstention

結果statusは次を使う。

```text
unique | partial | ambiguous | conflict | no_match
```

最低限、次の曖昧性を区別する。

- `boundary_ambiguity`
- `multiple_address_records`
- `multiple_buildings`
- `multiple_entrances`
- `vertical_unresolved`
- `postal_assignment_conflict`
- `source_conflict`
- `temporal_gap`
- `campus_or_complex`
- `no_spatial_geometry`

境界上、複数住所を持つ建物、駅・地下街・団地・campus、複数入口、複数Unitでは、
候補を保持する。曖昧性を「最寄り」の一語で消してはならない。

## 9. Minimal response contract

次はpublic API adapterが返すrendered envelopeの例である。pure resolverの内部型にある
`selectedCandidateId`、`candidates`、`policyVersion`を、adapterが目的別の
`selectedPathId`、表示component、policyへ変換する。変換時もAssertion IDを失ってはならない。

```json
{
  "status": "partial",
  "purpose": "display",
  "resolvedLevel": "building",
  "release": {
    "packId": "agid-postal-jp",
    "releaseId": "jp-2026.08.1",
    "manifestDigest": "sha256:..."
  },
  "policy": "jp-display-v0.1",
  "selectedPathId": "path-...",
  "displayAddress": "synthetic display fixture",
  "components": [
    {
      "kind": "postal-code",
      "value": "000-0000",
      "basis": "explicit-assignment",
      "assertionId": "assert-..."
    }
  ],
  "alternatives": [],
  "ambiguities": ["vertical-unresolved"]
}
```

API は採用release、manifest digest、policy、resolved level、component provenanceを
返す。応答に含める表示文字列やgeometryは、呼出し目的とvisibility policyで削減できる。

## 10. Privacy and public-pack boundary

本仕様は [AGID Governance](../GOVERNANCE.md) と
[AGID Privacy Design](privacy-design.md) の no-raw-address boundaryに従う。

- Public country packは公共・非個人のpostal、administrative、locality、公開建物、
  公開施設、合成fixture、provenanceだけを扱う。
- 実在する個人住所、受取人、電話番号、私的Unit、私有入口、配送指示、private AOID、
  precise private coordinateをpublic artifact、fixture、logへ出してはならない。
- `Unit` と `Organization` はグラフ型として定義するが、public packへの収録を意味しない。
  私的Unitはlocal-firstなAOIDまたは暗号化された権限制御層で扱う。
- Resolver queryの座標・住所文字列は通常のserver logへ記録してはならない。
- 公開artifactのcacheと、個別住所resolution応答のcache policyを分離する。
- purpose limitation、最小開示、保持期間、削除・訂正経路をhosted deploymentで定義する。

## 11. Conformance minimum

Country packとresolverは、少なくとも次の合成fixtureを検証する。

- 単一の住所を持つ建物。
- 一Parcelに複数Building。
- 一Buildingに複数AddressRecordと複数Entrance。
- 郵便境界をまたぐBuilding。
- Postal polygonと明示的郵便割当の不一致。
- 私書箱、大口事業所、geometryなしPostalFeature。
- Buildingの建替え、PostalFeatureの廃止・再利用、組織入居の時間変化。
- Campus、駅、地下街、集合住宅の`ambiguous`または`partial`応答。
- 2D地点からUnitを断定しないnegative fixture。
- component provenanceを持たない表示を拒否するfixture。
- public exportにraw personal addressまたはprivate Unitがないこと。

実在の個人住所をfixtureに使ってはならない。Country packは共通conformanceを満たした上で、
日本の住居表示・地番方式等の国別fixtureを追加できる。

## 12. AGIDとの関係

AGID cellは安定した空間参照、候補索引、virtual fallbackに利用できるが、住所Entityや
PostalFeatureを置換しない。AGID cell coverは高速な候補抽出用であり、境界候補は
元geometryで最終判定する。

Public AGIDは公開住所コンテキストを参照できる。私的な部屋、受取人、電話、配送指示は
AOIDまたは暗号化されたprivate address recordへ残し、Postal Context Graphの公開releaseへ
昇格させてはならない。
