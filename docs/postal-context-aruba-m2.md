# Aruba Postal Context M2 review

## Technical summary - M2 remains blocked because Aruba has no postal codes

Post Aruba's current help page states that Aruba does not have a postal code. The Universal Postal Union's September 2025 Universal DataBase likewise lists Aruba among countries and territories which do not require postal codes. The M2 search key, complete assignment denominator and postal Polygon/MultiPolygon artifact therefore do not exist. AW remains `blocked`; no district, locality, address, route, service area, parcel, building, Point, buffer, AGID planning cell, commerce ZIP placeholder or synthetic AW code was promoted.

## The authoritative denominator is zero postal codes, not an inferred island-wide code

Four exact official bodies totaling 839,174 bytes were fixed outside Git with retrieval time and SHA-256. The Post Aruba FAQ supplies the direct no-postcode statement; the operator history identifies the autonomous service and Post Aruba N.V.; the site footer asserts 2026 copyright; and the UPU physical page 4 records Aruba in the September 2025 no-postcode list. These sources establish current absence, but do not create an island-wide code, a default code, a postcode assignment row or postal geometry.

The result matters at the API boundary: a required ZIP field in an international commerce form is only an application constraint. P.O. Boxes, street delivery, courier routes and service areas remain typed postal or logistics objects, not Polygon/MultiPolygon postcode areas.

## Scope, data and M2 definition

The review covers ISO `AW` only and preserves Aruba separately from Curaçao, Sint Maarten, Caribbean Netherlands, the former Netherlands Antilles and the Netherlands. The country-specific target is `M2_current_post_aruba_postcode_assignment_and_area_visualization`.

M2 would require a future authoritative, current and complete Post Aruba or competent-public release of every code assignment, alias, validity interval, correction, exception and explicit non-area object; compatible processing, storage, derivation, redistribution and public-serving rights; and fixed real Polygon/MultiPolygon geometry for every drawable code. The application would then have to normalize a real code, expose no-match/multiple/failure/invalid-geometry states, fit the map, render translucent fill and a clear outline, clear and re-search, and show geometry class, source, reference date and confidence. Current authoritative absence is represented as `none`; it does not satisfy the Polygon/MultiPolygon milestone.

## Methodology - digest-bound official-body inspection fails closed

The offline inspector accepts only the four expected filenames, byte sizes and SHA-256 values. It validates Post Aruba no-postcode, institutional and copyright markers and the UPU PDF signature, 12-page count, September 2025 edition, no-postcode heading and Aruba row on physical page 4. Missing, renamed, additional or changed bodies and marker or page drift require a new review. It emits aggregate receipts and zero production records only; raw bodies remain outside Git.

The UPU page was rendered with Poppler to a non-empty 1158x1638 RGB PNG. The local image-view helper returned Windows error 206 even from a short path, so visual display could not be completed; exact bytes, page structure, extracted markers, render dimensions and render SHA-256 were still verified. No HTML report or chart was produced because zero postal codes and zero eligible postal geometries are clearer as explicit audit counts than as a visual.

## Application boundary and robustness checks

Shared deterministic tests cover Polygon/MultiPolygon-only drawing, normalization and no-match handling, loading, multiple candidates, API failure, invalid geometry, map fit, translucent fill, visible outline, clear and re-search, and fail-closed Point/non-area handling. They do not prove a real AW API or map path. Because AW has no valid postcode input and no eligible postal area artifact, real AW browser E2E is not claimed.

Existing `data/postal_country_packs/aw` planning cells, locality slots and test vectors remain draft or synthetic. The review adds only metadata, rules, source receipts and tests; it does not convert those files into Post Aruba evidence.

## Limitations, uncertainty and promotion risks

- The no-postcode statements are time-dependent and require future re-checking.
- Public web access and a copyright footer grant no postal dataset licence.
- Absence of codes cannot be filled with a whole-island polygon, locality or district boundary.
- No provider contact, registration, authentication, terms acceptance, contract, payment, protected-data access, new destination, publication or deployment was attempted.
- PDF visual display was blocked by the local image helper; deterministic byte, text, page and render checks passed.

## Recommended next step

Keep AW blocked and continue the pending-country sweep. Re-check no earlier than `2026-09-07T08:45:47.702Z`, or sooner only if Post Aruba or UPU announces an Aruba postal-code system or publishes a rights-cleared fixed assignment and postal-area artifact. Any contact, agreement, paid access, new public destination or deployment needs explicit approval.

## Further questions

- Has Post Aruba announced a future postcode or delivery-zone standard after the reviewed bodies?
- If a future code system appears, which authority publishes assignment history, non-area exceptions and geometry?
- What exact licence would permit AGID processing, derivation, redistribution and public serving?
