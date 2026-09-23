# Contributing To AddressQL

Thank you for helping make address data safer and more useful.

AddressQL accepts contributions that improve:

- function specifications;
- SQL adapter scaffolds;
- SDK bindings;
- synthetic fixtures;
- conformance tests;
- privacy and non-claim boundaries;
- documentation clarity.

## Development Rules

Run the core checks before proposing a change:

```bash
npm run verify:addressql
npm run verify:addressql-oss
```

Run targeted checks when relevant:

```bash
npm run verify:addressql-postgres
npm run verify:addressql-duckdb
npm run verify:addressql-duckdb:cli
npm run verify:addressql-sdk
npm run verify:addressql-zk
npm run verify:addressql-calcite
```

The DuckDB CLI smoke skips locally when `duckdb` is not installed.  CI jobs that
install DuckDB should run `npm run verify:addressql-duckdb:cli -- --require-cli`
so missing CLI support is a real failure.

## Fixture Policy

Use synthetic fixtures only.  Do not contribute raw private address, recipient,
witness, private-key, proof-secret, production credential, or live carrier/API
material.

Acceptable examples:

```text
Synthetic JP fixture address
Synthetic US Fixture Street
synthetic-addressql-v0.1
```

Do not add real households, real recipients, or private business data.

## Non-Claim Policy

Every new AddressQL function or adapter result must state what it does not
prove.  In particular:

```text
postal validation is not residence proof
deliverability is not identity proof
schema acceptance is not ZK verification
matching is purpose-relative
```

## Pull Request Checklist

- The change is local-first and does not require production traffic.
- New fixtures are synthetic.
- New functions declare determinism and non-claims.
- Privacy-sensitive outputs include warnings or policy boundaries.
- Relevant verification commands pass.
