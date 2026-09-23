# P1 High 33 Gazetteer Repository Plan

Generated: 2026-07-01T23:59:25.901Z

This plan covers every current `P1-high` open-geodata gap in the AGID source catalog.
P1 means manual fallback remains required and only one local core geo role is present.

The work should recover the missing three core roles before any package is presented as strong address-validation infrastructure.

## Summary

- Target count: 33
- Available P1 entries: 33
- Selected entries: 33
- Wave size: 11
- JSON plan: `data\open_geo_repositories\p1-high-33-plan.json`

## By Continent

| Key | Count |
| --- |--- |
| americas | 12 |
| antarctica | 1 |
| asia | 4 |
| europe | 16 |

## By Region Kind

| Key | Count |
| --- |--- |
| country-or-main-region | 32 |
| territory | 1 |

## By Recovery Track

| Key | Count |
| --- |--- |
| address-only-recovery | 4 |
| boundary-only-recovery | 15 |
| gazetteer-only-recovery | 13 |
| geocoding-only-recovery | 1 |

## Operating Principles

- P1 entries have only one local core geo role; do not publish them as complete address-validation packs.
- Recover the missing three roles before moving an entry down to P2/watch.
- Keep nonredistributable sources in license ledgers and publish synthetic fixtures first.
- Prefer one compact recovery repository set per country or region until coverage, volume, or governance requires splitting.
- Use conformance results, not optimism, to decide when manual fallback can be reduced.

## Release Gates

- no-raw-personal-addresses
- no-recipient-records
- source-license-ledger-required
- one-present-core-role-must-be-named
- three-missing-core-roles-must-be-fixtured-or-blocked
- manual-fallback-visible
- redistribution-review-before-import
- no-delivery-postal-or-legal-overclaim
- promotion-to-p2-requires-conformance-pass

## Execution Waves

| Wave | Ranks | Items | Objective | Exit criteria |
| --- |--- |--- |--- |--- |
| 1 | 1-11 | 11 | Stabilize the highest-risk P1 entries with source ledgers, non-claims, and missing-role maps. | Every entry has a repository-set decision and a license ledger path.<br>The one present local core role is explicit and not overstated.<br>The three missing core roles have fixtures or a documented blocker.<br>Manual fallback remains visible until conformance passes. |
| 2 | 12-22 | 11 | Build synthetic fixtures for the missing three core roles and reduce manual fallback triggers. | Every entry has a repository-set decision and a license ledger path.<br>The one present local core role is explicit and not overstated.<br>The three missing core roles have fixtures or a documented blocker.<br>Manual fallback remains visible until conformance passes. |
| 3 | 23-33 | 11 | Prepare publication-ready packages with conformance vectors, quality gates, and migration paths to P2/watch. | Every entry has a repository-set decision and a license ledger path.<br>The one present local core role is explicit and not overstated.<br>The three missing core roles have fixtures or a documented blocker.<br>Manual fallback remains visible until conformance passes. |

## P1 33 Item Plan

| Rank | Wave | Code | Name | Continent | Kind | Present role | Missing roles | Recovery track | Repository set |
| --- |--- |--- |--- |--- |--- |--- |--- |--- |--- |
| 1 | 1 | AF | Afghanistan | asia | country-or-main-region | address | geocoding, admin-boundary, gazetteer | address-only-recovery | agid-open-af-boundaries<br>agid-open-af-gazetteer<br>agid-open-af-geocoder-fixtures<br>agid-open-af-license-ledger |
| 2 | 1 | AW | Aruba | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-aw-boundaries<br>agid-open-aw-geocoder-fixtures<br>agid-open-aw-address-candidates<br>agid-open-aw-license-ledger |
| 3 | 1 | BA | Bosnia and Herzegovina | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-ba-gazetteer<br>agid-open-ba-geocoder-fixtures<br>agid-open-ba-address-candidates<br>agid-open-ba-license-ledger |
| 4 | 1 | BG | Bulgaria | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-bg-gazetteer<br>agid-open-bg-geocoder-fixtures<br>agid-open-bg-address-candidates<br>agid-open-bg-license-ledger |
| 5 | 1 | BQ | Caribbean Netherlands | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-bq-boundaries<br>agid-open-bq-geocoder-fixtures<br>agid-open-bq-address-candidates<br>agid-open-bq-license-ledger |
| 6 | 1 | BY | Belarus | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-by-gazetteer<br>agid-open-by-geocoder-fixtures<br>agid-open-by-address-candidates<br>agid-open-by-license-ledger |
| 7 | 1 | BZ | Belize | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-bz-boundaries<br>agid-open-bz-geocoder-fixtures<br>agid-open-bz-address-candidates<br>agid-open-bz-license-ledger |
| 8 | 1 | CW | Curaçao | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-cw-boundaries<br>agid-open-cw-geocoder-fixtures<br>agid-open-cw-address-candidates<br>agid-open-cw-license-ledger |
| 9 | 1 | EC | Ecuador | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-ec-boundaries<br>agid-open-ec-geocoder-fixtures<br>agid-open-ec-address-candidates<br>agid-open-ec-license-ledger |
| 10 | 1 | GG | Guernsey | europe | country-or-main-region | geocoding | address, admin-boundary, gazetteer | geocoding-only-recovery | agid-open-gg-boundaries<br>agid-open-gg-gazetteer<br>agid-open-gg-address-candidates<br>agid-open-gg-license-ledger |
| 11 | 1 | GI | Gibraltar | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-gi-gazetteer<br>agid-open-gi-geocoder-fixtures<br>agid-open-gi-address-candidates<br>agid-open-gi-license-ledger |
| 12 | 2 | GL | Greenland | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-gl-boundaries<br>agid-open-gl-geocoder-fixtures<br>agid-open-gl-address-candidates<br>agid-open-gl-license-ledger |
| 13 | 2 | GS | South Georgia and the South Sandwich Islands | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-gs-boundaries<br>agid-open-gs-geocoder-fixtures<br>agid-open-gs-address-candidates<br>agid-open-gs-license-ledger |
| 14 | 2 | HN | Honduras | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-hn-boundaries<br>agid-open-hn-geocoder-fixtures<br>agid-open-hn-address-candidates<br>agid-open-hn-license-ledger |
| 15 | 2 | HR | Croatia | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-hr-gazetteer<br>agid-open-hr-geocoder-fixtures<br>agid-open-hr-address-candidates<br>agid-open-hr-license-ledger |
| 16 | 2 | IM | Isle of Man | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-im-gazetteer<br>agid-open-im-geocoder-fixtures<br>agid-open-im-address-candidates<br>agid-open-im-license-ledger |
| 17 | 2 | IQ | Iraq | asia | country-or-main-region | address | geocoding, admin-boundary, gazetteer | address-only-recovery | agid-open-iq-boundaries<br>agid-open-iq-gazetteer<br>agid-open-iq-geocoder-fixtures<br>agid-open-iq-license-ledger |
| 18 | 2 | IT | Italy | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-it-gazetteer<br>agid-open-it-geocoder-fixtures<br>agid-open-it-address-candidates<br>agid-open-it-license-ledger |
| 19 | 2 | JE | Jersey | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-je-gazetteer<br>agid-open-je-geocoder-fixtures<br>agid-open-je-address-candidates<br>agid-open-je-license-ledger |
| 20 | 2 | ME | Montenegro | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-me-gazetteer<br>agid-open-me-geocoder-fixtures<br>agid-open-me-address-candidates<br>agid-open-me-license-ledger |
| 21 | 2 | PA | Panama | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-pa-boundaries<br>agid-open-pa-geocoder-fixtures<br>agid-open-pa-address-candidates<br>agid-open-pa-license-ledger |
| 22 | 2 | PT | Azores | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-pt-gazetteer<br>agid-open-pt-geocoder-fixtures<br>agid-open-pt-address-candidates<br>agid-open-pt-license-ledger |
| 23 | 3 | PT | Madeira | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-pt-gazetteer<br>agid-open-pt-geocoder-fixtures<br>agid-open-pt-address-candidates<br>agid-open-pt-license-ledger |
| 24 | 3 | PT | Portugal | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-pt-gazetteer<br>agid-open-pt-geocoder-fixtures<br>agid-open-pt-address-candidates<br>agid-open-pt-license-ledger |
| 25 | 3 | RS | Serbia | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-rs-gazetteer<br>agid-open-rs-geocoder-fixtures<br>agid-open-rs-address-candidates<br>agid-open-rs-license-ledger |
| 26 | 3 | SI | Slovenia | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-si-gazetteer<br>agid-open-si-geocoder-fixtures<br>agid-open-si-address-candidates<br>agid-open-si-license-ledger |
| 27 | 3 | SV | El Salvador | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-sv-boundaries<br>agid-open-sv-geocoder-fixtures<br>agid-open-sv-address-candidates<br>agid-open-sv-license-ledger |
| 28 | 3 | SX | Sint Maarten | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-sx-boundaries<br>agid-open-sx-geocoder-fixtures<br>agid-open-sx-address-candidates<br>agid-open-sx-license-ledger |
| 29 | 3 | TJ | Tajikistan | asia | country-or-main-region | address | geocoding, admin-boundary, gazetteer | address-only-recovery | agid-open-tj-boundaries<br>agid-open-tj-gazetteer<br>agid-open-tj-geocoder-fixtures<br>agid-open-tj-license-ledger |
| 30 | 3 | TM | Turkmenistan | asia | country-or-main-region | address | geocoding, admin-boundary, gazetteer | address-only-recovery | agid-open-tm-boundaries<br>agid-open-tm-gazetteer<br>agid-open-tm-geocoder-fixtures<br>agid-open-tm-license-ledger |
| 31 | 3 | VE | Venezuela | americas | country-or-main-region | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-ve-boundaries<br>agid-open-ve-geocoder-fixtures<br>agid-open-ve-address-candidates<br>agid-open-ve-license-ledger |
| 32 | 3 | XK | Kosovo | europe | country-or-main-region | admin-boundary | address, geocoding, gazetteer | boundary-only-recovery | agid-open-xk-gazetteer<br>agid-open-xk-geocoder-fixtures<br>agid-open-xk-address-candidates<br>agid-open-xk-license-ledger |
| 33 | 3 | TF | French Southern and Antarctic Lands | antarctica | territory | gazetteer | address, geocoding, admin-boundary | gazetteer-only-recovery | agid-open-tf-boundaries<br>agid-open-tf-geocoder-fixtures<br>agid-open-tf-address-candidates<br>agid-open-tf-license-ledger |

## Residual Risks

- All current P1 entries are nonredistributable under the current source catalog, so publication must stay metadata-link-only until license review.
- A single present local core role can make the pack look stronger than it is; README and quality gates must keep the risk visible.
- Official source changes can move entries between P1, P2, and P0; regenerate before opening repositories.
