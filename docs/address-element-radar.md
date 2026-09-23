# AGID Address Element and Address Radar

AGID Address Element is the embeddable address input layer for EC, CMS, POS, and shopping agents. It is intentionally similar to Stripe Elements: the host app keeps raw user input locally, while AGID receives a safe session state, evidence fingerprints, language tab state, and an AddressIntent preview.

Address Radar is the risk layer for address workflows. It scores copy QR risk, address enumeration, duplicate AOID registration, suspicious delivery handoff receipts, stale registries, low address quality, and offline sync conflicts.

## Address Element

Core module:

- `src/lib/addressElement.ts`
- `src/components/AgidAddressElement.tsx`
- `src/web-components/agid-address-element.ts`
- API: `GET /api/v1/address-element/capabilities`
- API: `POST /api/v1/address-element/session`

The public API accepts:

- field presence flags
- country code
- postal evidence summaries
- AGID commitment or safe fingerprint
- scan capability flags
- high-risk mode flag

The public API rejects:

- plaintext address
- recipient name
- phone number
- unit or room
- raw AGID
- raw AOID
- proof code
- recipient secret
- correction text

The React component may hold raw form values locally because it runs in the user's browser or POS terminal. It emits only `AddressElementSession` and `AddressIntent` preview objects to the host app.

Additional maturity modules:

- `src/lib/addressElementEvents.ts` defines the no-raw host event contract for EC, CMS, POS, shopping-agent, and registration surfaces.
- `src/lib/addressElementReadiness.ts` summarizes professional readiness for checkout integrators, addressing specialists, carrier operators, privacy/security reviewers, accessibility/i18n reviewers, support reviewers, and developer-platform owners.
- `docs/address-element-readiness-ja.md` explains the role-based checks and embedding contract in Japanese.
- `docs/agid-address-element-web-components.md` explains the framework-neutral `<agid-address-element>` custom element for EC, CMS, POS, shopping-agent, hotel check-in, and registration flows.

Recommended verification:

```text
npm run verify:address-element
npm run verify:address-element-web-components
npm run verify:no-raw-address
```

## Address Radar

Core module:

- `src/lib/addressRadar.ts`
- API: `GET /api/v1/address-radar/rules`
- API: `POST /api/v1/address-radar/evaluate`

Initial rule groups:

- QR copy and replay: missing `jti`, expired token, already-used token, repeated reuse, missing live challenge in high-risk mode.
- QR freshness in high-risk mode: reject QR/NFC tokens older than the configured short-lived window, defaulting to 10 minutes.
- Address enumeration: high lookup velocity, many distinct AGIDs, many reverse lookups, repeated failed recipient proofs.
- AOID duplicate risk: same commitment in too many registrations, nullifier reuse.
- Handoff integrity: unsigned carrier scan, untrusted carrier device, missing recipient proof, missing terminal/device identity, time skew, rescan after completion.
- Registry status: revoked or stale credential, issuer, AGID-S, or waybill alias.
- Quality and offline: low address quality, partial address, partial address on high-value delivery, local ledger conflicts, sync backlog.
- Advanced device posture: missing attestation, low trust scores, stale device keys, repeated device failures, rooted/jailbroken/emulated runtimes, and clock tamper signals.
- Route plausibility: coarse region mismatch, country mismatch, scan distance/time combinations that imply impossible travel, and suspicious rescan paths.
- Issuer and domain integrity: unknown/suspended issuer, low issuer trust score, trust-root mismatch, missing domain separation, consent-scope mismatch, and cross-purpose token or nullifier reuse.
- Behavioral anomalies: one device serving too many recipients, one recipient appearing across too many devices, one AOID appearing across too many terminals, high carrier failure rate, and rapid return/refund bursts.
- Feedback and learning protection: bursty corrections, contradictory corrections, untrusted feedback source, and model-poisoning suspicion are quarantined instead of learned automatically.
- Customs and cross-border conflicts: route-country mismatch, HS-code mismatch, declared-value outlier, and restricted-goods flags force compliance review.

Canonical examples:

```text
if nullifier_reused then block
if address_quality = partial and high_value_delivery then review
if qr_age > 10min and high_risk_mode then reject
if carrier_device_untrusted then require recipient passkey
if device_runtime_compromised then suspend carrier device
if domain_separation_missing then block domain
if feedback_poisoning_suspected then quarantine feedback
if impossible_travel then require dual-control review
```

## Recommended Flow

```text
Address Element local form
  -> safe session
  -> AddressIntent preview
  -> Address Radar evaluate
  -> allow / review / block
  -> POS, EC, CMS, or shopping-agent next action
```

High-risk mode should prefer AGID-S or commitments, short-lived QR/NFC payloads, live recipient challenges, no precise public AGID display, and no address history retention.

Advanced Radar inputs must remain derived signals, not raw surveillance data. Send trust scores, coarse mismatch flags, counts, commitments, and public registry states. Do not send raw addresses, raw AGID/AOID values, device fingerprints, IP addresses, exact location traces, recipient names, phone numbers, or proof codes.
