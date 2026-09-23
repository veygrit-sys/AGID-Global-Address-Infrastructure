export const ADDRESS_MORPHISM_V2_COMMUNICATION_SEMANTICS_VERSION =
  'address-morphism-v2-communication-semantics-v0.1';

export type AddressCommunicationRole =
  | 'subject'
  | 'issuer'
  | 'resolver'
  | 'verifier'
  | 'merchant'
  | 'carrier'
  | 'locker'
  | 'hotel'
  | 'auditor'
  | 'registry'
  | 'emergency_authority';

export type AddressCommunicationPayloadType =
  | 'proof'
  | 'commitment'
  | 'encrypted-address'
  | 'carrier-token'
  | 'delivery-session'
  | 'audit-event'
  | 'revocation-update'
  | 'successor-pointer'
  | 'capability-offer'
  | 'semantic-ack';

export type AddressDisclosureLevel =
  | 'none'
  | 'proofOnly'
  | 'country'
  | 'region'
  | 'postalEquivalent'
  | 'encryptedAddress'
  | 'carrierDecryptable'
  | 'rawAddress';

export type AddressCommunicationEnvelopeState =
  | 'verified'
  | 'partial'
  | 'ambiguous'
  | 'unresolved'
  | 'deprecated'
  | 'disputed'
  | 'blocked';

export type AddressCommunicationRevocationStatus = 'not_revoked' | 'revoked' | 'unknown';

export type AddressCommunicationAckState =
  | 'received'
  | 'parsed'
  | 'referent_accepted'
  | 'deliverable'
  | 'proof_verified'
  | 'rejected'
  | 'expired'
  | 'revoked'
  | 'manual_review_required'
  | 'disclosure_denied'
  | 'policy_mismatch';

export type AddressCommunicationDecisionState = 'valid' | 'limited' | 'blocked';

export type AddressCommunicationClaim =
  | 'referent_commitment_present'
  | 'pid_commitment_present'
  | 'within_delivery_zone'
  | 'quality_verified'
  | 'freshness_ok'
  | 'not_revoked'
  | 'consent_scope_delivery'
  | 'postal_equivalent'
  | 'country_membership'
  | 'carrier_decryptable'
  | 'audit_ready'
  | 'successor_known';

export type AddressCommunicationPrivateMaterialFlags = {
  rawAddress: boolean;
  recipient: boolean;
  witness: boolean;
  privateKey: boolean;
  proofSecret: boolean;
  privateVerticalUnit: boolean;
  preciseCoordinates: boolean;
};

export type AddressProofBundleSummary = {
  proofType: 'none' | 'signature' | 'zk-ready' | 'selective-disclosure' | 'carrier-encryption' | 'hybrid';
  publicSignals: string[];
  roots: string[];
  storesWitness: boolean;
  storesPrivateKey: boolean;
  storesRawAddress: boolean;
};

export type AddressCommunicationReplyPolicy = {
  requiresAck: boolean;
  acceptedAckStates: AddressCommunicationAckState[];
  timeoutMs: number;
  retryLimit: number;
};

export type AddressCommunicationObject = {
  version: string;
  messageId: string;
  threadId: string;
  envelopeVersion: string;
  envelopeState: AddressCommunicationEnvelopeState;
  senderRole: AddressCommunicationRole;
  audienceRole: AddressCommunicationRole;
  purpose: string;
  payloadType: AddressCommunicationPayloadType;
  claimSet: AddressCommunicationClaim[];
  disclosureLevel: AddressDisclosureLevel;
  leakScore: number;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  revocationStatus: AddressCommunicationRevocationStatus;
  revocationRef?: string;
  auditRef?: string;
  signaturePresent: boolean;
  proofBundle: AddressProofBundleSummary;
  replyPolicy: AddressCommunicationReplyPolicy;
  privateMaterial: AddressCommunicationPrivateMaterialFlags;
};

export type AddressCommunicationPolicy = {
  purpose: string;
  audienceRole: AddressCommunicationRole;
  allowedPayloadTypes: AddressCommunicationPayloadType[];
  requiredClaims: AddressCommunicationClaim[];
  maxDisclosure: AddressDisclosureLevel;
  maxLeakScore: number;
  requiresSignature: boolean;
  requiresAuditRef: boolean;
  requiresRevocationRef: boolean;
  allowsDisputed: boolean;
  allowsPartial: boolean;
  maxRetentionDays: number;
};

export type AddressReceiverCapability = {
  receiverRole: AddressCommunicationRole;
  acceptedPayloadTypes: AddressCommunicationPayloadType[];
  maxDisclosure: AddressDisclosureLevel;
  supportedProofTypes: AddressProofBundleSummary['proofType'][];
  supportedAckStates: AddressCommunicationAckState[];
  maxRetentionDays: number;
  canDecryptCarrierPayload: boolean;
  canVerifyZkReadyProof: boolean;
  canStoreAuditRef: boolean;
};

export type AddressCommunicationDecision = {
  state: AddressCommunicationDecisionState;
  semanticAck: AddressCommunicationAckState;
  reasons: string[];
  safeFactsForReceiver: string[];
  nonClaims: string[];
};

export const ADDRESS_DISCLOSURE_ORDER: Record<AddressDisclosureLevel, number> = {
  none: 0,
  proofOnly: 1,
  country: 2,
  region: 3,
  postalEquivalent: 4,
  encryptedAddress: 5,
  carrierDecryptable: 6,
  rawAddress: 7,
};

const PRIVATE_MATERIAL_KEYS = [
  'rawAddress',
  'recipient',
  'witness',
  'privateKey',
  'proofSecret',
  'privateVerticalUnit',
  'preciseCoordinates',
] as const;

export function buildAddressCommunicationSemanticsReport() {
  return {
    version: ADDRESS_MORPHISM_V2_COMMUNICATION_SEMANTICS_VERSION,
    modelKinds: [
      'Address Communication Object',
      'receiver capability negotiation',
      'semantic ACK state machine',
      'leakage-bounded communication',
      'revocation-aware message validity',
      'no-private-material payload gate',
      'proof/signature/audit binding',
      'purpose/audience policy gate',
      'communication non-claim boundary',
    ],
    centralClaim:
      'An address can be communicated as a purpose-scoped, evidence-backed, least-disclosure message object without transmitting the raw address by default.',
  };
}

export function evaluateAddressCommunicationObject(
  message: AddressCommunicationObject,
  policy: AddressCommunicationPolicy,
  receiver: AddressReceiverCapability,
  nowIso = message.issuedAt,
): AddressCommunicationDecision {
  const reasons: string[] = [];

  if (message.purpose !== policy.purpose) reasons.push('purpose-mismatch');
  if (message.audienceRole !== policy.audienceRole) reasons.push('audience-role-mismatch');
  if (receiver.receiverRole !== message.audienceRole) reasons.push('receiver-role-mismatch');

  if (!policy.allowedPayloadTypes.includes(message.payloadType)) reasons.push('payload-not-allowed-by-policy');
  if (!receiver.acceptedPayloadTypes.includes(message.payloadType)) reasons.push('payload-not-supported-by-receiver');
  if (!receiver.supportedProofTypes.includes(message.proofBundle.proofType)) {
    reasons.push('proof-type-not-supported-by-receiver');
  }

  for (const claim of policy.requiredClaims) {
    if (!message.claimSet.includes(claim)) reasons.push(`required-claim-missing:${claim}`);
  }

  if (compareAddressDisclosure(message.disclosureLevel, policy.maxDisclosure) > 0) {
    reasons.push('disclosure-exceeds-policy');
  }
  if (compareAddressDisclosure(message.disclosureLevel, receiver.maxDisclosure) > 0) {
    reasons.push('disclosure-exceeds-receiver-capability');
  }
  if (message.leakScore > policy.maxLeakScore) reasons.push('leak-score-exceeds-policy');

  if (policy.requiresSignature && !message.signaturePresent) reasons.push('signature-required');
  if (policy.requiresAuditRef && !message.auditRef) reasons.push('audit-ref-required');
  if (policy.requiresRevocationRef && !message.revocationRef) reasons.push('revocation-ref-required');
  if (policy.requiresAuditRef && !receiver.canStoreAuditRef) reasons.push('receiver-cannot-store-audit-ref');

  if (message.revocationStatus === 'revoked') reasons.push('message-revoked');
  if (message.revocationStatus === 'unknown' && policy.requiresRevocationRef) reasons.push('revocation-status-unknown');

  if (message.envelopeState === 'blocked' || message.envelopeState === 'unresolved') {
    reasons.push('envelope-state-not-communicable');
  }
  if (message.envelopeState === 'ambiguous') reasons.push('envelope-ambiguous-manual-review-required');
  if (message.envelopeState === 'deprecated' && !message.claimSet.includes('successor_known')) {
    reasons.push('deprecated-envelope-needs-successor');
  }
  if (message.envelopeState === 'disputed' && !policy.allowsDisputed) {
    reasons.push('disputed-envelope-not-allowed');
  }
  if (message.envelopeState === 'partial' && !policy.allowsPartial) {
    reasons.push('partial-envelope-not-allowed');
  }

  if (!isFreshMessage(message, nowIso)) reasons.push('message-expired');
  if (!isNonceSafe(message.nonce)) reasons.push('nonce-insufficient');

  const privateMaterialErrors = validateNoPrivateMaterialInCommunication(message);
  reasons.push(...privateMaterialErrors);

  if (message.payloadType === 'carrier-token' || message.payloadType === 'encrypted-address') {
    if (!receiver.canDecryptCarrierPayload) reasons.push('receiver-cannot-decrypt-carrier-payload');
  }
  if (message.proofBundle.proofType === 'zk-ready' && !receiver.canVerifyZkReadyProof) {
    reasons.push('receiver-cannot-verify-zk-ready-proof');
  }
  if (message.proofBundle.storesWitness) reasons.push('proof-bundle-must-not-store-witness');
  if (message.proofBundle.storesPrivateKey) reasons.push('proof-bundle-must-not-store-private-key');
  if (message.proofBundle.storesRawAddress) reasons.push('proof-bundle-must-not-store-raw-address');

  if (message.replyPolicy.requiresAck && message.replyPolicy.acceptedAckStates.length === 0) {
    reasons.push('ack-required-but-no-accepted-state');
  }
  if (message.replyPolicy.timeoutMs <= 0) reasons.push('ack-timeout-invalid');
  if (message.replyPolicy.retryLimit < 0) reasons.push('ack-retry-limit-invalid');

  if (reasons.length > 0) {
    return {
      state: 'blocked',
      semanticAck: chooseBlockedAck(reasons),
      reasons,
      safeFactsForReceiver: [],
      nonClaims: communicationNonClaims(),
    };
  }

  if (message.envelopeState === 'partial' || message.envelopeState === 'disputed' || message.envelopeState === 'deprecated') {
    return {
      state: 'limited',
      semanticAck: choosePositiveAck(message),
      reasons: [],
      safeFactsForReceiver: safeFactsForReceiver(message),
      nonClaims: communicationNonClaims(),
    };
  }

  return {
    state: 'valid',
    semanticAck: choosePositiveAck(message),
    reasons: [],
    safeFactsForReceiver: safeFactsForReceiver(message),
    nonClaims: communicationNonClaims(),
  };
}

export function negotiateAddressCommunicationCapability(
  policy: AddressCommunicationPolicy,
  receiver: AddressReceiverCapability,
): {
  compatiblePayloadTypes: AddressCommunicationPayloadType[];
  maxMutualDisclosure: AddressDisclosureLevel;
  compatibleProofTypes: AddressProofBundleSummary['proofType'][];
  ackStates: AddressCommunicationAckState[];
  blockers: string[];
} {
  const compatiblePayloadTypes = policy.allowedPayloadTypes.filter(type => receiver.acceptedPayloadTypes.includes(type));
  const compatibleProofTypes = receiver.supportedProofTypes.filter(type => type !== 'none');
  const ackStates = receiver.supportedAckStates.filter(state =>
    ['received', 'parsed', 'referent_accepted', 'deliverable', 'proof_verified', 'manual_review_required'].includes(state),
  );
  const blockers: string[] = [];

  if (compatiblePayloadTypes.length === 0) blockers.push('no-compatible-payload-type');
  if (compareAddressDisclosure(receiver.maxDisclosure, policy.maxDisclosure) < 0 && policy.maxDisclosure === 'rawAddress') {
    blockers.push('receiver-refuses-required-raw-disclosure');
  }
  if (policy.requiresAuditRef && !receiver.canStoreAuditRef) blockers.push('audit-ref-not-supported');

  return {
    compatiblePayloadTypes,
    maxMutualDisclosure: minDisclosure(policy.maxDisclosure, receiver.maxDisclosure),
    compatibleProofTypes,
    ackStates,
    blockers,
  };
}

export function validateNoPrivateMaterialInCommunication(message: AddressCommunicationObject): string[] {
  const errors: string[] = [];

  for (const key of PRIVATE_MATERIAL_KEYS) {
    if (message.privateMaterial[key]) errors.push(`private-material-present:${key}`);
  }

  if (message.disclosureLevel === 'rawAddress') errors.push('raw-address-disclosure-not-communication-default');
  if (message.proofBundle.publicSignals.some(signal => /raw|recipient|witness|private|unit|phone|precise/i.test(signal))) {
    errors.push('public-signal-name-suggests-private-material');
  }

  return errors;
}

export function isFreshMessage(message: Pick<AddressCommunicationObject, 'issuedAt' | 'expiresAt'>, nowIso: string): boolean {
  const issued = Date.parse(message.issuedAt);
  const expires = Date.parse(message.expiresAt);
  const now = Date.parse(nowIso);

  if (!Number.isFinite(issued) || !Number.isFinite(expires) || !Number.isFinite(now)) return false;
  return issued <= now && now < expires;
}

export function isNonceSafe(nonce: string): boolean {
  return /^[a-zA-Z0-9:_-]{12,}$/.test(nonce);
}

export function compareAddressDisclosure(left: AddressDisclosureLevel, right: AddressDisclosureLevel): number {
  return ADDRESS_DISCLOSURE_ORDER[left] - ADDRESS_DISCLOSURE_ORDER[right];
}

export function communicationNonClaims(): string[] {
  return [
    'Address communication is not raw address broadcast.',
    'A semantic ACK is not proof of residence, ownership, or sovereignty.',
    'Deliverability acceptance is not identity verification.',
    'Encrypted carrier delivery is not merchant disclosure.',
    'Auditability must not reconstruct private address material.',
    'A valid message cannot repair bad AMT resolution.',
  ];
}

export function buildSyntheticCommunicationFixtures(): {
  merchantProofOnly: AddressCommunicationObject;
  carrierDecryptable: AddressCommunicationObject;
  unsafeRawLeak: AddressCommunicationObject;
  merchantPolicy: AddressCommunicationPolicy;
  carrierPolicy: AddressCommunicationPolicy;
  merchantReceiver: AddressReceiverCapability;
  carrierReceiver: AddressReceiverCapability;
} {
  const base: AddressCommunicationObject = {
    version: ADDRESS_MORPHISM_V2_COMMUNICATION_SEMANTICS_VERSION,
    messageId: 'msg_delivery_proof_001',
    threadId: 'thread_delivery_001',
    envelopeVersion: 'amt-envelope-v0.1',
    envelopeState: 'verified',
    senderRole: 'subject',
    audienceRole: 'merchant',
    purpose: 'delivery',
    payloadType: 'proof',
    claimSet: ['referent_commitment_present', 'within_delivery_zone', 'quality_verified', 'freshness_ok', 'not_revoked'],
    disclosureLevel: 'proofOnly',
    leakScore: 0.04,
    issuedAt: '2026-07-02T00:00:00.000Z',
    expiresAt: '2026-07-03T00:00:00.000Z',
    nonce: 'nonce_delivery_001',
    revocationStatus: 'not_revoked',
    revocationRef: 'revocation-root:synthetic',
    auditRef: 'audit-ref:synthetic',
    signaturePresent: true,
    proofBundle: {
      proofType: 'zk-ready',
      publicSignals: ['within_delivery_zone', 'not_revoked'],
      roots: ['freshness-root:synthetic', 'revocation-root:synthetic'],
      storesWitness: false,
      storesPrivateKey: false,
      storesRawAddress: false,
    },
    replyPolicy: {
      requiresAck: true,
      acceptedAckStates: ['received', 'parsed', 'proof_verified', 'deliverable', 'rejected'],
      timeoutMs: 30_000,
      retryLimit: 2,
    },
    privateMaterial: {
      rawAddress: false,
      recipient: false,
      witness: false,
      privateKey: false,
      proofSecret: false,
      privateVerticalUnit: false,
      preciseCoordinates: false,
    },
  };

  const merchantPolicy: AddressCommunicationPolicy = {
    purpose: 'delivery',
    audienceRole: 'merchant',
    allowedPayloadTypes: ['proof', 'commitment', 'delivery-session'],
    requiredClaims: ['within_delivery_zone', 'not_revoked'],
    maxDisclosure: 'proofOnly',
    maxLeakScore: 0.15,
    requiresSignature: true,
    requiresAuditRef: true,
    requiresRevocationRef: true,
    allowsDisputed: false,
    allowsPartial: false,
    maxRetentionDays: 30,
  };

  const carrierPolicy: AddressCommunicationPolicy = {
    ...merchantPolicy,
    audienceRole: 'carrier',
    allowedPayloadTypes: ['carrier-token', 'encrypted-address', 'proof'],
    requiredClaims: ['carrier_decryptable', 'not_revoked'],
    maxDisclosure: 'carrierDecryptable',
    maxLeakScore: 0.35,
    maxRetentionDays: 7,
  };

  const merchantReceiver: AddressReceiverCapability = {
    receiverRole: 'merchant',
    acceptedPayloadTypes: ['proof', 'commitment', 'delivery-session'],
    maxDisclosure: 'proofOnly',
    supportedProofTypes: ['signature', 'zk-ready', 'selective-disclosure'],
    supportedAckStates: ['received', 'parsed', 'proof_verified', 'deliverable', 'rejected', 'policy_mismatch'],
    maxRetentionDays: 30,
    canDecryptCarrierPayload: false,
    canVerifyZkReadyProof: true,
    canStoreAuditRef: true,
  };

  const carrierReceiver: AddressReceiverCapability = {
    receiverRole: 'carrier',
    acceptedPayloadTypes: ['carrier-token', 'encrypted-address', 'proof'],
    maxDisclosure: 'carrierDecryptable',
    supportedProofTypes: ['signature', 'zk-ready', 'carrier-encryption', 'hybrid'],
    supportedAckStates: ['received', 'parsed', 'referent_accepted', 'deliverable', 'rejected', 'revoked'],
    maxRetentionDays: 7,
    canDecryptCarrierPayload: true,
    canVerifyZkReadyProof: true,
    canStoreAuditRef: true,
  };

  const carrierDecryptable: AddressCommunicationObject = {
    ...base,
    messageId: 'msg_carrier_token_001',
    audienceRole: 'carrier',
    payloadType: 'carrier-token',
    claimSet: ['referent_commitment_present', 'carrier_decryptable', 'freshness_ok', 'not_revoked'],
    disclosureLevel: 'carrierDecryptable',
    leakScore: 0.2,
    proofBundle: {
      proofType: 'carrier-encryption',
      publicSignals: ['carrier_decryptable', 'not_revoked'],
      roots: ['freshness-root:synthetic', 'revocation-root:synthetic'],
      storesWitness: false,
      storesPrivateKey: false,
      storesRawAddress: false,
    },
  };

  const unsafeRawLeak: AddressCommunicationObject = {
    ...base,
    messageId: 'msg_unsafe_raw_leak_001',
    disclosureLevel: 'rawAddress',
    leakScore: 1,
    proofBundle: {
      ...base.proofBundle,
      publicSignals: ['raw_address_hint', 'within_delivery_zone'],
      storesRawAddress: true,
    },
    privateMaterial: {
      ...base.privateMaterial,
      rawAddress: true,
      recipient: true,
    },
  };

  return {
    merchantProofOnly: base,
    carrierDecryptable,
    unsafeRawLeak,
    merchantPolicy,
    carrierPolicy,
    merchantReceiver,
    carrierReceiver,
  };
}

function minDisclosure(left: AddressDisclosureLevel, right: AddressDisclosureLevel): AddressDisclosureLevel {
  return compareAddressDisclosure(left, right) <= 0 ? left : right;
}

function chooseBlockedAck(reasons: string[]): AddressCommunicationAckState {
  if (reasons.includes('message-expired')) return 'expired';
  if (reasons.includes('message-revoked') || reasons.includes('revocation-status-unknown')) return 'revoked';
  if (reasons.includes('envelope-ambiguous-manual-review-required')) return 'manual_review_required';
  if (reasons.some(reason => reason.includes('disclosure') || reason.includes('private-material'))) {
    return 'disclosure_denied';
  }
  if (reasons.some(reason => reason.includes('policy') || reason.includes('purpose') || reason.includes('audience'))) {
    return 'policy_mismatch';
  }
  return 'rejected';
}

function choosePositiveAck(message: AddressCommunicationObject): AddressCommunicationAckState {
  if (message.payloadType === 'proof') return 'proof_verified';
  if (message.payloadType === 'carrier-token' || message.payloadType === 'encrypted-address') return 'deliverable';
  if (message.payloadType === 'commitment' || message.payloadType === 'successor-pointer') return 'referent_accepted';
  return 'parsed';
}

function safeFactsForReceiver(message: AddressCommunicationObject): string[] {
  return message.claimSet.map(claim => `claim:${claim}`).concat([
    `payload:${message.payloadType}`,
    `disclosure:${message.disclosureLevel}`,
    `envelope:${message.envelopeState}`,
  ]);
}

