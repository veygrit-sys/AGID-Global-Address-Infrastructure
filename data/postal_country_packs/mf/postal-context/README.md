# Saint Martin Postal Context

The complete La Poste snapshot updated on 2026-08-08 contains one Saint-Martin assignment: INSEE 97801 maps to postal code 97150. The committed M2 artifact contains one postal node, one official assignment assertion, and one real derived MultiPolygon display feature from the matching fixed geo.api.gouv.fr response.

Rebuild from the seven exact raw evidence bodies kept outside Git:

    node scripts/build-postal-context-mf-m2.mjs <source-directory> data/postal_country_packs/mf/postal-context/m2 reports/postal-context-m2/mf-current-single-postcode-2026-09-01.json

No raw source body, address, building, parcel, recipient, customer or land-rights data is stored here. The map surface is derived administrative context and must not be presented as an official postal, legal, survey, cadastral or delivery boundary.
