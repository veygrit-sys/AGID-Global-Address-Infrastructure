# P0 Gazetteer Batch 38-40 Completion

This slice completes three disputed or special-region public-anchor seed packs:

| Rank | Code | Repository | Scope |
| ---: | --- | --- | --- |
| 38 | KASH | `agid-open-kash-gazetteer` | Kashmir public region and Line of Control anchors |
| 39 | PMR | `agid-open-pmr-gazetteer` | Transnistrian-region public locality and district anchors |
| 40 | SCSD | `agid-open-scsd-gazetteer` | South China Sea island, shoal, and bank feature-group anchors |

## Non-Claim Boundary

These packs are source-linked gazetteer seeds, not sovereignty, control, access,
postal, or delivery products.

They intentionally do not assert:

- sovereignty, recognition, statehood, or legal parity;
- current control, administration, or facility status;
- access rights, crossing permission, route safety, or safe navigation;
- postal validity, delivery availability, recipient records, or building records;
- maritime entitlement or boundary adjudication.

## Source Policy

The packs link to public reference sources and public gazetteer cross-references.
No external boundary geometry, upstream database extract, raw address record, proof
witness, private coordinate, or operational carrier record is bundled.

## Verification

Run:

```powershell
npm run verify:p0-batch-38-40-complete
npm run verify:p0-gazetteer
npm run lint
```

The batch test checks:

- complete anchor coverage for KASH, PMR, and SCSD;
- source links and nonzero centroids for each public anchor;
- generated repository fixture coverage;
- explicit non-claim notes for sovereignty/control, statehood/recognition, and
  maritime entitlement/navigation boundaries.
