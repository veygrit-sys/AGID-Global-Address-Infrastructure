# Bhutan Postal Context

This directory is a metadata and synthetic-runtime contract seed for BT.
It does not contain a live national assignment pack, source rows, postal
polygons, real civic addresses, buildings or private/property records.

- `repository-manifest.json`: M1 scope, preserved hard blockers and the reviewed
  `M2_source_attested` criterion.
- `source-profile.json`: separate postal, mapping, statistical, cadastral and
  transaction authorities.
- `m2-source-review.json`: bounded public locator inspection contract, rights
  review and reproduction limits.
- `fixtures/bhutan-synthetic.json`: non-authoritative synthetic fixtures only.

## 2026-08-28 M2 source review

BT remains **M1 / blocked**. All 20 public Dzongkhag options returned 76 rows,
but only 38 distinct code/office tuples. Duplicate rows, malformed HTML row
tags, unverified national edition/coverage and unresolved reuse rights prevent
promotion. No data artifact or real runtime descriptor was published.

See the [source review](../../../../docs/postal-context-bhutan-m2.md) and
[runtime contract](../../../../docs/postal-context-bhutan-runtime.md).
Postal geometry and exact civic-address/building relations require separate
explicit sources; a postal code, office or administrative label cannot imply them.
