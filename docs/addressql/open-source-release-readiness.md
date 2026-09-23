# AddressQL Open-Source Release Readiness

Status: public repository readiness gate

Target repository:

```text
dawnportinfo-design/addressql
```

AddressQL is ready to become a public open-source repository when the
specification, executable scaffolds, tests, licensing boundaries, and non-claims
are all visible without relying on private AGID workspace context.

## Release Goal

The first public release should show that AddressQL is not only an idea.  It
must have:

```text
specification
function registry
PostgreSQL scaffold
Rust core scaffold
DuckDB scaffold
TypeScript/Python/Rust SDK surface
Calcite deferred planner contract
ZK proof-hook readiness contract
conformance tests
synthetic fixtures only
```

## Public Repository Shape

Recommended extraction map:

| public repo path | current workspace source |
| --- | --- |
| `README.md` | `docs/addressql/README.md` |
| `docs/` | `docs/addressql/*.md` |
| `extensions/addressql-postgres/` | `extensions/addressql-postgres/` |
| `extensions/addressql-duckdb/` | `extensions/addressql-duckdb/` |
| `native/addressql-core/` | `native/addressql-core/` |
| `sdk/addressql-js-ts/` | `sdk/addressql-js-ts/` |
| `sdk/addressql-py/` | `sdk/addressql-py/` |
| `sdk/addressql-rs/` | `sdk/addressql-rs/` |
| `integrations/addressql-calcite/` | `integrations/addressql-calcite/` |
| `src/lib/addressQl*.ts` | TypeScript reference/conformance modules |
| `src/data/address_formats/` | bounded country format profiles |
| `data/postal_country_packs/` | source metadata and synthetic country packs |
| `src/lib/addressQlMultilingualQuality.ts` | P3 country language and translation gates |
| `src/lib/addressQlOfficialPlaceNames.ts` | versioned official-name catalog, hierarchy-aware candidate ranking, and aggregate holdout evaluation |
| `scripts/run-addressql-api.ts` | P1 localhost-first HTTP adapter |
| `scripts/monitor-addressql-postal-operations.ts` | P2 offline source expiry, correction SLA, and country action monitor |
| `docs/specs/openapi/` | public Practical API contract |

## Required GitHub Files

The extracted repository should include:

```text
README.md
LICENSE
LICENSES-DATA.md
CONTRIBUTING.md
SECURITY.md
CODE_OF_CONDUCT.md
package.json
docs/specification-v0.1.md
docs/function-registry-v0.1.md
docs/open-source-release-readiness.md
repository-manifest.json
```

Inside this AGID workspace, the release readiness script verifies the source
materials before extraction.  The final standalone repository can add the root
GitHub policy files using the same text and boundaries.

Template files are maintained in:

```text
docs/addressql/repository-files/
```

Copy them to the standalone repository root before public push.

The standalone `package.json` runs the exported country-core conformance
tests. This keeps country-profile resolution, L0-L5 capability gates, M0-M4
multilingual gates, and evidence-backed refusal behavior independently
reproducible after extraction:

```bash
npm install
npm run verify:addressql-country-core
```

Country packs remain draft metadata and synthetic-test assets. Their presence
must not enable postal-existence, administrative-consistency, delivery-area,
or delivery-point claims without approved source, rights, version, freshness,
coverage, correction, holdout, and signature evidence.

Official place-name ranking is evidence-bounded. An official alias or official
romanization outranks a generated transliteration, while translation cannot
create an official-name claim. Same-script, different-reading names require
country and administrative hierarchy context; unresolved ambiguity is a safe
deferral, not an automatic correction.

## Manifest-Owned Spec Assets

Any `docs/specs/fixtures/` or `docs/specs/schemas/` path listed in
`docs/addressql/repository-manifest.json` is an AddressQL export asset, not an
internal AGID-only note.  Keep those paths in the OSS readiness required-path
list and in `scripts/export-addressql-oss-repository.ts`.  The
`verify:addressql-export` check must show them in both
`readiness.verifiedPaths` and `included`.

These assets must remain synthetic fixtures or public schemas only.  Do not add
raw private address, recipient, witness, private-key, proof-secret, production
credential, or production traffic material.

Place-name holdout exports contain country and administrative-hierarchy
aggregates only. Individual query strings are conformance inputs and are never
copied into the report.

## Verification Commands

Core verification:

```bash
npm run verify:addressql
npm run verify:addressql-oss
npm run verify:addressql-multilingual-quality
npm run verify:addressql-place-names
npm run verify:addressql-api
```

Adapter and SDK verification:

```bash
npm run verify:addressql-postgres
npm run verify:addressql-duckdb
npm run verify:addressql-postal-negative-claims
npm run verify:addressql-sdk
npm run verify:addressql-calcite
npm run verify:addressql-zk
```

Optional executable adapter smoke:

```bash
npm run verify:addressql-duckdb:cli
```

The public repository should include `.github/workflows/addressql-duckdb-cli.yml`
as an optional CI workflow.  It installs the DuckDB CLI and runs the same smoke
with `-- --require-cli`, so CI fails if the executable smoke cannot run.

Optional Rust checks:

```bash
cargo check --manifest-path native/addressql-core/Cargo.toml
cargo check --manifest-path sdk/addressql-rs/Cargo.toml
```

## Non-Negotiable Release Gates

1. No production traffic in tests.
2. No raw private address, recipient, witness, private key, proof secret, or
   production credential material in public fixtures.
3. Postal functions must state that postal validity is not residence or identity
   proof.
4. Delivery functions must state that deliverability is not residence or
   identity proof.
5. ZK functions must state that v0.6 is proof-hook readiness, not real audited
   circuit verification.
6. Calcite must remain deferred until activation gates are met.
7. AMT compatibility must stay an adapter boundary, not a merge into the AMT
   paper.
8. Third-party source/data licenses must remain separate from code licensing.

## First Public Release Label

Recommended tag:

```text
v0.1.0-rc1
```

Recommended release title:

```text
AddressQL v0.1 RC1: structured address query functions and OSS adapter scaffold
```

Recommended release note summary:

```text
This release publishes the AddressQL specification, bounded function registry,
PostgreSQL JSONB scaffold, Rust core scaffold, DuckDB analytical scaffold,
TypeScript/Python/Rust SDK surfaces, Calcite deferred planner contract, and ZK
proof-hook readiness model.  It uses synthetic fixtures only and does not claim
global address completeness, legal residence verification, production carrier
availability, or audited ZK circuits.
```

## Remaining Before Remote Push

Before creating `dawnportinfo-design/addressql`, do this final pass:

```text
1. Run npm run verify:addressql-oss.
2. Run npm run verify:addressql.
3. Copy `docs/addressql/repository-files/*` to the standalone repo root.
4. Create a clean extraction branch.
5. Push only AddressQL files, not unrelated AGID workspace files.
6. Open a draft PR if publishing from the AGID monorepo first.
```
