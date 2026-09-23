# Adobe Service Integration

AGID/AOID can integrate with Adobe services as optional adapters. Adobe should
not become a required dependency for the core resolver, POS, or SDK. The safe
role for Adobe is document processing, e-signature, commerce checkout, CMS
publishing, redacted analytics, and operator-facing design workflows.

## Design Principle

Adobe products are powerful, but several Adobe workflows handle documents that
may contain names, addresses, phone numbers, signatures, IDs, proof codes, and
shipping labels. Therefore AGID should treat Adobe integration as a gated
document and commerce adapter:

- use AGID/AOID commitments, aliases, or AGID-S when possible
- send redacted PDFs instead of raw evidence documents
- send encrypted evidence envelopes instead of plaintext AOID records
- keep Adobe Commerce order records alias-based by default
- use Acrobat Sign only for purpose-scoped consent or delegated pickup
- use Adobe Experience Platform only for redacted product/audit analytics
- use Adobe Express and Creative Cloud Libraries only for public brand assets
  and operator-facing templates, not recipient data

## Implemented Module

The code entry point is:

```text
src/lib/adobeServiceIntegration.ts
```

It provides:

- `listAdobeServiceProfiles()`
- `getAdobeServiceProfile(id)`
- `buildAdobeIntegrationPlan(input)`

The plan checks:

- service and purpose compatibility
- whether raw PDF/document processing is allowed
- whether owner consent is required
- whether TLS and server-side proxying are required
- whether encrypted-at-rest is required
- whether signature agreements use Acrobat Sign
- whether creative assets accidentally carry private address material
- whether high-risk mode should prefer local OCR, local redaction, or AGID-S

## Recommended Mapping

| AGID/AOID feature | Adobe service | Safe payload |
| --- | --- | --- |
| Shipping label PDF generation | Adobe PDF Services API | redacted label data, label alias, QR commitment |
| Address evidence redaction | Adobe PDF Services API | redacted PDF or encrypted evidence envelope |
| Address PDF import/OCR | Adobe PDF Extract API | source PDF only after consent and encryption gates |
| Redacted evidence viewer | Adobe PDF Embed API | redacted PDF, short-lived URL, local authorized object URL |
| Consent envelope | Acrobat Sign API | purpose-scoped agreement with redacted address attributes |
| Delegated pickup signature | Acrobat Sign API | pickup alias, delegated scope, expiry, receipt commitment |
| Checkout integration | Adobe Commerce API | Address Element, AGID-S, order alias, label commitment |
| Return label | Adobe Commerce API + PDF Services | return alias and label commitment |
| Public address help portal | AEM APIs | public docs, forms, content fragments |
| Evidence content portal | AEM APIs | redacted evidence content only |
| Product/audit analytics | Adobe Experience Platform APIs | redacted events, commitments, coarse status |
| POS notice/label design | Adobe Express Embed SDK | public templates, placeholders, brand assets |
| Brand library | Creative Cloud Libraries API | logo, color, typography; no recipient data |

## High-Risk Mode

For DV, refugee, humanitarian, disaster, or surveillance-risk contexts:

- prefer local PDF generation and OCR over Adobe cloud processing
- use AGID-S instead of precise AGID
- use short-lived label aliases and QR commitments
- do not put recipient name, phone number, room number, exact address, proof
  code, AOID body, or AGID-S ciphertext into Adobe Commerce attributes,
  Experience Platform events, Express templates, or Creative Cloud assets
- if Acrobat Sign is used, disclose the smallest possible predicate such as
  "recipient authorized" or "delivery consent granted" rather than a full
  address

## Implementation Notes

The current adapter is a planning and safety layer. It does not call Adobe APIs
yet. Production adapters should add:

- server-side token exchange and credential storage
- Adobe webhook signature verification where available
- short-lived signed upload/download URLs
- document retention and deletion policy
- redaction-before-upload pipeline
- tenant-level audit logs that store commitments, not source documents
- OpenAPI examples for Adobe Commerce checkout and Acrobat Sign consent

## Sources

- Adobe PDF Services API:
  https://developer.adobe.com/document-services/docs/overview/pdf-services-api/
- Adobe Acrobat Services overview:
  https://developer.adobe.com/document-services/docs/overview/
- Adobe PDF Extract API:
  https://developer.adobe.com/document-services/docs/overview/pdf-extract-api/
- Adobe PDF Embed API:
  https://developer.adobe.com/document-services/docs/overview/pdf-embed-api/
- Acrobat Sign API:
  https://opensource.adobe.com/acrobat-sign/developer_guide/index.html
- Adobe Commerce REST API:
  https://developer.adobe.com/commerce/webapi/rest/
- Adobe Commerce Web API:
  https://developer.adobe.com/commerce/webapi/
- AEM APIs overview:
  https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/aem-apis/overview
- AEM Cloud Service APIs:
  https://developer.adobe.com/experience-cloud/experience-manager-apis/
- Adobe Experience Platform APIs:
  https://developer.adobe.com/experience-platform-apis/
- Adobe Express Embed SDK:
  https://developer.adobe.com/express/embed-sdk/docs/v4/
- Creative Cloud Libraries API:
  https://developer.adobe.com/creative-cloud-libraries/
