import { existsSync, readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { SKIPSHIP_WEBHOOK_EVENT_STORE_DEFAULT_TTL_DAYS } from '../src/lib/skipshipWebhookEventStore';

const DEFAULT_OPENAPI_PATH = 'docs/specs/delivery-gateway-carrier-api.openapi.yaml';
const REQUIRED_POST_PATHS = [
  '/v1/shipment-intents',
  '/v1/delivery/rates',
  '/v1/delivery/allocate',
  '/v1/shipments',
  '/v1/hexaship/mvp-v0.1/shipments',
  '/v1/merchant-console/onboarding',
] as const;
const TRACKING_WEBHOOK_PATH = '/v1/delivery/webhooks/tracking';
const SANDBOX_CARRIER_SMOKE_PATH = '/v1/delivery/test-vectors/sandbox-carrier-smoke';
const SHIPMENT_ADDRESS_FORM_PATHS = new Set([
  '/v1/shipments',
  '/v1/hexaship/mvp-v0.1/shipments',
]);
const ADDRESS_FORM_VERSION_PATTERN = '^wallet_country_form_ref_[a-z0-9_:-]+$';
const CARRIER_HANDOFF_REF_PATTERN = '^carrier_handoff_[0-9a-f]{24}$';
const REQUIRED_CARRIER_HANDOFF_PREREQUISITES = [
  'addressAliasRef',
  'walletConsentRef',
  'carrierCapabilityRef',
  'allocationRef',
  'labelRef',
];
const REQUIRED_CARRIER_HANDOFF_MERCHANT_VISIBLE_REFS = [
  'allocationRef',
  'labelRef',
  'trackingReceiptRef',
  'deliveryProofRef',
];
const REQUIRED_CARRIER_HANDOFF_FORBIDDEN_PUBLIC_FIELDS = [
  'carrierHandoffRef',
  'rawAddress',
  'recipientPhone',
  'carrierApiKey',
  'proofWitness',
  'privateKey',
  'proofSecret',
  'rawCarrierPayload',
];
const REQUIRED_CARRIER_HANDOFF_NON_CLAIMS = [
  'not-public-api-field',
  'not-merchant-visible-receipt',
  'not-raw-address-material',
  'not-production-carrier-traffic',
  'not-real-label-purchase',
];

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valueAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function readOpenApi(path: string) {
  if (!existsSync(path)) throw new Error(`openapi-not-found:${path}`);
  return parseYaml(readFileSync(path, 'utf8')) as unknown;
}

function refEquals(value: unknown, expected: string) {
  return isObject(value) && value.$ref === expected;
}

function arrayIncludesAll(value: unknown, expected: string[]) {
  return Array.isArray(value) && expected.every(item => value.includes(item));
}

function schemaPatternForRef(schemas: JsonObject, ref: unknown, propertyName: string) {
  if (!isObject(ref) || typeof ref.$ref !== 'string' || !ref.$ref.startsWith('#/components/schemas/')) return undefined;
  const schemaName = ref.$ref.replace('#/components/schemas/', '');
  const schema = isObject(schemas[schemaName]) ? schemas[schemaName] : {};
  const properties = isObject(schema.properties) ? schema.properties : {};
  const property = isObject(properties[propertyName]) ? properties[propertyName] : {};
  return typeof property.pattern === 'string' ? property.pattern : undefined;
}

function hasWalletCountryFormRef(value: unknown): boolean {
  if (typeof value === 'string') return new RegExp(ADDRESS_FORM_VERSION_PATTERN).test(value);
  if (Array.isArray(value)) return value.some(item => hasWalletCountryFormRef(item));
  if (isObject(value)) return Object.values(value).some(item => hasWalletCountryFormRef(item));
  return false;
}

function collectErrors(openapi: unknown) {
  const errors: string[] = [];
  if (!isObject(openapi)) return ['openapi-root-not-object'];

  const components = isObject(openapi.components) ? openapi.components : {};
  const parameters = isObject(components.parameters) ? components.parameters : {};
  const headers = isObject(components.headers) ? components.headers : {};
  const responses = isObject(components.responses) ? components.responses : {};
  const schemas = isObject(components.schemas) ? components.schemas : {};
  const paths = isObject(openapi.paths) ? openapi.paths : {};

  const idempotencyKey = isObject(parameters.IdempotencyKey) ? parameters.IdempotencyKey : undefined;
  if (!idempotencyKey) errors.push('missing-component-parameter:IdempotencyKey');
  if (idempotencyKey?.name !== 'Idempotency-Key') errors.push('idempotency-parameter-name-mismatch');
  if (idempotencyKey?.in !== 'header') errors.push('idempotency-parameter-location-mismatch');

  if (!isObject(headers.SkipshipIdempotencyKey)) errors.push('missing-component-header:SkipshipIdempotencyKey');
  const replayedHeader = isObject(headers.SkipshipIdempotencyReplayed) ? headers.SkipshipIdempotencyReplayed : undefined;
  const replayedSchema = isObject(replayedHeader?.schema) ? replayedHeader.schema : undefined;
  const replayedEnum = Array.isArray(replayedSchema?.enum) ? replayedSchema.enum : [];
  if (!replayedHeader) errors.push('missing-component-header:SkipshipIdempotencyReplayed');
  if (!replayedEnum.includes('true') || !replayedEnum.includes('false')) {
    errors.push('idempotency-replayed-header-enum-missing');
  }
  const webhookEventReplayedHeader = isObject(headers.SkipshipWebhookEventReplayed) ? headers.SkipshipWebhookEventReplayed : undefined;
  const webhookEventReplayedSchema = isObject(webhookEventReplayedHeader?.schema) ? webhookEventReplayedHeader.schema : undefined;
  const webhookEventReplayedEnum = Array.isArray(webhookEventReplayedSchema?.enum) ? webhookEventReplayedSchema.enum : [];
  if (!webhookEventReplayedHeader) errors.push('missing-component-header:SkipshipWebhookEventReplayed');
  if (!webhookEventReplayedEnum.includes('true') || !webhookEventReplayedEnum.includes('false')) {
    errors.push('webhook-event-replayed-header-enum-missing');
  }
  const webhookEventAttemptHeader = isObject(headers.SkipshipWebhookEventAttempt) ? headers.SkipshipWebhookEventAttempt : undefined;
  const webhookEventAttemptSchema = isObject(webhookEventAttemptHeader?.schema) ? webhookEventAttemptHeader.schema : {};
  if (!webhookEventAttemptHeader) errors.push('missing-component-header:SkipshipWebhookEventAttempt');
  if (webhookEventAttemptSchema.pattern !== '^[1-9][0-9]*$') errors.push('webhook-event-attempt-header-pattern-mismatch');
  const webhookEventExpiresAtHeader = isObject(headers.SkipshipWebhookEventExpiresAt) ? headers.SkipshipWebhookEventExpiresAt : undefined;
  const webhookEventExpiresAtSchema = isObject(webhookEventExpiresAtHeader?.schema) ? webhookEventExpiresAtHeader.schema : {};
  if (!webhookEventExpiresAtHeader) errors.push('missing-component-header:SkipshipWebhookEventExpiresAt');
  if (webhookEventExpiresAtSchema.format !== 'date-time') errors.push('webhook-event-expires-at-header-format-mismatch');

  const conflictResponse = isObject(responses.IdempotencyConflict) ? responses.IdempotencyConflict : undefined;
  const conflictContent = isObject(conflictResponse?.content) ? conflictResponse.content : undefined;
  const conflictJson = isObject(conflictContent?.['application/json']) ? conflictContent['application/json'] : undefined;
  if (!refEquals(conflictJson?.schema, '#/components/schemas/IdempotencyConflictError')) {
    errors.push('idempotency-conflict-response-schema-missing');
  }

  const conflictSchema = isObject(schemas.IdempotencyConflictError) ? schemas.IdempotencyConflictError : undefined;
  const conflictProperties = isObject(conflictSchema?.properties) ? conflictSchema.properties : {};
  if (!conflictSchema) errors.push('missing-schema:IdempotencyConflictError');
  if (!isObject(conflictProperties.error)) errors.push('idempotency-conflict-error-property-missing');
  if (isObject(conflictProperties.error) && conflictProperties.error.const !== 'idempotency_key_conflict') {
    errors.push('idempotency-conflict-error-const-mismatch');
  }

  const webhookSignature = isObject(parameters.DeliveryWebhookSignature) ? parameters.DeliveryWebhookSignature : undefined;
  const webhookSignatureSchema = isObject(webhookSignature?.schema) ? webhookSignature.schema : undefined;
  if (!webhookSignature) errors.push('missing-component-parameter:DeliveryWebhookSignature');
  if (webhookSignature?.name !== 'Skipship-Signature') errors.push('webhook-signature-parameter-name-mismatch');
  if (webhookSignature?.in !== 'header') errors.push('webhook-signature-parameter-location-mismatch');
  if (webhookSignature?.required !== true) errors.push('webhook-signature-parameter-not-required');
  if (typeof webhookSignatureSchema?.pattern !== 'string' || !webhookSignatureSchema.pattern.includes('v1=')) {
    errors.push('webhook-signature-pattern-missing');
  }

  const webhookTimestamp = isObject(parameters.DeliveryWebhookTimestamp) ? parameters.DeliveryWebhookTimestamp : undefined;
  if (!webhookTimestamp) errors.push('missing-component-parameter:DeliveryWebhookTimestamp');
  if (webhookTimestamp?.name !== 'Skipship-Timestamp') errors.push('webhook-timestamp-parameter-name-mismatch');
  if (webhookTimestamp?.in !== 'header') errors.push('webhook-timestamp-parameter-location-mismatch');
  if (webhookTimestamp?.required !== true) errors.push('webhook-timestamp-parameter-not-required');

  for (const path of REQUIRED_POST_PATHS) {
    const pathItem = isObject(paths[path]) ? paths[path] : undefined;
    const post = isObject(pathItem?.post) ? pathItem.post : undefined;
    if (!post) {
      errors.push(`missing-post:${path}`);
      continue;
    }

    const parametersList = Array.isArray(post.parameters) ? post.parameters : [];
    if (!parametersList.some(parameter => refEquals(parameter, '#/components/parameters/IdempotencyKey'))) {
      errors.push(`missing-idempotency-parameter:${path}`);
    }

    const responsesByStatus = isObject(post.responses) ? post.responses : {};
    const successStatus = path === '/v1/delivery/rates' || path === '/v1/delivery/allocate' ? '200' : '201';
    const successResponse = isObject(responsesByStatus[successStatus]) ? responsesByStatus[successStatus] : undefined;
    const successHeaders = isObject(successResponse?.headers) ? successResponse.headers : {};
    if (!refEquals(successHeaders['skipship-idempotency-key'], '#/components/headers/SkipshipIdempotencyKey')) {
      errors.push(`missing-idempotency-key-response-header:${path}`);
    }
    if (!refEquals(successHeaders['skipship-idempotency-replayed'], '#/components/headers/SkipshipIdempotencyReplayed')) {
      errors.push(`missing-idempotency-replayed-response-header:${path}`);
    }
    if (!refEquals(responsesByStatus['409'], '#/components/responses/IdempotencyConflict')) {
      errors.push(`missing-idempotency-conflict-response:${path}`);
    }

    if (SHIPMENT_ADDRESS_FORM_PATHS.has(path)) {
      const requestBody = isObject(post.requestBody) ? post.requestBody : {};
      const requestContent = isObject(requestBody.content) ? requestBody.content : {};
      const requestJson = isObject(requestContent['application/json']) ? requestContent['application/json'] : {};
      const requestSchemaPattern = schemaPatternForRef(schemas, requestJson.schema, 'addressFormVersion');
      const requestExamples = isObject(requestJson.examples) ? requestJson.examples : {};
      if (requestSchemaPattern !== ADDRESS_FORM_VERSION_PATTERN) {
        errors.push(`address-form-version-pattern-missing:${path}`);
      }
      if (!hasWalletCountryFormRef(requestExamples)) {
        errors.push(`address-form-version-example-prefix-missing:${path}`);
      }
    }
  }

  const trackingPathItem = isObject(paths[TRACKING_WEBHOOK_PATH]) ? paths[TRACKING_WEBHOOK_PATH] : undefined;
  const trackingPost = isObject(trackingPathItem?.post) ? trackingPathItem.post : undefined;
  if (!trackingPost) {
    errors.push(`missing-post:${TRACKING_WEBHOOK_PATH}`);
  } else {
    const eventIdempotency = isObject(trackingPost['x-agid-event-idempotency'])
      ? trackingPost['x-agid-event-idempotency']
      : {};
    const blockedMaterial = Array.isArray(eventIdempotency.blockedMaterial) ? eventIdempotency.blockedMaterial : [];
    if (eventIdempotency.eventKey !== 'eventId') errors.push('tracking-webhook-event-key-mismatch');
    if (eventIdempotency.fingerprint !== 'signed-normalized-body') errors.push('tracking-webhook-fingerprint-mismatch');
    if (eventIdempotency.replayBehavior !== 'ack-same-event') errors.push('tracking-webhook-replay-behavior-mismatch');
    if (eventIdempotency.conflictBehavior !== 'reject-same-event-different-body') {
      errors.push('tracking-webhook-conflict-behavior-mismatch');
    }
    if (eventIdempotency.replayWindowSeconds !== 300) errors.push('tracking-webhook-replay-window-mismatch');
    if (eventIdempotency.minimumStoreTtlDays !== SKIPSHIP_WEBHOOK_EVENT_STORE_DEFAULT_TTL_DAYS) {
      errors.push('tracking-webhook-store-ttl-mismatch');
    }
    if (eventIdempotency.deadLetterAfterAttempts !== 12) errors.push('tracking-webhook-dead-letter-attempts-mismatch');
    if (eventIdempotency.durableStoreRequiredForProduction !== true) {
      errors.push('tracking-webhook-durable-store-required-missing');
    }
    for (const forbidden of ['raw_address', 'recipient_phone', 'carrier_secret', 'proof_witness', 'raw_tracking_payload']) {
      if (!blockedMaterial.includes(forbidden)) errors.push(`tracking-webhook-event-idempotency-blocked-material-missing:${forbidden}`);
    }

    const parametersList = Array.isArray(trackingPost.parameters) ? trackingPost.parameters : [];
    if (!parametersList.some(parameter => refEquals(parameter, '#/components/parameters/DeliveryWebhookSignature'))) {
      errors.push('missing-webhook-signature-parameter');
    }
    if (!parametersList.some(parameter => refEquals(parameter, '#/components/parameters/DeliveryWebhookTimestamp'))) {
      errors.push('missing-webhook-timestamp-parameter');
    }

    const requestBody = isObject(trackingPost.requestBody) ? trackingPost.requestBody : {};
    const requestContent = isObject(requestBody.content) ? requestBody.content : {};
    const requestJson = isObject(requestContent['application/json']) ? requestContent['application/json'] : {};
    if (!refEquals(requestJson.schema, '#/components/schemas/TrackingWebhookRequest')) {
      errors.push('tracking-webhook-request-schema-missing');
    }

    const responsesByStatus = isObject(trackingPost.responses) ? trackingPost.responses : {};
    const acceptedResponse = isObject(responsesByStatus['202']) ? responsesByStatus['202'] : {};
    const acceptedHeaders = isObject(acceptedResponse.headers) ? acceptedResponse.headers : {};
    if (!refEquals(acceptedHeaders['skipship-webhook-event-replayed'], '#/components/headers/SkipshipWebhookEventReplayed')) {
      errors.push('tracking-webhook-missing-replayed-response-header');
    }
    if (!refEquals(acceptedHeaders['skipship-webhook-event-attempt'], '#/components/headers/SkipshipWebhookEventAttempt')) {
      errors.push('tracking-webhook-missing-attempt-response-header');
    }
    if (!refEquals(acceptedHeaders['skipship-webhook-event-expires-at'], '#/components/headers/SkipshipWebhookEventExpiresAt')) {
      errors.push('tracking-webhook-missing-expires-at-response-header');
    }
    const acceptedContent = isObject(acceptedResponse.content) ? acceptedResponse.content : {};
    const acceptedJson = isObject(acceptedContent['application/json']) ? acceptedContent['application/json'] : {};
    if (!refEquals(acceptedJson.schema, '#/components/schemas/TrackingWebhookReceipt')) {
      errors.push('tracking-webhook-receipt-schema-missing');
    }
    if (!refEquals(responsesByStatus['400'], '#/components/responses/TrackingWebhookBadRequest')) {
      errors.push('tracking-webhook-missing-400-ref');
    }
    if (!refEquals(responsesByStatus['401'], '#/components/responses/TrackingWebhookUnauthorized')) {
      errors.push('tracking-webhook-missing-401-ref');
    }
    if (!refEquals(responsesByStatus['409'], '#/components/responses/TrackingWebhookConflict')) {
      errors.push('tracking-webhook-missing-409-ref');
    }
  }

  const trackingRequest = isObject(schemas.TrackingWebhookRequest) ? schemas.TrackingWebhookRequest : undefined;
  const trackingRequestText = JSON.stringify(trackingRequest ?? {});
  if (!trackingRequest) errors.push('missing-schema:TrackingWebhookRequest');
  for (const forbidden of ['rawAddress', 'recipientPhone', 'carrierSecret', 'proofWitness', 'rawTrackingPayload']) {
    if (trackingRequestText.includes(forbidden)) errors.push(`tracking-webhook-forbidden-material:${forbidden}`);
  }
  const trackingReceipt = isObject(schemas.TrackingWebhookReceipt) ? schemas.TrackingWebhookReceipt : undefined;
  const trackingReceiptProperties = isObject(trackingReceipt?.properties) ? trackingReceipt.properties : {};
  if (!trackingReceipt) errors.push('missing-schema:TrackingWebhookReceipt');
  if (!arrayIncludesAll(trackingReceipt?.required, [
    'ok',
    'trackingReceiptRef',
    'eventFingerprint',
    'eventId',
    'status',
    'accepted',
    'localOnly',
    'rawAddressStored',
    'productionTraffic',
  ])) {
    errors.push('tracking-webhook-receipt-required-fields-missing');
  }
  if (isObject(trackingReceiptProperties.rawAddressStored) && trackingReceiptProperties.rawAddressStored.const !== false) {
    errors.push('tracking-webhook-receipt-raw-address-stored-not-false');
  }
  if (isObject(trackingReceiptProperties.productionTraffic) && trackingReceiptProperties.productionTraffic.const !== false) {
    errors.push('tracking-webhook-receipt-production-traffic-not-false');
  }

  const sandboxSmokePathItem = isObject(paths[SANDBOX_CARRIER_SMOKE_PATH]) ? paths[SANDBOX_CARRIER_SMOKE_PATH] : undefined;
  const sandboxSmokeGet = isObject(sandboxSmokePathItem?.get) ? sandboxSmokePathItem.get : undefined;
  if (!sandboxSmokeGet) {
    errors.push(`missing-get:${SANDBOX_CARRIER_SMOKE_PATH}`);
  } else {
    const internalEvidence = isObject(sandboxSmokeGet['x-agid-internal-evidence'])
      ? sandboxSmokeGet['x-agid-internal-evidence']
      : undefined;
    if (!internalEvidence) {
      errors.push('missing-carrier-handoff-internal-evidence');
    } else {
      const prerequisiteRefs = Array.isArray(internalEvidence.prerequisiteRefs) ? internalEvidence.prerequisiteRefs : [];
      const merchantVisibleRefFields = Array.isArray(internalEvidence.merchantVisibleRefFields)
        ? internalEvidence.merchantVisibleRefFields
        : [];
      const forbiddenPublicSchemaFields = Array.isArray(internalEvidence.forbiddenPublicSchemaFields)
        ? internalEvidence.forbiddenPublicSchemaFields
        : [];
      const nonClaims = Array.isArray(internalEvidence.nonClaims) ? internalEvidence.nonClaims : [];

      if (internalEvidence.evidenceId !== 'carrier-only-handoff-ref-v0.1') errors.push('carrier-handoff-evidence-id-mismatch');
      if (internalEvidence.sourceContract !== 'src/lib/deliveryGatewayCarrierApi.ts#buildCarrierOnlyHandoffRefEvidence') {
        errors.push('carrier-handoff-source-contract-mismatch');
      }
      if (internalEvidence.visibility !== 'carrier-adapter-only') errors.push('carrier-handoff-visibility-mismatch');
      if (internalEvidence.publicSchemaFieldAllowed !== false) errors.push('carrier-handoff-public-schema-field-allowed-not-false');
      if (internalEvidence.safeRefPattern !== CARRIER_HANDOFF_REF_PATTERN) errors.push('carrier-handoff-ref-pattern-mismatch');
      if (internalEvidence.localOnly !== true) errors.push('carrier-handoff-local-only-not-true');
      if (internalEvidence.productionTraffic !== false) errors.push('carrier-handoff-production-traffic-not-false');
      for (const prerequisite of REQUIRED_CARRIER_HANDOFF_PREREQUISITES) {
        if (!prerequisiteRefs.includes(prerequisite)) errors.push(`carrier-handoff-prerequisite-missing:${prerequisite}`);
      }
      for (const field of REQUIRED_CARRIER_HANDOFF_MERCHANT_VISIBLE_REFS) {
        if (!merchantVisibleRefFields.includes(field)) errors.push(`carrier-handoff-merchant-visible-ref-missing:${field}`);
      }
      if (merchantVisibleRefFields.includes('carrierHandoffRef')) errors.push('carrier-handoff-merchant-visible-ref-present');
      for (const field of REQUIRED_CARRIER_HANDOFF_FORBIDDEN_PUBLIC_FIELDS) {
        if (!forbiddenPublicSchemaFields.includes(field)) errors.push(`carrier-handoff-forbidden-public-field-missing:${field}`);
      }
      for (const nonClaim of REQUIRED_CARRIER_HANDOFF_NON_CLAIMS) {
        if (!nonClaims.includes(nonClaim)) errors.push(`carrier-handoff-non-claim-missing:${nonClaim}`);
      }
    }
  }

  const publicSchemasText = JSON.stringify(schemas);
  if (publicSchemasText.includes('"carrierHandoffRef"')) errors.push('carrier-handoff-public-schema-field-present');
  if (publicSchemasText.includes('carrier_handoff_')) errors.push('carrier-handoff-public-schema-pattern-present');

  const requiredResponses = [
    'TrackingWebhookBadRequest',
    'TrackingWebhookUnauthorized',
    'TrackingWebhookConflict',
  ];
  for (const responseName of requiredResponses) {
    if (!isObject(responses[responseName])) errors.push(`missing-component-response:${responseName}`);
  }

  const signatureError = isObject(schemas.TrackingWebhookSignatureError) ? schemas.TrackingWebhookSignatureError : undefined;
  const signatureProperties = isObject(signatureError?.properties) ? signatureError.properties : {};
  const signatureErrorProperty = isObject(signatureProperties.error) ? signatureProperties.error : {};
  const signatureErrors = Array.isArray(signatureErrorProperty.enum) ? signatureErrorProperty.enum : [];
  for (const expected of ['missing_signature', 'malformed_signature', 'timestamp_mismatch', 'signature_mismatch']) {
    if (!signatureErrors.includes(expected)) errors.push(`tracking-webhook-signature-error-missing:${expected}`);
  }
  if (!isObject(schemas.InvalidTrackingWebhookBodyError)) errors.push('missing-schema:InvalidTrackingWebhookBodyError');
  if (!isObject(schemas.RejectedPrivateMaterialError)) errors.push('missing-schema:RejectedPrivateMaterialError');
  const conflictError = isObject(schemas.TrackingWebhookConflictError) ? schemas.TrackingWebhookConflictError : undefined;
  const conflictErrorProperties = isObject(conflictError?.properties) ? conflictError.properties : {};
  const conflictErrorValue = isObject(conflictErrorProperties.error) ? conflictErrorProperties.error : {};
  if (!conflictError) errors.push('missing-schema:TrackingWebhookConflictError');
  if (conflictErrorValue.const !== 'tracking_webhook_event_conflict') {
    errors.push('tracking-webhook-conflict-error-const-mismatch');
  }

  return errors;
}

const openapiPath = valueAfter('--openapi') ?? DEFAULT_OPENAPI_PATH;
const jsonMode = process.argv.includes('--json');

try {
  const openapi = readOpenApi(openapiPath);
  const errors = collectErrors(openapi);
  const payload = {
    gate: 'verify-skipship-idempotency-openapi',
    openapiPath,
    status: errors.length === 0 ? 'pass' : 'fail',
    checkedPaths: [...REQUIRED_POST_PATHS, TRACKING_WEBHOOK_PATH, SANDBOX_CARRIER_SMOKE_PATH],
    errors,
  };

  if (jsonMode) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`[verify-skipship-idempotency-openapi] status=${payload.status}`);
    console.log(`openapi=${openapiPath}`);
    console.log(`checkedPaths=${payload.checkedPaths.join(',')}`);
    for (const error of errors) console.error(`error=${error}`);
  }

  if (errors.length > 0) process.exitCode = 1;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (jsonMode) {
    console.log(JSON.stringify({
      gate: 'verify-skipship-idempotency-openapi',
      openapiPath,
      status: 'fail',
      errors: [message],
    }, null, 2));
  } else {
    console.error('[verify-skipship-idempotency-openapi] status=fail');
    console.error(message);
  }
  process.exitCode = 1;
}
