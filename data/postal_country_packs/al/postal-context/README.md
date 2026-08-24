# Albania Postal Context contract seed

This directory is the M1 metadata seed for the future `agid-postal-al`
country repository. It contains no Posta Shqiptare rows, National Address
System records, ASIG/ASHK features, real addresses, or production geometry.

The evidence chain remains explicit:

- Posta Shqiptare supplies four-digit postcode, post-office, and branch
  assignment evidence.
- UPU supplies address-format and delivery-network semantics, not allocations.
- the National Address System supplies official address and address-building
  identity.
- ASIG publishes administrative, address, and building services; ASHK is the
  responsible cadastral source for cadastral building and parcel evidence.
- AGID supplies spatial indexing and cell relations, never postal assignment.

Four-digit syntax alone does not prove that a code is allocated or current.
Post offices, PO boxes, organizations, institutional routes, and other special
records remain point or non-area evidence unless an authoritative source
publishes an area. Any polygon generated from address membership is explicitly
derived and retains its method, lineage, uncertainty, and omissions.

An exact building result requires the same official address/cadastral object
identifier or a reviewed crosswalk. Address points, cadastral parcels,
containment, and nearest footprints remain candidates. Public artifacts exclude
recipients, owners, residents, occupants, contact data, credentials, and
protected cadastral or civil-status attributes.

Postal evidence is not a territorial claim. Albania and Kosovo remain separate
ISO country packs; shared language, locality names, border proximity, or postal
routes never merge country identity or AGID relations.

The fixtures are synthetic runtime conformance data and cannot promote a real
release. See `repository-manifest.json` and `source-profile.json` for gates.
