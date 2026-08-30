# Estonia Postal Context M2 source review

## Outcome

Estonia remains at `M1_metadata` under
`M2_current_aks_sihtnumbri_alad_visualization`. The anonymous official AKS
WFS reported 5,436 `Sihtnumbri alad` features and returned two exact WGS84
GeoJSON pages containing 4,320 `Polygon` and 1,116 `MultiPolygon` features.
All 5,436 five-digit codes and feature IDs are distinct. A postcode-specific
FES query for `10621` independently returned one real `MultiPolygon` (feature
ID `729928`).

M2 is blocked. The service caps responses at 5,000 features and advertises
paging as non-transaction-safe, while the layer metadata supplies no release
edition, validity date or metadata date. Ninety-one source features fail the
deterministic Turf geometry-validity check. The capabilities also state that
geometry originating outside the agency may have additional terms, and the
layer describes its areas as determined by Omniva. Omniva's separate postcode
database download terms prohibit publication without prior consent. The
reviewed agency WFS terms are reuse-capable, but the exact external-geometry
publication scope is not resolved strongly enough to publish a complete fixed
AGID artifact.

No agreement was accepted, no operator database was downloaded, no invalid
feature was repaired, and no buffer, hull, administrative boundary or AGID
cell was substituted for postal geometry.

## Evidence and quality

| Measure | Reviewed result | M2 consequence |
|---|---:|---|
| WFS `numberMatched` | 5,436 | A real official current area layer exists |
| Page sizes | 5,000 + 436 | Full observed count, but not one transaction-safe read |
| `Polygon` / `MultiPolygon` | 4,320 / 1,116 | Both supported area types exist |
| Distinct five-digit codes / IDs | 5,436 / 5,436 | No cross-page duplicates observed |
| Coordinates / rings | 1,238,476 / 8,402 | Nationwide byte-level geometry scan completed |
| Turf-valid / invalid | 5,345 / 91 | Full topology gate fails |
| Open, short, non-finite or out-of-range rings | 0 | Structural coordinate checks pass |
| Public immutable EE artifacts approved for AGID | 0 | Fixedness and publication gates fail |
| Real EE postcode search -> API -> translucent map | 0 | Application gate fails |

The combined WGS84 bounding box is
`[21.77239935, 57.50931341, 28.20895066, 59.82201153]`. The observed
`stamp_cre` range is `2026-07-08T12:21:37.427` through
`2026-07-08T12:21:42.834`; it is retained as feature metadata and is not
promoted to a declared dataset edition or validity date. The exact page SHA-256
values are `b4a2df24…b77a2847` and `54a67aac…571b81`.

## Authority, rights and fixedness

1. [AKS WFS](https://aks.geoportaal.ee/aks-ogc?service=WFS&request=GetCapabilities&version=2.0.0)
   identifies `aks:ads_sihn_alad` as `Sihtnumbri alad`, supports WGS84 GeoJSON,
   and describes the features as Omniva-determined postcode areas. It also
   records a 5,000-feature default count, non-transaction-safe paging and an
   external-geometry terms caveat.
2. [AKS postal-code documentation](https://geoportaal.maaruum.ee/eng/spatial-data/address-data/postal-codes-p661.html)
   identifies AKS as the current-address postcode distribution surface and
   Omniva as the postcode operator.
3. [Maa- ja Ruumiamet map-service terms](https://geoportaal.maaruum.ee/est/teenused/wms-wfs-wcs-teenused/maa-ja-ruumiameti-kaarditeenuste-kasutustingimused-p24.html),
   published 1 January 2025 and modified 16 June 2026, allow extraction,
   derivation, combination, public presentation and redistribution with
   dataset, extraction-time/age and agency attribution. They also state that
   service data is informative, unofficial and supplied as-is.
4. The reviewed English open-data licence permits derivatives and
   redistribution, but names the Estonian Topographic Database as its object;
   it is not treated as a standalone grant for Omniva-origin postal polygons.
5. [Omniva postcode downloads](https://www.omniva.ee/en/zip-codes/) are governed
   by separate popup terms that require prior consent to publish the postcode
   database and prohibit resale without prior consent. The CSV/XML download was
   not invoked because accepting or relying on those terms was unnecessary for
   this anonymous official-area audit and would require explicit authorization.

The exact response lengths, URLs and SHA-256 receipts are pinned in the
[machine-readable source report](../reports/postal-context-m2/ee-source-review-2026-08-30.json).
Raw nationwide bodies remain outside Git. An observed hash proves the bytes
that were inspected; it does not convert a changing, paged WFS response into
an immutable release.

## Application status

Shared tests exercise normalized postcode search, Polygon/MultiPolygon
validation, bounds fit, a translucent fill, a visible outline, loading,
no-result, multiple-candidate, API-failure, invalid-geometry, clear and
re-search states. EE-specific runtime and route tests currently instantiate
synthetic postcode `00000`, synthetic assignment authority and synthetic
geometry authority. They do not load the 5,436 official features, serve a
real artifact-backed `EE/10621` API result or demonstrate the real app map.
The correct production response therefore remains **no verified EE area
available**.

Postal geometry remains separate from Omniva assignment, ADS address/building
identity, EHAK administration, facility routing and AGID coverage. A postcode
area is not an exact address, building, cadastral or legal boundary. Facility,
route, P.O. box, organization and other non-area codes receive no fabricated
surface.

## Remaining work

1. Obtain an official transaction-safe or edition-pinned AKS postal-area
   release with declared validity and immutable public retention outside AGID
   Git.
2. Resolve in writing whether Omniva's database publication restriction or
   another external-source term applies to publication of the complete AKS
   polygon artifact. Agreement acceptance requires explicit authorization.
3. Resolve all 91 invalid geometries through a corrected official release or
   an authority-preserving documented transform and validate national topology
   without inventing areas.
4. Complete the current operator-assignment and facility/non-area denominator,
   then connect an approved artifact to the real EE loader, API and app.
5. Pass normalization, ambiguity, geometry validity, map fit, translucent fill,
   outline, provenance, loading, no-result, multiple, API-failure,
   invalid-geometry, clear and re-search checks using real `EE` data.

Recheck only after the pending-country pass and
`2026-09-30T03:59:12.323Z`, unless an official immutable corrected release or
clear publication grant appears earlier. Elapsed time does not authorize an
account, agreement, publication destination or deployment.
