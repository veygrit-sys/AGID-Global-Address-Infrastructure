# `agid-postal-fr` M2 experimental pack

Status: `M2 experimental / 75001-75020 only`

This directory publishes a fixed, real-data Postal Context pack for the 20
Paris municipal-arrondissement postcodes. It does **not** claim national France
coverage and it does **not** publish official La Poste postal boundaries.

## Authority separation

The release joins two separately attributed facts:

1. La Poste's official base maps `75001`-`75020` exactly to INSEE municipal
   arrondissement codes `75101`-`75120` in the pinned snapshot.
2. The La Poste Data Fair extension exposes the matching official
   administrative contour from API Découpage administratif.

The resulting postcode display surface is labelled `derived`, even though its
assignment and administrative geometry inputs are official. No coordinate is
buffered, inferred, simplified, or otherwise changed.

```text
La Poste postcode assignment
  -> exact INSEE arrondissement equality join
  -> official administrative MultiPolygon
  -> derived postcode display surface
  -> Postal Context API
  -> translucent application map layer and fit bounds
```

## Scope and non-area handling

- Only `75001` through `75020` are published.
- Other standard French postcodes return no match in this release rather than
  borrowing a commune, centroid, point, building, or AGID cell.
- CEDEX, BP, CS, TSA, poste restante, organization and route codes remain
  non-areal unless a future separately sourced release proves an area.
- FR stays separate from overseas ISO territories and Monaco.
- No address, building, parcel, recipient, customer, occupant, or land-rights
  record is bundled.

## Reproducibility

`scripts/build-postal-context-fr-m2.mjs` verifies the exact La Poste CSV and 20
exact-query response digests, validates one-to-one identities, rings, Paris
bounds and boolean validity, then writes deterministic `graph.json`,
`geometry.json`, and `descriptor.json` artifacts. Raw CSV/API responses stay in
an audit-only temporary directory and are not committed.

Source, rights, transformation, limitations, validation, application-path
evidence, and artifact hashes are recorded in
`docs/postal-context-france-m2.md` and
`reports/postal-context-m2/fr-*-2026-08-30.json`.

The legacy non-geographic fixtures remain contract tests only. They are not M2
evidence and never promote a release.
