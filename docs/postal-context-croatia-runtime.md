# Croatia Postal Context runtime

The Croatia pack connects five-digit Hrvatska pošta assignment evidence to DGU
delivery-office areas, addresses, buildings and administration without treating
an office, settlement, point, parcel or nearest footprint as a postcode polygon
or exact address-building relationship.

```text
Hrvatska pošta permitted row or lookup receipt
  -> five-digit code + destination post office at capture time
  -> explicit versioned office-to-DGU delivery-area crosswalk
  -> DGU INSPIRE address identifier + locator + hierarchy
  -> explicit address-building relation / common ID / reviewed crosswalk
  -> separately typed cadastral, administrative and GISCO validation
  -> HR AGID cell relation
```

## Five digits and international display

The runtime stores the domestic five-digit code as text and accepts the UPU
international `HR-NNNNN` form at the boundary. The prefix is a rendering rule,
not a second code. Hrvatska pošta publishes Excel/XML data for settlements and
destination offices, post offices, Zagreb streets/ranges and parcel lockers,
but its website legal terms do not make those rows open redistribution data.
Every production receipt or snapshot therefore pins permission, terms, query or
row scope, capture time, operator identity, schema and digest.

PO-box, organization, route and service assignments may be non-areal. A valid
format, destination office or street range does not prove current delivery,
address existence or geographic coverage.

## DGU delivery areas need a crosswalk

The DGU Spatial Unit Register officially includes a graphical "delivery area of
postal office" spatial-unit class, alongside administration, settlements,
streets, buildings and house numbers. This is stronger than a generated Voronoi
surface, but it is government register geometry—not automatically a postal
operator-authored postcode perimeter.

Production area output requires both sides of the evidence chain: a pinned
Hrvatska pošta destination-office assignment and a versioned explicit crosswalk
to the DGU delivery-area identifier. Name matching is only a candidate. The DGU
issue/release terms, validity, HTRS96/TM CRS, schema, source and digest remain
attached. Many-to-many, retired and ambiguous links fail closed.

GISCO postcode points remain official-derived point validation. Points, buffers,
Voronoi cells, NUTS/LAU matches, settlements, municipalities and counties never
substitute for the crosswalk. Rights-cleared address-membership surfaces remain
`derived` with members, exclusions, method, uncertainty, validity and lineage.

## Address and building precision

DGU exposes anonymous INSPIRE Addresses, Buildings and Administrative Units
downloads, plus building and cadastral-parcel WFS services. The Croatian Open
Licence permits reuse of the covered releases while requiring source,
last-modification date, dataset URI and labeling of changes. Each exact release
still pins those obligations, schema, coverage, validity, CRS and digest.

Exact address display needs a stable address identifier and locator. Exact
building display additionally needs an explicit distributable address-building
relationship, common authoritative identifier or reviewed crosswalk. A parcel,
land-registry record, footprint, containment or nearest feature is candidate
evidence only. Public packs exclude addressees, residents, owners,
rightsholders, occupants, title records, phones, credentials and delivery
instructions.

## Runtime state

The committed country seed is `M1_metadata`: it contains contracts and
non-production synthetic fixtures, but no Hrvatska pošta rows, DGU features,
real addresses, personal data or production geometry. Croatia remains
`unconfigured` until a separately released M2+ descriptor passes integrity,
permission/licence, explicit crosswalk, freshness, topology, ambiguity,
privacy, coverage and correction gates.
