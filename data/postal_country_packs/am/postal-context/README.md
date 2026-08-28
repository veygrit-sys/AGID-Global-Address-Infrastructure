# Armenia Postal Context contract seed

This directory is the M1 metadata seed for the future `agid-postal-am`
country repository. It contains no HayPost rows, Cadastre Committee records,
National Geoportal features, real addresses, or production geometry.

The evidence chain remains explicit:

- HayPost supplies four-digit postcode, postal-region, and post-office
  assignment evidence.
- UPU supplies address-format and coding semantics, not current allocations.
- the Cadastre Committee registers real-estate addresses from authorized
  community decisions.
- the National Geoportal exposes distinct address, parcel, building,
  administrative-boundary, and geographical-name layers.
- AGID supplies spatial indexing and cell relations, never postal assignment.

Four-digit syntax alone does not prove that a code is allocated or current. A
post-office location, PO box, organization route, or postal-region label is not
automatically an area. Any polygon generated from address membership is
explicitly derived and retains its method, lineage, uncertainty, and omissions.

An exact building result requires the same official address/cadastral object
identifier or a reviewed crosswalk. Address points, parcels, containment, and
nearest footprints remain candidates. Public artifacts exclude recipients,
owners, rightsholders, residents, occupants, contact data, credentials, and
protected real-estate registry attributes.

Postal evidence is not a territorial claim. Country and disputed-feature
classification follows a separately pinned boundary policy and vintage; postal
routing, language, locality names, or proximity never assign AM country or AGID
identity outside that policy.

The fixtures are synthetic runtime conformance data and cannot promote a real
release. See `repository-manifest.json` and `source-profile.json` for gates.

## M2 preflight

See [the review](../../../../docs/postal-context-armenia-m2.md) and
m2-source-review.json for the 2026-08-28 directory/rights audit.
AM remains M1 / blocked; no raw rows, real runtime pack or geometry are bundled.
