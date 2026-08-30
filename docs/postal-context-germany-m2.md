# Germany Postal Context M2 source review

## Outcome

Germany remains at `M1_metadata`. BKG documents a current national PLZ product for release `2026-02`: 8,169 five-digit delivery-postcode surfaces sourced from Deutsche Post Direkt, distributed as `PLZ_5` Shapefile geometry. The documentation is dated 2026-07-14, the terms 2026-07-21, and the catalogue was updated 2026-07-30.

The national product and services are available only to eligible federal or V GeoBund users under a licence agreement. This run did not authenticate, accept a contract, pay, create a publication destination or acquire the national bytes. An anonymous WFS capability request returned HTTP 403. No AGID public redistribution grant, immutable artifact, real DE API response or real DE app-area visualization was established.

## Evidence and scope

| Measure | Reviewed result | M2 consequence |
|---|---:|---|
| Exact official bodies | 10 | All byte length and SHA-256 receipts pass |
| Documented delivery-postcode surfaces | 8,169 | Current product exists, but national bytes are restricted |
| BKG test Polygon records | 3 | Compatibility-only, production eligible: 0 |
| Test postcodes | `38350`, `38368`, `38379` | Not national coverage and not shipped |
| AGID immutable DE data artifacts | 0 | M2 blocked |
| Real DE postcode search → API → translucent map | 0 | M2 blocked |

The BKG documentation describes the PLZ areas as generalized cartographic surfaces approximating delivery assignments. They are not administrative boundaries and are not exact street, house, building or cadastral geometry. Large-recipient and other postcodes without a surface are excluded. Austrian postcodes `87491`, `87567`, `87568` and `87569`, routed through Germany, remain Austrian identity and are excluded from German area coverage.

## Source and rights review

1. [BKG PLZ product page](https://gdz.bkg.bund.de/index.php/default/digitale-geodaten/nicht-administrative-gebietseinheiten/postleitzahlgebiete-deutschland-plz.html) identifies release `02.2026`, a semiannual cycle, Deutsche Post Direkt source geometry, multipart capability, non-area exclusions and restricted access.
2. [BKG PLZ documentation](https://sg.geodatenzentrum.de/web_public/gdz/dokumentation/deu/plz.pdf) records 8,169 delivery-postcode areas, the new postcode `31536`, `PLZ_5` Shapefile delivery and the March 2025 PLZ-to-AGS table date.
3. [BKG PLZ terms](https://sg.geodatenzentrum.de/web_public/gdz/lizenz/deu/nutzungsbedingungen_plz.pdf) require eligible-user access under agreement and the prescribed Deutsche Post Direkt copyright notice for licensed display or derivatives. This is not treated as an AGID public redistribution grant.
4. [BKG metadata](https://mis.bkg.bund.de/trefferanzeige?docuuid=6174E709-D11B-45F6-9880-367611452F18) identifies Deutsche Post source authority and restricted WFS/WMS availability.
5. [BKG compatibility ZIP](https://sg.geodatenzentrum.de/web_public/gdz/testdaten/plz-utm32s-shape.zip) contains three EPSG:25832 Polygon records (four rings, 126 points) for `38350`, `38368` and `38379`. The catalogue calls it test data for compatibility. It is never substituted for the nationwide release.
6. [Deutsche Post DATAFACTORY](https://www.deutschepost.de/de/d/deutsche-post-direkt/datafactory.html) describes approximately 8,200 GEOCODE delivery areas with annual updates and quarterly BASIC/STREETCODE assignment products. These commercial product descriptions do not grant public redistribution.
7. [Deutsche Post change notices](https://www.deutschepost.de/de/d/deutsche-post-direkt/datafactory/download_postleitdaten.html) were current through June 2026. The exact June change and addition PDFs are notices, not a complete national assignment denominator or polygon dataset.

All ten retrieved bodies are pinned in the [machine-readable source report](../reports/postal-context-m2/de-source-review-2026-08-30.json). Raw bodies and the extracted test data remain outside Git.

## Application status

Shared tests verify country/postcode normalization, Polygon/MultiPolygon filtering, map bounds fitting, translucent fill, distinct outline, provenance fields, clear/re-search and error states. Germany has no authorized current national artifact connected to that path. Therefore the correct DE result is **no verified area available**; the three test polygons, administrative boundaries, points, buffers, Voronoi cells and AGID cells are not displayed as postal areas.

## Remaining work

1. With separate authorization where required, obtain a current complete national release and assignment/class denominator with explicit AGID use and publication rights.
2. Pin edition, validity, terms, attribution, SHA-256, schema, CRS, coverage and exception classes; validate all geometry and topology without inventing non-area surfaces.
3. Publish an approved immutable artifact and pass the real DE loader/API/app path through postcode search, geometry validation, fit, translucent rendering, outline, provenance, ambiguity, no-result, invalid-geometry, failure, clear and re-search.

Recheck only after the pending-country pass and `2026-09-30T02:00:12.877Z`, unless an unrestricted current release appears earlier. Elapsed time does not authorize authentication, contract acceptance, payment, publication or deployment.
