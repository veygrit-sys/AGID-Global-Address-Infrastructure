# Saint Barthélemy Postal Context

The complete La Poste snapshot updated on 2026-08-08 contains one Saint-Barthélemy assignment: INSEE 97701 maps to postal code 97133. The committed M2 artifact contains one postal node, one official assignment assertion, and one real derived MultiPolygon display feature from the matching fixed geo.api.gouv.fr response.

Rebuild from the seven exact raw evidence bodies kept outside Git:

    node scripts/build-postal-context-bl-m2.mjs <source-directory> data/postal_country_packs/bl/postal-context/m2 reports/postal-context-m2/bl-current-single-postcode-2026-08-31.json

No raw source body, address, building, parcel, recipient, customer or land-rights data is stored here. The map surface is derived administrative context and must not be presented as an official postal, legal, survey, cadastral or delivery boundary.
