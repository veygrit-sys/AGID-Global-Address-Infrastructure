# France M2 source and reuse notice

## Published scope

This pack contains 20 derived display surfaces for postal codes `75001` to
`75020`. Each is an exact join from one La Poste postal-code/INSEE relation to
the corresponding Paris municipal-arrondissement administrative contour. The
surface is not an official La Poste postal boundary and the pack is not a
national France release.

## Official postal assignment

- Provider: La Poste.
- Dataset: Base officielle des codes postaux.
- Catalogue: <https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux>.
- Resource ID: `008a2dda-2c60-4b63-b910-998f6f818089`.
- Raw URL: <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/raw>.
- Data Fair metadata update: `2026-08-08T07:04:29.824Z`.
- Snapshot: 1,555,485 bytes, 39,192 rows, 6,328 distinct postal codes,
  35,007 distinct commune codes.
- SHA-256: `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`.

La Poste states that this base maps postal codes to INSEE commune codes and
does not provide open postal-code contours. Assignment authority therefore
does not transfer to geometry.

## Official administrative geometry

- Provider: Etalab / API Découpage administratif, exposed in La Poste Data
  Fair as `_contours_commune.geometry`.
- API: <https://geo.api.gouv.fr/decoupage-administratif/communes>.
- Exact-query service:
  <https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/lines>.
- Snapshot: 20 individual exact queries for `75001`-`75020`, each returning
  exactly one matching INSEE row and one MultiPolygon.
- File-name-order aggregate SHA-256:
  `76d9f52e38386339a15d3becc6f4ed6eb3605af3cb82669cea772feb8fd586ec`.

Individual response IDs, byte lengths and SHA-256 values are preserved in
`reports/postal-context-m2/fr-build-2026-08-30.json`.

## Licence and attribution

Both published inputs are under Etalab Open Licence 2.0:
<https://www.etalab.gouv.fr/wp-content/uploads/2017/04/ETALAB-Licence-Ouverte-v2.0.pdf>.
The licence permits reproduction, redistribution, adaptation, commercial and
non-commercial use, subject to attribution of the source and latest update.
The captured PDF SHA-256 is
`1c721702ef459d935f2d097fec4a81d5f9dd258477c92b0857dd8f1d9cdc2909`.

Attribution:

> La Poste — Base officielle des codes postaux, latest source update
> 2026-08-08; Etalab / API Découpage administratif contours; Licence Ouverte
> 2.0. Retrieved 2026-08-30.

This pack does not imply endorsement by La Poste, Etalab, DINUM, IGN, or any
public authority.

## Transform and limitations

`scripts/build-postal-context-fr-m2.mjs` decodes the geometry JSON string,
requires exact postcode and INSEE equality, sorts by postal code, validates
closed rings, coordinate bounds and boolean validity, and publishes the
source-identical coordinates as a `derived` postcode display surface. It does
not alter coordinates or generate a missing area.

No address, building, parcel, recipient, customer, occupant, deliverability,
legal boundary, land right, overseas-territory row, or Monaco row is included.
Raw source downloads are audit-only and are not committed.
