# `agid-postal-be` contract seed

Status: `M1 metadata / official national polygons verified; public API rights blocked`

The exact bpost/geo.be Postal cantons metadata and EPSG:4326 Shapefile were
reviewed. The archive has 1,268 valid Polygon features and 1,187 distinct
source code values. Its source method extrapolates address points into areas
using administrative limits and roads, so it is an official derived postal
surface rather than a surveyed delivery guarantee.

The metadata grants internal use, strictly forbids commercial use and requires
bpost attribution for public use. It does not grant AGID permission to publish
the raw or transformed polygons in GitHub, an immutable artifact or a public
API. Therefore no real BE search-to-area response is shipped.

The current bpost page links a byte-pinned `2025.xls`. The approved workbook
runtime cannot parse that legacy BIFF container, so row-level assignment
completeness is not claimed. The polygon field also contains `612` and `9`;
normalizing them to four digits needs an explicit bpost-backed rule.

M2 resumes only after current assignment validation, written public
redistribution/derivative/API/commercial-use permission, an approved immutable
artifact and real BE loader/API/app verification. Addresses, house numbers and
buildings remain separate BeSt/regional-registry evidence and are never
inferred from postcode containment.
