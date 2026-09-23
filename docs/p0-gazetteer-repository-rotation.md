# P0 Gazetteer Repository Rotation

This rotation creates one small source-linked AGID gazetteer repository at a
time for P0 critical geography gaps.

## Rule

One country, territory, disputed region, or special region is prepared per rotation. Each pack must contain a
source ledger, AGID place identifiers, place-name seeds, synthetic conformance
fixtures, and no-raw-address publication gates before it is pushed to GitHub.

| Rank | Code | Name | Repository | Place seeds | Missing core roles |
| --- | --- | --- | --- | ---: | --- |
| 1 | AX | Åland Islands | agid-open-ax-gazetteer | 19 | address, geocoding, admin-boundary, gazetteer |
| 2 | BE | Belgium | agid-open-be-gazetteer | 10 | address, geocoding, admin-boundary, gazetteer |
| 3 | BN | Brunei | agid-open-bn-gazetteer | 5 | address, geocoding, admin-boundary, gazetteer |
| 4 | CN | China | agid-open-cn-gazetteer | 35 | address, geocoding, admin-boundary, gazetteer |
| 5 | FM | Micronesia | agid-open-fm-gazetteer | 5 | address, geocoding, admin-boundary, gazetteer |
| 6 | FO | Faroe Islands | agid-open-fo-gazetteer | 20 | address, geocoding, admin-boundary, gazetteer |
| 7 | ID | Indonesia | agid-open-id-gazetteer | 39 | address, geocoding, admin-boundary, gazetteer |
| 8 | IE | Ireland | agid-open-ie-gazetteer | 32 | address, geocoding, admin-boundary, gazetteer |
| 9 | KH | Cambodia | agid-open-kh-gazetteer | 26 | address, geocoding, admin-boundary, gazetteer |
| 10 | KI | Kiribati | agid-open-ki-gazetteer | 40 | address, geocoding, admin-boundary, gazetteer |
| 11 | KP | North Korea | agid-open-kp-gazetteer | 14 | address, geocoding, admin-boundary, gazetteer |
| 12 | LA | Laos | agid-open-la-gazetteer | 19 | address, geocoding, admin-boundary, gazetteer |
| 13 | LU | Luxembourg | agid-open-lu-gazetteer | 13 | address, geocoding, admin-boundary, gazetteer |
| 14 | MH | Marshall Islands | agid-open-mh-gazetteer | 59 | address, geocoding, admin-boundary, gazetteer |
| 15 | MM | Myanmar | agid-open-mm-gazetteer | 16 | address, geocoding, admin-boundary, gazetteer |
| 16 | MY | Malaysia | agid-open-my-gazetteer | 17 | address, geocoding, admin-boundary, gazetteer |
| 17 | NC | New Caledonia | agid-open-nc-gazetteer | 4 | address, geocoding, admin-boundary, gazetteer |
| 18 | NL | Netherlands | agid-open-nl-gazetteer | 17 | address, geocoding, admin-boundary, gazetteer |
| 19 | NR | Nauru | agid-open-nr-gazetteer | 15 | address, geocoding, admin-boundary, gazetteer |
| 20 | PF | French Polynesia | agid-open-pf-gazetteer | 7 | address, geocoding, admin-boundary, gazetteer |
| 21 | PG | Papua New Guinea | agid-open-pg-gazetteer | 23 | address, geocoding, admin-boundary, gazetteer |
| 22 | PH | Philippines | agid-open-ph-gazetteer | 19 | address, geocoding, admin-boundary, gazetteer |
| 23 | PN | Pitcairn Islands | agid-open-pn-gazetteer | 6 | address, geocoding, admin-boundary, gazetteer |
| 24 | SJ | Svalbard and Jan Mayen | agid-open-sj-svalbard-and-jan-mayen-gazetteer | 5 | address, geocoding, admin-boundary, gazetteer |
| 25 | SJ | Jan Mayen | agid-open-sj-jan-mayen-gazetteer | 3 | address, geocoding, admin-boundary, gazetteer |
| 26 | SJ | Svalbard | agid-open-sj-svalbard-gazetteer | 6 | address, geocoding, admin-boundary, gazetteer |
| 27 | TH | Thailand | agid-open-th-gazetteer | 78 | address, geocoding, admin-boundary, gazetteer |
| 28 | VN | Vietnam | agid-open-vn-gazetteer | 35 | address, geocoding, admin-boundary, gazetteer |
| 29 | WF | Wallis and Futuna | agid-open-wf-gazetteer | 4 | address, geocoding, admin-boundary, gazetteer |
| 30 | BT_T | Bir Tawil | agid-open-bt-t-gazetteer | 5 | geocoding |
| 31 | CRIM | Crimea | agid-open-crim-gazetteer | 5 | address, geocoding, admin-boundary, gazetteer |
| 32 | CYGL | Cyprus Green Line | agid-open-cygl-gazetteer | 6 | address, geocoding, admin-boundary, gazetteer |
| 33 | DONB | Donbas | agid-open-donb-gazetteer | 6 | address, geocoding, admin-boundary, gazetteer |
| 34 | EEBD | Ethiopia-Eritrea Border Area | agid-open-eebd-gazetteer | 6 | geocoding |
| 35 | JP_NT | Northern Territories | agid-open-jp-nt-gazetteer | 5 | address, geocoding, admin-boundary, gazetteer |
| 36 | JP_SK | Senkaku Islands | agid-open-jp-sk-gazetteer | 9 | address, geocoding, admin-boundary, gazetteer |
| 37 | JP_TK | Takeshima / Dokdo | agid-open-jp-tk-gazetteer | 5 | address, geocoding, admin-boundary, gazetteer |
| 38 | KASH | Kashmir | agid-open-kash-gazetteer | 8 | address, geocoding, admin-boundary, gazetteer |
| 39 | PMR | Transnistria | agid-open-pmr-gazetteer | 9 | address, geocoding, admin-boundary, gazetteer |
| 40 | SCSD | South China Sea Islands | agid-open-scsd-gazetteer | 6 | address, geocoding, admin-boundary, gazetteer |
| 41 | TRNC | Northern Cyprus | agid-open-trnc-gazetteer | 8 | address, geocoding, admin-boundary, gazetteer |
| 42 | BAAR | Baarle Enclaves | agid-open-baar-gazetteer | 6 | address, geocoding, admin-boundary, gazetteer |
| 43 | PHIS | Pheasant Island | agid-open-phis-gazetteer | 6 | address, geocoding, admin-boundary, gazetteer |
| 44 | BV | Bouvet Island | agid-open-bv-gazetteer | 7 | address, geocoding, admin-boundary |
| 45 | CL-DI | Desventuradas Islands | agid-open-cl-di-gazetteer | 7 | address, geocoding, admin-boundary |
| 46 | CL-SG | Salas y Gomez Island | agid-open-cl-sg-gazetteer | 6 | address, geocoding, admin-boundary |
| 47 | CP | Clipperton Island | agid-open-cp-gazetteer | 7 | address, geocoding, admin-boundary |
| 48 | XD | Dhekelia | agid-open-xd-gazetteer | 7 | address, geocoding, admin-boundary, gazetteer |
| 49 | XU | Akrotiri | agid-open-xu-gazetteer | 7 | address, geocoding, admin-boundary, gazetteer |
