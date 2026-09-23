import { isValidAGIDFormat, normalizeAGIDInput, validatePublicAgidPayload } from './agidSecurity';
import { isAOIDLinkedToAGID, isValidAOIDId } from './aoid';
import { sha256Hex } from './sha256';

export type AgidAoidLayer = 'AGID' | 'AOID';
export type AgidAoidOperation =
  | 'communicate'
  | 'register'
  | 'sync'
  | 'qr-build'
  | 'qr-parse'
  | 'revoke'
  | 'rotate';
export type AgidAoidSurface =
  | 'local-device'
  | 'public-api'
  | 'public-qr'
  | 'private-qr'
  | 'encrypted-sync'
  | 'event-stream'
  | 'sdk'
  | 'openapi';

export type AgidAoidPayloadClass =
  | 'public-agid-reference'
  | 'public-agid-evidence'
  | 'aoid-public-reference'
  | 'aoid-private-plaintext'
  | 'aoid-encrypted-envelope'
  | 'empty'
  | 'unknown';

export type AgidAoidGovernanceDecision = {
  modelVersion: string;
  layer: AgidAoidLayer;
  operation: AgidAoidOperation;
  surface: AgidAoidSurface;
  allowed: boolean;
  payloadClass: AgidAoidPayloadClass;
  privacy: 'public' | 'private-redacted' | 'private-local';
  requiresOwnerConsent: boolean;
  requiresEncryption: boolean;
  requiresLocalOnly: boolean;
  forbiddenFields: string[];
  warnings: string[];
  cachePolicy: string;
};

export type AgidAoidAuditEvent = {
  id: string;
  modelVersion: string;
  layer: AgidAoidLayer;
  operation: AgidAoidOperation;
  surface: AgidAoidSurface;
  entityId?: string;
  agid?: string;
  publicHandle?: string;
  payloadClass: AgidAoidPayloadClass;
  privacy: AgidAoidGovernanceDecision['privacy'];
  outcome: 'allowed' | 'blocked';
  forbiddenFields: string[];
  warnings: string[];
  payloadFingerprint: string;
  createdAt: number;
};

export const AGID_AOID_GOVERNANCE_MODEL_VERSION = 'agid-aoid-governance-v1';

export const AGID_AOID_GOVERNANCE_MODEL = {
  version: AGID_AOID_GOVERNANCE_MODEL_VERSION,
  communication: {
    AGID: {
      defaultSurface: 'public-api',
      allowedSurfaces: ['local-device', 'public-api', 'public-qr', 'event-stream', 'sdk', 'openapi'],
      allowedPayloadClasses: ['public-agid-reference', 'public-agid-evidence', 'empty'],
      forbidden: ['recipient', 'phone', 'unit', 'room', 'accessInstructions', 'deliveryInstructions'],
      cachePolicy: 'public evidence may be cached by request or versioned data pack',
    },
    AOID: {
      defaultSurface: 'local-device',
      allowedSurfaces: ['local-device', 'private-qr', 'public-qr', 'encrypted-sync'],
      allowedPayloadClasses: ['aoid-public-reference', 'aoid-encrypted-envelope', 'empty'],
      forbiddenPlaintextNetworkFields: ['recipient', 'phone', 'room', 'lat', 'lon', 'deliveryInstructions'],
      cachePolicy: 'no plaintext public cache; encrypted sync envelopes only with owner consent',
    },
  },
  registration: {
    AGID: 'public AGID/address registration can create public references after private-field redaction',
    AOID: 'AOID registration is owner-managed and local-first; cloud registration requires encrypted envelope',
  },
  audit: {
    eventPrivacy: 'audit events record metadata, decisions, and safe fingerprints only',
    rawPrivatePayloadStorage: 'forbidden',
    requiredEvents: ['register', 'qr-build', 'qr-parse', 'sync', 'revoke', 'rotate'],
  },
} as const;

const AOID_PRIVATE_FIELD_KEYS = new Set([
  'recipient',
  'name',
  'phone',
  'phonenumber',
  'room',
  'unit',
  'unitnumber',
  'apartment',
  'flat',
  'suite',
  'floor',
  'accesscode',
  'buildingaccess',
  'deliveryinstruction',
  'deliveryinstructions',
  'accessinstruction',
  'accessinstructions',
  'privatebody',
  'deliveryoptions',
  'intercom',
  'intercomcode',
  'dropoffsetting',
  'dropoffpreference',
  'accesspolicy',
  'validity',
  'privatenote',
  'privateownershipproof',
  'lat',
  'lon',
  'lng',
]);

const AOID_PUBLIC_REFERENCE_ALLOWED_FIELD_PATHS = new Set([
  'payload.name',
]);

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeFieldKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
    .join(',')}}`;
}

function safeHash(value: unknown) {
  return sha256Hex(stableJson(value)).slice(0, 24).toUpperCase();
}

export function findAoidPrivateFields(value: unknown, path = 'payload'): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findAoidPrivateFields(item, `${path}[${index}]`));
  }

  const findings: string[] = [];
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = normalizeFieldKey(key);
    const nestedPath = `${path}.${key}`;
    if (AOID_PRIVATE_FIELD_KEYS.has(normalizedKey)) {
      findings.push(nestedPath);
      continue;
    }
    findings.push(...findAoidPrivateFields(nestedValue, nestedPath));
  }
  return findings;
}

function hasOwnString(value: unknown, key: string) {
  return Boolean(value)
    && typeof value === 'object'
    && typeof (value as Record<string, unknown>)[key] === 'string'
    && clean((value as Record<string, unknown>)[key]).length > 0;
}

function isEncryptedAoidEnvelope(value: unknown) {
  return Boolean(value)
    && typeof value === 'object'
    && (value as { type?: unknown }).type === 'AOID_SYNC_ENVELOPE'
    && hasOwnString(value, 'encryptedPayload')
    && (value as { encryption?: unknown }).encryption === 'owner-device';
}

function hasPublicAoidReference(value: unknown) {
  const id = clean((value as { id?: unknown })?.id).toUpperCase();
  const agid = (value as { agid?: unknown })?.agid;
  const hasValidId = isValidAOIDId(id);
  const hasLinkedAgid = agid ? isAOIDLinkedToAGID(id, agid) : true;
  return Boolean(value)
    && typeof value === 'object'
    && (value as { type?: unknown }).type === 'AOID'
    && hasValidId
    && hasLinkedAgid
    && (
      (value as { privacy?: unknown }).privacy === 'public-reference'
      || hasOwnString(value, 'publicHandle')
      || hasOwnString(value, 'requiresEncryptedPayload')
    );
}

function hasAgidReference(value: unknown) {
  if (typeof value === 'string') return isValidAGIDFormat(value);
  if (!value || typeof value !== 'object') return false;
  const agid = normalizeAGIDInput((value as { agid?: unknown }).agid);
  const id = normalizeAGIDInput((value as { id?: unknown }).id);
  return Boolean((agid && isValidAGIDFormat(agid)) || (id && isValidAGIDFormat(id)));
}

export function classifyAgidAoidPayload(
  layer: AgidAoidLayer,
  payload: unknown,
): AgidAoidPayloadClass {
  if (payload === undefined || payload === null) return 'empty';
  if (layer === 'AOID') {
    if (isEncryptedAoidEnvelope(payload)) return 'aoid-encrypted-envelope';
    if (hasPublicAoidReference(payload)) return 'aoid-public-reference';
    if (findAoidPrivateFields(payload).length > 0) return 'aoid-private-plaintext';
    return 'unknown';
  }
  if (hasAgidReference(payload)) return 'public-agid-reference';
  return validatePublicAgidPayload(payload).ok ? 'public-agid-evidence' : 'unknown';
}

function forbiddenFieldsFor(layer: AgidAoidLayer, payload: unknown) {
  if (layer === 'AOID') {
    const fields = findAoidPrivateFields(payload);
    return hasPublicAoidReference(payload)
      ? fields.filter(field => !AOID_PUBLIC_REFERENCE_ALLOWED_FIELD_PATHS.has(field))
      : fields;
  }
  return validatePublicAgidPayload(payload).forbiddenFields;
}

function cachePolicyFor(layer: AgidAoidLayer, surface: AgidAoidSurface) {
  if (layer === 'AOID') {
    if (surface === 'local-device' || surface === 'private-qr') return 'local-only-private';
    if (surface === 'encrypted-sync') return 'no-public-cache-encrypted-envelope-only';
    return 'public-reference-no-plaintext-cache';
  }
  return surface === 'local-device' ? 'local-or-public-reference' : 'public-evidence-cache-allowed';
}

export function evaluateAgidAoidOperation(input: {
  layer: AgidAoidLayer;
  operation: AgidAoidOperation;
  surface: AgidAoidSurface;
  payload?: unknown;
}): AgidAoidGovernanceDecision {
  const payloadClass = classifyAgidAoidPayload(input.layer, input.payload);
  const forbiddenFields = forbiddenFieldsFor(input.layer, input.payload);
  const warnings: string[] = [];
  let allowed = true;

  if (input.layer === 'AGID') {
    const privateTrustedSurface = input.surface === 'local-device' || input.surface === 'private-qr';
    if (forbiddenFields.length > 0 && !privateTrustedSurface) {
      allowed = false;
      warnings.push('AGID public surfaces cannot carry private recipient, room, access, owner, or AOID fields.');
    } else if (forbiddenFields.length > 0) {
      warnings.push('Private registered-address fields are allowed only on trusted local/private QR surfaces.');
    }
    if (input.operation === 'register' && payloadClass === 'empty') {
      allowed = false;
      warnings.push('AGID registration requires an AGID reference or public evidence payload.');
    }
  } else {
    const publicLikeSurface = ['public-api', 'public-qr', 'event-stream', 'openapi'].includes(input.surface);
    if (input.surface === 'encrypted-sync') {
      allowed = payloadClass === 'aoid-encrypted-envelope';
      if (!allowed) warnings.push('AOID encrypted sync requires an owner-device encrypted envelope.');
    } else if (publicLikeSurface) {
      allowed = payloadClass === 'aoid-public-reference' && forbiddenFields.length === 0;
      if (!allowed) warnings.push('AOID public communication can expose only a public handle and linked AGID.');
    } else if (input.surface === 'sdk') {
      allowed = payloadClass !== 'aoid-private-plaintext';
      if (!allowed) warnings.push('AOID SDK exports must not publish plaintext owner payloads.');
    } else {
      allowed = true;
      if (payloadClass === 'aoid-private-plaintext') {
        warnings.push('AOID plaintext is allowed only on owner-controlled local/private surfaces.');
      }
    }
  }

  return {
    modelVersion: AGID_AOID_GOVERNANCE_MODEL_VERSION,
    layer: input.layer,
    operation: input.operation,
    surface: input.surface,
    allowed,
    payloadClass,
    privacy: input.layer === 'AGID'
      ? forbiddenFields.length > 0 ? 'private-local' : 'public'
      : input.surface === 'local-device' || input.surface === 'private-qr'
        ? 'private-local'
        : 'private-redacted',
    requiresOwnerConsent: input.layer === 'AOID' && input.surface === 'encrypted-sync',
    requiresEncryption: input.layer === 'AOID' && input.surface === 'encrypted-sync',
    requiresLocalOnly: payloadClass === 'aoid-private-plaintext' || (input.layer === 'AGID' && forbiddenFields.length > 0),
    forbiddenFields,
    warnings,
    cachePolicy: cachePolicyFor(input.layer, input.surface),
  };
}

export function buildAgidAoidAuditEvent(input: {
  layer: AgidAoidLayer;
  operation: AgidAoidOperation;
  surface: AgidAoidSurface;
  entityId?: string;
  agid?: string;
  publicHandle?: string;
  payload?: unknown;
  now?: number;
}): AgidAoidAuditEvent {
  const decision = evaluateAgidAoidOperation(input);
  const safeMetadata = {
    modelVersion: decision.modelVersion,
    layer: decision.layer,
    operation: decision.operation,
    surface: decision.surface,
    entityId: clean(input.entityId),
    agid: clean(input.agid),
    publicHandle: clean(input.publicHandle),
    payloadClass: decision.payloadClass,
    outcome: decision.allowed ? 'allowed' : 'blocked',
    forbiddenFields: [...decision.forbiddenFields].sort(),
  };
  const payloadFingerprint = safeHash(safeMetadata);

  return {
    id: `AUD-${payloadFingerprint.slice(0, 16)}`,
    modelVersion: decision.modelVersion,
    layer: decision.layer,
    operation: decision.operation,
    surface: decision.surface,
    ...(clean(input.entityId) ? { entityId: clean(input.entityId) } : {}),
    ...(clean(input.agid) ? { agid: clean(input.agid) } : {}),
    ...(clean(input.publicHandle) ? { publicHandle: clean(input.publicHandle) } : {}),
    payloadClass: decision.payloadClass,
    privacy: decision.privacy,
    outcome: decision.allowed ? 'allowed' : 'blocked',
    forbiddenFields: decision.forbiddenFields,
    warnings: decision.warnings,
    payloadFingerprint,
    createdAt: input.now ?? Date.now(),
  };
}
