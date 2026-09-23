# Guatemala Postal Context M2 review

## Technical summary - M2 remains blocked

Guatemala has a current five-digit postal-code system, but the reviewed official materials do not supply a rights-cleared postal Polygon/MultiPolygon artifact. The current Correos page and all 22 linked department PDFs establish 544 unique codes across prefixes `01` through `22`. Their rows mix departments, municipalities, Guatemala City zones and named localities. The tables contain labels and assignments, not boundary geometry, and no compatible processing, derivation, redistribution and public-serving licence was found. GT remains `M1_metadata` / `blocked`.

## Current denominator and M2 definition

The Correos WordPress page is published and records modification at `2025-07-21T21:57:49`. Its 22 department PDFs occupy 35 physical pages and contain 560 code occurrences / 544 unique codes. Header repetition accounts for the duplicate occurrences. The November 2025 UPU sheet confirms five digits and describes department, distribution-route and delivery-office positions, but is neither a complete assignment dataset nor geometry.

The country-specific target is `M2_current_correos_guatemala_postcode_area_visualization`. It requires the complete current typed assignment and exception denominator, explicit area/non-area classification, compatible rights, reproducible fixed artifacts and valid real Polygon/MultiPolygon geometry for every drawable code. Point, route, P.O. Box, organization and other non-area objects must show their type and reason without a fabricated surface.

## Geometry and authority boundary

Correos publishes no postcode geometry in the reviewed bodies. SEGEPLAN describes freely accessible geographic/statistical services but the reviewed landing page gives no dataset-specific AGID reuse grant and no postal authority. The INE populated-place resource is CC Attribution, but it is explicitly a centroid dataset and is not a Correos assignment or Polygon/MultiPolygon release. Administrative areas, zones, localities, centroid buffers, hulls, Voronoi/raster cells, models and AGID cells were not promoted.

No real address, building, parcel, person, customer or land-right record is bundled. Postal Code, geometry authority and Address Context remain separate. ISO `GT` and the source department, municipality, zone and locality identities remain unchanged.

## Fixed-source and PDF verification

Twenty-nine exact source bodies totaling 3,683,865 bytes were retained only in the temporary review directory and fixed by byte count and SHA-256 in `scripts/inspect-postal-context-gt-sources.py`. The fail-closed inspector requires exactly those files, validates the Correos page/API metadata, the 22 department PDF page counts and unique-code counts, the national 544-code/prefix denominator, UPU and legal PDF markers, and the SEGEPLAN/INE role and licence markers. Missing, extra, renamed or changed bodies require a fresh review. It emits aggregate receipts only; raw rows and bodies are not committed.

Both pdfplumber and pypdf reproduced 560 occurrences / 544 unique codes. pypdfium2 rendered representative Guatemala department pages, the UPU coding page and Correos legal title page. A local contact sheet was visually inspected; it shows the mixed zone/municipality/locality tables and contained no rendering defects. No rendered image is committed.

## Running-app visual inspection

The app was started from the isolated worktree at `http://127.0.0.1:3000/`. Browser-plugin setup failed before navigation because the Windows sandbox could not apply deny-read ACLs, so that path is not claimed. The installed Playwright Chromium fallback opened the real app, searched `GT 01001`, and selected `01001, Ciudad de Guatemala, Departamento de Guatemala, Guatemala`.

The running API request `GET /api/v1/postal/GT/01001?geometry=geojson` returned HTTP `503` with `Postal Context pack is unavailable`. The selected place and background map were visible. The only highlighted surface was the ordinary red AGID grid cell; no translucent Correos postal area, clear postal outline, source/date/confidence metadata or unavailable notice appeared. That visual is an explicit gap, not M2 evidence, and the AGID cell was not relabelled or promoted as postal geometry.

## Rights, limitations and next step

- Correos PDF visibility is not a bulk-data or derived-output licence.
- UPU material remains copyright-controlled.
- SEGEPLAN free access is not an identified layer-specific redistribution grant.
- INE centroid points cannot fill the missing postal-area contract.
- No provider contact, registration, authentication, terms acceptance, contract, payment, new repository, public data destination or deployment was attempted.

Keep GT blocked. Re-check no earlier than `2026-09-08T06:21:18.707Z`, after pending countries have been swept, unless Correos or a competent public authority publishes a current complete rights-cleared assignment/area artifact. Any contact, agreement, paid access, new destination or deployment needs explicit approval.
