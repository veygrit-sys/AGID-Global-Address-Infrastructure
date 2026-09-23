# Repository Owner Routing

Last updated: 2026-06-30

This document defines where AGID-related repositories should be published.

## Default Rule

| Repository class | GitHub owner | Visibility posture |
| --- | --- | --- |
| Public research, papers, specifications, conformance fixtures, public-good demos, OSS SDKs, public country indexes | `dawnportinfo-design` | Public by default after safety review |
| Commercial product code, hosted service operations, enterprise dashboards, managed registries, customer-specific integrations, SLA tooling | `veygrit-sys` | Private or commercial by default |

The split is about repository ownership and release posture. It is not a
permission to place private address material, customer data, secrets, API keys,
proof secrets, or raw recipient records in GitHub.

## `dawnportinfo-design`

Use `dawnportinfo-design` for artifacts that should be inspectable by
researchers, standards readers, open-source funders, implementers, and public
reviewers:

- Address Morphism Theory and companion research papers.
- AGID public specification, conformance vectors, OpenAPI, and SDK baselines.
- ZK Address Predicates public schemas, circuit-readiness matrices, threat
  models, synthetic proof fixtures, and non-claim documents.
- Postal-code generation theory, country index templates, and synthetic
  no-postcode demos.
- Public country, continent, ocean, and territory repository indexes.
- Documentation, governance, safety boundaries, and public audit material.

## `veygrit-sys`

Use `veygrit-sys` for commercial and operational surfaces:

- Private commercial product snapshots such as
  `veygrit-sys/veygrit-commercial-products`.
- Hosted Registry API operations and deployment code.
- Managed ZK proof generation services.
- Enterprise console, fleet management, monitoring, SLA, and log-retention
  systems.
- Carrier, hotel, POS, warehouse, municipality, NGO, or large-retailer private
  integrations.
- Customer-specific adapters, runbooks, and operational playbooks.
- Proprietary risk models, support tooling, and compliance workflows.

## Current Commercial Snapshot

The current commercial app/planning snapshot is:

```text
https://github.com/veygrit-sys/veygrit-commercial-products
```

This snapshot is private, unfinished, and commercial by default. It is a place
to continue product design for Playlist Commerce, Veygrit ID / Address Login,
Hexaship / Delivery Gateway, Merchant Console, Vey Workspace, and related
commercial planning without turning those product surfaces into public AGID
claims.

Publishing this snapshot does not claim production readiness, carrier
integration readiness, payment readiness, wallet/proof-provider readiness, legal
review, privacy review, or security review. It also does not permit raw address,
recipient, witness, private-key, proof-secret, production credential, or
customer operational material in GitHub.

## Promotion Rules

Commercial code may move from `veygrit-sys` to `dawnportinfo-design` only after:

1. product secrets and customer-specific logic are removed;
2. source and data licenses are reviewed;
3. tests and synthetic fixtures replace private operational samples;
4. public security and privacy boundaries are documented;
5. the artifact can run without production traffic or private credentials.

Public research code may be mirrored into `veygrit-sys` for commercial use, but
the public contract should continue to live in `dawnportinfo-design`.

## Safety Rules

- Do not publish raw addresses, recipient records, witness material, private
  keys, proof secrets, production tokens, or customer operational data in either
  owner.
- Do not put commercial-only dependencies into public conformance paths.
- Do not let a commercial service become required for AGID decode, public
  validation fixtures, local resolver behavior, or public documentation builds.
- Keep data-source licenses in `DATA_LICENSES.md` or repo-local source
  manifests; repository owner does not change third-party data rights.
