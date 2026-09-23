# Turks and Caicos Islands Postal Context M2 source notice

The Universal Postal Union 10/2025 Turks and Caicos Islands sheet defines `TKCA 1ZZ` as the single postcode for the whole territory. The UPU material is reference-only and its bytes and contact details are not redistributed.

The Turks and Caicos Islands Government Data Portal publishes the Department of Environment and Coastal Resources 2020 shoreline and land-extent GeoJSON and declares Creative Commons Attribution Share-Alike. AGID uses it only as a **derived whole-territory display surface**, never as an official postal, legal, survey, cadastral or delivery boundary.

## Pinned evidence

- UPU Turks and Caicos Islands addressing sheet, 10/2025, 176,872 bytes: `sha256:81411e006295b278736bdde53996cfcfa193ee3b27f6ea9b6764ef5f7f19cb48`
- UPU General Addressing Issues, August 2026, 631,050 bytes: `sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`
- Government CKAN `package_show`, package `2dcdda81-48c8-4135-b233-c70e34b9c432`, 7,056 bytes: `sha256:15f214ae2c43e62f6aa514b1f94373c1a5a7e2d27d6fbfaeadeea4e03c5bd1f7`
- Government GeoJSON resource `df348511-c995-413c-ac79-cf8b99e16ff2`, 11,623,218 bytes: `sha256:92a1fc68840bd3bd049e10e262610db31e92cb77e693b078dd74a1824149ba94`

Retrieved at `2026-09-02T08:30:58.215Z`. Raw source data is not committed; evidence bytes are deliberately excluded from Git.

Population and historical-population attributes are excluded together with addresses, buildings, parcels, recipients, customers and land-rights data.

The fixed source contains 861 MultiPolygon features, 871 closed rings and 253,775 positions. Source index 716 / OBJECTID 717 is invalid under JSTS and is repaired with buffer(0). Five features have no OBJECTID and OBJECTID 853 occurs three times, so the reproducible fixed source index is the primary source reference. Features are dissolved by the 27 source Region values, except that the 14 Grand Turk features remain separate because their dissolved geometry fails Turf validity. A topology-preserving simplification tolerance of 0.0005 degrees yields 39 valid output MultiPolygons, 857 rings and 7,838 positions. Source index 101 / OBJECTID 102 collapses to a zero-area ring at that declared tolerance and is omitted rather than expanded or fabricated. The output area differs from the repaired-source area by 0.0641%; output accuracy is conservatively reported as 60 metres and confidence 0.90. The 39 source-aligned surfaces are deterministically packed into two Turf/JSTS-valid runtime MultiPolygon features (20 and 19 surfaces) so the real API returns the complete area within its existing response limit.

Attribution: Turks and Caicos Islands Government, Department of Environment and Coastal Resources, *Shoreline and land exent of Turks and Caicos, 2020*, CC BY-SA as declared by the official Data Portal. The portal does not identify a licence version; AGID retains the unversioned declaration instead of inventing one.
