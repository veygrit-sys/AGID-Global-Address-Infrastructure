# P0 Gazetteer Batch 41-44 Completion

This slice completes four special-region or territory public-anchor seed packs:

| Rank | Code | Repository | Scope |
| ---: | --- | --- | --- |
| 41 | TRNC | `agid-open-trnc-gazetteer` | Northern Cyprus / Green Line public anchors |
| 42 | BAAR | `agid-open-baar-gazetteer` | Baarle-Hertog/Baarle-Nassau enclave-complex anchors |
| 43 | PHIS | `agid-open-phis-gazetteer` | Pheasant Island condominium and adjacent locality anchors |
| 44 | BV | `agid-open-bv-gazetteer` | Bouvet Island polar nature-reserve anchors |

## Safety Boundary

These repositories are source-linked gazetteer seeds. They are not legal,
operational, cadastral, access, postal, or delivery products.

They intentionally do not assert:

- statehood, recognition, current control, or border status for Northern Cyprus;
- crossing rights, route safety, postal validity, or delivery availability;
- parcel boundaries, property-level addresses, front-door jurisdiction, taxation,
  or policing in the Baarle enclave complex;
- date-specific current authority or public access for Pheasant Island;
- landing permission, rescue availability, inhabited addresses, or operational
  access for Bouvet Island.

## Source Policy

Only source links, public place names, approximate public centroids, and synthetic
conformance vectors are bundled. No upstream boundary geometry, private address,
recipient record, proof witness, private coordinate, or carrier operational record
is included.

## Verification

Run:

```powershell
npm run verify:p0-batch-41-44-complete
npm run verify:p0-gazetteer
npm run lint
```

The batch test checks complete anchor coverage, source-linked state, conformance
fixture coverage, and non-claim notes for each of the four packs.
