# Romania Postal Context runtime

The Romania pack keeps Poșta Română six-digit assignment, RENNS CUA address identity, ANCPI INIS constructions and property, and INSSE SIRUTA administration as distinct evidence. It never turns a search row, postal office, street buffer, address point, parcel, locality or nearest feature into official postal geometry or an exact building link.

Poșta Română six-digit assignment and assignment class
  -> separately permitted RENNS CUA, administrative number and address point
  -> source-defined or reviewed ANCPI construction relation
  -> separately typed property, SIRUTA, administrative and privacy evidence
  -> RO AGID cell relation

## Assignment granularity and geometry

Poșta Română documentation describes mixed granularity: Bucharest, county-seat municipalities and specified municipalities can have street, street-part or single-building codes, while other localities can have one locality-wide code. Each assignment therefore retains its actual class. A six-digit format, result row, postal subunit, county, locality, street or number does not imply a universal area or deliverability.

The operator's digitalization consultation stated that the then-current postcode database lacked geographic coordinates. That dated negative evidence does not rule out a newer official release, but it prevents AGID from presenting invented nationwide operator polygons. Rights-cleared RENNS CUA members joined to pinned operator assignments may produce a derived, uncertainty-bearing surface. Sparse, unmatched and ambiguous locations remain gaps. County, UAT and locality boundaries, cadastral parcels, street buffers, office points, Voronoi cells and interpolation remain QA candidates only.

## RENNS address and ANCPI building precision

RENNS is the ANCPI-coordinated national system for street nomenclature and administrative numbers. Exact use pins CUA, allowed civic components, SIRUTA and parcel references, point and source dates when supplied, local-authority coverage, access basis, terms, schema, source CRS and digest. Public search and the statutory public character of general data do not automatically grant bulk extraction or redistribution rights.

An exact building output requires a permitted ANCPI construction feature and a source-defined address relationship, common stable identifier or reviewed explicit crosswalk. A CUA point, administrative number, parcel reference, property, text match, containment, overlap or proximity is candidate evidence only. INIS service visibility is not a blanket vector licence. The registered-property viewer remains validation-only under its purpose limits.

Public output excludes owners, rightsholders, residents, occupants, domicile and legal-entity associations, land-book rights, personal identifiers, title or right basis, encumbrances, restrictions, transactions, values and tax fields. Apartment or unit details are emitted only from an independently permitted public address artifact, never inferred from the postcode, point, parcel or construction.

## SIRUTA, CRS, licensing and runtime state

Pinned INSSE SIRUTA locality data supplies dated county, UAT and locality codes, hierarchy and separately licensed geometry. Statistical or administrative membership does not create postcode assignment, delivery eligibility, exact building linkage or a sovereignty conclusion.

Every INIS geometry keeps its EPSG:3844 source metadata and uses a reviewed, versioned WGS84 transform. Search access, public viewing, query capability, a paid receipt or statutory access does not imply reusable bulk or derivative rights.

The committed seed is M1_metadata: contracts and non-production synthetic fixtures only. It contains no Poșta Română, RENNS, INIS or INSSE rows, real addresses, personal data or production geometry. Romania remains unconfigured until a separately released M2+ descriptor passes integrity, source rights, freshness, assignment-class, derived-geometry, explicit-building-link, privacy, CRS, coverage and correction gates.
