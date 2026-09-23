# P2 Medium 200 Gazetteer Repository Plan

Generated: 2026-07-01T23:57:08.088Z

This plan covers every current `P2-medium` open-geodata gap in the AGID source catalog.
P2 means the country or region has partial local coverage, manual fallback, or redistribution risk that still prevents a strong open-source address-validation pack.

The goal is not to create 200 empty repositories. The goal is to turn 200 medium-risk entries into reviewable, source-linked, fixture-backed packages in waves.

## Summary

- Target count: 200
- Available P2 entries: 200
- Selected entries: 200
- Wave size: 25
- JSON plan: `data\open_geo_repositories\p2-medium-200-plan.json`

## By Continent

| Key | Count |
| --- |--- |
| africa | 62 |
| americas | 50 |
| antarctica | 1 |
| asia | 35 |
| europe | 36 |
| oceania | 15 |
| special | 1 |

## By Region Kind

| Key | Count |
| --- |--- |
| country-or-main-region | 181 |
| disputed-region | 3 |
| territory | 16 |

## By Execution Stage

| Key | Count |
| --- |--- |
| conformance-hardening | 0 |
| core-role-fill | 120 |
| manual-fallback-reduction | 55 |
| source-ledger-first | 25 |

## Operating Principles

- Do not create empty repositories; create P2 packages only when README, source ledger, fixtures, and quality gates exist.
- Prefer one compact country/region package until a concrete data-volume or maintenance reason justifies splitting.
- Use source-linked metadata and synthetic fixtures before importing external datasets.
- Separate restricted, ODbL, mixed-license, and official-but-nonredistributable sources into evidence ledgers.
- Keep all publication claims bounded: source-linked seed, partial coverage, or conformance fixture, not complete national address truth.

## Release Gates

- no-raw-personal-addresses
- no-recipient-records
- no-private-coordinates
- source-license-ledger-required
- redistribution-review-before-import
- synthetic-fixtures-first
- manual-fallback-visible-when-needed
- no-delivery-postal-or-legal-overclaim
- conformance-vectors-required

## Execution Waves

| Wave | Ranks | Items | Objective | Exit criteria |
| --- |--- |--- |--- |--- |
| 1 | 1-25 | 25 | Convert P2 candidates into source-ledger-ready packages without importing restricted data. | All selected entries have an owner, repository-set decision, and source ledger path.<br>All fixtures are synthetic or metadata-link-only.<br>License and attribution status are explicit for every source.<br>No package claims complete address, delivery, postal, legal, or boundary authority without verified data. |
| 2 | 26-50 | 25 | Convert P2 candidates into source-ledger-ready packages without importing restricted data. | All selected entries have an owner, repository-set decision, and source ledger path.<br>All fixtures are synthetic or metadata-link-only.<br>License and attribution status are explicit for every source.<br>No package claims complete address, delivery, postal, legal, or boundary authority without verified data. |
| 3 | 51-75 | 25 | Fill missing core geo roles with synthetic fixtures and public place metadata. | All selected entries have an owner, repository-set decision, and source ledger path.<br>All fixtures are synthetic or metadata-link-only.<br>License and attribution status are explicit for every source.<br>No package claims complete address, delivery, postal, legal, or boundary authority without verified data. |
| 4 | 76-100 | 25 | Fill missing core geo roles with synthetic fixtures and public place metadata. | All selected entries have an owner, repository-set decision, and source ledger path.<br>All fixtures are synthetic or metadata-link-only.<br>License and attribution status are explicit for every source.<br>No package claims complete address, delivery, postal, legal, or boundary authority without verified data. |
| 5 | 101-125 | 25 | Fill missing core geo roles with synthetic fixtures and public place metadata. | All selected entries have an owner, repository-set decision, and source ledger path.<br>All fixtures are synthetic or metadata-link-only.<br>License and attribution status are explicit for every source.<br>No package claims complete address, delivery, postal, legal, or boundary authority without verified data. |
| 6 | 126-150 | 25 | Reduce manual fallback and harden conformance/quality gates for publication. | All selected entries have an owner, repository-set decision, and source ledger path.<br>All fixtures are synthetic or metadata-link-only.<br>License and attribution status are explicit for every source.<br>No package claims complete address, delivery, postal, legal, or boundary authority without verified data. |
| 7 | 151-175 | 25 | Reduce manual fallback and harden conformance/quality gates for publication. | All selected entries have an owner, repository-set decision, and source ledger path.<br>All fixtures are synthetic or metadata-link-only.<br>License and attribution status are explicit for every source.<br>No package claims complete address, delivery, postal, legal, or boundary authority without verified data. |
| 8 | 176-200 | 25 | Reduce manual fallback and harden conformance/quality gates for publication. | All selected entries have an owner, repository-set decision, and source ledger path.<br>All fixtures are synthetic or metadata-link-only.<br>License and attribution status are explicit for every source.<br>No package claims complete address, delivery, postal, legal, or boundary authority without verified data. |

## P2 200 Item Plan

| Rank | Wave | Code | Name | Continent | Kind | Local roles | Missing roles | Stage | Repository set |
| --- |--- |--- |--- |--- |--- |--- |--- |--- |--- |
| 1 | 1 | AD | Andorra | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-ad-geocoder-fixtures<br>agid-open-ad-address-candidates<br>agid-open-ad-license-ledger |
| 2 | 1 | AE | United Arab Emirates | asia | country-or-main-region | 2/4 | admin-boundary, gazetteer | core-role-fill | agid-open-ae-boundaries<br>agid-open-ae-gazetteer<br>agid-open-ae-no-postcode-grid<br>agid-open-ae-license-ledger |
| 3 | 1 | AG | Antigua and Barbuda | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-ag-boundaries<br>agid-open-ag-geocoder-fixtures<br>agid-open-ag-address-candidates<br>agid-open-ag-no-postcode-grid |
| 4 | 1 | AI | Anguilla | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-ai-geocoder-fixtures<br>agid-open-ai-address-candidates<br>agid-open-ai-license-ledger |
| 5 | 1 | AL | Albania | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-al-geocoder-fixtures<br>agid-open-al-address-candidates<br>agid-open-al-license-ledger |
| 6 | 1 | AM | Armenia | asia | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-am-geocoder-fixtures<br>agid-open-am-address-candidates<br>agid-open-am-license-ledger |
| 7 | 1 | AO | Angola | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ao-geocoder-fixtures<br>agid-open-ao-license-ledger |
| 8 | 1 | AR | Argentina | americas | country-or-main-region | 2/4 | address, admin-boundary | core-role-fill | agid-open-ar-boundaries<br>agid-open-ar-address-candidates<br>agid-open-ar-license-ledger |
| 9 | 1 | AT | Austria | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-at-boundaries<br>agid-open-at-gazetteer<br>agid-open-at-geocoder-fixtures<br>agid-open-at-address-candidates |
| 10 | 1 | AU | Australia | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-au-boundaries<br>agid-open-au-gazetteer<br>agid-open-au-geocoder-fixtures<br>agid-open-au-address-candidates |
| 11 | 1 | AZ | Azerbaijan | asia | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-az-geocoder-fixtures<br>agid-open-az-address-candidates<br>agid-open-az-license-ledger |
| 12 | 1 | BB | Barbados | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-bb-boundaries<br>agid-open-bb-geocoder-fixtures<br>agid-open-bb-address-candidates<br>agid-open-bb-no-postcode-grid |
| 13 | 1 | BD | Bangladesh | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-bd-gazetteer<br>agid-open-bd-geocoder-fixtures<br>agid-open-bd-license-ledger |
| 14 | 1 | BF | Burkina Faso | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-bf-geocoder-fixtures<br>agid-open-bf-license-ledger |
| 15 | 1 | BH | Bahrain | asia | country-or-main-region | 2/4 | geocoding, admin-boundary | core-role-fill | agid-open-bh-boundaries<br>agid-open-bh-geocoder-fixtures<br>agid-open-bh-no-postcode-grid<br>agid-open-bh-license-ledger |
| 16 | 1 | BI | Burundi | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-bi-geocoder-fixtures<br>agid-open-bi-no-postcode-grid<br>agid-open-bi-license-ledger |
| 17 | 1 | BJ | Benin | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-bj-geocoder-fixtures<br>agid-open-bj-license-ledger |
| 18 | 1 | BL | Saint Barthélemy | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-bl-boundaries<br>agid-open-bl-geocoder-fixtures<br>agid-open-bl-address-candidates<br>agid-open-bl-license-ledger |
| 19 | 1 | BO | Bolivia | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-bo-boundaries<br>agid-open-bo-geocoder-fixtures<br>agid-open-bo-address-candidates<br>agid-open-bo-no-postcode-grid |
| 20 | 1 | BR | Brazil | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-br-boundaries<br>agid-open-br-geocoder-fixtures<br>agid-open-br-address-candidates<br>agid-open-br-license-ledger |
| 21 | 1 | BS | Bahamas | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-bs-boundaries<br>agid-open-bs-geocoder-fixtures<br>agid-open-bs-address-candidates<br>agid-open-bs-no-postcode-grid |
| 22 | 1 | BT | Bhutan | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-bt-gazetteer<br>agid-open-bt-geocoder-fixtures<br>agid-open-bt-license-ledger |
| 23 | 1 | BW | Botswana | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-bw-geocoder-fixtures<br>agid-open-bw-license-ledger |
| 24 | 1 | CA | Canada | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-ca-boundaries<br>agid-open-ca-geocoder-fixtures<br>agid-open-ca-address-candidates<br>agid-open-ca-license-ledger |
| 25 | 1 | CD | DR Congo | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-cd-geocoder-fixtures<br>agid-open-cd-no-postcode-grid<br>agid-open-cd-license-ledger |
| 26 | 2 | CF | Central African Republic | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-cf-geocoder-fixtures<br>agid-open-cf-no-postcode-grid<br>agid-open-cf-license-ledger |
| 27 | 2 | CG | Congo | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-cg-geocoder-fixtures<br>agid-open-cg-no-postcode-grid<br>agid-open-cg-license-ledger |
| 28 | 2 | CH | Switzerland | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-ch-boundaries<br>agid-open-ch-gazetteer<br>agid-open-ch-geocoder-fixtures<br>agid-open-ch-address-candidates |
| 29 | 2 | CI | Ivory Coast | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-ci-geocoder-fixtures<br>agid-open-ci-license-ledger |
| 30 | 2 | CK | Cook Islands | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-ck-boundaries<br>agid-open-ck-gazetteer<br>agid-open-ck-geocoder-fixtures<br>agid-open-ck-address-candidates |
| 31 | 2 | CL | Chile | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-cl-geocoder-fixtures<br>agid-open-cl-address-candidates<br>agid-open-cl-license-ledger |
| 32 | 2 | CM | Cameroon | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-cm-geocoder-fixtures<br>agid-open-cm-no-postcode-grid<br>agid-open-cm-license-ledger |
| 33 | 2 | CO | Colombia | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-co-geocoder-fixtures<br>agid-open-co-address-candidates<br>agid-open-co-license-ledger |
| 34 | 2 | CR | Costa Rica | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-cr-geocoder-fixtures<br>agid-open-cr-address-candidates<br>agid-open-cr-license-ledger |
| 35 | 2 | CU | Cuba | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-cu-boundaries<br>agid-open-cu-geocoder-fixtures<br>agid-open-cu-address-candidates<br>agid-open-cu-no-postcode-grid |
| 36 | 2 | CV | Cape Verde | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-cv-geocoder-fixtures<br>agid-open-cv-license-ledger |
| 37 | 2 | CY | Cyprus | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-cy-geocoder-fixtures<br>agid-open-cy-address-candidates<br>agid-open-cy-license-ledger |
| 38 | 2 | CZ | Czech Republic | europe | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-cz-gazetteer<br>agid-open-cz-geocoder-fixtures<br>agid-open-cz-license-ledger |
| 39 | 2 | DE | Germany | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-de-boundaries<br>agid-open-de-gazetteer<br>agid-open-de-geocoder-fixtures<br>agid-open-de-address-candidates |
| 40 | 2 | DJ | Djibouti | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-dj-geocoder-fixtures<br>agid-open-dj-license-ledger |
| 41 | 2 | DK | Denmark | europe | country-or-main-region | 3/4 | gazetteer | manual-fallback-reduction | agid-open-dk-gazetteer<br>agid-open-dk-license-ledger |
| 42 | 2 | DM | Dominica | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-dm-boundaries<br>agid-open-dm-geocoder-fixtures<br>agid-open-dm-address-candidates<br>agid-open-dm-no-postcode-grid |
| 43 | 2 | DO | Dominican Republic | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-do-boundaries<br>agid-open-do-geocoder-fixtures<br>agid-open-do-address-candidates<br>agid-open-do-no-postcode-grid |
| 44 | 2 | DZ | Algeria | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-dz-geocoder-fixtures<br>agid-open-dz-license-ledger |
| 45 | 2 | EA | Ceuta | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-ea-boundaries<br>agid-open-ea-gazetteer<br>agid-open-ea-geocoder-fixtures<br>agid-open-ea-address-candidates |
| 46 | 2 | EE | Estonia | europe | country-or-main-region | 3/4 | gazetteer | manual-fallback-reduction | agid-open-ee-gazetteer<br>agid-open-ee-license-ledger |
| 47 | 2 | EG | Egypt | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-eg-geocoder-fixtures<br>agid-open-eg-license-ledger |
| 48 | 2 | ER | Eritrea | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-er-geocoder-fixtures<br>agid-open-er-license-ledger |
| 49 | 2 | ES | Spain | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-es-geocoder-fixtures<br>agid-open-es-address-candidates<br>agid-open-es-license-ledger |
| 50 | 2 | ES | Balearic Islands | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-es-geocoder-fixtures<br>agid-open-es-address-candidates<br>agid-open-es-license-ledger |
| 51 | 3 | ES | Canary Islands | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-es-geocoder-fixtures<br>agid-open-es-address-candidates<br>agid-open-es-license-ledger |
| 52 | 3 | ET | Ethiopia | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-et-geocoder-fixtures<br>agid-open-et-license-ledger |
| 53 | 3 | FI | Finland | europe | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-fi-geocoder-fixtures<br>agid-open-fi-license-ledger |
| 54 | 3 | FJ | Fiji | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-fj-boundaries<br>agid-open-fj-gazetteer<br>agid-open-fj-geocoder-fixtures<br>agid-open-fj-address-candidates |
| 55 | 3 | FK | Falkland Islands | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-fk-geocoder-fixtures<br>agid-open-fk-address-candidates<br>agid-open-fk-license-ledger |
| 56 | 3 | FR | France | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-fr-boundaries<br>agid-open-fr-gazetteer<br>agid-open-fr-geocoder-fixtures<br>agid-open-fr-address-candidates |
| 57 | 3 | GA | Gabon | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-ga-geocoder-fixtures<br>agid-open-ga-no-postcode-grid<br>agid-open-ga-license-ledger |
| 58 | 3 | GB | United Kingdom | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-gb-geocoder-fixtures<br>agid-open-gb-address-candidates<br>agid-open-gb-license-ledger |
| 59 | 3 | GD | Grenada | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-gd-boundaries<br>agid-open-gd-geocoder-fixtures<br>agid-open-gd-address-candidates<br>agid-open-gd-no-postcode-grid |
| 60 | 3 | GE | Georgia | asia | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-ge-geocoder-fixtures<br>agid-open-ge-address-candidates<br>agid-open-ge-license-ledger |
| 61 | 3 | GF | French Guiana | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-gf-boundaries<br>agid-open-gf-geocoder-fixtures<br>agid-open-gf-address-candidates<br>agid-open-gf-license-ledger |
| 62 | 3 | GH | Ghana | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-gh-geocoder-fixtures<br>agid-open-gh-license-ledger |
| 63 | 3 | GM | Gambia | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-gm-geocoder-fixtures<br>agid-open-gm-license-ledger |
| 64 | 3 | GN | Guinea | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-gn-geocoder-fixtures<br>agid-open-gn-license-ledger |
| 65 | 3 | GP | Guadeloupe | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-gp-boundaries<br>agid-open-gp-geocoder-fixtures<br>agid-open-gp-address-candidates<br>agid-open-gp-license-ledger |
| 66 | 3 | GQ | Equatorial Guinea | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-gq-geocoder-fixtures<br>agid-open-gq-no-postcode-grid<br>agid-open-gq-license-ledger |
| 67 | 3 | GR | Greece | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-gr-geocoder-fixtures<br>agid-open-gr-address-candidates<br>agid-open-gr-license-ledger |
| 68 | 3 | GT | Guatemala | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-gt-geocoder-fixtures<br>agid-open-gt-address-candidates<br>agid-open-gt-license-ledger |
| 69 | 3 | GW | Guinea-Bissau | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-gw-geocoder-fixtures<br>agid-open-gw-license-ledger |
| 70 | 3 | GY | Guyana | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-gy-boundaries<br>agid-open-gy-geocoder-fixtures<br>agid-open-gy-address-candidates<br>agid-open-gy-no-postcode-grid |
| 71 | 3 | HK | Hong Kong | asia | country-or-main-region | 3/4 | gazetteer | source-ledger-first | agid-open-hk-gazetteer<br>agid-open-hk-no-postcode-grid<br>agid-open-hk-license-ledger |
| 72 | 3 | HT | Haiti | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-ht-boundaries<br>agid-open-ht-geocoder-fixtures<br>agid-open-ht-address-candidates<br>agid-open-ht-no-postcode-grid |
| 73 | 3 | HU | Hungary | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-hu-geocoder-fixtures<br>agid-open-hu-address-candidates<br>agid-open-hu-license-ledger |
| 74 | 3 | IL | Israel | asia | country-or-main-region | 3/4 | admin-boundary | manual-fallback-reduction | agid-open-il-boundaries<br>agid-open-il-license-ledger |
| 75 | 3 | IN | India | asia | country-or-main-region | 3/4 | gazetteer | manual-fallback-reduction | agid-open-in-gazetteer<br>agid-open-in-license-ledger |
| 76 | 4 | IR | Iran | asia | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ir-geocoder-fixtures<br>agid-open-ir-license-ledger |
| 77 | 4 | IS | Iceland | europe | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-is-geocoder-fixtures<br>agid-open-is-license-ledger |
| 78 | 4 | JM | Jamaica | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-jm-boundaries<br>agid-open-jm-geocoder-fixtures<br>agid-open-jm-address-candidates<br>agid-open-jm-no-postcode-grid |
| 79 | 4 | JO | Jordan | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-jo-gazetteer<br>agid-open-jo-geocoder-fixtures<br>agid-open-jo-license-ledger |
| 80 | 4 | JP | Japan | asia | country-or-main-region | 3/4 | gazetteer | source-ledger-first | agid-open-jp-gazetteer<br>agid-open-jp-license-ledger |
| 81 | 4 | KE | Kenya | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ke-geocoder-fixtures<br>agid-open-ke-license-ledger |
| 82 | 4 | KG | Kyrgyzstan | asia | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-kg-geocoder-fixtures<br>agid-open-kg-license-ledger |
| 83 | 4 | KM | Comoros | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-km-geocoder-fixtures<br>agid-open-km-license-ledger |
| 84 | 4 | KN | Saint Kitts and Nevis | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-kn-boundaries<br>agid-open-kn-geocoder-fixtures<br>agid-open-kn-address-candidates<br>agid-open-kn-no-postcode-grid |
| 85 | 4 | KR | South Korea | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-kr-gazetteer<br>agid-open-kr-geocoder-fixtures<br>agid-open-kr-license-ledger |
| 86 | 4 | KW | Kuwait | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-kw-boundaries<br>agid-open-kw-gazetteer<br>agid-open-kw-geocoder-fixtures<br>agid-open-kw-no-postcode-grid |
| 87 | 4 | KY | Cayman Islands | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-ky-geocoder-fixtures<br>agid-open-ky-address-candidates<br>agid-open-ky-license-ledger |
| 88 | 4 | KZ | Kazakhstan | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-kz-gazetteer<br>agid-open-kz-geocoder-fixtures<br>agid-open-kz-license-ledger |
| 89 | 4 | LB | Lebanon | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-lb-boundaries<br>agid-open-lb-gazetteer<br>agid-open-lb-geocoder-fixtures<br>agid-open-lb-no-postcode-grid |
| 90 | 4 | LC | Saint Lucia | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-lc-boundaries<br>agid-open-lc-geocoder-fixtures<br>agid-open-lc-address-candidates<br>agid-open-lc-no-postcode-grid |
| 91 | 4 | LI | Liechtenstein | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-li-boundaries<br>agid-open-li-gazetteer<br>agid-open-li-geocoder-fixtures<br>agid-open-li-address-candidates |
| 92 | 4 | LK | Sri Lanka | asia | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-lk-geocoder-fixtures<br>agid-open-lk-license-ledger |
| 93 | 4 | LR | Liberia | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-lr-geocoder-fixtures<br>agid-open-lr-license-ledger |
| 94 | 4 | LS | Lesotho | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ls-geocoder-fixtures<br>agid-open-ls-license-ledger |
| 95 | 4 | LT | Lithuania | europe | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-lt-geocoder-fixtures<br>agid-open-lt-license-ledger |
| 96 | 4 | LV | Latvia | europe | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-lv-geocoder-fixtures<br>agid-open-lv-license-ledger |
| 97 | 4 | LY | Libya | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-ly-geocoder-fixtures<br>agid-open-ly-license-ledger |
| 98 | 4 | MA | Morocco | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ma-geocoder-fixtures<br>agid-open-ma-license-ledger |
| 99 | 4 | MC | Monaco | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-mc-geocoder-fixtures<br>agid-open-mc-address-candidates<br>agid-open-mc-license-ledger |
| 100 | 4 | MD | Moldova | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-md-geocoder-fixtures<br>agid-open-md-address-candidates<br>agid-open-md-license-ledger |
| 101 | 5 | MF | Saint Martin | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-mf-boundaries<br>agid-open-mf-geocoder-fixtures<br>agid-open-mf-address-candidates<br>agid-open-mf-license-ledger |
| 102 | 5 | MG | Madagascar | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-mg-geocoder-fixtures<br>agid-open-mg-license-ledger |
| 103 | 5 | MK | North Macedonia | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-mk-geocoder-fixtures<br>agid-open-mk-address-candidates<br>agid-open-mk-license-ledger |
| 104 | 5 | ML | Mali | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ml-geocoder-fixtures<br>agid-open-ml-license-ledger |
| 105 | 5 | MN | Mongolia | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-mn-gazetteer<br>agid-open-mn-geocoder-fixtures<br>agid-open-mn-license-ledger |
| 106 | 5 | MO | Macau | asia | country-or-main-region | 3/4 | gazetteer | source-ledger-first | agid-open-mo-gazetteer<br>agid-open-mo-no-postcode-grid<br>agid-open-mo-license-ledger |
| 107 | 5 | MQ | Martinique | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-mq-boundaries<br>agid-open-mq-geocoder-fixtures<br>agid-open-mq-address-candidates<br>agid-open-mq-license-ledger |
| 108 | 5 | MR | Mauritania | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-mr-geocoder-fixtures<br>agid-open-mr-license-ledger |
| 109 | 5 | MS | Montserrat | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-ms-geocoder-fixtures<br>agid-open-ms-address-candidates<br>agid-open-ms-no-postcode-grid<br>agid-open-ms-license-ledger |
| 110 | 5 | MT | Malta | europe | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-mt-gazetteer<br>agid-open-mt-geocoder-fixtures<br>agid-open-mt-license-ledger |
| 111 | 5 | MU | Mauritius | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-mu-geocoder-fixtures<br>agid-open-mu-license-ledger |
| 112 | 5 | MV | Maldives | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-mv-gazetteer<br>agid-open-mv-geocoder-fixtures<br>agid-open-mv-license-ledger |
| 113 | 5 | MW | Malawi | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-mw-geocoder-fixtures<br>agid-open-mw-license-ledger |
| 114 | 5 | MX | Mexico | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-mx-boundaries<br>agid-open-mx-geocoder-fixtures<br>agid-open-mx-address-candidates<br>agid-open-mx-license-ledger |
| 115 | 5 | MZ | Mozambique | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-mz-geocoder-fixtures<br>agid-open-mz-license-ledger |
| 116 | 5 | NA | Namibia | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-na-geocoder-fixtures<br>agid-open-na-license-ledger |
| 117 | 5 | NE | Niger | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ne-geocoder-fixtures<br>agid-open-ne-license-ledger |
| 118 | 5 | NG | Nigeria | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ng-geocoder-fixtures<br>agid-open-ng-license-ledger |
| 119 | 5 | NI | Nicaragua | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-ni-geocoder-fixtures<br>agid-open-ni-address-candidates<br>agid-open-ni-license-ledger |
| 120 | 5 | NO | Norway | europe | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-no-gazetteer<br>agid-open-no-geocoder-fixtures<br>agid-open-no-license-ledger |
| 121 | 5 | NP | Nepal | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-np-gazetteer<br>agid-open-np-geocoder-fixtures<br>agid-open-np-license-ledger |
| 122 | 5 | NU | Niue | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-nu-boundaries<br>agid-open-nu-gazetteer<br>agid-open-nu-geocoder-fixtures<br>agid-open-nu-address-candidates |
| 123 | 5 | NZ | New Zealand | oceania | country-or-main-region | 2/4 | geocoding, admin-boundary | core-role-fill | agid-open-nz-boundaries<br>agid-open-nz-geocoder-fixtures<br>agid-open-nz-license-ledger |
| 124 | 5 | OM | Oman | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-om-gazetteer<br>agid-open-om-geocoder-fixtures<br>agid-open-om-license-ledger |
| 125 | 5 | PE | Peru | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-pe-geocoder-fixtures<br>agid-open-pe-address-candidates<br>agid-open-pe-license-ledger |
| 126 | 6 | PK | Pakistan | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-pk-gazetteer<br>agid-open-pk-geocoder-fixtures<br>agid-open-pk-license-ledger |
| 127 | 6 | PL | Poland | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-pl-geocoder-fixtures<br>agid-open-pl-address-candidates<br>agid-open-pl-license-ledger |
| 128 | 6 | PM | Saint Pierre and Miquelon | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-pm-boundaries<br>agid-open-pm-geocoder-fixtures<br>agid-open-pm-address-candidates<br>agid-open-pm-license-ledger |
| 129 | 6 | PR | Puerto Rico | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-pr-boundaries<br>agid-open-pr-geocoder-fixtures<br>agid-open-pr-address-candidates<br>agid-open-pr-license-ledger |
| 130 | 6 | PS | Palestine | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-ps-boundaries<br>agid-open-ps-gazetteer<br>agid-open-ps-geocoder-fixtures<br>agid-open-ps-no-postcode-grid |
| 131 | 6 | PW | Palau | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-pw-boundaries<br>agid-open-pw-gazetteer<br>agid-open-pw-geocoder-fixtures<br>agid-open-pw-address-candidates |
| 132 | 6 | PY | Paraguay | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-py-geocoder-fixtures<br>agid-open-py-address-candidates<br>agid-open-py-license-ledger |
| 133 | 6 | QA | Qatar | asia | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-qa-gazetteer<br>agid-open-qa-geocoder-fixtures<br>agid-open-qa-no-postcode-grid<br>agid-open-qa-license-ledger |
| 134 | 6 | RO | Romania | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-ro-geocoder-fixtures<br>agid-open-ro-address-candidates<br>agid-open-ro-license-ledger |
| 135 | 6 | RU | Russia | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-ru-geocoder-fixtures<br>agid-open-ru-address-candidates<br>agid-open-ru-license-ledger |
| 136 | 6 | RW | Rwanda | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-rw-geocoder-fixtures<br>agid-open-rw-license-ledger |
| 137 | 6 | SA | Saudi Arabia | asia | country-or-main-region | 3/4 | gazetteer | source-ledger-first | agid-open-sa-gazetteer<br>agid-open-sa-license-ledger |
| 138 | 6 | SB | Solomon Islands | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-sb-boundaries<br>agid-open-sb-gazetteer<br>agid-open-sb-geocoder-fixtures<br>agid-open-sb-address-candidates |
| 139 | 6 | SC | Seychelles | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-sc-geocoder-fixtures<br>agid-open-sc-license-ledger |
| 140 | 6 | SD | Sudan | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-sd-geocoder-fixtures<br>agid-open-sd-license-ledger |
| 141 | 6 | SE | Sweden | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-se-geocoder-fixtures<br>agid-open-se-address-candidates<br>agid-open-se-license-ledger |
| 142 | 6 | SG | Singapore | asia | country-or-main-region | 1/4 | address, admin-boundary, gazetteer | core-role-fill | agid-open-sg-boundaries<br>agid-open-sg-gazetteer<br>agid-open-sg-address-candidates<br>agid-open-sg-license-ledger |
| 143 | 6 | SH | Saint Helena | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-sh-geocoder-fixtures<br>agid-open-sh-license-ledger |
| 144 | 6 | SK | Slovakia | europe | country-or-main-region | 2/4 | geocoding, gazetteer | core-role-fill | agid-open-sk-gazetteer<br>agid-open-sk-geocoder-fixtures<br>agid-open-sk-license-ledger |
| 145 | 6 | SL | Sierra Leone | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-sl-geocoder-fixtures<br>agid-open-sl-license-ledger |
| 146 | 6 | SM | San Marino | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-sm-geocoder-fixtures<br>agid-open-sm-address-candidates<br>agid-open-sm-license-ledger |
| 147 | 6 | SN | Senegal | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-sn-geocoder-fixtures<br>agid-open-sn-license-ledger |
| 148 | 6 | SO | Somalia | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-so-geocoder-fixtures<br>agid-open-so-license-ledger |
| 149 | 6 | SR | Suriname | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-sr-boundaries<br>agid-open-sr-geocoder-fixtures<br>agid-open-sr-address-candidates<br>agid-open-sr-no-postcode-grid |
| 150 | 6 | SS | South Sudan | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ss-geocoder-fixtures<br>agid-open-ss-license-ledger |
| 151 | 7 | ST | Sao Tome and Principe | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-st-geocoder-fixtures<br>agid-open-st-no-postcode-grid<br>agid-open-st-license-ledger |
| 152 | 7 | SY | Syria | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-sy-boundaries<br>agid-open-sy-gazetteer<br>agid-open-sy-geocoder-fixtures<br>agid-open-sy-no-postcode-grid |
| 153 | 7 | SZ | Eswatini | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-sz-geocoder-fixtures<br>agid-open-sz-license-ledger |
| 154 | 7 | TA | Tristan da Cunha | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ta-geocoder-fixtures<br>agid-open-ta-license-ledger |
| 155 | 7 | TC | Turks and Caicos Islands | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-tc-geocoder-fixtures<br>agid-open-tc-address-candidates<br>agid-open-tc-license-ledger |
| 156 | 7 | TD | Chad | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-td-geocoder-fixtures<br>agid-open-td-no-postcode-grid<br>agid-open-td-license-ledger |
| 157 | 7 | TG | Togo | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-tg-geocoder-fixtures<br>agid-open-tg-license-ledger |
| 158 | 7 | TK | Tokelau | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-tk-boundaries<br>agid-open-tk-gazetteer<br>agid-open-tk-geocoder-fixtures<br>agid-open-tk-address-candidates |
| 159 | 7 | TL | Timor-Leste | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-tl-boundaries<br>agid-open-tl-gazetteer<br>agid-open-tl-geocoder-fixtures<br>agid-open-tl-address-candidates |
| 160 | 7 | TN | Tunisia | africa | country-or-main-region | 3/4 | geocoding | source-ledger-first | agid-open-tn-geocoder-fixtures<br>agid-open-tn-license-ledger |
| 161 | 7 | TO | Tonga | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-to-boundaries<br>agid-open-to-gazetteer<br>agid-open-to-geocoder-fixtures<br>agid-open-to-address-candidates |
| 162 | 7 | TR | Turkey | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-tr-boundaries<br>agid-open-tr-gazetteer<br>agid-open-tr-geocoder-fixtures<br>agid-open-tr-license-ledger |
| 163 | 7 | TT | Trinidad and Tobago | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-tt-boundaries<br>agid-open-tt-geocoder-fixtures<br>agid-open-tt-address-candidates<br>agid-open-tt-no-postcode-grid |
| 164 | 7 | TV | Tuvalu | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-tv-boundaries<br>agid-open-tv-gazetteer<br>agid-open-tv-geocoder-fixtures<br>agid-open-tv-address-candidates |
| 165 | 7 | TW | Taiwan | asia | country-or-main-region | 3/4 | gazetteer | manual-fallback-reduction | agid-open-tw-gazetteer<br>agid-open-tw-license-ledger |
| 166 | 7 | TZ | Tanzania | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-tz-geocoder-fixtures<br>agid-open-tz-license-ledger |
| 167 | 7 | UA | Ukraine | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-ua-geocoder-fixtures<br>agid-open-ua-address-candidates<br>agid-open-ua-license-ledger |
| 168 | 7 | UG | Uganda | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-ug-geocoder-fixtures<br>agid-open-ug-license-ledger |
| 169 | 7 | US | United States | americas | country-or-main-region | 2/4 | address, admin-boundary | core-role-fill | agid-open-us-boundaries<br>agid-open-us-address-candidates<br>agid-open-us-license-ledger |
| 170 | 7 | UY | Uruguay | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-uy-geocoder-fixtures<br>agid-open-uy-address-candidates<br>agid-open-uy-license-ledger |
| 171 | 7 | UZ | Uzbekistan | asia | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-uz-geocoder-fixtures<br>agid-open-uz-license-ledger |
| 172 | 7 | VA | Vatican City | europe | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-va-geocoder-fixtures<br>agid-open-va-address-candidates<br>agid-open-va-license-ledger |
| 173 | 7 | VC | Saint Vincent and the Grenadines | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-vc-boundaries<br>agid-open-vc-geocoder-fixtures<br>agid-open-vc-address-candidates<br>agid-open-vc-no-postcode-grid |
| 174 | 7 | VG | British Virgin Islands | americas | country-or-main-region | 2/4 | address, geocoding | core-role-fill | agid-open-vg-geocoder-fixtures<br>agid-open-vg-address-candidates<br>agid-open-vg-license-ledger |
| 175 | 7 | VI | U.S. Virgin Islands | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-vi-boundaries<br>agid-open-vi-geocoder-fixtures<br>agid-open-vi-address-candidates<br>agid-open-vi-license-ledger |
| 176 | 8 | VU | Vanuatu | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-vu-boundaries<br>agid-open-vu-gazetteer<br>agid-open-vu-geocoder-fixtures<br>agid-open-vu-address-candidates |
| 177 | 8 | WS | Samoa | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-ws-boundaries<br>agid-open-ws-gazetteer<br>agid-open-ws-geocoder-fixtures<br>agid-open-ws-address-candidates |
| 178 | 8 | YE | Yemen | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-ye-boundaries<br>agid-open-ye-gazetteer<br>agid-open-ye-geocoder-fixtures<br>agid-open-ye-no-postcode-grid |
| 179 | 8 | ZA | South Africa | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-za-geocoder-fixtures<br>agid-open-za-license-ledger |
| 180 | 8 | ZM | Zambia | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-zm-geocoder-fixtures<br>agid-open-zm-license-ledger |
| 181 | 8 | ZW | Zimbabwe | africa | country-or-main-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-zw-geocoder-fixtures<br>agid-open-zw-license-ledger |
| 182 | 8 | EH | Western Sahara | africa | disputed-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-eh-geocoder-fixtures<br>agid-open-eh-license-ledger |
| 183 | 8 | EH | Western Sahara | special | disputed-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-eh-geocoder-fixtures<br>agid-open-eh-license-ledger |
| 184 | 8 | SLND | Somaliland | africa | disputed-region | 3/4 | geocoding | manual-fallback-reduction | agid-open-slnd-geocoder-fixtures<br>agid-open-slnd-license-ledger |
| 185 | 8 | AC | Ascension Island | africa | territory | 3/4 | geocoding | manual-fallback-reduction | agid-open-ac-geocoder-fixtures<br>agid-open-ac-license-ledger |
| 186 | 8 | AQ | Australian Antarctic Territory | antarctica | territory | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-aq-boundaries<br>agid-open-aq-geocoder-fixtures<br>agid-open-aq-address-candidates<br>agid-open-aq-license-ledger |
| 187 | 8 | AS | American Samoa | americas | territory | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-as-boundaries<br>agid-open-as-geocoder-fixtures<br>agid-open-as-address-candidates<br>agid-open-as-license-ledger |
| 188 | 8 | BM | Bermuda | americas | territory | 2/4 | address, geocoding | core-role-fill | agid-open-bm-geocoder-fixtures<br>agid-open-bm-address-candidates<br>agid-open-bm-license-ledger |
| 189 | 8 | CC | Cocos (Keeling) Islands | oceania | territory | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-cc-boundaries<br>agid-open-cc-gazetteer<br>agid-open-cc-geocoder-fixtures<br>agid-open-cc-address-candidates |
| 190 | 8 | CL-EA | Easter Island (Rapa Nui) | americas | territory | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-cl-ea-boundaries<br>agid-open-cl-ea-geocoder-fixtures<br>agid-open-cl-ea-address-candidates<br>agid-open-cl-ea-license-ledger |
| 191 | 8 | CL-JF | Juan Fernandez Islands | americas | territory | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-cl-jf-boundaries<br>agid-open-cl-jf-geocoder-fixtures<br>agid-open-cl-jf-address-candidates<br>agid-open-cl-jf-license-ledger |
| 192 | 8 | CX | Christmas Island | oceania | territory | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-cx-boundaries<br>agid-open-cx-gazetteer<br>agid-open-cx-geocoder-fixtures<br>agid-open-cx-address-candidates |
| 193 | 8 | GU | Guam | americas | territory | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-gu-boundaries<br>agid-open-gu-geocoder-fixtures<br>agid-open-gu-address-candidates<br>agid-open-gu-license-ledger |
| 194 | 8 | IO | British Indian Ocean Territory | africa | territory | 3/4 | geocoding | manual-fallback-reduction | agid-open-io-geocoder-fixtures<br>agid-open-io-license-ledger |
| 195 | 8 | MP | Northern Mariana Islands | americas | territory | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-mp-boundaries<br>agid-open-mp-geocoder-fixtures<br>agid-open-mp-address-candidates<br>agid-open-mp-license-ledger |
| 196 | 8 | NF | Norfolk Island | oceania | territory | 0/4 | address, geocoding, admin-boundary, gazetteer | core-role-fill | agid-open-nf-boundaries<br>agid-open-nf-gazetteer<br>agid-open-nf-geocoder-fixtures<br>agid-open-nf-address-candidates |
| 197 | 8 | RE | La Réunion | africa | territory | 3/4 | geocoding | source-ledger-first | agid-open-re-geocoder-fixtures<br>agid-open-re-license-ledger |
| 198 | 8 | SBA | Sovereign Base Areas | europe | territory | 2/4 | address, geocoding | core-role-fill | agid-open-sba-geocoder-fixtures<br>agid-open-sba-address-candidates<br>agid-open-sba-license-ledger |
| 199 | 8 | UM | United States Minor Outlying Islands | americas | territory | 1/4 | address, geocoding, admin-boundary | core-role-fill | agid-open-um-boundaries<br>agid-open-um-geocoder-fixtures<br>agid-open-um-address-candidates<br>agid-open-um-license-ledger |
| 200 | 8 | YT | Mayotte | africa | territory | 3/4 | geocoding | source-ledger-first | agid-open-yt-geocoder-fixtures<br>agid-open-yt-license-ledger |

## Residual Risks

- P2 entries still may contain partial local coverage or redistribution risk; they should not be marketed as complete country packs.
- Some entries may become P1/P0 if source licenses change, local services disappear, or manual fallback remains high.
- The plan is generated from the current AGID source catalog; official source changes require regeneration and review.
