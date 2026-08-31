# Dominica Postal Context M2 review

## Technical summary - M2 remains blocked because Dominica does not require postal codes

The Universal Postal Union's September 2025 Universal DataBase lists Dominica among countries and territories which do not require postal codes. The UPU Dominica sheet shows a Roseau address without a postcode. Current Dominica government and UPU operator references identify the General Post Office, branch offices, parcel service and the Dominica Postal Service, but publish no postcode field, code assignment or code table. The M2 search key, complete assignment denominator and postal Polygon/MultiPolygon artifact therefore do not exist. DM remains `blocked`; no island, parish, district, locality, address, office, route, service area, postal box, building, Point, buffer, AGID planning cell, commerce ZIP placeholder, Dominican Republic code, synthetic DM code or code seed was promoted.

## The authoritative denominator is zero postal codes, not an inferred island-wide code

Six exact official bodies totaling 1,455,690 bytes were fixed outside Git with retrieval time and SHA-256. The current government directory establishes live General Post Office, branch-office and Parcel Post objects. The July 2025 UPU forum identifies the Postmaster General and Dominica Postal Service. The UPU July 2002 Dominica addressing sheet contains no postcode in its Roseau example, and physical page 4 of the current General Addressing Issues PDF records Dominica in the September 2025 no-postcode list. These sources establish current absence, but do not create an island-wide code, a default ZIP, a postcode assignment row or postal geometry.

The existing DM address-format JSON, YAML and generated Americas hierarchy ambiguously exposed an optional postcode field. They now represent `None` with null regex/API/rule, omit the unsupported field and template token, and cite the current Dominica Postal Service / UPU no-postcode evidence. This correction does not itself satisfy M2.

## Scope, data and M2 definition

The review covers ISO `DM`, the Commonwealth of Dominica, only. It is not the Dominican Republic (`DO`); no five-digit DO assignment, example or geometry may cross that identity boundary. The country-specific target is `M2_current_dominica_postal_service_postcode_assignment_and_area_visualization`.

M2 would require a future authoritative, current and complete Dominica Postal Service or competent-public release of every code assignment, alias, validity interval, correction, exception and explicit non-area object; compatible processing, storage, derivation, redistribution and public-serving rights; and fixed real Polygon/MultiPolygon geometry for every drawable code. The application would then have to normalize a real code, expose no-code/no-match/multiple/failure/invalid-geometry states, fit the map, render translucent fill and a clear outline, clear and re-search, and show geometry class, source, reference date and confidence. Current authoritative absence is represented as `none`; it does not satisfy the Polygon/MultiPolygon milestone.

## Methodology - digest-bound official-body inspection fails closed

The offline inspector accepts only the six expected filenames, byte sizes and SHA-256 values. It validates government office/service and copyright markers; the UPU Dominica address example, edition and General Post Office marker; the UPU PDF signature, 12-page count, September 2025 edition, no-postcode heading and Dominica row on physical page 4; the current Dominica Postal Service reference; and UPU copyright/database restrictions. Missing, renamed, additional or changed bodies and marker or page drift require a new review. It emits aggregate receipts and zero production records only; raw bodies remain outside Git.

Poppler rendered the one-page Dominica sheet and the no-postcode-list page to non-empty 992x1404 and 993x1404 RGB PNGs. The local image-view helper returned Windows error 206 through original and short paths, so interactive visual display could not be completed; exact bytes, page structure, extracted markers, render dimensions and render SHA-256 values were still verified. No chart or separate Data App was produced because zero postal codes and zero eligible postal geometries are clearer as explicit audit counts than as a visual.

## Application boundary and robustness checks

Shared deterministic tests cover Polygon/MultiPolygon-only drawing, normalization and no-match handling, loading, multiple candidates, API failure, invalid geometry, map fit, translucent fill, visible outline, clear and re-search, and fail-closed Point/non-area handling. They do not prove a real DM API or map path. Because DM has no valid postcode input and no eligible postal area artifact, real DM browser E2E is not claimed.

The existing `data/postal_country_packs/dm` pack remains `draft`. Its 48 locality fixtures, 246 planning cells, three test vectors, AGID values and synthetic code seeds are planning or conformance material. This review adds only metadata, rules, source receipts, address-format correction and tests; it does not convert those files into Dominica Postal Service evidence.

## Rights and limitations

- The no-postcode statement is time-dependent and requires future re-checking.
- The current government directory and UPU forum are service/operator references, not complete postal assignment datasets.
- The Dominica government site allows only unaltered personal non-commercial copying and prohibits transmission or distribution without prior written permission.
- UPU reference and database material is copyright-controlled; no compatible postal dataset licence was found.
- Absence of codes cannot be filled with a whole-island, parish, locality, office, route or synthetic planning-cell polygon.
- No provider contact, registration, authentication, terms acceptance, contract, payment, protected-data access, new destination, publication or deployment was attempted.
- PDF visual display was blocked by the local image helper; deterministic byte, text, page and render checks passed.

## Recommended next step

Keep DM blocked and continue the pending-country sweep. Re-check no earlier than `2026-09-07T23:25:39.859Z`, or sooner only if the Dominica Postal Service or UPU announces a Dominica postal-code system or publishes a rights-cleared fixed assignment and postal-area artifact. Any contact, agreement, paid access, new public destination or deployment needs explicit approval.

## Further questions

- Has the Dominica Postal Service announced a postcode or delivery-zone standard after the reviewed bodies?
- If a future code system appears, which authority publishes assignment history, non-area exceptions and geometry?
- What exact licence would permit AGID processing, derivation, redistribution and public serving?
