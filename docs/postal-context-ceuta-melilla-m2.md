# EA Postal Context M2 review — Ceuta and Melilla

## Result

EA remains **M1 / blocked**. The current postal system and one real official-view 51001 Polygon are confirmed, but no complete immutable assignment denominator or rights-compatible downloadable geometry artifact is available. The Polygon is quality evidence only and is not committed or served.

The rollout ledger intentionally traverses EA in Africa while retaining the existing EA identity and Europe-source address record. Ceuta (51xxx) and Melilla (52xxx) remain distinct members; neither is absorbed into ES, IC, PT or Morocco.

## Evidence and rights

- [CartoCiudad postcode documentation](https://www.cartociudad.es/web/portal/codigos-postales) says postcode data are generated and updated annually with Grupo Correos.
- [CartoCiudad visualization documentation](https://www.cartociudad.es/web/portal/directorio-de-servicios/visualizacion) explicitly says these data are not downloadable and are only for visualization.
- [datos.gob.es / CNIG response](https://datos.gob.es/es/solicitud-de-datos/listado-de-codigos-postales-por-poblacion-y-provincia), updated 2026-05-22, identifies Correos as the sole distributor and CartoCiudad as consultation only.
- [Correos Data](https://www.correos.es/es/es/empresas/marketing/identifica-a-tus-clientes-potenciales/correos-data) offers postcode databases and a cartographic layer commercially, restricts transfer/sublicensing and similar Internet postcode-finder use, and includes Ceuta/Melilla commercial scope. No contact, registration, contract, acceptance or purchase was attempted.
- [European Commission territory reference](https://taxation-customs.ec.europa.eu/list-non-eu-countries_en) provides identity context for “CEUTA AND MELILLA”; it is not postal authority.

Nine exact response bodies totaling 514,425 bytes were checked by byte length and SHA-256, then excluded from Git. The committed source report records every digest. WMS capabilities were version 1.3.0, update sequence 3203, layer codigo-postal, attribution Grupo Correos and EPSG:4326 availability.

## Real polygon quality

The official CartoCiudad WMS returned codigo-postal.510010000005 for normalized postcode 51001: a Polygon with one closed ring, 184 positions and bbox [-5.33371012, 35.88421039, -5.2965182, 35.89902507]. Attributes reported alta_db=2026-01-13T13:14:47Z and fecha_alta=20260112.

The deterministic gate checks NFKC normalization, 51/Ceuta and 52/Melilla membership, finite WGS84 coordinates, ring closure, minimum positions, duplicate non-terminal vertices, zero-length edges, self-intersection and territory bbox. CartoCiudad candidates returned no geometry and the geocoder find result was a Point, so neither is promoted to an area.

Hugging Face, libpostal and other open-source models can improve multilingual parsing tests, candidate ranking, topology anomaly review and drift detection. They cannot create postal assignments, official geometry, reuse rights, exact buildings or delivery facts.

## Application boundary

EA is registered in the shared Postal Context country policy with 51NNN/52NNN normalization and descriptor environment hooks. With no approved descriptor, the real API must return 503 Postal Context pack is unavailable, and the app must render no postal overlay. A source-qualified address candidate and independent EA AGID may provide context more detailed than a postcode, but must remain separate from the postal area and from any exact-building claim.

## Blocker and unblock condition

M2 requires a complete current finite Correos assignment/exception denominator and exact same-code Polygon/MultiPolygon release, pinned by version, time, schema, CRS, bytes and SHA-256 under rights compatible with AGID processing, storage, derivation, redistribution and public serving. It must then pass real API/app loading, no-match, multiple, failure, invalid-geometry, fit, translucent fill/outline, metadata, clear and re-search verification.

Retry after 2026-12-03T04:20:37.745Z, after the pending-country sweep, or earlier only if a competent authority publishes a compatible release.
