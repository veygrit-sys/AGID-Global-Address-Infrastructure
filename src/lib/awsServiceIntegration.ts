import {
  cleanBoolean,
  cleanText,
  cleanTextArray,
} from './redactedWorkflowCore';

export const AWS_SERVICE_INTEGRATION_MODEL_VERSION = 'aws-service-integration-v1';

export type AwsServiceFamily =
  | 'identity'
  | 'issuer-trust'
  | 'location'
  | 'ai-document'
  | 'security'
  | 'events'
  | 'queue'
  | 'compute'
  | 'storage'
  | 'database'
  | 'analytics'
  | 'device-management'
  | 'communications'
  | 'api-management';

export type AwsServiceId =
  | 'aws-cognito-identity-center'
  | 'aws-issuer-trust-adapter'
  | 'aws-kms-secrets-manager'
  | 'aws-location-service'
  | 'aws-textract'
  | 'aws-eventbridge-sns'
  | 'aws-sqs'
  | 'aws-lambda-fargate'
  | 'aws-s3'
  | 'aws-rds-postgres'
  | 'aws-dynamodb'
  | 'aws-redshift-quicksight'
  | 'aws-cloudwatch-securityhub-guardduty'
  | 'aws-api-gateway'
  | 'aws-iot-core'
  | 'aws-sns-ses';

export type AwsIntegrationPurpose =
  | 'staff-sso'
  | 'external-user-access'
  | 'address-access-auth'
  | 'issuer-trust-registry'
  | 'credential-status-check'
  | 'kms-key-reference'
  | 'secret-reference'
  | 'geocode'
  | 'reverse-geocode'
  | 'place-search'
  | 'route-eta'
  | 'document-ocr-address-import'
  | 'webhook-event-dispatch'
  | 'notification-topic'
  | 'async-job-queue'
  | 'serverless-adapter'
  | 'encrypted-evidence-object'
  | 'metadata-ledger'
  | 'address-verification-cache'
  | 'analytics-dashboard'
  | 'audit-monitoring'
  | 'security-threat-detection'
  | 'api-gateway-rate-limit'
  | 'device-twin-management'
  | 'pos-device-health'
  | 'iot-telemetry-routing'
  | 'sms-email-notification';

export type AwsConnectorCapability =
  | 'oauth-oidc'
  | 'workforce-sso'
  | 'issuer-registry'
  | 'credential-status'
  | 'key-management'
  | 'secret-management'
  | 'geocode'
  | 'reverse-geocode'
  | 'places'
  | 'routes'
  | 'document-ocr'
  | 'event-publish'
  | 'topic-notification'
  | 'queue'
  | 'serverless-handler'
  | 'container-handler'
  | 'object-storage'
  | 'sql-postgres'
  | 'document-db'
  | 'warehouse-analytics'
  | 'bi-dashboard'
  | 'logging-monitoring'
  | 'security-posture'
  | 'threat-detection'
  | 'api-gateway'
  | 'rate-limit'
  | 'iot-telemetry'
  | 'device-registry'
  | 'email-send'
  | 'sms-send';

export type AwsPayloadClass =
  | 'none'
  | 'event-metadata'
  | 'organization-record'
  | 'public-agid-reference'
  | 'address-commitment'
  | 'encrypted-aoid-envelope'
  | 'redacted-address-summary'
  | 'plaintext-address'
  | 'document-image-or-pdf'
  | 'route-waypoint-addresses'
  | 'place-query'
  | 'device-telemetry'
  | 'audit-digest'
  | 'security-alert'
  | 'analytics-aggregate'
  | 'credential-status'
  | 'secret-reference';

export type AwsPrivacyMode =
  | 'organization-metadata-only'
  | 'commitment-or-alias-only'
  | 'event-metadata-only'
  | 'encrypted-envelope-only'
  | 'ephemeral-plaintext-required'
  | 'secret-reference-only'
  | 'aggregate-only';

export type AwsRecommendedRuntime =
  | 'server-side'
  | 'server-side-or-worker'
  | 'local-config-only'
  | 'dashboard-admin-only';

export type AwsServiceProfile = {
  id: AwsServiceId;
  label: string;
  family: AwsServiceFamily;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  capabilities: AwsConnectorCapability[];
  purposes: AwsIntegrationPurpose[];
  defaultPrivacyMode: AwsPrivacyMode;
  recommendedRuntime: AwsRecommendedRuntime;
  requiresAwsAccount: boolean;
  requiresIamRole: boolean;
  recommendedIamActions: string[];
  docs: string[];
  recommendedUse: string[];
  caveats: string[];
};

export type AwsIntegrationPlanInput = {
  serviceId: AwsServiceId | string;
  purpose: AwsIntegrationPurpose | string;
  payloadClass?: AwsPayloadClass | string;
  ownerConsent?: boolean;
  encryptedAtRest?: boolean;
  encryptedInTransit?: boolean;
  serverSideOnly?: boolean;
  highRiskMode?: boolean;
  requestedIamActions?: unknown;
};

export type AwsIntegrationPlan = {
  modelVersion: typeof AWS_SERVICE_INTEGRATION_MODEL_VERSION;
  service: AwsServiceProfile | null;
  purpose: string;
  payloadClass: AwsPayloadClass;
  allowed: boolean;
  requiredEnvVars: string[];
  requiredControls: string[];
  recommendedIamActions: string[];
  dataFlow: {
    sendsPlaintextAddressToAws: boolean;
    sendsDocumentImageOrPdfToAws: boolean;
    storesRawAddressInAws: boolean;
    clientSecretAllowedInBrowser: false;
    serverSideOnlyRequired: boolean;
    highRiskModeCompatible: boolean;
  };
  errors: string[];
  warnings: string[];
};

const AWS_DOCS = {
  cognito: 'https://docs.aws.amazon.com/cognito/',
  iamIdentityCenter: 'https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html',
  kms: 'https://docs.aws.amazon.com/kms/',
  secretsManager: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html',
  location: 'https://docs.aws.amazon.com/location/',
  locationGeocode: 'https://docs.aws.amazon.com/location/latest/developerguide/geocode.html',
  textract: 'https://docs.aws.amazon.com/textract/',
  eventBridge: 'https://docs.aws.amazon.com/eventbridge/',
  sqs: 'https://docs.aws.amazon.com/sqs/',
  lambda: 'https://docs.aws.amazon.com/lambda/latest/dg/welcome.html',
  s3: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html',
  aurora: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html',
  dynamodb: 'https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html',
  redshift: 'https://docs.aws.amazon.com/redshift/',
  quicksight: 'https://docs.aws.amazon.com/quicksight/',
  cloudwatch: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html',
  securityHub: 'https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html',
  guardDuty: 'https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html',
  apiGateway: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html',
  iotCore: 'https://docs.aws.amazon.com/iot/latest/developerguide/what-is-aws-iot.html',
  iotRules: 'https://docs.aws.amazon.com/iot/latest/developerguide/iot-rules.html',
  sns: 'https://docs.aws.amazon.com/sns/',
  ses: 'https://docs.aws.amazon.com/ses/latest/dg/Welcome.html',
};

const AWS_SERVICE_PROFILES: AwsServiceProfile[] = [
  {
    id: 'aws-cognito-identity-center',
    label: 'Amazon Cognito / IAM Identity Center',
    family: 'identity',
    requiredEnvVars: ['AWS_REGION', 'AWS_COGNITO_USER_POOL_ID'],
    optionalEnvVars: ['AWS_COGNITO_CLIENT_ID', 'AWS_IDENTITY_CENTER_INSTANCE_ARN'],
    capabilities: ['oauth-oidc', 'workforce-sso'],
    purposes: ['staff-sso', 'external-user-access', 'address-access-auth'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['cognito-idp:DescribeUserPool', 'sso:DescribeInstance'],
    docs: [AWS_DOCS.cognito, AWS_DOCS.iamIdentityCenter],
    recommendedUse: [
      'staff and operator login for hosted Registry API, POS, locker, and field dashboards',
      'Address Access/Auth scope enforcement without putting address claims into tokens',
    ],
    caveats: [
      'Do not put raw address, AOID, proof code, or precise AGID in ID token claims.',
      'Use a backend token exchange or hosted login flow; do not ship AWS secrets to browsers.',
    ],
  },
  {
    id: 'aws-issuer-trust-adapter',
    label: 'AWS issuer trust adapter',
    family: 'issuer-trust',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_ISSUER_REGISTRY_TABLE', 'AWS_ISSUER_REGISTRY_BUCKET'],
    capabilities: ['issuer-registry', 'credential-status'],
    purposes: ['issuer-trust-registry', 'credential-status-check'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['dynamodb:GetItem', 'dynamodb:Query', 's3:GetObject'],
    docs: [AWS_DOCS.dynamodb, AWS_DOCS.s3],
    recommendedUse: [
      'issuer metadata lookup',
      'credential status and revocation root publication without raw address storage',
    ],
    caveats: [
      'This adapter verifies issuer and credential status only; it does not prove address truth by itself.',
    ],
  },
  {
    id: 'aws-kms-secrets-manager',
    label: 'AWS KMS / Secrets Manager / Systems Manager Parameter Store',
    family: 'security',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_KMS_KEY_ID', 'AWS_SECRET_ID', 'AWS_SSM_PARAMETER_NAME'],
    capabilities: ['key-management', 'secret-management'],
    purposes: ['kms-key-reference', 'secret-reference'],
    defaultPrivacyMode: 'secret-reference-only',
    recommendedRuntime: 'server-side',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['kms:DescribeKey', 'kms:Encrypt', 'kms:Decrypt', 'secretsmanager:GetSecretValue'],
    docs: [AWS_DOCS.kms, AWS_DOCS.secretsManager],
    recommendedUse: [
      'AGID-S envelope key references',
      'issuer signing key references',
      'webhook signing secret references',
      'POS terminal key rotation references',
    ],
    caveats: [
      'The AGID application should store secret references, not copied secret values.',
      'Restrict decrypt/sign permissions by role, environment, and purpose.',
    ],
  },
  {
    id: 'aws-location-service',
    label: 'Amazon Location Service',
    family: 'location',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_LOCATION_PLACE_INDEX', 'AWS_LOCATION_ROUTE_CALCULATOR'],
    capabilities: ['geocode', 'reverse-geocode', 'places', 'routes'],
    purposes: ['geocode', 'reverse-geocode', 'place-search', 'route-eta'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: [
      'geo:SearchPlaceIndexForText',
      'geo:SearchPlaceIndexForPosition',
      'geo:CalculateRoute',
    ],
    docs: [AWS_DOCS.location, AWS_DOCS.locationGeocode],
    recommendedUse: [
      'optional geocoding, reverse geocoding, place search, and routing checks',
      'provider comparison oracle for non-sensitive address quality tests',
    ],
    caveats: [
      'Do not make external geocoding the canonical resolver in high-risk mode.',
      'Use local resolver, AGID-S, or redacted aliases before sending precise addresses externally.',
    ],
  },
  {
    id: 'aws-textract',
    label: 'Amazon Textract',
    family: 'ai-document',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_TEXTRACT_S3_BUCKET'],
    capabilities: ['document-ocr'],
    purposes: ['document-ocr-address-import'],
    defaultPrivacyMode: 'ephemeral-plaintext-required',
    recommendedRuntime: 'server-side',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['textract:AnalyzeDocument', 'textract:DetectDocumentText', 's3:GetObject'],
    docs: [AWS_DOCS.textract],
    recommendedUse: [
      'optional OCR for address evidence PDFs, photos, shipping labels, and utility bills',
      'extract candidate address fields for user review and redaction',
    ],
    caveats: [
      'Documents can contain names, phone numbers, account numbers, IDs, and precise addresses.',
      'Use explicit consent, encryption at rest, TLS, retention limits, and local OCR fallback.',
    ],
  },
  {
    id: 'aws-eventbridge-sns',
    label: 'Amazon EventBridge / SNS',
    family: 'events',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_EVENT_BUS_NAME', 'AWS_SNS_TOPIC_ARN'],
    capabilities: ['event-publish', 'topic-notification'],
    purposes: ['webhook-event-dispatch', 'notification-topic'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['events:PutEvents', 'sns:Publish'],
    docs: [AWS_DOCS.eventBridge, AWS_DOCS.sns],
    recommendedUse: [
      'address_intent, handoff, revocation, QR used, and terminal event fan-out',
      'redacted event bridge between hosted registry, POS, and carrier systems',
    ],
    caveats: [
      'Publish redacted event metadata, commitments, aliases, and status codes only.',
    ],
  },
  {
    id: 'aws-sqs',
    label: 'Amazon SQS',
    family: 'queue',
    requiredEnvVars: ['AWS_REGION', 'AWS_SQS_QUEUE_URL'],
    optionalEnvVars: ['AWS_SQS_DLQ_URL'],
    capabilities: ['queue'],
    purposes: ['async-job-queue'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
    docs: [AWS_DOCS.sqs],
    recommendedUse: [
      'OCR jobs, webhook retries, revocation sync, and POS offline queue reconciliation',
    ],
    caveats: [
      'Queue bodies should use job ids and commitments, not raw addresses or source documents.',
    ],
  },
  {
    id: 'aws-lambda-fargate',
    label: 'AWS Lambda / ECS Fargate',
    family: 'compute',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_LAMBDA_FUNCTION_NAME', 'AWS_ECS_CLUSTER_ARN'],
    capabilities: ['serverless-handler', 'container-handler'],
    purposes: ['serverless-adapter'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['lambda:InvokeFunction', 'ecs:RunTask'],
    docs: [AWS_DOCS.lambda],
    recommendedUse: [
      'provider adapters for registry, resolver, OCR, notification, and webhook workflows',
    ],
    caveats: [
      'Apply deterministic log redaction before writing to CloudWatch.',
    ],
  },
  {
    id: 'aws-s3',
    label: 'Amazon S3',
    family: 'storage',
    requiredEnvVars: ['AWS_REGION', 'AWS_S3_BUCKET'],
    optionalEnvVars: ['AWS_S3_KMS_KEY_ID'],
    capabilities: ['object-storage'],
    purposes: ['encrypted-evidence-object'],
    defaultPrivacyMode: 'encrypted-envelope-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
    docs: [AWS_DOCS.s3, AWS_DOCS.kms],
    recommendedUse: [
      'encrypted evidence envelopes, redacted label artifacts, and release bundles',
    ],
    caveats: [
      'Do not store raw address evidence without envelope encryption and retention policy.',
    ],
  },
  {
    id: 'aws-rds-postgres',
    label: 'Amazon RDS / Aurora PostgreSQL',
    family: 'database',
    requiredEnvVars: ['AWS_REGION', 'AWS_RDS_POSTGRES_URL'],
    optionalEnvVars: ['AWS_RDS_PROXY_ENDPOINT', 'AWS_SECRET_ID'],
    capabilities: ['sql-postgres'],
    purposes: ['metadata-ledger', 'address-verification-cache', 'audit-monitoring'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['rds:DescribeDBInstances', 'secretsmanager:GetSecretValue'],
    docs: [AWS_DOCS.aurora, AWS_DOCS.secretsManager],
    recommendedUse: [
      'event-sourced registry ledger, audit receipts, review queue metadata, and address quality cache',
    ],
    caveats: [
      'Schema must keep raw address tables out of audit and telemetry paths.',
    ],
  },
  {
    id: 'aws-dynamodb',
    label: 'Amazon DynamoDB',
    family: 'database',
    requiredEnvVars: ['AWS_REGION', 'AWS_DYNAMODB_TABLE'],
    optionalEnvVars: ['AWS_DYNAMODB_REVOCATION_TABLE'],
    capabilities: ['document-db'],
    purposes: ['metadata-ledger', 'address-verification-cache', 'issuer-trust-registry'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query', 'dynamodb:UpdateItem'],
    docs: [AWS_DOCS.dynamodb],
    recommendedUse: [
      'low-latency metadata store for issuer trust, revocation pointers, device state, and AddressIntent state',
    ],
    caveats: [
      'Partition keys must not be raw AGID, AOID, phone, or full address values.',
    ],
  },
  {
    id: 'aws-redshift-quicksight',
    label: 'Amazon Redshift / QuickSight',
    family: 'analytics',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_REDSHIFT_WORKGROUP', 'AWS_QUICKSIGHT_ACCOUNT_ID'],
    capabilities: ['warehouse-analytics', 'bi-dashboard'],
    purposes: ['analytics-dashboard'],
    defaultPrivacyMode: 'aggregate-only',
    recommendedRuntime: 'dashboard-admin-only',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['redshift-data:ExecuteStatement', 'quicksight:DescribeDashboard'],
    docs: [AWS_DOCS.redshift, AWS_DOCS.quicksight],
    recommendedUse: [
      'aggregate dashboards for POS throughput, delivery success, address quality, and device health',
    ],
    caveats: [
      'No household-level exports; use aggregation and privacy review for public reports.',
    ],
  },
  {
    id: 'aws-cloudwatch-securityhub-guardduty',
    label: 'CloudWatch / Security Hub / GuardDuty',
    family: 'security',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_CLOUDWATCH_LOG_GROUP', 'AWS_SECURITY_HUB_REGION'],
    capabilities: ['logging-monitoring', 'security-posture', 'threat-detection'],
    purposes: ['audit-monitoring', 'security-threat-detection'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['logs:PutLogEvents', 'securityhub:BatchImportFindings', 'guardduty:ListFindings'],
    docs: [AWS_DOCS.cloudwatch, AWS_DOCS.securityHub, AWS_DOCS.guardDuty],
    recommendedUse: [
      'address abuse monitoring, QR replay detection, API abuse alerts, and device anomaly findings',
    ],
    caveats: [
      'Security logs must contain aliases, commitments, event ids, and status codes only.',
    ],
  },
  {
    id: 'aws-api-gateway',
    label: 'Amazon API Gateway',
    family: 'api-management',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_API_GATEWAY_ID', 'AWS_USAGE_PLAN_ID'],
    capabilities: ['api-gateway', 'rate-limit'],
    purposes: ['api-gateway-rate-limit'],
    defaultPrivacyMode: 'organization-metadata-only',
    recommendedRuntime: 'server-side',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['apigateway:GET', 'apigateway:PATCH'],
    docs: [AWS_DOCS.apiGateway],
    recommendedUse: [
      'Hosted Registry API, resolver, webhook, MCP, and POS device API gateway',
    ],
    caveats: [
      'Disable request/response body logging for address-bearing endpoints or redact before logging.',
    ],
  },
  {
    id: 'aws-iot-core',
    label: 'AWS IoT Core',
    family: 'device-management',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_IOT_ENDPOINT', 'AWS_IOT_POLICY_NAME'],
    capabilities: ['iot-telemetry', 'device-registry'],
    purposes: ['device-twin-management', 'pos-device-health', 'iot-telemetry-routing'],
    defaultPrivacyMode: 'commitment-or-alias-only',
    recommendedRuntime: 'server-side-or-worker',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['iot:Connect', 'iot:Publish', 'iot:DescribeThing', 'iot:AttachPolicy'],
    docs: [AWS_DOCS.iotCore, AWS_DOCS.iotRules],
    recommendedUse: [
      'POS terminals, smart lockers, measuring instruments, drones, and field hardware telemetry',
      'route device telemetry to S3, DynamoDB, Lambda, SQS, or SNS through IoT rules',
    ],
    caveats: [
      'Device telemetry must be redacted and signed; precise address or recipient data must not be sent as telemetry.',
    ],
  },
  {
    id: 'aws-sns-ses',
    label: 'Amazon SNS / SES',
    family: 'communications',
    requiredEnvVars: ['AWS_REGION'],
    optionalEnvVars: ['AWS_SNS_TOPIC_ARN', 'AWS_SES_FROM_ADDRESS'],
    capabilities: ['topic-notification', 'email-send', 'sms-send'],
    purposes: ['sms-email-notification', 'notification-topic'],
    defaultPrivacyMode: 'event-metadata-only',
    recommendedRuntime: 'server-side',
    requiresAwsAccount: true,
    requiresIamRole: true,
    recommendedIamActions: ['sns:Publish', 'ses:SendEmail', 'ses:SendRawEmail'],
    docs: [AWS_DOCS.sns, AWS_DOCS.ses],
    recommendedUse: [
      'send short-lived links, aliases, expiry notices, and review requests without address text',
    ],
    caveats: [
      'Notification bodies must not include raw address, AOID body, proof code, phone verification secret, or precise AGID.',
    ],
  },
];

const VALID_SERVICE_IDS = new Set(AWS_SERVICE_PROFILES.map(profile => profile.id));
const VALID_PURPOSES = new Set<AwsIntegrationPurpose>([
  'staff-sso',
  'external-user-access',
  'address-access-auth',
  'issuer-trust-registry',
  'credential-status-check',
  'kms-key-reference',
  'secret-reference',
  'geocode',
  'reverse-geocode',
  'place-search',
  'route-eta',
  'document-ocr-address-import',
  'webhook-event-dispatch',
  'notification-topic',
  'async-job-queue',
  'serverless-adapter',
  'encrypted-evidence-object',
  'metadata-ledger',
  'address-verification-cache',
  'analytics-dashboard',
  'audit-monitoring',
  'security-threat-detection',
  'api-gateway-rate-limit',
  'device-twin-management',
  'pos-device-health',
  'iot-telemetry-routing',
  'sms-email-notification',
]);

const VALID_PAYLOAD_CLASSES = new Set<AwsPayloadClass>([
  'none',
  'event-metadata',
  'organization-record',
  'public-agid-reference',
  'address-commitment',
  'encrypted-aoid-envelope',
  'redacted-address-summary',
  'plaintext-address',
  'document-image-or-pdf',
  'route-waypoint-addresses',
  'place-query',
  'device-telemetry',
  'audit-digest',
  'security-alert',
  'analytics-aggregate',
  'credential-status',
  'secret-reference',
]);

function cleanIdentifier(value: unknown) {
  return cleanText(value, '', 140).normalize('NFKC').toLowerCase();
}

function normalizePayloadClass(value: unknown): AwsPayloadClass {
  const cleaned = cleanIdentifier(value || 'none') as AwsPayloadClass;
  return VALID_PAYLOAD_CLASSES.has(cleaned) ? cleaned : 'none';
}

function normalizeRequestedIamActions(value: unknown): string[] {
  return [...new Set(cleanTextArray(value)
    .map(action => action.slice(0, 180))
    .filter(action => /^[A-Za-z0-9_*:./-]+$/.test(action)))]
    .sort();
}

function isPlaintextPayload(payloadClass: AwsPayloadClass) {
  return payloadClass === 'plaintext-address'
    || payloadClass === 'document-image-or-pdf'
    || payloadClass === 'route-waypoint-addresses'
    || payloadClass === 'place-query';
}

function isEncryptedPayload(payloadClass: AwsPayloadClass) {
  return payloadClass === 'encrypted-aoid-envelope' || payloadClass === 'secret-reference';
}

function allowsPlaintext(profile: AwsServiceProfile) {
  return profile.defaultPrivacyMode === 'ephemeral-plaintext-required';
}

function cloneProfile(profile: AwsServiceProfile): AwsServiceProfile {
  return {
    ...profile,
    requiredEnvVars: [...profile.requiredEnvVars],
    optionalEnvVars: [...profile.optionalEnvVars],
    capabilities: [...profile.capabilities],
    purposes: [...profile.purposes],
    recommendedIamActions: [...profile.recommendedIamActions],
    docs: [...profile.docs],
    recommendedUse: [...profile.recommendedUse],
    caveats: [...profile.caveats],
  };
}

export function listAwsServiceProfiles(): AwsServiceProfile[] {
  return AWS_SERVICE_PROFILES.map(cloneProfile);
}

export function getAwsServiceProfile(id: AwsServiceId | string): AwsServiceProfile | null {
  const cleaned = cleanIdentifier(id);
  const profile = AWS_SERVICE_PROFILES.find(item => item.id === cleaned);
  return profile ? cloneProfile(profile) : null;
}

export function buildAwsIntegrationPlan(input: AwsIntegrationPlanInput): AwsIntegrationPlan {
  const serviceId = cleanIdentifier(input.serviceId);
  const service = getAwsServiceProfile(serviceId);
  const purpose = cleanIdentifier(input.purpose) as AwsIntegrationPurpose;
  const payloadClass = normalizePayloadClass(input.payloadClass);
  const ownerConsent = cleanBoolean(input.ownerConsent);
  const encryptedAtRest = cleanBoolean(input.encryptedAtRest);
  const encryptedInTransit = cleanBoolean(input.encryptedInTransit);
  const serverSideOnly = cleanBoolean(input.serverSideOnly);
  const highRiskMode = cleanBoolean(input.highRiskMode);
  const requestedIamActions = normalizeRequestedIamActions(input.requestedIamActions);
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredControls: string[] = [
    'no-client-side-aws-secret',
    'no-raw-address-in-logs-or-telemetry',
    'domain-separated-aliases-and-commitments',
    'aws-account-region-quota-and-budget-guardrail',
  ];

  if (!VALID_SERVICE_IDS.has(serviceId as AwsServiceId) || !service) {
    errors.push('unknown-aws-service');
  }
  if (!VALID_PURPOSES.has(purpose)) {
    errors.push('unknown-aws-purpose');
  }
  if (service && !service.purposes.includes(purpose)) {
    errors.push('service-purpose-not-supported');
  }

  if (service?.requiresAwsAccount) {
    requiredControls.push('aws-account-and-region-configuration');
    requiredControls.push('least-privilege-aws-iam-policy');
  }
  if (service?.requiresIamRole) {
    requiredControls.push('server-side-iam-role-or-web-identity');
    requiredControls.push('no-long-lived-access-key-in-browser');
  }
  if (service?.defaultPrivacyMode === 'commitment-or-alias-only') {
    requiredControls.push('send-only-commitments-aliases-or-redacted-summaries');
  }
  if (service?.defaultPrivacyMode === 'event-metadata-only') {
    requiredControls.push('send-only-redacted-event-metadata');
  }
  if (service?.defaultPrivacyMode === 'encrypted-envelope-only') {
    requiredControls.push('owner-device-or-server-side-envelope-encryption-before-upload');
  }
  if (service?.defaultPrivacyMode === 'secret-reference-only') {
    requiredControls.push('store-secret-reference-not-secret-value');
  }
  if (service?.defaultPrivacyMode === 'aggregate-only') {
    requiredControls.push('aggregate-or-differentially-private-export-only');
  }
  if (service?.defaultPrivacyMode === 'ephemeral-plaintext-required') {
    requiredControls.push('explicit-user-or-enterprise-consent');
    requiredControls.push('ephemeral-provider-request-no-canonical-storage');
    requiredControls.push('server-side-proxy-for-address-bearing-requests');
  }
  if (service?.id === 'aws-cognito-identity-center') {
    requiredControls.push('scope-based-address-access-policy');
    requiredControls.push('no-address-claims-in-id-token');
  }
  if (service?.id === 'aws-issuer-trust-adapter') {
    requiredControls.push('credential-status-without-raw-address');
    requiredControls.push('issuer-trust-and-revocation-check');
  }
  if (service?.id === 'aws-api-gateway') {
    requiredControls.push('rate-limit-and-abuse-control-policy');
    requiredControls.push('request-response-body-log-redaction');
  }
  if (service?.id === 'aws-iot-core') {
    requiredControls.push('per-device-identity-and-key-rotation');
    requiredControls.push('device-telemetry-redaction');
  }
  if (service?.id === 'aws-cloudwatch-securityhub-guardduty') {
    requiredControls.push('security-telemetry-redaction');
    requiredControls.push('incident-link-alias-not-address');
  }
  if (service?.id === 'aws-sns-ses') {
    requiredControls.push('no-address-in-notification-body');
    requiredControls.push('short-lived-action-link-or-alias');
  }
  if (service?.id === 'aws-redshift-quicksight') {
    requiredControls.push('aggregate-or-bucketed-analytics-only');
    requiredControls.push('no-household-level-export');
  }

  if (isPlaintextPayload(payloadClass)) {
    if (!service || !allowsPlaintext(service)) {
      errors.push('plaintext-payload-not-allowed-for-service');
    }
    if (!ownerConsent) errors.push('owner-consent-required-for-aws-plaintext-processing');
    if (!encryptedInTransit) errors.push('encrypted-in-transit-required-for-aws-plaintext-processing');
    if (!serverSideOnly) errors.push('server-side-proxy-required-for-aws-plaintext-processing');
    if (payloadClass === 'document-image-or-pdf' && !encryptedAtRest) {
      errors.push('encrypted-at-rest-required-for-aws-document-processing');
    }
  }

  if (isEncryptedPayload(payloadClass)) {
    if (payloadClass === 'encrypted-aoid-envelope') {
      if (!ownerConsent) errors.push('owner-consent-required-for-encrypted-aoid-aws-sync');
      if (!encryptedAtRest) errors.push('encrypted-at-rest-required-for-encrypted-aoid-aws-sync');
      if (!encryptedInTransit) errors.push('encrypted-in-transit-required-for-encrypted-aoid-aws-sync');
    }
    if (payloadClass === 'secret-reference' && service?.id !== 'aws-kms-secrets-manager') {
      warnings.push('secret-reference-is-best-handled-by-aws-kms-secrets-manager');
    }
  }

  if (payloadClass === 'document-image-or-pdf' && service?.id !== 'aws-textract') {
    errors.push('document-image-payload-requires-aws-textract');
  }
  if (payloadClass === 'route-waypoint-addresses' && service?.id !== 'aws-location-service') {
    errors.push('route-waypoint-payload-requires-aws-location-service');
  }
  if (payloadClass === 'place-query' && service?.id !== 'aws-location-service') {
    errors.push('place-query-payload-requires-aws-location-service');
  }
  if (payloadClass === 'plaintext-address' && service?.id !== 'aws-location-service') {
    warnings.push('plaintext-address-should-usually-be-replaced-by-agid-or-commitment');
  }
  if (payloadClass === 'device-telemetry' && service?.id !== 'aws-iot-core') {
    errors.push('device-telemetry-payload-requires-aws-iot-core');
  }
  if (payloadClass === 'credential-status' && service?.id !== 'aws-issuer-trust-adapter') {
    errors.push('credential-status-requires-aws-issuer-trust-adapter');
  }
  if (
    payloadClass === 'audit-digest'
    && service?.id !== 'aws-rds-postgres'
    && service?.id !== 'aws-dynamodb'
    && service?.id !== 'aws-s3'
  ) {
    errors.push('audit-digest-requires-aws-ledger-storage-or-database');
  }
  if (
    payloadClass === 'security-alert'
    && service?.id !== 'aws-cloudwatch-securityhub-guardduty'
  ) {
    errors.push('security-alert-requires-aws-security-service');
  }
  if (
    payloadClass === 'analytics-aggregate'
    && service?.id !== 'aws-redshift-quicksight'
    && service?.id !== 'aws-cloudwatch-securityhub-guardduty'
  ) {
    errors.push('analytics-aggregate-requires-aws-analytics-service');
  }

  if (highRiskMode) {
    requiredControls.push('high-risk-mode-no-precise-address-retention');
    requiredControls.push('prefer-agid-s-local-ocr-and-self-hosted-geocoding-before-aws');
    if (isPlaintextPayload(payloadClass)) {
      warnings.push('high-risk-mode-prefers-local-ocr-local-geocoding-or-agid-s-over-aws-plaintext-processing');
    }
  }

  const expandedIamActions = service
    ? [...new Set([...service.recommendedIamActions, ...requestedIamActions])].sort()
    : requestedIamActions;

  if (expandedIamActions.some(action => action === '*' || action.endsWith(':*'))) {
    warnings.push('broad-aws-iam-action-requires-admin-review');
  }
  if (expandedIamActions.some(action => action.includes('s3:GetObject') || action.includes('s3:PutObject'))) {
    requiredControls.push('s3-object-key-must-not-contain-raw-address');
  }

  const sendsPlaintextAddressToAws = Boolean(service && isPlaintextPayload(payloadClass) && allowsPlaintext(service));
  const sendsDocumentImageOrPdfToAws = payloadClass === 'document-image-or-pdf' && sendsPlaintextAddressToAws;
  const serverSideOnlyRequired = Boolean(service && (
    service.recommendedRuntime === 'server-side'
    || service.recommendedRuntime === 'dashboard-admin-only'
    || isPlaintextPayload(payloadClass)
  ));

  return {
    modelVersion: AWS_SERVICE_INTEGRATION_MODEL_VERSION,
    service,
    purpose,
    payloadClass,
    allowed: errors.length === 0,
    requiredEnvVars: service ? [...service.requiredEnvVars] : [],
    requiredControls: [...new Set(requiredControls)].sort(),
    recommendedIamActions: expandedIamActions,
    dataFlow: {
      sendsPlaintextAddressToAws,
      sendsDocumentImageOrPdfToAws,
      storesRawAddressInAws: false,
      clientSecretAllowedInBrowser: false,
      serverSideOnlyRequired,
      highRiskModeCompatible: !highRiskMode || !isPlaintextPayload(payloadClass),
    },
    errors,
    warnings,
  };
}
