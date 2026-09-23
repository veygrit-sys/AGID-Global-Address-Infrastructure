# FO Postal Context pack

The `m2` directory contains the non-synthetic Faroe Islands Postal Context
release built from the pinned Umhvørvisstovan `Postnr` layer. Search keys are
canonical three-digit strings; `FO-NNN` is accepted at the application boundary
and normalized to `NNN`.

The release contains 117 postal-area features. Of these, 116 retain official
geometry and postcode `476` is an explicitly derived topology repair. Raw
provider downloads are deliberately excluded. See `M2-SOURCE-NOTICE.md` and
the country evidence report for rights, hashes, transformation and validation.

No address, building, recipient, customer, occupant, owner or land-right data
is included. Posta service and deliverability are not inferred from the mapped
postal area.
