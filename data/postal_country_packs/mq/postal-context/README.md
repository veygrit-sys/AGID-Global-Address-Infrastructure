# Martinique Postal Context M2 pack

This real, non-synthetic pack covers all 30 current MQ postal codes proven by 38 official La Poste rows, 34 INSEE 972xx communes and 35 distinct postcode/commune pairs. Each pair joins exact official assignment identity to fixed COG 2026 `geo.api.gouv.fr` administrative geometry.

Geometry is **derived administrative display context**, never an official postal boundary. `97218`, `97222` and `97250` return multiple unmodified commune surfaces; no union is fabricated. `97200/97234` share Fort-de-France. `97215`, `97230` and `97231` retain Ligne 5 labels without invented internal boundaries. No address, building, parcel, recipient, customer, delivery or land-rights record is included.

Rebuild from the 37 hash-pinned evidence bodies held outside Git:

```text
node scripts/build-postal-context-mq-m2.mjs <source-directory> data/postal_country_packs/mq/postal-context/m2 reports/postal-context-m2/mq-current-postcodes-2026-09-01.json
```
