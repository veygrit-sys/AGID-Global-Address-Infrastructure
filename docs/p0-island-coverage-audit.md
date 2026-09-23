# P0 Island Coverage Audit

This audit turns the P0 island coverage policy into an executable matrix. It
separates three cases that must not be confused:

- complete all-island coverage, such as Pitcairn Islands and Kiribati
- complete main-island coverage, such as Faroe Islands
- administrative or subdivision coverage where island expansion is still needed

The goal is to improve P0 critical island packs without overclaiming legal
boundaries, delivery reachability, access rights, population, routing, or
private-coordinate coverage.

## Current Executable Status

| Code | Repository | Mode | Current status | Next smallest improvement |
| --- | --- | --- | --- | --- |
| PN | `agid-open-pn-gazetteer` | complete all islands | passing: 4 island seeds | Add route/access policy fixtures without changing the completeness claim. |
| FO | `agid-open-fo-gazetteer` | complete main islands | passing: 18 main-island seeds | Add an islet/skerry backlog without claiming all-islet coverage. |
| KI | `agid-open-ki-gazetteer` | complete all islands | passing: 33 island seeds | Add council and settlement anchors under the no-delivery/no-boundary guard. |
| MH | `agid-open-mh-gazetteer` | administrative coverage | deferred: 26 base atoll/island anchors | Add associated uninhabited atoll/island anchors before any all-island claim. |
| FM | `agid-open-fm-gazetteer` | administrative coverage | deferred | Add major island anchors under Chuuk, Kosrae, Pohnpei, and Yap. |
| WF | `agid-open-wf-gazetteer` | customary coverage | deferred | Add Wallis, Futuna, and Alofi as explicit island anchors. |
| NC | `agid-open-nc-gazetteer` | subdivision coverage | deferred | Add Grande Terre, Loyalty Islands, Isle of Pines, and Belep anchors. |
| PF | `agid-open-pf-gazetteer` | subdivision coverage | deferred | Add archipelago and high-confidence island anchors before all-island coverage. |

## Verification

Run:

```text
npm run verify:p0-island-coverage
```

This checks the current exact island claims and chooses the next deferred island
expansion target. The audit is intentionally conservative: no pack may claim
all-island coverage unless it has a matching release gate, source-linked island
seeds, and an overclaim guard.
