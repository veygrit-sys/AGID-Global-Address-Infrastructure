# Call Certified

Call Certified is a certified-call layer for AGID/AOID adjacent workflows. It does not replace a telephony provider. It defines the trusted state of a call: who is authenticated, what purpose the call is for, which contract or procedure it is bound to, whether consent and recording policy are satisfied, and what redacted evidence can be exported.

## Core Idea

Phone calls are traditionally weak evidence because the parties, purpose, consent, and contract context are often ambiguous. Call Certified turns a call into a structured business action:

```text
verified identity + purpose + contract binding + consent + signed evidence = certified call state
```

The implementation in `src/lib/callCertified.ts` is provider-neutral. Twilio Voice, AWS Connect, Genesys, SIP trunks, or local WebRTC can be added later as adapters.

## Certification Gates

The first version enforces these gates:

- both parties authenticated with sufficient KYC level
- purpose-bound call token
- optional contract or procedure binding
- caller and recipient consent
- recording consent when recording is required
- encrypted recording envelope requirement
- tamper-evident proof hash
- commitment-only evidence logs

## Status Model

The session status is one of:

- `requires-identity`
- `requires-contract-binding`
- `requires-consent`
- `certified-ready`
- `active`
- `completed`
- `requires-review`
- `rejected`
- `expired`

This lets a UI display a large operator-facing badge such as `Certified Call`, `Consent Required`, or `Not Certified`.

## Evidence Export

`buildCallCertifiedEvidenceExport` produces a redacted export plan for PDF/JSON evidence packages. It contains call status, purpose, party credential commitments, contract commitment, consent receipt commitment, evidence commitments, and proof hash.

It deliberately does not expose:

- raw name
- raw phone number
- raw email
- raw address
- raw contract text
- raw transcript
- raw recording URL

## AGID/AOID Connection

Call Certified is useful when an address, AOID credential, contract, or delivery change is too sensitive to confirm by an ordinary phone call. Example uses:

- credit-card or telecom contract confirmation
- high-value EC order confirmation
- delivery address change confirmation
- public-service or aid casework calls
- customer-support calls that need verified consent and evidence

## Compliance Note

This module is an engineering control model, not legal advice. Jurisdiction-specific recording consent, telecommunications, identity verification, and retention requirements must be reviewed before production use.
