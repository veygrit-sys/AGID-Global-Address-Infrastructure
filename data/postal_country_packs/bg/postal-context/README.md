# Bulgaria Postal Context pack

This directory keeps BG source and authority contracts. It contains no raw Bulgarian Posts, Eurostat GISCO, GRAO, AGCC or NSI rows and no production geometry.

The country target is `M2_current_assignment_and_rights_cleared_postal_area_visualization`. The 2026-08-29 review remains blocked: the Bulgarian Posts open-data catalog exposes a CC0 2020 locality/postcode release, while the exact GISCO 2025 evidence contains 4,880 postcode **Point** features and no Polygon/MultiPolygon. Points, locality/admin units, buffers, Voronoi/model output and AGID cells are never presented as postal areas.

Temporary source bytes stay outside Git. Re-run the exact-byte audit with:

```text
npm run postal-context:m2:audit:bg
npm run postal-context:m2:verify:bg
npm run verify:postal-context-bulgaria
```

M2 requires a current complete assignment, explicit area evidence or complete permitted member relation, a published immutable artifact, and the real BG loader/API/app search-to-translucent-area path. House numbers and buildings require separate permitted stable relations.
