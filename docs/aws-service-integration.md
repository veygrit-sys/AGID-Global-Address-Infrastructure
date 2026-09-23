# AWS Service Integration

This integration layer describes which AWS services can be connected to AGID/AOID and under what privacy controls. AWS is an optional provider adapter. The OSS core must keep local, self-hosted, and open-data paths available.

## Adopted Service Families

| Family | Services | AGID/AOID use |
| --- | --- | --- |
| Identity | Amazon Cognito, IAM Identity Center | staff SSO, operator access, Address Access/Auth without address claims |
| Issuer trust | DynamoDB/S3-backed issuer trust adapter | issuer metadata, credential status, revocation root lookup |
| Security | AWS KMS, Secrets Manager, SSM Parameter Store | AGID-S key references, issuer signing key references, webhook secret references |
| Location | Amazon Location Service | optional geocoding, reverse geocoding, places, routing |
| Document AI | Amazon Textract | optional OCR/import for address-bearing documents after consent |
| Events / Queue | EventBridge, SNS, SQS | redacted events, webhook fan-out, async jobs, offline sync reconciliation |
| Compute | Lambda, ECS Fargate | provider adapters and registry workers |
| Storage / DB | S3, RDS/Aurora PostgreSQL, DynamoDB | encrypted evidence, event-sourced metadata, credential/revocation metadata |
| Analytics / Security monitoring | Redshift, QuickSight, CloudWatch, Security Hub, GuardDuty | aggregate analytics, abuse detection, security posture |
| API / Devices / Notifications | API Gateway, IoT Core, SNS, SES | API gateway, POS/locker/drone telemetry, short-lived redacted notifications |

## Privacy Rule

The default rule is:

```text
Do not send raw address, raw AGID/AOID, proof code, PIN, QR payload, NFC payload, phone,
or precise high-risk location to AWS services unless the selected service explicitly
requires ephemeral plaintext processing and the user or enterprise has consented.
```

The implementation enforces this through `buildAwsIntegrationPlan`.

## API

```ts
import {
  buildAwsIntegrationPlan,
  getAwsServiceProfile,
  listAwsServiceProfiles,
} from './awsServiceIntegration';
```

Example:

```ts
const plan = buildAwsIntegrationPlan({
  serviceId: 'aws-location-service',
  purpose: 'geocode',
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
- recommended IAM actions
- whether plaintext address data would be sent
- privacy warnings and errors

## Payload Rules

| Payload | Default handling |
| --- | --- |
| `event-metadata` | Allowed for EventBridge/SNS/SQS/API Gateway/monitoring paths after redaction. |
| `address-commitment` | Allowed for credential status, registry, ledger, and metadata paths. |
| `encrypted-aoid-envelope` | Allowed for S3 or storage-like paths only with owner consent, encryption at rest, and TLS. |
| `plaintext-address` | Allowed only for Amazon Location Service with consent, TLS, and server-side proxy. |
| `document-image-or-pdf` | Allowed only for Amazon Textract with consent, TLS, server-side proxy, and encryption at rest. |
| `device-telemetry` | Allowed only for AWS IoT Core after telemetry redaction and device signing. |
| `security-alert` | Allowed only for CloudWatch/Security Hub/GuardDuty paths. |
| `analytics-aggregate` | Allowed only for aggregate analytics paths; no household-level export. |
| `secret-reference` | Best handled by AWS KMS / Secrets Manager; store references, not copied secret values. |

## Recommended Controls

- Use server-side IAM roles, STS, or web identity; do not put AWS access keys in browser builds.
- Use least-privilege IAM actions and review wildcard actions.
- Keep raw address text out of Cognito claims, API Gateway logs, CloudWatch logs, SNS/SES messages, SQS messages, and IoT telemetry.
- Use S3 object keys that do not contain raw address, AGID, AOID, phone, or recipient names.
- Use encrypted envelopes before upload for address evidence and AOID-derived artifacts.
- Use local resolver, local OCR, or AGID-S before external plaintext geocoding/OCR in high-risk mode.
- Publish only commitments, aliases, redacted summaries, event ids, and status codes to EventBridge/SNS/SQS.
- Keep AWS adapters optional and replaceable by local/Azure/GCP adapters through `multiCloudCompatibility`.

## High-Risk Mode

For DV, refugee, humanitarian, disaster, or surveillance-sensitive usage:

- Prefer local OCR and local geocoding.
- Do not send precise addresses to Amazon Location Service.
- Do not send source documents to Textract unless explicitly approved.
- Use AGID-S, short-lived aliases, jti, expiry, and revocation.
- Keep logs digest-only or commitment-only.

## Official Documentation References

- Amazon Cognito: https://docs.aws.amazon.com/cognito/
- IAM Identity Center: https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html
- AWS KMS: https://docs.aws.amazon.com/kms/
- AWS Secrets Manager: https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html
- Amazon Location Service: https://docs.aws.amazon.com/location/
- Amazon Textract: https://docs.aws.amazon.com/textract/
- Amazon EventBridge: https://docs.aws.amazon.com/eventbridge/
- Amazon SQS: https://docs.aws.amazon.com/sqs/
- AWS Lambda: https://docs.aws.amazon.com/lambda/latest/dg/welcome.html
- Amazon API Gateway: https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html
- AWS IoT Core: https://docs.aws.amazon.com/iot/latest/developerguide/what-is-aws-iot.html
- Security Hub: https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html
- GuardDuty: https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html
- Amazon SES: https://docs.aws.amazon.com/ses/latest/dg/Welcome.html
