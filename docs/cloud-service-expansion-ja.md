# Cloud Service Expansion Plan

Last updated: 2026-06-18

この文書は、AGID/AOID のクラウド対応を Azure / GCP / AWS 以外にも広げるための実装方針です。実装本体は `src/lib/cloudServiceExpansion.ts` です。

目的は「対応クラウドを増やす」ことですが、住所インフラでは対応数よりも安全境界が重要です。そのため、この拡張層ではクラウドを住所保存先として扱わず、次のような限定用途だけを許可します。

- edge resolver
- public AGID cache
- encrypted evidence object
- metadata ledger
- encrypted AOID sync
- webhook / queue / async job
- secret reference
- abuse protection
- aggregate analytics
- app hosting

## Supported Provider Families

| Provider | Adopted Services | AGID/AOID Use |
| --- | --- | --- |
| Cloudflare | Workers, R2, D1, KV, Queues, Turnstile | Edge resolver, encrypted object cache, public cache, abuse protection |
| Oracle Cloud Infrastructure | Object Storage, Autonomous Database, Functions, API Gateway, Vault | Encrypted evidence, commitment ledger, serverless adapter, secret reference |
| Alibaba Cloud | OSS, RDS/PolarDB, Function Compute, EventBridge, API Gateway | Regional deployment option with data residency review |
| Tencent Cloud | COS, PostgreSQL/TDSQL, SCF/CloudBase, API Gateway | Regional deployment option with data residency review |
| Huawei Cloud | OBS, GaussDB, FunctionGraph | Regional deployment option with data residency review |
| IBM Cloud | Object Storage, Key Protect, Code Engine, Cloudant | Encrypted object storage, key reference, app hosting, document metadata |
| DigitalOcean | Spaces, Managed Postgres, App Platform Functions | Simpler OSS/self-host-friendly deployment option |
| Vercel | Blob, Edge Config / Marketplace DB, Functions | Frontend-heavy deployment, public cache pointers, serverless adapter |
| Supabase | Postgres/Auth/Storage, Edge Functions | OSS-friendly hosted Postgres, identity helper, encrypted envelope storage |
| MongoDB Atlas | Atlas | Document metadata, organization records, redacted operational state |
| Snowflake | Snowflake | Aggregate analytics only |
| Databricks | Databricks | Lakehouse aggregate analytics only |

## Privacy Rules

The expansion adapter rejects raw payloads by default.

Never send these payload classes to the extended cloud catalog:

- plaintext address
- raw AGID or raw AOID when it identifies a person or private place
- document images or PDFs
- device telemetry that can reveal operator or recipient movement
- recipient name, phone number, room number, or delivery memo

Allowed payload classes are intentionally narrower:

- `public-agid-reference`
- `address-commitment`
- `encrypted-aoid-envelope`
- `redacted-address-summary`
- `event-metadata`
- `audit-digest`
- `security-alert`
- `analytics-aggregate`
- `secret-reference`

For high-risk use cases such as domestic violence shelters, evacuation, refugee aid, humanitarian distribution, or sensitive medical delivery, the local/self-hosted path should be preferred before adding a third-party cloud. If cloud use is unavoidable, use AGID-S, short TTL, revocation, minimal logs, and commitment-only records.

## Implementation Surface

`src/lib/cloudServiceExpansion.ts` provides:

- `listExtendedCloudServiceProfiles()`
- `listExtendedCloudProviders()`
- `getExtendedCloudServiceProfile(id)`
- `buildExtendedCloudIntegrationPlan(input)`

The plan builder returns:

- whether the requested use is allowed
- required environment variables
- required controls
- warning and error codes
- data-flow guarantees that raw address material is not sent or stored

This is not a network client layer. Provider SDK clients should be added separately after a specific integration is selected and threat-modeled.

## Relationship To Existing Modules

Use the modules in this order:

1. `multiCloudCompatibility.ts`: local / Azure / GCP / AWS parity and workload placement.
2. `awsServiceIntegration.ts`, `googleServiceIntegration.ts`, `microsoftServiceIntegration.ts`: deep provider-specific adapters for the three major clouds already modeled.
3. `cloudDbIntegration.ts`: DB/storage connector planning.
4. `cloudServiceExpansion.ts`: additional cloud, edge, PaaS, DBaaS, and analytics provider catalog.

This split prevents every provider from needing the same deep model immediately.

## Official References

- [Cloudflare Workers storage options](https://developers.cloudflare.com/workers/platform/storage-options/)
- [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- [Oracle Cloud Infrastructure API reference](https://docs.oracle.com/en-us/iaas/api/)
- [Oracle Object Storage overview](https://docs.oracle.com/en-us/iaas/Content/Object/Concepts/objectstorageoverview.htm)
- [Alibaba Cloud EventBridge and Function Compute](https://www.alibabacloud.com/blog/event-driven-architecture-on-alibaba-cloud-with-eventbridge-and-function-compute_603113)
- [Alibaba Cloud API Gateway](https://www.alibabacloud.com/blog/designing-production-api-infrastructure-with-alibaba-cloud-api-gateway_603133)
- [Tencent Cloud product documentation](https://www.tencentcloud.com/document/product)
- [Tencent Cloud SCF](https://www.tencentcloud.com/document/product/583/45901)
- [Tencent CloudBase](https://www.tencentcloud.com/document/product/409/80389)
- [IBM Key Protect and Cloud Object Storage](https://cloud.ibm.com/docs/key-protect?topic=key-protect-integrate-cos)
- [DigitalOcean documentation](https://docs.digitalocean.com/)
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
- [Vercel Storage](https://vercel.com/docs/storage)
- [Vercel Blob](https://vercel.com/docs/vercel-blob)
- [Supabase documentation](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [MongoDB Atlas documentation](https://www.mongodb.com/docs/atlas/)
- [Snowflake documentation](https://docs.snowflake.com/)
- [Databricks documentation](https://docs.databricks.com/)
