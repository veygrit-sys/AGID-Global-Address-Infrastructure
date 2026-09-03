# EG Postal Context M2 review — Egypt

## Result

Egypt remains **M1 / blocked**. The postal system is current, but the UPU Universal DataBase Aug. 2026 table simultaneously records five- and seven-digit formats. No complete current Egypt Post assignment/migration denominator, official postal Polygon/MultiPolygon release, or AGID-compatible reuse grant was found.

## Evidence and quality

- [UPU Egypt addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/egyEn.pdf), edition 07/2023, defines seven digits as province (2), locality (1), neighbourhood (2) and community (2).
- [UPU General Addressing Issues](https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf), Universal DataBase Aug. 2026, lists Egypt as requiring postcodes and records both `99999` and `9999999`.
- [Egypt Post GIS guide](https://portal.eta.gov.eg/sites/default/files/2021-12/%D8%AF%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%AE%D8%AF%D9%85%20%D9%84%D9%84%D8%B9%D8%AB%D9%88%D8%B1%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D8%B1%D9%82%D9%85%20%D8%A7%D9%84%D8%A8%D8%B1%D9%8A%D8%AF%D9%8A%20%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF.pdf) documents GPS and structured-address lookup, not reusable national rows or polygons.
- [UPU Egypt Post member page](https://www.upu.int/en/news/rmig/members/egypt-post) confirms the designated operator. The official Egypt Post site was blocked by Cloudflare during this run; no failed or partial body was promoted.

Five exact reference bodies totaling 3,278,046 bytes were checked by byte length and SHA-256, then excluded from Git. PDF text extraction covered the one-page Egypt sheet, seven-page app guide and twelve-page current UPU table. No public official ZIP, XLSX, GeoJSON, bulk API or dataset-specific licence meeting the M2 gate was found.

Points, postal offices, CAPMAS/Survey administrative data, buildings, buffers, hulls, Voronoi cells, OSM, models and AGID cells are never promoted to postal areas. Hugging Face and open source may improve Arabic/Latin parsing evaluation, ranking, topology QA and drift detection, but cannot supply authority, completeness, rights, geometry or exact building identity.

## Application boundary

Without an approved EG descriptor, the real Postal Context API must fail closed and the app must render no postal overlay. A source-qualified address candidate and independent EG AGID may be displayed as context more detailed than a postcode, but neither is a postal polygon or exact building relation.

The app started at `http://127.0.0.1:3041/`. With country filter `eg`, search `12611` selected the ambiguous OSM/Photon candidate `12611 Aj Jiza, Egypt`; reverse context rendered `شارع حسن رمضان, الجيزة, 12611` and independent `EG02KW1BKHN9`. The real seven-digit request `GET /api/v1/postal/EG/3759914?geometry=geojson` returned 503 `Postal Context pack is unavailable`, the UI explicitly displayed `Postal area unavailable`, and no inferred overlay appeared. The dedicated in-app browser failed with a Windows ACL error, so this is not recorded as manual visual inspection. Deterministic Playwright captured two 1440×1100 nonblank images, two map canvases, the source/ambiguity labels, detailed address, independent AGID and fail-closed notice; screenshot bytes and SHA-256 are in the source report but the images are not committed.

## Unblock condition

M2 requires a complete current finite Egypt Post denominator for every five/seven-digit assignment, migration relation, alias, validity, correction, exception and area/non-area type plus exact same-code Polygon/MultiPolygon geometry, pinned by version, time, schema, CRS, bytes and SHA-256 under rights compatible with processing, storage, derivation, redistribution and public serving. The real app must then pass normalization, loading, no-match, multiple, failure, invalid geometry, fit, translucent fill/outline, metadata, clear and re-search verification.

Retry after 2026-12-03T05:17:08.762Z, after the pending-country sweep, or earlier only if a competent authority publishes a compatible release.
