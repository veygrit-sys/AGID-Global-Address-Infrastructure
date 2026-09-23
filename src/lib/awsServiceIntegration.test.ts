import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAwsIntegrationPlan,
  getAwsServiceProfile,
  listAwsServiceProfiles,
} from './awsServiceIntegration';

test('lists AWS service profiles needed by AGID/AOID integrations', () => {
  const ids = listAwsServiceProfiles().map(profile => profile.id);

  assert.ok(ids.includes('aws-cognito-identity-center'));
  assert.ok(ids.includes('aws-issuer-trust-adapter'));
  assert.ok(ids.includes('aws-kms-secrets-manager'));
  assert.ok(ids.includes('aws-location-service'));
  assert.ok(ids.includes('aws-textract'));
  assert.ok(ids.includes('aws-eventbridge-sns'));
  assert.ok(ids.includes('aws-sqs'));
  assert.ok(ids.includes('aws-lambda-fargate'));
  assert.ok(ids.includes('aws-s3'));
  assert.ok(ids.includes('aws-rds-postgres'));
  assert.ok(ids.includes('aws-dynamodb'));
  assert.ok(ids.includes('aws-redshift-quicksight'));
  assert.ok(ids.includes('aws-cloudwatch-securityhub-guardduty'));
  assert.ok(ids.includes('aws-api-gateway'));
  assert.ok(ids.includes('aws-iot-core'));
  assert.ok(ids.includes('aws-sns-ses'));
  assert.equal(getAwsServiceProfile(' AWS-LOCATION-SERVICE ')?.family, 'location');
});

test('requires consent, TLS, and server-side proxy for AWS Location plaintext geocoding', () => {
  const blocked = buildAwsIntegrationPlan({
    serviceId: 'aws-location-service',
    purpose: 'geocode',
    payloadClass: 'plaintext-address',
  });

  assert.equal(blocked.allowed, false);
  assert.ok(blocked.errors.includes('owner-consent-required-for-aws-plaintext-processing'));
  assert.ok(blocked.errors.includes('encrypted-in-transit-required-for-aws-plaintext-processing'));
  assert.ok(blocked.errors.includes('server-side-proxy-required-for-aws-plaintext-processing'));

  const allowed = buildAwsIntegrationPlan({
    serviceId: 'aws-location-service',
    purpose: 'geocode',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.dataFlow.sendsPlaintextAddressToAws, true);
  assert.equal(allowed.dataFlow.storesRawAddressInAws, false);
  assert.ok(allowed.requiredControls.includes('ephemeral-provider-request-no-canonical-storage'));
});

test('keeps Textract server-side and warns in high-risk mode', () => {
  const plan = buildAwsIntegrationPlan({
    serviceId: 'aws-textract',
    purpose: 'document-ocr-address-import',
    payloadClass: 'document-image-or-pdf',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
    highRiskMode: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.sendsDocumentImageOrPdfToAws, true);
  assert.equal(plan.dataFlow.highRiskModeCompatible, false);
  assert.ok(plan.warnings.includes('high-risk-mode-prefers-local-ocr-local-geocoding-or-agid-s-over-aws-plaintext-processing'));
  assert.ok(plan.requiredControls.includes('prefer-agid-s-local-ocr-and-self-hosted-geocoding-before-aws'));
});

test('blocks raw address payloads from AWS notifications and event buses', () => {
  const snsSes = buildAwsIntegrationPlan({
    serviceId: 'aws-sns-ses',
    purpose: 'sms-email-notification',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  const eventBridge = buildAwsIntegrationPlan({
    serviceId: 'aws-eventbridge-sns',
    purpose: 'webhook-event-dispatch',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(snsSes.allowed, false);
  assert.equal(eventBridge.allowed, false);
  assert.ok(snsSes.errors.includes('plaintext-payload-not-allowed-for-service'));
  assert.ok(eventBridge.errors.includes('plaintext-payload-not-allowed-for-service'));
});

test('allows S3 evidence storage only as encrypted envelopes', () => {
  const plaintext = buildAwsIntegrationPlan({
    serviceId: 'aws-s3',
    purpose: 'encrypted-evidence-object',
    payloadClass: 'document-image-or-pdf',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plaintext.allowed, false);
  assert.ok(plaintext.errors.includes('plaintext-payload-not-allowed-for-service'));
  assert.ok(plaintext.errors.includes('document-image-payload-requires-aws-textract'));

  const encrypted = buildAwsIntegrationPlan({
    serviceId: 'aws-s3',
    purpose: 'encrypted-evidence-object',
    payloadClass: 'encrypted-aoid-envelope',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(encrypted.allowed, true);
  assert.equal(encrypted.dataFlow.sendsPlaintextAddressToAws, false);
  assert.ok(encrypted.requiredControls.includes('owner-device-or-server-side-envelope-encryption-before-upload'));
  assert.ok(encrypted.requiredControls.includes('s3-object-key-must-not-contain-raw-address'));
});

test('uses KMS and Secrets Manager as reference-only secret services', () => {
  const plan = buildAwsIntegrationPlan({
    serviceId: 'aws-kms-secrets-manager',
    purpose: 'secret-reference',
    payloadClass: 'secret-reference',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.ok(plan.requiredEnvVars.includes('AWS_REGION'));
  assert.ok(plan.requiredControls.includes('store-secret-reference-not-secret-value'));
  assert.ok(plan.requiredControls.includes('no-long-lived-access-key-in-browser'));
});

test('keeps identity and credential verification address-free', () => {
  const identity = buildAwsIntegrationPlan({
    serviceId: 'aws-cognito-identity-center',
    purpose: 'staff-sso',
    payloadClass: 'organization-record',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  const credential = buildAwsIntegrationPlan({
    serviceId: 'aws-issuer-trust-adapter',
    purpose: 'credential-status-check',
    payloadClass: 'credential-status',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(identity.allowed, true);
  assert.equal(identity.dataFlow.sendsPlaintextAddressToAws, false);
  assert.ok(identity.requiredControls.includes('no-address-claims-in-id-token'));
  assert.equal(credential.allowed, true);
  assert.ok(credential.requiredControls.includes('credential-status-without-raw-address'));
  assert.ok(credential.requiredControls.includes('issuer-trust-and-revocation-check'));
});

test('routes device telemetry and security alerts to the correct AWS services', () => {
  const iot = buildAwsIntegrationPlan({
    serviceId: 'aws-iot-core',
    purpose: 'pos-device-health',
    payloadClass: 'device-telemetry',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  const misplacedTelemetry = buildAwsIntegrationPlan({
    serviceId: 'aws-eventbridge-sns',
    purpose: 'webhook-event-dispatch',
    payloadClass: 'device-telemetry',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  const security = buildAwsIntegrationPlan({
    serviceId: 'aws-cloudwatch-securityhub-guardduty',
    purpose: 'security-threat-detection',
    payloadClass: 'security-alert',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(iot.allowed, true);
  assert.ok(iot.requiredControls.includes('device-telemetry-redaction'));
  assert.equal(misplacedTelemetry.allowed, false);
  assert.ok(misplacedTelemetry.errors.includes('device-telemetry-payload-requires-aws-iot-core'));
  assert.equal(security.allowed, true);
  assert.ok(security.requiredControls.includes('security-telemetry-redaction'));
});

test('warns on broad AWS IAM actions', () => {
  const plan = buildAwsIntegrationPlan({
    serviceId: 'aws-api-gateway',
    purpose: 'api-gateway-rate-limit',
    payloadClass: 'event-metadata',
    encryptedInTransit: true,
    serverSideOnly: true,
    requestedIamActions: ['execute-api:*'],
  });

  assert.equal(plan.allowed, true);
  assert.ok(plan.warnings.includes('broad-aws-iam-action-requires-admin-review'));
});

test('rejects unsupported AWS service-purpose combinations', () => {
  const plan = buildAwsIntegrationPlan({
    serviceId: 'aws-sqs',
    purpose: 'geocode',
    payloadClass: 'event-metadata',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('service-purpose-not-supported'));
});
