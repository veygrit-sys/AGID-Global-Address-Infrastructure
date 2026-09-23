# P0 Gazetteer Batch 29-33 Completion Notes

This note records the completion boundary for the 29th through 33rd P0
critical open-geodata gazetteer slices.

## Completed Slices

| Rank | Repository | Scope | Completion boundary |
| ---: | --- | --- | --- |
| 29 | `agid-open-wf-gazetteer` | Wallis and Futuna | Three customary chiefdom seeds |
| 30 | `agid-open-bt-t-gazetteer` | Bir Tawil | Non-claim region anchor plus public natural-reference anchors |
| 31 | `agid-open-crim-gazetteer` | Crimea | Neutral peninsula, administrative compatibility, and public city anchors |
| 32 | `agid-open-cygl-gazetteer` | Cyprus Green Line | UN buffer-zone, Nicosia segment, crossing-reference, and village anchors |
| 33 | `agid-open-donb-gazetteer` | Donbas | Donetsk/Luhansk oblast, city, and Donets Basin public anchors |

## Source Policy

- Wallis and Futuna remains the source-linked chiefdom layer already completed
  earlier in the P0 rotation.
- Bir Tawil uses public non-claim references only. AGID does not accept or
  publish micronation or ownership claims.
- Crimea uses OCHA/HDX/GeoNames public references as neutral compatibility
  anchors. AGID does not adjudicate sovereignty, recognition, or current
  control.
- Cyprus Green Line uses UNFICYP/UN Peacekeeping references for buffer-zone
  treatment. Crossing-point records are references, not permissions.
- Donbas uses OCHA/HDX/GeoNames references for Donetsk/Luhansk public anchors.
  AGID does not publish frontline, route safety, current-control, postal, or
  delivery-availability claims.

## Non-Claims

- No raw personal addresses, recipient records, proof witnesses, private keys,
  proof secrets, carrier records, private coordinates, or building-level data
  are stored.
- Non-claim and disputed-region packs are not postal packs.
- These records are public search/reference anchors for AGID compatibility,
  safety review, and future source-ledger work.
- Current operational access must be checked from live competent authorities;
  these repositories deliberately avoid operational permission claims.

## Verification

Run:

```bash
npm run verify:p0-batch-29-33-complete
```

The verifier checks:

- source-linked seed state
- non-zero public approximate centroids
- reference and gazetteer/source links
- release gates
- generated conformance vectors for every completed public anchor
- non-claim notes for Bir Tawil, Crimea, Cyprus Green Line, and Donbas
