# Geo Open Source Gap Strategy

Generated: 2026-07-01T15:04:28.382Z

This report identifies countries and regions where AGID still lacks enough local, redistributable, open geographic sources for strong address validation.

The scoring checks local core geo roles: address, geocoding, admin-boundary, and gazetteer. Global sources are useful fallbacks, but they do not replace local country or territory packs.

## Summary

- Total AGID plans: 282
- Gap entries: 282
- P0 critical: 49
- P1 high: 33
- P2 medium: 200

## Open Source Build Strategy

- Prioritize no-postcode and weak-geodata countries before ordinary postal-code countries.
- Create country or region micro-repositories only when the seed has a source ledger, fixtures, and license policy.
- Use AGID cells, admin hierarchy, settlement names, facility names, and coordinate bboxes as the minimum no-postcode fallback.
- Keep ODbL, mixed-license, and restricted official sources in separated evidence ledgers; do not merge them into unrestricted datasets.
- Require conformance vectors for each package: parse, normalize, candidate lookup, source confidence, and manual fallback behavior.
- Publish synthetic fixtures first, then add redistributable open data after license review.

## P0 Critical: no postcode or no local core geo coverage

| Priority | Code | Name | Continent | Kind | Local core roles | Missing roles | First packages |
| --- |--- |--- |--- |--- |--- |--- |--- |
| P0-critical | AX | Åland Islands | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-ax-boundaries<br>agid-open-ax-gazetteer<br>agid-open-ax-geocoder-fixtures |
| P0-critical | BE | Belgium | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-be-boundaries<br>agid-open-be-gazetteer<br>agid-open-be-geocoder-fixtures |
| P0-critical | BN | Brunei | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-bn-boundaries<br>agid-open-bn-gazetteer<br>agid-open-bn-geocoder-fixtures |
| P0-critical | CN | China | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-cn-boundaries<br>agid-open-cn-gazetteer<br>agid-open-cn-geocoder-fixtures |
| P0-critical | FM | Micronesia | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-fm-boundaries<br>agid-open-fm-gazetteer<br>agid-open-fm-geocoder-fixtures |
| P0-critical | FO | Faroe Islands | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-fo-boundaries<br>agid-open-fo-gazetteer<br>agid-open-fo-geocoder-fixtures |
| P0-critical | ID | Indonesia | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-id-boundaries<br>agid-open-id-gazetteer<br>agid-open-id-geocoder-fixtures |
| P0-critical | IE | Ireland | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-ie-boundaries<br>agid-open-ie-gazetteer<br>agid-open-ie-geocoder-fixtures |
| P0-critical | KH | Cambodia | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-kh-boundaries<br>agid-open-kh-gazetteer<br>agid-open-kh-geocoder-fixtures |
| P0-critical | KI | Kiribati | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-ki-boundaries<br>agid-open-ki-gazetteer<br>agid-open-ki-geocoder-fixtures |
| P0-critical | KP | North Korea | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-kp-boundaries<br>agid-open-kp-gazetteer<br>agid-open-kp-geocoder-fixtures |
| P0-critical | LA | Laos | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-la-boundaries<br>agid-open-la-gazetteer<br>agid-open-la-geocoder-fixtures |
| P0-critical | LU | Luxembourg | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-lu-boundaries<br>agid-open-lu-gazetteer<br>agid-open-lu-geocoder-fixtures |
| P0-critical | MH | Marshall Islands | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-mh-boundaries<br>agid-open-mh-gazetteer<br>agid-open-mh-geocoder-fixtures |
| P0-critical | MM | Myanmar | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-mm-boundaries<br>agid-open-mm-gazetteer<br>agid-open-mm-geocoder-fixtures |
| P0-critical | MY | Malaysia | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-my-boundaries<br>agid-open-my-gazetteer<br>agid-open-my-geocoder-fixtures |
| P0-critical | NC | New Caledonia | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-nc-boundaries<br>agid-open-nc-gazetteer<br>agid-open-nc-geocoder-fixtures |
| P0-critical | NL | Netherlands | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-nl-boundaries<br>agid-open-nl-gazetteer<br>agid-open-nl-geocoder-fixtures |
| P0-critical | NR | Nauru | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-nr-boundaries<br>agid-open-nr-gazetteer<br>agid-open-nr-geocoder-fixtures |
| P0-critical | PF | French Polynesia | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-pf-boundaries<br>agid-open-pf-gazetteer<br>agid-open-pf-geocoder-fixtures |
| P0-critical | PG | Papua New Guinea | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-pg-boundaries<br>agid-open-pg-gazetteer<br>agid-open-pg-geocoder-fixtures |
| P0-critical | PH | Philippines | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-ph-boundaries<br>agid-open-ph-gazetteer<br>agid-open-ph-geocoder-fixtures |
| P0-critical | PN | Pitcairn Islands | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-pn-boundaries<br>agid-open-pn-gazetteer<br>agid-open-pn-geocoder-fixtures |
| P0-critical | SJ | Svalbard and Jan Mayen | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-sj-boundaries<br>agid-open-sj-gazetteer<br>agid-open-sj-geocoder-fixtures |
| P0-critical | SJ | Jan Mayen | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-sj-boundaries<br>agid-open-sj-gazetteer<br>agid-open-sj-geocoder-fixtures |
| P0-critical | SJ | Svalbard | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-sj-boundaries<br>agid-open-sj-gazetteer<br>agid-open-sj-geocoder-fixtures |
| P0-critical | TH | Thailand | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-th-boundaries<br>agid-open-th-gazetteer<br>agid-open-th-geocoder-fixtures |
| P0-critical | VN | Vietnam | asia | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-vn-boundaries<br>agid-open-vn-gazetteer<br>agid-open-vn-geocoder-fixtures |
| P0-critical | WF | Wallis and Futuna | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-wf-boundaries<br>agid-open-wf-gazetteer<br>agid-open-wf-geocoder-fixtures |
| P0-critical | BT_T | Bir Tawil | africa | disputed-region | 3/4 | geocoding | agid-open-bt_t-geocoder-fixtures<br>agid-open-bt_t-no-postcode-grid<br>agid-open-bt_t-license-ledger |
| P0-critical | CRIM | Crimea | europe | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-crim-boundaries<br>agid-open-crim-gazetteer<br>agid-open-crim-geocoder-fixtures |
| P0-critical | CYGL | Cyprus Green Line | europe | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-cygl-boundaries<br>agid-open-cygl-gazetteer<br>agid-open-cygl-geocoder-fixtures |
| P0-critical | DONB | Donbas | europe | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-donb-boundaries<br>agid-open-donb-gazetteer<br>agid-open-donb-geocoder-fixtures |
| P0-critical | EEBD | Ethiopia-Eritrea Border Area | africa | disputed-region | 3/4 | geocoding | agid-open-eebd-geocoder-fixtures<br>agid-open-eebd-no-postcode-grid<br>agid-open-eebd-license-ledger |
| P0-critical | JP_NT | Northern Territories | asia | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-jp_nt-boundaries<br>agid-open-jp_nt-gazetteer<br>agid-open-jp_nt-geocoder-fixtures |
| P0-critical | JP_SK | Senkaku Islands | asia | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-jp_sk-boundaries<br>agid-open-jp_sk-gazetteer<br>agid-open-jp_sk-geocoder-fixtures |
| P0-critical | JP_TK | Takeshima / Dokdo | asia | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-jp_tk-boundaries<br>agid-open-jp_tk-gazetteer<br>agid-open-jp_tk-geocoder-fixtures |
| P0-critical | KASH | Kashmir | asia | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-kash-boundaries<br>agid-open-kash-gazetteer<br>agid-open-kash-geocoder-fixtures |
| P0-critical | PMR | Transnistria | europe | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-pmr-boundaries<br>agid-open-pmr-gazetteer<br>agid-open-pmr-geocoder-fixtures |
| P0-critical | SCSD | South China Sea Islands | asia | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-scsd-boundaries<br>agid-open-scsd-gazetteer<br>agid-open-scsd-geocoder-fixtures |
| P0-critical | TRNC | Northern Cyprus | europe | disputed-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-trnc-boundaries<br>agid-open-trnc-gazetteer<br>agid-open-trnc-geocoder-fixtures |
| P0-critical | BAAR | Baarle Enclaves | europe | special-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-baar-boundaries<br>agid-open-baar-gazetteer<br>agid-open-baar-geocoder-fixtures |
| P0-critical | PHIS | Pheasant Island | europe | special-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-phis-boundaries<br>agid-open-phis-gazetteer<br>agid-open-phis-geocoder-fixtures |
| P0-critical | BV | Bouvet Island | antarctica | territory | 1/4 | address, geocoding, admin-boundary | agid-open-bv-boundaries<br>agid-open-bv-geocoder-fixtures<br>agid-open-bv-address-candidates |
| P0-critical | CL-DI | Desventuradas Islands | americas | territory | 1/4 | address, geocoding, admin-boundary | agid-open-cl-di-boundaries<br>agid-open-cl-di-geocoder-fixtures<br>agid-open-cl-di-address-candidates |
| P0-critical | CL-SG | Salas y Gomez Island | americas | territory | 1/4 | address, geocoding, admin-boundary | agid-open-cl-sg-boundaries<br>agid-open-cl-sg-geocoder-fixtures<br>agid-open-cl-sg-address-candidates |
| P0-critical | CP | Clipperton Island | americas | territory | 1/4 | address, geocoding, admin-boundary | agid-open-cp-boundaries<br>agid-open-cp-geocoder-fixtures<br>agid-open-cp-address-candidates |
| P0-critical | XD | Dhekelia | europe | territory | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-xd-boundaries<br>agid-open-xd-gazetteer<br>agid-open-xd-geocoder-fixtures |
| P0-critical | XU | Akrotiri | europe | territory | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-xu-boundaries<br>agid-open-xu-gazetteer<br>agid-open-xu-geocoder-fixtures |

## P1 High: manual fallback with one or fewer local core roles

| Priority | Code | Name | Continent | Kind | Local core roles | Missing roles | First packages |
| --- |--- |--- |--- |--- |--- |--- |--- |
| P1-high | AF | Afghanistan | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | agid-open-af-boundaries<br>agid-open-af-gazetteer<br>agid-open-af-geocoder-fixtures |
| P1-high | AW | Aruba | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-aw-boundaries<br>agid-open-aw-geocoder-fixtures<br>agid-open-aw-address-candidates |
| P1-high | BA | Bosnia and Herzegovina | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-ba-gazetteer<br>agid-open-ba-geocoder-fixtures<br>agid-open-ba-address-candidates |
| P1-high | BG | Bulgaria | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-bg-gazetteer<br>agid-open-bg-geocoder-fixtures<br>agid-open-bg-address-candidates |
| P1-high | BQ | Caribbean Netherlands | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-bq-boundaries<br>agid-open-bq-geocoder-fixtures<br>agid-open-bq-address-candidates |
| P1-high | BY | Belarus | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-by-gazetteer<br>agid-open-by-geocoder-fixtures<br>agid-open-by-address-candidates |
| P1-high | BZ | Belize | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-bz-boundaries<br>agid-open-bz-geocoder-fixtures<br>agid-open-bz-address-candidates |
| P1-high | CW | Curaçao | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-cw-boundaries<br>agid-open-cw-geocoder-fixtures<br>agid-open-cw-address-candidates |
| P1-high | EC | Ecuador | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-ec-boundaries<br>agid-open-ec-geocoder-fixtures<br>agid-open-ec-address-candidates |
| P1-high | GG | Guernsey | europe | country-or-main-region | 1/4 | address, admin-boundary, gazetteer | agid-open-gg-boundaries<br>agid-open-gg-gazetteer<br>agid-open-gg-address-candidates |
| P1-high | GI | Gibraltar | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-gi-gazetteer<br>agid-open-gi-geocoder-fixtures<br>agid-open-gi-address-candidates |
| P1-high | GL | Greenland | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-gl-boundaries<br>agid-open-gl-geocoder-fixtures<br>agid-open-gl-address-candidates |
| P1-high | GS | South Georgia and the South Sandwich Islands | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-gs-boundaries<br>agid-open-gs-geocoder-fixtures<br>agid-open-gs-address-candidates |
| P1-high | HN | Honduras | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-hn-boundaries<br>agid-open-hn-geocoder-fixtures<br>agid-open-hn-address-candidates |
| P1-high | HR | Croatia | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-hr-gazetteer<br>agid-open-hr-geocoder-fixtures<br>agid-open-hr-address-candidates |
| P1-high | IM | Isle of Man | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-im-gazetteer<br>agid-open-im-geocoder-fixtures<br>agid-open-im-address-candidates |
| P1-high | IQ | Iraq | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | agid-open-iq-boundaries<br>agid-open-iq-gazetteer<br>agid-open-iq-geocoder-fixtures |
| P1-high | IT | Italy | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-it-gazetteer<br>agid-open-it-geocoder-fixtures<br>agid-open-it-address-candidates |
| P1-high | JE | Jersey | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-je-gazetteer<br>agid-open-je-geocoder-fixtures<br>agid-open-je-address-candidates |
| P1-high | ME | Montenegro | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-me-gazetteer<br>agid-open-me-geocoder-fixtures<br>agid-open-me-address-candidates |
| P1-high | PA | Panama | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-pa-boundaries<br>agid-open-pa-geocoder-fixtures<br>agid-open-pa-address-candidates |
| P1-high | PT | Azores | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-pt-gazetteer<br>agid-open-pt-geocoder-fixtures<br>agid-open-pt-address-candidates |
| P1-high | PT | Madeira | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-pt-gazetteer<br>agid-open-pt-geocoder-fixtures<br>agid-open-pt-address-candidates |
| P1-high | PT | Portugal | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-pt-gazetteer<br>agid-open-pt-geocoder-fixtures<br>agid-open-pt-address-candidates |
| P1-high | RS | Serbia | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-rs-gazetteer<br>agid-open-rs-geocoder-fixtures<br>agid-open-rs-address-candidates |
| P1-high | SI | Slovenia | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-si-gazetteer<br>agid-open-si-geocoder-fixtures<br>agid-open-si-address-candidates |
| P1-high | SV | El Salvador | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-sv-boundaries<br>agid-open-sv-geocoder-fixtures<br>agid-open-sv-address-candidates |
| P1-high | SX | Sint Maarten | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-sx-boundaries<br>agid-open-sx-geocoder-fixtures<br>agid-open-sx-address-candidates |
| P1-high | TJ | Tajikistan | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | agid-open-tj-boundaries<br>agid-open-tj-gazetteer<br>agid-open-tj-geocoder-fixtures |
| P1-high | TM | Turkmenistan | asia | country-or-main-region | 1/4 | geocoding, admin-boundary, gazetteer | agid-open-tm-boundaries<br>agid-open-tm-gazetteer<br>agid-open-tm-geocoder-fixtures |
| P1-high | VE | Venezuela | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-ve-boundaries<br>agid-open-ve-geocoder-fixtures<br>agid-open-ve-address-candidates |
| P1-high | XK | Kosovo | europe | country-or-main-region | 1/4 | address, geocoding, gazetteer | agid-open-xk-gazetteer<br>agid-open-xk-geocoder-fixtures<br>agid-open-xk-address-candidates |
| P1-high | TF | French Southern and Antarctic Lands | antarctica | territory | 1/4 | address, geocoding, admin-boundary | agid-open-tf-boundaries<br>agid-open-tf-geocoder-fixtures<br>agid-open-tf-address-candidates |

## P2 Medium: partial local core geo coverage or redistribution risk

| Priority | Code | Name | Continent | Kind | Local core roles | Missing roles | First packages |
| --- |--- |--- |--- |--- |--- |--- |--- |
| P2-medium | AD | Andorra | europe | country-or-main-region | 2/4 | address, geocoding | agid-open-ad-geocoder-fixtures<br>agid-open-ad-address-candidates<br>agid-open-ad-license-ledger |
| P2-medium | AE | United Arab Emirates | asia | country-or-main-region | 2/4 | admin-boundary, gazetteer | agid-open-ae-boundaries<br>agid-open-ae-gazetteer<br>agid-open-ae-no-postcode-grid |
| P2-medium | AG | Antigua and Barbuda | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-ag-boundaries<br>agid-open-ag-geocoder-fixtures<br>agid-open-ag-address-candidates |
| P2-medium | AI | Anguilla | americas | country-or-main-region | 2/4 | address, geocoding | agid-open-ai-geocoder-fixtures<br>agid-open-ai-address-candidates<br>agid-open-ai-license-ledger |
| P2-medium | AL | Albania | europe | country-or-main-region | 2/4 | address, geocoding | agid-open-al-geocoder-fixtures<br>agid-open-al-address-candidates<br>agid-open-al-license-ledger |
| P2-medium | AM | Armenia | asia | country-or-main-region | 2/4 | address, geocoding | agid-open-am-geocoder-fixtures<br>agid-open-am-address-candidates<br>agid-open-am-license-ledger |
| P2-medium | AO | Angola | africa | country-or-main-region | 3/4 | geocoding | agid-open-ao-geocoder-fixtures<br>agid-open-ao-license-ledger |
| P2-medium | AR | Argentina | americas | country-or-main-region | 2/4 | address, admin-boundary | agid-open-ar-boundaries<br>agid-open-ar-address-candidates<br>agid-open-ar-license-ledger |
| P2-medium | AT | Austria | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-at-boundaries<br>agid-open-at-gazetteer<br>agid-open-at-geocoder-fixtures |
| P2-medium | AU | Australia | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-au-boundaries<br>agid-open-au-gazetteer<br>agid-open-au-geocoder-fixtures |
| P2-medium | AZ | Azerbaijan | asia | country-or-main-region | 2/4 | address, geocoding | agid-open-az-geocoder-fixtures<br>agid-open-az-address-candidates<br>agid-open-az-license-ledger |
| P2-medium | BB | Barbados | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-bb-boundaries<br>agid-open-bb-geocoder-fixtures<br>agid-open-bb-address-candidates |
| P2-medium | BD | Bangladesh | asia | country-or-main-region | 2/4 | geocoding, gazetteer | agid-open-bd-gazetteer<br>agid-open-bd-geocoder-fixtures<br>agid-open-bd-license-ledger |
| P2-medium | BF | Burkina Faso | africa | country-or-main-region | 3/4 | geocoding | agid-open-bf-geocoder-fixtures<br>agid-open-bf-license-ledger |
| P2-medium | BH | Bahrain | asia | country-or-main-region | 2/4 | geocoding, admin-boundary | agid-open-bh-boundaries<br>agid-open-bh-geocoder-fixtures<br>agid-open-bh-no-postcode-grid |
| P2-medium | BI | Burundi | africa | country-or-main-region | 3/4 | geocoding | agid-open-bi-geocoder-fixtures<br>agid-open-bi-no-postcode-grid<br>agid-open-bi-license-ledger |
| P2-medium | BJ | Benin | africa | country-or-main-region | 3/4 | geocoding | agid-open-bj-geocoder-fixtures<br>agid-open-bj-license-ledger |
| P2-medium | BL | Saint Barthélemy | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-bl-boundaries<br>agid-open-bl-geocoder-fixtures<br>agid-open-bl-address-candidates |
| P2-medium | BO | Bolivia | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-bo-boundaries<br>agid-open-bo-geocoder-fixtures<br>agid-open-bo-address-candidates |
| P2-medium | BR | Brazil | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-br-boundaries<br>agid-open-br-geocoder-fixtures<br>agid-open-br-address-candidates |
| P2-medium | BS | Bahamas | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-bs-boundaries<br>agid-open-bs-geocoder-fixtures<br>agid-open-bs-address-candidates |
| P2-medium | BT | Bhutan | asia | country-or-main-region | 2/4 | geocoding, gazetteer | agid-open-bt-gazetteer<br>agid-open-bt-geocoder-fixtures<br>agid-open-bt-license-ledger |
| P2-medium | BW | Botswana | africa | country-or-main-region | 3/4 | geocoding | agid-open-bw-geocoder-fixtures<br>agid-open-bw-license-ledger |
| P2-medium | CA | Canada | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-ca-boundaries<br>agid-open-ca-geocoder-fixtures<br>agid-open-ca-address-candidates |
| P2-medium | CD | DR Congo | africa | country-or-main-region | 3/4 | geocoding | agid-open-cd-geocoder-fixtures<br>agid-open-cd-no-postcode-grid<br>agid-open-cd-license-ledger |
| P2-medium | CF | Central African Republic | africa | country-or-main-region | 3/4 | geocoding | agid-open-cf-geocoder-fixtures<br>agid-open-cf-no-postcode-grid<br>agid-open-cf-license-ledger |
| P2-medium | CG | Congo | africa | country-or-main-region | 3/4 | geocoding | agid-open-cg-geocoder-fixtures<br>agid-open-cg-no-postcode-grid<br>agid-open-cg-license-ledger |
| P2-medium | CH | Switzerland | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-ch-boundaries<br>agid-open-ch-gazetteer<br>agid-open-ch-geocoder-fixtures |
| P2-medium | CI | Ivory Coast | africa | country-or-main-region | 3/4 | geocoding | agid-open-ci-geocoder-fixtures<br>agid-open-ci-license-ledger |
| P2-medium | CK | Cook Islands | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-ck-boundaries<br>agid-open-ck-gazetteer<br>agid-open-ck-geocoder-fixtures |
| P2-medium | CL | Chile | americas | country-or-main-region | 2/4 | address, geocoding | agid-open-cl-geocoder-fixtures<br>agid-open-cl-address-candidates<br>agid-open-cl-license-ledger |
| P2-medium | CM | Cameroon | africa | country-or-main-region | 3/4 | geocoding | agid-open-cm-geocoder-fixtures<br>agid-open-cm-no-postcode-grid<br>agid-open-cm-license-ledger |
| P2-medium | CO | Colombia | americas | country-or-main-region | 2/4 | address, geocoding | agid-open-co-geocoder-fixtures<br>agid-open-co-address-candidates<br>agid-open-co-license-ledger |
| P2-medium | CR | Costa Rica | americas | country-or-main-region | 2/4 | address, geocoding | agid-open-cr-geocoder-fixtures<br>agid-open-cr-address-candidates<br>agid-open-cr-license-ledger |
| P2-medium | CU | Cuba | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-cu-boundaries<br>agid-open-cu-geocoder-fixtures<br>agid-open-cu-address-candidates |
| P2-medium | CV | Cape Verde | africa | country-or-main-region | 3/4 | geocoding | agid-open-cv-geocoder-fixtures<br>agid-open-cv-license-ledger |
| P2-medium | CY | Cyprus | europe | country-or-main-region | 2/4 | address, geocoding | agid-open-cy-geocoder-fixtures<br>agid-open-cy-address-candidates<br>agid-open-cy-license-ledger |
| P2-medium | CZ | Czech Republic | europe | country-or-main-region | 2/4 | geocoding, gazetteer | agid-open-cz-gazetteer<br>agid-open-cz-geocoder-fixtures<br>agid-open-cz-license-ledger |
| P2-medium | DE | Germany | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-de-boundaries<br>agid-open-de-gazetteer<br>agid-open-de-geocoder-fixtures |
| P2-medium | DJ | Djibouti | africa | country-or-main-region | 3/4 | geocoding | agid-open-dj-geocoder-fixtures<br>agid-open-dj-license-ledger |
| P2-medium | DK | Denmark | europe | country-or-main-region | 3/4 | gazetteer | agid-open-dk-gazetteer<br>agid-open-dk-license-ledger |
| P2-medium | DM | Dominica | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-dm-boundaries<br>agid-open-dm-geocoder-fixtures<br>agid-open-dm-address-candidates |
| P2-medium | DO | Dominican Republic | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-do-boundaries<br>agid-open-do-geocoder-fixtures<br>agid-open-do-address-candidates |
| P2-medium | DZ | Algeria | africa | country-or-main-region | 3/4 | geocoding | agid-open-dz-geocoder-fixtures<br>agid-open-dz-license-ledger |
| P2-medium | EA | Ceuta | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-ea-boundaries<br>agid-open-ea-gazetteer<br>agid-open-ea-geocoder-fixtures |
| P2-medium | EE | Estonia | europe | country-or-main-region | 3/4 | gazetteer | agid-open-ee-gazetteer<br>agid-open-ee-license-ledger |
| P2-medium | EG | Egypt | africa | country-or-main-region | 3/4 | geocoding | agid-open-eg-geocoder-fixtures<br>agid-open-eg-license-ledger |
| P2-medium | ER | Eritrea | africa | country-or-main-region | 3/4 | geocoding | agid-open-er-geocoder-fixtures<br>agid-open-er-license-ledger |
| P2-medium | ES | Spain | europe | country-or-main-region | 2/4 | address, geocoding | agid-open-es-geocoder-fixtures<br>agid-open-es-address-candidates<br>agid-open-es-license-ledger |
| P2-medium | ES | Balearic Islands | europe | country-or-main-region | 2/4 | address, geocoding | agid-open-es-geocoder-fixtures<br>agid-open-es-address-candidates<br>agid-open-es-license-ledger |
| P2-medium | ES | Canary Islands | europe | country-or-main-region | 2/4 | address, geocoding | agid-open-es-geocoder-fixtures<br>agid-open-es-address-candidates<br>agid-open-es-license-ledger |
| P2-medium | ET | Ethiopia | africa | country-or-main-region | 3/4 | geocoding | agid-open-et-geocoder-fixtures<br>agid-open-et-license-ledger |
| P2-medium | FI | Finland | europe | country-or-main-region | 3/4 | geocoding | agid-open-fi-geocoder-fixtures<br>agid-open-fi-license-ledger |
| P2-medium | FJ | Fiji | oceania | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-fj-boundaries<br>agid-open-fj-gazetteer<br>agid-open-fj-geocoder-fixtures |
| P2-medium | FK | Falkland Islands | americas | country-or-main-region | 2/4 | address, geocoding | agid-open-fk-geocoder-fixtures<br>agid-open-fk-address-candidates<br>agid-open-fk-license-ledger |
| P2-medium | FR | France | europe | country-or-main-region | 0/4 | address, geocoding, admin-boundary, gazetteer | agid-open-fr-boundaries<br>agid-open-fr-gazetteer<br>agid-open-fr-geocoder-fixtures |
| P2-medium | GA | Gabon | africa | country-or-main-region | 3/4 | geocoding | agid-open-ga-geocoder-fixtures<br>agid-open-ga-no-postcode-grid<br>agid-open-ga-license-ledger |
| P2-medium | GB | United Kingdom | europe | country-or-main-region | 2/4 | address, geocoding | agid-open-gb-geocoder-fixtures<br>agid-open-gb-address-candidates<br>agid-open-gb-license-ledger |
| P2-medium | GD | Grenada | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-gd-boundaries<br>agid-open-gd-geocoder-fixtures<br>agid-open-gd-address-candidates |
| P2-medium | GE | Georgia | asia | country-or-main-region | 2/4 | address, geocoding | agid-open-ge-geocoder-fixtures<br>agid-open-ge-address-candidates<br>agid-open-ge-license-ledger |
| P2-medium | GF | French Guiana | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-gf-boundaries<br>agid-open-gf-geocoder-fixtures<br>agid-open-gf-address-candidates |
| P2-medium | GH | Ghana | africa | country-or-main-region | 3/4 | geocoding | agid-open-gh-geocoder-fixtures<br>agid-open-gh-license-ledger |
| P2-medium | GM | Gambia | africa | country-or-main-region | 3/4 | geocoding | agid-open-gm-geocoder-fixtures<br>agid-open-gm-license-ledger |
| P2-medium | GN | Guinea | africa | country-or-main-region | 3/4 | geocoding | agid-open-gn-geocoder-fixtures<br>agid-open-gn-license-ledger |
| P2-medium | GP | Guadeloupe | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-gp-boundaries<br>agid-open-gp-geocoder-fixtures<br>agid-open-gp-address-candidates |
| P2-medium | GQ | Equatorial Guinea | africa | country-or-main-region | 3/4 | geocoding | agid-open-gq-geocoder-fixtures<br>agid-open-gq-no-postcode-grid<br>agid-open-gq-license-ledger |
| P2-medium | GR | Greece | europe | country-or-main-region | 2/4 | address, geocoding | agid-open-gr-geocoder-fixtures<br>agid-open-gr-address-candidates<br>agid-open-gr-license-ledger |
| P2-medium | GT | Guatemala | americas | country-or-main-region | 2/4 | address, geocoding | agid-open-gt-geocoder-fixtures<br>agid-open-gt-address-candidates<br>agid-open-gt-license-ledger |
| P2-medium | GW | Guinea-Bissau | africa | country-or-main-region | 3/4 | geocoding | agid-open-gw-geocoder-fixtures<br>agid-open-gw-license-ledger |
| P2-medium | GY | Guyana | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-gy-boundaries<br>agid-open-gy-geocoder-fixtures<br>agid-open-gy-address-candidates |
| P2-medium | HK | Hong Kong | asia | country-or-main-region | 3/4 | gazetteer | agid-open-hk-gazetteer<br>agid-open-hk-no-postcode-grid<br>agid-open-hk-license-ledger |
| P2-medium | HT | Haiti | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-ht-boundaries<br>agid-open-ht-geocoder-fixtures<br>agid-open-ht-address-candidates |
| P2-medium | HU | Hungary | europe | country-or-main-region | 2/4 | address, geocoding | agid-open-hu-geocoder-fixtures<br>agid-open-hu-address-candidates<br>agid-open-hu-license-ledger |
| P2-medium | IL | Israel | asia | country-or-main-region | 3/4 | admin-boundary | agid-open-il-boundaries<br>agid-open-il-license-ledger |
| P2-medium | IN | India | asia | country-or-main-region | 3/4 | gazetteer | agid-open-in-gazetteer<br>agid-open-in-license-ledger |
| P2-medium | IR | Iran | asia | country-or-main-region | 3/4 | geocoding | agid-open-ir-geocoder-fixtures<br>agid-open-ir-license-ledger |
| P2-medium | IS | Iceland | europe | country-or-main-region | 3/4 | geocoding | agid-open-is-geocoder-fixtures<br>agid-open-is-license-ledger |
| P2-medium | JM | Jamaica | americas | country-or-main-region | 1/4 | address, geocoding, admin-boundary | agid-open-jm-boundaries<br>agid-open-jm-geocoder-fixtures<br>agid-open-jm-address-candidates |
| P2-medium | JO | Jordan | asia | country-or-main-region | 2/4 | geocoding, gazetteer | agid-open-jo-gazetteer<br>agid-open-jo-geocoder-fixtures<br>agid-open-jo-license-ledger |
| P2-medium | JP | Japan | asia | country-or-main-region | 3/4 | gazetteer | agid-open-jp-gazetteer<br>agid-open-jp-license-ledger |


P2 table truncated to 80 entries in Markdown. Full list is in `test-results\geo-open-source-gap-strategy.json`.

## Reusable Package Pattern

For each priority country or region, create the smallest useful open-source package:

```text
agid-open-<country>-boundaries
agid-open-<country>-gazetteer
agid-open-<country>-address-candidates
agid-open-<country>-geocoder-fixtures
agid-open-<country>-no-postcode-grid
agid-open-<country>-license-ledger
```

Each package should include `manifest.json`, `sources.json`, `LICENSES.md`, `fixtures/*.json`, `tests/*.json`, and a no-raw-recipient-data policy.
