# Hungary Postal Context runtime

The Hungary pack keeps Magyar Posta assignment, a derived postcode surface or
honest non-area result, KCR address identity, EHA location evidence, building
geometry, cadastre and administration as separate evidence layers.

```text
Magyar Posta four-digit assignment or special postal endpoint
  -> complete rights-cleared address membership
  -> optional derived, noncanonical postcode surface
  -> KCR address ID + allowed address/unit components + coordinate
  -> EHA/KCR cadastral relation
  -> exact rights-cleared building linked by an authoritative identifier
  -> HU AGID cell relation
```

## Assignment and generated postcode surfaces

Magyar Posta Partner Extra publishes current master-data XML files for use as
an application background database. The ZipCodes material establishes a
four-digit postcode and settlement or postal endpoint assignment when its
exact file, edition, download time, terms, schema and digest are pinned. It
does not publish a nationwide operator-authored postcode polygon layer.

AGID may generate a postcode surface only from complete, rights-cleared and
time-compatible assignment membership plus authoritative coordinates. Every
surface remains `derived` and noncanonical, and records its method, members,
exclusions, uncertainty, topology, coverage and validity. A settlement,
district, county, nearest point, buffer or Voronoi cell is never substituted
for missing postal evidence. Post-office-box and dedicated or highlighted
postcodes remain non-area routing endpoints unless independent authoritative
area geometry exists.

## Address, unit and building precision

The Központi Címregiszter (KCR) is the authoritative address register. Its
address identity can include settlement, public-place name and type, house
number, building, staircase, floor, door, unique address ID, coordinate,
cadastral identifier and object type. Statutory transfers are limited to
authorized recipients and do not establish a public bulk redistribution
right. Unit components never identify an occupant, recipient, household,
owner or rightsholder.

Lechner's EHA adds a location geometry and its relation to a cadastral number.
The geometry can represent an entrance or geometric centre inside the parcel;
it is not automatically a building footprint. Exact building output therefore
requires a source-defined relation or common authoritative identifier to an
exact rights-cleared building feature.

INSPIRE Buildings distributions retain exact metadata, coverage and licence
per feed; sample or partial coverage is never called nationwide. NTA supplies
generalized WMTS map evidence rather than an editable exact vector footprint.
Cadastral map evidence is controlled, and parcel containment, proximity and
text similarity remain candidates rather than exact address-to-building links.

## Licensing, privacy and runtime state

Every artifact retains provider, exact source URL, access terms, capture or
download time, edition, coverage, schema, source CRS, reviewed transform and
digest. Public artifacts exclude recipients, occupants, residents, owners,
rightsholders, personal contacts, title/value information, credentials,
shipments and delivery instructions.

The committed seed is `M1_metadata`: contracts and non-production synthetic
fixtures only. It contains no Magyar Posta, KCR, EHA, INSPIRE, NTA, cadastral
or KSH source rows, no real address, no production geometry and no personal
data. Hungary remains `unconfigured` until a separately released M2+ descriptor
passes integrity, rights, assignment, derived-geometry, address/building-link,
privacy, coverage, CRS, freshness and correction gates.
