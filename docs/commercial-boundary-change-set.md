# Commercial Boundary Change Set

Last updated: 2026-07-07

This note identifies the small parent-AGID change set that protects the
commercial/private Veygrit snapshot from being mixed into the public AGID
workspace.

## Intended Commit Scope

Review these files together:

- `.gitignore`
- `GOVERNANCE.md`
- `docs/repository-owner-routing.md`
- `src/lib/repositoryOwnerRouting.test.ts`
- `scripts/verify-commercial-boundary-review.ts`
- `scripts/verify-open-source-repository-readiness.ts`
- `scripts/verify-oss-launch.ts`
- `scripts/verify-build-chunk-budget.test.ts`
- `package.json`

Related false-positive cleanup from the OSS launch gate:

- `src/lib/veygritHostedAddressLoginContract.ts`
- `src/lib/veygritHostedAddressLoginMock.ts`

## Scoped Diff Summary

- `.gitignore` blocks `commercial/` so private Veygrit snapshots are not
  accidentally staged into the public AGID workspace.
- `GOVERNANCE.md` and `docs/repository-owner-routing.md` define the
  `dawnportinfo-design` public-research boundary and the `veygrit-sys`
  commercial/private product boundary.
- `src/lib/repositoryOwnerRouting.test.ts`,
  `scripts/verify-commercial-boundary-review.ts`, package scripts, OSS
  readiness, and launch-gate updates make the boundary executable in CI/local
  verification.
- The hosted Address Login files only contain false-positive cleanup from the
  secret scan and do not introduce carrier, wallet, proof, credential, or raw
  address handling.

## Review Procedure

Before committing this boundary slice, confirm that the parent AGID workspace
only includes the intended boundary files above and that `commercial/` remains
ignored:

```bash
git status --short -- .gitignore GOVERNANCE.md docs/repository-owner-routing.md docs/commercial-boundary-change-set.md src/lib/repositoryOwnerRouting.test.ts scripts/verify-commercial-boundary-review.ts scripts/verify-open-source-repository-readiness.ts scripts/verify-oss-launch.ts scripts/verify-build-chunk-budget.test.ts package.json src/lib/veygritHostedAddressLoginContract.ts src/lib/veygritHostedAddressLoginMock.ts
git check-ignore -v commercial/veygrit-commercial-products/README.md
```

Expected review result for this slice:

- The scoped status output lists only the files named in this note.
- `npm run verify:commercial-boundary-review` confirms the scoped status
  command, scoped status output, ready-to-stage list, and optional staging
  command exactly match the intended boundary files.
- `commercial/veygrit-commercial-products/README.md` is ignored by
  `.gitignore` through the `commercial/` rule.
- No raw address, recipient, witness, private-key, proof-secret, production
  credential, customer operational data, live carrier traffic, or payment
  traffic is introduced by the parent AGID change set.

Ready-to-stage file list for this slice:

```text
.gitignore
GOVERNANCE.md
package.json
scripts/verify-build-chunk-budget.test.ts
scripts/verify-open-source-repository-readiness.ts
scripts/verify-oss-launch.ts
docs/commercial-boundary-change-set.md
docs/repository-owner-routing.md
scripts/verify-commercial-boundary-review.ts
src/lib/repositoryOwnerRouting.test.ts
src/lib/veygritHostedAddressLoginContract.ts
src/lib/veygritHostedAddressLoginMock.ts
```

Optional local staging command, after the review and verification commands pass:

```bash
git add -- .gitignore GOVERNANCE.md package.json scripts/verify-build-chunk-budget.test.ts scripts/verify-open-source-repository-readiness.ts scripts/verify-oss-launch.ts docs/commercial-boundary-change-set.md docs/repository-owner-routing.md scripts/verify-commercial-boundary-review.ts src/lib/repositoryOwnerRouting.test.ts src/lib/veygritHostedAddressLoginContract.ts src/lib/veygritHostedAddressLoginMock.ts
```

## Suggested Commit Message

```text
Document commercial repository boundary routing
```

## Reviewer Checklist

- Confirm that public research, OSS specifications, conformance fixtures, and
  launch-readiness docs stay under `dawnportinfo-design`.
- Confirm that commercial product snapshots, hosted operations, enterprise
  dashboards, managed registries, and customer integrations stay under
  `veygrit-sys`.
- Confirm that `commercial/` is ignored by the parent AGID repository.
- Confirm that the routing gate is included in `npm run verify:oss-launch`.
- Confirm that the false-positive token-request cleanup does not change raw
  address, recipient, witness, private-key, proof-secret, production
  credential, or live carrier/payment behavior.

## Boundary Protected

The private commercial snapshot is:

```text
https://github.com/veygrit-sys/veygrit-commercial-products
```

The parent AGID workspace should not stage `commercial/` into the public
repository. Commercial code, hosted operations, enterprise dashboards, managed
registries, customer-specific integrations, SLA tooling, carrier credentials,
payment operations, and private wallet operations stay under `veygrit-sys`
unless explicitly promoted after safety review.

## Verification

Run:

```bash
npm run verify:repository-owner-routing
npm run verify:commercial-boundary-review
npm run verify:oss-compatibility
npm run verify:oss-repository
npm run verify:preaudit-secrets
```

The full release gate also includes the routing check:

```bash
npm run verify:oss-launch
```

## Non-Claims

This change set does not claim that the commercial snapshot is production-ready,
carrier-ready, payment-ready, wallet/proof-provider-ready, legally reviewed,
privacy reviewed, or security reviewed.

It does not permit raw address, recipient, witness, private-key, proof-secret,
production credential, customer operational data, or live carrier/payment
traffic in GitHub.
