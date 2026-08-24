# Monaco Postal Context country-pack seed

This directory is the AGID-side contract seed for the planned
`agid-postal-mc` repository. It contains no upstream address rows, personal
data, production geometry or claim that a synthetic fixture is deliverable.

## Evidence layers

1. La Poste's official postal-code base is assignment evidence for the Monaco
   rows it actually publishes. Its catalogue explicitly says that postcode
   contours are not supplied as open data.
2. La Poste Monaco publications are current operator evidence for addressing
   and CEDEX presentation. A printed example is not a complete allocation
   table or a reusable postcode polygon.
3. The Monaco DPUM address base and geographic-information system are the
   intended authority for streets, addresses and building identifiers. Their
   existence does not by itself grant public bulk access or redistribution.
4. Official urban-planning maps describe regulatory zones and plans. They do
   not automatically prove a current building footprint, address link or
   postal boundary.
5. IMSEE district material supplies statistical and territorial context only.
6. AGID supplies a spatial index and cover relation, never source identity.

## Postcode semantics

The canonical structural form is five digits beginning with `980`. `98000` is
the ordinary Monaco routing code. Other `980xx` values can be CEDEX or special
routing designators, so the pack must preserve allocation class and the exact
operator evidence. Structural validity does not prove that every value from
`98000` through `98099` is currently assigned.

No reviewed official nationwide postcode polygon product is assumed. A
surface inferred from licensed DPUM address points, delivery observations or
another reviewed source is `derived_geometry`, opt-in and noncanonical. A
CEDEX, organisation, post-office-box or service code is non-areal unless its
own authoritative geometry says otherwise.

## Address and building resolution

An exact building result requires a DPUM building/address identifier shared by
the source records or a reviewed explicit crosswalk. Point containment,
nearest footprint, an urban-plan outline or an OSM match remains a candidate.
Apartment counts, residents, occupants, owners, recipients and non-public unit
details never enter public artifacts.

The `MC` pack is separate from France even when a La Poste dataset distributes
both scopes. French commune geometry, neighbouring French addresses and the
Principality boundary must not be merged into Monaco postal evidence.

## Maturity

The current stage is `M1_metadata`. Fixtures are synthetic conformance inputs.
Promotion requires immutable source receipts, field-level rights, independent
assignment reconciliation, explicit address-building linkage and two clean
refreshes. See `docs/postal-context-malta-runtime.md` for the preceding country
implementation pattern and `docs/postal-context-repository-boundary.md` for
the repository boundary.
