# GP M2 source notice

Retrieved at `2026-09-01T04:04:46.227Z`. Source and last-update attribution is required by Etalab Open Licence 2.0. Raw evidence is deliberately excluded from Git; the reproducible build report records all 40 exact bodies, 3,663,819 bytes and SHA-256 values.

## Official postal assignment

- La Poste, *Base officielle des codes postaux*, data update `2026-08-08`, 39,192 rows.
- Raw CSV SHA-256: `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`.
- Dataset metadata SHA-256: `b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65`.
- data.gouv.fr metadata SHA-256: `c42a15c49ea9591e66270d0a6dad43e2b947c8e29a9013466f03ddd9514d6b08`.
- Complete GP denominator: 38 INSEE 971xx rows, 33 distinct postal codes and 32 distinct commune codes. Multiple Ligne 5 rows are retained in evidence but do not create extra postal areas.
- Same-prefix exclusions: `97133/97701` remains BL and `97150/97801` remains MF.

## Administrative geometry used as derived display context

- `geo.api.gouv.fr` department 971 response SHA-256: `b307845f32aa358bad7df3b2219e3029329748598aa02e52d47656da98ab26db`.
- Commune API documentation SHA-256: `c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4`.
- INSEE COG 2026 Guadeloupe page SHA-256: `0c331ecfc4f70632d09da63d70f13bac9717df52d324ecd31ee0698a16804ad4`.
- Open Licence page SHA-256: `86a7ee68dd19febfe782f8f3081ade6eedd8911044d6784355fa13ac456100f2`.
- All 33 postcode-query receipt digests are listed in `reports/postal-context-m2/gp-current-postcodes-2026-09-01.json`.

La Poste states that postal-code contours are not provided in open data. The coordinates are therefore published only as **derived commune display surfaces**. They were copied without geometric modification after exact postcode-to-INSEE equality checks. `97139/97142` share Les Abymes; four multi-Ligne-5 groups keep one whole-commune surface. No distinct sub-commune or Ligne 5 boundary is inferred.

This release makes no claim about official postal perimeters, legal/survey/cadastral boundaries, delivery zones, deliverability, addresses, buildings, parcels, people, customers or land rights.
