# GS M2 source notice

`SIQQ 1ZZ` is the single postcode for the whole territory according to the UPU August 2026 Universal POST*CODE DataBase (`sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`) and the country sheet dated 08/2005 (`sha256:b301ba2e6f28548adcb193cda244c07e0003ec7be209913c9acea6a02ebcd928`). UPU bytes are not redistributed.

The real display geometry is derived from BAS dataset “Vector polygons of the Sub-Antarctic coastline”, edition 1.0, DOI `10.5285/c1d83502-8799-4e3c-bdca-21db6a4405d4`. The fixed Shapefile archive is 1,267,481 bytes with `sha256:27b4cd2085b9c845abf7928c336cf82f0d37492bbe2c21522ac4c670750f6cff`. Its lineage says South Georgia and the South Sandwich Islands are taken from the South Georgia GIS. South Georgia GIS and the BAS dataset use CC BY 4.0; attribution is “South Georgia GIS, accessed 2026; Gerrish, L. (2020), BAS/UK Polar Data Centre.”

The reproducible command filters `source='South Georgia GIS'`, transforms EPSG:3031 to EPSG:4326 without coordinate rounding or simplification, and produces a 4,205,021-byte intermediate with `sha256:5da93ae838fbdb0ad216a946e492391c5cdf8176c9b00eea49e0a0f4cd5aa1f8`. The builder preserves all 357 polygon parts and 90,610 reprojected positions exactly once, then partitions them at the empty longitude gap `-30` into South Georgia and South Sandwich Islands derived whole-territory display surfaces.

These are not official postal, legal, survey, cadastral or delivery boundaries. No address, building, route, P.O. box, organization, parcel, recipient, customer or land-right record is included. Raw source and reference bodies are deliberately excluded from Git.
