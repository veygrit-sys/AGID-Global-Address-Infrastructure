# Estonia Postal Context runtime

Status: `M1 metadata and synthetic runtime conformance`

AGID can load Estonia independently alongside the existing country packs. The
shared API and resolver support five-digit normalization, Omniva assignments,
official AKS postal-area polygons, ADS address/building identity, historical
object versions, facility exceptions, and AGID candidate cell covers without
copying national source datasets into this repository.

## 1. Canonical postcode

```text
input -> NFKC -> remove whitespace -> exactly five digits
```

Hyphens and non-digits are rejected. The runtime stores a postcode as a string
and uses `postal-area-first` semantics:

```text
postcode
  -> Omniva operator assignment and routing rules
  -> pinned AKS postal-code Polygon / MultiPolygon
  -> AKS current address assignment with ADR_ID
  -> ADS address object with ADS_OID and ADOB_ID
  -> source-linked ADS building point / polygon
  -> AGID cell cover
```

A five-digit code can identify an area or facility routing context. It does not
by itself identify a recipient, apartment, entrance, building, or delivery
guarantee.

## 2. Source and rights boundaries

### Omniva

AS Eesti Post (Omniva) manages Estonia's postcodes and provides the official
address-to-postcode search and postcode download. Omniva also defines postal
addressing and post-office, parcel-machine, offload-postcode and Poste Restante
routing behavior. Public pages and downloads are pinned separately from AKS
data; their availability does not authorize storage of customer, recipient or
shipment data or automatically establish geometry rights.

### AKS postal assignments

The Land and Spatial Development Board publishes a monthly current-address CSV
containing `ADR_ID`, postcode, short/full address and reference coordinates.
Postcodes are attached to addresses according to the zones managed by Omniva.
The extract is updated monthly and contains only current address versions, so
it cannot answer historical queries without address-object change/history
services.

### AKS postal areas

The public AKS OGC service exposes `Sihtnumbri alad` as postal-code areas. A
pinned release is canonical public Polygon/MultiPolygon geometry for that
edition. AGID records the interface generation, layer name, schema, CRS,
retrieval time, provider attribution, digest, topology report and source
validity independently from address assignments.

### ADS / AKS address objects

ADS contains official addresses of cadastral parcels, residential and
non-residential buildings, dwellings and other building parts. An address is
valid only after registration in ADS. `ADS_OID` identifies an object across
versions; `ADOB_ID` identifies one version. Object type, legal-basis date,
status, predecessor/successor, valid time, known time and geometry are material
evidence and cannot be flattened into one current row.

In-AKS replaced In-ADS on 27 April 2026. New AKS REST services and OGC layers
are the forward interface; legacy ADS SOAP services close at the end of 2026.
Endpoint migration changes transport, not source authority, and is recorded as
an interface-generation change.

### ADS building shapes

AKS publishes ADS building points and polygons. A building can be definitive
when the address and geometry follow one coherent ADS source object. A nearby
or containing shape with no `ADS_OID`/`ADOB_ID` path remains a candidate.

Building-part objects can represent dwellings and other units. Public AGID
resolution stops at a building or public entrance and excludes recipients,
occupants, owners and private unit context.

### EHAK administrative context

The official Administrative and Settlement Division supplies monthly 1:10,000
county, municipality and settlement geometry with EHAK codes. It provides
address hierarchy and validation context, but never becomes postal geometry or
postal assignment authority.

Official references:

- [Omniva Estonia ZIP-code search and download](https://www.omniva.ee/en/zip-codes/)
- [Estonian Geoportal postal codes](https://geoportaal.maaamet.ee/eng/spatial-data/address-data/postal-codes-p661.html)
- [Estonian Geoportal address data](https://geoportaal.maaamet.ee/eng/spatial-data/address-data-p313.html)
- [Public WMS/WFS services](https://geoportaal.maaamet.ee/eng/services/public-wms-wfs-p346.html)
- [AKS/ADS service transition](https://geoportaal.maaamet.ee/est/teenused/x-tee-teenused/aadressiandmete-susteemi-x-tee-teenused-p266.html)
- [Administrative and Settlement Division](https://geoportaal.maaamet.ee/eng/Spatial-Data/Administrative-and-Settlement-Division-p312.html)

## 3. Postal geometry and mathematical validation

For postcode `c` and pinned AKS release `r`, original postal geometry is:

```text
G(c, r) in {Polygon, MultiPolygon}
```

For current AKS address assignments `A(c, r)`, release validation checks:

```text
containment(c, r) =
  |{a in A(c, r) : point(a) in or near G(c, r)}| / |A(c, r)|
```

Boundary tolerance is explicit and measured in Estonia's pinned projected CRS.
Every outlier retains assignment and geometry evidence separately; AGID never
silently moves an address or changes its postcode to improve the metric.

If original AKS geometry is temporarily unavailable, an experimental fallback
may be produced from address points and a rights-cleared national clip:

```text
D(c, r) = clip intersect union({Voronoi(a) | a in A(c, r)})
```

`D` remains `derived_geometry`; it cannot replace or impersonate `G`. EHAK
boundaries and AGID cells likewise remain context and candidate indexes.

## 4. Address and building resolution

The safe building path is source identity, not distance:

```text
ADR_ID
  -> address assertion
  -> ADS_OID stable address object
  -> ADOB_ID version valid at query time
  -> ADS building object and shape
```

If the path is missing or branches to several valid buildings, resolution stops
at address/premise and returns ambiguity. Multiple addresses or building parts
are never merged into a synthetic Franken-address.

Rural farm and named-place addresses can have no street. Their farm, village,
municipality and county components are retained rather than forcing an urban
street model.

## 5. Facilities and privacy

Parcel-machine and post-office codes, `offloadPostcode`, Poste Restante and
other collection routing are represented as facility points. They do not
overwrite the premise postcode, create a residential area, or imply residence
at the facility.

Public API results never include recipient identity, occupant, owner, telephone
number, shipment data, delivery instruction or private dwelling context.

## 6. Runtime configuration

```text
AGID_POSTAL_CONTEXT_EE_DESCRIPTOR_PATH=C:\absolute\path\ee-descriptor.json
AGID_POSTAL_CONTEXT_EE_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_EE_LKG_DESCRIPTOR_PATH=C:\absolute\path\ee-lkg-descriptor.json
AGID_POSTAL_CONTEXT_EE_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

The shared endpoints are:

```text
POST /api/postal/resolve
GET  /api/postal/EE/:postcode
GET  /api/postal/intersects?country=EE&bbox=...
```

Geometry remains opt-in with `geometry=geojson`. AGID cells are indexes, not
substitutes for original geometry or ADS source-object identity checks.

## 7. Current completion boundary

This implementation completes the country contract, source/rights profile,
normalizer, multi-country store support, API routing, AGID integration, and
synthetic conformance tests. It does not claim nationwide production coverage.
M2 requires pinned Omniva, AKS postal, ADS address/building and EHAK releases;
interface-generation receipts; reproducible joins; topology, containment and
identity evaluation; privacy review; attribution; correction intake; and
rollback.
