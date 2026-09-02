# Angola Postal Context M2 review

## Result — postcode data creation excluded; M2 remains blocked

The UPU Universal DataBase Sep. 2025 list, updated 20 August 2026, includes Angola among countries which do not require postal codes. Current Correios de Angola station addresses and the UPU Angola addressing sheet use street/locality or postal-box addressing without a postcode. The Correios `Apartado`/`Caixa Postal` service is a rented secondary address object, not a postcode. AO is therefore excluded from postcode-data creation and remains `blocked`/M2-unmet.

The incorrect four-digit postcode rule in AO address metadata was removed. The current format is `None`, with null regex/API/rule and no postcode order token. This prevents false postcode prompts but does not satisfy M2.

## Evidence, rights and reproducibility

Seven exact official bodies totaling 1,158,228 bytes were fixed outside Git with retrieval time, byte size and SHA-256: two Correios de Angola pages, one INACOM page, two UPU web references and two UPU PDFs. The offline inspector verifies the complete filename set, exact bytes/digests, HTML markers, PDF signatures/page counts and the UPU no-postcode and historical address-format text. Missing, renamed, extra or changed bodies and marker drift fail closed. Raw bodies remain outside Git.

UPU copyright terms restrict reuse and database access. The reviewed operator and regulator pages are reference evidence and grant no compatible AGID postal-dataset processing, derivation, redistribution or public-serving licence. No contact, registration, authentication, terms acceptance, contract, payment, protected-data access, publication or deployment was attempted.

## Geometry and AGID boundary

No postcode assignment exists to anchor a postal Polygon/MultiPolygon. Angola, province, municipality, locality, station, route, service area, postal box, Point, buffer, hull, raster/Voronoi cell, AGID cell and synthetic AO planning geometry were not promoted. The existing draft AO pack contains planning/conformance material only. Postal Code → Polygon → Address Context separation remains intact; civic addresses and buildings require independent rights-cleared identities and relationships.

The country-specific future target is `M2_current_correios_angola_postcode_assignment_and_area_visualization`. It requires an authoritative current postcode denominator, compatible rights, fixed assignments and real postal geometry, and a verified AO API/app path with normalization, all failure states, map fit, translucent fill, clear outline, clear/re-search and visible code/geometry/class/source/date/confidence metadata.

## Application verification

The actual isolated application was started and the real AO postal API was queried without a postal mock. Because no AO descriptor exists, the API failed closed and no AO postal overlay was rendered. The in-app Browser attempt and any deterministic fallback are recorded in the source-review and engineering-check reports; a successful AO postcode-area visual is not claimed.

## Next step

Keep AO blocked until an official postcode system and rights-cleared assignment/geometry artifact are published. Continue the first pending-country sweep with BF (Burkina Faso); re-check AO no earlier than 2 December 2026 unless Correios de Angola, INACOM or the UPU announces a system sooner.
