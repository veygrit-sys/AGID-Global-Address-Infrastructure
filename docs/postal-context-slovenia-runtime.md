# Slovenia Postal Context runtime

The Slovenia pack connects four-digit Pošta Slovenije assignment evidence to
GURS postal districts, addresses, buildings and administrative context without
treating a post office, special code, advertising-service area, address
centroid, parcel or nearest feature as an exact postcode or building polygon.

```text
Pošta Slovenije normal-code CSV / pinned receipt
  -> four-digit code + post-office assignment at capture time
  -> explicit versioned crosswalk to GURS poštni okoliš identifier
  -> GURS Register naslovov unique address number + centroid
  -> source-defined Kataster nepremičnin building relation
  -> separately typed parcel, administration and service evidence
  -> SI AGID cell relation
```

## Normal codes, special codes and service areas

Pošta Slovenije publishes a CSV of post offices and postal codes for
addressing. A production artifact pins the exact URL, response headers, legal
terms, capture time, four-digit text, post-office identity, schema and digest.
The public download is assignment evidence, not a polygon or an automatic
redistribution grant.

The operator separately publishes special postal codes for named
organizations, institutions, postal centres and other users. Those codes are
`organization` or another non-area geometry type by default. The address of a
named user never becomes the code perimeter.

Pošta Slovenije WebGIS also exposes delivery-office selection and A/B/C areas
for unaddressed direct-mail pricing. Those are product-specific operational
delivery areas. They do not silently become normal postcode boundaries,
addressed-mail deliverability, or reusable bulk geometry.

## GURS postal districts require an explicit crosswalk

The GURS Register prostorskih enot includes `poštni okoliš` as an official
spatial-unit class. Its graphical layers are publicly available under the GURS
CC BY 4.0 terms, which require attribution including the authority, data type
and reference date.

This is stronger evidence than an inferred Voronoi surface, but the government
postal district is not automatically a current Pošta Slovenije-authored
postcode perimeter. Production output requires both sides: a pinned operator
code/post-office assignment and a versioned explicit crosswalk to the GURS
postal-district identifier. Name matching is candidate evidence only.
Many-to-many, retired, missing or ambiguous links fail closed.

Address-membership surfaces may be generated only as `derived`, retaining
members, exclusions, method, uncertainty, validation, validity and lineage.
Municipalities, settlements, buffers, centroids and Voronoi cells never replace
the official crosswalk.

## Address and building precision

The GURS Register naslovov supplies a unique address number, address
components and a centroid. The centroid is located within the building
footprint, but containment alone is not the building relationship. Exact
building output needs the source-defined Register naslovov/Kataster
nepremičnin relation, a common authoritative identifier, or a reviewed
explicit crosswalk.

GURS JGP, WFS and OGC API Features provide public address, property-cadastre and
spatial-unit data under CC BY 4.0. Each production collection still pins its
endpoint/version, public-field allowlist, attribution, reference date, schema,
coverage, EPSG:3794 CRS, reviewed WGS84 transform and digest.

Parcels, footprints, title/value records, containment and proximity remain
separate evidence. Public packs exclude addressees, residents, owners,
rightsholders, occupants, title/value records, phones, credentials and delivery
instructions.

## Runtime state

The committed country seed is `M1_metadata`: contracts and non-production
synthetic fixtures only. It contains no Pošta Slovenije rows, GURS features,
real addresses, personal data or production geometry. Slovenia remains
`unconfigured` until a separately released M2+ descriptor passes integrity,
terms/licence, attribution, explicit postal-district crosswalk, freshness,
topology, ambiguity, privacy, CRS, coverage and correction gates.
