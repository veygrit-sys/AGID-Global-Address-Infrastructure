# Ascension Island Postal Context M2

## Result

AC reaches `M2_current_upu_whole_territory_derived_visualization` with one official postal assignment and two real, derived `MultiPolygon` display surfaces. `ASCN 1ZZ` is normalized through the shared API and app; the result links the postal object `postal-ac-ascn-1zz`, country object `country-ac`, evidence assertion, both geometry feature IDs, the pinned release and source provenance.

This is not an official postal polygon. The UPU's August 2026 Universal POST*CODE DataBase says that `ASCN 1ZZ` is the single postcode for the whole territory. That fact permits a whole-territory display interpretation, while geometry comes separately from a fixed CC BY 4.0 geoBoundaries source and remains labelled `derived`.

## Sources and rights

- UPU General Addressing Issues / Universal POST*CODE DataBase, August 2026: official assignment and whole-territory scope; reference only, not redistributed; `sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`.
- UPU Ascension member record: AC identity and designated operator; reference only; `sha256:3c629d24e62ee49011443fe7837aa6e82d01d02c885cafd5a0b5c0e9721aa2de`.
- Ascension Island Government Post Office page and 15 January 2026 government letterhead: current service/use corroboration; reference only; `sha256:792255d2e67deaae03e901f1dfde1e1f377eeb3e73c926c6a38387c650aed618` and `sha256:3f0ac7d72e664817228140ed80614c8a9f2cd6c5d2e6dc2d623c4d348adc4bf1`.
- geoBoundaries gbOpen `SHN-ADM0-31036641`, fixed commit `9469f09592ced973a3448cf66b6100b741b64c0d`: geometry provenance container under CC BY 4.0; `sha256:94c9e525d8f9c12fc1f643f8c61b5f03323587e10d01b8c3109269b4349aa27e`.

All sources were retrieved at `2026-09-02T18:44:27.714Z`. Raw source bytes are not committed. Exact URLs, sizes, hashes, editions, rights decisions and prohibited claims are in `data/postal_country_packs/ac/postal-context/source-profile.json` and `M2-SOURCE-NOTICE.md`.

## Reproducible transform and quality

The fixed SHN source contains 47 parts and 7,854 positions. A strict Ascension envelope selects only source parts 44, 45 and 46. Saint Helena and Tristan da Cunha remain excluded, and the SHN source identity is never merged into AC.

The selected parts contain 1,261 positions and total `96.58210569103102 km²`. The builder changes no coordinate and emits part 44 separately from parts 45+46 because Turf detects contact between source parts 44 and 46. The two output `MultiPolygon` features both pass Turf and JSTS validity checks. Their combined bounds are `[-14.420263125670147, -7.992611073283626, -14.294916449140885, -7.88966415023782]`; output area equals input area exactly.

Rebuilding into a separate directory produced byte-identical graph, geometry and descriptor hashes:

- descriptor: `sha256:6b0e08e1c8e461e7fee847cc06ea13e5f0f8abc1cb9a5a2ade8bd258c67537e1`
- graph: `sha256:7d802a30bed1c4f902c3306c47fb073c5a802c841e79b0c5f47d5ed9ce488e6d`
- geometry: `sha256:6230a073ba21ea2364b16335e162cfc7e412cf4d62503408273e317afb5943ac`

## API and app verification

The actual development app was started on an isolated port with the AC descriptor explicitly pinned. Its capabilities endpoint reported AC `ready`, one postal code, two nodes, one assertion, two geometries, externally pinned integrity and no excluded geometry.

Playwright Chromium then drove the actual search UI with country `AC` and full-width `ＡＳＣＮ １ＺＺ`. Only place-search discovery was stubbed; `/api/v1/postal/AC/ASCN%201ZZ`, the stored geometry, MapLibre layer installation, fit, clear and re-search used the live application route. Three live postal responses returned HTTP 200. The map mounted, the notice displayed both `MultiPolygon` IDs, `derived`, confidence `0.91`, source/date/licence/digest, postal-to-geometry chains, country ID, assertion ID and pinned release. Clear removed the area and compact `ASCN1ZZ` re-search restored it.

The in-app browser could not initialize because of a Windows ACL sandbox error. This is recorded verbatim in the browser report. A deterministic Chromium run and screenshots were used instead; no human manual visual inspection is claimed. The fitted screenshot is `reports/postal-context-m2/ac-browser-visual-2026-09-03.png`; the cleared comparison is `reports/postal-context-m2/ac-browser-cleared-2026-09-03.png`.

Ancillary nearest-postcode, building-name and Overpass requests returned 404/503/400 during the browser run. They are separate from the Postal Context route and are retained in the report. No address or building relationship was inferred from them.

## Authority boundary

Postal Code → Polygon → Address Context remains separated. The UPU assertion has `geometryAuthority: none`; the geometry has `assignmentAuthority: derived_spatial_assignment` and `geometryAuthority: derived_geometry`. No address, street, building, parcel, PO box, recipient, customer, land right, delivery entitlement or SHN identity is added. More detailed address/building display requires a separate rights-cleared identity and explicit relation.

## Evidence

- `reports/postal-context-m2/ac-current-whole-territory-2026-09-03.json`
- `reports/postal-context-m2/ac-browser-validation-2026-09-03.json`
- `src/lib/postalContextAscensionIslandRepository.test.ts`
- `src/lib/postalContextAscensionIslandM2Topology.test.ts`
- `src/server/routes/postalContextAscensionIslandM2Routes.test.ts`
- `scripts/build-postal-context-ac-m2.mjs`
- `scripts/verify-postal-context-ac-browser.mjs`
