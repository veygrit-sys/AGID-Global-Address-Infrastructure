# Falkland Islands Postal Context M2 source notice

This pack combines two separately authorised facts. The Falkland Islands UPU addressing sheet states that `FIQQ 1ZZ` is the single postcode for the whole territory; that copyrighted material is reference-only and its bytes are not redistributed. The August 2026 UPU general table prints `F1QQ 1ZZ`; current Falkland Islands Government and GOV.UK pages corroborate `FIQQ 1ZZ`, so AGID records the conflicting table glyph as an exception and rejects it during normalization.

geoBoundaries gbOpen supplies a reusable FLK ADM0 MultiPolygon under CC BY 4.0. AGID uses it only as a **derived whole-territory display surface**, never as an official postal, legal, survey, cadastral or delivery boundary. FK remains its own source identity and is not merged with another country or territory.

## Pinned evidence

- UPU General Addressing Issues, Universal POST*CODE DataBase, August 2026: `sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`
- UPU Falkland Islands addressing sheet, 08/2005: `sha256:315549e7306f606adf348c33bc2abaf3e474001e9a4146138b5e829f7d353a5d`
- geoBoundaries current API metadata for `FLK-ADM0-20895774`: `sha256:6795f219b8a91e91377b14c6484adc02fe1b085eb7bed5127c24797c6add1163`
- Fixed simplified geoBoundaries GeoJSON at commit `9469f09592ced973a3448cf66b6100b741b64c0d`: `sha256:4f584a9a08910fe7b3dd3fd7f279f84928646c37045ec3d199c184093b3c231b`
- Creative Commons Attribution 4.0 legal code: `sha256:6d55b998ed5c54f43426d059a8c549ed58a3321e5463e6a6af1c6b56ab78c333`
- Current Falkland Islands Government service contacts: `sha256:b07d24fe39f2c582c7d3634968187c5ad17ee1b7b14facb69a6562302ab632fb`
- Current GOV.UK Governor's Office contact: `sha256:27e775bd2ff15d05faa4b8d86449989f969bac983eff36f1c085084aef07ddd2`

Retrieved at `2026-09-01T01:11:41.684Z`. Raw evidence is deliberately excluded from Git. The generated graph, geometry, descriptor and build report are reproducible from the fixed geoBoundaries URL; the UPU conclusions and current-page corroboration are verified by digest and are not copied into a distributable source dataset.

The source MultiPolygon contains 394 parts and 16,194 positions. It excludes water through 488 interior rings containing 2,944 positions. One of those rings touches its outer ring and the shared AGID runtime rejects that topology even though Turf and JSTS accept the source. Because `FIQQ 1ZZ` covers the whole territory rather than only land-cover pixels, the builder reproducibly omits every interior water-exclusion ring, preserves all 394 source outer rings and all 13,250 outer-ring positions, and records the resulting 114.45298678976631 km² interior-water fill. It then deterministically places source parts `222`, `348` and `383` in a second MultiPolygon because Turf reports source conflict pairs `155/348`, `221/222` and `382/383`; filling interior water exclusions additionally exposes `150/348`, `169/348` and `179/348`, all resolved by the same partition. Both output MultiPolygons pass the shared AGID topology validator, Turf and JSTS. No output coordinate is invented.

Attribution: © geoBoundaries, William & Mary geoLab, `FLK-ADM0-20895774`, CC BY 4.0. Source material describes a 2021 boundary generated from ESA Sentinel-2 10 m Land Cover data, built on 2023-12-12.
