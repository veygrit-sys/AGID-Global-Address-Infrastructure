# Costa Rica Postal Context M2 review

## Outcome

Costa Rica (CR) remains blocked and does not reach M2. The current official operator service and official UGED geometry are individually accessible and largely code-compatible, but they do not yet form a rights-cleared, one-to-one or explicitly dated alias-aware postal-area release.

No production geometry, raw operator response, address, building, parcel, recipient, customer, organization, land-right or internal delivery-point row is committed. Postal assignment, source-specific geostatistical geometry and address/building authority remain separate.

## Current official evidence

Observed on 31 August 2026.

1. [Correos de Costa Rica's current postcode page](https://sucursal.correos.go.cr/web/codigoPostal) publishes province, canton and district selectors backed by public session/CSRF-protected JSON endpoints. One nationwide read-only observation produced seven provinces, 84 cantons, 493 enabled district rows and 493 unique five-digit codes. The 168,303-byte raw observation has SHA-256 `942b9b9ef78b363760255a45985072035501297ac895c1a0ce2a11d1b50704ab` and remains outside Git.
2. [INEC UGED 2024](https://admin.inec.cr/mapas-cartografia/unidad-geoestadistica-distrital-2024) links the exact 15,046,211-byte archive with SHA-256 `4fe036a4a4eec834810065ba66248e67566b81afb527991a2df0ef3cdb833238`. It contains 492 unique `COD_UGED` Polygon features in CR-SIRGAS epoch 2014.59 / CRTM05 (EPSG:8908), with zero empty and zero OGC-invalid geometry.
3. The code sets match on 492 codes. Correos alone still returns enabled `60702` for Puerto Jiménez under Golfito, while it also returns enabled `61301` for Puerto Jiménez and UGED contains only `61301`. The service supplies no validity or supersession fields that authorize treating the old and new rows as simultaneous aliases, historical rows or one current replacement.
4. INEC explains that UGED follows identifiable physical, infrastructure or cultural features and avoids some imaginary DTA limits. The polygons are official source-specific geostatistical reference geometry, not Correos-issued postal boundaries or automatic legal DTA geometry.

## Rights review

Correos states transparency and free access to information, but the reviewed service terms contain no explicit grant for nationwide assignment extraction, storage, derivation, redistribution or public API/map serving. The observation is therefore fixed only as off-repository audit evidence.

The public INEC site displays a CC BY-SA 4.0 footer. The archive's own ISO metadata, however, marks access and use constraints as Copyright, requires attribution to origin and ownership, and leaves `useLimitation` empty. Resource-level applicability of CC BY-SA 4.0 to the ZIP, transformed coordinates and publicly served derivative artifacts is not explicit enough for this M2 gate. SNIT remains excluded because its general conditions do not permit the required commercial direct or derived use.

## Country-specific M2 definition

CR M2 requires a complete pinned current Correos assignment observation and an exact current INEC or IGN district Polygon/MultiPolygon release with a one-to-one join, or an authoritative explicitly dated and typed alias join, for every drawable code. Compatible resource-level processing, derivation, redistribution and public-serving rights, exact source bodies, editions, dates, CRS, digests, topology, exceptions and a reproducible no-fabrication transform must be fixed.

The real API and application must normalize a code, return real eligible geometry with official/derived/virtual class, source, reference date and confidence, fit the map, show a translucent fill and clear outline over the background map, clear and re-search it, and expose loading, no-match, multiple, API-failure and invalid-geometry states. Point, route, P.O. box, organization, address, building, parcel, person, customer, internal delivery point, buffer, hull, cell, model, synthetic fixture and AGID proxy remain surface-free.

## Application status

The existing shared application and synthetic CR fixture continue to verify five-digit normalization, country routing, Polygon/MultiPolygon-only display, fit, translucent paint, visible outline, clear, re-search and non-area fail-closed behavior. They do not count as real CR data completion.

No eligible immutable CR descriptor was built, so no real CR postcode search reached the API-to-map path and no browser E2E is claimed. Running a browser against the synthetic fixture would demonstrate only shared capability and would not resolve assignment history or rights.

## Unblock conditions and retry

M2 remains unmet until all of the following are satisfied:

- written Correos terms permit nationwide AGID processing, storage, derivation, redistribution and public serving;
- an authoritative source resolves `60702` and `61301` with validity, alias or supersession dates and a non-guessed Puerto Jiménez geometry mapping;
- INEC confirms compatible resource-level reuse and derivative/public-serving terms for UGED, with attribution/share-alike duties implemented;
- a fixed-receipt transform preserves UGED's geostatistical classification and passes CRS, topology, digest, exception and privacy checks;
- the real CR API and application pass normalization, unique/multiple/no-match/error/invalid-geometry, metadata, fit, render, clear and re-search verification.

Public sources should not be rechecked before 7 September 2026 while pending countries remain. Provider contact, registration, authentication, agreement acceptance, payment, protected-data access, new publication destination or deployment requires explicit approval.
