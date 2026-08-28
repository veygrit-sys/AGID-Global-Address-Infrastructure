# United Arab Emirates Postal Context contract

Stage: **M1_metadata**, not M2. This directory contains no real address records,
postal polygons, subscriber data or deployed runtime pack. The repository name
in the manifest is a proposal, not an existing or authorized public repository.

## Identity and authority

| Namespace | Required scope | Must not imply |
| --- | --- | --- |
| Emirates Post PO Box | Operator, branch, box identifier | A national postcode, polygon or public subscriber record |
| Dubai Makani entrance | Provider, emirate, entrance, source release | A postal area, nationwide coverage or building-name identity |
| Abu Dhabi Onwani postal code | Authority, emirate, code, source release | Equivalence with PO Box, Makani or parcel numbers |

[Emirates Post's FAQ](https://www.emiratespost.ae/faq) describes branch-allocated
PO Boxes. [DMT's Onwani page](https://pages.dmt.gov.ae/en/onwani) explicitly
includes postal codes among Abu Dhabi address components. Consequently, the
historical [UPU guide, September 2014](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/areEn.pdf)
must not be used to assert that all AE addressing lacks postal codes.

[Makani's policy](https://www.dm.gov.ae/open-data2/open-data-for-makani/) is
conditional, not an unrestricted OSS data licence. The actual acquisition,
transformation and redistribution plan needs review before publishing a pack.
This source inventory is not legal clearance.

## M2 gate

The manifest defines `M2_scoped_address_context`: a real, current, editioned and
rights-cleared dataset for a declared jurisdiction and namespace, reproducible
transformation and exception handling, retained source/terms evidence, immutable
published artifacts with verified digests, and namespace-aware AGID checks.
Scoped experimental M2 would not mean nationwide or building-level coverage.

Every address field and geometry needs its own source authority and lineage.
Keep absent geometry `none`; distinguish any future authorized `derived` or
`virtual` geometry from official assignments. Never infer house numbers,
building names or parcel ownership from postal containment or a nearby point.
Unknown validity dates stay unknown, rather than adopting the download date.

## Current integration

The AGID source catalog and AE address-format metadata distinguish these systems
without adding a nationwide numeric validator. Reference pages remain
`metadata-only` / `context-only` and are not eligible postal-validation data.
AE is deliberately not enabled in the generic country-only Postal Context
runtime. The first real pack needs an explicit jurisdiction/namespace API
contract before that changes.

```text
npm run verify:postal-context-ae
node scripts/inspect-postal-context-ae-sources.mjs --report <new-report.json>
```

The probe reads only seven fixed public reference URLs, applies host/redirect,
size and content checks, and emits document digests and failures without bodies.
It neither queries address/parcel/mailbox records nor proves M2. See the
[review and unblock conditions](../../../../docs/postal-context-united-arab-emirates-m2.md).
