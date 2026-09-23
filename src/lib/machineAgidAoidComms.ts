import { sha256Hex } from './sha256';

export const MACHINE_AGID_AOID_COMMUNICATION_VERSION = 'agid-aoid-machine-comms-v1';
export const MACHINE_AGID_AOID_ENVELOPE_SIGNATURE_ALGORITHM = 'sha256-machine-envelope-fingerprint-v1';

export type MachineNodeRole =
  | 'pos-terminal'
  | 'field-device'
  | 'locker-controller'
  | 'drone-agent'
  | 'hotel-kiosk'
  | 'carrier-gateway'
  | 'warehouse-wms'
  | 'registry-api'
  | 'shopping-agent';

export type MachineCommunicationMode = 'local-only' | 'server-registry' | 'zk-only' | 'ethereum-registry' | 'full-zk-ethereum';

export type MachineCommunicationPurpose =
  | 'delivery-handoff'
  | 'locker-release'
  | 'reachability-report'
  | 'hotel-checkin'
  | 'waybill-receipt'
  | 'address-resolution'
  | 'consent-sync';

export type MachineCommunicationOperation =
  | 'capability-advertisement'
  | 'handoff-request'
  | 'recipient-proof-request'
  | 'locker-release-request'
  | 'reachability-query'
  | 'reachability-report'
  | 'receipt-sync'
  | 'revocation-check'
  | 'address-resolution-query';

export type MachineCapability =
  | 'scan-qr'
  | 'scan-nfc'
  | 'read-agid-s-envelope'
  | 'verify-aoid-reference'
  | 'verify-waybill-alias'
  | 'issue-recipient-challenge'
  | 'verify-recipient-proof'
  | 'check-revocation-freshness'
  | 'mark-nullifier-used'
  | 'open-locker'
  | 'report-reachability'
  | 'sync-redacted-receipt'
  | 'offline-queue'
  | 'coarse-location-evidence'
  | 'zk-proof-verify'
  | 'ethereum-registry-check';

export type MachineTrustLevel = 'local' | 'paired' | 'organization-trusted' | 'public-untrusted';

export type MachineNodeIdentity = {
  nodeId: string;
  role: MachineNodeRole;
  organizationRef: string;
  deviceKeyId: string;
  trustLevel: MachineTrustLevel;
  capabilities: MachineCapability[];
  endpointRef?: string;
};

export type MachineSafePayload = {
  agidCommitment?: string;
  aoidCommitment?: string;
  waybillAlias?: string;
  waybillCommitment?: string;
  addressReferenceCommitment?: string;
  nullifierTail?: string;
  jtiTail?: string;
  countryCode?: string;
  regionCode?: string;
  coarseRegion?: string;
  operationState?: string;
  reasonCode?: string;
  receiptRef?: string;
  challengeHash?: string;
  proofBundleId?: string;
  revocationRoot?: string;
  freshnessRoot?: string;
  issuerRoot?: string;
  deliveryMode?: string;
  expiresAt?: string;
  ttlSeconds?: number;
  deviceTrustScore?: number;
  capabilityRefs?: string[];
};

export type MachineEnvelopeSignature = {
  signatureId: string;
  algorithm: typeof MACHINE_AGID_AOID_ENVELOPE_SIGNATURE_ALGORITHM;
  envelopeFingerprint: string;
  signedByNodeId: string;
  deviceKeyId: string;
  signedAt: string;
};

export type MachineCommunicationEnvelope = {
  modelVersion: typeof MACHINE_AGID_AOID_COMMUNICATION_VERSION;
  messageId: string;
  conversationId: string;
  sequence: number;
  nonce: string;
  createdAt: string;
  expiresAt: string;
  audience: string;
  mode: MachineCommunicationMode;
  purpose: MachineCommunicationPurpose;
  operation: MachineCommunicationOperation;
  domain: string;
  from: MachineNodeIdentity;
  to: MachineNodeIdentity;
  requestedCapabilities: MachineCapability[];
  publicPayload: MachineSafePayload;
  payloadCommitment: string;
  payloadKeys: string[];
  warnings: string[];
  signature: MachineEnvelopeSignature;
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawRecipientStored: false;
    phoneStored: false;
    preciseLocationStored: false;
    proofSecretStored: false;
    privateKeyStored: false;
    payloadIsCommitmentOnly: true;
  };
};

export type MachineEnvelopeVerification = {
  valid: boolean;
  status: 'accepted' | 'review' | 'rejected';
  errors: string[];
  warnings: string[];
  forbiddenFields: string[];
  commonCapabilities: MachineCapability[];
  missingCapabilities: MachineCapability[];
  envelopeFingerprint: string;
  privacy: MachineCommunicationEnvelope['privacy'];
};

export type MachineHandshakeResult = {
  modelVersion: typeof MACHINE_AGID_AOID_COMMUNICATION_VERSION;
  handshakeId: string;
  conversationId: string;
  decision: 'accept' | 'review' | 'reject';
  nextAction:
    | 'continue-local'
    | 'request-recipient-proof'
    | 'open-locker'
    | 'queue-offline-sync'
    | 'manual-review'
    | 'reject-private-material';
  acceptedCapabilities: MachineCapability[];
  requiredCapabilities: MachineCapability[];
  errors: string[];
  warnings: string[];
  receipt: {
    receiptId: string;
    transcriptHash: string;
    fromNodeId: string;
    toNodeId: string;
    purpose: MachineCommunicationPurpose;
    operation: MachineCommunicationOperation;
    createdAt: string;
    privacy: MachineCommunicationEnvelope['privacy'];
  };
};

const KNOWN_ROLES = new Set<MachineNodeRole>([
  'pos-terminal',
  'field-device',
  'locker-controller',
  'drone-agent',
  'hotel-kiosk',
  'carrier-gateway',
  'warehouse-wms',
  'registry-api',
  'shopping-agent',
]);

const KNOWN_CAPABILITIES = new Set<MachineCapability>([
  'scan-qr',
  'scan-nfc',
  'read-agid-s-envelope',
  'verify-aoid-reference',
  'verify-waybill-alias',
  'issue-recipient-challenge',
  'verify-recipient-proof',
  'check-revocation-freshness',
  'mark-nullifier-used',
  'open-locker',
  'report-reachability',
  'sync-redacted-receipt',
  'offline-queue',
  'coarse-location-evidence',
  'zk-proof-verify',
  'ethereum-registry-check',
]);

const PURPOSE_REQUIRED_CAPABILITIES: Record<MachineCommunicationOperation, MachineCapability[]> = {
  'capability-advertisement': [],
  'handoff-request': ['verify-waybill-alias', 'check-revocation-freshness'],
  'recipient-proof-request': ['issue-recipient-challenge', 'verify-recipient-proof'],
  'locker-release-request': ['verify-aoid-reference', 'open-locker'],
  'reachability-query': ['coarse-location-evidence'],
  'reachability-report': ['report-reachability', 'sync-redacted-receipt'],
  'receipt-sync': ['sync-redacted-receipt'],
  'revocation-check': ['check-revocation-freshness'],
  'address-resolution-query': ['verify-aoid-reference'],
};

const SAFE_PAYLOAD_KEYS = new Set<keyof MachineSafePayload>([
  'agidCommitment',
  'aoidCommitment',
  'waybillAlias',
  'waybillCommitment',
  'addressReferenceCommitment',
  'nullifierTail',
  'jtiTail',
  'countryCode',
  'regionCode',
  'coarseRegion',
  'operationState',
  'reasonCode',
  'receiptRef',
  'challengeHash',
  'proofBundleId',
  'revocationRoot',
  'freshnessRoot',
  'issuerRoot',
  'deliveryMode',
  'expiresAt',
  'ttlSeconds',
  'deviceTrustScore',
  'capabilityRefs',
]);

const FORBIDDEN_PRIVATE_KEYS = new Set([
  'address',
  'rawaddress',
  'street',
  'housenumber',
  'unit',
  'room',
  'apartment',
  'suite',
  'recipient',
  'name',
  'phone',
  'phonenumber',
  'email',
  'agid',
  'rawagid',
  'aoid',
  'rawaoid',
  'lat',
  'latitude',
  'lon',
  'lng',
  'longitude',
  'preciselocation',
  'proofcode',
  'proofsecret',
  'recipientsecret',
  'privatekey',
  'secret',
  'accesscode',
  'deliveryinstructions',
]);

function cleanText(value: unknown, fallback = '', maxLength = 120) {
  if (typeof value !== 'string') return fallback;
  return (value.trim().replace(/[\r\n\t]+/g, ' ') || fallback).slice(0, maxLength);
}

function cleanDomain(value: unknown, fallback: string) {
  const cleaned = cleanText(value, fallback, 96).toLowerCase();
  return /^[a-z0-9][a-z0-9._:-]{1,95}$/.test(cleaned) ? cleaned : fallback;
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function stableId(prefix: string, payload: unknown, size = 20) {
  return `${prefix}-${sha256Hex(stableJson(payload)).slice(0, size).toUpperCase()}`;
}

function privacyFlags(): MachineCommunicationEnvelope['privacy'] {
  return {
    rawAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    rawRecipientStored: false,
    phoneStored: false,
    preciseLocationStored: false,
    proofSecretStored: false,
    privateKeyStored: false,
    payloadIsCommitmentOnly: true,
  };
}

function addSeconds(iso: string, seconds: number) {
  const base = Date.parse(iso);
  return new Date((Number.isFinite(base) ? base : Date.now()) + Math.max(1, seconds) * 1000).toISOString();
}

function normalizeRole(value: unknown): MachineNodeRole {
  const role = cleanText(value) as MachineNodeRole;
  return KNOWN_ROLES.has(role) ? role : 'registry-api';
}

function normalizeTrustLevel(value: unknown): MachineTrustLevel {
  return value === 'local'
    || value === 'paired'
    || value === 'organization-trusted'
    || value === 'public-untrusted'
    ? value
    : 'local';
}

function normalizeCapabilities(values: unknown): MachineCapability[] {
  const raw = Array.isArray(values) ? values : [];
  return Array.from(new Set(raw.filter((item): item is MachineCapability => (
    typeof item === 'string' && KNOWN_CAPABILITIES.has(item as MachineCapability)
  ))));
}

function sanitizeSafePayload(value: unknown): { payload: MachineSafePayload; droppedKeys: string[]; forbiddenFields: string[] } {
  const forbiddenFields = findForbiddenMachineMaterial(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { payload: {}, droppedKeys: [], forbiddenFields };
  }

  const payload: MachineSafePayload = {};
  const droppedKeys: string[] = [];
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!SAFE_PAYLOAD_KEYS.has(key as keyof MachineSafePayload)) {
      droppedKeys.push(key);
      continue;
    }
    if (key === 'ttlSeconds' || key === 'deviceTrustScore') {
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        (payload as Record<string, unknown>)[key] = Math.round(raw * 100) / 100;
      }
      continue;
    }
    if (key === 'capabilityRefs') {
      if (Array.isArray(raw)) {
        payload.capabilityRefs = raw.map(item => cleanText(item, '', 80)).filter(Boolean).slice(0, 10);
      }
      continue;
    }
    const cleaned = cleanText(raw, '', 160);
    if (cleaned) (payload as Record<string, unknown>)[key] = cleaned;
  }
  return { payload, droppedKeys, forbiddenFields };
}

export function findForbiddenMachineMaterial(value: unknown, path = 'payload'): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenMachineMaterial(item, `${path}[${index}]`));
  }

  const findings: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = normalizeKey(key);
    const nestedPath = `${path}.${key}`;
    if (FORBIDDEN_PRIVATE_KEYS.has(normalized)) {
      findings.push(nestedPath);
      continue;
    }
    findings.push(...findForbiddenMachineMaterial(nested, nestedPath));
  }
  return findings;
}

export function createMachineNodeIdentity(input: Partial<MachineNodeIdentity> & {
  role?: MachineNodeRole;
  capabilities?: MachineCapability[];
}): MachineNodeIdentity {
  const role = normalizeRole(input.role);
  const organizationRef = cleanText(input.organizationRef, `${role}:local-org`, 96);
  const deviceKeyId = cleanText(input.deviceKeyId, `${role}:device-key:local`, 96);
  const nodeId = cleanText(input.nodeId, '', 96) || stableId('NODE', {
    role,
    organizationRef,
    deviceKeyId,
  }, 16);

  return {
    nodeId,
    role,
    organizationRef,
    deviceKeyId,
    trustLevel: normalizeTrustLevel(input.trustLevel),
    capabilities: normalizeCapabilities(input.capabilities),
    ...(cleanText(input.endpointRef, '', 160) ? { endpointRef: cleanText(input.endpointRef, '', 160) } : {}),
  };
}

function envelopeFingerprintCore(envelope: Omit<MachineCommunicationEnvelope, 'signature'>) {
  return `MFP-${sha256Hex(stableJson({
    ...envelope,
    warnings: [...envelope.warnings].sort(),
  })).slice(0, 32).toUpperCase()}`;
}

function buildSignature(
  envelope: Omit<MachineCommunicationEnvelope, 'signature'>,
  signedAt = envelope.createdAt,
): MachineEnvelopeSignature {
  const envelopeFingerprint = envelopeFingerprintCore(envelope);
  return {
    signatureId: stableId('MSIG', {
      envelopeFingerprint,
      signedByNodeId: envelope.from.nodeId,
      deviceKeyId: envelope.from.deviceKeyId,
      signedAt,
    }, 18),
    algorithm: MACHINE_AGID_AOID_ENVELOPE_SIGNATURE_ALGORITHM,
    envelopeFingerprint,
    signedByNodeId: envelope.from.nodeId,
    deviceKeyId: envelope.from.deviceKeyId,
    signedAt,
  };
}

export function buildMachineCommunicationEnvelope(input: {
  from: Partial<MachineNodeIdentity>;
  to: Partial<MachineNodeIdentity>;
  purpose: MachineCommunicationPurpose;
  operation: MachineCommunicationOperation;
  publicPayload?: unknown;
  mode?: MachineCommunicationMode;
  domain?: string;
  requestedCapabilities?: MachineCapability[];
  conversationId?: string;
  sequence?: number;
  nonce?: string;
  audience?: string;
  createdAt?: string;
  ttlSeconds?: number;
}): MachineCommunicationEnvelope {
  const createdAt = input.createdAt || new Date().toISOString();
  const from = createMachineNodeIdentity(input.from);
  const to = createMachineNodeIdentity(input.to);
  const { payload, droppedKeys, forbiddenFields } = sanitizeSafePayload(input.publicPayload);
  if (forbiddenFields.length > 0) {
    throw new Error(`Machine envelope cannot carry private material: ${forbiddenFields.join(', ')}`);
  }

  const requestedCapabilities = normalizeCapabilities(input.requestedCapabilities?.length
    ? input.requestedCapabilities
    : PURPOSE_REQUIRED_CAPABILITIES[input.operation]);
  const warnings = [
    ...droppedKeys.map(key => `payload-key-dropped:${key}`),
    ...(requestedCapabilities.length === 0 ? ['no-required-capabilities-for-operation'] : []),
    ...(input.mode === 'full-zk-ethereum' ? ['full-zk-ethereum-mode-can-be-slower-than-local-machine-link'] : []),
  ];
  const publicPayload = {
    ...payload,
    ...(payload.ttlSeconds === undefined && input.ttlSeconds ? { ttlSeconds: input.ttlSeconds } : {}),
  };
  const payloadCommitment = stableId('MPC', publicPayload, 32);
  const conversationId = cleanText(input.conversationId, '', 96) || stableId('MCONV', {
    from: from.nodeId,
    to: to.nodeId,
    purpose: input.purpose,
    day: createdAt.slice(0, 10),
  }, 18);
  const sequence = Math.max(1, Math.round(input.sequence ?? 1));
  const audience = cleanText(input.audience, '', 96) || to.nodeId;
  const nonce = cleanText(input.nonce, '', 96) || stableId('MNONCE', {
    conversationId,
    sequence,
    from: from.nodeId,
    to: to.nodeId,
    payloadCommitment,
    createdAt,
  }, 18);
  const envelopeWithoutSignature: Omit<MachineCommunicationEnvelope, 'signature'> = {
    modelVersion: MACHINE_AGID_AOID_COMMUNICATION_VERSION,
    messageId: stableId('MMSG', {
      conversationId,
      sequence,
      nonce,
      from: from.nodeId,
      to: to.nodeId,
      payloadCommitment,
      createdAt,
    }, 18),
    conversationId,
    sequence,
    nonce,
    createdAt,
    expiresAt: addSeconds(createdAt, input.ttlSeconds ?? 90),
    audience,
    mode: input.mode ?? 'local-only',
    purpose: input.purpose,
    operation: input.operation,
    domain: cleanDomain(input.domain, `machine:${input.purpose}`),
    from,
    to,
    requestedCapabilities,
    publicPayload,
    payloadCommitment,
    payloadKeys: Object.keys(publicPayload).sort(),
    warnings: Array.from(new Set(warnings)),
    privacy: privacyFlags(),
  };

  return {
    ...envelopeWithoutSignature,
    signature: buildSignature(envelopeWithoutSignature),
  };
}

export function verifyMachineCommunicationEnvelope(
  envelope: MachineCommunicationEnvelope,
  options: {
    now?: string;
    receiverCapabilities?: MachineCapability[];
  } = {},
): MachineEnvelopeVerification {
  const errors: string[] = [];
  const warnings = [...(Array.isArray(envelope.warnings) ? envelope.warnings : [])];
  const forbiddenFields = findForbiddenMachineMaterial(envelope);
  const nowMs = Date.parse(options.now || new Date().toISOString());
  const expiresAtMs = Date.parse(envelope.expiresAt);
  const receiverCapabilities = normalizeCapabilities(options.receiverCapabilities?.length
    ? options.receiverCapabilities
    : envelope.to?.capabilities);
  const requestedCapabilities = normalizeCapabilities(envelope.requestedCapabilities);
  const commonCapabilities = requestedCapabilities.filter(capability => receiverCapabilities.includes(capability));
  const missingCapabilities = requestedCapabilities.filter(capability => !commonCapabilities.includes(capability));

  if (envelope.modelVersion !== MACHINE_AGID_AOID_COMMUNICATION_VERSION) errors.push('machine-envelope-version-unsupported');
  if (forbiddenFields.length > 0) errors.push('machine-envelope-private-material-forbidden');
  if (!envelope.from?.nodeId || !envelope.to?.nodeId) errors.push('machine-envelope-node-missing');
  if (!cleanText(envelope.nonce, '', 96) || cleanText(envelope.nonce, '', 96).length < 12) errors.push('machine-envelope-nonce-missing');
  if (!cleanText(envelope.audience, '', 96)) errors.push('machine-envelope-audience-missing');
  if (cleanText(envelope.audience, '', 96) && envelope.audience !== envelope.to?.nodeId) errors.push('machine-envelope-audience-mismatch');
  if (!Number.isFinite(expiresAtMs)) warnings.push('machine-envelope-expiry-unparseable');
  if (Number.isFinite(expiresAtMs) && Number.isFinite(nowMs) && expiresAtMs <= nowMs) errors.push('machine-envelope-expired');
  if (missingCapabilities.length > 0) warnings.push(`machine-capability-missing:${missingCapabilities.join(',')}`);
  if (envelope.from?.trustLevel === 'public-untrusted' && envelope.operation !== 'capability-advertisement') {
    warnings.push('sender-public-untrusted-requires-review');
  }

  const { signature: _signature, ...core } = envelope;
  const envelopeFingerprint = envelopeFingerprintCore(core);
  if (envelope.signature?.algorithm !== MACHINE_AGID_AOID_ENVELOPE_SIGNATURE_ALGORITHM) {
    errors.push('machine-envelope-signature-algorithm-unsupported');
  }
  if (envelope.signature?.envelopeFingerprint !== envelopeFingerprint) {
    errors.push('machine-envelope-signature-mismatch');
  }
  if (envelope.signature?.signedByNodeId !== envelope.from?.nodeId) {
    errors.push('machine-envelope-signer-node-mismatch');
  }

  const valid = errors.length === 0;
  const status = valid && missingCapabilities.length === 0 && envelope.from.trustLevel !== 'public-untrusted'
    ? 'accepted'
    : valid
      ? 'review'
      : 'rejected';

  return {
    valid,
    status,
    errors,
    warnings: Array.from(new Set(warnings)),
    forbiddenFields,
    commonCapabilities,
    missingCapabilities,
    envelopeFingerprint,
    privacy: privacyFlags(),
  };
}

export function negotiateMachineCommunication(input: {
  request: MachineCommunicationEnvelope;
  receiverCapabilities?: MachineCapability[];
  now?: string;
}): MachineHandshakeResult {
  const verification = verifyMachineCommunicationEnvelope(input.request, input);
  const requiredCapabilities = PURPOSE_REQUIRED_CAPABILITIES[input.request.operation];
  const acceptedCapabilities = verification.commonCapabilities.filter(capability => requiredCapabilities.includes(capability));
  const hasRequired = requiredCapabilities.every(capability => acceptedCapabilities.includes(capability));
  const decision: MachineHandshakeResult['decision'] = !verification.valid
    ? 'reject'
    : hasRequired && verification.status === 'accepted'
      ? 'accept'
      : 'review';
  const nextAction: MachineHandshakeResult['nextAction'] = !verification.valid && verification.forbiddenFields.length > 0
    ? 'reject-private-material'
    : decision === 'reject'
      ? 'manual-review'
      : input.request.operation === 'recipient-proof-request'
        ? 'request-recipient-proof'
        : input.request.operation === 'locker-release-request' && hasRequired
          ? 'open-locker'
          : input.request.mode === 'local-only' || input.request.mode === 'server-registry'
            ? 'continue-local'
            : input.request.operation === 'receipt-sync'
              ? 'queue-offline-sync'
              : 'manual-review';

  const transcriptHash = stableId('MTR', {
    requestFingerprint: verification.envelopeFingerprint,
    decision,
    nextAction,
    acceptedCapabilities,
  }, 32);

  return {
    modelVersion: MACHINE_AGID_AOID_COMMUNICATION_VERSION,
    handshakeId: stableId('MHS', {
      conversationId: input.request.conversationId,
      transcriptHash,
    }, 18),
    conversationId: input.request.conversationId,
    decision,
    nextAction,
    acceptedCapabilities,
    requiredCapabilities,
    errors: verification.errors,
    warnings: verification.warnings,
    receipt: {
      receiptId: stableId('MRCPT', {
        conversationId: input.request.conversationId,
        transcriptHash,
        toNodeId: input.request.to.nodeId,
      }, 18),
      transcriptHash,
      fromNodeId: input.request.from.nodeId,
      toNodeId: input.request.to.nodeId,
      purpose: input.request.purpose,
      operation: input.request.operation,
      createdAt: input.now || new Date().toISOString(),
      privacy: privacyFlags(),
    },
  };
}

export function listMachineCommunicationCapabilities() {
  return {
    modelVersion: MACHINE_AGID_AOID_COMMUNICATION_VERSION,
    roles: Array.from(KNOWN_ROLES),
    capabilities: Array.from(KNOWN_CAPABILITIES),
    modes: ['local-only', 'server-registry', 'zk-only', 'ethereum-registry', 'full-zk-ethereum'] satisfies MachineCommunicationMode[],
    operations: Object.keys(PURPOSE_REQUIRED_CAPABILITIES) as MachineCommunicationOperation[],
    requiredCapabilitiesByOperation: PURPOSE_REQUIRED_CAPABILITIES,
    publicPayloadKeys: Array.from(SAFE_PAYLOAD_KEYS),
    privacy: privacyFlags(),
    forbiddenPublicPayloads: Array.from(FORBIDDEN_PRIVATE_KEYS).sort(),
  };
}

export function buildMachineCommunicationDemo(now = '2026-06-20T09:00:00.000Z') {
  const pos = createMachineNodeIdentity({
    nodeId: 'NODE-POS-LOCAL-01',
    role: 'pos-terminal',
    organizationRef: 'org:store-local-demo',
    deviceKeyId: 'key:pos-local-01',
    trustLevel: 'organization-trusted',
    capabilities: ['scan-qr', 'scan-nfc', 'verify-waybill-alias', 'check-revocation-freshness', 'sync-redacted-receipt'],
  });
  const locker = createMachineNodeIdentity({
    nodeId: 'NODE-LOCKER-A7',
    role: 'locker-controller',
    organizationRef: 'org:locker-network-demo',
    deviceKeyId: 'key:locker-a7',
    trustLevel: 'paired',
    capabilities: ['verify-aoid-reference', 'open-locker', 'check-revocation-freshness', 'sync-redacted-receipt', 'offline-queue'],
  });
  const field = createMachineNodeIdentity({
    nodeId: 'NODE-FIELD-03',
    role: 'field-device',
    organizationRef: 'org:carrier-field-demo',
    deviceKeyId: 'key:field-03',
    trustLevel: 'paired',
    capabilities: ['report-reachability', 'coarse-location-evidence', 'sync-redacted-receipt', 'offline-queue'],
  });
  const drone = createMachineNodeIdentity({
    nodeId: 'NODE-DRONE-12',
    role: 'drone-agent',
    organizationRef: 'org:air-route-demo',
    deviceKeyId: 'key:drone-12',
    trustLevel: 'paired',
    capabilities: ['coarse-location-evidence', 'report-reachability', 'sync-redacted-receipt'],
  });

  const lockerEnvelope = buildMachineCommunicationEnvelope({
    from: pos,
    to: locker,
    purpose: 'locker-release',
    operation: 'locker-release-request',
    mode: 'local-only',
    domain: 'delivery:locker-release',
    createdAt: now,
    ttlSeconds: 120,
    publicPayload: {
      aoidCommitment: 'AOC-DEMO-LOCKER-9F3A',
      waybillAlias: 'WBA-9F3A12BC4400',
      addressReferenceCommitment: 'ARC-DEMO-LOCKER-REF',
      nullifierTail: 'A7K9Q2',
      operationState: 'recipient-controlled',
      deviceTrustScore: 0.94,
    },
  });
  const fieldEnvelope = buildMachineCommunicationEnvelope({
    from: drone,
    to: field,
    purpose: 'reachability-report',
    operation: 'reachability-report',
    mode: 'server-registry',
    domain: 'delivery:reachability',
    createdAt: now,
    ttlSeconds: 90,
    publicPayload: {
      agidCommitment: 'AGC-COARSE-ROUTE-77',
      coarseRegion: 'north-corridor',
      reasonCode: 'landing-zone-blocked',
      receiptRef: 'DRE-ROUTE-77',
      operationState: 'cannot-reach',
    },
  });

  return {
    nodes: [pos, locker, field, drone],
    envelopes: [lockerEnvelope, fieldEnvelope],
    handshakes: [
      negotiateMachineCommunication({ request: lockerEnvelope, now }),
      negotiateMachineCommunication({ request: fieldEnvelope, now }),
    ],
  };
}
