# Postal Context M2 reference implementation

## Reference outcome

Mexico (`MX`) is the completed reusable M2 example. It is not a synthetic
fixture and it is not a postcode-centroid approximation.

- Country definition:
  `M2_latest_official_sepomex_2025_national_postcode_polygons_derived_display`
- Fixed release: `mx-sepomex-postal-polygons-2025-20260901`
- 35,898 distinct five-digit postal objects
- 35,898 real SEPOMEX-source Polygon features transformed to deterministic
  derived display Polygon/MultiPolygon geometry
- 35,899 graph nodes, 35,898 evidence assertions and 1,065,949 positions
- descriptor SHA-256:
  `2f5dc6bd36f5700ff8b97accd936c4f7b9defbdd0247288f174dc417a4d1ca37`
- graph SHA-256:
  `b737b2c34ecfe0c6b428987ddb486fc561d5427b88f8a77ab419b0199f3ae7e9`
- geometry SHA-256:
  `26e8a0a34454c3f2f91161065ebd0e59ad42d4066617860123396e928ebc27c6`

The official datos.gob.mx page was rechecked on 2026-09-03. It still describes
32 SEPOMEX state SHP resources titled 2025, under Creative Commons Attribution
4.0, with dataset update time 2026-01-29 22:30 UTC. The fixed release remains
the latest published national spatial release found by this review.

Official source:
`https://www.datos.gob.mx/es/dataset/codigos_postales_entidad_federativa`

## Search result contract

A successful postcode lookup displays more than the normalized postcode. The
UI exposes a reviewable identity and evidence chain:

1. postal object label and Postal Context node ID;
2. rendered geometry feature ID;
3. `postal object -> geometry feature` AGID Postal Context chain;
4. linked country/locality/administrative context IDs;
5. evidence assertion IDs;
6. assignment authority and geometry authority as separate fields;
7. source ID, source version, source date, licence and source digest;
8. geometry provenance, confidence, accuracy and validation time;
9. geometry validity window;
10. AGID repository ID, immutable release ID and manifest digest;
11. country-specific M2 status, definition and fixed-artifact integrity.

For `MX 06000`, the expected chain is:

```text
postal-mx-06000
  -> mx-derived-06000
  -> sepomex-mx-2025-06000-part-of-mx
  -> country-mx
```

The geometry remains `derived` with confidence `0.92`, declared display
accuracy `250 m`, official postal assignment authority and official postal
geometry authority. Showing these IDs does not promote the Polygon to an
address, building, parcel or AGID grid cell.

## Machine gate

Run:

```text
node scripts/verify-postal-context-m2-reference.mjs
npm run verify:postal-context-m2-reference
```

The verifier reads `docs/postal-context-m2-reference.json` and fails closed
unless all of the following are true:

- the canonical ledger says `m2_verified`, the country definition matches,
  the evidence is real and no blocker remains;
- the descriptor is real, promotion-eligible and contains no residential
  address points or raw source dump;
- graph and geometry files match descriptor byte counts and SHA-256 values;
- graph, geometry and release IDs form one consistent immutable chain;
- every graph/assertion/geometry ID is unique and all references resolve;
- all published postal geometry is Polygon/MultiPolygon with finite,
  in-range, closed rings;
- every geometry carries source, authority, licence, digest, validity and
  quality metadata and no synthetic source is present;
- local copies of every ledger evidence artifact match the recorded bytes and
  SHA-256 values;
- both sample searches (`06000`, then `01000`) resolve to the expected
  postal, geometry, assertion and country IDs;
- the application contains every detailed-result label required by the
  reference contract.

## Browser and visual gate

The engineering gate is not enough by itself. Start the real application with
the fixed descriptor and verify this loop in a real browser:

1. set country to `MX` and search `06000`;
2. confirm API HTTP 200 and normalized `06000`;
3. confirm one real Polygon/MultiPolygon is fitted into view;
4. confirm fill opacity `0.22`, outline opacity `0.95`, outline width `3`,
   and a readable background map;
5. confirm all identity, authority, quality, date, licence and digest rows;
6. clear the selection and confirm both map layers disappear;
7. search `01000` and confirm the IDs, geometry and fit change;
8. inspect console errors/warnings and capture a screenshot.

The 2026-09-03 reference run passed this deterministic application path with
the real MX pack enabled. `06000` returned `postal-mx-06000`,
`mx-derived-06000`, `sepomex-mx-2025-06000-part-of-mx` and `country-mx` from
the unmocked Postal Context API. The rendered map canvas contained 127,857
sampled blue-dominant pixels; clearing reduced that count to 32,207; selecting
`01000` restored it to 116,856. All five Postal Context requests returned HTTP
200 and the `00000` lookup produced an explicit `no_match` with no geometry.

The geocoder result transport alone was deterministic so this check does not
depend on a public search service. The Postal Context API, fixed real geometry,
MapLibre canvas, fit, clear and re-search paths were not intercepted. Ancillary
INEGI address, Overture building-name and Overpass requests failed locally and
are listed separately in the report; none was used to pass Postal Context M2.

The browser plugin, image viewer and Windows UI helper all failed on this host
with `windows sandbox ... apply deny-read ACLs`. Therefore the screenshot was
captured but **manual visual inspection was not performed**. The run is recorded
as deterministic rendered-canvas validation, not mislabelled as human visual
inspection:

- report: `reports/postal-context-m2/mx-reference-browser-validation-2026-09-03.json`
  (`sha256:25240b91fed3f44f8c54505bb6a37eea4c647ed6fb5ee72febf557306df81ed0`)
- screenshot: `reports/postal-context-m2/mx-reference-browser-visual-2026-09-03.png`
  (`sha256:671f54e06a850bd32cf87ccb0c0644c6bf1ff7fc1a1c97396653ca08a02e1530`)

Run the repeatable browser check after starting the app with the fixed MX
descriptor and `AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL=true`:

```text
npm run verify:postal-context-m2-reference:browser
```

Loading, no match, ambiguity, API failure and invalid geometry must remain
explicit states. A point, route, P.O. box, organization, building or AGID cell
must never be expanded into a postal polygon.

## Reusing the pattern for another country

1. Copy the reference JSON and change the country, pack paths, official-source
   review, country-specific M2 definition and two real sample ID chains.
2. Pin official primary-source metadata, terms, exact source bytes, release
   version, retrieval time and SHA-256 before transforming anything.
3. Build only source-supported Polygon/MultiPolygon geometry. Label any
   simplification or repair as derived and record accuracy and confidence.
4. Publish descriptor, graph, geometry and reports as immutable artifacts.
5. Add the pack to the runtime and keep Postal Code -> Polygon -> Address
   Context authority separation.
6. Run the reference checker, country tests, shared runtime tests, shared UI
   tests, typecheck and diff audit.
7. Run the real browser loop and record what was actually observed.
8. Mark `m2_verified` only after all evidence and the visual path pass.

Do not copy Mexico's M2 definition, confidence, accuracy, repair rules or
licence to another country. The reusable part is the evidence and engineering
shape; the authoritative content remains country-specific.
