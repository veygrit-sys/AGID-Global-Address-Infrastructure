# Clipperton Island Postal Context M2 source notice

La Poste's complete official snapshot updated on 2026-08-08 contains exactly one current application-code 98901 row and one postcode 98799 row: ILE DE CLIPPERTON to 98799. Exact searches by postcode, code and name each return the same assignment. La Poste explicitly states that postcode contours are not supplied in open data. AGID therefore keeps assignment authority and geometry authority separate.

The displayed geometry is the fixed geo.api.gouv.fr administrative Polygon for 98901. The independent postcode query for 98799 returns the same single feature and exact geometry. Because the official assignment denominator has one postcode for the territory, AGID publishes that contour only as a **derived territory display surface** under Etalab Open Licence 2.0.

## Pinned evidence

- La Poste raw official CSV: sha256:f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22
- La Poste dataset metadata: sha256:1715e9fbe79c398f5619ef4b68b72a8a79c4c6491e43355288f1abee8b99ea1e
- data.gouv.fr dataset metadata: sha256:9e4ed9260b58e7c7e8e0654d794e670b8144f3e299704f0eb18e3ed3be193fa9
- La Poste exact 98799/98901 search result: sha256:276668cd0607355e35bf8abb27602857be5820b5cb8cca45426466817bcac077
- La Poste exact CLIPPERTON search result: sha256:d44b0e7964cdc9234adea99cebe356f105f44059fe9cfbc504139174ab905a75
- geo.api.gouv.fr exact 98901 feature: sha256:7ccf2420ff6b59a73b5ff2275d83758080b288ada3b8ebadec1ef7bfc8a740c8
- geo.api.gouv.fr exhaustive 98799 query: sha256:5dcb3cf3c6564be2fb53cebc5319b618540c39d9747bc5d9a6eb7e925d08dacd
- Geo API commune documentation: sha256:c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4
- Etalab Open Licence page: sha256:5c9f219a2566f7aeea5ada10df8b96131ea319853750beee06645b40cc8bdc8f
- INSEE codification and COG 2026 pages: sha256:ec23138e796e6d7256f4b3b83240af759f19a6632fefed53d01c5a6d0039ac8c and sha256:938614efb397f2ebbeb11337d44a21995154d2bfaee159fc397cb16143fb1318
- French Defense uninhabited evidence: sha256:707cf5b57e73034e2fc1e3e2f66f2a59d24ca8e6627a6f02f09635582f08b7c2
- UPU format-reference PDFs: sha256:54c80b84d6f5a7480887b8e9a1848758ddf9e91cfa899fb259e6ddea110b2ae0 and sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d

Retrieved at 2026-08-31T19:52:38.2058302Z; 15 exact receipts total 2,845,023 bytes. Raw evidence is deliberately excluded from Git.

The builder verifies 39,192 official rows, no exact duplicate, the one-row CP denominator, three equivalent La Poste searches, two equivalent Geo API lookups, one closed ring, 110 positions, Turf validity, JSTS validity, bounds [-109.234607, 10.287154, -109.19979, 10.31957], and geodesic area 8.889080340032724 km². Coordinates are not modified.

INSEE shows historical COG use of 98799 and current five-position application code 98901. Neither fact replaces La Poste as current postcode authority. UPU documents are format/identity references only. French Defense primary evidence states that the island has no inhabitants and no habitation; AGID publishes no address or building object.

Attribution: La Poste, Base officielle des codes postaux, data updated 2026-08-08; DINUM/Etalab, geo.api.gouv.fr administrative contour 98901, retrieved 2026-08-31; Etalab Open Licence 2.0.
