# Bermuda Postal Context M2 review

## Technical summary - an official postcode workbook exists, but it is stale, unlicensed and has no geometry

The Bermuda Post Office (BPO) publishes an official attachment named `Bermuda Postal Codes and Parishes`. The workbook provides street, optional building-number range, Odd/Even/All qualifier, postcode and parish columns. The current April 2026 UPU addressing sheet confirms `AA NN` for home delivery and `AA AA` for P.O. Box delivery. This is stronger evidence than a format-only inventory, but it does not complete M2. The workbook was internally last saved on 28 March 2019, has no operator edition, validity or completeness declaration, includes unresolved data-quality anomalies, carries no separate open licence and contains no geometry. BM remains `blocked`.

## Scope, data and the Bermuda M2 definition

The review covers ISO `BM` and preserves BPO assignment, P.O. Box or special object, street, parish, building, tile, administrative geometry and AGID identity as separate authorities. The country target is `M2_current_bpo_assignments_and_postal_area_visualization`.

M2 requires a current complete finite BPO denominator of every home-delivery `AA NN` assignment, P.O. Box or special `AA AA` object, street/building range and qualifier, alias, validity interval, correction, exception and explicit non-area type. It must be fixed by operator edition, bytes and SHA-256 under rights compatible with processing, storage, derivation, redistribution and public serving. Every drawable code must map to a fixed real valid Polygon/MultiPolygon with explicit official/derived/virtual class, source, edition, reference date, CRS, topology, method, confidence and exceptions. Streets, parishes, buildings, tile imagery, Points, buffers, hulls, Voronoi/raster cells, models and AGID cells are not postcode polygons.

The approved immutable artifact must drive the real BM API and app: normalize both code forms; expose loading, no-match, multiple, API-failure and invalid-geometry states; fit and render a translucent fill with a clear outline; support clear and re-search; and show code, geometry kind, class, source, reference date and confidence. Non-area P.O. Box, special, route, organization and Point objects must show type and reason without a fabricated surface.

## Official workbook quality - useful candidate evidence, not a current denominator

The public download is a 262,144-byte encrypted XLS with SHA-256 `6dc5a5bdc691ec74c8e87c3505ac0c7cd875041ee9d5e0f14b2241a1625491fa`. It uses Excel's standard `VelvetSweatshop` default protection, not a provider or user credential. Read-only decryption produced the same byte length and SHA-256 `d6ee6c55346b853f52df4c720bec16ea33a90263c12d4eed58d5aeaf4e453709`. The HTTP object was Last-Modified 1 July 2026, but workbook properties record creation on 28 February 2007 and last save on 28 March 2019. A portal migration timestamp is not an operator edition.

Aggregate inspection found 2,088 non-empty rows. After excluding one embedded header, 2,087 candidate assignment rows remain, of which 2,086 are unique after postcode case normalization. They cover 102 normalized codes: 80 numeric home-delivery codes and 22 alphabetic codes. There are 2,063 numeric-code rows and 24 alphabetic-code rows; 22 of the latter are explicitly box rows. No raw street or range row is stored in Git.

The workbook has one case anomaly, one qualifier-column anomaly, one exact duplicate, 30 street/range/qualifier keys with more than one code or parish outcome, and 12 distinct parish labels, including authority-sensitive St. George variants. The review does not silently repair or merge them. The five data columns contain no geometry, source edition, validity interval, correction log or explicit completeness statement.

## Rights and source boundaries

Twelve exact official publication and public metadata bodies totaling 1,039,242 bytes were fixed outside Git with URLs, lengths and SHA-256. Government of Bermuda terms say site Content, source code and databases are Crown-copyrighted, site use grants no intellectual-property licence, and reproduction, distribution, modification or transmission requires written permission. The workbook has no separate open licence. Aggregate inspection is audit evidence; it is not permission to republish the rows.

UPU's current Universal POST*CODE Database is version 2026.1 and is offered with a contract, non-disclosure agreement, data-use declaration and rates. It was not acquired, and no provider contact, registration, authentication, agreement or payment was attempted.

## Geometry review - neither ArcGIS candidate is eligible

The BELCO ArcGIS item is a public 47,352,226-byte `Tile Package` created in 2019, owned by a Bermuda Electric Light Company account. Its description mentions buildings, roads and postal codes, but source and licence fields are empty, it is unlisted, and it is not a queryable versioned postcode vector service. It was not downloaded or promoted.

A separately indexed public `Gp_Postal Codes` Polygon layer is a false positive. Its WGS84 extent is longitude 26.28742 to 30.041195 and latitude -28.04167 to -24.677977, outside Bermuda. Its fields include `AREA` and `STRCODE` but no postcode field. No feature row was queried.

No official or rights-cleared BM postcode Polygon/MultiPolygon was found. No street, parish, building, tile, point, buffer, hull, Voronoi/raster surface, model or AGID cell was turned into an area.

## Methodology and verification boundaries

The offline inspector accepts only the twelve expected filenames, byte lengths and SHA-256 values. It checks Government and UPU HTML markers; all 11 PDF pages; Excel default protection, decrypted digest, workbook properties, sheet structure and aggregate quality; and the ArcGIS owner, item, service, extent, geometry type, fields and rights metadata. A missing, renamed, extra or changed body, PDF marker, workbook summary, JSON path/value/field or unexpected postcode field fails closed.

Poppler rendered the UPU page and ten Government terms pages to non-empty 1241x1754 RGB PNGs with non-white bounds and fixed render digests. The local image-view helper returned Windows error 206 even from `C:\tmp\bmu`; exact PDF bytes, extracted full-page text, page counts and render properties were still verified. No chart was produced because showing one ineligible tile package against zero eligible polygons would be misleading.

Shared deterministic tests cover normalization, Polygon/MultiPolygon-only drawing, loading, no-match, multiple, API failure, invalid geometry, map fit, translucent fill, clear outline, clear/re-search and fail-closed Point/non-area handling. They do not prove a real BM route. With no eligible fixed geometry artifact, no real BM API, map rendering or browser E2E is claimed.

## Limitations, uncertainty and promotion risks

- The official workbook is a valuable candidate assignment table, but a March 2019 internal last-save date cannot establish current 2026 assignment completeness.
- The portal object supplies no operator edition, validity intervals, correction semantics or explicit completeness declaration.
- Source anomalies and ambiguous keys require authoritative interpretation; normalization alone cannot repair them.
- Crown-copyright terms do not establish AGID redistribution or public-serving rights.
- A tile package, street list, parish boundary or model is not a postal Polygon/MultiPolygon.
- P.O. Box and special codes require explicit object typing before any geometry decision.

## Recommended next step

Keep BM blocked and continue to `BO`. Re-check no earlier than `2026-09-07T11:37:20.370Z`, or sooner only if BPO publishes a dated corrected complete assignment release with compatible rights and a fixed postcode Polygon/MultiPolygon artifact. A permission request, provider contact, agreement, paid source, protected row access, new destination or deployment requires explicit approval.

## Further questions

- Will BPO publish a current edition and correction log for the street/range workbook?
- What licence permits processing, derived artifacts, redistribution and public serving?
- Is there an operator-authorized vector boundary release for the 80 numeric postcode areas?
- How should BPO type `AA AA` special codes that are not P.O. Box ranges?
