# Barbados Postal Context M2 review

## Technical summary - current official services do not yet provide a reusable M2 artifact

Barbados has legacy `BB` plus five-digit postcodes and a 2024 building-linked updated-code model. The current Barbados Postal Service (BPS) search accepts a neighbourhood or district, and the public Barbados Building ID (BBID) map exposes a building Polygon layer whose schema includes `BuildingID`, `ShortPosta` and `LongPostal`. Those facts do not complete M2: BPS terms reserve copyright and restrict electronic copies without permission, the reviewed ArcGIS licence fields are null or empty and their terms fields are absent, no complete versioned legacy-and-updated assignment denominator was published, and no rights-cleared immutable postal geometry artifact is available. BB remains `blocked`.

## The available Polygon is a building footprint, not a legacy postcode area

Eleven exact official publication and public metadata bodies totaling 1,951,330 bytes were fixed outside Git with retrieval time and SHA-256. The current BBID WebMap references the public `Simplified Buildings 24082026` layer, last edited on 25 August 2026. Its metadata reports `esriGeometryPolygon`, WKID 21292, Query capability, and the fields `BuildingID`, `ShortPosta` and `LongPostal`.

No feature row was queried. Public Query access with empty licence metadata is not permission for bulk copying, derivation, redistribution or public serving. Even with permission, a building footprint explicitly linked to one `LongPostal` value would be a building-linked postal geometry, not a `ShortPosta` area polygon. Dissolving footprints, filling gaps, buffering points, or substituting locality or parish boundaries would manufacture a postal area.

## Scope, data and the Barbados M2 definition

The review covers ISO `BB` and preserves postal assignments, BBID, buildings, localities, parishes, addresses, parcels and AGID cells as separate authorities. The country target is `M2_current_bps_assignments_and_postcode_area_visualization`.

M2 requires a current complete denominator of every legacy and updated BPS assignment, alias, validity interval, correction, exception and explicit non-area object, fixed by edition, bytes and SHA-256 under rights compatible with AGID processing, storage, derivation, redistribution and public serving. Every `ShortPosta` area must have an eligible real Polygon/MultiPolygon. A building-linked `LongPostal` may use a building Polygon only when the same permitted release explicitly links the code, `BuildingID` and footprint and passes privacy review. The app must then normalize the real code, expose loading/no-match/multiple/failure/invalid states, fit and render a translucent area with a clear outline, clear and re-search, and display geometry class, source, reference date and confidence.

## Methodology - metadata-only inspection avoids restricted rows

The offline inspector accepts only the eleven expected filenames, byte sizes and SHA-256 values. It validates BPS search, addressing and copyright markers; the UPU PDF signature, one-page count, November 2014 format markers; and the ArcGIS Experience-to-WebMap-to-building-layer chain, item rights fields, service capability, layer version, geometry type, CRS and field names. Missing, renamed, additional or changed bodies, paths, values, fields or PDF markers fail closed. It emits aggregate receipts and zero feature rows.

The UPU page rendered with Poppler to a non-empty 1241x1754 RGB PNG. The local image-view helper returned Windows error 206 even at `C:\tmp\b.png`; exact bytes, extracted text, page structure, render dimensions, non-white bounds and render SHA-256 were still verified. No chart was produced because zero eligible postal artifacts are clearer as an audit result than a visual comparison with one ineligible building-layer metadata record.

## Application boundary and robustness checks

Shared deterministic tests cover normalization, Polygon/MultiPolygon-only drawing, loading, no-match, multiple candidates, API failure, invalid geometry, map fit, translucent fill, visible outline, clear and re-search, and fail-closed Point/non-area handling. They do not prove a real BB API or map route. With no rights-cleared fixed assignment-and-geometry artifact, a real BB browser E2E is not claimed.

The existing synthetic Barbados fixture remains synthetic. No neighbourhood search, BBID feature row, address, building, parcel, resident, owner, occupant, query log or geometry was copied into Git or promoted as M2 evidence.

## Limitations, uncertainty and promotion risks

- The November 2014 UPU sheet predates the December 2024 BBID-linked updated-code launch.
- The Government launch article was visible through current indexed official content but returned HTTP 403 to the reproducible shell fetch, so it is reference-only rather than digest-bound evidence.
- Empty ArcGIS licence or terms metadata does not grant reusable data rights.
- A building footprint cannot stand in for a legacy postcode area, locality, parish or delivery zone.
- No provider contact, registration, authentication, terms acceptance, contract, payment, protected row access, publication or deployment was attempted.

## Recommended next step

Keep BB blocked and continue to BL. Re-check no earlier than `2026-09-07T09:32:18.170Z`, or sooner only if BPS or Lands and Surveys publishes a versioned rights-cleared national assignment denominator and fixed postal geometry artifact. Any permission request, agreement, paid access, feature-row extraction, new destination or deployment needs explicit approval.

## Further questions

- Will BPS publish a complete versioned `ShortPosta` and `LongPostal` assignment release with aliases and validity?
- What licence permits reuse of the BBID building layer and explicit code-to-building relations?
- Will an authority publish actual legacy postcode area boundaries rather than building, locality or parish proxies?
