# Veygrit -ship guest access boundary

## Access matrix

| Capability | Guest | Test publishable key | Logged-in merchant | Production effect |
| --- | --- | --- | --- | --- |
| Rate simulation | Allow | Allow | Allow | Sandbox quote only |
| Sandbox shipment | Allow | Allow | Allow | Synthetic label/tracking only |
| Shipment draft | Allow | Allow | Allow | No Carrier call |
| Address input | Allow | Allow through internal/test surfaces | Allow | Response only; raw address not stored in Guest auth DB |
| Test API | Allow | Allow | Allow | Sandbox endpoints only |
| Live rate / shipment / label | Deny | Deny | Explicit production permission required | UPS/DHL traffic |
| Carrier connection / credentials | Deny | Deny | Allow after authentication | Secrets Manager only |
| Webhook configuration | Deny | Deny | Allow after authentication | External delivery |
| Production API key | Deny | Deny | Allow after authentication and policy checks | Production access |
| Billing / team / KYC | Deny | Deny | Authenticated flow only | Account mutation |

The following operations always require an authenticated Merchant account: saving UPS/DHL credential references, purchasing a real label, issuing a production API key, and managing billing, teams, or Webhook configuration. A Guest token is never accepted as proof of account ownership for these operations.

The database constraint requires exactly these five Guest capabilities: `rate_simulation`, `sandbox_shipment`, `shipment_draft`, `address_input`, and `test_api`. Adding a sixth capability in application code cannot bypass the PostgreSQL closed allowlist.

## Session flow

1. `POST /v1/guest/sessions` creates a random `gst_...` token with a default two-hour lifetime.
2. The raw token is returned once. PostgreSQL stores only its SHA-256 hash.
3. The client sends `X-Veygrit-Guest-Token` or `Authorization: Guest <token>`.
4. Middleware consumes the route capability with one atomic PostgreSQL usage UPSERT.
5. Expired, revoked, rate-limited, or capability-denied sessions stop before the route handler.

Anonymous issuance is limited to ten sessions per hour for a keyed pseudonymous network fingerprint. The fingerprint is HMAC-SHA256; the raw IP is not stored. A minimum 32-character `VEYGRIT_SHIP_GUEST_FINGERPRINT_SECRET` is required.

## Capability budgets

| Capability | Limit | Window |
| --- | ---: | ---: |
| Rate simulation | 60 | 15 minutes |
| Sandbox shipment | 20 | 1 hour |
| Shipment draft | 50 | 1 hour |
| Address input | 60 | 15 minutes |
| Test API | 120 | 15 minutes |

The counter is per Guest Session and per capability. PostgreSQL resets an expired window and increments the new request in the same `INSERT ... ON CONFLICT ... DO UPDATE` statement.

## Routes

- `GET /v1/guest/access-policy` — public policy discovery
- `POST /v1/guest/sessions` — login-free session issuance
- `GET /v1/guest/session` — current Guest boundary
- `GET /v1/guest/test-api/ping` — test API
- `POST /v1/guest/shipment-drafts` — sandbox shipment intent/draft
- `POST /v1/guest/address-input` — UPS/DHL US address conversion without persistence
- `POST /v1/shipment-intents` — Guest draft or existing `pk_test_` key
- `POST /v1/delivery/rates` — Guest rate simulation or existing `pk_test_` key
- `POST /v1/delivery/allocate`, `/v1/shipments`, `/v1/hexaship/mvp-v0.1/shipments` — Guest sandbox shipment or existing `pk_test_` key

Merchant Console, incoming Tracking Webhooks, internal Carrier routes, and live UPS/DHL routes do not accept Guest tokens.

## Data and security boundary

- Guest tokens, idempotency keys, and issuer fingerprints are never stored raw.
- The Guest Session schema has no carrier-secret field. UPS/DHL credentials and OAuth tokens must never be copied into a Guest Session, draft, Audit Event, or idempotency payload.
- The public Sites build has no credential input or storage route. Carrier credential writes exist only in the private backend Secret management service and require a recently MFA-verified Merchant administrator.
- Carrier Connection requires a Merchant foreign key and stores only an opaque Secrets Manager reference. The runtime rejects raw client secrets, passwords, access tokens, and API keys in `credentialSecretRef`.
- PostgreSQL rejects every Guest shipment whose mode is not `test`, and every `live` shipment without both a Merchant and an active Carrier Connection reference.
- Guest address input has `Cache-Control: no-store, private` and is not written to Guest Session, Audit Event, or capability usage rows.
- Audit Event records Guest Session issuance/revocation by reference only.
- Browsers never receive a PostgreSQL role or connection string. All access goes through the backend runtime role with explicit table grants.
- Production requires `VEYGRIT_SHIP_GUEST_POSTGRES_URL` for a dedicated least-privilege `veygrit_ship_guest` role. That role can update Guest Session counters and append Audit Events, but has no Carrier Connection, Label, Webhook, Merchant, or production-shipment table privileges.
- RLS is not presented as a substitute for route authorization. If direct database access is introduced later, tenant context and forced RLS must be added before exposure.
- Existing `pk_test_` SDK behavior remains backward compatible.

## Login and promotion

When a Guest chooses to register:

1. authenticate the Merchant;
2. claim the Guest Session to that Merchant in one short transaction;
3. copy only explicitly selected sandbox draft references;
4. revoke the Guest token immediately;
5. require fresh Merchant authorization for Carrier connections, live labels, Webhooks, billing, and production API keys.

Guest authorization must never be upgraded in place by adding live capabilities to the Guest token.

## Deployment

Apply all migrations:

```powershell
$env:VEYGRIT_SHIP_POSTGRES_URL='postgresql://...'
$env:VEYGRIT_SHIP_GUEST_POSTGRES_URL='postgresql://veygrit_ship_guest:...'
$env:VEYGRIT_SHIP_GUEST_FINGERPRINT_SECRET='<at-least-32-random-characters>'
npm run migrate:veygrit-ship
npm run verify:veygrit-ship-guest-access
```

The application fails closed with `guest_access_unavailable` when PostgreSQL or the fingerprint secret is not configured. Existing test publishable keys continue to work on Sandbox routes.
