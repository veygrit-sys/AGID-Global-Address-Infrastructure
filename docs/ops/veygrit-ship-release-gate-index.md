# Veygrit Ship Release Gate Index

Version: `veygrit-ship-release-gate-index-v0.1`

This index is a local status reporter for the Veygrit Ship operational release gate. It lists each gate that runs inside `npm run verify:veygrit-ship-operations`, the local command, the boundary it protects, and the non-claim reviewers should preserve.

## Boundary

- This index authorizes no registry publication, hosted deployment, remote repository mutation, pull request creation, or production carrier traffic.
- This index authorizes no raw address, recipient, witness, private-key, proof-secret, carrier credential, or production credential material handling.
- Every command in this index is a local verification command.

## Gate Inventory

| Gate | Command | Boundary | Non-Claim |
| --- | --- | --- | --- |
| `verify:veygrit-ship-credential-surfaces` | `npm run verify:veygrit-ship-credential-surfaces` | Guest, Merchant, and internal credential-surface separation | Passing does not prove live carrier credentials, carrier approval, label purchase authority, or production traffic. |
| `verify:veygrit-ship-sdk-readmes` | `npm run verify:veygrit-ship-sdk-readmes` | Public SDK README credential-boundary handoff | Passing does not authorize browser carrier credential handling or public credential input. |
| `verify:veygrit-ship-sdk-packages` | `npm run verify:veygrit-ship-sdk-packages` | JS and PHP package metadata readiness | Passing does not publish packages, validate registry behavior, or prove live carrier availability. |
| `verify:veygrit-ship-sdk-build-hygiene` | `npm run verify:veygrit-ship-sdk-build-hygiene` | JS SDK local typecheck, build, and generated-output scan | Passing does not prove npm archive contents, registry provenance, or production runtime security. |
| `verify:veygrit-ship-sdk-package-archives` | `npm run verify:veygrit-ship-sdk-package-archives` | JS dry-run package archive and PHP composer metadata | Passing does not create package archives, publish packages, or prove Packagist/npm registry readiness. |
| `verify:veygrit-ship-sdk-release-checklist` | `npm run verify:veygrit-ship-sdk-release-checklist` | Public no-publish SDK release checklist | Passing does not authorize registry publication, hosted deployment, remote mutation, or production carrier traffic. |
| `verify:veygrit-ship-release-gate-index` | `npm run verify:veygrit-ship-release-gate-index` | Operations gate inventory and command wiring | Passing does not add new operational evidence beyond index completeness. |
| `verify:veygrit-ship-release-gate-status` | `npm run verify:veygrit-ship-release-gate-status` | Public-safe release gate status fixture and Guest route exposure | Passing does not certify live release state, deployment health, public uptime, or production carrier traffic readiness. |
| `verify:veygrit-ship-observability` | `npm run verify:veygrit-ship-observability` | Logs, metrics, alerts, and bounded request identifiers | Passing does not prove production monitoring coverage, pager readiness, or live carrier SLOs. |
| `verify:veygrit-ship-backup-restore` | `npm run verify:veygrit-ship-backup-restore` | Non-production backup and restore command safety | Passing does not authorize production restores or prove disaster recovery objectives. |
| `verify:preaudit-secrets` | `npm run verify:preaudit-secrets` | Repository pre-audit secret scan | Passing does not prove secret absence in every future file, external system, or private runtime. |
| `verify:veygrit-ship-dependency-lock` | `npm run verify:veygrit-ship-dependency-lock` | Critical dependency lockfile policy | Passing does not prove all transitive dependencies are safe or production-approved. |
| `verify:dependency-audit` | `npm run verify:dependency-audit` | npm dependency vulnerability audit | Passing does not prove non-npm dependencies, cloud services, or carrier integrations are risk-free. |

## Status Rule

The gate index must stay in lockstep with `scripts/verify-veygrit-ship-operations.ts`. If a gate is added to or removed from the aggregate operations gate, update this index and run:

```powershell
npm run verify:veygrit-ship-release-gate-index
npm run verify:veygrit-ship-release-gate-status
npm run verify:veygrit-ship-operations
```
