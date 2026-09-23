# Saint Barthélemy Postal Context M2 source notice

La Poste's complete official snapshot updated on 2026-08-08 contains exactly one 977 commune row and one 97133 row: 97701 ST BARTHELEMY to 97133. La Poste explicitly states that postcode contours are not supplied in open data. AGID therefore keeps assignment authority and geometry authority separate.

The displayed geometry is the fixed geo.api.gouv.fr administrative MultiPolygon for 97701. The independent postal-code query for 97133 returns the same single feature and equivalent geometry. Because the official assignment denominator has one postcode for the collectivity, AGID publishes that contour only as a **derived collectivity display surface** under Etalab Open Licence 2.0.

## Pinned evidence

- La Poste raw official CSV: sha256:f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22
- La Poste dataset metadata: sha256:1715e9fbe79c398f5619ef4b68b72a8a79c4c6491e43355288f1abee8b99ea1e
- data.gouv.fr dataset metadata: sha256:5d4bc801437980e23b550903832097ac39ba0994dd37d83a80dfc1e83e2b1311
- geo.api.gouv.fr exact 97701 feature: sha256:c533f3763f6157fd8c6591da66f79309b0d7983dc452782529febf561bc20b4d
- geo.api.gouv.fr exhaustive 97133 query: sha256:1f85da8a2f7a5d9882cb920c5cc18dfaf723689badb80ea4e481b6eac2b1de62
- Geo API commune documentation: sha256:c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4
- Etalab Open Licence page: sha256:6ec2b985b8f4585dd33f3ff4f3772379db2a1e3ab9945a83b5d976909379bc1c

Retrieved at 2026-08-31T10:26:19.045Z; exact receipts total 1,879,646 bytes. Raw evidence is deliberately excluded from Git.

The builder verifies 39,192 official rows, no exact duplicate, the one-row BL denominator, two equivalent Geo API lookups, 21 polygon parts, 21 closed rings, 2,912 positions, Turf validity, JSTS validity, bounds [-62.926554, 17.870779, -62.789086, 17.974092], and area 20.439471117282295 km². The API surface value is 2048.52 ha (20.4852 km²); the small difference is attributable to calculation or projection method and is disclosed rather than silently altered.

Attribution: La Poste, Base officielle des codes postaux, data updated 2026-08-08; DINUM/Etalab, geo.api.gouv.fr administrative contour 97701, retrieved 2026-08-31; Etalab Open Licence 2.0.
