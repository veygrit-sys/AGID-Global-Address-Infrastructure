# Grenada Postal Context M2 review

## Technical summary - M2 remains blocked because Grenada does not require postal codes

The Universal Postal Union's September 2025 Universal DataBase lists Grenada among countries and territories which do not require postal codes. The UPU Grenada sheet shows village, P.O. Box and municipality addresses without a postcode. Current Grenada Postal Corporation and Government of Grenada pages identify the operator, ten named GPC locations, 52 postal stations and six sub-offices, but publish no postcode field, code assignment or code table. The M2 search key, complete assignment denominator and postal Polygon/MultiPolygon artifact therefore do not exist. GD remains `blocked`; no island, parish, district, locality, address, office, route, service area, postal box, building, Point, buffer, AGID planning cell, airport code, commerce ZIP placeholder, synthetic GD code or code seed was promoted.

## The authoritative denominator is zero postal codes, not an inferred country-wide code

Six exact official bodies totaling 1,195,959 bytes were fixed outside Git with retrieval time and SHA-256. The current GPC home page establishes the operator, exclusive postal role, a postcode-free head-office address, 2025 statistics and a 2026 copyright. The current GPC location page lists ten named office/location objects without postcodes. The current government infrastructure page names GPC and records 52 postal stations and six sub-offices. The UPU May 2004 Grenada sheet contains three postcode-free address examples; its optional `WEST INDIES` wording is not a code. Physical page 4 of the current General Addressing Issues PDF records Grenada in the September 2025 no-postcode list. These sources establish current absence, but do not create a whole-country code, a default ZIP, an assignment row or postal geometry.

The existing GD address-format JSON, YAML and generated Americas hierarchy ambiguously exposed an optional postcode field. They now represent `None` with null regex/API/rule, omit the unsupported field and template token, and cite the current GPC / UPU no-postcode evidence. This correction does not itself satisfy M2.

## Scope, data and M2 definition

The review covers ISO `GD` only and preserves source-described Grenada, Carriacou and Petite Martinique identities without alteration or merger. The country-specific target is `M2_current_grenada_postal_corporation_postcode_assignment_and_area_visualization`.

M2 would require a future authoritative, current and complete GPC or competent-public release of every code assignment, alias, validity interval, correction, exception and explicit non-area object; compatible processing, storage, derivation, redistribution and public-serving rights; and fixed real Polygon/MultiPolygon geometry for every drawable code. The application would then have to normalize a real code, expose no-code/no-match/multiple/failure/invalid-geometry states, fit the map, render translucent fill and a clear outline, clear and re-search, and show geometry class, source, reference date and confidence. Current authoritative absence is represented as `none`; it does not satisfy the Polygon/MultiPolygon milestone.

## Methodology - digest-bound official-body inspection fails closed

The offline inspector accepts only the six expected filenames, byte sizes and SHA-256 values. It validates current GPC operator, head-office, location and copyright markers; current government operator/network markers; the UPU Grenada address examples and edition; the UPU PDF signature, 12-page count, September 2025 edition, no-postcode heading and Grenada row on physical page 4; and UPU copyright/database restrictions. It also rejects an unexpected postcode marker on the GPC, government or GD addressing bodies. Missing, renamed, additional or changed bodies and marker or page drift require a new review. It emits aggregate receipts and zero production records only; raw bodies remain outside Git.

Poppler rendered the one-page Grenada sheet and the no-postcode-list page to non-empty 993x1404 RGB PNGs. The local image-view helper returned Windows error 206 through original and short paths, so interactive visual display could not be completed; exact bytes, page structure, extracted markers, render dimensions and render SHA-256 values were still verified. No chart or separate Data App was produced because zero postal codes and zero eligible postal geometries are clearer as explicit audit counts than as a visual.

## Application boundary and robustness checks

Shared deterministic tests cover Polygon/MultiPolygon-only drawing, normalization and no-match handling, loading, multiple candidates, API failure, invalid geometry, map fit, translucent fill, visible outline, clear and re-search, and fail-closed Point/non-area handling. They do not prove a real GD API or map path. Because GD has no valid postcode input and no eligible postal area artifact, real GD browser E2E is not claimed.

The existing `data/postal_country_packs/gd` pack remains `draft`. Its 48 locality fixtures, 246 planning cells, three test vectors and synthetic code seeds are planning or conformance material. This review adds only metadata, rules, source receipts, address-format correction and tests; it does not convert those files into Grenada Postal Corporation evidence.

## Rights and limitations

- The no-postcode statement is time-dependent and requires future re-checking.
- GPC offices and government network counts are non-area service references, not complete postal assignments.
- GPC pages state all rights reserved; the government page is copyright-marked; neither publishes an open postal dataset licence.
- UPU reference and database material is copyright-controlled; no compatible postal dataset licence was found.
- Absence of codes cannot be filled with a whole-country, island, parish, locality, office, route or synthetic planning-cell polygon.
- No provider contact, registration, authentication, terms acceptance, contract, payment, protected-data access, new destination, publication or deployment was attempted.
- PDF visual display was blocked by the local image helper; deterministic byte, text, page and render checks passed.

## Recommended next step

Keep GD blocked and continue the pending-country sweep. Re-check no earlier than `2026-09-08T02:05:43.142Z`, or sooner only if Grenada Postal Corporation or UPU announces a Grenada postal-code system or publishes a rights-cleared fixed assignment and postal-area artifact. Any contact, agreement, paid access, new public destination or deployment needs explicit approval.
