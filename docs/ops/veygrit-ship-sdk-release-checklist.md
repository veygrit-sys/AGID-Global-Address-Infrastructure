# Veygrit Ship SDK Release Checklist

Version: `veygrit-ship-sdk-release-checklist-v0.1`

This checklist is a local readiness record for the public Veygrit Ship SDK packages:

- JavaScript SDK: `sdk/veygrit-ship-js`
- PHP SDK: `sdk/veygrit-ship-php`
- Credential surface matrix: `docs/ops/veygrit-ship-credential-surface-matrix.md`

## Boundary

- No registry publication is authorized by this checklist.
- No production carrier traffic is authorized by this checklist.
- No remote repository mutation, pull request creation, hosted deployment, or package publication is authorized by this checklist.
- No raw address, recipient, witness, private-key, proof-secret, carrier credential, or production credential material may be handled during these checks.
- Do not send carrier credentials through this SDK.

## Local Gates

Run these gates from the repository root before any human release review:

```powershell
npm run verify:veygrit-ship-sdk-readmes
npm run verify:veygrit-ship-sdk-packages
npm run verify:veygrit-ship-sdk-build-hygiene
npm run verify:veygrit-ship-sdk-package-archives
npm run verify:veygrit-ship-sdk-release-checklist
npm run verify:veygrit-ship-release-gate-index
npm run verify:veygrit-ship-release-gate-status
npm run verify:veygrit-ship-operations
```

Composer validation is optional when Composer is available locally; the archive gate must still check `sdk/veygrit-ship-php/composer.json` when Composer is unavailable.

## Evidence To Review

| Evidence | Required signal |
| --- | --- |
| SDK READMEs | Both public READMEs link to the credential surface matrix and state the no-credential SDK boundary. |
| Package manifests | JS and PHP package metadata include README files, local test commands, and no publish/deploy automation. |
| Build output | JS typecheck and build pass locally, and generated outputs do not expose carrier credential, proof secret, witness, private-key, or credential-reference fields. |
| Archive dry run | JS dry-run package contents include only README, package metadata, generated JavaScript/type declarations, and source maps. |
| Release gate index | The local operations gate inventory lists every aggregate gate with its command, boundary, and non-claim. |
| Release gate status | The public-safe status fixture and Guest route expose only gate command, boundary, and non-claim metadata with no tenant, request, raw address, recipient, credential, witness, private-key, proof-secret, package archive, or production carrier identifiers. |
| Aggregate operations gate | `npm run verify:veygrit-ship-operations` includes all SDK readiness gates plus Veygrit Ship operational safety checks. |

## Non-Claims

- Passing this checklist is not proof of carrier approval, valid live credentials, label purchase authority, or production carrier availability.
- Passing this checklist is not permission to publish packages, push branches, create pull requests, save/deploy hosted Sites, or send production traffic.
- Passing this checklist is not proof that cloud IAM, secret rotation, registry provenance, Packagist metadata, or live carrier contracts are production-ready.
