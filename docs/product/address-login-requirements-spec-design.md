# Address Login Requirements, Specification, and Design Overview

Address Login is a wallet-mediated login and consent flow for address-related
claims. It lets a merchant, hotel, carrier, POS terminal, or travel service ask
for only the address facts it needs, while the user keeps raw address data in an
Identity Wallet or trusted address provider.

The product principle is:

```text
Do not login with an address string.
Login with a purpose-bound address credential, consent envelope, and proof plan.
```

## 1. Product Goal

Address Login should replace repeated address entry in checkout, travel,
pickup, hotel delivery, returns, and regulated identity flows.

It must support:

- using a verified Address Credential without exposing raw address to the merchant
- accepting every country, territory, disputed-region, and special-region address form through AGID country formats or a safe fallback form
- showing and accepting native language, English, or native-and-English address input
- proving deliverability, country/region membership, postal-equivalent area, freshness, and not-revoked status
- carrier-only decryption when delivery execution needs the full address
- manual review, safe geofence, fraud, and quality next actions
- developer integration through a button, SDK, redirect, webhook, and test vectors

## 2. Actors

| Actor | Role |
| --- | --- |
| User | Owns wallet, grants consent, chooses credential/address alias. |
| Identity Wallet | Stores credentials, keys, consent history, proof bundles, and display preferences. |
| Merchant / Service | Requests address-related claims for a specific purpose. |
| Carrier | Receives carrier-only decryptable delivery reference when allowed. |
| Issuer | Issues and revokes Address Credentials. |
| Registry | Resolves issuer trust, revocation, freshness roots, and public keys. |
| AGID Resolver | Validates country rules, deliverability, postal-equivalent regions, and quality state. |

## 3. Non-Goals

Address Login should not:

- become a general social login profile store
- send raw address text to merchants by default
- store recipient phone numbers or private delivery notes in public callbacks
- replace carrier responsibility for actual delivery
- prove real-world address truth without issuer trust, freshness, revocation, and source evidence

## 4. Core Requirements

| ID | Priority | Requirement |
| --- | --- | --- |
| AL-FR-001 | MUST | Merchant can request address claims without receiving raw address by default. |
| AL-FR-002 | MUST | User can approve purpose, credential, and disclosure mode in the wallet. |
| AL-FR-003 | MUST | Carrier-only decryption is supported for shipping flows. |
| AL-PR-001 | MUST | Public events, callbacks, logs, and analytics contain no raw address, proof witness, private key, or recipient material. |
| AL-PR-002 | MUST | Consent is purpose-bound, time-bounded, and revocable. |
| AL-SEC-001 | MUST | Login is bound to client, redirect URI, state, nonce, and device/wallet approval. |
| AL-I18N-001 | MUST | Native, English, and native-and-English display modes are supported. |
| AL-I18N-002 | MUST | Address Login reuses Address Element country forms for national order, labels, postal-code policy, no-postcode countries, and fixed-code territories. |
| AL-I18N-003 | SHOULD | Address Login can cite AGID OSS assets such as country packs, P0 gazetteer packs, official postal source catalog, POI graph, safe geofence, and spatial intelligence. |
| AL-DX-001 | MUST | Developers can use SDK, hosted redirect, webhook, and test vectors. |
| AL-OPS-001 | SHOULD | Quality/fraud/geofence results return next actions rather than raw internal scores. |
| AL-A11Y-001 | SHOULD | Consent screens are keyboard, mobile, and screen-reader accessible. |

Executable requirement catalog:

- `src/lib/addressLoginSpec.ts`

## 4.1 Global Address Form Contract

Address Login must not invent a single world form. It inherits the AGID Address
Element country-form model:

- `src/data/address_formats/**`
- `src/lib/addressElementCountryForm.ts`
- AGID country packs
- P0 gazetteer packs
- official postal source catalog
- POI graph and safe geofence policy where delivery requires local context

For every country or region:

```text
if country-specific format exists:
  render native form, English form, or both
  apply country ordering and postal-code policy
else:
  render safe fallback form
  mark fallbackFormUsed = true
  require review before claiming full country-specific correctness
```

The fallback form keeps the product usable worldwide while honestly signaling
that the country-specific model still needs improvement.

### Required Form Capabilities

The wallet and SDK should expose a safe form capability object:

```json
{
  "countryCode": "JP",
  "countryName": "Japan",
  "displayLanguageMode": "native_and_english",
  "nativeInputSupported": true,
  "englishInputSupported": true,
  "bilingualInputSupported": true,
  "fallbackFormUsed": false,
  "publicFieldKeys": ["countryCode", "postcode", "state", "city", "street"],
  "privateFieldKeys": ["recipient", "unit", "phone"],
  "postalCode": {
    "available": true,
    "required": true,
    "format": "NNN-NNNN"
  },
  "sourceRefs": [
    "address-element-country-form",
    "src-data-address-formats",
    "agid-country-pack",
    "official-postal-source-catalog"
  ]
}
```

For a no-postcode place:

```json
{
  "countryCode": "HK",
  "postalCode": {
    "available": false,
    "required": false,
    "format": "not used"
  }
}
```

This prevents the common failure where global forms force a postal-code field
onto countries and territories that do not use one.

## 4.2 OSS Assets Address Login May Cite

Address Login may cite and compose AGID open-source assets:

| OSS asset | Use in Address Login |
| --- | --- |
| Address Element country form | national field order, local labels, English shipping display |
| `src/data/address_formats/**` | country-specific schema and postal-code policy |
| AGID country pack | country/territory metadata and validation readiness |
| P0 gazetteer pack | place-name seed and source ledger for weak/open-data countries |
| official postal source catalog | official postal-code API/source metadata |
| POI graph | weak-address deliverability through ports, depots, lockers, schools, hospitals, hotels |
| safe geofence policy | disclosure mode: deliverable, manual-review, non-public, ZK-only |
| address spatial intelligence | clustering, Voronoi zones, map matching, congestion and cache decisions |

These references are evidence and UI capability inputs. They do not override the
privacy rule: merchant callbacks still receive only safe claims and references.

## 5. Disclosure Modes

| Mode | Meaning | Default Use |
| --- | --- | --- |
| `proof_only` | Merchant receives proof result and safe claims only. | Anonymous shipping, regulated checks, region proof. |
| `selective_disclosure` | User reveals selected fields such as country or city. | Low-risk forms, travel check-in. |
| `carrier_decryptable` | Carrier can decrypt full address only for execution. Merchant cannot. | Checkout shipping. |
| `merchant_visible` | Merchant can see address. High-risk and not default. | Legacy compatibility only. |

## 6. Claim Model

Address Login uses address claims rather than raw strings:

```text
address_credential_valid
user_approved
deliverable
country
region_membership
postal_equivalent
quality_threshold
not_revoked
freshness
device_bound
carrier_decryptable_address
customs_minimum_fields
```

Claims are selected from purpose, risk, and disclosure mode.

Examples:

```text
shipping + carrier_decryptable
-> credential valid, user approved, deliverable, quality threshold,
   not revoked, freshness, carrier decryptable address

regulated identity + proof_only
-> credential valid, user approved, not revoked, freshness,
   postal equivalent, device bound, region membership
```

## 7. Primary Flow

```text
Merchant app
  -> Address Login button
  -> /address-login/authorize
  -> Wallet opens request
  -> User selects credential/address alias
  -> Wallet compiles proof/disclosure plan
  -> User approves purpose-bound consent
  -> Merchant receives redacted login result
  -> Carrier receives decryptable reference only if needed
```

## 8. API Surface

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/address-login/authorize` | Start wallet authorization request. |
| POST | `/address-login/token` | Exchange code for redacted login result. |
| POST | `/address-login/proof/verify` | Verify proof bundle and credential state. |
| POST | `/address-login/consent/revoke` | Revoke purpose-bound consent. |
| POST | `/address-login/carrier/decrypt-request` | Request carrier-only decryption authorization. |
| POST | `/address-login/webhooks` | Redacted lifecycle events. |
| GET | `/address-login/test-vectors` | Synthetic conformance fixtures. |

All public endpoints are no-raw-address by default.

## 9. Request Shape

```json
{
  "clientId": "merchant_123",
  "redirectUri": "https://merchant.example/callback",
  "state": "opaque_state",
  "nonce": "random_nonce",
  "purpose": "shipping",
  "requestedClaims": [
    "address_credential_valid",
    "user_approved",
    "deliverable",
    "not_revoked",
    "freshness",
    "carrier_decryptable_address"
  ],
  "disclosureMode": "carrier_decryptable",
  "riskLevel": "standard",
  "displayLanguageMode": "native_and_english",
  "countryHints": ["JP"],
  "carrierId": "carrier_abc"
}
```

## 10. Result Shape

```json
{
  "status": "approved",
  "subjectAlias": "pairwise_sub_abc",
  "consentEnvelopeId": "ace_123",
  "credentialRef": "cred_ref_123",
  "proofBundleRef": "proof_ref_123",
  "publicClaims": {
    "address_credential_valid": true,
    "deliverable": true,
    "not_revoked": true
  },
  "encryptedAddressForCarrierRef": "carrier_blob_ref_123",
  "safeDisplayLines": [
    "配送可能",
    "住所は店舗に非表示",
    "配送会社のみ復号可"
  ],
  "warnings": [],
  "nextAction": "continue_checkout"
}
```

## 11. Design Overview

### Merchant UI

- Primary button: `Address Login`
- Secondary text: `住所を入力せず、ウォレットで配送先を承認`
- Shows only final state: `配送可能`, `要確認`, `住所非表示`, `配送会社のみ`
- Never shows raw address unless merchant-visible mode is explicitly approved.

### Wallet Consent Sheet

Top area:

- merchant/service name
- requested purpose
- risk level
- disclosure mode

Address choice:

- saved address aliases such as `Home`, `Office`, `Hotel`, `Locker`
- verification state
- language display toggle: native / English / both

Proof and disclosure panel:

- facts to prove
- who can see what
- expiration and revocation
- carrier decryptability if relevant

Primary action:

- `承認して続行`

Secondary actions:

- `別の住所を選ぶ`
- `詳細を見る`
- `拒否`

### Developer Console

Developer settings should expose:

- redirect URIs
- allowed purposes
- allowed disclosure modes
- carrier IDs
- webhook endpoints
- test vector download
- no-raw-address callback validator
- proof readiness state

## 11.1 Implemented Product Slice

The current AGID app now exposes an Address Login product surface at:

```text
/address-login
```

This screen joins the user-facing and merchant-facing halves of the flow:

| Area | Implemented surface |
| --- | --- |
| User experience | Wallet consent flow from merchant request to carrier handoff. |
| Merchant request builder | Purpose, disclosure mode, risk level, country, and language mode. |
| Country form capability | Native/English/bilingual form readiness, postal-code policy, fallback state, and source references. |
| Merchant control plane | Client setup, disclosure policy, global form coverage, test vectors, webhook/audit, support review. |
| SDK handoff | Hosted button and callback snippet generated from the same request model. |
| Safe callback preview | Redacted result containing aliases, claims, proof references, and carrier references only. |
| Safety gates | Redirect URI, state/nonce, no-raw-address callback validator, pairwise alias, HMAC, carrier scope, test vectors. |

Executable source:

- `src/components/AddressLoginExperienceScreen.tsx`
- `src/lib/addressLoginSpec.ts`
- `src/components/AddressLoginExperienceScreen.test.ts`

Verification:

```bash
npm run verify:address-login-spec
```

## 12. State Machine

```text
requested
  -> wallet_opened
  -> credential_selected
  -> proof_plan_ready
  -> consent_granted
  -> result_issued
  -> completed

requested
  -> expired

credential_selected
  -> needs_review

wallet_opened
  -> denied
```

## 13. Safety Rules

- Merchant callbacks must use pairwise subject aliases.
- Address Credential refs must be opaque references.
- Carrier decryptable address must be referenced, not logged as ciphertext payload in analytics.
- State and nonce are mandatory.
- High-risk and regulated flows require device-bound claims.
- Geofence, fraud, and quality warnings must return next actions, not hidden silent approvals.

## 14. MVP Scope

MVP:

- hosted Address Login button
- wallet consent sheet
- synthetic test vectors
- carrier-decryptable shipping result
- proof-only result for deliverability
- consent revoke
- redacted webhook
- developer console settings

Not MVP:

- full social graph
- travel login
- customs automation
- real ZK circuit production proof
- global issuer marketplace

## 15. Verification

Executable spec tests:

```bash
npm run verify:address-login-spec
```
