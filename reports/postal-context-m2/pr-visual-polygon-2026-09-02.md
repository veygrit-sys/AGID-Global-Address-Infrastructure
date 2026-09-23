# Puerto Rico Postal Context visual and polygon report — 2026-09-02

## Outcome

The PR app path is implemented and visually verified for the fixed 2020 Census
ZCTA derived-display scope. The full rollout M2 remains **blocked** because the
repository does not have a redistributable, complete current USPS assignment
denominator. No official USPS-boundary or complete-current-assignment claim is
made.

## Search, API and ID linkage

- `00926` resolves through the real Postal Context API to normalized `00926`.
- ZIP+4 `00926-3232` normalizes to the same five-digit display area.
- The selected result exposes postal object `postal-pr-census-zcta-00926`,
  geometry `census-pr-zcta-2020-00926`, assertion
  `census-pr-zcta-2020-00926-part-of-pr`, linked context `country-pr` and
  release `pr-census-zcta-2020-20260902`.
- The UI adds population, housing, land and water attributes, provenance,
  confidence, source/license/digest and authority-boundary details.
- `00902` returns explicit `no_match`; no point, route, P.O. box,
  organisation or absent ZCTA is expanded into an invented polygon.

## Polygon quality

The fixed TIGERweb receipt contains 132 unique Puerto Rico ZCTAs: 142 polygon
parts, 152 closed rings and 168,582 positions. Turf, JSTS and the shared
topology validator all pass without coordinate modification. Aggregate bounds
are `[-67.95179799957432, 17.910816999983286, -65.2210270004101,
18.51870700012846]`; aggregate geodesic area is 9,487.290179 km².

The `00926` example is a valid Polygon with bounds
`[[-66.10244799956124, 18.30192300028008],
[-66.00346400025006, 18.396658999825014]]`. It is displayed with a translucent
blue fill over the background map and a high-contrast blue boundary.

## Visual verification

Chromium/Playwright drove the running application at desktop 1440×1100 and
mobile 390×844. Only geocoder transport was deterministic; Postal Context API,
real Census geometry, MapLibre rendering, fit, clear and re-search were not
intercepted.

The first visual pass exposed two UI defects and both were corrected:

1. search results could remain outside a collapsed container and be
   unclickable after clear/re-search;
2. the mobile AGID card and full-height postal detail obscured the polygon.

Search panel state is now explicit, mobile postal details are internally
scrollable, and the mobile AGID card yields to the postal-area view. Manual
inspection confirms visible basemap, translucent fill, clear boundary and
readable identifiers on both viewports.

- desktop screenshot SHA-256:
  `8d9ffecf14eb2961b2e5983aaa028f1062e8745e71480310a1d2c3fd827ab7cc`
- mobile screenshot SHA-256:
  `6c69ebb62f84f427e310b4291f764cd226124d33e1dcf004f06b43a46a7f2f7c`

The in-app browser automation skill was attempted but could not start because
the Windows sandbox rejected its read ACL setup. This is recorded as a failed
skill attempt, not as visual evidence. The screenshots above were produced by
the deterministic Playwright fallback and then manually inspected.

## Source and rights boundary

Postal-system and formatting facts come from USPS PostalPro and Publication 28.
USPS licensed rows stay outside Git. Display geometry and attributes come from
the U.S. Census Bureau's official 2020 ZCTA mapping layer and are classified
`derived`, not official USPS areas. Exact receipts, acquisition timestamps,
SHA-256 values, query contract and reuse decision are recorded in
`source-profile.json`.

## Final verification

- deterministic PR artifact build: 1/1 passed;
- PR normalization, topology, API, shared-store and UI state suite: 20/20 passed;
- shared Postal Context runtime regression suite: 169/169 passed;
- address-format and shared search/QR UI suite: 72/72 passed;
- TypeScript `--noEmit`: passed;
- actual-app Chromium visual flow: passed on desktop and mobile for search,
  result selection, API lookup, fit, translucent render, identifier display,
  clear, re-search, ZIP+4 normalization and explicit no-match.

The browser report records ancillary failures from optional nearest-postcode,
building-name and Overpass integrations. Postal Context requests themselves
had zero failures; those unrelated endpoints are not used as evidence for the
PR polygon or ID linkage.

## Remaining blocker

Full rollout M2 can be reconsidered after an authoritative, current and
redistributable complete Puerto Rico ZIP assignment source is available and
reconciled without turning ZIP+4, route, P.O. box, organisation or other
non-area assignments into fabricated surfaces. Next review: **2026-12-02**.
