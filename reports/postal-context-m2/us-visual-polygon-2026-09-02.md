# United States Postal Context polygon validation — 2026-09-02

## Result

United States remains **blocked / M2 unmet**. AGID now contains one non-synthetic, coordinate-preserving 2020 Census ZCTA 10001 validation sample. It is a derived statistical display context, not an official USPS ZIP boundary and not a complete current USPS assignment dataset.

## Geometry quality

- `Polygon`, one part, three closed rings, 124 positions.
- Exact source receipt: Census TIGERweb layer 2, January 1, 2020 vintage, `OBJECTID=26939`, SHA-256 `bb16b0907fe2b43a9cbe045d10e0b7518e5218a39d904df5c1567d54fc704a58`.
- Bounds: `[-74.00994700020514, 40.74345100004846, -73.98407599972285, 40.75968600024119]`.
- Coordinates were copied without geometric modification; all rings are closed and non-zero-area, all values are finite and within WGS84 ranges.
- Semi-transparent fill `0.25` and a four-pixel cyan outline were deterministically rendered over a visible background grid. The 1440×900 screenshot has 2,476 RGBA colours, 152,667 area-fill pixels, and 8,855 outline pixels.

## Detailed ID-linked result

- Postal Context ID: `postal-us-census-zcta-10001`
- Geometry feature ID: `census-us-zcta-2020-10001`
- Derived AGID centroid cell: `USARPV8JCJET`
- AGID node: `agid-us-census-zcta-10001-centroid`
- Country assertion: `census-us-zcta-2020-10001-part-of-us`
- AGID crosswalk assertion: `census-us-zcta-2020-10001-centroid-agid-crosswalk`
- Census attributes: population 32,612; housing 18,926; land 1.62 km²; water 0.00 km².

The AGID relation is explicitly a centroid-cell crosswalk. It does not claim the AGID cell covers the ZCTA or that the ZCTA is a USPS boundary. No address, building, parcel, recipient, customer, occupant or land-right row is included or inferred.

## Browser and application evidence boundary

`npm run dev` was attempted in the isolated worktree and failed because `tsx`/`node_modules` were unavailable; the already-open ambient app was not used as evidence for this branch. The in-app Browser skill was attempted and its trusted Node process exited unexpectedly. Bundled Playwright then rendered a deterministic evidence panel directly from the committed graph and geometry.

The screenshot and DOM text were generated and their pixels/contents were validated. The local image-inspection tool failed twice with Windows error 206, so this run does **not** claim human desktop visual inspection or real AGID app/API verification. The country therefore remains blocked.

## Promotion blocker

USPS primary material describes current ZIP/AIS products, but the reviewed July 2026 licence restricts copying, modification and distribution. Zero licensed USPS rows are published. Census documents state ZCTAs are generalized statistical representations and do not represent all valid ZIP Codes. Promotion requires a complete current immutable typed USPS five-digit/ZIP+4 assignment, validity, correction, exception and explicit non-area denominator with compatible AGID processing, storage, reconciliation, redistribution and serving rights, plus actual app/API validation.
