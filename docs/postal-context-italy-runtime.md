# Italy Postal Context runtime

Status: `M1 metadata and synthetic runtime conformance`

AGID can load Italy independently alongside the existing country packs. The
shared API and resolver support five-digit CAP normalization, operator routing
assignments, derived CAP surfaces, ANNCSU civic evidence, source-linked building
evidence, historical transitions, and AGID candidate cell covers without
copying national source datasets into this repository.

## 1. Canonical CAP

```text
input -> NFKC -> remove whitespace -> exactly five digits
```

Hyphens and non-digits are rejected. The runtime stores CAP as a string and
uses `routing-locality-first` semantics:

```text
CAP
  -> Poste Italiane locality / city-zone / street-arc assignment
  -> optional derived Polygon / MultiPolygon
  -> ANNCSU street and civic-number evidence
  -> source-backed premise or building assertion
  -> AGID cell cover
```

A CAP can represent one locality, several municipalities, or a zone within a
large city. It is not inherently a building, delivery point, recipient, or
official polygon.

## 2. Source and rights boundaries

### Poste Italiane CAP search

Poste Italiane's public CAP service is the official current lookup and change
reference. It explains the five-digit system, multiCAP cities, grouped
municipalities, merger-related road-name ambiguity, and CAP transitions. The
public site is a review receipt, not permission to scrape and redistribute a
nationwide database or an official boundary layer.

### CAP Professional

CAP Professional is the licensed operator reference for Italian localities,
multiCAP city zones, streets, and street arcs delimited by house-number bounds.
Its rows and derived outputs stay in a restricted rights partition unless the
contract explicitly permits publication. Product access never turns the rows
into open data or a generated surface into an official Poste Italiane polygon.

### ANNCSU

ANNCSU is the national archive of urban streets and civic numbers maintained by
Agenzia delle Entrate and ISTAT. National and regional CSV downloads are
updated monthly; point APIs are updated daily. Consultation data is CC BY 4.0.
The pinned schema, identifiers, SNC cases, suffixes, coordinate availability,
and coordinate meaning must survive ingestion.

An ANNCSU civic confirms address evidence. It does not prove postal
deliverability, a recipient, an entrance, a building footprint, or a legal
parcel.

### ISTAT administrative boundaries

ISTAT publishes detailed and generalized WGS84 boundaries for regions,
provinces, metropolitan cities, and municipalities. These provide versioned
administrative context and may be a rights-cleared clip for derived geometry.
They are not CAP boundaries. Published artifacts retain the exact edition,
level, CRS, digest, and ISTAT attribution.

### Regional and municipal DBGT

The national DBGT specification defines a common content model for geographic
databases, including buildings. Actual datasets, coverage, scale, update date,
identifiers, and licences remain federated among regional and municipal
providers. There is no implied single nationwide building release or uniform
reuse licence.

Nearest or containing DBGT geometry is a building candidate. A definitive
display requires a stable source-backed ANNCSU-civic-to-building relation.

### Cadastral cartography

Agenzia delle Entrate cadastral services remain separately governed reference
evidence. A parcel or map feature is not necessarily a building, entrance,
address, or postal assignment. Access and redistribution are reviewed for each
service before use.

Official references:

- [Poste Italiane CAP search and changes](https://www.poste.it/cap)
- [Poste Italiane CAP Professional](https://business.poste.it/professionisti-imprese/prodotti/cap-professional.html)
- [ANNCSU open data](https://www.anncsu.gov.it/it/consultazione-dellarchivio/open-data/index.html)
- [ANNCSU services](https://anncsu.gov.it/it/progetto/adesione-anncsu/index.html)
- [ISTAT administrative boundaries](https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/)
- [AgID DBGT technical specifications](https://geodati.gov.it/geoportale/datiterritoriali/regole-tecniche)
- [Agenzia delle Entrate cadastral and cartographic services](https://www.agenziaentrate.gov.it/portale/web/english/nse/services/cadastral-and-cartographic-services)

## 3. Derived CAP geometry

For a CAP `c`, let `A_c` be pinned civic/address evidence assigned to `c`, `B`
be a rights-cleared national or municipal clip, and `r` be a release:

```text
D(c, r) = B intersect union({ cell(a, A) | a in A_c })
```

`cell` can be a clipped Voronoi cell, constrained tessellation, alpha-shape,
or another validated model. Where operator street arcs and ranges are licensed,
the model can condition on road geometry and house-number parity. Islands and
disconnected components remain MultiPolygon parts rather than being bridged.

The output is always:

```text
geometry_authority = derived_geometry
assignment_authority = source-specific operator/address evidence
```

Every model output records inputs and digests, projection, clip, model and
version, parameters, gaps, overlaps, topology, holdout containment, validity,
known time, licence proof, and rollback parent. It can improve lookup speed and
coverage, but cannot be labelled an official Poste Italiane boundary.

## 4. Real-time and compressed resolution

AGID does not call upstream services for every map movement. A production pack
uses a three-stage path:

```text
versioned local index
  -> AGID candidate cells and compressed derived geometry
  -> original geometry / address evidence confirmation
  -> optional live authoritative refresh when stale or ambiguous
```

Geometry can be stored as vector tiles or shared-edge topology with
quantization and simplification by zoom. Compression never removes source
lineage, validity, topology checks, or the high-resolution artifact used for
final point-in-polygon confirmation. A live response is cached only with its
terms, receipt time, request purpose, digest, expiry, and correction path.

The model may rank candidates but does not invent a house number or building.
When CAP Professional rights are unavailable, AGID can publish only the
rights-cleared evidence and derived outputs allowed by the remaining sources.

## 5. MultiCAP and historical behavior

A street in a multiCAP city can cross CAP zones. Resolution therefore uses:

```text
(city, road, road_arc, civic_number, suffix, parity, valid_time)
```

A missing or conflicting range returns ambiguity instead of the nearest CAP.
Municipal mergers can create homonymous roads, so former-municipality and
locality qualifiers remain part of the evidence graph.

Poste Italiane states that a replaced CAP remains valid for at least twelve
months. Old and new assignments can therefore overlap in time. The runtime
keeps `validAt` and `knownAt` distinct and never rewrites historical addresses
into the latest CAP without an explicit display policy.

San Marino and Vatican City remain separate `SM` and `VA` packs. Casella
postale, Fermoposta, large-organization, and other special routing records stay
point, organization, or non-areal evidence unless an independent area source
proves otherwise.

## 6. Runtime configuration

```text
AGID_POSTAL_CONTEXT_IT_DESCRIPTOR_PATH=C:\absolute\path\it-descriptor.json
AGID_POSTAL_CONTEXT_IT_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_IT_LKG_DESCRIPTOR_PATH=C:\absolute\path\it-lkg-descriptor.json
AGID_POSTAL_CONTEXT_IT_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

The shared endpoints are:

```text
POST /api/postal/resolve
GET  /api/postal/IT/:postcode
GET  /api/postal/intersects?country=IT&bbox=...
```

Geometry remains opt-in with `geometry=geojson`. AGID cells are indexes, not
substitutes for original point-in-polygon checks or source-linked civic and
building resolution.

## 7. Current completion boundary

This implementation completes the country contract, source/rights profile,
normalizer, multi-country store support, API routing, AGID integration, and
synthetic conformance tests. It does not claim nationwide production coverage.
M2 requires a rights-reviewed Poste Italiane path, pinned ANNCSU and ISTAT
snapshots, per-dataset DBGT ledgers, reproducible joins, topology and independent
holdout evaluation, attribution, ambiguity handling, correction intake, and
rollback.
