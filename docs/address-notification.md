# Address Notification

Address Notification is the AGID/AOID notification layer inspired by multi-channel communication products such as Twilio Messaging, Verify, Voice, WhatsApp-style messaging, and SendGrid-style email delivery. The AGID implementation keeps the core free of vendor lock-in: it builds a privacy-safe notification plan, and optional adapters can deliver the plan through SMS, email, voice, WhatsApp-style templates, push, webhooks, or local in-app messages.

The key rule is simple:

**Notification text must not contain raw addresses, raw AGID, raw AOID, coordinates, recipient names, phone numbers, email addresses, room/unit details, proof codes, or AGID-S payloads.**

Notifications should contain only a short-lived alias, link, status, or action prompt.

## Safe Notification Examples

- "Please confirm receipt with the secure short-lived link."
- "The delivery QR has expired. Request a new short-lived alias before handoff."
- "This workflow needs reverification before it can continue."
- "The handoff was completed. A redacted receipt is available in the audit view."

## Unsafe Notification Examples

- "Deliver to 1-2-3 Example Street, room 301."
- "Your AGID is JP05...."
- "Open AGIDS1-...."
- "Call +81..."
- "The recipient is ..."

## Channels

| Channel | Provider Family | Notes |
| --- | --- | --- |
| `sms` | `twilio-messaging-like` | Short text, alias-only body |
| `email` | `sendgrid-email-like` | Template email, no address body |
| `voice` | `twilio-voice-like` | Short neutral prompt only |
| `whatsapp` | `twilio-messaging-like` | Approved-template style recommended |
| `push` | `local-only` | Device push with alias |
| `webhook` | `webhook-like` | Signed event, not private payload |
| `in-app` | `local-only` | Local UI alert |

## Events

Initial events:

- `recipient-confirmation-required`
- `delivery-qr-expiring`
- `delivery-qr-expired`
- `reverification-required`
- `handoff-ready`
- `handoff-complete`
- `address-link-granted`
- `credential-revoked`
- `offline-sync-conflict`
- `manual-review-required`
- `return-label-ready`
- `aid-eligibility-review`
- `agid-s-key-rotation`

## Output Boundary

The notification plan returns:

- notification id
- event
- channel
- provider family
- title and body
- short-lived action alias/link
- destination alias
- reason code
- template id
- message hash
- metadata commitment
- required controls
- privacy flags
- errors and warnings

It does not return the raw contact destination. If a phone number or email address is needed by a delivery provider, it must be passed to the adapter transiently and never stored in AGID logs, audits, or public records.

## Implementation

Files:

- `src/lib/addressNotification.ts`
- `src/lib/addressNotification.test.ts`

Primary API:

```ts
buildAddressNotification({
  event: 'recipient-confirmation-required',
  channel: 'sms',
  actionAlias: 'alias:handoff:123',
  destination: { alias: 'recipient-channel:masked' },
});
```

Validation:

```ts
const result = validateAddressNotificationPlan(plan);
```

## High-Risk Mode

High-risk contexts include evacuation, domestic violence, refugee support, disaster aid, sensitive humanitarian delivery, and other workflows where location disclosure may create harm.

High-risk notification mode:

- clamps TTL to five minutes
- uses alias-only content
- recommends no history retention
- may require review for email workflows
- avoids exact AGID or address references

## Relationship to Other AGID Components

- Address Access/Auth decides whether a notification action is allowed.
- Address Link creates scoped user permission.
- Address Item and Portal let users review or revoke connected address permissions.
- Address Radar can trigger notification events such as QR expiry, suspicious reuse, terminal untrusted, or manual review.
- AGID-S key rotation can trigger secure-share notifications without exposing the encrypted token.
