# Saint Martin Postal Context M2 source notice

La Poste's complete official snapshot updated on 2026-08-08 contains exactly one 978-prefix commune row and one 97150 row: 97801 ST MARTIN to 97150. La Poste explicitly states that postcode contours are not supplied in open data. AGID therefore keeps assignment authority and geometry authority separate.

The displayed geometry is the fixed geo.api.gouv.fr administrative MultiPolygon for 97801. The independent postal-code query for 97150 returns the same single feature and equivalent geometry. Because the official assignment denominator has one postcode for the collectivity, AGID publishes that contour only as a **derived collectivity display surface** under Etalab Open Licence 2.0.

## Pinned evidence

- La Poste raw official CSV: sha256:f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22
- La Poste dataset metadata: sha256:b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65
- data.gouv.fr dataset metadata: sha256:453a8cd0168191503ae7e949f89523206d921ab67c67370f3a6fd97fc3da45a2
- geo.api.gouv.fr exact 97801 feature: sha256:a9bb4fe9659f892b9e4261de5a7f397302f7b221a8eab0f9fd523303b995c483
- geo.api.gouv.fr exhaustive 97150 query: sha256:63c17509fd85d75e220878e17157d5361af4beed91b035d8308c2db5c841c26f
- Geo API commune documentation: sha256:c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4
- Etalab Open Licence page: sha256:dc47285333558593b1d0d163c9ca52708503419af0e99e3204a93b7f1eb9e821

Retrieved at 2026-09-01T12:10:26.118Z; exact receipts total 1,844,285 bytes. Raw evidence is deliberately excluded from Git.

The builder verifies 39,192 official rows, no exact duplicate, the one-row MF denominator, two equivalent Geo API lookups, 11 polygon parts, 11 closed rings, 2,136 positions, Turf validity, JSTS validity, bounds [-63.15332, 18.045903, -62.970711, 18.125195], and area 53.649431807733244 km². The API surface value is 5,376.96 ha (53.7696 km²); the small difference is attributable to calculation or projection method and is disclosed rather than silently altered.

Attribution: La Poste, Base officielle des codes postaux, data updated 2026-08-08; DINUM/Etalab, geo.api.gouv.fr administrative contour 97801, retrieved 2026-09-01; Etalab Open Licence 2.0.
