# @agid/addressql

AddressQL query contracts, the privacy-bounded practical API, database adapter
surfaces, multilingual policy, and client SDK exports.

The workspace bridge also exports the versioned official place-name catalog,
country/hierarchy holdout evaluator, and official-alias-first candidate ranker
under `officialPlaceNames`.

Country data stays in `@agid/country-data`; AGID geometry stays in
`@agid/core`. AddressQL consumes their versioned public contracts and does not
turn format validation into a delivery guarantee.

The `deliveryPointDecision` export exposes the signed, commitment-only L5
carrier decision contract. L4 delivery-area validation remains available
through `practicalApi` and does not imply an L5 delivery-point result.

The `postalOperations` export builds aggregate-only source freshness,
correction SLA, and country promotion or demotion reports. Reports are
advisory and never enable a country capability.
