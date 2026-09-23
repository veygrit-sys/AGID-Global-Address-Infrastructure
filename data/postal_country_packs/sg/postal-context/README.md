# `agid-postal-sg` contract seed

Status: `M1 metadata / no production Singapore data`

This directory is the lightweight seed for a future independent
`agid-postal-sg` repository. It contains source policy, quality gates, and
non-geographic synthetic fixtures only. It does not contain a copy of the
SingPost 6-Digit Postal Code database, OneMap API responses, real Singapore
addresses, production geometry, API tokens, or personal data.

The shared runtime and graph contract remain in Address-Grid-ID. A future SG
repository publishes immutable, digest-addressed packs that AGID loads through
the same API used for Japan.

## Singapore geometry rule

A six-digit Singapore postal code is delivery-point-first:

```text
six-digit code -> premise / block / building candidate -> public address point
               -> independently evidenced building geometry -> AGID cell
```

The code is not expanded into a neighborhood polygon. A postal-code feature may
therefore have no geometry while an associated public address point or building
has point or polygon geometry. The two-digit postal sector is a separate coarse
sorting concept; even a derived sector surface is not the boundary of each full
code inside it.

Voronoi cells, buffers, alpha shapes, learned boundaries, and AGID cell unions
may be useful for candidate generation or virtual fallback. They must remain
`derived` or `virtual`, carry method and accuracy evidence, and cannot be
presented as official SingPost geometry.

## Source boundary

- SingPost's public material establishes the six-digit format and address
  presentation rules. Its complete 6D database is a subscription product, so
  database rows stay outside public artifacts unless a reviewed contract grants
  the required redistribution and API-serving rights.
- SLA OneMap supplies authoritative national-map search and reverse-geocode
  services, but current access requires registration and an API token. API
  receipts are not silently converted into a redistributable bulk database.
- A specifically named data.gov.sg dataset can enter an open artifact only with
  its pinned download, digest, access date, Singapore Open Data Licence
  attribution, and measured coverage. One thematic dataset is not treated as a
  complete national postal registry.

## Address display ceiling

The resolver may display road, block or house number, premise, and public
building name only when those fields come from a source-authorized address
record and follow one coherent graph path. A nearest reverse-geocode response is
a candidate. Postal code alone cannot invent a building, unit, entrance,
recipient, deliverability, or surrounding polygon.

Units and occupants remain private. A multi-unit block's public postal context
stops at the public premise or building even when a delivery workflow later
uses a user-provided unit under a separate private contract.

## Production promotion

Promotion beyond M1 requires:

- pinned source and terms snapshots, credentials kept outside Git, and explicit
  cache/derivative/redistribution decisions;
- 100% six-digit format and geometry-classification checks;
- exact postal, road, and block/house agreement for building promotion;
- independent top-1 and top-k coordinate/address holdout evaluation;
- preservation of multiple nearby results as alternatives;
- no unit, occupant, recipient, phone, token, or delivery instruction in public
  artifacts;
- two consecutive successful refreshes and a tested rollback path.

## Files

- `repository-manifest.json`: Singapore geometry semantics, exception classes,
  quality gates, maturity stages, and non-guarantees.
- `source-profile.json`: conservative roles for SingPost, OneMap, and named
  data.gov.sg evidence.
- `fixtures/singapore-synthetic.json`: non-geographic cases for a building
  delivery point, multi-unit block, sector, nearest ambiguity, and PO box.
