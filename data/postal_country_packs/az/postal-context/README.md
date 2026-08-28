# Azerbaijan Postal Context contract seed

This directory is the M1 metadata seed for the future `agid-postal-az`
country repository. It contains no Azərpoçt rows, Ünvan Reyestri records,
cadastral objects, real addresses, or production geometry.

The evidence chain remains explicit:

- Azərpoçt supplies postcode, locality, and postal-facility assignment evidence.
- UPU supplies the `AZ` plus four-digit addressing convention, not allocations.
- the State Service on Property Issues supplies official address-register and
  cadastral context.
- a derived postal surface may be built only from rights-cleared, versioned
  address membership and suitable boundary evidence.
- AGID supplies spatial indexing and cell relations, never postal assignment.

`AZNNNN` syntax alone does not prove that a code is allocated or current.
Post offices, PO boxes, organizations, military or diplomatic routing, and
other special records remain point or non-area evidence unless an authoritative
source publishes an area.

An exact building result requires the same official address/cadastral object
identifier or a reviewed crosswalk. An address point, parcel, containment, or
nearest footprint is not enough. Public artifacts exclude recipients, owners,
occupants, contact data, credentials, and protected registry fields.

Postal evidence is also not a territorial claim. Source jurisdiction and
validity are retained; multipart geography and the Nakhchivan exclave are not
bridged, filled, or classified by nearest postcode evidence.

The fixtures are synthetic runtime conformance data and cannot promote a real
release. See `repository-manifest.json` and `source-profile.json` for gates.

## M2 preflight

See m2-source-review.json and the
[source/quality review](../../../../docs/postal-context-azerbaijan-m2.md).
The 2026-08-28 run retained only source-document hashes and branch-data
aggregate counts. Actual office/street rows, coordinates, source snapshots
and any postal polygon or building geometry are not bundled. M2 remains
blocked pending current rights-cleared evidence and approved publication.
