# Slovakia Postal Context runtime

The Slovakia pack connects five-digit Slovenská pošta PSČ assignment evidence
to Ministry of Interior Register adries identity and address points, then to an
explicit register building relation and a rights-cleared ZBGIS/INSPIRE building
feature. It never turns a post office, access point, parcel, municipality, or
nearest footprint into a PSČ polygon or exact building link.

```text
Slovenská pošta pinned search receipt / permitted release
  -> canonical five-digit PSČ rendered NNN NN + returned routing context
  -> Register adries address/street/building identifiers and address point
  -> explicit register relation / common authoritative ID / reviewed crosswalk
  -> resource-licensed ZBGIS/INSPIRE building feature
  -> separately typed parcel, administration and service evidence
  -> SK AGID cell relation
```

## PSČ is routing evidence

The runtime stores the PSČ as text and renders one canonical space after the
third digit so leading zeroes survive. Slovenská pošta searches by street and
municipality. A valid format, search result, municipality, post-office point,
PoštaPOINT, BalíkoBOX, or other access point does not by itself prove a current
address membership, geographic perimeter, delivery route, or deliverability.

Every production query receipt or permitted snapshot therefore pins returned
context, query scope, capture time, interface and terms version, schema, and
digest. PO boxes, organizations, routes, and service assignments may be
non-areal.

## No nationwide official polygon is assumed

The reviewed official sources do not establish a nationwide Slovenská pošta
PSČ polygon release. A surface may be generated only from rights-cleared,
versioned Register adries membership and must remain `derived`, retaining its
members, exclusions, method, parameters, uncertainty, validity, validation,
and lineage. Address-point buffers, post-office points, cadastral parcels,
municipalities, districts, regions, and Voronoi cells never become official
PSČ areas.

## Address and building precision

The Ministry of Interior describes Register adries as a central, consistent
reference source for physical-building addresses. Its portal supports address
existence checks and stable identifiers; the RAGEO services expose address
points, streets, address/street/building lookup, geocoding, and initial data
download. Production use pins the exact endpoint or release, licence,
public-field allowlist, schema, coverage, validity, correction policy, CRS, and
digest.

Exact building display requires a distributable register-defined relationship,
common authoritative building identifier, or reviewed crosswalk to a licensed
ZBGIS/INSPIRE Buildings feature. A building footprint, parcel, containment, or
nearest geometry is candidate evidence only. Public packs exclude addressees,
residents, owners, rightsholders, tenants, occupants, apartments/units, title
and restriction records, phones, credentials, and delivery instructions.

ZBGIS administrative boundaries are separately versioned context and do not
create postal membership. Cadastral parcels remain validation-only unless an
exact dataset licence and non-personal field allowlist permit more; a parcel is
never substituted for an address or building.

## Runtime state

The committed country seed is `M1_metadata`: contracts and non-production
synthetic fixtures only. It contains no Slovenská pošta rows, Register adries
records, ZBGIS features, real addresses, personal data, or production geometry.
Slovakia remains `unconfigured` until a separately released M2+ descriptor
passes integrity, licence, freshness, topology, ambiguity, privacy, coverage,
correction, and identifier-link gates.
