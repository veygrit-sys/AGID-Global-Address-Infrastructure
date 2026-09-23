# Burundi Postal Context M2 review

## Result — postcode data creation excluded; M2 remains blocked

The UPU Universal DataBase Sep. 2025 list, updated 20 August 2026, includes Burundi among countries which do not require postal codes. The current November 2025 UPU Burundi addressing sheet identifies Régie nationale des postes (RNP) and gives BP, commune and province lines without a postcode. RNP itself describes postal-box and home-delivery service. BI is therefore excluded from postcode-data creation and remains `blocked`/M2-unmet.

The unrelated `poste.bi` four-digit-code claim was not accepted: the current UPU sheet identifies `posteburundi.bi` as RNP's website, and no competent-authority link or authoritative assignment publication for `poste.bi` was established. No claimed codes were ingested. BI address metadata now separates street/place, BP delivery object, commune and province, uses format `None`, null regex/API/rule and no postcode token.

## Evidence, rights and reproducibility

Five exact official bodies totaling 1,060,734 bytes were fixed outside Git with retrieval time, byte size and SHA-256: the RNP page, Burundi Presidency decree page, UPU November 2025 Burundi sheet, UPU general no-postcode list and UPU copyright page. The offline inspector verifies the complete filename set, exact bytes/digests, HTML encodings and markers, PDF signatures/page counts and no-postcode/address-line/rights markers. Missing, renamed, extra or changed bodies and marker drift fail closed. Raw bodies remain outside Git.

UPU copyright terms restrict reuse and database access. The reviewed RNP and Presidency pages are reference evidence and grant no compatible AGID postal-dataset processing, derivation, redistribution or public-serving licence. No contact, registration, authentication, terms acceptance, contract, payment, protected-data access, publication or deployment was attempted.

## Geometry and AGID boundary

No postcode assignment exists to anchor a postal Polygon/MultiPolygon. Burundi, province, commune, locality, office, route, service area, postal box, Point, buffer, hull, raster/Voronoi cell, AGID cell and synthetic BI planning geometry were not promoted. The draft BI pack's 218 planning cells remain synthetic conformance material.

Postal Code → Polygon → Address Context separation remains intact. The actual app can show a Bujumbura result with a BI AGID identity and detailed civic context, but that ID is not a postal ID. Civic addresses and buildings require independent rights-cleared identities and explicit relations.

## Application verification

The isolated application was started. Search for `Bujumbura, Burundi` produced the live result AGID `BI0371Z5KS11`, the University of Burundi/Avenue Siguvyaye/Kiriri/Bujumbura/Bujumbura Mairie context and map movement. The real BI postal API returned `404 Postal Context country is not supported`; the nearest-postcode path also returned 404. Two map canvases rendered, with no framework overlay, postal geometry metadata, translucent postal fill or outline.

The in-app Browser failed before navigation at the Windows sandbox ACL helper. The deterministic Playwright fallback used the real app and live app proxy path without mocking the BI postal API. Local image viewing failed with Windows error 206, so no manual visual claim is made.

## Next step

Keep BI blocked until RNP or another competent authority publishes a current postcode system, complete immutable assignments and real postal geometry under compatible rights. Continue the pending-country sweep with BJ (Benin); re-check BI no earlier than 2 December 2026 unless RNP, the Burundi Government or UPU announces a system sooner.
