# Czechia Postal Context country seed

Status: `M1_metadata`

This directory is the reviewable seed for the future `agid-postal-cz`
repository. It contains contracts, source roles, quality gates and synthetic
fixtures only. It contains no Česká pošta or RÚIAN rows, real addresses,
personal data or production geometry.

## Evidence chain

```text
PSČ
  -> Česká pošta routing assignment and class
  -> RÚIAN address-place identity and definition point
  -> explicitly linked RÚIAN / INSPIRE building object and geometry
  -> RÚIAN territorial context
  -> optional derived PSČ surface
  -> AGID cell cover
```

Each arrow is independent evidence. Česká pošta assignment does not publish a
nationwide official postal polygon. A RÚIAN address point is not a building
footprint. Exact building display requires the same source-defined parent
building code, ISKN identifier or a reviewed explicit crosswalk; point
containment and proximity produce candidates only.

## Geometry and address display

An eligible experimental surface may be generated from pinned RÚIAN address
points carrying the same PSČ, for example by clipped Voronoi cells followed by
a union. It is always `derived_geometry`, opt-in and accompanied by source
release, method and uncertainty. It must never be labelled as a Česká pošta
official boundary.

Address and building display follows the RÚIAN graph: address-place code,
territorial and street references, building and orientation numbers, PSČ,
parent building relation and only then the pinned building geometry. No house
number or building is inferred from the PSČ surface.

## Rights and reference-status boundary

Česká pošta public search and certified customer outputs are independently
pinned assignment artifacts with artifact-specific redistribution decisions.
RÚIAN address, VFR, INSPIRE building and boundary open data retain their CC BY
4.0 attribution and release lineage. VDP is an informational publication
surface; legally referenceable basic-register claims remain separately marked.

Recipient, resident, owner, forwarding, shipment, customer and other non-public
data are excluded from public artifacts and resolution.

## Promotion

Promotion beyond M1 requires pinned releases and digests, rights and attribution
receipts, reproducible transforms, PSČ classification, geometry topology,
explicit address-to-building identity checks, reference-status and privacy
review, independent holdouts, correction intake, rollback and two successful
refreshes.

Files:

- `repository-manifest.json`: Czech PSČ semantics and promotion gates.
- `source-profile.json`: Česká pošta and ČÚZK evidence roles.
- `fixtures/czechia-synthetic.json`: non-geographic conformance cases.
