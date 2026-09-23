# Antigua and Barbuda (AG) Postal Context M2 review

Observed at: `2026-08-31T05:49:45.489Z`
Result: **blocked / M2 unmet**

## Technical summary

The UPU August 2026 General Addressing Issues publication lists Antigua and Barbuda in its September 2025 table of countries which do not require postal codes. Current UPU entity and MDSA references identify Antigua and Barbuda Postal Service, General Post Office and organization code `AGA`, but they do not provide a complete operator-authorized identifier/alias/exception/non-area denominator or postal area geometry. The public references are copyright restricted or do not grant resource-specific AGID public-serving rights. M2 therefore remains blocked, and no raw source body, address row or geometry was committed.

## Country-specific M2 definition

AG reaches M2 only when a current complete designated-operator-authorized denominator of all public postal identifiers, aliases, eligibility rules, exceptions and explicit non-area cases is fixed under rights compatible with AGID processing, storage, derivation, redistribution and public serving. The UPU no-required-postcode classification keeps `postalCode` nullable; it is neither an invented code nor M2 data. Every drawable identifier must be reconciled to a fixed real finite closed valid Polygon/MultiPolygon with explicit postal authority, official/derived/virtual class, source, edition, reference date, CRS, topology, method, confidence and exceptions.

If the operator confirms only no-code, office, route, P.O.-box, organization or Point semantics, the API and application must expose that source-grounded non-area reason without manufacturing a surface; under the strict rollout criterion, M2 remains unmet while no eligible postal Polygon/MultiPolygon exists. Island, parish, locality, administrative boundary, office, route, address, building, parcel, Point, buffer, hull, Voronoi/raster cell, AGID planning cell and synthetic fixture proxies are prohibited.

## Evidence and findings

- Seven exact official bodies total 1,674,773 bytes and are byte/SHA-256 bound in the source-review report.
- The UPU August 2026 publication's `Universal DataBase (Sep. 2025)` table includes Antigua and Barbuda among countries which do not require postal codes. The publication itself warns that a country may lack a postcode system or may have one that is not used, so the finding is recorded as optionality rather than proof of absence.
- The UPU entity list at 5 February 2026 names the Ministry of Finance and Corporate Governance and Antigua and Barbuda Postal Service. The MDSA list at 11 June 2026 records General Post Office and organization code `AGA`. Neither publishes postal assignments or geometry.
- The UPU addressing sheet is dated `07/2002`; it shows General Post Office, St. John's without a postcode field. It is a historical format example, not a current complete denominator.
- The official Post Office Act vests postal administration and post-office establishment powers in Cabinet. It is authority context, not a postal code or postal area dataset.
- The UPU copyright page reserves rights and requires written permission for reuse beyond its stated exceptions. No permission was requested or obtained.

## Methodology and scope

The seven source bodies were fetched to a temporary directory outside Git, hashed, and inspected using a deterministic Python inspector. PDF page counts and exact page markers were validated with `pdfplumber`; HTML bodies were checked against exact markers. The inspector emits aggregate receipts only. No source row, transformation, inferred crosswalk or publication artifact was produced.

A quantitative chart was intentionally omitted: this is a one-country authority and rights audit with zero eligible postal geometry, and exact tabular metrics plus the authority distinctions communicate the decision more clearly.

## Why M2 remains blocked

No current complete operator-authorized identifier, alias, eligibility, exception and explicit non-area denominator is available. No fixed official, derived or virtual postal Polygon/MultiPolygon or code-to-area mapping was found. Compatible processing, storage, derivation, redistribution and public-serving rights are not established. Consequently zero records are production-eligible and no approved immutable AG runtime artifact exists.

The pre-existing `data/postal_country_packs/ag` pack remains a synthetic draft: 246 planning cells, 48 synthetic locality identifiers, 12 required boundary slots and zero official municipality records. These figures support planning tests only and were not promoted.

## Application status

Shared contracts for Polygon/MultiPolygon-only validation, country/code normalization, loading, no-match, multiple results, API failure, invalid geometry, fit, translucent fill, visible outline, clear and re-search remain verified. No eligible AG artifact exists, so no real AG loader, API response, map rendering or browser E2E is claimed. A non-area reason may eventually be shown for operator-confirmed no-code/route/office semantics, but it cannot satisfy the required real area visualization.

## Limitations, next steps and questions

Retry no earlier than `2026-09-07T05:49:45.489Z`, after pending countries are traversed. Unblocking requires a current complete operator denominator, resource-specific compatible rights, a fixed valid real postal Polygon/MultiPolygon for each drawable identifier or explicit source-grounded non-area treatment, and an approved immutable artifact driving the real AG API/application path. Provider contact, registration, authentication, terms/contract acceptance, payment, protected-data access, a new publication destination or deployment requires explicit approval.

Open questions are whether the designated operator exposes any public internal identifiers, whether any have authoritative area semantics, and whether a reusable fixed postal-area product exists. Country, island, parish, locality and draft AGID planning geometry must remain separate unless the postal authority explicitly defines the relationship.
