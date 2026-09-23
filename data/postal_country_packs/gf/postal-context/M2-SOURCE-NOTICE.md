# GF M2 source notice

Retrieved at `2026-09-01T02:54:50.355Z`. Source and last-update attribution is required by Etalab Open Licence 2.0. Raw evidence is deliberately excluded from Git; the reproducible build report records all 32 exact bodies, 6,473,543 bytes and SHA-256 values.

## Official postal assignment

- La Poste, *Base officielle des codes postaux*, data update `2026-08-08`, 39,192 rows.
- Raw CSV SHA-256: `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`.
- Dataset metadata SHA-256: `b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65`.
- data.gouv.fr metadata SHA-256: `c42a15c49ea9591e66270d0a6dad43e2b947c8e29a9013466f03ddd9514d6b08`.
- Complete denominator: 25 distinct `973` codes, 22 distinct commune codes, no duplicate row.

## Administrative geometry used as derived display context

- `geo.api.gouv.fr` department 973 response SHA-256: `d4fba56670e484cdbed767862263b959546d6aa515ea9fc5690a3c500ad9b724`.
- Commune API documentation SHA-256: `c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4`.
- INSEE COG 2026 Guyane page SHA-256: `61672057759d4ab6c9157eb5ca3914bdd4a236662adde1aad16747aedd18f227`.
- Open Licence page SHA-256: `85c8dd8ecfeb60531069a9e8e6208946778360fcb925673b1de39a20bd3d309c`.
- All 25 postcode-query receipt digests are listed in `reports/postal-context-m2/gf-current-postcodes-2026-09-01.json`.

La Poste states that postal-code contours are not provided in open data. The coordinates are therefore published only as **derived commune display surfaces**. They were copied without geometric modification after exact postcode-to-INSEE equality checks. `97311/97352`, `97318/97360` and `97353/97390` share their commune surface; no distinct sub-commune boundary is inferred.

This release makes no claim about official postal perimeters, legal/survey/cadastral boundaries, delivery zones, deliverability, addresses, buildings, parcels, people, customers or land rights.
