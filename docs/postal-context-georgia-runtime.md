# Georgia Postal Context runtime

The Georgia pack connects four-digit Georgian Post assignment evidence to NAPR
address identity and resource-licensed NSDI address, building, cadastral and
administrative geometry without turning a locality, post office, parcel or
nearest footprint into a postcode polygon or exact address-building link.

```text
Georgian Post pinned finder receipt / permitted release
  -> four-digit code + returned locality or delivery context
  -> NAPR Address Registry identity and correction status
  -> resource-licensed NSDI Address Layer geometry
  -> explicit address-building relation / common ID / reviewed crosswalk
  -> separately typed parcel, administration, statistics and service evidence
  -> GE AGID cell relation
```

## Four digits are assignment evidence

The runtime stores the Georgian postcode as four-character text so leading
zeroes survive. Georgian Post's addressing guide places the postcode before the
city, village or town and directs users to the operator's postcode finder. A
valid format, guide example, locality result or post-office location does not by
itself prove current allocation, address existence, geographic coverage or
delivery eligibility.

Every production lookup receipt or permitted snapshot therefore pins the query
scope, returned context, capture time, interface and terms version, schema and
digest. PO-box, organization, route and service assignments may be non-areal.

## No official nationwide polygon is assumed

The reviewed sources do not establish a nationwide official Georgian postcode
polygon release. A postal surface may be generated only from rights-cleared,
versioned official address membership and must remain `derived`, with members,
exclusions, method, parameters, uncertainty, validity, validation metrics and
lineage. Post-office points, localities, registered parcels, settlements,
municipalities, buffers and Voronoi cells never become official postcode areas.

## Address and building precision

NAPR defines addresses as unique text records locating buildings, structures,
land parcels, apartments and other objects, and maintains the current names of
streets. The NSDI Geoportal exposes an Address Layer, Named Streets, Registered
Buildings, Registered Parcels, municipality boundaries and settlement
boundaries. These roles stay separate.

The NSDI terms require use according to the access licence recorded for each
resource; viewing or service availability is not a blanket open-data licence.
Each production resource must pin its responsible subject, metadata, access
licence, endpoint, public-field allowlist, schema, coverage, validity,
territorial policy, CRS and digest.

Exact building display additionally requires an explicit distributable
address-building relationship, common authoritative identifier or reviewed
crosswalk. A parcel, registered footprint, containment or nearest geometry is
candidate evidence only. Public packs exclude addressees, residents, owners,
rightsholders, tenants, occupants, apartments/units, title and restriction
records, phones, credentials and delivery instructions.

## Coverage and territorial policy

Postal assignment, language, locality names and nearest geometry never decide
sovereignty or legal boundaries. Areas absent from an operator or NSDI release,
including temporarily occupied or otherwise coverage-limited areas, remain
explicit gaps unless separate source-specific evidence and a pinned boundary
policy support the assertion. No nearest-neighbour fill is permitted.

## Runtime state

The committed country seed is `M1_metadata`: it contains contracts and
non-production synthetic fixtures, but no Georgian Post rows, NAPR records,
NSDI features, real addresses, personal data or production geometry. Georgia
remains `unconfigured` until a separately released M2+ descriptor passes
integrity, access-licence, freshness, topology, ambiguity, privacy, coverage,
territorial-policy and correction gates.
