# AddressQL Practical API v1

Status: P1 executable self-hosted API

## Run

```bash
npm run serve:addressql-api
```

The default listener is `http://127.0.0.1:8787`. Set
`ADDRESSQL_API_HOST` or `ADDRESSQL_API_PORT` explicitly when a self-hosted
deployment needs another binding.

The reference adapter does not log request bodies and does not persist
requests. Postal routes accept country identifiers and postal codes. The L5
route accepts a delivery-point commitment and signed carrier decisions. Raw
address, recipient, street, premise, coordinate, credential, and proof-secret
fields are rejected by the strict request contracts.

## Endpoints

```text
GET  /v1/health
GET  /v1/countries
GET  /v1/countries/{countryCode}/capabilities
GET  /v1/promotions
GET  /v1/countries/{countryCode}/promotions
GET  /v1/multilingual
GET  /v1/countries/{countryCode}/languages
POST /v1/multilingual/assess
POST /v1/place-names/rank
POST /v1/delivery-points/assess
POST /v1/postal/validate
POST /v1/postal/validate/batch
```

OpenAPI:

```text
docs/specs/openapi/addressql-practical-api-v1.openapi.json
```

## Example

```bash
curl http://127.0.0.1:8787/v1/postal/validate \
  -H "content-type: application/json" \
  -H "x-request-id: example.jp-format-1" \
  -d '{"countryCode":"JP","postalCode":"1000001","purpose":"format"}'
```

The response deliberately does not repeat the submitted postal code. It
returns field status, the country's highest enabled capability level, the
requested capability state, and missing evidence.

P2 promotion endpoints return country-specific review candidacy and exact
blockers. `review_candidate` is never equivalent to `enabled`.

P3 multilingual endpoints expose country language, script, adapter, and
M0-M4 gate metadata. The assessment endpoint accepts language metadata only;
it rejects address text. Same-language normalization can be `ready`, while
cross-language routes remain `review_required` until source-backed aliases,
country holdouts, independent signatures, and runtime adapters are approved.
No automatic place-name translation is enabled.

The place-name ranking endpoint accepts one bounded public place-name token,
country, target language, and optional hierarchy context. It uses a configured
versioned catalog, ranks official aliases and romanizations above generated
transliteration, and returns `ambiguous` when a same-script name lacks enough
administrative context. It does not accept or retain full addresses. The
additive `addressMorphism` response view exposes only public candidate IDs and
source metadata. It does not echo the submitted token, issue an AGID, handle an
AOID, or turn a ranked name into a delivery or identity decision.

## Capability Semantics

| purpose | level | current behavior |
| --- | --- | --- |
| `format` | L1 | Executes when the country profile has an approved local regex. |
| `existence` | L2 | Returns `unknown` while source, rights, dataset digest, version, freshness, coverage, correction, holdout, signature, or runtime-adapter evidence is missing; independently attested adapters can enable it. |
| `delivery` | L4 | Returns `unknown` until an independently attested delivery-area source and its evidence chain are available. |

L5 delivery-point decisions use the separate
`POST /v1/delivery-points/assess` contract. That route accepts only a salted
`sha256:` delivery-point commitment and time-bounded Ed25519 carrier
assertions. It does not accept a postal code as a substitute for a point.
Carrier disagreement returns `conflict` and `stop_conflict`; no majority vote
continues processing.

An HTTP `200` means the request was evaluated. The validation status can still
be `unknown`, `fail`, or `not_applicable`. Callers must inspect
`validation.status`; they must not treat HTTP success as address existence or
delivery success.

AU, GT, NZ, and PA are currently L3 review candidates in the bundled metadata.
No P2 target is enabled by default.

## Runtime Evidence Adapters

L2 postal-existence and L4 delivery-area decisions can be supplied by an
explicit local runtime adapter. An adapter is not discovered from the network
and cannot become live merely by being registered. Live execution requires:

- a complete source, reuse-rights, coverage, correction, version, freshness,
  dataset digest, holdout, and report evidence envelope;
- a non-expired evidence window;
- an independently supplied attestation verifier;
- an `approved` adapter mode.

`conformance` adapters are opt-in test fixtures. Their decisions remain
`unknown` in the practical API and use the
`synthetic_conformance` evidence level. Approved adapters expose
`independently_attested`; conflicting adapters return `conflict` instead of
silently selecting one result. Responses list technical adapter and source
references but never repeat the submitted postal code.

`createAddressQlPostalSetAdapter` provides a local, reproducible loader for
postcode and delivery-area sets. A set declared `complete` may return a
negative decision for a missing code. A `partial` set must return `unknown`
for misses, preventing incomplete open data from becoming false rejection
evidence. Capability, promotion, and health endpoints use the same live
adapter gate as validation requests.

The registry rechecks `validUntil` on every capability lookup and validation.
An adapter that expires while the server is running is removed immediately
without a restart. `postal-operations-v1.md` provides the offline periodic CLI
for source-version, correction-route, aggregate SLA, and country-action
reporting.

Signed L5 decisions use a separate carrier trust root:

```powershell
$env:ADDRESSQL_L5_CARRIER_TRUST_STORE="carrier-trust-store-v1.json"
```

The store contains public Ed25519 keys, carrier identifiers, country scopes,
status, and validity windows. See `signed-delivery-point-contract-v1.md` for
the canonical assertion and conflict workflow.

## Local Runtime Configuration

The HTTP server can load postcode-only datasets without code changes:

```powershell
$env:ADDRESSQL_RUNTIME_CONFIG="C:\addressql-data\runtime-config.json"
$env:ADDRESSQL_TRUST_STORE="C:\addressql-data\trust-store.json"
npm run serve:addressql-api
```

The runtime config and trust-store schemas are:

```text
docs/specs/schemas/addressql-runtime-config-v1.schema.json
docs/specs/schemas/addressql-trust-store-v1.schema.json
docs/specs/schemas/addressql-trust-store-v2.schema.json
docs/specs/schemas/addressql-runtime-release-ledger-v1.schema.json
docs/specs/schemas/addressql-runtime-release-state-v1.schema.json
docs/specs/schemas/addressql-carrier-trust-store-v1.schema.json
docs/specs/schemas/addressql-l5-carrier-assertion-v1.schema.json
docs/specs/schemas/addressql-l5-delivery-point-request-v1.schema.json
docs/specs/schemas/addressql-l5-delivery-point-decision-v1.schema.json
```

Each `dataFile` is relative to, and must stay inside, the config directory.
The file contains one postcode per line. AddressQL NFKC-normalizes, sorts, and
deduplicates the values, then verifies the canonical dataset digest before
loading it. Inspect a file without printing its contents:

```bash
npx tsx scripts/verify-addressql-runtime-config.ts \
  --data ./postcodes.txt
```

Validate a complete runtime config before startup:

```bash
npx tsx scripts/verify-addressql-runtime-config.ts \
  --config ./runtime-config.json \
  --trust-store ./trust-store.json
```

Approved adapters require an Ed25519 signature over the canonical payload
returned by `buildAddressQlRuntimeAttestationPayload`. The trust store contains
public keys only:

```json
{
  "version": "addressql-trust-store-v1",
  "keys": {
    "independent-reviewer-key-id": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
  }
}
```

An empty trust store is valid but trusts nobody. This lets source intake finish
without weakening the approval gate. Register a public key supplied by an
independently controlled reviewer:

```bash
npx tsx scripts/register-addressql-trusted-public-key.ts \
  --trust-store ./.agid-runtime/addressql/jp/trust-store.json \
  --key-id independent-reviewer-2026 \
  --public-key ./reviewer-public.pem
```

The registrar accepts Ed25519 public keys only, rejects private-key material,
and refuses to bind an existing key ID to a different key.

Prepare the exact canonical payload for an independent offline reviewer:

```bash
npm run prepare:addressql-runtime-attestation -- \
  --config ./.agid-runtime/addressql/jp/runtime-config.json \
  --adapter japan-post-utf-csv-jp-existence \
  --key-id independent-reviewer-2026 \
  --output ./.agid-runtime/addressql/jp/japan-post.attestation.json
```

The reviewer signs the payload bytes outside AGID and returns one Base64
Ed25519 detached signature. After registering the reviewer's public key,
verify the signature and create a new approved config without overwriting the
conformance source config:

```bash
npm run finalize:addressql-runtime-attestation -- \
  --config ./.agid-runtime/addressql/jp/runtime-config.json \
  --adapter japan-post-utf-csv-jp-existence \
  --key-id independent-reviewer-2026 \
  --signature ./japan-post.attestation.base64 \
  --trust-store ./.agid-runtime/addressql/jp/trust-store.json \
  --output ./.agid-runtime/addressql/jp/runtime-config.approved.json
```

Finalization rechecks the source data digest, reconstructs the canonical
payload, verifies the detached signature, and loads the resulting adapter
through the normal runtime gate. The output must be a new file beside the
input config so relative dataset paths cannot be redirected.

For a reusable JP runtime, AddressQL can derive postcode-only sets from the
Japan Post UTF-8 CSV and the GeoNames CC BY 4.0 country archive:

```bash
npm run sync:addressql-public-postal-data
npm run sync:addressql-official-postal-data
$env:ADDRESSQL_RUNTIME_CONFIG=".agid-runtime/addressql/jp/runtime-config.json"
$env:ADDRESSQL_TRUST_STORE=".agid-runtime/addressql/jp/trust-store.json"
$env:ADDRESSQL_ALLOW_CONFORMANCE="1"
npm run serve:addressql-api
```

The generated source ledger records URL, source version, reuse terms,
attribution, archive and derived digests, scope, correction route, and aggregate
holdout metrics. Source ZIPs and address/locality/coordinate columns are not
retained. These adapters remain non-live conformance evidence until their
canonical payloads are independently signed and changed to `approved`.

Private keys, credentials, address rows, recipient data, and precise
coordinates are not accepted by this runtime configuration path. A
conformance config can be loaded only with
`ADDRESSQL_ALLOW_CONFORMANCE=1`; it remains non-live.

Production deployments can additionally require the quorum release boundary:

```powershell
$env:ADDRESSQL_RUNTIME_CONFIG="runtime-config.approved.json"
$env:ADDRESSQL_TRUST_STORE="trust-store-v2.json"
$env:ADDRESSQL_RELEASE_LEDGER="release-1.ledger.json"
$env:ADDRESSQL_RELEASE_STATE="release-state.json"
npm run serve:addressql-api
```

Both release variables must be configured together. This path requires at
least two active, non-expired reviewer signatures and rejects revoked or
rotated keys, config/ledger tampering, sequence rollback, sequence gaps, and
incorrect previous-release digests. The complete workflow and its host-state
threat boundary are documented in `runtime-release-security-v1.md`.

## Limits

- request body: 64 KiB;
- batch size: 100;
- postal code: 32 characters after NFKC normalization;
- country or neutral-scope identifier: 16 ASCII characters;
- BCP 47 language tag: 35 ASCII characters;
- request identifier: 64 ASCII technical-identifier characters;
- HTTP request timeout: 10 seconds;
- SDK default timeout: 5 seconds.

## Verification

```bash
npm run verify:addressql-api
npm run verify:addressql-runtime-config
npm run verify:addressql-multilingual-quality
npm run verify:addressql
```

The tests execute the framework-independent handler and the real loopback HTTP
adapter. They use synthetic postal strings only and do not send production
traffic.

## Non-Claims

- Format validation does not prove postal-code existence.
- Postal-code existence does not prove address existence.
- Delivery-area status does not prove delivery-point reachability.
- L5 status never inherits from L4 area status.
- L5 accepts a commitment and signed decisions, not a raw address.
- No result proves residence, identity, recipient authorization, or a carrier
  service-level agreement.
