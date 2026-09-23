# Serbia Postal Context M2 evidence report

## Decision

Serbia (`RS`) remains **blocked / M2 unmet** as observed at `2026-08-30T23:01:37.379Z` on cumulative base `c927ca7bec3f358739059f9b13103c4e38777884`.

The audit corrected an important premise: Pošta Srbije does advertise official PAK polygons. The blocker is not absence of PAK geometry. It is the absence of an acquired fixed release, compatible AGID reuse/public-serving rights, a complete current five-digit postcode denominator, and a validated reconciliation from postcode to PAK area or explicit non-area.

M2 is now country-specific: `M2_current_serbia_postcode_assignment_and_pak_area_visualization`.

## M2 gate

| Gate | Evidence | Result |
|---|---|---|
| Current postcode and PAK semantics | Pošta defines postcode as five digits and PAK as six digits for part of a street | Pass as semantic reference |
| Complete current five-digit assignment/exception denominator | Official FAQ says the electronic postcode database cannot be downloaded; the exact ENP PDF is only an ENP sales-point subset | Blocked |
| Real official areal geometry | Pošta says over 113,000 PAKs are georeferenced nationwide and a PAK polygon contains buildings belonging to part of one street | Existence established |
| Fixed geometry artifact | No exact PAK delivery, bytes, edition, schema, CRS or feature digest was acquired | Blocked |
| Reuse/public-serving rights | GIS price list is 90 RSD per data unit before VAT; viewer access and price publication are not a licence or purchase | Blocked |
| Five-digit area reconciliation | Zero postcode assignments reconciled to a PAK-derived area or explicit non-area | Blocked |
| Real application path | No eligible RS runtime artifact, API result, map fit/render or browser E2E exists | Blocked |

A chart was deliberately omitted: the exact gate table is more accurate for binary authority and rights decisions.

## Official operator findings

The current [postal dictionary](https://www.posta.rs/lat/korisnicki-servis/postanski-recnik.aspx) says a postcode consists of five digits and the same postcode cannot identify two or more post offices. The current [PAK definition](https://www.posta.rs/lat/stanovnistvo/usluga.aspx?usluga=postanske-usluge/postanski-adresni-kod-pak) says PAK is six digits and identifies part of a street more precisely than postcode. The [PAK lookup](https://www.posta.rs/lat/alati/pronadjite-pak.aspx) supports address-to-PAK and PAK-to-address modes.

The [official FAQ](https://posta.rs/lat/korisnicki-servis/najcesca-pitanja.aspx) directs users to Find a post office/map and explicitly says there is no electronic postcode database download. The exact PDF at `spisak-postatag-eng.pdf` is titled “LIST OF SALES POINTS FOR ENP IN POST OF SERBIA,” not a complete post-office/postcode distribution. It has 24 pages, 689 five-digit occurrences, 686 distinct tokens and three distinct duplicates. It is not promoted as the national denominator.

The WSP [registration documentation](https://www.posta.rs/wsp-help/uvod/registracija-korisnika.aspx) limits access to registered users. The [address-verification transaction](https://www.posta.rs/wsp-help/transakcije/provera-adrese.aspx) returns a postcode and calculated PAK, but documentation does not authorize a bulk assignment or polygon artifact. No registration, authentication or protected query occurred.

## Official PAK polygons and commercial control

Pošta's [GIS service](https://www.posta.rs/lat/privreda/usluga.aspx?usluga=e-usluge/geografski-informacioni-sistem-gis/usluge-geografskog-informacionog-sistema-poste) says PAK spatial positions were georeferenced throughout Serbia, a PAK polygon contains buildings belonging to part of one street, and over 113,000 PAKs are georeferenced. The [GIS portal description](https://www.posta.rs/lat/privreda/usluga.aspx?usluga=e-usluge/geografski-informacioni-sistem-gis/usluge-geografskog-informacionog-sistema-poste&strana=gis-portal) explicitly includes PAK polygon display and search.

The exact [GIS price PDF](https://www.posta.rs/DocumentViewer.aspx?IdDokument=1000044) is one page, authored in 2022, and prices PAK spatial-position data at `90,00` RSD per data unit before VAT, with 5/10/15 percent quantity discounts. The public pages did not provide an explicit AGID-compatible grant for processing, derivation, storage, redistribution and public serving. No purchase or terms acceptance occurred.

Therefore, PAK polygon existence is official, but the production artifact count remains zero. A public viewer, screenshot, service page or price list is not a fixed reusable dataset.

## RGZ address separation

The [RGZ Address Register](https://data.gov.rs/sr/datasets/adresni-registar/) is a national open registry advertising weekly street and house-number CSV/GPKG. Its listed fields cover street name/identifier/type, house number, unique address code, municipality, settlement, cadastral municipality and parcel/object references. It does not advertise postcode or PAK fields.

The [Serbian Open Data License](https://data.gov.rs/sr/terms/) supports reuse with source, download URL/date and transformation attribution. Those rights apply to declared RGZ address resources, not Pošta postcode/PAK assignments or Pošta PAK polygons. A direct RGZ download HEAD attempt timed out; this is availability evidence only and not an absence claim.

No RGZ point or street, office/sales point, municipality, settlement, cadastral/building/parcel object, buffer, hull, Voronoi/raster cell or synthetic fixture was promoted.

## Exact evidence and PDF review

Fifteen exact official bodies total `1,411,809` bytes and are byte/SHA-256 bound in `reports/postal-context-m2/rs-source-review-2026-08-30.json`. Raw HTML, PDFs, rendered pages, address rows and geometry are not committed.

The ENP PDF and GIS price PDF had valid PDF signatures. `pdfplumber` checked metadata/text layers; Poppler rendered ENP pages 1, 12 and 24 plus the price page. Local image display failed with Windows error 206, so image-viewer inspection is not claimed.

## Application status

Existing shared tests exercise Polygon/MultiPolygon-only rendering, bounds fitting, translucent fill, visible outline, clearing/re-searching, point non-area behavior, loading, no-match, multiple-candidate, API-failure and invalid-geometry states, and provenance fields.

No real eligible RS artifact exists. Consequently the following remain false:

- real RS runtime loaded;
- real RS postal API result validated;
- real RS postcode area fitted and rendered;
- real RS browser E2E completed.

The app must ultimately show the selected five-digit postcode, geometry kind, official/derived/virtual classification, source, reference date and confidence. PAK remains a separate six-digit identity, and a five-digit area derived from PAK must be reproducibly reconciled and labelled `derived`.

## Unblock and retry

Unblock requires all of the following:

1. An exact current complete five-digit postcode assignment/exception denominator with explicit compatible AGID rights.
2. A fixed Pošta PAK Polygon/MultiPolygon delivery with provider, edition, date, terms, attribution, bytes, SHA-256, schema, CRS, transform, coverage and exclusions pinned.
3. Full topology validation and five-digit assignment-to-area/explicit-non-area reconciliation, without proxies or identity merging.
4. An approved immutable artifact and real RS loader/API/normalization/map-fit/translucent-render/provenance/clear/re-search verification.

Retry is not before `2026-09-06T23:01:37.379Z` and only after pending countries. Do not contact a provider, register, authenticate, accept terms, purchase data, submit protected queries, create a publication destination, publish or deploy without explicit approval.
