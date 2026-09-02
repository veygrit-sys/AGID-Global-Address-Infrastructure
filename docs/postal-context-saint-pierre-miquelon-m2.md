# Saint Pierre and Miquelon Postal Context M2

## Outcome

PM reaches its country-specific M2 with official La Poste postcode `97500`,
stable links to commune IDs `97501` and `97502`, and one real derived
MultiPolygon display feature. La Poste publishes no open postcode contour,
so the map identifies the geometry as derived administrative context.

The public search response exposes:

- postal context ID `postal-pm-97500`;
- administrative IDs `admin-pm-insee-97501` and
  `admin-pm-insee-97502`, with names;
- two official-assignment assertion IDs;
- pinned release `pm-laposte-geoapi-single-postcode-20260901`;
- geometry type, derived provenance, source, source date, confidence and
  licence-bound digest.

No address, building, parcel, customer, recipient, deliverability or land
rights data is present. Postal Code → Polygon → Address Context authority
remains separated.

## Evidence and rights

Observed at `2026-09-01T19:06:03.583Z`.

1. [La Poste official postcode base](https://www.data.gouv.fr/fr/datasets/base-officielle-des-codes-postaux/) — complete 2026-08-08 snapshot, Open Licence 2.0. Exact CSV and metadata hashes are pinned in the source profile.
2. [French Geo API communes](https://geo.api.gouv.fr/decoupage-administratif/communes) — current 97501/97502 administrative contours and a 97500 cross-check, Open Licence 2.0.
3. [Etalab Open Licence 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) — reuse with attribution.

All eight exact source bodies total 2,162,379 bytes and remain outside Git.

## Reproducible transform and quality

The builder verifies source hashes, all 39,192 official rows, the exact three
PM rows, both code response identities, and exact equality with the 97500
query. It then concatenates the two source MultiPolygon coordinate arrays in
stable ID order. It does not union, dissolve, simplify, interpolate or edit
coordinates.

The output has 78 parts, 78 closed rings, 9,097 positions, bounds
`[-56.518569, 46.749454, -56.119017, 47.144249]`, and Turf area
`219.09697358099386 km²`. Turf, JSTS and shared AGID topology validation must
all pass.

The runtime must normalize full-width and spaced `97500`, reject other
values, return two locality alternatives with IDs, render the translucent
fill plus clear outline, fit the complete bounds, clear, and re-search.
## Browser and visual verification

At `2026-09-02T00:59:23.452Z` the isolated application was opened in a real
Chromium session at 1440 × 1000. Searching for `97500` with the PM country
filter reached the live `/api/v1/postal/PM/97500?geometry=geojson` route twice;
both responses were HTTP 200. The public Nominatim proxy returned no PM
postcode hit, so only the geocoder result transport was supplied by the
deterministic browser fixture. The Postal Context API, pack, geometry,
MapLibre layer and fit path were not intercepted.

The captured application view was manually inspected. It shows the complete
two-commune extent fitted over the background map, a translucent blue fill,
a clearly visible dark-blue outline, and the detailed result panel without
hiding the geographic context. The panel exposes `postal-pm-97500`, both
commune IDs and labels, the source, the pinned release, both evidence
assertions, `MultiPolygon`, `derived`, source date, and confidence 0.95.
Dismissal removed the panel and the deterministic browser check completed.

Evidence:

- `reports/postal-context-m2/pm-browser-visual-2026-09-02.png`
  (`sha256:ad939c5d7653bf72189352efe5f3b27f3286936f0e5b375884ff8d30cd655d56`)
- `reports/postal-context-m2/pm-browser-validation-2026-09-02.json`
  (`sha256:6b1ac0532d81cbdf271bd7acf47f61b1aea38d401c0fe2219eff98129339d91b`)
- `reports/postal-context-m2/pm-current-single-postcode-2026-09-01.json`
  (`sha256:44f80f651cb7f932700b607c01a31f487134fd783df8598b66a7315cdc2d781c`)
- `scripts/verify-postal-context-pm-browser.mjs`

The browser also recorded failures from the separate nearest-postcode,
Overture building-name, and Overpass enrichment paths. They are retained in
the validation JSON rather than hidden. There were no Postal Context request
failures, and no address or building geometry was substituted into the postal
surface. This keeps those enrichment gaps outside the PM Postal Context M2
claim.
