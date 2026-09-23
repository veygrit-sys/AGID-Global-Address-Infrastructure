# Microsoft Service Integration

AGID/AOID can integrate with Microsoft services without making Microsoft a hard
dependency. The integration should be adapter-based: local and OSS flows remain
usable, while enterprise deployments can connect Microsoft Entra ID, Microsoft
Entra External ID, Microsoft Entra Verified ID, Microsoft Graph, Teams,
SharePoint/OneDrive, Azure Maps, Azure AI Document Intelligence, Azure Key
Vault, Azure IoT Hub, Azure Event Grid, Azure Communication Services, Azure
Confidential Ledger, Microsoft Sentinel, Microsoft Defender for Cloud, Azure API
Management, Azure Service Bus, Azure SQL, Cosmos DB, Microsoft Fabric / Power
BI, Dynamics 365, and Power Platform.

## Design Principle

Microsoft services should receive the least sensitive payload needed for the
task:

- identity and staff access: organization metadata and scoped permissions
- external identity: scoped app access for carriers, issuers, NGOs, and
  customer portals, without raw address claims
- verifiable credential status: issuer, credential status, and revocation
  metadata, not AOID bodies
- Teams/Outlook notifications: short-lived aliases, commitments, and dashboard
  links only
- Azure Communication Services notifications: short-lived aliases or action
  links only, never raw address text
- SharePoint/OneDrive evidence vault: encrypted evidence packages only
- Azure Maps geocoding: plaintext address or coordinate only with explicit
  consent and server-side processing
- Document Intelligence OCR: document bytes only with consent, TLS, encryption
  at rest, and no default model training assumption
- IoT Hub: device telemetry, device twin state, and terminal health, not address
  payloads
- Event Grid / Service Bus: event IDs, commitments, and job aliases only
- Key Vault: secret references, not secret values
- Confidential Ledger: registry roots, nullifier roots, receipt hashes, and
  other digests only
- Sentinel / Defender: redacted security telemetry and incident aliases
- API Management: gateway policy, rate limit, abuse control, and body log
  redaction
- Fabric / Power BI: aggregate or bucketed analytics only
- SQL/Cosmos/Dataverse: metadata, commitments, encrypted envelopes, and audit
  records, not raw AOID bodies

## Implemented Module

The code entry point is:

```text
src/lib/microsoftServiceIntegration.ts
```

It provides:

- `listMicrosoftServiceProfiles()`
- `getMicrosoftServiceProfile(id)`
- `buildMicrosoftIntegrationPlan(input)`

The plan checks:

- service and purpose compatibility
- whether raw address/document processing is allowed
- whether owner consent is required
- whether TLS and server-side proxying are required
- whether encrypted-at-rest is required
- whether high-risk mode should prefer local-only or AGID-S flows
- whether broad Microsoft Graph scopes need admin review

## Recommended Mapping

| AGID/AOID feature | Microsoft service | Safe payload |
| --- | --- | --- |
| Staff login | Microsoft Entra ID | user/org identity, no address |
| External carrier/issuer login | Microsoft Entra External ID | scoped identity and organization metadata |
| AOID credential status | Microsoft Entra Verified ID | issuer/status/revocation metadata |
| POS role control | Entra ID + Graph | staff role claims |
| Operator alert | Teams or Outlook | event alias, commitment, action link |
| Recipient or operator notification | Azure Communication Services | short-lived alias or confirmation link |
| Evidence vault | SharePoint/OneDrive or Azure Blob | encrypted evidence envelope |
| Address document OCR | Azure AI Document Intelligence | document bytes only after consent |
| Optional geocoding comparison | Azure Maps | ephemeral address/coordinate query after consent |
| Secret/key reference | Azure Key Vault | key/secret URI or reference |
| POS/device/locker/drone health | Azure IoT Hub | device telemetry with address redaction |
| Webhook fanout | Azure Event Grid | event ID, commitment, redacted summary |
| Async jobs | Azure Service Bus | job ID, commitment, queue metadata |
| Ethereum-free audit anchor | Azure Confidential Ledger | root/hash/digest only |
| Abuse and compromise detection | Microsoft Sentinel / Defender for Cloud | security alert alias, device ID, commitment |
| Hosted API gateway | Azure API Management | authenticated request metadata and redacted logs |
| Enterprise analytics | Microsoft Fabric / Power BI | aggregate operational metrics |
| Enterprise ledger | Azure SQL / Cosmos DB | commitments, encrypted AOID envelopes, audit metadata |
| Business account sync | Dynamics 365 / Dataverse | issuer/carrier/org metadata |
| Workflow automation | Power Platform | redacted events and review aliases |

## High-Risk Mode

For DV, refugee, humanitarian, disaster, or surveillance-risk contexts:

- prefer local OCR over Azure AI Document Intelligence
- prefer local or OSS geocoding over Azure Maps
- use AGID-S instead of precise AGID when possible
- do not send raw address, phone, room, proof code, or AGID-S ciphertext to
  Teams/Outlook/Event Grid/Service Bus
- use short-lived aliases and delete or rotate evidence after use
- keep telemetry commitment-only

## Why Microsoft Graph and Entra Matter

Microsoft Graph is the Microsoft 365 API gateway. It can connect mail, files,
directory information, and collaboration surfaces. Entra ID provides the OAuth
and OpenID Connect identity layer for enterprise login and authorization. In
AGID/AOID, these should be used for organization and staff authorization, not as
a personal address database.

Entra External ID extends this model to carriers, issuers, NGOs, municipalities,
and customer-facing Address Link / Address Portal flows. Entra Verified ID is a
good enterprise credential adapter for AOID credential status, but it should be
kept separate from ZK proofs: Verified ID proves an issuer-backed credential
claim, while ZK proofs hide address-derived facts behind selective predicates.

## Why Azure Maps and Document Intelligence Are Optional

Azure Maps can improve geocoding and reverse-geocoding quality, but it requires
sending the address or coordinate query to Microsoft. Document Intelligence can
extract text and fields from uploaded address-bearing documents, but those
documents may contain personal data. Both are useful enterprise adapters, but
they must remain optional and gated by consent, transport encryption, and
server-side proxying.

## Why IoT Hub, Communication Services, and Confidential Ledger Matter

Azure IoT Hub fits POS terminals, NFC readers, printers, cash drawers, electronic
measuring instruments, smart lockers, and drones because it models devices and
telemetry. The AGID adapter should send terminal health and device state, not
recipient addresses.

Azure Communication Services can support SMS, email, voice, and Teams-style
notifications. Notification bodies should contain only short-lived aliases or
confirmation links. The address, phone number beyond the delivery channel, room
number, AGID-S ciphertext, and proof code should not be embedded in the message.

Azure Confidential Ledger is useful when a deployment wants tamper-evident audit
records without Ethereum. Store only roots, hashes, digest receipts, and
commitments.

## Why API Management, Sentinel, Defender, and Fabric Matter

Azure API Management is the enterprise gateway for Hosted Registry API, Resolver
API, MCP/API endpoints, and webhooks. It should enforce authentication, rate
limits, request validation, and body-log redaction.

Microsoft Sentinel and Defender for Cloud are operational security adapters for
address enumeration, QR replay, API abuse, compromised POS devices, suspicious
issuer activity, and cloud misconfiguration. They should receive redacted
security signals rather than address datasets.

Microsoft Fabric and Power BI are useful for dashboards such as delivery success
rate, POS processing time, address quality by country, issuer health, terminal
uptime, and review backlog. These exports must be aggregate, bucketed, or
commitment-only.

## Sources

- Microsoft Graph overview: https://learn.microsoft.com/en-us/graph/overview
- Microsoft identity platform OAuth 2.0 authorization code flow:
  https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
- Microsoft identity platform scopes and permissions:
  https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc
- Microsoft Graph change notifications:
  https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks
- Azure Maps address search:
  https://learn.microsoft.com/en-us/azure/azure-maps/how-to-search-for-address
- Azure Maps geocoding:
  https://learn.microsoft.com/en-us/rest/api/maps/search/get-geocoding?view=rest-maps-2026-01-01
- Azure Maps reverse geocoding:
  https://learn.microsoft.com/en-us/rest/api/maps/search/get-reverse-geocoding?view=rest-maps-2026-01-01
- Azure AI Document Intelligence Read model:
  https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/prebuilt/read?view=doc-intel-4.0.0
- Azure AI Document Intelligence model overview:
  https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/model-overview?view=doc-intel-4.0.0
- Azure Key Vault overview:
  https://learn.microsoft.com/en-us/azure/key-vault/general/overview
- Microsoft Entra External ID:
  https://learn.microsoft.com/en-us/entra/external-id/external-identities-overview
- Microsoft Entra Verified ID:
  https://learn.microsoft.com/en-us/entra/verified-id/
- Azure IoT Hub:
  https://learn.microsoft.com/en-us/azure/iot-hub/iot-concepts-and-iot-hub
- Azure Event Grid overview:
  https://learn.microsoft.com/en-us/azure/event-grid/overview
- Azure Communication Services:
  https://learn.microsoft.com/en-us/azure/communication-services/overview
- Azure Confidential Ledger:
  https://learn.microsoft.com/en-us/azure/confidential-ledger/overview
- Microsoft Sentinel:
  https://learn.microsoft.com/en-us/azure/sentinel/overview
- Microsoft Defender for Cloud:
  https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction
- Azure API Management:
  https://learn.microsoft.com/en-us/azure/api-management/api-management-key-concepts
- Azure Service Bus overview:
  https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview
- Microsoft Fabric overview:
  https://learn.microsoft.com/en-us/fabric/fundamentals/microsoft-fabric-overview
- Power BI overview:
  https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview
