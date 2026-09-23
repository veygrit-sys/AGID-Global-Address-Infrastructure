# Veygrit Ship Credential Surface Matrix

Version: `veygrit-ship-credential-surface-matrix-v0.1`

| Surface | Audience | Credential input | Public visibility | Persisted reference | Verification |
| --- | --- | --- | --- | --- | --- |
| guest-public | Anonymous Guest sessions and public Sites/Sandbox route readers | none | none | none | npm run verify:veygrit-ship-guest-access |
| merchant-control-plane | Authenticated Merchant administrators in the private backend control plane | private-merchant-admin-mfa-only | masked-status-only | merchant-row-secret-reference-only | npm run verify:veygrit-ship-secret-management<br>npm run verify:veygrit-ship-store |
| internal-carrier-runtime | Server-side carrier adapters, workers, and operator-only runtime jobs | server-runtime-only | none | merchant-row-secret-reference-only | npm run verify:ups-live-connector<br>npm run verify:dhl-live-connectors<br>npm run verify:veygrit-ship-label-management<br>npm run verify:veygrit-ship-workers |

## Allowed Reference Formats

- `merchant-control-plane`: `secretref_*`, `arn:aws:secretsmanager:*`, `vault://*`, `https://*.vault.azure.net/secrets/*`, `projects/*/secrets/*/versions/*`
- `internal-carrier-runtime`: `secretref_*`, `arn:aws:secretsmanager:*`, `vault://*`, `https://*.vault.azure.net/secrets/*`, `projects/*/secrets/*/versions/*`

## Non-Claims

### guest-public

- Guest sessions do not create, store, return, or promote carrier credential references.
- Guest route success is not proof of Merchant account ownership, carrier account approval, live labels, or production carrier traffic.

### merchant-control-plane

- A stored carrier connection reference is not proof of carrier approval, valid live credentials, or label purchase authority.
- Masked status output is not a credential export surface.

### internal-carrier-runtime

- Internal adapter availability is not a public credential visibility grant.
- OSS capability metadata is not production carrier credential evidence or a live carrier contract.
