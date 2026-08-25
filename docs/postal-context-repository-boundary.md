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
  |  examples: agid-postal-jp, agid-postal-sg, agid-postal-nl, agid-postal-gb, agid-postal-fr, agid-postal-nz, agid-postal-is, agid-postal-it, agid-postal-ee, agid-postal-ch, agid-postal-de, agid-postal-cz, agid-postal-dk, agid-postal-mt, agid-postal-mc, agid-postal-au, agid-postal-lv, agid-postal-lt, agid-postal-li, agid-postal-sk, agid-postal-si, agid-postal-no, agid-postal-hu, agid-postal-fi, agid-postal-bg, agid-postal-by, agid-postal-rs
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

Norway-specific Posten Bring assignment and G/P/B/S categories, Kartverket
Postnummerområder geometry, Matrikkelen address/unit/building-point identity,
licensed FKB building linkage, administrative context and NO/SJ territory
partition rules belong to `agid-postal-no`.
Hungary-specific Magyar Posta Partner Extra assignment and special-endpoint
semantics, derived-surface rules, KCR address and unit identity, Lechner EHA
location and cadastral linkage, separately rights-cleared INSPIRE/NTA/cadastral
building evidence, KSH administration, privacy and redistribution partitions
belong to `agid-postal-hu`.
Finland-specific Posti assignment and Basic Address File membership, Statistics
Finland Paavo statistical geometry, DVV address/building identity, Ryhti open
building evidence, NLS interpolated address/topographic context, EPSG:3067
transform rules and FI/AX territory partitioning belong to `agid-postal-fi`.
Bulgaria-specific Bulgarian Posts routing, GRAO/CAIS address identity, AGCC
cadastral buildings, NSI EKATTE administration, EPSG:9391 transforms and
noncanonical derived-surface rules belong to `agid-postal-bg`.

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

### `agid-postal-at`

The Austria repository owns pinned Österreichische Post current and historical
postcode/destination assignment, separately licensed Address Data/PAC evidence,
BEV address and building identity, Statistik Austria postcode-region products,
BEV administrative context, derived surfaces, synthetic fixtures and release
validation. Four-digit syntax and destination locations are assignment clues,
not automatic postal polygons or delivery guarantees.

Geometry authority remains explicit. A Post perimeter is operator-official only
when an exact licensed product says so. Statistik Austria PLZ regions are
official statistical geometry, not Austrian Post perimeters. Rights-cleared BEV
address membership may produce a versioned `derived` surface with method,
members, exclusions, uncertainty and temporal lineage. Non-area, organization,
route and PO-box codes may remain non-areal.

BEV's seven-digit `Adresscode` and three-digit building `Subcode` are retained
as separate text identifiers. Address coordinates, building coordinates,
parcels and footprints are distinct; exact building display requires the same
identifier pair or a reviewed explicit crosswalk, while containment and
proximity remain candidates. A license for one BEV snapshot never silently
extends to address search, INSPIRE services or another product.

Austrian Post contract data and protected GWR individual records stay outside
public artifacts, including addressees, households, residents, owners,
occupants, dwellings and delivery instructions. Administrative boundaries,
German/Swiss/Liechtenstein routing, provider coverage, syntax, border clipping
and proximity never establish postal membership or transfer country identity.
AT identity cites independently pinned sovereign-boundary evidence.

### `agid-postal-cy`

The Cyprus repository owns pinned Cyprus Post directory, street/range and
permitted API assignment evidence, DLS INSPIRE addresses and buildings, DLS
administrative context, CYSTAT statistical postal sectors, derived surfaces,
synthetic fixtures and release validation. Four-digit syntax and the inbound
`CY-` prefix are presentation rules, not allocation, deliverability or geometry.

Geometry authority remains explicit. A Cyprus Post perimeter is operator-
official only when an exact pinned operator product publishes and licenses it.
CYSTAT postal sectors are official statistical geometry tied to census/reference
time, not current Post perimeters. Rights-cleared street/range and DLS address
membership may create a versioned `derived` surface with members, method,
exclusions, uncertainty, validity and lineage. PO-box, organization, route and
other non-area codes may remain non-areal.

DLS INSPIRE Address points, address-building relationship tables, parcel
relations and INSPIRE Building footprints retain separate identifiers and
semantics. Exact building display requires an explicit relationship, common
authoritative identifier or reviewed crosswalk; parcel containment and
proximity remain candidates. Every open-data artifact pins its own CC BY 4.0
resource, attribution, schema, coverage, vintage, CRS and digest.

CY country identity, Republic-government effective-control/service coverage,
the Green Line, non-government-controlled areas, Sovereign Base Areas and the
existing `CYGL`, `TRNC` and `SBA` feature classes remain separate assertions.
Foreign routing, missing service, API state, DLS extent, postcode syntax,
administrative geometry and clipping never decide sovereignty, recognition or
control and never silently merge those classes. Public artifacts exclude
addressees, residents, owners, rightsholders, occupants, title records,
delivery instructions, credentials and protected cadastral fields.

### `agid-postal-gr`

The Greece repository owns pinned ELTA postcode/address lookup receipts,
permitted assignment snapshots, GISCO postcode points, rights-reviewed Greek
address and building layers, derived surfaces, synthetic fixtures and release
validation. Five-digit syntax and `NNN NN` display are formatting rules, not
allocation, delivery, geographic coverage or polygon authority.

Geometry authority remains typed. GISCO provides official-derived postcode
points for statistical correspondence and explicitly allows omissions,
mislocation and exclusion of non-geographic codes. A point, buffer, Voronoi
cell, NUTS/LAU region, municipality, island, settlement, delivery office or
street match is never an ELTA perimeter. Any rights-cleared address-membership
surface remains `derived` with members, method, exclusions, uncertainty,
validity and lineage; PO-box, organization and route codes may remain non-areal.

Hellenic Cadastre layers, ELSTAT census cartography, municipal street naming
and a future national streets/numbers register retain separate identifiers,
coverage, dates and rights. Exact building display requires an explicit
address-building identifier or reviewed crosswalk from a distributable source.
A cadastral parcel, title/right record, census block, building outline,
containment or proximity is not a public address-building relationship.

Mainland, island and remote delivery service, Mount Athos administrative
autonomy, municipality changes and operator routing remain separate assertions.
Postal evidence never changes country identity or administrative/legal status.
Every artifact pins product-specific terms, attribution, schema, coverage,
vintage, CRS and digest. Public artifacts exclude addressees, residents,
owners, rightsholders, occupants, cadastral/title records, delivery
instructions, credentials and protected attributes.

### `agid-postal-hr`

The Croatia repository owns pinned Hrvatska pošta postcode, settlement,
destination-office and Zagreb street/range assertions; DGU Spatial Unit
Register delivery-office areas; DGU INSPIRE address, building, administrative
and cadastral layers; derived postal surfaces; synthetic fixtures and release
validation. Five domestic digits and international `HR-NNNNN` display are
formatting rules, not current allocation, delivery or geometry authority.

A DGU delivery-office area is an official government spatial unit, not
automatically an operator-authored postcode perimeter. Production promotion
requires a versioned explicit crosswalk from Hrvatska pošta destination-office
assignment to the DGU register identifier. Codes for PO boxes, organizations,
routes and other non-area use remain typed and are never forced into polygons.
GISCO points, settlements, municipalities, counties, buffers and Voronoi cells
never substitute for that crosswalk.

Exact address display requires a DGU INSPIRE address identifier with locator,
street or square, settlement, administration, validity, licence, vintage and
digest. Exact building display additionally requires an explicit distributable
address-building relation, common authoritative identifier or reviewed
crosswalk. A cadastral parcel, land-registry record, footprint, containment or
proximity match is candidate evidence only and never publishes owners,
rightsholders, occupants or title data.

Hrvatska pošta website/download reuse terms, DGU Open Licence obligations and
each requested Spatial Unit Register delivery are pinned separately. No public
artifact promotes operator web content to open bulk data or general DGU portal
access to a dataset-specific licence.

### `agid-postal-ge`

The Georgia repository owns pinned Georgian Post four-digit assignment
receipts and addressing guidance; NAPR Address Registry identity; individually
licensed NSDI address, named-street, registered-building, registered-parcel and
administrative resources; GeoStat classifications; derived surfaces;
synthetic fixtures and release validation. `NNNN` is a text-format rule, not
proof of current allocation, delivery, address existence or geometry.

Georgian Post operator assignment is the postal authority. Neither a returned
post office/locality nor the addressing-guide examples are a nationwide
official postcode polygon. A rights-cleared address membership model may emit
a versioned uncertainty-bearing derived surface, but must retain its members,
exclusions, method, parameters, validation and lineage and must never label
buffers or Voronoi cells as Georgian Post or NSDI boundaries. Non-area and
coverage-limited results stay typed instead of being filled from the nearest
postal or geospatial feature.

NAPR address identity and NSDI spatial address geometry remain separate
assertions. Exact building display additionally requires an explicit
distributable address-building relation, common authoritative identifier or
reviewed crosswalk. A registered parcel, footprint, containment or proximity
match is candidate evidence only; addressees, residents, apartments/units,
owners, rightsholders, occupants, title and restriction records never enter
public artifacts.

NSDI portal visibility is not a blanket open licence. Every production
resource pins its responsible subject, resource-specific access licence,
permitted fields, endpoint, schema, coverage, validity, CRS and digest.
Administrative/statistical boundaries and postal evidence remain separate
from territorial policy, never determine sovereignty and never conceal an
explicit coverage gap.

### `agid-postal-sk`

The Slovakia repository owns pinned Slovenská pošta PSČ search receipts and
operator-assignment lineage, Ministry of Interior Register adries identifiers
and address points, individually licensed ZBGIS/INSPIRE buildings,
administrative units and cadastral parcels, derived routing-locality surfaces,
synthetic fixtures and release validation. `NNN NN` is a display and
normalization rule, not proof that a code is current, deliverable or spatially
exhaustive.

Slovenská pošta access-point XML describes post offices, PoštaPOINTs and
BalíkoBOXes. Those operational/service records remain distinct from PSČ
assignment and never become postal polygons merely because they have
coordinates. The public PSČ search is reference-ready for exact verification;
a production bulk artifact still requires a separately pinned, redistributable
source receipt.

No nationwide official Slovenská pošta PSČ polygon is assumed. A surface built
from verified assignments and Register adries points is explicitly `derived`,
records its method and coverage, and is returned only under derived-geometry
policy. Sparse areas remain coverage gaps; nearest-code filling is prohibited.

Exact building output requires a Register adries building relationship, a
common authoritative building identifier shared with ZBGIS, or a reviewed
explicit crosswalk. Footprint containment, parcel overlap and proximity are
candidate evidence only. Cadastral parcels validate location relationships but
do not infer the building, postal perimeter, owner, rightsholder, occupant or
title. Administrative boundaries supply context and clipping only; they do not
prove PSČ assignment or sovereignty.
### `agid-postal-si`

The Slovenia repository owns pinned Pošta Slovenije normal-postcode CSV
receipts, separately classified special-code references, reviewed mappings to
GURS spatial-unit identifiers, GURS address identifiers and centroids,
individually licensed building relationships, synthetic fixtures and release
validation. `NNNN` is a normalization rule, not proof that a code is current,
deliverable, spatially exhaustive or an area.

GURS classifies `poštni okoliš` (postal district) as an official spatial unit,
but that does not by itself prove that every district is the current
operator-authored boundary of the same-named Pošta Slovenije code. Production
geometry requires an explicit, versioned code/post-office-to-spatial-unit
crosswalk. Name matching, nearest-code assignment, buffers and Voronoi cells
are prohibited substitutes; unmatched codes remain honest coverage gaps.

Pošta Slovenije special postcodes may identify organizations, institutions or
postal centres and are non-area by default. Its direct-mail WebGIS A/B/C
delivery-price areas are product-specific operational geometry. They never
become normal postcode polygons or evidence of general deliverability.

GURS Register naslovov supplies the registered address number, hierarchy and
address centroid. Exact building display requires a source-defined
address-building relationship, a common authoritative identifier or a reviewed
crosswalk. Centroid containment, footprint proximity and parcel overlap are
candidate or validation evidence only; they do not infer apartments, business
premises, addressees, owners, rightsholders, residents or title.

Every GURS artifact pins its dataset/date attribution under the applicable
CC BY 4.0 terms, source CRS (`EPSG:3794` where published), reviewed WGS84
transform, schema and digest. The AGID repository keeps only contracts and
small synthetic fixtures; production records and heavy geometry belong in the
country release store.

### `agid-postal-no`

The Norway repository owns pinned Posten Bring four-digit assignment and
G/P/B/S category receipts, Kartverket Postnummerområder releases, Matrikkelen
address, apartment-level and building-point identity, separately licensed FKB
building relations, administrative context, synthetic fixtures and release
validation. A Posten assignment row is not polygon authority; only the exact
pinned Kartverket postcode-area feature is official area geometry. PO-box,
special-service and unmatched codes remain non-area, and buffers, Voronoi cells
or municipality substitution never manufacture official coverage.

Matrikkelen address points establish address identity and postcode-district
membership, not footprints. Apartment-level identity requires the composite
address and unit identifiers and never identifies an occupant or household.
Building points preserve building number, status and representation point but
remain distinct from building outlines. Exact FKB geometry requires the same
Matrikkelen building number or a reviewed explicit crosswalk; containment and
proximity are candidates only.

Every open Kartverket distribution pins its exact metadata record, source date,
digest and CC BY 4.0 attribution. NLOD is not assumed merely because a dataset
is public. FKB-Bygning remains in a controlled rights partition because Norge
digitalt access and private-purchase conditions do not authorize general public
redistribution. Svalbard and Jan Mayen category codes 21/22 never silently merge
ISO `SJ` records into the `NO` country pack.

### `agid-postal-hu`

The Hungary repository owns pinned Magyar Posta Partner Extra four-digit
assignment files, separately retained addressing and special-endpoint rules,
authorized KCR and EHA address evidence, separately rights-cleared building and
cadastral artifacts, administrative context, synthetic fixtures and release
validation. Partner Extra data may serve as an application background database,
but a postcode row is not an operator-authored polygon or delivery guarantee.

No nationwide Magyar Posta postcode polygon layer is assumed. Production may
derive a noncanonical surface only from complete, rights-cleared and
time-compatible assignment membership plus authoritative coordinates. Every
surface retains method, members, exclusions, uncertainty, topology, coverage
and validity. Settlement, district, county, nearest-point assignment, buffers
and Voronoi cells never substitute for postal evidence. Post-office-box,
dedicated or highlighted codes remain non-area routing endpoints unless an
independent authoritative source supplies area geometry.

KCR establishes address identity, allowed building/staircase/floor/door
components, coordinates, cadastral relation, object type and history. Its
statutory transfer rules do not grant public mirror rights. Unit-level display
never identifies occupants, recipients, households, owners or rightsholders.
EHA locations may represent an entrance or geometric centre inside a parcel;
they are not automatically footprints.

Exact building output requires a common authoritative identifier or reviewed
explicit crosswalk from the KCR/EHA address to an exact rights-cleared building
feature. INSPIRE coverage and licence are pinned per distribution, sample
coverage is not nationwide, NTA generalized WMTS evidence is not an editable
exact vector footprint, and a cadastral parcel is not a building. Containment,
proximity and text similarity remain candidate evidence only.

Every artifact pins provider, exact source URL, access terms, capture or
download time, edition, coverage, schema, source CRS, reviewed transform and
digest. The AGID repository keeps only contracts and small synthetic fixtures;
Magyar Posta, KCR, EHA, INSPIRE, NTA, cadastral and KSH source rows and heavy
geometry stay in a separately governed country release store.


### `agid-postal-fi`

The Finland repository owns pinned Posti five-digit assignments and Basic
Address File membership, annual Statistics Finland Paavo statistical geometry,
authorized DVV address/building identity, versioned Ryhti open-building data,
NLS road-address/building/administrative evidence, Aland partition metadata,
synthetic fixtures and release validation.

Posti files contain no map data. Paavo areas are official-derived statistical
areas generalized from building-address postcodes, and an address postcode can
differ from its statistical area. Each release pins its year and sea-extended
or coastline-clipped variant and remains noncanonical; it is never a Posti
delivery perimeter. PO-box, corporate and dedicated codes remain non-area
without independent authoritative area evidence.

Posti street and house-number selection proves routing membership, not a
premise. DVV controlled data may supply exact address, apartment, building and
permanent identifiers only under allowed access and output rights. Ryhti may
supply an exact building only through a permanent identifier or source-defined
relation, with municipal transition coverage and exact licence pinned. NLS
road addresses are calculated or interpolated rather than exact entrances, and
NLS topographic buildings require an explicit identifier or reviewed crosswalk;
nearest, containment, parcel and text matching remain candidates only.

Posti Basic Address File excludes Aland and the postcode file provides only
postcode-level Aland information. AX evidence is retained as a separate
territory partition and never inherits mainland street or geometry assumptions.
Every artifact pins provider, URL, terms/licence, attribution, edition, capture
time, coverage, schema, CRS, reviewed transform and digest. The AGID repository
keeps only contracts and small synthetic fixtures; all source rows and heavy
geometry remain in a separately governed country release store.


### `agid-postal-bg`

The Bulgaria repository owns pinned Bulgarian Posts four-digit routing
references and post-office receipts, actual authorized GRAO/CAIS address
identifiers and access points, AGCC cadastral and INSPIRE building evidence,
dated NSI EKATTE administration, synthetic fixtures and release validation.

No nationwide Bulgarian Posts-authored postcode polygon distribution is
assumed. A surface may be built only from complete, rights-cleared and
time-compatible postcode membership with authoritative coordinates. It remains
noncanonical derived geometry and records method, members, exclusions,
uncertainty, topology, coverage and validity. EKATTE settlements,
administrative polygons, buffers, Voronoi cells, nearest-code assignment and
cross-border gap filling never become postal geometry. PO-box, organization,
dedicated and post-office codes remain non-area without independent evidence.

Roadmaps for a centralized Address Register do not establish that a production
record or public bulk service exists. Exact address output requires an actual
authorized GRAO/CAIS or municipal receipt. Exact building output additionally
requires a common cadastral building identifier, source-defined relation or
reviewed authoritative crosswalk to the exact rights-cleared AGCC feature.
Parcels, independent objects, containment, proximity and text matching remain
candidates only. Person, residence, recipient, household, owner, rightsholder,
legal-act and title data never enter public artifacts.

EKATTE points and polygons provide dated administrative context only. Every
artifact pins provider, exact URL, access basis, fee/terms or licence version,
attribution, edition, capture time, coverage, schema, source CRS, reviewed
transform and digest. EPSG:9391 and other source coordinates are never silently
published as WGS84. Public viewers, statutory registers and INSPIRE labels do
not by themselves grant bulk or derivative-work rights. The AGID repository
keeps only contracts and small synthetic fixtures; source rows and heavy
geometry remain in a separately governed country release store.


### `agid-postal-rs`

The Serbia repository owns pinned Pošta Srbije five-digit destination-office
receipts, six-digit PAK semantics and query receipts, approved WSP address
verification receipts, RGZ open-address artifacts, separately licensed
building relationships, synthetic fixtures and release validation. Five-digit
syntax and an office point do not prove a current assignment, service perimeter
or universal deliverability.

Pošta Srbije defines PAK as a routing code for a part of a street, including
street side and house-number range. That makes PAK stronger than a locality
label but does not make it a polygon, exact building, household, resident or
replacement for the five-digit destination post office. Public lookup maps and
WSP responses remain query or API evidence; neither grants bulk geometry rights.

No nationwide operator-authored postcode or PAK polygon is assumed. A surface
or route built from rights-cleared RGZ house-number points and pinned operator
assignments is explicitly `derived`, records membership, exclusions, method,
uncertainty, validation and validity, and leaves sparse or ambiguous areas as
coverage gaps. Nearest-office, street buffers, administrative boundaries and
Voronoi cells never become official postal geometry.

RGZ Address Register CSV/GPKG artifacts may be reused under the Serbian Open
Data License with the required RGZ source, download date, download URL and
change/redesign notice. A unique address code and house-number point establish
address identity, not a building footprint or postcode/PAK. Exact building
output requires a source-defined relation, common authoritative identifier or
reviewed crosswalk to a separately licensed building collection. Parcels and
object-part references remain candidate or validation evidence only.

Every administrative, cadastral and building artifact pins its own access,
licence, public fields, schema, source CRS, transform, coverage, exclusions and
territorial vintage. Source coverage never determines sovereignty; `RS` and
`XK` records are not silently merged. Owners, rightsholders, residents,
occupants, title/value records, contacts, credentials and shipment data never
enter public artifacts.

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

### `agid-postal-by`

The Belarus repository owns pinned Belpost six-digit assignment evidence and
NCA-produced postal-code zone lineage. NCA states that nationwide postal zoning
entered production in 2020 and zone boundaries are updated every six months.
Those government-produced zones are official-derived spatial evidence, not
Belpost-authored delivery perimeters. A public cadastral-map view does not grant
bulk redistribution; every released layer pins its product, capture and effective
time, coverage, methodology, terms, schema, CRS, transform and digest.

The NCA Address Register supplies authoritative address identity and geocode.
Capital-structure address exports, the real-estate register and property-
characteristics register remain separately licensed or controlled. Exact building
display requires an explicit permitted registry relation or common capital-
structure/real-estate identifier to an exact rights-cleared building feature.
Land parcels, isolated premises, parking spaces, containment, proximity and text
matching create candidates only. Owner, rightsholder, transaction, valuation,
resident, recipient and other personal fields are excluded.

ATE and SOATO identities add dated administrative context only. Administrative
units do not establish postal membership or replace the NCA postal-zone layer.
The pack remains fail-closed when paid-service rights, public-map layer identity,
territorial clipping, freshness or exact address-to-building linkage is absent.

### `agid-postal-be`

The Belgium repository owns pinned bpost four-digit assignment and exact versioned
bpost/NGI Postal Cantons vector evidence. BOSA BeSt Address remains a federal
crosswalk over the original Flanders, Wallonia and Brussels identifiers; exact
building display requires an explicit permitted regional registry relation or
stable common identifier. Administrative boundaries, WMS pixels, address points,
centroids, parcels, containment and proximity never replace those evidence gates.

Source-specific bpost/NGI, BOSA, Vlaanderen, SPW, UrbIS and FPS Finance licences,
editions, attribution, CRS and digests remain separate. Personal, ownership, title,
transaction, tax, cadastral-income and valuation fields are excluded. The complete
evidence ladder and promotion rules are in
[postal-context-belgium-runtime.md](postal-context-belgium-runtime.md).

### `agid-postal-ro`

The Romania repository owns pinned Poșta Română six-digit assignment and its
street-section, single-building or locality-wide assignment class. The operator's
dated digitalization material stated that the then-current postcode database had
no geographic coordinates. Therefore no nationwide operator-authored polygon is
assumed; a surface from rights-cleared RENNS CUA membership remains derived,
uncertainty-bearing and non-canonical. Streets, offices, counties, UATs,
localities, parcels, buffers, Voronoi cells and interpolation never substitute
for postal authority.

RENNS CUA identity and points, ANCPI INIS constructions and property, and INSSE
SIRUTA hierarchy remain separately licensed and versioned. Exact building display
requires a permitted construction plus an explicit source relation, common stable
identifier or reviewed crosswalk. Owner, rightsholder, resident, occupant,
domicile, entity association, land-book rights, title, encumbrance, value and tax
fields are excluded. The evidence ladder is documented in
[postal-context-romania-runtime.md](postal-context-romania-runtime.md).

### `agid-postal-me`

The Montenegro repository owns pinned Pošta Crne Gore five-digit destination
post-office assignment and six-digit PAK routing evidence. No nationwide
operator-authored postcode or PAK polygon is assumed; a surface produced from
rights-cleared UZN address membership remains derived, uncertainty-bearing and
non-canonical. Office points, routes, administrative units, parcels, buffers,
Voronoi cells and interpolation never substitute for postal authority.

UZN Address Register identity, real-estate cadastral buildings, Geoportal layers
and spatial-unit graphics remain separately licensed and versioned. Exact building
display requires a permitted building feature plus an explicit source relation,
common authoritative cadastral identifier or reviewed crosswalk. MONSTAT names,
codes and statistical hierarchy add context only. Owner, rightsholder, resident,
occupant, personal identifier, title, encumbrance, value and tax fields are
excluded. The evidence ladder is documented in
[postal-context-montenegro-runtime.md](postal-context-montenegro-runtime.md).

## Taiwan source boundary

The Taiwan repository owns pinned Chunghwa Post six-digit 3+3 assignment evidence and its exact address-range, delivery-district, delivery-specific, P.O. box, military special-box and organization semantics. The first three digits are administrative routing context; the last three are delivery context. Neither valid syntax, a lookup row nor the published three-digit centre-coordinate table is a postal perimeter.

MOI-coordinated and local-government doorplate artifacts, NLSC Taiwan eMap buildings and doorplates, cadastral services and administrative boundaries remain separate evidence partitions. A reusable full-code surface may be derived only from rights-cleared doorplate members joined to a pinned operator assignment and must retain members, exclusions, uncertainty, validity and lineage. It is never relabelled official. Exact building output requires a source-defined relation, common stable authoritative identifier or reviewed crosswalk; containment and proximity are candidates only.

WMS or WMTS display, viewer access, government-unit WFS eligibility, payment or subscription does not imply public vector or derivative redistribution. Public output excludes household registration, resident, occupant, domicile, owner, rightsholder, title, encumbrance, value, tax, contact, shipment and query-history data. TWD97 source CRS metadata and reviewed transforms are mandatory, and source-stated administrative, postal or cadastral coverage is not a sovereignty determination.


## Korea source boundary

The Korea repository owns pinned five-digit Korea Post assignment evidence and the exact current MOIS National Basic District feature carrying the same number. Since 1 August 2015 the National Basic District Number is used as the postcode, so an exact rights-cleared, current, topology-valid district polygon or multipolygon is canonical postal geometry. Syntax, a postcode API row, an administrative boundary, road buffer, parcel, building, Voronoi cell or interpolation cannot replace it; missing official geometry remains a gap.

MOIS Juso road-address responses, the public Building DB, electronic-map buildings and entrances, and MOLIT GIS Integrated Building Information remain separate evidence partitions. Exact building output requires a source-defined 25-digit building-management relation, documented address-management relation or reviewed explicit crosswalk. One road address may relate to multiple buildings, and containment, overlap, text equality or proximity creates candidates only. The continuous cadastral map is reference-only, not survey evidence, and never proves postcode, building identity, ownership or rights.

Electronic-map applications, identity and purpose approval, service keys, viewers, public-data metadata and KOGL labels do not imply unrestricted vector or derivative redistribution. EPSG:5179 and EPSG:5186 are product-specific rather than interchangeable defaults. Public output excludes residents, households, owners, rightsholders, occupants, recipients, detailed private units, title, encumbrance, value, tax, shipment and query-history data; source-stated coverage is not a sovereignty determination.
