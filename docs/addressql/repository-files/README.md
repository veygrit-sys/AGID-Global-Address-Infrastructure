# AddressQL Repository Root File Templates

These files are intended to be copied to the root of the standalone public
repository:

```text
dawnportinfo-design/addressql
```

They keep the first public release consistent with the AddressQL split-license,
security, contribution, and data-boundary policy.

Recommended copy map:

| source | standalone repository target |
| --- | --- |
| `docs/addressql/README.md` | `README.md` |
| `docs/addressql/repository-files/package.json` | `package.json` |
| `docs/addressql/repository-files/LICENSE` | `LICENSE` |
| `docs/addressql/repository-files/LICENSES-DATA.md` | `LICENSES-DATA.md` |
| `docs/addressql/repository-files/CONTRIBUTING.md` | `CONTRIBUTING.md` |
| `docs/addressql/repository-files/SECURITY.md` | `SECURITY.md` |
| `docs/addressql/repository-files/CODE_OF_CONDUCT.md` | `CODE_OF_CONDUCT.md` |

Run the exported country-core conformance checks with:

```bash
npm install
npm run verify:addressql-country-core
npm run verify:addressql-country-data-promotion
npm run verify:addressql-multilingual-quality
npm run verify:addressql-place-names
npm run verify:addressql-api
npm run verify:addressql-runtime-config
npm run verify:addressql-runtime-release
npm run verify:addressql-delivery-point
npm run verify:addressql-postal-operations
```

The `prepare:addressql-runtime-attestation` and
`finalize:addressql-runtime-attestation` commands provide the offline
independent-signature workflow documented in `docs/practical-api-v1.md`.
Reviewer-key lifecycle, quorum releases, and rollback prevention are
documented in `docs/runtime-release-security-v1.md`.
Signed L5 carrier assertions, commitment-only requests, and fail-closed
carrier conflicts are documented in
`docs/signed-delivery-point-contract-v1.md`.

Run the P2 source-expiry, aggregate correction SLA, and country-action report
without network traffic:

```bash
npm run monitor:addressql-postal-operations -- \
  --input docs/specs/fixtures/addressql-postal-operations-input-v1.json \
  --output .agid-runtime/postal-operations-report.json \
  --fail-on-action
```

The report never changes country capability state. Runtime adapters recheck
their expiry during every evaluation and disable themselves when their signed
validity window closes.

The exported address-format profiles and postal country packs are bounded
format metadata, source catalogs, and synthetic-test assets. They are not
complete postal-existence or delivery-point databases. L2 and higher remain
blocked until every required evidence gate is approved.

P2 publishes an all-profile promotion index. AU, GT, NZ, and PA are L3 review
candidates only; no L2-L5 country capability is enabled.

P3 publishes M0-M4 country language-quality gates. Native and international
templates are independently testable, while transliteration and place-name
translation remain review candidates until their source, holdout, signature,
and runtime evidence is approved.

The official place-name ranker keeps source versions and alias-set digests,
prefers official aliases and romanizations to generated forms, and safely
defers same-script readings when administrative hierarchy context is missing.
Its Address Morphism compatibility view exposes only public candidate and
evidence metadata, keeps candidate coverage unestablished unless separately
certified, and never issues an AGID or handles AOID/private delivery data.

Start the P1 API on loopback with:

```bash
npm run serve:addressql-api
```

The server optionally loads signed local postcode datasets through
`ADDRESSQL_RUNTIME_CONFIG` and `ADDRESSQL_TRUST_STORE`. The checked-in
conformance fixture can be enabled explicitly with
`ADDRESSQL_ALLOW_CONFORMANCE=1`; conformance decisions never become live
postal-existence evidence.

The optional L5 endpoint loads public carrier keys through
`ADDRESSQL_L5_CARRIER_TRUST_STORE`. It accepts delivery-point commitments and
signed decisions only. L4 postal or area coverage never promotes itself to an
L5 result. The TypeScript client exposes the endpoint as
`AddressQlApiClient.assessDeliveryPoint()`.

Create the local JP official-plus-OSS runtime with:

```bash
npm run sync:addressql-public-postal-data
npm run sync:addressql-official-postal-data
```

It combines the reusable Japan Post UTF-8 CSV with a GeoNames CC BY 4.0
cross-check, retains postcodes only, and writes source/version/terms/correction
evidence under ignored `.agid-runtime/`. An empty generated trust store trusts
nobody. Add only an independently supplied Ed25519 public key with
`scripts/register-addressql-trusted-public-key.ts`; private keys are rejected.

Release rule:

```text
Do not publish raw address, recipient, witness, private-key, proof-secret, or
production credential material.
```
