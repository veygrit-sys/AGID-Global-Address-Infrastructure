# Open Geo Island Coverage Audit

Generated: 2026-07-02T10:00:13.455Z

Verdict: **not-complete-global-island-coverage**

This audit checks locally stored open-source island-related AGID seeds. It does not query external official island inventories, so it cannot prove real-world all-island completeness. It is designed to separate safe island claims from overclaims.

## Summary

- Open geo repositories: 814
- Gazetteer repositories: 119
- Parsed place seed records: 995
- Explicit `featureClass: island` records: 113
- Island-like seed records: 224
- Repositories with island-like seeds: 22
- P0 island audit targets: 8
- P0 complete all-island passing: 2
- P0 complete main-island passing: 1
- P0 partial: 0
- P0 deferred: 5
- Gazetteer repos with island overclaim guards: 4

## Interpretation

- The repository set contains island-related public anchors, but it does not prove that all islands are recorded.
- Only a small P0 subset currently has executable complete-all-island or complete-main-island gates.
- Many island countries and territories are represented as country, subdivision, atoll, or archipelago seeds rather than exhaustive individual island inventories.
- A true all-island claim requires an authoritative island inventory, exact expected island count, source-linked records, and an explicit overclaim guard for each country or territory.

## P0 Executable Status

| Code | Repository | Mode | Status | Island seeds | Expected | Next improvement |
| --- | --- | --- | --- | --- | --- | --- |
| PN | `agid-open-pn-gazetteer` | complete-all-islands | passing | 4 | 4 | Add route/access policy fixtures without changing the four-island completeness claim. |
| FO | `agid-open-fo-gazetteer` | complete-main-islands | passing | 18 | 18 | Add a separate islet/skerry backlog instead of upgrading the current pack to all-island coverage. |
| KI | `agid-open-ki-gazetteer` | complete-all-islands | passing | 33 | 33 | Add council and settlement anchors while keeping the no-delivery/no-boundary island non-claim. |
| MH | `agid-open-mh-gazetteer` | administrative-coverage-island-expansion-needed | deferred | 34 | - | Add an authoritative all-islet inventory manifest and disputed/claimed-feature policy before any Marshall Islands all-island claim. |
| FM | `agid-open-fm-gazetteer` | administrative-coverage-island-expansion-needed | deferred | 0 | - | Add major island anchors under Chuuk, Kosrae, Pohnpei, and Yap without claiming complete minor-islet coverage. |
| WF | `agid-open-wf-gazetteer` | customary-coverage-island-expansion-needed | deferred | 0 | - | Add Wallis, Futuna, and Alofi as explicit island anchors under the customary kingdoms. |
| NC | `agid-open-nc-gazetteer` | subdivision-coverage-island-expansion-needed | deferred | 0 | - | Add Grande Terre, Loyalty Islands, Isle of Pines, and Belep public island anchors with no route/access claim. |
| PF | `agid-open-pf-gazetteer` | subdivision-coverage-island-expansion-needed | deferred | 0 | - | Add archipelago and high-confidence island anchors before attempting all-island coverage. |

## All-Island Claim Repositories

- `agid-open-pn-gazetteer`
- `agid-open-ki-gazetteer`

## Main-Island Claim Repositories

- `agid-open-fo-gazetteer`

## Deferred Island Expansion Repositories

- `agid-open-mh-gazetteer`
- `agid-open-fm-gazetteer`
- `agid-open-wf-gazetteer`
- `agid-open-nc-gazetteer`
- `agid-open-pf-gazetteer`

## Required Next Gates

- Create per-country authoritative island inventory manifests with expected island counts.
- Separate all-island, main-island, inhabited-island, administrative-island, atoll, reef, cay, skerry, and disputed-feature scopes.
- Require no-delivery, no-boundary, and no-private-coordinate non-claims for island anchors.
- Add reconciliation vectors against official national geodata plus OSM, GeoNames, Wikidata, and marine gazetteers where licenses allow.
- Block any all-island completeness claim unless matching release gates and source-linked conformance vectors pass.
