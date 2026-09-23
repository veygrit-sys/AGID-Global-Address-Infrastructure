# P0 Gazetteer Batch 34-37 Completion

This note records the completion boundary for P0 gazetteer rotation ranks 34-37.

## Completed Slices

| Rank | Code | Region | Repository | Completion layer |
| ---: | --- | --- | --- | --- |
| 34 | `EEBD` | Ethiopia-Eritrea Border Area | `agid-open-eebd-gazetteer` | Public border-area anchors |
| 35 | `JP_NT` | Northern Territories | `agid-open-jp-nt-gazetteer` | Four public island anchors |
| 36 | `JP_SK` | Senkaku Islands | `agid-open-jp-sk-gazetteer` | Eight public island/rock anchors |
| 37 | `JP_TK` | Takeshima / Dokdo | `agid-open-jp-tk-gazetteer` | Main islets and minor rock-islet group |

## Non-Claim Boundary

These packs are intentionally non-claim packs. They record public place names,
AGID identifiers, source links, and synthetic lookup fixtures only.

They do not assert:

- sovereignty
- current control
- current administration
- demarcation completion
- crossing or access rights
- route safety
- postal validity
- delivery availability
- private coordinates
- building, resident, or recipient records

## Source Policy

The seed packs use source links only. External legal documents, government
pages, public geography pages, and gazetteers are not imported or bundled.
Redistribution remains `metadata-link-only` until a license review approves a
specific upstream dataset.

Primary source families:

- EEBC / UNMEE references for the Ethiopia-Eritrea border area.
- Japan MOFA public pages for Northern Territories, Senkaku, and Takeshima
  naming context.
- Korean public Dokdo geography source for Dongdo, Seodo, and minor islet
  geography.
- GeoNames search references only as public name cross-checks.

## Verification

Run:

```powershell
npm run verify:p0-batch-34-37-complete
npm run verify:p0-gazetteer
npm run lint
```

The batch-specific test verifies:

- every rank 34-37 pack validates through `validateP0GazetteerRepositoryPlan`
- every expected public anchor is present
- every anchor is source-linked and has non-zero approximate centroid metadata
- every generated repository includes conformance vectors for all public anchors
- no fixture is allowed to return raw personal address data
- non-claim notes are present for sovereignty, control, access, and resident/address boundaries
