import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const PREFLIGHT_FIXTURE_PATH = join(
  'docs',
  'specs',
  'fixtures',
  'playlist-commerce-webhook-preflight-v0.1.json',
);
const EVIDENCE_FIXTURE_PATH = join(
  'docs',
  'specs',
  'fixtures',
  'playlist-commerce-webhook-evidence-v0.1.json',
);
const HISTORY_FIXTURE_PATH = join(
  'docs',
  'specs',
  'fixtures',
  'playlist-commerce-webhook-preflight-history-v0.1.json',
);
const EVIDENCE_SCHEMA_PATH = join(
  'docs',
  'specs',
  'schemas',
  'playlist-commerce-webhook-evidence-v0.1.schema.json',
);
const OPENAPI_EVIDENCE_EXTENSION_SCHEMA_PATH = join(
  'docs',
  'specs',
  'schemas',
  'agid-openapi-evidence-extension-v0.1.schema.json',
);
const PLAYLIST_COMMERCE_OPENAPI_EVIDENCE_EXTENSION_PROFILE_SCHEMA_PATH = join(
  'docs',
  'specs',
  'schemas',
  'playlist-commerce-openapi-evidence-extension-v0.1.schema.json',
);
const OPENAPI_PATH = join('docs', 'specs', 'playlist-commerce-webhooks.openapi.yaml');

type CheckStatus = 'pass' | 'fail';

type EvidenceRecord = {
  evidenceRef?: string;
  vaultRecordRef?: string;
  kind?: string;
  runId?: string;
  routeId?: string;
  eventRef?: string;
  topic?: string;
  capturedAt?: string;
  status?: string;
  publicProjection?: {
    passed?: boolean;
    acceptedStatus?: number;
    replayStatus?: number;
    replayBlocked?: boolean;
    checkIds?: string[];
    checkStatuses?: Record<string, CheckStatus>;
  };
  commitments?: {
    requestCommitmentRef?: string;
    responseCommitmentRef?: string;
    checkCommitmentRef?: string;
  };
  privacyBoundary?: {
    localOnly?: boolean;
    rawPayloadStored?: boolean;
    signatureStored?: boolean;
    secretMaterialStored?: boolean;
    rawAddressStored?: boolean;
    proofWitnessStored?: boolean;
    recipientContactStored?: boolean;
  };
  retention?: {
    mode?: string;
    ttlHours?: number;
  };
  nonClaims?: string[];
};

type EvidenceArtifact = {
  artifact?: string;
  version?: string;
  generatedAt?: string;
  source?: {
    historyFixture?: string;
    safeCommand?: string;
    localOnly?: boolean;
    managedServiceBoundary?: string;
  };
  summary?: {
    totalRecords?: number;
    latestEvidenceRef?: string;
    linkedHistoryRuns?: number;
    allRecordsRedacted?: boolean;
  };
  records?: EvidenceRecord[];
  forbiddenMaterial?: string[];
  nonClaims?: string[];
};

type HistoryRun = {
  runId?: string;
  evidenceRef?: string;
  generatedAt?: string;
  routeId?: string;
  eventId?: string;
  topic?: string;
  passed?: boolean;
  acceptedStatus?: number;
  replayStatus?: number;
  replayBlocked?: boolean;
  checkStatuses?: Record<string, CheckStatus>;
};

type HistoryArtifact = {
  artifact?: string;
  version?: string;
  summary?: {
    totalRuns?: number;
    latestEvidenceRef?: string;
  };
  runs?: HistoryRun[];
  privacyBoundary?: {
    forbiddenMaterial?: string[];
    nonClaims?: string[];
  };
};

type JsonObject = Record<string, unknown>;

type JsonSchemaSubset = {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JsonSchemaSubset>;
  title?: string;
  description?: string;
  allOf?: JsonSchemaSubset[];
  const?: unknown;
  enum?: unknown[];
  type?: string;
  format?: string;
  pattern?: string;
  minimum?: number;
  minItems?: number;
  required?: string[];
  properties?: Record<string, JsonSchemaSubset>;
  additionalProperties?: boolean | JsonSchemaSubset;
  items?: JsonSchemaSubset;
  contains?: JsonSchemaSubset;
};

type EvidenceSchema = {
  $schema?: string;
  $id?: string;
  title?: string;
  properties?: {
    artifact?: { const?: string };
    version?: { const?: string };
    source?: {
      properties?: {
        safeCommand?: { const?: string };
        localOnly?: { const?: boolean };
        managedServiceBoundary?: { const?: string };
      };
    };
    summary?: {
      properties?: {
        allRecordsRedacted?: { const?: boolean };
      };
    };
  };
  $defs?: {
    evidenceRef?: { pattern?: string };
    evidenceRecord?: {
      properties?: {
        privacyBoundary?: {
          properties?: {
            rawPayloadStored?: { const?: boolean };
            signatureStored?: { const?: boolean };
            secretMaterialStored?: { const?: boolean };
            rawAddressStored?: { const?: boolean };
            proofWitnessStored?: { const?: boolean };
            recipientContactStored?: { const?: boolean };
          };
        };
        commitments?: {
          properties?: {
            requestCommitmentRef?: { pattern?: string };
            responseCommitmentRef?: { pattern?: string };
            checkCommitmentRef?: { pattern?: string };
          };
        };
      };
    };
  };
};

type OpenApiEvidenceFixturesExtension = {
  preflightFixture?: string;
  historyFixture?: string;
  evidenceFixture?: string;
  evidenceSchema?: string;
  verifierCommand?: string;
  aggregateVerifierCommand?: string;
  managedServiceBoundary?: string;
  localOnly?: boolean;
  forbiddenMaterial?: string[];
  nonClaims?: string[];
};

type PlaylistCommerceWebhookOpenApi = {
  externalDocs?: {
    url?: string;
    description?: string;
  };
  paths?: {
    '/webhooks/playlist-commerce'?: {
      post?: {
        externalDocs?: {
          url?: string;
          description?: string;
        };
        'x-agid-evidence-fixtures'?: OpenApiEvidenceFixturesExtension;
      };
    };
  };
};

export type PlaylistCommerceWebhookEvidenceCheckResult = {
  ok: boolean;
  evidenceFixturePath: string;
  historyFixturePath: string;
  schemaPath: string;
  openApiPath: string;
  openApiExtensionSchemaPath: string;
  playlistCommerceOpenApiExtensionProfileSchemaPath: string;
  errors: string[];
  summary: {
    totalRecords: number;
    linkedHistoryRuns: number;
    latestEvidenceRef: string;
    managedServiceBoundary: string;
  };
};

function readJson<T>(path: string): { value?: T; text: string; errors: string[] } {
  if (!existsSync(path)) {
    return { text: '', errors: [`missing-file:${path}`] };
  }

  const text = readFileSync(path, 'utf8');
  try {
    return { value: JSON.parse(text) as T, text, errors: [] };
  } catch (error) {
    return { text, errors: [`invalid-json:${error instanceof Error ? error.message : String(error)}`] };
  }
}

function readYaml<T>(path: string): { value?: T; text: string; errors: string[] } {
  if (!existsSync(path)) {
    return { text: '', errors: [`missing-file:${path}`] };
  }

  const text = readFileSync(path, 'utf8');
  try {
    return { value: parseYaml(text) as T, text, errors: [] };
  } catch (error) {
    return { text, errors: [`invalid-yaml:${error instanceof Error ? error.message : String(error)}`] };
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSchemaSubset(value: unknown): value is JsonSchemaSubset {
  return isJsonObject(value);
}

function schemaTypeMatches(type: string | undefined, value: unknown) {
  if (!type) return true;
  if (type === 'object') return isJsonObject(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return true;
}

function resolveSchemaRef(root: JsonSchemaSubset, ref: string): JsonSchemaSubset | undefined {
  if (!ref.startsWith('#/')) return undefined;
  const parts = ref.slice(2).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current: unknown = root;
  for (const part of parts) {
    if (!isJsonObject(current)) return undefined;
    current = current[part];
  }
  return isSchemaSubset(current) ? current : undefined;
}

function validateJsonWithSchemaSubset(
  value: unknown,
  schema: JsonSchemaSubset,
  root = schema,
  path = '$',
): string[] {
  const errors: string[] = [];

  if (schema.$ref) {
    const resolved = resolveSchemaRef(root, schema.$ref);
    if (!resolved) return [`${path}:unresolved-ref:${schema.$ref}`];
    return validateJsonWithSchemaSubset(value, resolved, root, path);
  }

  if (schema.allOf) {
    schema.allOf.forEach((child, index) => {
      errors.push(...validateJsonWithSchemaSubset(value, child, root, `${path}.allOf[${index}]`));
    });
  }

  if ('const' in schema && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    errors.push(`${path}:const-mismatch`);
  }
  if (schema.enum && !schema.enum.some(option => JSON.stringify(option) === JSON.stringify(value))) {
    errors.push(`${path}:enum-mismatch`);
  }
  if (!schemaTypeMatches(schema.type, value)) {
    errors.push(`${path}:type-mismatch:${schema.type}`);
    return errors;
  }
  if (schema.format === 'date-time' && typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path}:date-time-format-mismatch`);
  }
  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${path}:pattern-mismatch`);
  }
  if (typeof schema.minimum === 'number' && typeof value === 'number' && value < schema.minimum) {
    errors.push(`${path}:minimum-mismatch`);
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) errors.push(`${path}:min-items-mismatch`);
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateJsonWithSchemaSubset(item, schema.items as JsonSchemaSubset, root, `${path}[${index}]`));
      });
    }
    if (schema.contains && !value.some(item => validateJsonWithSchemaSubset(item, schema.contains as JsonSchemaSubset, root, path).length === 0)) {
      errors.push(`${path}:contains-mismatch`);
    }
  }

  if (isJsonObject(value)) {
    const properties = schema.properties ?? {};
    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in value)) errors.push(`${path}.${requiredKey}:required-missing`);
    }
    for (const [key, childValue] of Object.entries(value)) {
      const childSchema = properties[key];
      if (childSchema) {
        errors.push(...validateJsonWithSchemaSubset(childValue, childSchema, root, `${path}.${key}`));
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}.${key}:additional-property`);
      } else if (isSchemaSubset(schema.additionalProperties)) {
        errors.push(...validateJsonWithSchemaSubset(childValue, schema.additionalProperties, root, `${path}.${key}`));
      }
    }
  }

  return errors;
}

function hasAllNonClaims(actual: string[] | undefined, required: string[]) {
  return required.every(nonClaim => actual?.includes(nonClaim));
}

function toSpecPath(path: string) {
  return path.replace(/\\/g, '/');
}

function matchesHistory(record: EvidenceRecord, run: HistoryRun) {
  return (
    record.evidenceRef === run.evidenceRef &&
    record.runId === run.runId &&
    record.routeId === run.routeId &&
    record.topic === run.topic &&
    record.capturedAt === run.generatedAt &&
    record.eventRef === `event_ref:${run.eventId}` &&
    record.publicProjection?.passed === run.passed &&
    record.publicProjection?.acceptedStatus === run.acceptedStatus &&
    record.publicProjection?.replayStatus === run.replayStatus &&
    record.publicProjection?.replayBlocked === run.replayBlocked
  );
}

function isRedacted(record: EvidenceRecord) {
  return (
    record.privacyBoundary?.localOnly === true &&
    record.privacyBoundary.rawPayloadStored === false &&
    record.privacyBoundary.signatureStored === false &&
    record.privacyBoundary.secretMaterialStored === false &&
    record.privacyBoundary.rawAddressStored === false &&
    record.privacyBoundary.proofWitnessStored === false &&
    record.privacyBoundary.recipientContactStored === false
  );
}

function validateEvidenceRecord(record: EvidenceRecord, historyByEvidenceRef: Map<string, HistoryRun>) {
  const errors: string[] = [];
  const evidenceRef = record.evidenceRef ?? '';
  const historyRun = historyByEvidenceRef.get(evidenceRef);

  if (!/^pc_webhook_preflight_evidence_\d{3}$/.test(evidenceRef)) errors.push(`record:${evidenceRef}:invalid-evidence-ref`);
  if (record.vaultRecordRef !== `ev_vault_${evidenceRef}`) errors.push(`record:${evidenceRef}:invalid-vault-ref`);
  if (record.kind !== 'playlist-commerce-webhook-preflight') errors.push(`record:${evidenceRef}:invalid-kind`);
  if (record.status !== 'accepted-and-replay-blocked') errors.push(`record:${evidenceRef}:invalid-status`);
  if (!historyRun) {
    errors.push(`record:${evidenceRef}:history-run-missing`);
  } else if (!matchesHistory(record, historyRun)) {
    errors.push(`record:${evidenceRef}:history-link-mismatch`);
  }

  if (record.publicProjection?.passed !== true) errors.push(`record:${evidenceRef}:not-passed`);
  if (record.publicProjection?.acceptedStatus !== 202) errors.push(`record:${evidenceRef}:accepted-status-mismatch`);
  if (record.publicProjection?.replayStatus !== 401) errors.push(`record:${evidenceRef}:replay-status-mismatch`);
  if (record.publicProjection?.replayBlocked !== true) errors.push(`record:${evidenceRef}:replay-not-blocked`);
  if (record.publicProjection?.checkStatuses?.['redacted-response'] !== 'pass') {
    errors.push(`record:${evidenceRef}:redaction-check-missing`);
  }
  if (record.publicProjection?.checkStatuses?.['activation-private-material-blocked'] !== 'pass') {
    errors.push(`record:${evidenceRef}:activation-block-check-missing`);
  }
  if (record.publicProjection?.checkStatuses?.['non-claims-declared'] !== 'pass') {
    errors.push(`record:${evidenceRef}:non-claims-check-missing`);
  }

  if (!/^pc_req_[a-f0-9]{8}$/.test(record.commitments?.requestCommitmentRef ?? '')) {
    errors.push(`record:${evidenceRef}:request-commitment-invalid`);
  }
  if (!/^pc_res_[a-f0-9]{8}$/.test(record.commitments?.responseCommitmentRef ?? '')) {
    errors.push(`record:${evidenceRef}:response-commitment-invalid`);
  }
  if (!/^pc_chk_[a-f0-9]{8}$/.test(record.commitments?.checkCommitmentRef ?? '')) {
    errors.push(`record:${evidenceRef}:check-commitment-invalid`);
  }

  if (!isRedacted(record)) errors.push(`record:${evidenceRef}:privacy-boundary-invalid`);
  if (record.retention?.mode !== 'fixture-regenerate-only') errors.push(`record:${evidenceRef}:retention-mode-invalid`);
  if (record.retention?.ttlHours !== 24) errors.push(`record:${evidenceRef}:retention-ttl-invalid`);
  if (!hasAllNonClaims(record.nonClaims, [
    'not-payment-settlement',
    'not-raw-address-intake',
    'not-proof-witness-intake',
    'not-provider-token-intake',
    'not-raw-carrier-payload-intake',
    'not-production-delivery-attempt',
  ])) {
    errors.push(`record:${evidenceRef}:non-claims-incomplete`);
  }

  return errors;
}

function validateEvidenceSchema(schema: EvidenceSchema | undefined) {
  const errors: string[] = [];
  const privacy = schema?.$defs?.evidenceRecord?.properties?.privacyBoundary?.properties;
  const commitments = schema?.$defs?.evidenceRecord?.properties?.commitments?.properties;

  if (!schema) return errors;
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push('schema-draft-mismatch');
  if (!schema.$id?.includes('playlist-commerce-webhook-evidence-v0.1.schema.json')) errors.push('schema-id-mismatch');
  if (schema.properties?.artifact?.const !== 'playlist-commerce-webhook-evidence-fixture') errors.push('schema-artifact-const-missing');
  if (schema.properties?.version?.const !== 'v0.1') errors.push('schema-version-const-missing');
  if (schema.properties?.source?.properties?.safeCommand?.const !== 'npm run verify:playlist-commerce') {
    errors.push('schema-safe-command-const-missing');
  }
  if (schema.properties?.source?.properties?.localOnly?.const !== true) errors.push('schema-local-only-const-missing');
  if (schema.properties?.source?.properties?.managedServiceBoundary?.const !== 'fixture-only-not-hosted-evidence-vault') {
    errors.push('schema-managed-boundary-const-missing');
  }
  if (schema.properties?.summary?.properties?.allRecordsRedacted?.const !== true) errors.push('schema-redaction-summary-const-missing');
  if (schema.$defs?.evidenceRef?.pattern !== '^pc_webhook_preflight_evidence_[0-9]{3}$') {
    errors.push('schema-evidence-ref-pattern-missing');
  }
  if (commitments?.requestCommitmentRef?.pattern !== '^pc_req_[a-f0-9]{8}$') {
    errors.push('schema-request-commitment-pattern-missing');
  }
  if (commitments?.responseCommitmentRef?.pattern !== '^pc_res_[a-f0-9]{8}$') {
    errors.push('schema-response-commitment-pattern-missing');
  }
  if (commitments?.checkCommitmentRef?.pattern !== '^pc_chk_[a-f0-9]{8}$') {
    errors.push('schema-check-commitment-pattern-missing');
  }
  if (
    privacy?.rawPayloadStored?.const !== false ||
    privacy?.signatureStored?.const !== false ||
    privacy?.secretMaterialStored?.const !== false ||
    privacy?.rawAddressStored?.const !== false ||
    privacy?.proofWitnessStored?.const !== false ||
    privacy?.recipientContactStored?.const !== false
  ) {
    errors.push('schema-privacy-redaction-consts-missing');
  }

  return errors;
}

function validateOpenApiEvidenceExtensionSchema(schema: JsonSchemaSubset | undefined) {
  const errors: string[] = [];

  if (!schema) return errors;
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push('openapi-extension-schema-draft-mismatch');
  if (!schema.$id?.includes('agid-openapi-evidence-extension-v0.1.schema.json')) {
    errors.push('openapi-extension-schema-id-mismatch');
  }
  if (schema.properties?.preflightFixture?.pattern !== '^docs/specs/fixtures/.+\\.json$') {
    errors.push('openapi-extension-schema-preflight-fixture-pattern-missing');
  }
  if (schema.properties?.historyFixture?.pattern !== '^docs/specs/fixtures/.+\\.json$') {
    errors.push('openapi-extension-schema-history-fixture-pattern-missing');
  }
  if (schema.properties?.evidenceFixture?.pattern !== '^docs/specs/fixtures/.+\\.json$') {
    errors.push('openapi-extension-schema-evidence-fixture-pattern-missing');
  }
  if (schema.properties?.evidenceSchema?.pattern !== '^docs/specs/schemas/.+\\.schema\\.json$') {
    errors.push('openapi-extension-schema-evidence-schema-pattern-missing');
  }
  if (schema.properties?.verifierCommand?.pattern !== '^npm run verify:[a-z0-9:-]+$') {
    errors.push('openapi-extension-schema-verifier-command-pattern-missing');
  }
  if (schema.properties?.aggregateVerifierCommand?.pattern !== '^npm run verify:[a-z0-9:-]+$') {
    errors.push('openapi-extension-schema-aggregate-verifier-command-pattern-missing');
  }
  if (schema.properties?.managedServiceBoundary?.pattern !== '^[a-z0-9-]+$') {
    errors.push('openapi-extension-schema-managed-boundary-pattern-missing');
  }
  if (schema.properties?.localOnly?.const !== true) errors.push('openapi-extension-schema-local-only-const-missing');

  return errors;
}

function validatePlaylistCommerceOpenApiEvidenceExtensionProfileSchema(schema: JsonSchemaSubset | undefined) {
  const errors: string[] = [];

  if (!schema) return errors;
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    errors.push('playlist-openapi-extension-profile-schema-draft-mismatch');
  }
  if (!schema.$id?.includes('playlist-commerce-openapi-evidence-extension-v0.1.schema.json')) {
    errors.push('playlist-openapi-extension-profile-schema-id-mismatch');
  }
  if (schema.properties?.preflightFixture?.const !== toSpecPath(PREFLIGHT_FIXTURE_PATH)) {
    errors.push('playlist-openapi-extension-profile-preflight-fixture-const-missing');
  }
  if (schema.properties?.historyFixture?.const !== toSpecPath(HISTORY_FIXTURE_PATH)) {
    errors.push('playlist-openapi-extension-profile-history-fixture-const-missing');
  }
  if (schema.properties?.evidenceFixture?.const !== toSpecPath(EVIDENCE_FIXTURE_PATH)) {
    errors.push('playlist-openapi-extension-profile-evidence-fixture-const-missing');
  }
  if (schema.properties?.evidenceSchema?.const !== toSpecPath(EVIDENCE_SCHEMA_PATH)) {
    errors.push('playlist-openapi-extension-profile-evidence-schema-const-missing');
  }
  if (schema.properties?.verifierCommand?.const !== 'npm run verify:playlist-commerce-evidence') {
    errors.push('playlist-openapi-extension-profile-verifier-command-const-missing');
  }
  if (schema.properties?.aggregateVerifierCommand?.const !== 'npm run verify:playlist-commerce') {
    errors.push('playlist-openapi-extension-profile-aggregate-verifier-command-const-missing');
  }
  if (schema.properties?.managedServiceBoundary?.const !== 'fixture-only-not-hosted-evidence-vault') {
    errors.push('playlist-openapi-extension-profile-managed-boundary-const-missing');
  }
  if (schema.properties?.localOnly?.const !== true) {
    errors.push('playlist-openapi-extension-profile-local-only-const-missing');
  }

  return errors;
}

function validateOpenApiEvidenceExtension(
  openApi: PlaylistCommerceWebhookOpenApi | undefined,
  extensionSchema: JsonSchemaSubset | undefined,
  profileSchema: JsonSchemaSubset | undefined,
  requiredNonClaims: string[],
) {
  const errors: string[] = [];
  const operation = openApi?.paths?.['/webhooks/playlist-commerce']?.post;
  const extension = operation?.['x-agid-evidence-fixtures'];
  const requiredForbiddenMaterial = [
    'raw_address',
    'recipient_phone',
    'provider_token',
    'raw_provider_profile',
    'raw_carrier_payload',
    'proof_witness',
    'private_key',
    'biometric_template',
    'production_webhook_secret',
  ];

  if (!openApi) return errors;
  if (openApi.externalDocs?.url !== './README.md#playlist-commerce-webhook-evidence') {
    errors.push('openapi-root-external-docs-mismatch');
  }
  if (operation?.externalDocs?.url !== './README.md#playlist-commerce-webhook-evidence') {
    errors.push('openapi-operation-external-docs-mismatch');
  }
  if (!extension) {
    errors.push('openapi-evidence-fixtures-extension-missing');
    return errors;
  }
  if (extensionSchema) {
    errors.push(...validateJsonWithSchemaSubset(extension, extensionSchema).map(error => (
      `openapi-extension-schema-conformance:${error}`
    )));
  }
  if (profileSchema) {
    errors.push(...validateJsonWithSchemaSubset(extension, profileSchema).map(error => (
      `playlist-openapi-extension-profile-conformance:${error}`
    )));
  }
  if (extension.preflightFixture !== toSpecPath(PREFLIGHT_FIXTURE_PATH)) errors.push('openapi-preflight-fixture-mismatch');
  if (extension.historyFixture !== toSpecPath(HISTORY_FIXTURE_PATH)) errors.push('openapi-history-fixture-mismatch');
  if (extension.evidenceFixture !== toSpecPath(EVIDENCE_FIXTURE_PATH)) errors.push('openapi-evidence-fixture-mismatch');
  if (extension.evidenceSchema !== toSpecPath(EVIDENCE_SCHEMA_PATH)) errors.push('openapi-evidence-schema-mismatch');
  if (extension.verifierCommand !== 'npm run verify:playlist-commerce-evidence') errors.push('openapi-verifier-command-mismatch');
  if (extension.aggregateVerifierCommand !== 'npm run verify:playlist-commerce') errors.push('openapi-aggregate-verifier-command-mismatch');
  if (extension.managedServiceBoundary !== 'fixture-only-not-hosted-evidence-vault') {
    errors.push('openapi-managed-boundary-mismatch');
  }
  if (extension.localOnly !== true) errors.push('openapi-local-only-mismatch');
  if (!hasAllNonClaims(extension.nonClaims, requiredNonClaims)) errors.push('openapi-non-claims-incomplete');
  if (!requiredForbiddenMaterial.every(item => extension.forbiddenMaterial?.includes(item))) {
    errors.push('openapi-forbidden-material-incomplete');
  }

  return errors;
}

export function verifyPlaylistCommerceWebhookEvidence(root = process.cwd()): PlaylistCommerceWebhookEvidenceCheckResult {
  const evidenceFixturePath = join(root, EVIDENCE_FIXTURE_PATH);
  const historyFixturePath = join(root, HISTORY_FIXTURE_PATH);
  const schemaPath = join(root, EVIDENCE_SCHEMA_PATH);
  const openApiPath = join(root, OPENAPI_PATH);
  const openApiExtensionSchemaPath = join(root, OPENAPI_EVIDENCE_EXTENSION_SCHEMA_PATH);
  const playlistCommerceOpenApiExtensionProfileSchemaPath = join(
    root,
    PLAYLIST_COMMERCE_OPENAPI_EVIDENCE_EXTENSION_PROFILE_SCHEMA_PATH,
  );
  const evidenceRead = readJson<EvidenceArtifact>(evidenceFixturePath);
  const historyRead = readJson<HistoryArtifact>(historyFixturePath);
  const schemaRead = readJson<EvidenceSchema>(schemaPath);
  const openApiExtensionSchemaRead = readJson<JsonSchemaSubset>(openApiExtensionSchemaPath);
  const playlistCommerceOpenApiExtensionProfileSchemaRead = readJson<JsonSchemaSubset>(
    playlistCommerceOpenApiExtensionProfileSchemaPath,
  );
  const openApiRead = readYaml<PlaylistCommerceWebhookOpenApi>(openApiPath);
  const errors = [
    ...evidenceRead.errors,
    ...historyRead.errors,
    ...schemaRead.errors,
    ...openApiExtensionSchemaRead.errors,
    ...playlistCommerceOpenApiExtensionProfileSchemaRead.errors,
    ...openApiRead.errors,
  ];
  const evidence = evidenceRead.value;
  const history = historyRead.value;
  const schema = schemaRead.value;
  const openApiExtensionSchema = openApiExtensionSchemaRead.value;
  const playlistCommerceOpenApiExtensionProfileSchema = playlistCommerceOpenApiExtensionProfileSchemaRead.value;
  const openApi = openApiRead.value;
  const records = evidence?.records ?? [];
  const historyRuns = history?.runs ?? [];
  const historyByEvidenceRef = new Map(historyRuns.map(run => [run.evidenceRef ?? '', run]));
  const requiredNonClaims = [
    'not-payment-settlement',
    'not-raw-address-intake',
    'not-proof-witness-intake',
    'not-provider-token-intake',
    'not-raw-carrier-payload-intake',
    'not-production-delivery-attempt',
  ];

  errors.push(...validateEvidenceSchema(schema));
  errors.push(...validateOpenApiEvidenceExtensionSchema(openApiExtensionSchema));
  errors.push(...validatePlaylistCommerceOpenApiEvidenceExtensionProfileSchema(
    playlistCommerceOpenApiExtensionProfileSchema,
  ));
  errors.push(...validateOpenApiEvidenceExtension(
    openApi,
    openApiExtensionSchema,
    playlistCommerceOpenApiExtensionProfileSchema,
    requiredNonClaims,
  ));
  if (schema && evidence) {
    errors.push(...validateJsonWithSchemaSubset(evidence, schema as JsonSchemaSubset).map(error => `schema-conformance:${error}`));
  }

  if (evidence) {
    if (evidence.artifact !== 'playlist-commerce-webhook-evidence-fixture') errors.push('invalid-artifact');
    if (evidence.version !== 'v0.1') errors.push('invalid-version');
    if (evidence.source?.historyFixture !== HISTORY_FIXTURE_PATH) errors.push('history-fixture-path-mismatch');
    if (evidence.source?.safeCommand !== 'npm run verify:playlist-commerce') errors.push('unsafe-command');
    if (evidence.source?.localOnly !== true) errors.push('not-local-only');
    if (evidence.source?.managedServiceBoundary !== 'fixture-only-not-hosted-evidence-vault') {
      errors.push('managed-service-boundary-mismatch');
    }
    if (evidence.summary?.totalRecords !== records.length) errors.push('summary-total-records-mismatch');
    if (evidence.summary?.linkedHistoryRuns !== historyRuns.length) errors.push('linked-history-runs-mismatch');
    if (evidence.summary?.latestEvidenceRef !== history?.summary?.latestEvidenceRef) errors.push('latest-evidence-ref-mismatch');
    if (evidence.summary?.allRecordsRedacted !== records.every(isRedacted)) errors.push('redaction-summary-mismatch');
    if (records.length !== historyRuns.length) errors.push('evidence-history-cardinality-mismatch');
    if (!records.some(record => record.evidenceRef === evidence.summary?.latestEvidenceRef)) {
      errors.push('latest-evidence-record-missing');
    }
    if (!historyRuns.every(run => records.some(record => record.evidenceRef === run.evidenceRef))) {
      errors.push('history-run-without-evidence-record');
    }
    for (const material of [
      'production_webhook_secret',
      'provider_token',
      'raw_carrier_payload',
    ]) {
      if (!evidence.forbiddenMaterial?.includes(material)) errors.push(`missing-forbidden-material:${material}`);
    }
    if (!hasAllNonClaims(evidence.nonClaims, requiredNonClaims)) errors.push('artifact-non-claims-incomplete');
    if (new Set(records.map(record => record.evidenceRef)).size !== records.length) errors.push('duplicate-evidence-ref');
    if (new Set(records.map(record => record.vaultRecordRef)).size !== records.length) errors.push('duplicate-vault-record-ref');
    if (new Set(records.map(record => record.commitments?.requestCommitmentRef)).size !== records.length) {
      errors.push('request-commitments-not-record-specific');
    }
    records.flatMap(record => validateEvidenceRecord(record, historyByEvidenceRef)).forEach(error => errors.push(error));
  }

  if (history) {
    if (history.artifact !== 'playlist-commerce-webhook-preflight-history-fixture') errors.push('invalid-history-artifact');
    if (history.version !== 'v0.1') errors.push('invalid-history-version');
    if (history.summary?.totalRuns !== historyRuns.length) errors.push('history-total-runs-mismatch');
    if (!hasAllNonClaims(history.privacyBoundary?.nonClaims, requiredNonClaims)) errors.push('history-non-claims-incomplete');
  }

  if (/playlist-commerce-synthetic-ping-secret/.test(evidenceRead.text)) errors.push('synthetic-secret-leaked');
  if (/x-playlist-signature/.test(evidenceRead.text)) errors.push('signature-header-leaked');
  if (/order_alias_pc_synthetic_ping_001|wallet_subject_alias_pc_ping/.test(evidenceRead.text)) {
    errors.push('alias-payload-leaked');
  }

  return {
    ok: errors.length === 0,
    evidenceFixturePath,
    historyFixturePath,
    schemaPath,
    openApiPath,
    openApiExtensionSchemaPath,
    playlistCommerceOpenApiExtensionProfileSchemaPath,
    errors,
    summary: {
      totalRecords: records.length,
      linkedHistoryRuns: historyRuns.length,
      latestEvidenceRef: evidence?.summary?.latestEvidenceRef ?? '',
      managedServiceBoundary: evidence?.source?.managedServiceBoundary ?? '',
    },
  };
}

function main() {
  const result = verifyPlaylistCommerceWebhookEvidence();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main();
}
