# Curaçao Postal Context M2 review

## Technical summary - M2 remains blocked because Curaçao does not require postal codes

The Universal Postal Union's September 2025 Universal DataBase lists Curaçao among countries and territories which do not require postal codes. Current Cpost International service pages describe local and international letters, delivery to an address in Curaçao, postal boxes and registered-mail pickup, but publish no postcode field, code assignment or code table. The M2 search key, complete assignment denominator and postal Polygon/MultiPolygon artifact therefore do not exist. CW remains `blocked`; no island, district, locality, address, route, service area, postal box, building, Point, buffer, AGID planning cell, commerce ZIP placeholder, unverified four-digit validator or synthetic CW code was promoted.

## The authoritative denominator is zero postal codes, not an inferred island-wide code

Four exact official bodies totaling 926,717 bytes were fixed outside Git with retrieval time and SHA-256. The current Cpost pages establish address, postal-box and pickup service objects and a 2026 copyright boundary. The UPU May 2015 Curaçao sheet preserves CUW identity and identifies Cpost International N.V. as designated operator. The UPU physical page 4 records Curaçao in the September 2025 no-postcode list. These sources establish current absence, but do not create an island-wide code, a default four-digit code, a postcode assignment row or postal geometry.

The existing CW address-format JSON, YAML and generated Americas hierarchy incorrectly claimed a four-digit format. They now represent `None` with null regex/API and no postal-code rule. This correction removes an unsupported validator; it does not itself satisfy M2.

## Scope, data and M2 definition

The review covers ISO `CW` only and preserves Curaçao separately from Aruba, Sint Maarten, Caribbean Netherlands, the former Netherlands Antilles and the Netherlands. The country-specific target is `M2_current_cpost_curacao_postcode_assignment_and_area_visualization`.

M2 would require a future authoritative, current and complete Cpost International or competent-public release of every code assignment, alias, validity interval, correction, exception and explicit non-area object; compatible processing, storage, derivation, redistribution and public-serving rights; and fixed real Polygon/MultiPolygon geometry for every drawable code. The application would then have to normalize a real code, expose no-match/multiple/failure/invalid-geometry states, fit the map, render translucent fill and a clear outline, clear and re-search, and show geometry class, source, reference date and confidence. Current authoritative absence is represented as `none`; it does not satisfy the Polygon/MultiPolygon milestone.

## Methodology - digest-bound official-body inspection fails closed

The offline inspector accepts only the four expected filenames, byte sizes and SHA-256 values. It validates current Cpost service, postal-box, registered-mail and copyright markers; the UPU Curaçao sheet identity, operator and edition; and the UPU PDF signature, 12-page count, September 2025 edition, no-postcode heading and Curaçao row on physical page 4. Missing, renamed, additional or changed bodies and marker or page drift require a new review. It emits aggregate receipts and zero production records only; raw bodies remain outside Git.

Poppler rendered the one-page Curaçao sheet and the no-postcode-list page to non-empty 1191x1684 RGB PNGs. The local image-view helper returned Windows error 206 even from short paths, so visual display could not be completed; exact bytes, page structure, extracted markers, render dimensions and render SHA-256 values were still verified. No chart or separate Data App was produced because zero postal codes and zero eligible postal geometries are clearer as explicit audit counts than as a visual.

## Application boundary and robustness checks

Shared deterministic tests cover Polygon/MultiPolygon-only drawing, normalization and no-match handling, loading, multiple candidates, API failure, invalid geometry, map fit, translucent fill, visible outline, clear and re-search, and fail-closed Point/non-area handling. They do not prove a real CW API or map path. Because CW has no valid postcode input and no eligible postal area artifact, real CW browser E2E is not claimed.

Existing `data/postal_country_packs/cw` planning cells, locality slots and test vectors remain draft or synthetic. The review adds only metadata, rules, source receipts, address-format correction and tests; it does not convert those files into Cpost evidence.

## Limitations, uncertainty and promotion risks

- The no-postcode statement is time-dependent and requires future re-checking.
- Current Cpost service pages are not a complete postal assignment dataset.
- Public web access and a copyright footer grant no postal dataset licence.
- Absence of codes cannot be filled with a whole-island polygon, locality or district boundary.
- No provider contact, registration, authentication, terms acceptance, contract, payment, protected-data access, new destination, publication or deployment was attempted.
- PDF visual display was blocked by the local image helper; deterministic byte, text, page and render checks passed.

## Recommended next step

Keep CW blocked and continue the pending-country sweep. Re-check no earlier than `2026-09-07T22:53:09.194Z`, or sooner only if Cpost International or UPU announces a Curaçao postal-code system or publishes a rights-cleared fixed assignment and postal-area artifact. Any contact, agreement, paid access, new public destination or deployment needs explicit approval.

## Further questions

- Has Cpost International announced a future postcode or delivery-zone standard after the reviewed bodies?
- If a future code system appears, which authority publishes assignment history, non-area exceptions and geometry?
- What exact licence would permit AGID processing, derivation, redistribution and public serving?
