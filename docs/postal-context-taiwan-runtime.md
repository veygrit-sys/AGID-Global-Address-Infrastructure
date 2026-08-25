# Taiwan Postal Context runtime

The Taiwan pack keeps Chunghwa Post 3+3 assignment, MOI-coordinated doorplate positioning, NLSC Taiwan eMap buildings and doorplates, cadastral context, and administrative boundaries as distinct evidence. It never turns a lookup row, three-digit centre, road range, doorplate point, parcel, administrative unit, map image or nearest feature into official postal geometry or an exact building link.

Chunghwa Post six-digit 3+3 assignment
  -> separately permitted MOI or local-government doorplate address and point
  -> source-defined or reviewed NLSC building relation
  -> separately typed administrative, cadastral and privacy evidence
  -> TW AGID cell relation

## 3+3 assignment and geometry

The first three digits identify an administrative district; the last three identify a delivery district or delivery-specific number. Operator rules can depend on roads or places, sections, lanes, alleys, house-number ranges and odd-even parity. P.O. boxes, military special boxes and organization-specific assignments remain non-area unless an exact operator artifact explicitly supplies geometry.

The public three-digit centre-coordinate table is a reference point, not a perimeter. AGID assumes no nationwide Chunghwa Post-authored full 3+3 polygon release. Rights-cleared official doorplate members joined to pinned operator assignments may produce a derived, uncertainty-bearing surface. Sparse, unmatched and ambiguous locations remain gaps. Road or lane buffers, administrative boundaries, cadastral parcels, building footprints, centre points, Voronoi cells and interpolation remain QA candidates only.

## Doorplate and building precision

NLSC states that local governments maintain doorplate locations under MOI coordination and upload them to a national warehouse, and that nationwide doorplate positions are periodically obtained for Taiwan eMap search and positioning. That operational statement does not grant a blanket national bulk licence. Exact use pins the national or local artifact, public civic fields, point status, source dates, local coverage, access basis, terms, schema, source CRS and digest.

An exact building output requires a permitted Taiwan eMap building feature and a source-defined address relationship, common stable authoritative identifier or reviewed explicit crosswalk. A doorplate point, parcel, address text match, containment, overlap or proximity is candidate evidence only. WMS or WMTS display, viewer access, government-unit WFS eligibility, payment or subscription does not automatically grant reusable vector or derivative rights.

Public output excludes household registration, residents, occupants, domicile and organization associations, owners and rightsholders, personal identifiers, land rights, title or right basis, encumbrances, restrictions, transactions, values and tax fields. Floor or unit details are emitted only from an independently permitted public address artifact, never inferred from the postcode, point, parcel or building.

## Administration, CRS, licensing and runtime state

Pinned NLSC downloads can supply dated county or special-municipality, township or city or district, and village or li identifiers, names and separately licensed boundaries. Administrative or cadastral membership does not create a 3+3 assignment, delivery eligibility, exact building linkage or a sovereignty conclusion.

Every geometry keeps its source CRS. TWD97 longitude-latitude EPSG:3824, TWD97 TM2 zone 121 EPSG:3826, zone 119 EPSG:3825 and other source coordinates use a reviewed, versioned WGS84 transform; they are never merely relabelled EPSG:4326.

The Taiwan Open Government Data License and Chunghwa Post public authorization are artifact-specific. The Web Service application is registration and fixed-IP controlled and supports individual queries; bulk demand follows a separate download process. No application contact information, query logs, shipment information or personal address history enters the public pack.

The committed seed is M1_metadata: contracts and non-production synthetic fixtures only. It contains no Chunghwa Post, MOI, local-government or NLSC rows, real addresses, personal data or production geometry. Taiwan remains unconfigured until a separately released M2+ descriptor passes integrity, source rights, freshness, assignment-class, derived-geometry, explicit-building-link, privacy, CRS, coverage and correction gates.
