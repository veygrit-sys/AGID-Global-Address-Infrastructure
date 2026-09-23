# Syria (SY): no-postcode address context, M2 blocked

Reviewed on 2026-08-29 UTC against cumulative branch base
`8f9ede62c1e7b3b20dcec0299e2d14a48ac4b4d8`. This is an M1 metadata contract,
not an address dataset, postal polygon release, runtime enablement or new
repository.

## Result and country criterion

SY remains M2 unmet. The new country-specific target is
`M2_scoped_no_postcode_address_context`, defined in the
[manifest](../data/postal_country_packs/sy/postal-context/repository-manifest.json).
It requires current rights-cleared real data with declared scope, source-row
identity, Arabic source fields, edition, validity, retrieval time and SHA-256;
a reproducible transform; approved immutable data artifacts; and actual SY AGID
loader/API verification. None is supplied by this engineering change.

The exact UPU General Addressing Issues PDF lists Syria among countries where a
postcode is not required (`Universal DataBase (Sep. 2025)`). Therefore
`postalCode=null`; a missing code is not a completeness failure. P.O. boxes,
office names, routes, administrative boundaries, AGID cells and generated
regions are separate concepts. No official postal polygon was found or created.

## Sources, rights and quality boundary

The [source report](../reports/postal-context-m2/sy-source-review-2026-08-29.json)
binds four reviewed public references and two acquisition failures. Exact bytes
identify the no-postcode policy, SY member identity, the 15 February 2025 postal
entities and UPU copyright restrictions. The 2025 entities document names the
General Postal Establishment and SY-TPRA; it contains no address assignments or
geometry.

Both HTTPS and HTTP Syrian Post roots timed out without bypass. This is not
evidence that data is absent. It means current operator data, edition, licence,
coverage and terms were not verified. UPU references are policy/operator
metadata only; their copyright page does not authorize republishing source
documents. Raw bodies stay in temporary audit storage and are not committed.

There are zero validated current postal assignment rows, real address rows,
postal geometry records, administrative geometry records, explicit
address/building relations or immutable data artifacts. Address missingness,
duplicates, coverage and validity are unknown, not zero. The existing SY Postal
Forge pack is synthetic planning data and never satisfies M2.

## Authority and privacy

Postal Code -> Polygon is intentionally unavailable for SY. Independently
licensed administrative/civic geometry can support typed context but never
becomes official postal geometry. Derived or virtual regions need their own
method, accuracy and provenance. Postal office points and P.O. boxes do not
define delivery-area containment.

House number, premise and building display requires a permitted explicit source
record and relationship. Do not infer it from a locality, administrative
polygon, nearby point, transliterated name or mathematical region. Personal,
recipient, owner, occupant, customer, unit, land-rights and conflict-sensitive
precision data are outside this public AGID scope.

## Reproduction and resume

The bounded inspector verifies configured byte length, SHA-256, MIME, HTML
markers and PDF signatures. It records network failures without storing raw
bodies in Git. Recheck only after the pending-country pass and the ledger retry
date. Resume when a current official source and exact item-specific reuse/API
rights are accessible; then validate real rows and coverage, publish only to an
approved immutable destination and run the actual SY AGID integration.

No account, contract, paid source, new repository, public destination,
deployment, force push or main merge is part of this run.
