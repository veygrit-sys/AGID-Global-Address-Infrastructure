# Serbia Postal Context runtime

The Serbia pack keeps the five-digit `Poštanski broj`, six-digit Pošta Srbije
Postal Address Code (`PAK`), RGZ address points, cadastral references,
buildings and administrative context as distinct evidence. It never turns a
post office, PAK street segment, map result, house-number point, parcel or
nearest feature into an exact postal or building polygon.

```text
Pošta Srbije five-digit destination post office
  -> six-digit PAK street-side and number-range routing evidence
  -> separately licensed RGZ unique address code + house-number point
  -> source-defined or reviewed cadastral building relation
  -> separately typed parcel, administration, coverage and service evidence
  -> RS AGID cell relation
```

## Five-digit postcode and six-digit PAK

Pošta Srbije defines PAK as a six-digit code that identifies the part of a
street visited by the delivery worker. Its own example narrows a PAK to a
municipality, populated place, odd street side and house-number range. This is
strong address-range and routing evidence, but it is not automatically a
polygon, building, household or replacement for the five-digit destination
post office.

The public `Pronađite PAK` tool returns the street, house number and subnumber,
populated place, five-digit postcode and destination post office, and PAK. Its
map display is a query receipt, not permission to scrape or redistribute an
operator geometry layer. The WSP WebAPI can validate an address and return a
postcode and PAK for registered users; credentials, contact details, shipment
payloads and documentation examples never enter the pack.

The official post-office list supplies five-digit office identifiers and
locations. An office point or office address is operational infrastructure,
not the perimeter served by that office.

## Geometry is derived unless separately proven

No nationwide official Pošta Srbije postcode or PAK polygon is assumed.
Rights-cleared RGZ house-number points may be joined to pinned postcode and
PAK receipts to build a `derived` membership surface or route. Every output
retains members, exclusions, method, uncertainty, validation, validity and
lineage. Sparse, unmatched and ambiguous locations remain coverage gaps.

Street buffers, nearest-office assignment, administrative boundaries and
Voronoi cells may be candidates or QA tools, but they never become official
Pošta Srbije or RGZ postal geometry.

## RGZ address and building precision

The RGZ Address Register publishes street and house-number geometry as CSV and
GPKG under the Serbian Open Data License. Public fields include street and
house number, unique address code, municipality, populated place, cadastral
municipality, parcel number and, for registered objects, the part of the
parcel under the object. The dataset is described as weekly updated.

The license permits commercial and non-commercial reuse, adaptation and
redistribution, but each reuse must identify the source and publishing body,
download date and download URL, and clearly mark changes or redesigns. A
release therefore pins those attribution fields, resource URL, schema, source
CRS, transform, coverage, update/reference time and digest.

A house-number point and parcel reference are not a building footprint.
Exact building output requires a source-defined RGZ relation, a common
authoritative cadastral identifier, or a reviewed explicit crosswalk to an
individually licensed building collection. Containment, overlap and proximity
remain candidate evidence. Public artifacts exclude addressees, residents,
owners, rightsholders, occupants, title/value records, contacts, credentials,
shipment data and delivery instructions.

## Administration, coverage and territory

The RGZ Spatial Unit Register provides official administrative and statistical
hierarchies and polygons. Those boundaries supply context and validation only;
they do not create postcode or PAK membership, delivery eligibility, or a
sovereignty conclusion.

Every release records the exact coverage and exclusions claimed by each source.
`RS` and `XK` data are never silently merged. Missing source coverage remains
visible rather than being filled by a nearest feature or political assumption.

## Runtime state

The committed country seed is `M1_metadata`: contracts and non-production
synthetic fixtures only. It contains no Pošta Srbije postcode/PAK rows, RGZ
features, real addresses, personal data, credentials or production geometry.
Serbia remains `unconfigured` until a separately released M2+ descriptor passes
integrity, purpose, access/terms, SODL attribution, freshness, postal evidence,
derived-geometry, explicit-building-link, privacy, CRS, coverage, territorial
and correction gates.
