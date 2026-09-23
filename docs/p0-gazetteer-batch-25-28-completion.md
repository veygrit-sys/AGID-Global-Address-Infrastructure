# P0 Gazetteer Batch 25-28 Completion Notes

This note records the completion boundary for the 25th through 28th P0
critical open-geodata gazetteer slices.

## Completed Slices

| Rank | Repository | Scope | Completion boundary |
| ---: | --- | --- | --- |
| 25 | `agid-open-sj-svalbard-and-jan-mayen-gazetteer` | Svalbard and Jan Mayen ISO country code | Two public component seeds plus administrative-centre cross-references |
| 26 | `agid-open-sj-jan-mayen-gazetteer` | Jan Mayen | Olonkinbyen station and Beerenberg natural-reference seeds |
| 27 | `agid-open-sj-svalbard-gazetteer` | Svalbard | Five Governor of Svalbard planning-area seeds |
| 28 | `agid-open-vn-gazetteer` | Vietnam | Current 2025 provincial-level layer: 28 provinces and 6 centrally governed cities |

## Source Policy

- Svalbard and Jan Mayen uses GeoNames component/country metadata as an
  ISO/compatibility anchor.
- Svalbard uses the Governor of Svalbard land-use management planning-area
  list as the operational completion boundary.
- Jan Mayen uses Norwegian Polar Institute public geography notes and GeoNames
  settlement/component cross-references.
- Vietnam uses the 2025 34-unit provincial-level reform references as the
  current layer. Legacy 63-unit GeoNames-style ADM1 data is compatibility-only.

## Non-Claims

- These packs do not include raw personal addresses, recipient records, private
  coordinates, proof witnesses, private keys, carrier records, or building-level
  delivery points.
- The combined `SJ` pack does not treat Svalbard and Jan Mayen as one local
  administrative system.
- The Jan Mayen pack does not claim permanent settlement, municipal, postal, or
  delivery-address coverage.
- The Svalbard pack does not claim all islands, routes, buildings, cabins, or
  private facilities.
- The Vietnam pack does not publish district-level coverage because the cited
  2025 two-tier reform dissolves the prior district/township administrative
  layer for this completion boundary.

## Verification

Run:

```bash
npm run verify:p0-batch-25-28-complete
```

The verifier checks:

- source-linked place seed state
- non-zero public approximate centroids
- official/reference and GeoNames links
- release gates
- generated conformance vectors for every completed seed
- Vietnam 28 province / 6 city count
- Svalbard and Jan Mayen non-overclaim notes
