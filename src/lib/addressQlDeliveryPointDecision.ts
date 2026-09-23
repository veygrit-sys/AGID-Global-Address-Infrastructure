import {
  createHash,
  createPublicKey,
  verify,
  type KeyObject,
} from 'node:crypto';
import {
  readFileSync,
  statSync,
} from 'node:fs';
import { resolve } from 'node:path';

export const ADDRESSQL_CARRIER_TRUST_STORE_VERSION =
  'addressql-carrier-trust-store-v1';
export const ADDRESSQL_L5_CARRIER_ASSERTION_VERSION =
  'addressql-l5-carrier-assertion-v1';
export const ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION =
  'addressql-l5-delivery-point-request-v1';
export const ADDRESSQL_L5_DELIVERY_POINT_DECISION_VERSION =
  'addressql-l5-delivery-point-decision-v1';

export const ADDRESSQL_L5_MAX_ASSERTIONS = 10;
export const ADDRESSQL_L5_MAX_ASSERTION_LIFETIME_MS = 24 * 60 * 60 * 1000;

export type AddressQlCarrierKeyStatus = 'active' | 'revoked' | 'rotated';
export type AddressQlCarrierDecision = 'reachable' | 'unreachable' | 'unknown';

export type AddressQlCarrierTrustRecord = {
  carrierId: string;
  countryCodes: string[];
  publicKey: string;
  status: AddressQlCarrierKeyStatus;
  validFrom: string;
  validUntil: string;
};

export type AddressQlCarrierTrustStore = {
  version: typeof ADDRESSQL_CARRIER_TRUST_STORE_VERSION;
  keys: Record<string, AddressQlCarrierTrustRecord>;
};

export type AddressQlL5CarrierAssertion = {
  version: typeof ADDRESSQL_L5_CARRIER_ASSERTION_VERSION;
  assertionId: string;
  carrierId: string;
  keyId: string;
  countryCode: string;
  deliveryPointCommitment: string;
  serviceLevel: string;
  decision: AddressQlCarrierDecision;
  sourceVersion: string;
  evidenceDigest: string;
  assessedAt: string;
  expiresAt: string;
  signature: string;
};

export type AddressQlL5DeliveryPointRequest = {
  version: typeof ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION;
  countryCode: string;
  deliveryPointCommitment: string;
  serviceLevel: string;
  assertions: AddressQlL5CarrierAssertion[];
};

export type AddressQlL5DeliveryPointDecision = {
  version: typeof ADDRESSQL_L5_DELIVERY_POINT_DECISION_VERSION;
  level: 'L5';
  scope: 'delivery-point';
  status: 'pass' | 'fail' | 'unknown' | 'conflict';
  decision: AddressQlCarrierDecision | 'conflict';
  processingDirective:
    | 'continue'
    | 'stop_unreachable'
    | 'stop_unknown'
    | 'stop_conflict';
  stopProcessing: boolean;
  signatureVerified: true;
  verifiedCarrierCount: number;
  carrierIds: string[];
  sourceRefs: string[];
  boundaries: {
    l4DeliveryAreaNotEvaluated: true;
    l4PassDoesNotImplyL5: true;
    l5DoesNotImplyIdentityOrResidence: true;
  };
  privacy: {
    acceptsRawAddress: false;
    containsRawAddress: false;
    reflectsCommitment: false;
    storesCommitment: false;
    logsCommitment: false;
  };
  nonClaims: string[];
};

export type AddressQlDeliveryPointVerifier = {
  trustedKeyCount: number;
  trustedCarrierCount: number;
  countryCodes: string[];
  assess: (input: unknown) => AddressQlL5DeliveryPointDecision;
};

type LoadedCarrierKey = {
  keyId: string;
  record: AddressQlCarrierTrustRecord;
  publicKey: KeyObject;
  validFrom: number;
  validUntil: number;
};

type AddressQlDeliveryPointClockValue = string | number | Date;

const MAX_TRUST_STORE_BYTES = 512 * 1024;
const TECHNICAL_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const COUNTRY_CODE = /^[A-Z]{2}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const BASE64_SIGNATURE = /^[A-Za-z0-9+/]+={0,2}$/;
const TRUST_STORE_FIELDS = new Set(['version', 'keys']);
const TRUST_RECORD_FIELDS = new Set([
  'carrierId',
  'countryCodes',
  'publicKey',
  'status',
  'validFrom',
  'validUntil',
]);
const REQUEST_FIELDS = new Set([
  'version',
  'countryCode',
  'deliveryPointCommitment',
  'serviceLevel',
  'assertions',
]);

function deliveryPointEvaluationTime(
  clock?: AddressQlDeliveryPointClockValue
    | (() => AddressQlDeliveryPointClockValue),
) {
  const value = typeof clock === 'function' ? clock() : clock ?? Date.now();
  const now = new Date(value).getTime();
  if (!Number.isFinite(now)) {
    throw new Error('delivery point verifier time is invalid');
  }
  return now;
}
const ASSERTION_FIELDS = new Set([
  'version',
  'assertionId',
  'carrierId',
  'keyId',
  'countryCode',
  'deliveryPointCommitment',
  'serviceLevel',
  'decision',
  'sourceVersion',
  'evidenceDigest',
  'assessedAt',
  'expiresAt',
  'signature',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertFields(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string,
) {
  const unknown = Object.keys(value).filter(field => !allowed.has(field));
  if (unknown.length) {
    throw new Error(`${label} contains unsupported fields: ${unknown.sort().join(', ')}`);
  }
}

function requiredString(
  value: Record<string, unknown>,
  field: string,
  label: string,
) {
  const output = value[field];
  if (typeof output !== 'string' || !output.trim()) {
    throw new Error(`${label}.${field} must be a non-empty string`);
  }
  return output;
}

function exactTimestamp(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${label} must be an exact UTC timestamp`);
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${label} is invalid`);
  return timestamp;
}

function readBoundedJson(path: string) {
  const absolutePath = resolve(path);
  const stats = statSync(absolutePath);
  if (!stats.isFile() || stats.size <= 0 || stats.size > MAX_TRUST_STORE_BYTES) {
    throw new Error('carrier trust store must be a bounded regular file');
  }
  const parsed = JSON.parse(readFileSync(absolutePath, 'utf8')) as unknown;
  if (!isRecord(parsed)) throw new Error('carrier trust store must be a JSON object');
  return parsed;
}

function publicKeyFingerprint(key: KeyObject) {
  return createHash('sha256')
    .update(key.export({ type: 'spki', format: 'der' }))
    .digest('hex');
}

function parsePublicKey(keyId: string, value: string) {
  if (/PRIVATE KEY/.test(value)) {
    throw new Error('carrier trust store must not contain private keys');
  }
  const key = createPublicKey(value);
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new Error(`carrier key ${keyId} must be Ed25519`);
  }
  return key;
}

function loadCarrierKeys(
  path: string,
  now: number,
) {
  const parsed = readBoundedJson(path);
  assertFields(parsed, TRUST_STORE_FIELDS, 'carrier trust store');
  if (parsed.version !== ADDRESSQL_CARRIER_TRUST_STORE_VERSION) {
    throw new Error('carrier trust store version is unsupported');
  }
  if (!isRecord(parsed.keys)) throw new Error('carrier trust store keys must be an object');

  const loaded = new Map<string, LoadedCarrierKey>();
  const fingerprints = new Map<string, string>();
  for (const [keyId, value] of Object.entries(parsed.keys)) {
    if (!TECHNICAL_ID.test(keyId) || !isRecord(value)) {
      throw new Error(`carrier trust record ${keyId} is invalid`);
    }
    assertFields(value, TRUST_RECORD_FIELDS, `carrier trust record ${keyId}`);
    const carrierId = requiredString(value, 'carrierId', keyId);
    const publicKeyText = requiredString(value, 'publicKey', keyId);
    const status = requiredString(value, 'status', keyId);
    const validFromText = requiredString(value, 'validFrom', keyId);
    const validUntilText = requiredString(value, 'validUntil', keyId);
    if (!TECHNICAL_ID.test(carrierId)) {
      throw new Error(`carrier trust record ${keyId} has an invalid carrier id`);
    }
    if (!['active', 'revoked', 'rotated'].includes(status)) {
      throw new Error(`carrier trust record ${keyId} has an invalid status`);
    }
    if (
      !Array.isArray(value.countryCodes)
      || !value.countryCodes.length
      || value.countryCodes.some(code =>
        typeof code !== 'string' || !COUNTRY_CODE.test(code))
      || new Set(value.countryCodes).size !== value.countryCodes.length
    ) {
      throw new Error(`carrier trust record ${keyId} has invalid country scopes`);
    }
    const validFrom = exactTimestamp(validFromText, `${keyId}.validFrom`);
    const validUntil = exactTimestamp(validUntilText, `${keyId}.validUntil`);
    if (validUntil <= validFrom) {
      throw new Error(`carrier trust record ${keyId} has an invalid validity window`);
    }
    const publicKey = parsePublicKey(keyId, publicKeyText);
    const fingerprint = publicKeyFingerprint(publicKey);
    if (fingerprints.has(fingerprint)) {
      throw new Error('one carrier public key cannot be registered more than once');
    }
    fingerprints.set(fingerprint, keyId);
    if (status !== 'active' || now < validFrom || now > validUntil) continue;
    loaded.set(keyId, {
      keyId,
      publicKey,
      validFrom,
      validUntil,
      record: {
        carrierId,
        countryCodes: [...value.countryCodes] as string[],
        publicKey: publicKey.export({
          type: 'spki',
          format: 'pem',
        }).toString(),
        status: status as AddressQlCarrierKeyStatus,
        validFrom: validFromText,
        validUntil: validUntilText,
      },
    });
  }
  return loaded;
}

function parseAssertion(value: unknown, index: number): AddressQlL5CarrierAssertion {
  const label = `delivery point assertions[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertFields(value, ASSERTION_FIELDS, label);
  const assertion = {
    version: requiredString(value, 'version', label),
    assertionId: requiredString(value, 'assertionId', label),
    carrierId: requiredString(value, 'carrierId', label),
    keyId: requiredString(value, 'keyId', label),
    countryCode: requiredString(value, 'countryCode', label),
    deliveryPointCommitment:
      requiredString(value, 'deliveryPointCommitment', label),
    serviceLevel: requiredString(value, 'serviceLevel', label),
    decision: requiredString(value, 'decision', label),
    sourceVersion: requiredString(value, 'sourceVersion', label),
    evidenceDigest: requiredString(value, 'evidenceDigest', label),
    assessedAt: requiredString(value, 'assessedAt', label),
    expiresAt: requiredString(value, 'expiresAt', label),
    signature: requiredString(value, 'signature', label),
  };
  if (
    assertion.version !== ADDRESSQL_L5_CARRIER_ASSERTION_VERSION
    || !TECHNICAL_ID.test(assertion.assertionId)
    || !TECHNICAL_ID.test(assertion.carrierId)
    || !TECHNICAL_ID.test(assertion.keyId)
    || !COUNTRY_CODE.test(assertion.countryCode)
    || !DIGEST.test(assertion.deliveryPointCommitment)
    || !TECHNICAL_ID.test(assertion.serviceLevel)
    || !['reachable', 'unreachable', 'unknown'].includes(assertion.decision)
    || !TECHNICAL_ID.test(assertion.sourceVersion)
    || !DIGEST.test(assertion.evidenceDigest)
    || !BASE64_SIGNATURE.test(assertion.signature)
    || Buffer.from(assertion.signature, 'base64').length !== 64
  ) {
    throw new Error(`${label} has an invalid signed assertion shape`);
  }
  return assertion as AddressQlL5CarrierAssertion;
}

function parseRequest(value: unknown): AddressQlL5DeliveryPointRequest {
  if (!isRecord(value)) throw new Error('delivery point request must be an object');
  assertFields(value, REQUEST_FIELDS, 'delivery point request');
  const version = requiredString(value, 'version', 'delivery point request');
  const countryCode = requiredString(value, 'countryCode', 'delivery point request');
  const deliveryPointCommitment = requiredString(
    value,
    'deliveryPointCommitment',
    'delivery point request',
  );
  const serviceLevel = requiredString(value, 'serviceLevel', 'delivery point request');
  if (
    version !== ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION
    || !COUNTRY_CODE.test(countryCode)
    || !DIGEST.test(deliveryPointCommitment)
    || !TECHNICAL_ID.test(serviceLevel)
  ) {
    throw new Error('delivery point request has an invalid contract shape');
  }
  if (
    !Array.isArray(value.assertions)
    || value.assertions.length < 1
    || value.assertions.length > ADDRESSQL_L5_MAX_ASSERTIONS
  ) {
    throw new Error(`delivery point request requires 1-${ADDRESSQL_L5_MAX_ASSERTIONS} assertions`);
  }
  return {
    version: ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION,
    countryCode,
    deliveryPointCommitment,
    serviceLevel,
    assertions: value.assertions.map(parseAssertion),
  };
}

export function buildAddressQlL5CarrierAssertionPayload(
  assertion: Omit<AddressQlL5CarrierAssertion, 'signature'>,
) {
  if (
    assertion.version !== ADDRESSQL_L5_CARRIER_ASSERTION_VERSION
    || !TECHNICAL_ID.test(assertion.assertionId)
    || !TECHNICAL_ID.test(assertion.carrierId)
    || !TECHNICAL_ID.test(assertion.keyId)
    || !COUNTRY_CODE.test(assertion.countryCode)
    || !DIGEST.test(assertion.deliveryPointCommitment)
    || !TECHNICAL_ID.test(assertion.serviceLevel)
    || !['reachable', 'unreachable', 'unknown'].includes(assertion.decision)
    || !TECHNICAL_ID.test(assertion.sourceVersion)
    || !DIGEST.test(assertion.evidenceDigest)
  ) {
    throw new Error('carrier assertion payload has an invalid contract shape');
  }
  const assessedAt = exactTimestamp(assertion.assessedAt, 'assertion.assessedAt');
  const expiresAt = exactTimestamp(assertion.expiresAt, 'assertion.expiresAt');
  if (
    expiresAt <= assessedAt
    || expiresAt - assessedAt > ADDRESSQL_L5_MAX_ASSERTION_LIFETIME_MS
  ) {
    throw new Error('carrier assertion payload has an invalid validity window');
  }
  return JSON.stringify({
    version: assertion.version,
    assertionId: assertion.assertionId,
    carrierId: assertion.carrierId,
    keyId: assertion.keyId,
    countryCode: assertion.countryCode,
    deliveryPointCommitment: assertion.deliveryPointCommitment,
    serviceLevel: assertion.serviceLevel,
    decision: assertion.decision,
    sourceVersion: assertion.sourceVersion,
    evidenceDigest: assertion.evidenceDigest,
    assessedAt: assertion.assessedAt,
    expiresAt: assertion.expiresAt,
  });
}

export function mergeAddressQlCarrierDecisions(
  values: readonly AddressQlCarrierDecision[],
): Pick<
  AddressQlL5DeliveryPointDecision,
  'status' | 'decision' | 'processingDirective' | 'stopProcessing'
> {
  const decisions = new Set(values);
  if (!decisions.size) throw new Error('at least one carrier decision is required');
  if (decisions.size !== 1) {
    return {
      status: 'conflict',
      decision: 'conflict',
      processingDirective: 'stop_conflict',
      stopProcessing: true,
    };
  }
  const [decision] = decisions;
  if (decision === 'reachable') {
    return {
      status: 'pass',
      decision,
      processingDirective: 'continue',
      stopProcessing: false,
    };
  }
  if (decision === 'unreachable') {
    return {
      status: 'fail',
      decision,
      processingDirective: 'stop_unreachable',
      stopProcessing: true,
    };
  }
  return {
    status: 'unknown',
    decision,
    processingDirective: 'stop_unknown',
    stopProcessing: true,
  };
}

export function loadAddressQlDeliveryPointVerifier(
  trustStorePath: string,
  options: {
    now?: AddressQlDeliveryPointClockValue
      | (() => AddressQlDeliveryPointClockValue);
  } = {},
): AddressQlDeliveryPointVerifier {
  const keys = loadCarrierKeys(
    trustStorePath,
    deliveryPointEvaluationTime(options.now),
  );
  if (!keys.size) {
    throw new Error('carrier trust store has no active keys for the evaluation time');
  }
  const carriers = new Set([...keys.values()].map(key => key.record.carrierId));
  const countryCodes = [...new Set(
    [...keys.values()].flatMap(key => key.record.countryCodes),
  )].sort();

  return {
    trustedKeyCount: keys.size,
    trustedCarrierCount: carriers.size,
    countryCodes,
    assess(input) {
      const now = deliveryPointEvaluationTime(options.now);
      const request = parseRequest(input);
      const carrierIds = new Set<string>();
      const assertionIds = new Set<string>();
      const sourceRefs: string[] = [];
      const decisions = new Set<AddressQlCarrierDecision>();

      for (const assertion of request.assertions) {
        if (assertionIds.has(assertion.assertionId)) {
          throw new Error('delivery point request has duplicate assertion ids');
        }
        assertionIds.add(assertion.assertionId);
        if (
          assertion.countryCode !== request.countryCode
          || assertion.deliveryPointCommitment !== request.deliveryPointCommitment
          || assertion.serviceLevel !== request.serviceLevel
        ) {
          throw new Error('carrier assertion does not match the L5 request scope');
        }
        const trusted = keys.get(assertion.keyId);
        if (
          !trusted
          || trusted.record.carrierId !== assertion.carrierId
          || !trusted.record.countryCodes.includes(assertion.countryCode)
        ) {
          throw new Error(`carrier assertion ${assertion.assertionId} is not trusted for this scope`);
        }
        if (carrierIds.has(assertion.carrierId)) {
          throw new Error('delivery point request must contain at most one assertion per carrier');
        }
        const assessedAt = exactTimestamp(
          assertion.assessedAt,
          `${assertion.assertionId}.assessedAt`,
        );
        const expiresAt = exactTimestamp(
          assertion.expiresAt,
          `${assertion.assertionId}.expiresAt`,
        );
        if (
          assessedAt > now
          || expiresAt <= now
          || expiresAt <= assessedAt
          || expiresAt - assessedAt > ADDRESSQL_L5_MAX_ASSERTION_LIFETIME_MS
          || assessedAt < trusted.validFrom
          || expiresAt > trusted.validUntil
        ) {
          throw new Error(`carrier assertion ${assertion.assertionId} is stale or outside key validity`);
        }
        const { signature, ...unsigned } = assertion;
        if (!verify(
          null,
          Buffer.from(buildAddressQlL5CarrierAssertionPayload(unsigned), 'utf8'),
          trusted.publicKey,
          Buffer.from(signature, 'base64'),
        )) {
          throw new Error(`carrier assertion ${assertion.assertionId} signature is invalid`);
        }
        carrierIds.add(assertion.carrierId);
        decisions.add(assertion.decision);
        sourceRefs.push(
          `carrier:${assertion.carrierId}`,
          `carrier-key:${assertion.keyId}`,
          `carrier-source:${assertion.carrierId}@${assertion.sourceVersion}`,
          `carrier-evidence:${assertion.evidenceDigest}`,
        );
      }

      return {
        version: ADDRESSQL_L5_DELIVERY_POINT_DECISION_VERSION,
        level: 'L5',
        scope: 'delivery-point',
        ...mergeAddressQlCarrierDecisions([...decisions]),
        signatureVerified: true,
        verifiedCarrierCount: carrierIds.size,
        carrierIds: [...carrierIds].sort(),
        sourceRefs: [...new Set(sourceRefs)].sort(),
        boundaries: {
          l4DeliveryAreaNotEvaluated: true,
          l4PassDoesNotImplyL5: true,
          l5DoesNotImplyIdentityOrResidence: true,
        },
        privacy: {
          acceptsRawAddress: false,
          containsRawAddress: false,
          reflectsCommitment: false,
          storesCommitment: false,
          logsCommitment: false,
        },
        nonClaims: [
          'An L5 carrier decision does not evaluate or replace L4 delivery-area coverage.',
          'A reachable result is scoped to the signed carrier, service level, source version, and validity window.',
          'A delivery-point commitment is not proof of identity, residence, recipient authorization, or delivery completion.',
          'Use a high-entropy client-side salt because unsalted address commitments can be linkable or guessable.',
        ],
      };
    },
  };
}
