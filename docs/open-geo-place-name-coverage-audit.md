# Open Geo Place Name Coverage Audit

Generated: 2026-07-02T09:31:04.330Z

Verdict: **not-complete-global-place-name-coverage**

This audit checks the local open-source geography repository seeds. It does not contact external official gazetteers, so it cannot prove external real-world completeness. Its purpose is to prevent overclaiming and identify the next coverage gates.

## Summary

- Open geo repositories: 814
- Repositories with manifests: 49
- Repositories with fixtures: 173
- Gazetteer-named repositories: 119
- Gazetteer repositories with place seeds: 49
- Gazetteer repositories without place seeds: 70
- `data/place-seed.json` files: 49
- `data/place-seed.json` records: 714
- `gazetteer/place-seeds.json` files: 50
- `gazetteer/place-seeds.json` records: 273
- Complete country slice claims: 17
- Complete region slice claims: 3
- Non-complete dataset disclaimers: 124
- No delivery/legal authority disclaimers: 765
- Manual fallback disclaimers: 124

## Interpretation

- The repository set contains many useful open-source geography seeds, but it does not contain evidence that every place name is recorded.
- Most packages are seed, source, fixture, boundary, or review scaffolds rather than complete authoritative gazetteers.
- Complete-slice language appears only on a small subset and should be read as complete for the declared local slice, not complete global place-name coverage.
- A true all-place-name claim needs per-country source inventories, authoritative source versions, reconciliation fixtures, and source-delta tests.

## Required Next Gates

- Add per-country authoritative gazetteer source inventory.
- Track source license, version, download date, and redistribution constraints.
- Add reconciliation vectors against official sources plus OSM/GeoNames/Wikidata where licenses allow.
- Separate settlement, administrative unit, island, POI, natural feature, historical name, and alias coverage.
- Make complete-coverage claims impossible unless a country pack passes declared source completeness gates.

## Sample Gazetteer Repositories Missing Place Seeds

- `agid-open-ae-gazetteer`
- `agid-open-af-gazetteer`
- `agid-open-at-gazetteer`
- `agid-open-au-gazetteer`
- `agid-open-ba-gazetteer`
- `agid-open-bd-gazetteer`
- `agid-open-bg-gazetteer`
- `agid-open-bt-gazetteer`
- `agid-open-by-gazetteer`
- `agid-open-cc-gazetteer`
- `agid-open-ch-gazetteer`
- `agid-open-ck-gazetteer`
- `agid-open-cx-gazetteer`
- `agid-open-cz-gazetteer`
- `agid-open-de-gazetteer`
- `agid-open-dk-gazetteer`
- `agid-open-ea-gazetteer`
- `agid-open-ee-gazetteer`
- `agid-open-fj-gazetteer`
- `agid-open-fr-gazetteer`
- `agid-open-gg-gazetteer`
- `agid-open-gi-gazetteer`
- `agid-open-hk-gazetteer`
- `agid-open-hr-gazetteer`
- `agid-open-im-gazetteer`

## Sample Complete-Slice Claim Repositories

- `agid-open-ax-gazetteer`
- `agid-open-bn-gazetteer`
- `agid-open-fm-gazetteer`
- `agid-open-fo-gazetteer`
- `agid-open-ki-gazetteer`
- `agid-open-kp-gazetteer`
- `agid-open-la-gazetteer`
- `agid-open-lu-gazetteer`
- `agid-open-mh-gazetteer`
- `agid-open-my-gazetteer`
- `agid-open-nc-gazetteer`
- `agid-open-nl-gazetteer`
- `agid-open-nr-gazetteer`
- `agid-open-pf-gazetteer`
- `agid-open-pn-gazetteer`
- `agid-open-sj-jan-mayen-gazetteer`
- `agid-open-sj-svalbard-and-jan-mayen-gazetteer`
- `agid-open-sj-svalbard-gazetteer`
- `agid-open-vn-gazetteer`
- `agid-open-wf-gazetteer`
