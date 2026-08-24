# Germany Postal Context country seed

Status: `M1_metadata`

This directory is the reviewable seed for the future `agid-postal-de`
repository. It contains contracts, source roles, quality gates and synthetic
fixtures only. It contains no Deutsche Post, BKG, GeoBasis-DE/ZSHH, address or
building source rows and no production geometry.

## Evidence chain

```text
PLZ5
  -> Deutsche Post assignment and postcode class
  -> licensed Deutsche Post Direkt / BKG delivery-area Polygon or MultiPolygon
  -> GA or HK-DE official house coordinate
  -> explicitly linked HU-DE footprint or LoD2-DE building model
  -> VG25 administrative context
  -> AGID cell cover
```

Each arrow is independent evidence. A postcode polygon never supplies a house
number or building. A house coordinate is not a footprint. A shared AGS,
containment result or nearest geometry does not prove that an address and a
building are the same source object.

## Rights boundary

The authoritative five-digit delivery postcode areas are Deutsche Post Direkt
data. The BKG PLZ distribution is also contract-restricted and available only
to eligible users. GA, HK-DE, HU-DE and LoD2-DE have separate access and
follow-on publication conditions. Those artifacts stay in rights-isolated
storage and are never committed to this public seed without an explicit
artifact-level publication receipt.

VG25 is public administrative context under its attribution terms, but an
administrative boundary is never substituted for postal geometry.

## Required exceptions

- Preserve PLZ as a five-character string, including leading zeroes.
- Keep delivery-area, large-recipient, Postfach, facility and unknown classes.
- Do not create official-looking polygons for non-area codes.
- Mark address-point or administration based surfaces as derived and opt-in.
- Preserve multipart delivery areas and cross-border routing exceptions.
- Keep house-coordinate quality and state-specific source notes.
- Require a source identifier or explicit reviewed crosswalk for an exact
  address-to-building edge.
- Exclude recipient, resident, owner, forwarding, shipment and customer data.

## Promotion

Promotion beyond M1 requires pinned source editions and digests, product- and
state-specific rights receipts, required attribution, reproducible transforms,
postcode classification and topology reports, exact-link precision evaluation,
privacy and country-partition review, independent holdouts, correction intake,
rollback, and two successful refreshes.

Files:

- `repository-manifest.json`: country semantics, graph and promotion gates.
- `source-profile.json`: operator, BKG, ZSHH and administrative evidence roles.
- `fixtures/germany-synthetic.json`: non-geographic conformance cases.
