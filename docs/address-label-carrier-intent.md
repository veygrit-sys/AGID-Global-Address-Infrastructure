# Address Label / Carrier Intent

Address Label / Carrier Intent is the AGID/AOID shipment workflow object for label issuance, carrier acceptance, QR handoff, recipient proof, and completion receipts.

It is inspired by multi-carrier shipping APIs such as EasyPost, where an address and parcel are turned into a shipment, rates, label purchase, tracking, and webhook events. AGID does not make EasyPost a hard dependency. Instead, carrier APIs are treated as replaceable adapters and their outputs become commitment-safe intent evidence.

## Why Intent

Shipping label workflows should not be a loose set of buttons:

```text
validate address
confirm AGID/AOID
ask carrier
issue QR
scan by carrier
verify recipient
sign completion receipt
```

They need a single state object that can drive EC checkout, POS, CMS plugins, shopping agents, and humanitarian field tools.

## State Machine

```text
requires_address_verification
  -> requires_agid_aoid
  -> requires_carrier_acceptance
  -> requires_label_qr
  -> label_qr_ready
  -> recipient_proof_pending
  -> handoff_ready
  -> completed
```

Other terminal or side states:

- `requires_review`
- `rejected`
- `expired`

## Evidence Types

- `address-verification`
- `agid-aoid-check`
- `carrier-acceptance`
- `label-qr-issued`
- `carrier-scan`
- `recipient-proof`
- `terminal-receipt`
- `revocation-check`
- `freshness-check`
- `carrier-policy-check`
- `webhook-event`
- `customs-check`
- `manual-review`

Evidence must use commitments, fingerprints, receipt references, or signed event references. It must not contain raw addresses, raw AGID/AOID values, recipient names, phone numbers, proof codes, secrets, or carrier API keys.

## Carrier Adapter Boundary

Carrier APIs may provide:

- shipment reference
- rate reference
- label reference
- tracking reference
- carrier acceptance receipt
- webhook event reference

The intent stores references and receipts, not raw carrier payloads.

## Carrier Acceptance Policy

Carrier acceptance can be configured without storing the raw address. The intent stores a policy snapshot and coarse address-risk flags:

```ts
carrierPolicy: {
  rejectAddressDefect: boolean;
  rejectUndeliverableRegion: boolean;
  rejectPoBox: boolean;
  rejectAutoLock: boolean;
  requireAoidAccessProfileForPoBoxOrAutoLock: boolean;
  policyRef?: string;
}

addressRisk: {
  addressDefect: boolean;
  undeliverableRegion: boolean;
  poBox: boolean;
  autoLock: boolean;
  aoidAccessProfileConfirmed: boolean;
  reasonCodes: CarrierLabelRejectionReason[];
}
```

The expected policy behavior is:

- reject labels when the carrier policy disallows known address defects
- reject labels when the destination is outside the serviceable region
- reject PO Box or auto-lock destinations when the carrier does not serve them
- require AOID delivery-access confirmation for PO Box or auto-lock destinations before acceptance

AOID registration should record `deliveryAccess.kind` explicitly when a destination is an auto-lock building or a PO Box. Feedback from POS or address registration may record `address-defect`, `undeliverable-region`, `po-box`, or `auto-lock` as closed local learning signals. These records should contain reason codes, quality decisions, carrier id, and commitments only; they should not contain raw recipient data or full addresses.

For EasyPost-like adapters, map concepts as:

| EasyPost-like concept | AGID Carrier Label Intent |
| --- | --- |
| Address verification | `address-verification` evidence |
| Shipment creation | `carrier-acceptance` or pending carrier evidence |
| Rates | external rate reference |
| Label purchase | `label-qr-issued` evidence |
| Postage label | label reference or QR commitment |
| Tracking | external tracking reference |
| Webhook event | signed `webhook-event` evidence |

## Privacy Rules

The intent privacy boundary is:

```text
rawAddressStored: false
rawAgidStored: false
rawAoidStored: false
rawRecipientStored: false
rawProofCodeStored: false
rawLabelPayloadStored: false
carrierApiKeyStored: false
```

Public surfaces should show:

- current status
- next action
- stage checklist
- waybill alias or commitment
- receipt references
- carrier ID
- QR commitment
- validation warnings/errors

They should not show:

- full address
- precise AGID in high-risk mode
- recipient personal data
- proof code
- carrier API key
- raw label payload

## High-Risk Mode

High-risk mode is for DV safety, evacuation, refugee/humanitarian use, and other contexts where address disclosure can harm people.

Rules:

- recipient proof is required
- plaintext shipment carrier adapters are blocked
- use AGID-S or commitment references instead of precise public AGID
- use short TTL QR records
- require immediate revocation/used-nullifier marking after completion

## Implementation

Core implementation:

- `src/lib/carrierLabelIntent.ts`

Related modules:

- `src/lib/shippingLabelQr.ts`
- `src/lib/externalDeliveryApi.ts`
- `src/lib/addressIntent.ts`
- `src/lib/addressAccessAuth.ts`

The first version is adapter-neutral. A future carrier adapter can call an EasyPost-compatible, Shippo-compatible, carrier REST, or local mock API and append only safe evidence into the intent.
