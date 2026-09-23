# AGID License Policy

Last updated: 2026-06-17

This file defines the recommended license split for AGID, AOID, AGID-S,
ZK address predicates, POS, resolver, documentation, and data packs. It is a
policy document, not a relicensing action by itself.

Repository ownership is routed separately in
`docs/repository-owner-routing.md`: public research and open-source artifacts
belong under `dawnportinfo-design`, while commercial product and hosted
operations belong under `veygrit-sys`.

The current repository software license remains the license stated in
`LICENSE` and package metadata. Any future relicensing must follow the
relicensing checklist below.

## Recommended License Matrix

| Area | Recommended license |
| --- | --- |
| SDK, CLI, and basic libraries | Apache-2.0 preferred; MIT acceptable. |
| AGID/AOID specifications | Apache-2.0. |
| Test vectors | CC0-1.0 or Apache-2.0. |
| ZK circuits | Apache-2.0. |
| Local Resolver and basic POS implementation | Apache-2.0. |
| Server implementation | Apache-2.0 when OSS adoption is the priority; AGPLv3 when SaaS-modification reciprocity is the priority. |
| Enterprise extensions | Commercial License. |
| Papers and research documents | CC BY 4.0. |
| Geographic, postal, and external datasets | Keep source-specific licenses separated in `DATA_LICENSES.md`. |

## Policy Notes

- Apache-2.0 is the preferred default for public protocol surfaces because it
  provides a clear patent grant and is familiar to enterprise adopters.
- MIT remains acceptable for SDKs, CLIs, and basic libraries when compatibility
  with existing package ecosystems matters more than license uniformity.
- AGPLv3 should be chosen for server code only when the project intentionally
  wants SaaS operators to publish network-service modifications.
- Commercial License is reserved for managed or enterprise extensions; it
  should not be required to verify the AGID/AOID public standard.
- `DATA_LICENSES.md` is the source of truth for geography, postal, carrier,
  official-source, and external evidence licenses. Do not infer data rights
  from the software license.

## Open Core Boundary

The following should stay open so implementers can verify the protocol without
trusting a single vendor:

- AGID encode/decode specification and parity vectors.
- AOID public data formats and private/public separation rules.
- AGID-S encrypted QR format.
- Local resolver and address display baseline.
- Basic POS scan, QR/NFC intake, and local verification.
- ZK Address Proof public interfaces and baseline circuits.
- OpenAPI, SDKs, CLI, tests, and conformance fixtures.
- Security boundaries, threat model, and privacy rules.
- Mathematical papers, verification notes, and validation reports.

The following can be commercial or separately licensed without weakening the
public standard:

- Hosted Registry API operations.
- Managed ZK proof generation.
- Enterprise dashboard, fleet management, SLA, monitoring, and log retention.
- Advanced Address Radar risk models.
- Private deployments for municipalities, NGOs, carriers, warehouses, or large
  retailers.
- Enterprise support, compliance review, and custom integrations.

## Data License Boundary

AGID must not relicense third-party geography, postal, administrative, trade,
carrier, or map-feature data as AGID-owned software. Data packs must carry their
own source manifest and attribution. The top-level index is `DATA_LICENSES.md`;
the detailed policy lives in `docs/data-licenses.md`.

Required data-pack metadata:

- source ID and source name,
- source URL,
- provider or authority,
- coverage region,
- license or terms label,
- retrieval date or version when available,
- redistribution status,
- transformed fields,
- confidence, freshness, and allowed-use notes.

## Relicensing Checklist

Before changing the root software license or publishing a package under a new
license:

1. Confirm contributor and rights-holder approval.
2. Update `LICENSE`.
3. Update `package.json`, SDK package manifests, and generated package metadata.
4. Update SPDX headers in contracts, circuits, scripts, and source files.
5. Update OpenAPI standard metadata.
6. Update README and release notes.
7. Add or update `NOTICE` when attribution is required.
8. Confirm generated artifacts and binary packages carry the intended license.
9. Confirm data packs remain governed by their own source licenses.
10. Run conformance and security checks before release.

## Publication Rule

If a file or package contains AGID-owned source code, use the software license
declared for that package. If it contains third-party data, source-derived data,
or bundled evidence, do not infer the repository software license. Check
`DATA_LICENSES.md` and the source manifest first.
