# Veygrit -ship carrier Secret management

## Boundary

The public Sites build is a static frontend. It has no carrier credential input, Secret Manager SDK, credential-storage endpoint, cloud identity, or direct PostgreSQL access. It may show connection status and a masked value returned by an authenticated backend, but it cannot collect or persist UPS/DHL credentials.

Credential writes are available only through `CarrierSecretManagementService` in a private backend control plane. No public or Guest route registers this service.

## Stored data

Secret values are written to one of these server-side providers:

- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- an injected external vault adapter

PostgreSQL stores only:

- provider and Secret reference;
- provider Version reference;
- four safe trailing display characters;
- last rotation and next rotation timestamps;
- append-only rotation outcome;
- administrator actor reference, MFA method, and an SHA-256 hash of the MFA session reference;
- a redacted Audit Event.

It never stores the Secret value, access token, refresh token, MFA token, raw MFA session, or cloud workload credential.

## Operation sequence

1. The private identity layer verifies the Merchant administrator and recent MFA.
2. The backend passes the verified `AdminMfaContext` directly; request headers are not trusted as MFA evidence.
3. The multi-cloud adapter writes the Secret or a new Secret Version outside a database transaction.
4. The temporary backend buffer is overwritten after the vault call.
5. One short PostgreSQL statement updates only references and metadata, appends the credential-rotation ledger, and appends an Audit Event.
6. The caller receives only `••••LAST4`, provider, and rotation timestamps.

MFA must be no older than ten minutes. The accepted administrator evidence methods are WebAuthn, passkey, security key, TOTP, or another upstream method explicitly marked as MFA.

## Rotation

`rotateCredentials` writes a new provider Version and records a default 90-day next-rotation timestamp. The due-date partial index supports a private worker or administrator reminder. UPS/DHL client-secret rotation also has to update the carrier-side credential; enabling a cloud vault schedule alone does not rotate the UPS/DHL developer application credential.

- AWS can use managed rotation where supported or a Lambda rotation function for other secrets.
- GCP uses Secret Versions; rotation schedules can publish notifications, while the application still performs the external credential update.
- Azure secret rotation commonly uses Key Vault events plus an Azure Function that updates both the target service and Key Vault.

## Runtime configuration

The official SDK adapters use the cloud's server-side identity chain. Do not place cloud access keys in Sites build variables.

```env
AWS_REGION=us-east-1
VEYGRIT_SHIP_AWS_SECRET_PREFIX=veygrit-ship/carriers

VEYGRIT_SHIP_GCP_SECRET_PROJECT=veygrit-prod
VEYGRIT_SHIP_GCP_SECRET_PREFIX=veygrit-ship

VEYGRIT_SHIP_AZURE_KEY_VAULT_URL=https://example.vault.azure.net
VEYGRIT_SHIP_AZURE_SECRET_PREFIX=veygrit-ship
```

Prefer workload identity, IAM roles, GCP Application Default Credentials, or Azure managed identity. The PostgreSQL `veygrit_ship_guest` role is explicitly denied access to the credential rotation table.

## Delivery Gateway capability boundary

Veygrit -ship live-carrier activation checks must treat the Delivery Gateway `carrier-capability` surface as OSS-contract metadata, not carrier approval or credential evidence:

- Capability metadata is not a live carrier contract.
- OSS capability fixtures are not production carrier credentials.

These non-claims are required before any UPS/DHL launch-readiness review. Carrier activation still requires server-side credential custody, carrier account approval, production traffic gates, and private operator review outside public fixtures.

## Verification

```powershell
npm run verify:veygrit-ship-secret-management
npm run verify:veygrit-ship-guest-access
npm run verify:veygrit-ship-store
```

Primary references:

- AWS Secrets Manager rotation: https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html
- Google Secret Manager overview and versions: https://docs.cloud.google.com/secret-manager/docs/overview
- Azure Key Vault secret rotation: https://learn.microsoft.com/en-us/azure/key-vault/general/autorotation
