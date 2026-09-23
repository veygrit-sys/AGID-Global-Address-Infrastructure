# Google Service Integration

This integration layer describes which Google services can be connected to AGID/AOID and under what privacy controls. Google services are optional provider adapters; the OSS core must keep local, self-hosted, and open-data paths available.

## Adopted Service Families

| Family | Services | AGID/AOID use |
| --- | --- | --- |
| Identity / Workspace | Identity Platform, Admin SDK, Gmail, Drive, Sheets, Calendar, Chat | staff SSO, redacted alerts, encrypted evidence envelopes, scheduling, aggregate exports |
| Maps Platform | Address Validation, Geocoding, Places, Routes | optional provider checks for address validation, geocoding, POI/PUDO search, ETA |
| Cloud AI | Document AI, Vision OCR, Translation | optional OCR/import and translation fallback after explicit consent |
| Security | Cloud KMS, Secret Manager, reCAPTCHA Enterprise | key references, secret references, abuse protection |
| Events / Compute | Pub/Sub, Cloud Tasks, Cloud Run | redacted event dispatch, async provider jobs, server-side adapters |
| Storage / DB / Analytics | Cloud Storage, Firestore, Cloud SQL for PostgreSQL, BigQuery, Logging/Monitoring | encrypted evidence objects, registry metadata, caches, aggregate analytics |
| Notifications | Firebase Cloud Messaging | push notifications without address content |

## Privacy Rule

The default rule is:

```text
Do not send raw address, raw AGID/AOID, proof code, PIN, QR payload, NFC payload, phone,
or precise high-risk location to Google services unless the selected service explicitly
requires ephemeral plaintext processing and the user or enterprise has consented.
```

The implementation enforces this through `buildGoogleIntegrationPlan`.

## API

```ts
import {
  buildGoogleIntegrationPlan,
  getGoogleServiceProfile,
  listGoogleServiceProfiles,
} from './googleServiceIntegration';
```

Example:

```ts
const plan = buildGoogleIntegrationPlan({
  serviceId: 'google-maps-address-validation',
  purpose: 'address-validation',
  payloadClass: 'plaintext-address',
  ownerConsent: true,
  encryptedInTransit: true,
  serverSideOnly: true,
});
```

The plan returns:

- whether the integration is allowed
- required environment variables
- required controls
- recommended OAuth scopes
- whether plaintext address data would be sent
- privacy warnings and errors

## Recommended Controls

- Use server-side proxies for address-bearing requests.
- Restrict Google API keys by API, referrer/IP, and quota.
- Use Workload Identity, KMS, or Secret Manager for credentials.
- Do not put Google OAuth client secrets or service account keys in browser bundles.
- Log aliases, commitments, fingerprints, and status only.
- Keep local/OSS validation and geocoding paths available.
- In high-risk mode, prefer AGID-S, local OCR, local geocoding, or self-hosted open-data services.

## Official Documentation References

- Google Maps Address Validation: https://developers.google.com/maps/documentation/address-validation/overview
- Google Maps Geocoding: https://developers.google.com/maps/documentation/geocoding
- Google Cloud Document AI: https://cloud.google.com/document-ai
- Enterprise Document OCR: https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr
- Google Workspace API enablement: https://developers.google.com/workspace/guides/enable-apis
- Google Calendar API: https://developers.google.com/workspace/calendar/api/guides/overview
- Cloud KMS: https://docs.cloud.google.com/kms/docs
- Cloud Storage: https://docs.cloud.google.com/storage/docs
- Pub/Sub: https://docs.cloud.google.com/pubsub/docs
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
