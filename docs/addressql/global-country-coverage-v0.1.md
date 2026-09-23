# AddressQL Global Country Coverage v0.1

Status: executable capability and refusal contract

## Scope

AddressQL resolves 250 core country and region codes: the ISO 3166-1 alpha-2
baseline plus the separately scoped `XK` profile. It also retains neutral,
explicitly named extended profiles already present in the AGID workspace.

Coverage is divided into separate capabilities:

```text
L0 country profile resolution
L1 native/international format and postal syntax
L2 postal existence lookup
L3 administrative/locality consistency
L4 delivery-area reachability
L5 delivery-point validation
```

A country is not described as fully validated merely because its code and
postal regular expression are available.

## Current Evidence

The executable audit currently observes:

- local profiles for all 250 core country and region codes;
- additional neutral extended-scope profiles;
- 78 draft metadata packs;
- no bundled official postal-existence dataset approved for live lookup;
- no country with an approved delivery-point source chain.
- four L3 country-data review candidates: AU, GT, NZ, and PA;
- no enabled P2 country-data promotion.

The metadata packs contain source catalogs, synthetic vectors, quality slots,
and maintenance contracts. They do not by themselves prove that a postal code
exists or that a carrier can reach a delivery point.

## Capability Rules

`enabled` means that the local, bounded operation can execute.

`not_applicable` is used where ordinary public postal addressing is absent,
including uninhabited territory profiles such as `HM`.

`manual_review` means the local profile lacks enough format evidence.

`blocked` means AddressQL must refuse the stronger operation until its evidence
gate passes.

Every level records `requiredEvidence`, `observedEvidence`, and
`approvedEvidence` separately. Observing a draft metadata pack does not approve
it. L2 and higher cannot become `enabled` until every required evidence item is
present in the approved set, an independent attestation is verified, and a
bounded runtime adapter is registered.

The P2 promotion index connects approved synthetic administrative evaluation
metadata to L3 review candidacy. Candidacy does not enable L3. AU, GT, NZ, and
PA still lack approved real administrative keys, an independent signature, and
a runtime adapter.

Postal-format validation may be enabled from a country-specific format and
regex. Postal existence lookup remains blocked until source, reuse-rights,
version, freshness, coverage, correction, and quality gates are approved.
Delivery-point validation remains blocked until an appropriate delivery source
and the same evidence chain are approved.

## Non-Claims

- Country-profile support does not imply postal-code existence lookup.
- Postal-format validation does not imply address existence.
- Postal existence does not imply delivery-point reachability.
- Delivery reachability does not imply residence, recipient identity, or a
  carrier service-level agreement.
- Draft country packs are metadata and synthetic-test assets, not official
  postal databases.

## Verification

```bash
npm run verify:addressql-global-coverage
npm run verify:addressql
```

The coverage test fails when a core profile is missing, a country pack is
orphaned or unsafe, a no-postal profile has inconsistent capabilities, or
postal-existence/delivery validation is enabled without an approved gate.
