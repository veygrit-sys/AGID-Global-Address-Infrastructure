# DR Congo Postal Context contract

This metadata-only contract records the current seven-digit SCPT system and the exact conditions that still block M2. It contains no raw SCPT rows, real addresses, people, source dumps or production geometry.

The country gate in `src/lib/postalContextDrCongoQuality.ts` normalizes seven digits and rejects non-area geometry, wrong granularity, unrelated features, assignment/name/location mismatch, invalid topology, incompatible rights and unreviewed model sources. Hugging Face/libpostal is a parser-evaluation candidate only; it is not postal authority.

Current SCPT API references `1004131` to source row ID 175 (Résidentiel, Limete, Kinshasa) and `3202011` to source row ID 1160 (Bulungu, Kwilu). Those public examples are evidence in the temporary digest-bound inspection, not bundled rows. No exact postal Polygon/MultiPolygon passed, so no CD descriptor, API success or translucent postal overlay is published.
