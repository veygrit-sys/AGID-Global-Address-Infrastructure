# Italy Postal Context repository seed

This directory is the metadata-only seed for the planned `agid-postal-it`
country repository. It defines Italy-specific source roles, licence partitions,
five-digit CAP semantics, multiCAP street-range rules, historical transitions,
derived geometry, building-link gates, and non-geographic synthetic fixtures.
It contains no Poste Italiane or CAP Professional rows, ANNCSU rows, ISTAT
features, DBGT buildings, cadastral records, real addresses, or production
geometry.

## Authority model

```text
Poste Italiane CAP search / CAP Professional
  -> official CAP assignment, city zone, street arc and civic-number range

ANNCSU
  -> official public street and civic-number evidence (CC BY 4.0)

ISTAT
  -> administrative context and rights-cleared derivation clip, not CAP geometry

regional / municipal DBGT
  -> topographic building candidate under per-dataset terms

Agenzia delle Entrate cadastral services
  -> separately governed parcel/map reference, not a building or postal link

derived CAP surface
  -> reproducible model output, never an official Poste Italiane boundary

AGID cell cover
  -> candidate index followed by original-geometry and evidence checks
```

Assignment authority, geometry authority, redistribution rights, valid time,
known time, and evidence purpose remain independent on every assertion.

## Postal geometry

A CAP is stored as a five-character string. It may identify one locality, a
group of municipalities, or a zone inside a multiCAP city. CAP Professional can
associate city street arcs and house-number ranges with a CAP, but those
assignments do not themselves publish an official national polygon layer.

A candidate surface can be generated from pinned assignment/address evidence
and rights-cleared clip geometry. The output remains `derived_geometry` and
retains source digests, projection, model, parameters, topology, holdout
results, licence proof, and date. Municipality boundaries and AGID cells never
inherit Poste Italiane authority.

## Address and building display

ANNCSU is the official national register of urban streets and civic numbers.
Its monthly bulk datasets and daily API evidence are address evidence, not a
delivery guarantee. An address position does not automatically equal an
entrance, building footprint, legal parcel, or recipient.

Italy's DBGT specification provides a common model, while actual building data
is federated among regional and municipal providers. Every source needs its own
coverage, scale, CRS, freshness, licence, attribution, and identifiers. A
nearest or containing building remains a candidate. AGID displays a definitive
building only when a stable source-backed civic-to-building relation exists.

## Required exceptions

- Preserve leading zeroes and reject hyphenated CAP input.
- Do not force one CAP to one municipality or one polygon.
- Preserve street arc, civic-number bounds, suffix and parity in multiCAP cities.
- Preserve former-municipality qualifiers for homonymous roads after mergers.
- Keep old and new CAP assignments queryable during the operator transition.
- Treat casella postale, Fermoposta and organization routing as non-premise or
  non-areal unless independent evidence proves otherwise.
- Keep San Marino and Vatican City in separate `SM` and `VA` country packs.
- Do not infer building, occupancy or deliverability from CAP, civic proximity,
  a DBGT footprint, cadastral parcel, or AGID cell.

## Promotion

This seed is `M1_metadata`. Promotion requires a reviewed Poste Italiane data
contract or reproducible public receipts, pinned ANNCSU and ISTAT releases,
per-dataset DBGT rights, five-digit normalization, range/parity validation,
derived-surface topology and holdout results, source-backed building links,
historical transition handling, attribution, correction/rollback flows, and
two successful source refreshes.

Files:

- `repository-manifest.json`: country contract and promotion gates.
- `source-profile.json`: Poste Italiane, ANNCSU, ISTAT, DBGT and cadastral roles.
- `fixtures/italy-synthetic.json`: non-geographic conformance cases.
