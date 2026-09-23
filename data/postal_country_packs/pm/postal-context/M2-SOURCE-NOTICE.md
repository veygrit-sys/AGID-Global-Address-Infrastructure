# PM M2 source notice

Observed at `2026-09-01T19:06:03.583Z`. Raw evidence is deliberately
excluded from Git; the builder accepts only these exact SHA-256 receipts.

## Official assignment

La Poste, *Base officielle des codes postaux*, data updated 2026-08-08,
39,192 rows, Etalab Open Licence 2.0.

- CSV: `f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22`
- dataset metadata: `b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65`
- data.gouv metadata: `453a8cd0168191503ae7e949f89523206d921ab67c67370f3a6fd97fc3da45a2`

The complete snapshot has exactly three PM rows: two routing-line variants
for `97501 MIQUELON LANGLADE` and one for `97502 ST PIERRE`; all are
assigned to `97500`. La Poste also states that open postcode contours are
not supplied.

## Derived display geometry

The current geo.api.gouv.fr commune responses, also Open Licence 2.0, are:

- 97501: `baf289ef9c951d28bb8e902b81bc0be21b23cc7c7db1377a72ed6d7974c265b1`
- 97502: `cdd11e84eb7dbd892a3a864540cb60327c577a162715da9df8be8e1139942902`
- 97500 cross-check: `c32727b4d867d974a10ac19aba25e24591368f203e6a1a70013dae43a5ada790`
- API documentation: `c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4`
- licence: `055988f69abf3c34d29ecd026b0156e66ea8edc20a894938fc376ea11fc30993`

The 97500 query returns exactly the same two features as the code-specific
responses. Their 78 MultiPolygon parts are concatenated in stable 97501 then
97502 order without union, dissolve, interpolation or coordinate change.
Turf measures `219.09697358099386 km²`; the API attribute sum is
`219.5875 km²`. The difference is retained and disclosed because the API
surface attribute and Turf geodesic calculation use different methods.

This is derived administrative display context, never an official postal,
legal, survey, cadastral or delivery boundary. It proves no address,
building, parcel, recipient, customer, deliverability or land right.
