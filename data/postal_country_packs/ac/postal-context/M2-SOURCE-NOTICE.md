# Ascension Island Postal Context M2 source notice

The Universal Postal Union states that `ASCN 1ZZ` is the single postcode for the whole Ascension territory. Those copyrighted reference bytes are not redistributed. geoBoundaries gbOpen supplies a reusable SHN ADM0 MultiPolygon under CC BY 4.0; AGID extracts only the three unchanged parts inside the strict Ascension coordinate envelope and uses them as a **derived whole-territory display surface**, never as an official postal, legal, survey, cadastral or delivery boundary.

## Pinned evidence

- UPU General Addressing Issues, Universal POST*CODE DataBase, August 2026: `sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`
- Current UPU AC designated-operator record: `sha256:3c629d24e62ee49011443fe7837aa6e82d01d02c885cafd5a0b5c0e9721aa2de`
- Ascension Island Government Post Office page: `sha256:792255d2e67deaae03e901f1dfde1e1f377eeb3e73c926c6a38387c650aed618`
- Ascension Island Government 15 January 2026 letterhead using `ASCN 1ZZ`: `sha256:3f0ac7d72e664817228140ed80614c8a9f2cd6c5d2e6dc2d623c4d348adc4bf1`
- geoBoundaries metadata for `SHN-ADM0-31036641`: `sha256:af9be7966b25c1bbf925d91c7d9438752f85703cc74ad72652e637311dbe5f84`
- Fixed geoBoundaries GeoJSON at commit `9469f09592ced973a3448cf66b6100b741b64c0d`: `sha256:94c9e525d8f9c12fc1f643f8c61b5f03323587e10d01b8c3109269b4349aa27e`
- Creative Commons Attribution 4.0 legal code: `sha256:6d55b998ed5c54f43426d059a8c549ed58a3321e5463e6a6af1c6b56ab78c333`

Retrieved at `2026-09-02T18:44:27.714Z`. Raw reference and source downloads remain outside Git. The generated graph, geometry, descriptor and build report are reproducible from the fixed geoBoundaries URL.

The source MultiPolygon has 47 parts and 7,854 positions spanning Saint Helena, Ascension and Tristan da Cunha. Only source parts `44`, `45` and `46` fall within longitude `(-15, -14)` and latitude `(-9, -7)`. The builder preserves their 1,261 positions exactly. Turf detects a contact between parts `44` and `46`, so part `44` is emitted separately from parts `45` and `46`. Both output MultiPolygons pass Turf and JSTS validation and their combined area equals the selected source parts exactly.

Attribution: © geoBoundaries, William & Mary geoLab, `SHN-ADM0-31036641`, CC BY 4.0. Source material describes a 2021 boundary generated from ESA Sentinel-2 10 m Land Cover data, built on 2023-12-12. Use of the SHN geometry container does not merge AC identity or import the Saint Helena or Tristan da Cunha parts.
