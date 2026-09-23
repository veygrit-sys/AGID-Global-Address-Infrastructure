# Belarus Postal Context runtime

The Belarus pack keeps Belpost assignment, NCA official-derived postal zones,
the state Address Register, capital-structure and real-estate evidence, and
ATE/SOATO administration as separate evidence layers.

```text
Belpost six-digit assignment or special postal endpoint
  -> pinned NCA official-derived postal-code zone (when licensed)
  -> dated ATE/TE and SOATO administrative context
  -> exact authorized Address Register identifier and geocode
  -> explicit capital-structure or real-estate identifier relation
  -> exact rights-cleared building feature
  -> BY AGID cell relation
```

## Assignment and official-derived geometry

A pinned Belpost lookup, page or transaction receipt can establish a six-digit
postcode and serving-post-office relationship at its capture time. The code is
always retained as text. Syntax, a UPU addressing example, a post-office point,
SOATO membership or an address geocode does not establish current assignment,
deliverability or geometry.

NCA states that nationwide postal-code zoning entered production in 2020 and
zone boundaries are updated every six months. The published method relates
Belpost postcode/address assignments to Address Register capital-structure
addresses in settlements with multiple post offices, while settlements with a
single post office use postcode directories and the ATE/TE register. That makes
the zone official-derived state geometry: it must not be described as a
Belpost-authored delivery perimeter.

Production use pins the actual zone layer or licensed artifact, edition,
capture and effective time, method, coverage and exclusions, terms, schema,
source CRS, reviewed transform, topology and digest. The descriptive NCA page
and public cadastral map prove the program and visible layer, not bulk
redistribution rights. Administrative polygons, buffers, Voronoi cells,
nearest-code filling and cross-border gap filling are prohibited substitutes.
PO-box, poste-restante, organization, dedicated and post-office-only records
remain non-area unless independent zone evidence explicitly includes them.

## Address, premise and building precision

The NCA Address Register is an authoritative state resource for current address
identity and geocode. Its object model distinguishes land parcels, capital
structures, unfinished structures, isolated premises and parking spaces.
Authorized district-scoped SHP services can supply unique address identifiers,
object types, components and postcodes for capital and unfinished structures,
but a register geocode is not a building footprint and paid access is not a
public-mirror licence.

Exact building display requires an explicit permitted register relation, a
common capital-structure or real-estate identifier, or a reviewed authoritative
crosswalk from the allowed address record to one exact rights-cleared building
feature. A parcel, isolated premise, parking space, property characteristic,
containment, proximity or text match creates only a candidate. Owner,
rightsholder, title, transaction, valuation, person, resident, recipient and
household data are never emitted.

## Administration, licensing, CRS and runtime state

ATE/TE and SOATO releases supply dated administrative identities, categories,
hierarchy and separately licensed geometry. They add context only and never
become postcode membership, address identity or building identity.

NCA's website-use rules apply to site material and require a direct link and
accurate reproduction. They do not grant reuse of paid data-service outputs,
register APIs, public-map databases or derived bulk products. Every artifact
therefore pins its actual contract, fee or terms and field-level output rights.
Jurisdiction-specific legal and access restrictions are checked again at each
release; the runtime fails closed when authorization is unclear.

Every geometry retains its source CRS and original coordinates. WGS84 output
uses a reviewed, versioned transform with axis order, parameters, accuracy and
lineage recorded. A web-map display is not evidence that the source data uses
EPSG:4326. Postal output is clipped only to evidence-backed coverage for the
same validity interval, but clipping never fills missing postal, address or
building coverage or decides sovereignty.

The committed seed is `M1_metadata`: contracts and non-production synthetic
fixtures only. It contains no Belpost or NCA source rows, no real address, no
production geometry and no personal data. Belarus remains `unconfigured` until
a separately released M2+ descriptor passes integrity, assignment, zone-layer,
licensing, freshness, address/building-link, privacy, coverage, territory, CRS
and correction gates.
