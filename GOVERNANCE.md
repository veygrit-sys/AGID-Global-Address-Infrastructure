# AGID Governance

AGID is a public infrastructure project for address IDs, private address QR,
machine-readable handoff, and open address/geographic evidence. Governance is
kept lightweight, explicit, and contributor-friendly while the project is still
pre-1.0.

## Project Roles

- **Maintainers** steward the specification boundary, release gates, security
  posture, and final merge decisions.
- **Reviewers** help validate focused areas such as SDK parity, address formats,
  security/privacy, geography data, UI accessibility, and documentation.
- **Contributors** propose issues, pull requests, tests, docs, data source
  improvements, and research notes.

No role may approve a change that weakens the no-raw-address release boundary,
adds unreviewed secrets or private address material, or makes hosted services
mandatory for the open-source core.

## Decision Rules

AGID prefers small, reviewable changes with tests. Maintainers should accept a
change when it is:

- aligned with the public AGID/AOID specification and privacy model;
- covered by the smallest relevant verification command;
- clear about source data, licenses, and generated artifacts;
- compatible with local-only and self-hosted use;
- free of raw address, recipient, witness, proof-code, private-key, and secret
  material in public fixtures or logs.

When a decision affects protocol compatibility, SDK vectors, public APIs, data
licenses, ZK public signals, or security policy, document the decision in the
pull request and link to the relevant spec or release gate.

## Release Criteria

A public release candidate should pass:

```bash
npm run verify:oss-launch
npm run lint
npm run build -- --logLevel=error
```

Release notes must state the compatible spec version, SDK parity vector version,
download checksums when applicable, data-pack provenance, and known limitations.

## Security And Privacy Veto

Security/privacy regressions can block a release even when feature tests pass.
The default veto conditions are:

- raw address or AOID plaintext in public artifacts;
- real recipient names, phone numbers, room/unit details, proof codes, witness
  material, or private keys in examples, test vectors, logs, docs, or downloads;
- external connector behavior that retries unsafe operations or caches private
  payloads;
- hosted registry behavior required for local AGID decode, address display,
  QR intake, or basic POS/field handoff.

See [SECURITY.md](SECURITY.md) and [docs/governance.md](docs/governance.md).

## Repository Split Policy

The main repository stays focused on the reference app, demo flows, public API
surface, and light fixtures. Heavy or independently versioned surfaces should be
split into dedicated repositories when they mature:

- `agid-spec`: schemas, conformance, OpenAPI, and parity vectors.
- `agid-sdks`: generated SDKs or language-specific package repositories.
- `agid-address-packs`: YAML editing sources and generated address-format JSON.
- `agid-postal-forge`: postal-zone generation and country-pack tooling.
- `agid-geo-packs`: heavy geospatial packs, polygons, and map evidence.
- `agid-zk-web3`: circuits, contracts, verifier artifacts, and ZK vectors.
- `agid-connectors`: OPERA, POS, carrier, translation, and external adapters.

Splits should preserve the public contract first. Do not split a repo by copying
private fixtures, secrets, generated build output, or unlicensed data.

Public research, specifications, conformance fixtures, and OSS-ready packages
should be published under `dawnportinfo-design`. Commercial product code,
hosted operations, enterprise dashboards, managed registries, and
customer-specific integrations should be published under `veygrit-sys`. The
full routing rule is documented in
[Repository Owner Routing](docs/repository-owner-routing.md).
