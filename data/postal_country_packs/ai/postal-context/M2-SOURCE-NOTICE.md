# Anguilla Postal Context M2 source notice

This pack combines two separately authorised facts. The Universal Postal Union states that `AI-2640` is the single postcode for the whole territory; that copyrighted material is reference-only and its bytes are not redistributed. geoBoundaries gbOpen supplies a reusable AIA ADM0 MultiPolygon under CC BY 4.0; AGID uses it only as a **derived whole-territory display surface**, never as an official postal, legal, survey, cadastral or delivery boundary.

## Pinned evidence

- UPU General Addressing Issues, Universal POST*CODE DataBase, August 2026: `sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`
- UPU Anguilla addressing sheet, 09/2017 (corroborated by the August 2026 database): `sha256:6c7d3ec9cad17c159e4b66d85e319bbef9518edab4f1fde6f2a4bf136b9c8218`
- geoBoundaries metadata for `AIA-ADM0-96724787`: `sha256:6ec9728fead92e98c1d5f185e9548e5478cc9b9a599736ba628f6f89275d474b`
- Fixed geoBoundaries GeoJSON at commit `9469f09592ced973a3448cf66b6100b741b64c0d`: `sha256:6fa5dff75ac3ab9d8064c46a5b6ec1d4e307e67d033d100f0a4a6f4b3aac1237`
- geoBoundaries API documentation: `sha256:b60cb9a2de8e2a1bcd82b1c53264de665a1c5f0e6a66b66c3c8206d10bd3baff`
- Creative Commons Attribution 4.0 legal code: `sha256:6d55b998ed5c54f43426d059a8c549ed58a3321e5463e6a6af1c6b56ab78c333`

Retrieved at `2026-08-31T06:30:16.139Z`. Raw evidence is deliberately excluded from Git. The generated graph, geometry, descriptor and build report are reproducible from the fixed geoBoundaries URL; the UPU conclusions are verified by digest and are not copied into a distributable source dataset.

The source MultiPolygon contains 28 parts and 10,606 positions. The builder preserves every coordinate and deterministically places source parts `5`, `15` and `19` in a second MultiPolygon because Turf reports cross-part overlap pairs `4/5`, `6/15` and `18/19`. Both output MultiPolygons pass Turf and JSTS validity checks and their combined area equals the source area within the recorded tolerance.

Attribution: © geoBoundaries, William & Mary geoLab, `AIA-ADM0-96724787`, CC BY 4.0. Source material describes a 2021 boundary generated from ESA Sentinel-2 10 m Land Cover data, built on 2023-12-12.
