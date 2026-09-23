# Saint Vincent and the Grenadines Postal Context M2 review

Review date: 2026-09-02

Country: `VC` / Saint Vincent and the Grenadines

Result: M1 metadata and fail-closed runtime policy improved; M2 remains blocked.

## Verified postal system

SVG Post is the State's designated official postal administration. Its current public postcode reference page contains 58 distinct codes in `VCNNNN` form, grouped under Kingstown, Windward, Leeward and Grenadines. The same table mixes locality labels with `All Post Boxes in Kingstown` and `Kingstown (General Delivery)`. The UPU addressing sheet, edition 05/2021, requires `VC` plus four digits on a separate line below locality and says delivery is mainly through P.O. boxes and post offices, with home delivery very limited.

Those sources establish the current code syntax and public reference labels. They do not establish stable row IDs, object types for every row, validity and correction history, a fixed complete reusable dataset release, or postal Polygon/MultiPolygon geometry.

## Polygon quality and authority boundary

The reviewed SVG Post pages and UPU sheet publish no postal boundary dataset. The Statistical Office publishes 13 Census Divisions and explicitly identifies them as census-administration geography. Its open licence applies solely to Statistical Office data and excludes third-party data. A Census Division, parish, island, locality, post-office point, route, address, building, buffer, hull, raster, Voronoi surface or AGID cell must therefore not be relabelled as an SVG Post postal area.

No surface is better than a false surface. The VC policy permits a code to resolve to a typed non-area postal object and keeps these identifiers separate:

- `postal_object_id` and `postal_object_type`;
- `administrative_context_id`;
- `geometry_id` and geometry kind;
- `source_assertion_id` and `release_id`;
- `civic_address_id` and `building_id`;
- `agid_crosswalk_id`.

An address or building relation remains null unless a separate, rights-cleared source publishes a stable identity and explicit reviewed relation.

## Application and visual check

The isolated application start was attempted with `npm run dev -- --host 127.0.0.1 --port 4317`; it failed because `tsx`/`node_modules` are unavailable. The in-app Browser process failed before connection, and the ambient port 3001 refused connection. Therefore no VC API request, map fit, translucent polygon, real-app browser flow or human visual inspection is claimed.

A committed Playwright deterministic fallback searches the representative official reference `VC0120`, confirms zero eligible postal surfaces, draws no SVG/canvas/postal-area element, keeps the background unobscured and displays the separate ID fields and reasons. The screenshot was produced, but the local image-inspection helper failed on the Windows path. This is a fail-closed rendering proof, not real-app M2 evidence.

## Reproducibility and remaining gate

Five exact source bodies were inspected outside Git: 815,998 bytes total, each bound to its retrieval SHA-256. The committed validator checks the exact set, bytes, digests, required text, two-page UPU document, 58-code count, mixed object semantics, licence boundary and absence of postal geometry. It emits no source row or production geometry.

M2 requires a competent authority to publish or explicitly authorize a fixed complete current typed assignment release with stable postal-object IDs, validity, aliases, corrections, exceptions and explicit area/non-area status, plus eligible real postal polygons under rights compatible with AGID processing, storage, derivation, redistribution and public serving. The real VC API/app must then pass normalization, loading, no-match, multiple, failure, invalid-geometry, non-area, fit, translucent draw, clear and re-search checks.

Retry after: 2026-12-02T12:27:31.870Z, after the pending-country sweep, unless new primary evidence resolves the gate first. No provider contact, registration, authentication, contract, payment, protected-data access, publication or deployment was attempted.
