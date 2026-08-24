# Postal Context repository boundary

Status: `accepted-for-country-pack-reference-implementations-through-liechtenstein`

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
  |  examples: agid-postal-jp, agid-postal-sg, agid-postal-nl, agid-postal-gb, agid-postal-fr, agid-postal-nz, agid-postal-is, agid-postal-it, agid-postal-ee, agid-postal-ch, agid-postal-de, agid-postal-cz, agid-postal-dk, agid-postal-mt, agid-postal-mc, agid-postal-au, agid-postal-lv, agid-postal-lt, agid-postal-li
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
Iceland-specific Byggðastofnun postcode register/geometry, Pósturinn routing,
IS 50V building candidates, HMS address lineage, Statistics Iceland context,
and Póstbox rules belong to `agid-postal-is`.
Italy-specific Poste Italiane CAP assignment and restricted CAP Professional
rights, ANNCSU civic lineage, ISTAT administrative context, federated DBGT
building evidence, derived-surface rules, and historical CAP transitions belong
to `agid-postal-it`.
Estonia-specific Omniva postcode assignment, AKS postal-area geometry, ADS
address/building identity, EHAK administrative context, facility routing, and
AKS service-migration rules belong to `agid-postal-ee`.
Switzerland-specific Swiss Post assignment and rights, swisstopo PLZO geometry,
official building-address and GWR identity, swissBUILDINGS3D linkage,
swissBOUNDARIES3D context, and routing-exception rules belong to `agid-postal-ch`.
Germany-specific Deutsche Post assignment, licensed PLZ geometry, GA/HK-DE
address coordinates, HU-DE/LoD2-DE building linkage, VG25 administration,
state rights and cross-border routing rules belong to `agid-postal-de`.
Czechia-specific Česká pošta PSČ assignment and class lineage, RÚIAN
address-place and building identity, VFR/INSPIRE building geometry, territorial
context, informational-versus-reference status and derived-surface rules belong
to `agid-postal-cz`.

Denmark-specific PostNord assignment, DAGI Postnummerinddeling and
administrative history, DAR address and access-point identity, BBR building
records, GeoDanmark footprint linkage, street-postcode exceptions and service-
migration rules belong to `agid-postal-dk`.

Malta-specific MaltaPost assignment, Office of the Address Registrar confirmed
address and location-register lineage, Planning Authority building geometry,
NSO statistical context, register-transition and work-in-progress confirmation
rules belong to `agid-postal-mt`.

Monaco-specific La Poste ordinary and CEDEX routing assignment, DPUM address
and building identity, government urban-plan context, IMSEE districts,
cross-border separation, non-public source rights and derived-surface rules
belong to `agid-postal-mc`.
Australia-specific Australia Post postcode/PAF assignment and rights, G-NAF
address identity and secondary-mail-verification rules, ABS ASGS Postal Area
approximation and administrative context, licensed Geoscape building linkage,
non-area delivery classes, cross-state postcodes and external-territory
partitioning belong to `agid-postal-au`.
Latvia-specific Latvijas Pasts address and postcode membership, VZD State
Address Register identity and lifecycle, VZD cadastral building contours,
administrative context, special non-areal codes, generated noncanonical
surfaces, privacy exclusions and cross-border partitioning belong to
`agid-postal-lv`.
Lithuania-specific Lietuvos paštas assignment and lookup receipts, Registrų
centras Address Register point identity, NTR building boundaries, administrative
and settlement context, non-areal delivery endpoints, derived noncanonical
surface rules, privacy exclusions and cross-border partitioning belong to
`agid-postal-lt`.
Liechtenstein-specific shared Swiss Post assignment, LI-classified swisstopo
PLZO perimeter history, Liechtensteinische Post delivery endpoints, national
building-address and public GWR identity, municipal official-survey geometry,
sovereign country partitioning, attribution, privacy and special-code rules
belong to `agid-postal-li`.





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
### `agid-postal-is`

The Iceland repository owns Pósturinn three-digit routing classifications,
Byggðastofnun postcode-register decisions and geographic coverage,
Náttúrufræðistofnun IS 50V building lineage, HMS
Staðfangaskrá address identifiers and coordinate semantics, Statistics Iceland
context, synthetic fixtures, and release validation. A Byggðastofnun postcode
polygon is postal-area evidence but does not prove a street address, building, recipient,
or deliverability. HMS address points preserve coordinate type, review status,
accuracy, and `HEINUM`/`MATSNR` identifiers. IS 50V building proximity does not
become an exact address-to-building link without a source-backed relationship.
A user-selected Póstbox is a delivery preference and does not change the
premise's postcode polygon or imply residence at the locker.

### `agid-postal-it`

The Italy repository owns Poste Italiane CAP search receipts and licensed CAP
Professional assignment lineage, ANNCSU streets and civic numbers, ISTAT
administrative context, per-provider regional/municipal DBGT building lineage,
derived CAP surfaces, multiCAP street-range rules, historical transitions,
synthetic fixtures, and release validation. CAP Professional rows remain outside
public Git artifacts unless contract rights explicitly allow publication. A CAP
surface generated from assignment/address evidence and administrative clips is
always derived and never becomes an official Poste Italiane boundary. ANNCSU
civic points, DBGT footprint proximity, cadastral parcels, and AGID cells do not
create an exact address-to-building link. San Marino and Vatican City remain
separate `SM` and `VA` country packs.

### `agid-postal-ee`

The Estonia repository owns Omniva postcode-assignment lineage, AKS official
postal-area geometry, ADS address-object and addressed-building relationships,
EHAK administrative context, postal-facility exceptions, synthetic fixtures,
and release validation. Five-digit postcodes remain strings so leading zeroes
survive normalization. A postal-area polygon proves containment only; it does
not identify a street address, building, private building part, recipient, or
deliverability. Exact building display requires a source-backed ADS object path,
preserving stable `ADS_OID` identity and version-specific `ADOB_ID`, rather than
footprint proximity. Parcel machines, post offices, and Poste Restante routes
remain facility points and never become surrounding residential polygons. The
source interface must support the In-AKS transition from 27 April 2026 and the
retirement of legacy ADS services at the end of 2026 without rewriting lineage.

### `agid-postal-ch`

The Switzerland repository owns Swiss Post postcode search and contract
receipts, swisstopo official locality/postcode perimeters, official building
addresses, GWR building and entrance identity, swissBUILDINGS3D geometry,
swissBOUNDARIES3D context, synthetic fixtures, and release validation. A PLZO
polygon is official locality/postcode geometry for domicile-address codes; it
does not prove a particular street, entrance, building, recipient, or
deliverability. Exact public address resolution follows `EGAID` and the
nationwide-unique `EGID + EDID` entrance identity. A 3D building becomes exact
only where the pinned swissBUILDINGS3D edition supplies the same `EGID`;
proximity remains candidate evidence elsewhere. Swiss Post NPA6, sorting,
GeoPost and delivery datasets remain contract-partitioned. Special-purpose and
P.O. Box codes without a domicile perimeter remain non-areal. Liechtenstein is
published as a separately governed `LI` country pack.

### `agid-postal-de`

The Germany repository owns Deutsche Post postcode assignment and class
lineage, separately contracted DATAFACTORY and BKG delivery-postcode geometry,
GA/HK-DE address points, explicitly linked HU-DE/LoD2-DE building geometry,
VG25 administrative context, synthetic fixtures and release validation. A PLZ
area can be multipart and differs from administrative boundaries. Large-
recipient, Postfach and other non-area codes never receive invented residential
polygons. Any address-point or boundary-generated surface remains derived and
cannot impersonate Deutsche Post/BKG geometry. Exact building output requires
a source identifier or reviewed explicit crosswalk; AGS, containment and
proximity remain candidates. Restricted artifacts stay in product- and state-
specific rights partitions, and foreign German-routing exceptions remain in
their sovereign country packs.

### `agid-postal-cz`

The Czechia repository owns Česká pošta PSČ search and certified-output
lineage, RÚIAN address-place identity and definition points, explicitly linked
VFR or INSPIRE building geometry, RÚIAN territorial context, synthetic fixtures
and release validation. Operator assignments do not become nationwide official
PSČ polygons. Surfaces generated from RÚIAN points or administrative clips are
always derived and opt-in. Exact building output follows a source-defined
parent building code, ISKN identifier or reviewed explicit crosswalk;
containment and proximity remain candidates. Informational VDP evidence is not
presented as legally referenceable basic-register evidence. CC BY 4.0 artifacts
retain attribution, and recipient, resident, owner, forwarding, customer and
other non-public data remain outside public artifacts.

### `agid-postal-dk`

The Denmark repository owns PostNord postcode-assignment receipts, official
DAGI Postnummerinddeling MultiSurface geometry, `ErGadepostnummer` street-area
classification, DAR address and Husnummer UUIDs, BBR building identity,
explicitly linked GeoDanmark footprints, DAGI administrative context,
synthetic fixtures and release validation. A DAGI postcode polygon proves
postal containment only; it does not identify an address, building, recipient
or deliverability. DAR's needle principle assigns an access point to a postcode,
but the point is not a footprint. Exact building output requires a source-backed
DAR/BBR/GeoDanmark relation or reviewed crosswalk; containment and proximity
remain candidates. Valid time and registration time stay separate across DAGI
and DAR. GeoDanmark keeps its product-specific terms, BBR fields remain rights-
reviewed, and the transition from retiring Datafordeler services must preserve
identity and history. Greenland and the Faroe Islands remain separately governed
`GL` and `FO` packs.

### `agid-postal-mt`

The Malta repository owns MaltaPost postcode-finder receipts, confirmed Office
of the Address Registrar addressable-object and location-register lineage,
Planning Authority Large Scale Topography building geometry, NSO spatial
context, derived postcode surfaces, synthetic fixtures and release validation.
A MaltaPost result proves assignment for its finder input but not an official
postcode polygon, addressable-object geometry or building. OAR portal records
marked work in progress remain metadata-only until a confirmed release or
confirmation receipt exists. A public address geocode is not a building
footprint. Exact building output requires a source identifier or reviewed
explicit crosswalk; containment and proximity remain candidates. P.O. Box and
facility routing remain non-areal. Electoral, person, resident, household,
owner, identity-card, recipient and other private data stay outside public
artifacts. The Address Management Unit to OAR transition, Gazette lineage and
valid/known time remain reproducible, and Malta, Gozo and Comino remain inside
the single `MT` country pack without merging nearby foreign territory.

### `agid-postal-mc`

The Monaco repository owns pinned La Poste Monaco rows, addressing and CEDEX
receipts, licensed DPUM address and building extracts, dated government urban
plans, IMSEE territorial context, derived routing surfaces, synthetic fixtures
and release validation. Five digits beginning with `980` are structurally
valid, but structure alone does not prove current allocation. `98000` ordinary
routing and CEDEX, organisation, service or BP designators retain their source
classification. La Poste's official open-data catalogue explicitly omits
postcode contours, so any surface is derived and noncanonical. The existence
of the internal DPUM address/building/parcel SIG is not a public bulk-data or
redistribution grant. Exact building output requires a shared DPUM identifier
or reviewed explicit crosswalk; containment, nearest, OSM and plan overlays
remain candidates. Public artifacts exclude resident, occupant, apartment,
owner, cadastral-party, recipient and delivery-customer data. Monaco remains a
separate `MC` pack and never absorbs neighbouring French addresses or geometry.





### `agid-postal-au`

The Australia repository owns pinned Australia Post postcode and PAF contract
metadata, delivery-category semantics, G-NAF address identity and geocode
lineage, ABS ASGS Postal Area and administrative editions, licensed Geoscape
building relationships, derived surfaces, synthetic fixtures and release
validation. Australia Post assignment does not imply a public boundary. G-NAF
postcode values do not independently verify mail receipt, and the G-NAF EULA's
secondary-verification rule remains attached to mailing use. ABS POAs are
Mesh Block approximations, exclude many non-street-delivery codes and remain
official-derived noncanonical geometry. Exact building output requires a
pinned `building_address` relationship or reviewed explicit crosswalk;
containment and proximity remain candidates. PO Boxes, Locked Bags, Parcel
Lockers, Parcel Collect, large-volume receivers and specialist codes remain
non-areal routing or facility records by default. Public artifacts exclude
recipients, residents, owners, customers, change-of-address data and delivery
instructions. Christmas Island, Cocos (Keeling) Islands and Norfolk Island are
published as separate `CX`, `CC` and `NF` country packs.

### `agid-postal-lv`

The Latvia repository owns pinned Latvijas Pasts directory or permitted lookup
evidence, VZD State Address Register releases, VZD cadastral building contours,
derived postal surfaces, synthetic fixtures and release validation. Latvijas
Pasts assignment is address-, range-, locality-, or organization-oriented and
does not imply an official public polygon. VZD postcode attributes require
operator cross-checking for postal claims. Exact building output requires a
stable explicit address/cadastral relation; containment and proximity remain
candidates. Municipality and village boundaries add context only and never
become postal boundaries. Special organization codes, post offices, PO boxes,
parcel terminals and poste-restante endpoints remain non-areal unless explicit
source geometry exists. Public artifacts exclude recipients, residents,
owners, tenants, private units, cadastral subjects and restricted-security
objects. Latvia remains an `LV` pack and never absorbs neighbouring country
geometry during surface generation.

### `agid-postal-lt`

The Lithuania repository owns pinned Lietuvos paštas address/postcode lookup
evidence, Registrų centras Address Register releases, NTR building boundaries,
administrative context, derived postal surfaces, synthetic fixtures and release
validation. Lietuvos paštas results prove assignment membership for the lookup
input but do not publish an official postcode polygon. Registrų centras address
points provide civic identity and geometry without replacing postal-operator
authority. Exact building output requires a stable explicit registry relation or
reviewed crosswalk; containment and nearest-footprint matching remain candidates.
Municipality, eldership, settlement and street geometry adds context only and
cannot create, clip or replace a postcode. P.O. boxes, parcel terminals, post
offices, organizations and other routing endpoints remain non-areal unless an
independent source proves area geometry. Any surface generated from complete,
pinned and rights-cleared assignment membership plus address points is derived
and noncanonical. Public artifacts exclude recipients, residents, owners,
tenants, private-unit occupants, telephone data, credentials and protected
registry subjects. Lithuania remains an `LT` pack and never absorbs geometry
from Latvia, Belarus, Poland or Russia during border partitioning.


### `agid-postal-li`

The Liechtenstein repository owns pinned Swiss Post PLZ4 assignment evidence,
LI-classified swisstopo PLZO locality and PLZ6 perimeters, Liechtensteinische
Post delivery endpoints, national building-address releases, public GWR fields,
municipal official-survey geometry, sovereign boundaries, synthetic fixtures
and release validation. Shared Swiss sources never merge the two countries: a
blank canton value, `94xx` syntax, border proximity or clipping cannot by itself
classify a row as LI. Swiss and Austrian features remain outside the LI pack,
and LI features never receive CH country or AGID identity. PLZO geometry covers
domicile-address postcode types; company, professional, administrative, PO-box,
parcel-terminal and other special routes may remain non-areal. An address or GWR
point is not a building footprint. Exact building output requires the same
official building identifier or a reviewed explicit crosswalk; containment and
proximity remain candidates. Public artifacts retain the required
“Liechtensteinische Landesverwaltung” attribution and license link while
excluding recipients, residents, owners, tenants, dwelling occupants,
forwarding records, credentials and non-public register fields.

### `agid-postal-az`

The Azerbaijan repository owns pinned Azərpoçt postcode and locality evidence,
provider-approved Ünvan Reyestri İnformasiya Sistemi address releases,
permitted cadastral object geometry, derived postal surfaces, synthetic
fixtures and release validation. The UPU `AZNNNN` convention proves syntax,
not current allocation. An Azərpoçt search result or postal-office point is not
a nationwide official postcode polygon, and interactive access is not a bulk
reuse license.

Any postcode surface built from rights-cleared address membership remains
derived and retains its algorithm, members, boundary clips, omissions,
uncertainty, temporal lineage and rights. Exact building display requires the
same official address/cadastral object identifier or a reviewed crosswalk;
address points, parcels, containment and proximity remain candidates. Postal
evidence never determines sovereignty or legal administrative boundaries.
Multipart components remain unbridged across the Nakhchivan exclave, borders,
unsourced gaps and disputed classifications. Public artifacts exclude
recipients, residents, owners, occupants, title records, credentials and all
protected registry fields.

### `agid-postal-al`

The Albania repository owns pinned Posta Shqiptare postcode-to-office or
branch evidence, provider-approved National Address System releases,
permitted ASHK cadastral building geometry, derived postal surfaces, synthetic
fixtures and release validation. The four-digit UPU convention proves syntax,
not current assignment. A post-office point is not an official postcode
polygon, and an interactive ASIG service is not automatically a bulk reuse
license.

A postcode surface derived from rights-cleared official address membership
retains its algorithm, members, boundary clips, omissions, uncertainty,
temporal lineage and rights and is always labelled `derived`. Exact building
display requires the same official address/cadastral object identifier or a
reviewed explicit crosswalk; address points, parcels, containment and proximity
remain candidates. Postal evidence never determines sovereignty or legal
administrative boundaries. Albania and Kosovo remain separate country packs,
and shared language, locality names, routing or border proximity cannot assign
AL country or AGID identity to a neighboring feature. Public artifacts exclude
recipients, residents, owners, occupants, title records, civil-status fields,
credentials and protected cadastral attributes.

### `agid-postal-am`

The Armenia repository owns pinned HayPost postal-region and post-office
assignment evidence, provider-approved Cadastre Committee address releases,
permitted National Geoportal building geometry, derived postal surfaces,
synthetic fixtures and release validation. The UPU four-digit convention
proves syntax and code-component semantics, not current allocation. A
post-office point is not an official postcode polygon, and interactive search
or map access is not automatically a bulk reuse license.

A postcode surface derived from rights-cleared official address membership
retains its algorithm, members, boundary clips, omissions, uncertainty,
temporal lineage and rights and is always labelled `derived`. Exact building
display requires the same official address/cadastral object identifier or a
reviewed explicit crosswalk; address points, parcels, containment and proximity
remain candidates. Postal evidence never determines sovereignty or legal
administrative boundaries. Country and disputed-feature classification must
cite a separately pinned authority, policy and territorial vintage; routing,
language, locality names and proximity cannot assign AM identity. Public
artifacts exclude recipients, residents, owners, rightsholders, occupants,
title and restriction records, credentials and protected registry fields.

### `agid-postal-ad`

The Andorra repository owns pinned current-operator postcode assignments,
licensed-product scope receipts, provider-approved Govern d'Andorra address
releases, IDE Andorra parish and topographic-building layers, derived postal
surfaces, synthetic fixtures and release validation. UPU syntax and examples
prove the `ADNNN` form, address placement, two-operator context and parish
coding, not current allocation or a full-code perimeter.

The Correos product page says its licensed postcode database includes Andorra,
but an Andorra polygon is authoritative only when the contract and product
manifest expressly include that scope. A parish boundary cannot silently stand
in for a full-code postal polygon. Derived surfaces retain address members,
algorithm, clips, omissions, uncertainty, temporal lineage and rights. Exact
building display requires a common authoritative address/building identifier or
reviewed crosswalk; Urban Guide points, POIs, topographic shapes, containment
and proximity remain candidates. Postal evidence never decides sovereignty or
legal boundaries. Country and border-feature classification cites a separately
pinned authority, policy and vintage. Public artifacts exclude addressees,
residents, owners, tenants, occupants, cadastral rights, tax data, credentials
and protected register fields.

### `agid-postal-ua`

The Ukraine repository owns pinned Ukrposhta postcode, address and post-office
assignment evidence, separately time-stamped service status, provider-approved
Unified State Address Register and Register of Buildings releases, permitted
NSDI/KATOTTG layers, derived postal surfaces, synthetic fixtures and release
validation. UPU syntax proves the five-digit form and address placement, not
current allocation, service availability or a perimeter.

Ukrposhta open-data resources are pinned at dataset level with their license,
schema, scope, update time and digest. Search/API access has separate automation,
credential, rate-limit, retention and redistribution review. `AVAILBLE`,
`LOCK_CODE`, closures and replacement-office routes are operational assertions;
they do not erase assignment, create permanent geometry or guarantee delivery.
Derived surfaces retain address members, algorithm, clips, exclusions, outage
context, uncertainty, temporal lineage and rights and are never official.

Exact building display requires a common authoritative address/building
identifier or reviewed crosswalk; points, parcels, footprints, containment and
proximity remain candidates. NSDI public access is restricted during martial
law, and site-level terms never override layer-specific holder, security or
license restrictions. Postal or foreign-operator evidence, service gaps,
routing, language, current control, occupation and proximity never decide
sovereignty, country identity or legal boundaries. Public artifacts exclude
personal, cadastral-right, protected-register, military and security-sensitive
data.

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
