# Switzerland Postal Context runtime

Status: `M1 metadata and synthetic runtime conformance`

AGID can load Switzerland independently alongside the existing country packs.
The shared API and resolver support four-digit normalization, Swiss Post
assignment evidence, official swisstopo PLZO postcode/locality perimeters,
official building addresses and entrances, GWR building identity, phased
EGID-linked 3D geometry, special non-area codes, country partitioning and AGID
candidate cell covers without copying national source data into this repository.

## 1. Canonical postcode

```text
input -> NFKC -> remove whitespace -> exactly four digits
```

Hyphens and non-digits are rejected. The public postcode remains a string so
leading zeroes survive. The additional two-digit Swiss Post component is stored
separately as NPA6:

```text
NPA4 = d1 d2 d3 d4
NPA6 = NPA4 || a1 a2
```

AGID never silently truncates a six-digit value into NPA4. The source-backed
resolution path is:

```text
NPA4 + locality
  -> Swiss Post assignment, postcode type and optional NPA6
  -> pinned swisstopo PLZO_CH Polygon / MultiPolygon
  -> official building-address EGAID
  -> GWR building EGID + entrance EDID
  -> same-EGID swissBUILDINGS3D geometry where available
  -> AGID cell cover
```

A postcode or perimeter does not by itself identify a street address, entrance,
building, recipient, dwelling or delivery guarantee.

## 2. Source and rights boundaries

### Swiss Post

Swiss Post supplies the official postcode/place search and address/geodata
products. Its street directory contains the street, hamlet and plot names,
house-number coverage, postcodes and sorting evidence for buildings served by
the postal system. Swiss Post also publishes NPA6, GeoPost area/point and other
coordinate or routing products under product-specific conditions.

Search receipts, account downloads and licensed products are separate
artifacts. Public search does not authorize unrestricted redistribution of
GeoPost, delivery, customer, recipient, forwarding or shipment data.

### swisstopo PLZO_CH

The official directory of towns and cities contains locality names, four-digit
postcodes, an additional two-digit Swiss Post code and perimeters. Locality
areas cover Switzerland without overlap, and the dataset defines postcode
boundaries and about 4,100 locality/NPA6 areas. It is updated on the first day
of each month from canton and Swiss Post input.

PLZO_CH lists domicile-address postcode types 10 and 20. Professional, company,
internal and administrative postcode types greater than 20 can be absent. An
absent code is therefore non-area or contract-only evidence, not a reason to
invent a residential polygon.

Every PLZO artifact pins the data-model generation, NPA4, NPA6, postcode type,
locality identity, municipality links, country partition, CRS, release date,
digest, topology report and mandatory swisstopo attribution.

### Official building-address directory

The official directory lists official building addresses for residential
buildings, workplaces and buildings of public interest. Every building entrance
has an unambiguous address and includes street, house number, locality, postcode,
municipality, geographic location and address status. The data are updated
daily and published in CSV, File Geodatabase and INTERLIS formats.

The identity chain is:

```text
EGAID       -> official building address
EGID        -> federal building identity
EGID + EDID -> nationwide-unique building entrance
```

Entrance coordinates come from cadastral surveying and use LV95. Three decimal
places in a file do not imply millimetre measurement accuracy; coordinate
provenance and stated accuracy remain attached.

### Federal GWR

The Federal Register of Buildings and Dwellings supplies authoritative building
and entrance identity/status and is a source register for the public building-
address directory. Public AGID processing uses only reviewed building and
entrance fields. It excludes EWID dwelling records, occupant, owner and other
private-purpose attributes.

### swissBUILDINGS3D 3.0 Beta

swissBUILDINGS3D provides roofs, facades, footprints and 3D building models.
The current beta integrates EGID by canton and tile; as of the 4 June 2026
release, EGID-linked models cover 19 cantons and the city of Zurich rather than
all buildings nationwide.

An exact building geometry requires the identical EGID in the pinned
swissBUILDINGS3D feature. Where EGID is absent, nearest/containing geometry
remains a candidate and public resolution stops safely at official entrance or
building identity.

### swissBOUNDARIES3D

swissBOUNDARIES3D supplies country, canton, district and municipality geometry
and stable administrative identifiers. Municipalities and postcode/locality
perimeters are not congruent; administrative geometry never becomes PLZO
geometry or postal assignment authority.

### Terms and attribution

swisstopo OGD permits use, modification, redistribution and commercial use,
with mandatory source attribution such as `© swisstopo`. Service acquisition
also observes published fair-use limits. Each artifact keeps its source,
edition, terms version, retrieval time and digest.

Official references:

- [Swiss Post postcode search](https://www.post.ch/en/customer-center/online-services/plz-suche/info)
- [Swiss Post address and geodata](https://www.post.ch/en/business-solutions/address-management/address-and-geodata)
- [swisstopo official directory of towns and cities](https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities)
- [swisstopo official directory of building addresses](https://www.swisstopo.admin.ch/en/official-directory-of-building-addresses)
- [swissBUILDINGS3D 3.0 Beta](https://www.swisstopo.admin.ch/en/landscape-model-swissbuildings3d-3-0-beta)
- [swissBOUNDARIES3D](https://www.swisstopo.admin.ch/en/landscape-model-swissboundaries3d)
- [swisstopo OGD terms](https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices)

## 3. Postal geometry and mathematical validation

For domicile postcode `c`, NPA6/locality identity `l`, and pinned PLZO release
`r`, official public geometry is:

```text
G(c, l, r) in {Polygon, MultiPolygon}
```

NPA4 is not necessarily one polygon or one locality:

```text
G(c, r) = union({G(c, l, r) | l belongs to c})
```

The union is for lookup convenience and never destroys individual locality or
NPA6 identities. For official building-address entrance points `A(c, l, r)`, a
release check measures:

```text
containment(c, l, r) =
  |{a in A(c, l, r) : point(a) in or on G(c, l, r)}| / |A(c, l, r)|
```

Every outlier preserves postal assignment, address and geometry evidence
separately. AGID never moves an entrance, changes a postcode or clips a PLZO
feature merely to improve the metric.

If PLZO is unavailable, an experimental surface may be generated from official
entrance points and a rights-cleared country clip:

```text
D(c, r) = clip intersect union({Voronoi(a) | a in A(c, r)})
```

`D` remains `derived_geometry` and cannot replace or impersonate PLZO. Special
non-area codes do not receive `D` unless an experimental API explicitly asks
for a routing approximation and labels it as such.

## 4. Address, entrance and building resolution

The safe path is source identity rather than distance:

```text
PLZO locality/NPA4/NPA6
  -> official building address EGAID
  -> federal building EGID
  -> entrance EDID
  -> same EGID in pinned swissBUILDINGS3D feature
```

If EGAID or EGID/EDID is missing, branches conflict, or a geometry lacks the
same EGID, resolution stops at the strongest supported level. Multiple
entrances, languages, house numbers and locality branches remain separate and
are never combined into a Franken-address.

Public results can show an official building address, building identity and
public entrance. They do not expose dwelling/EWID, recipient, occupant, owner,
forwarding or shipment context.

## 5. Special codes and country partition

Professional, company, internal, administrative, P.O. Box and post-office codes
can be valid routing identifiers without domicile geometry. They are returned
as non-area routing, organization or facility records and do not overwrite a
premise postcode or imply residence.

PLZO, building-address, swissBUILDINGS3D and swissBOUNDARIES3D distributions can
include the Principality of Liechtenstein. Release ingestion uses authoritative
country evidence to reject LI rows from the CH artifact. Liechtenstein remains
a separate `LI` country pack and never receives a `CH` AGID cell from shared
source packaging.

## 6. Runtime configuration

```text
AGID_POSTAL_CONTEXT_CH_DESCRIPTOR_PATH=C:\absolute\path\ch-descriptor.json
AGID_POSTAL_CONTEXT_CH_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_CH_LKG_DESCRIPTOR_PATH=C:\absolute\path\ch-lkg-descriptor.json
AGID_POSTAL_CONTEXT_CH_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

The shared endpoints are:

```text
POST /api/postal/resolve
GET  /api/postal/CH/:postcode
GET  /api/postal/intersects?country=CH&bbox=...
```

Geometry remains opt-in with `geometry=geojson`. AGID cells are indexes, not
substitutes for original PLZO geometry, EGAID/EGID/EDID checks or same-EGID
building geometry.

## 7. Current completion boundary

This implementation completes the country contract, source/rights profile,
four-digit normalizer, multi-country store support, API routing, AGID
integration and synthetic conformance tests. It does not claim nationwide
production data coverage. M2 requires pinned Swiss Post, PLZO, building-address,
reviewed GWR, swissBUILDINGS3D and swissBOUNDARIES3D artifacts; contract and
attribution receipts; reproducible joins; postcode-type, topology, identity,
privacy and country-partition evaluation; correction intake; and rollback.
