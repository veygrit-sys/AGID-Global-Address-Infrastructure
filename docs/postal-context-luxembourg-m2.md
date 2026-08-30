# Luxembourg Postal Context M2 review

## Technical summary: Luxembourg remains blocked

Luxembourg does not meet Postal Context M2 as reviewed on 30 August 2026.
[POST Luxembourg's download area](https://www.post.lu/fr/particuliers/colis-courrier/espace-telechargement)
publishes current postcode CSV/XML/PDF reference files, but no postcode
Polygon/MultiPolygon product. The current CSV has 9,715 assignment/reference
rows and 4,750 distinct valid `L-NNNN` codes. The official PDF is the 27
October 2025 edition and explicitly includes organization/bulk and PackUp code
classes that cannot be presumed areal.

The official [CACLR](https://data.public.lu/en/datasets/registre-national-des-localites-et-des-rues/)
address reference is CC0 and current to 24 August 2026, but its file model has
no coordinates. The companion
[BD-Adresses](https://data.public.lu/en/datasets/adresses-georeferencees-bd-adresses/)
release is also CC0 and current to 24 August 2026, but all 179,491 geometries
are Point. POST, CACLR and BD-Adresses do not have the same postcode
denominator. No official postcode boundary release was found.

POST makes its files available in open access, while its
[legal notice](https://www.post.lu/fr/particuliers/infos-aide/mentions-legales)
applies copyright to the site. No explicit permission for AGID processing,
public serving and redistribution of the current files was found. Open access
is not treated as a reuse licence. Therefore no real LU Polygon/MultiPolygon
was loaded, served, fitted or rendered.

## Quantitative evidence

| Gate | Exact result | M2 implication |
| --- | ---: | --- |
| POST current CSV | 9,715 rows; 4,750 distinct codes; 275 leading-zero codes; 523 range rows | Current assignment reference exists, but contains no geometry and has unresolved reuse rights. |
| CACLR `CODEPT` | 4,430 rows/codes; type N 4,305; type B 125 | CC0 address reference is current but non-geometric and not the same denominator as POST. |
| POST versus CACLR | 389 POST-only codes; 69 CACLR-only codes | A surface cannot silently drop or merge mismatched classes. |
| BD-Adresses | 179,491 Point features; 4,200 distinct codes | Points are address context, not postcode areas. |
| CACLR without an address point | 230 codes | Point coverage cannot define a complete postcode surface. |
| POST leading-zero codes with an address point | 0 of 275 | PackUp/special endpoint classes must stay non-areal. |
| Official/rights-cleared postcode polygons | 0 | No production artifact or real app visualization can pass. |

The exact provider URLs, byte lengths, SHA-256 values, releases and counts are
recorded in the machine source review. Raw POST files, CACLR files, the 80.8 MB
address GeoJSON, extracted address rows and rendered PDF pages are not committed.

## Country-specific M2 definition

Luxembourg M2 now requires a current complete rights-cleared POST assignment
denominator, explicit code-class exceptions and real postcode
Polygon/MultiPolygon surfaces pinned by edition or retrieval basis, effective
date, terms, byte length and SHA-256. An approved immutable artifact must then
traverse the real LU loader and API into the application map, fit the selected
area and render translucent fill plus a clear outline while showing normalized
code, geometry kind, official/derived/virtual classification, source,
reference date and confidence.

POST/CACLR tables and BD-Adresses points do not pass. Neither do PackUp or
Point POST endpoints, PO boxes, organizations, routes, administrative
boundaries, parcels, buildings, point buffers, convex/concave hulls, Voronoi
or raster cells, or synthetic fixtures.

## Authority and data-quality method

The audit pinned the current official POST download page, CSV, PDF, legal
notice and legacy data.public.lu metadata. It separately pinned the current
official CACLR metadata/ZIP, file specification and BD-Adresses
metadata/GeoJSON. The three code sets were normalized as text so leading zeroes
were retained, then reconciled without promoting one source's omissions into
another source's authority.

Postal assignment, civic-address membership, address-point geometry,
administrative context, parcels and buildings remain separate grains. No
address point was buffered or tessellated; no hull, building, parcel or
administrative proxy was generated. An address-to-building claim would require
an explicit stable source relation or reviewed crosswalk; containment and
proximity are candidates only. No person, customer, recipient, owner, tenant,
cadastre or land-right data was committed.

## Application status and validation boundary

Shared deterministic tests verify the fail-closed application capability:
only Polygon/MultiPolygon draws; valid bounds fit; fill remains translucent;
the outline is visible; loading, no-match, multiple-candidate, API-failure and
invalid-geometry states are explicit; metadata, clear and re-search are
covered. Those tests do not prove a real LU area.

Because there is no rights-cleared real LU polygon artifact, a real LU runtime,
API lookup, map fit and translucent postcode rendering remain unverified.
Browser E2E was not attempted and M2 remains unmet. The official POST PDF
passed metadata and text extraction checks. Three pages were rasterized, but
the local image inspection tool returned Windows error 206 even for shortened
paths, so this review makes no visual-layout claim.

An audit chart was intentionally omitted: the decisive result is a set of
exact denominators and zero production polygons, which is clearer and more
auditable in the table above.

## Recommended next step

After pending countries and 6 September 2026 at 16:08 UTC, recheck for an
unrestricted current authoritative postcode-boundary release. Resume sooner
only if such a release appears or explicit written POST processing,
public-serving and redistribution permission plus an authoritative geometry
basis becomes available. Do not contact a provider, register, authenticate,
accept terms, pay, create a repository or publication destination, publish or
deploy without explicit approval.

See `reports/postal-context-m2/lu-source-review-2026-08-30.json` and
`reports/postal-context-m2/lu-checks-2026-08-30.json` for the machine evidence
and engineering gates.
