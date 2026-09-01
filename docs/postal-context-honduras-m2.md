# Honduras Postal Context M2 review

## Technical summary - M2 remains blocked

Honduras has a current five-digit numeric postcode system. The August 2026 UPU General Addressing Issues tables establish that postcodes are required, length five and format `99999`; the country-specific UPU sheet is edition `05/2004` and documents a legacy six-character `AANNNN` scheme. The legacy sheet is retained without rewriting it as current data. No complete current competent-authority assignment release, reusable postal geometry or compatible rights were located, so HN advances from `M0_inventory` to a digest-bound `M1_metadata` contract and remains `blocked`.

## Current denominator and M2 definition

The current public UPU tables are `Aug. 2026` and list Honduras among countries requiring postcodes, with length `5` and numeric format `99999`. The older one-page Honduras sheet says “6 alphanumeric characters” and shows `CM1102`; its explicit `05/2004` edition prevents silent promotion into the current scheme.

The country-specific target is `M2_current_honducor_honduras_five_digit_postcode_area_visualization`. It requires a complete current typed five-digit assignment and exception denominator, compatible processing/derivation/redistribution/public-serving rights, reproducible fixed artifacts and valid real Polygon/MultiPolygon geometry for every drawable code.

## Official operator, geospatial discovery and rights

Current HONDUCOR pages and the February 2024 commercial manual version 1.1 establish operator and service context. The reviewed EMS page instructs senders to supply a postal code, while the current FAQ and agency map expose services and locations rather than a postcode assignment directory or postal boundary. The HONDUCOR site search returned eleven broad “codigo postal” results, two unrelated “licencia” results and no “privacidad” or “terminos” result that grants compatible data rights.

The fixed SINIT catalogue contains 1,034 layers and zero matches for postal, correo or HONDUCOR in the institution/name/theme fields. Department, municipality, barrio, colonia, settlement, lot, block, parcel and agency layers or points remain contextual. The public catalogue offers a contact/request flow rather than a postcode crosswalk or dataset-specific postal reuse licence.

The UPU POST*CODE 2026.1 package has nine documents and requires contract, NDA, data-use declaration and annual fees, with transfer restrictions; nothing was accepted or purchased. It is not a postal polygon product. Public page access is not treated as permission for AGID storage, derivation, redistribution or public serving.

## Fixed-source and PDF verification

Twenty-three exact official bodies totalling 10,917,737 bytes are fixed by byte count and SHA-256 in `scripts/inspect-postal-context-hn-sources.py`. The fail-closed inspector validates the current UPU pages and markers, the legacy sheet, HONDUCOR manual and post metadata, operator searches, the 1,034-record SINIT catalogue with zero postal matches, and the nine-file UPU licence bundle. It emits aggregate receipts only; raw pages, PDFs, catalogue rows and extracted text remain temporary and outside Git.

The legacy Honduras page and the three relevant current general-table pages were text-extracted and locally rendered. All four renders were displayed and visually inspected: the legacy page showed the `05/2004` six-character scheme, while current pages showed Honduras in the required-country list, length five and `99999 N`.

## Running-app visual inspection

The isolated app ran at `http://127.0.0.1:3012/`. The in-app Browser setup failed before navigation because Windows deny-read ACL setup failed. Playwright Chromium opened the real app, entered `HN 11101`, returned eleven results including two Honduras `11101` candidates, selected a Honduras candidate and moved the background map to Tegucigalpa. The fixed screenshot (346,828 bytes; SHA-256 `1871926568cb1bbf3e14d0fcb5f893bd71086f9cc5936a273cd7dce6fb6362f9`) was displayed and visually inspected.

No HN Postal Context request, translucent postal fill, clear postal outline, geometry class, postal source/date/confidence or unavailable notice appeared. Direct `GET /api/v1/postal/HN/11101?geometry=geojson` returned HTTP `404` with `Postal Context country is not supported`. The ordinary background map, AGID grid and selected place are explicit non-postal context and were not promoted.

## Required next step

Keep HN blocked. Re-check no earlier than `2026-12-01T07:52:20.335Z`, after pending countries have been swept, unless HONDUCOR or another competent authority publishes a current complete rights-cleared typed assignment and postal-area artifact. Provider contact, registration, authentication, terms acceptance, contract, payment, protected-data access, new destination, publication or deployment needs explicit approval.
