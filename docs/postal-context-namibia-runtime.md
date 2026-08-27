# Namibia Postal Context runtime

Status: `M2 runtime-ready / M1 Namibia data`

AGID can load Namibia as an independent Postal Context pack. This change adds
the country policy, five-digit Phase 1 normalizer, source/licence contract,
address hierarchy, synthetic runtime fixtures and stable API coverage. It does
not bundle NamPost rows, real addresses, personal data, cadastral records or
production geometry.

## 1. The decisive Namibia rule

NamPost describes the current five-digit code as a Phase 1 sorting and delivery
infrastructure code. The hierarchy is postal region, postal area and delivery
Post Office; the third digit is currently zero. NamPost also states explicitly
that this phase does **not** cover administrative or geographic areas.

Therefore the canonical relationship is:

```text
five-digit Phase 1 code
  -> postal-region / postal-area / delivery-office routing context
  -> no canonical postal geometry
```

The political region used by the current NamPost directory is a grouping for
search and presentation. It does not turn the code into that region's polygon.
A public post-office coordinate describes the office, not its catchment.

## 2. Address and building resolution

The dated UPU Namibia sheet distinguishes:

- PO Box, Private Bag and Poste Restante delivery;
- urban number plus street or local-area delivery points;
- rural six-digit delivery-point identifiers plus village;
- locality and sub-locality lines;
- delivery Post Office or postal-area line;
- internal routing in organizations, complexes and multi-unit buildings.

The rural six-digit delivery-point identifier is not the five-digit postcode.
Neither identifier is assumed to be a public coordinate or building ID.

The safe resolution chain is:

```text
lat/lon
  -> versioned administrative context (region / constituency / settlement)
  -> explicit rights-cleared civic address point, when available
  -> explicit address-to-building relation, when available
  -> independently licensed building footprint
  -> AGID spatial crosswalk
```

The resolver stops at the strongest evidenced level. A postcode, nearest road,
parcel containment, matching text, footprint overlap or model score cannot by
itself promote a building. Parcel/title identifiers and owner/occupant data are
kept separate from postal, address and building assertions.

## 3. Mathematical generation without false authority

Given observed delivery-office or address points `p_i`, a clipped Voronoi cell
is easy to calculate:

\[
V_i = \{x \in B : d(x,p_i) \le d(x,p_j),\ \forall j \ne i\},
\]

where `B` is a rights-cleared land or service boundary. Kernel density,
alpha-shapes, constrained graph travel-time partitions and learned classifiers
can also propose candidate surfaces.

For Namibia Phase 1, every such surface has:

```text
geometry_authority = derived_geometry | virtual_geometry
canonical_postal_geometry = false
```

It may accelerate nearest-candidate search or highlight gaps, but it cannot
answer `x ∈ official NamPost polygon` because NamPost says no such Phase 1
geographic area is defined. A future Phase 2 design must be ingested as a new,
versioned semantic regime rather than silently changing old observations.

## 4. Real-time lookup, learning and compression

A live source can improve freshness, but the public endpoint does not scrape or
call an unverified provider as an invisible fallback. The controlled flow is:

```text
provider request or document observation
  -> bounded normalized receipt
  -> source, terms version, digest and observed_at
  -> assignment / context / nearest classification
  -> conflict, privacy and licence gates
  -> immutable candidate pack
  -> digest verification
  -> atomic activation or last-known-good retention
```

A model may normalize noisy input, rank offices or addresses, detect source
drift and propose geometry. Training data must have documented rights and
lineage. Model output is never official assignment, exact address, building or
postal geometry without the corresponding authoritative evidence.

Namibia's current allocation table is small enough for a compact sorted or
minimal-perfect-hash code-to-office index. Administrative and building
geometries can use PMTiles/FlatGeobuf/Parquet plus AGID cell covers. Cell ranges
and simplified surfaces are candidate indexes only; exact answers retain the
source geometry, validity time, ambiguity and authority metadata.

## 5. Source and licence boundary

- [NamPost postal codes](https://www.nampost.com.na/postal/postal-codes) is the
  current operator reference for Phase 1 structure and office allocations. The
  public page is not treated as a documented API or blanket bulk licence.
- [NamPost Post Office Finder](https://www.nampost.com.na/contact-us/post-offices)
  is office context. Staff/contact fields, customers and subscribers are not
  mirrored.
- [UPU Namibia addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/NAMEn.pdf)
  supplies dated format semantics, not current assignment rows or geometry.
- [Namibia Statistics Agency Geo Portal](https://nsa.org.na/client/namibia-geo-portal/)
  can supply versioned administrative/statistical context under dataset-specific
  terms; it is not postal authority.
- [Directorate of Survey and Mapping](https://mawlr.gov.na/directorate-of-survey-and-mapping)
  is the cadastral/survey authority context. Product access and redistribution
  rights must be approved, and parcels are not addresses or buildings.
- [Namibian Constitution](https://www.gov.na/documents/146489/641903/Namibia_Constitution.pdf/d2d4c4cd-3f19-ab0b-8bdb-8d5a5da3ee79)
  Article 13, the Access to Information Act's treatment of an individual's
  address as personal information, and the still-developing comprehensive data
  protection framework require conservative minimization and security.
- OpenStreetMap data remains in a separately attributed ODbL partition and
  cannot inherit NamPost, administrative or cadastral authority.

## 6. Cloudflare, Hugging Face and privacy

Cloudflare Workers/R2/D1 and Hugging Face Datasets/Spaces can host public,
digest-pinned artifacts only after field-level redistribution approval. Public
artifacts exclude recipients, residents, owners, occupants, PO Box or Private
Bag holders, private entrances, delivery instructions, staff contact details,
authentication material and query trails.

Contract-restricted cadastral/address products and request logs stay in
controlled infrastructure with purpose limitation, retention, access control,
audit and deletion rules. The absence of a comprehensive Data Protection Act
does not create permission to publish personal location data.

## 7. Runtime configuration and API

Namibia uses independent active and LKG pins:

```dotenv
AGID_POSTAL_CONTEXT_NA_DESCRIPTOR_PATH=C:\absolute\path\na-descriptor.json
AGID_POSTAL_CONTEXT_NA_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_NA_LKG_DESCRIPTOR_PATH=C:\absolute\path\na-lkg-descriptor.json
AGID_POSTAL_CONTEXT_NA_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

The stable API accepts `countryCode: "NA"` or an `NA` path parameter:

```text
GET  /api/v1/postal/capabilities
GET  /api/v1/postal/releases/NA
POST /api/v1/postal/resolve
GET  /api/v1/postal/NA/10005
GET  /api/v1/postal/intersects?country=NA&bbox=...
```

The lookup returns delivery-network and independently linked address context.
`intersects` returns no Phase 1 postal areas. It may return postal geometry only
for a later explicitly geographic regime whose authority, time and licence are
recorded; it never manufactures one from office points or AGID cells.

## 8. Remaining production work

The truthful capability is “Namibia runtime and contract ready; nationwide
production address/building data not complete.” The external repository must:

1. pin the current NamPost page/PDF and terms, then approve field-level reuse;
2. build a versioned code-to-delivery-office table without catchment geometry;
3. acquire rights-cleared NSA administrative layers and measure vintage/CRS;
4. negotiate any Surveyor-General, municipal civic-address and building data;
5. preserve PO Box, Private Bag, rural delivery point, parcel and building
   identifiers as separate typed nodes;
6. create exact address-building links only from explicit authorized relations;
7. validate rural, informal, multi-unit, special-facility and ambiguity cases;
8. pass privacy, licence, holdout, freshness, correction and two-refresh gates.
