export const ADDRESS_MORPHISM_V2_CHAPTER11_PROTOCOL_PRIVACY_VERSION =
  'address-morphism-v2-chapter11-protocol-privacy-v0.1';

export type Chapter11EnvelopeState =
  | 'verified'
  | 'partial'
  | 'ambiguous'
  | 'unresolved'
  | 'deprecated'
  | 'disputed'
  | 'blocked';

export type Chapter11Predicate =
  | 'within_delivery_zone'
  | 'quality_verified'
  | 'freshness_ok'
  | 'not_revoked'
  | 'consent_scope_delivery'
  | 'postal_equivalent'
  | 'country_membership'
  | 'carrier_decrypt';

export type Chapter11Role =
  | 'subject'
  | 'issuer'
  | 'resolver'
  | 'verifier'
  | 'carrier'
  | 'merchant'
  | 'auditor'
  | 'registry'
  | 'governance'
  | 'emergency_authority';

export type Chapter11DisclosureLevel = 'none' | 'proofOnly' | 'country' | 'region' | 'encryptedAddress' | 'rawAddress';

export type Chapter11ProofDecisionState = 'allowed' | 'limited' | 'blocked';

export type Chapter11Envelope = {
  version: string;
  referentCommitment: string;
  pidCommitment: string;
  sourceSetVersion: string;
  qualityState: 'verified' | 'partial' | 'unknown';
  resolutionState: Chapter11EnvelopeState;
  lineageRoot: string;
  freshnessRoot: string;
  revocationRoot?: string;
  allowedPredicates: Chapter11Predicate[];
};

export type Chapter11VerifierPolicy = {
  role: Chapter11Role;
  purpose: string;
  allowedPredicates: Chapter11Predicate[];
  maxDisclosure: Chapter11DisclosureLevel;
  maxLeakScore: number;
  retentionDays: number;
  requiresAudit: boolean;
  requiresRevocationRoot: boolean;
  allowDisputed: boolean;
};

export type Chapter11ProofRequest = {
  predicate: Chapter11Predicate;
  requestedDisclosure: Chapter11DisclosureLevel;
  publicSignalLeakScore: number;
  nullifierScope: {
    purposeScoped: boolean;
    verifierScoped: boolean;
    epochScoped: boolean;
  };
  auditReady: boolean;
};

export type Chapter11ProofDecision = {
  state: Chapter11ProofDecisionState;
  reasons: string[];
  disclosureAllowed: Chapter11DisclosureLevel;
  nonClaims: string[];
};

export type Chapter11AuditEvent = {
  actor: Chapter11Role;
  action: string;
  purpose: string;
  disclosureLevel: Chapter11DisclosureLevel;
  storesRawAddress: boolean;
  storesWitness: boolean;
  storesPrivateKey: boolean;
};

const DISCLOSURE_ORDER: Record<Chapter11DisclosureLevel, number> = {
  none: 0,
  proofOnly: 1,
  country: 2,
  region: 3,
  encryptedAddress: 4,
  rawAddress: 5,
};

export function buildChapter11ProtocolPrivacyReport() {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER11_PROTOCOL_PRIVACY_VERSION,
    executableModelKinds: [
      'AMT envelope schema',
      'envelope state guard',
      'ZK predicate boundary',
      'verifier policy matrix',
      'public signal leak gate',
      'scoped nullifier gate',
      'revocation root gate',
      'audit without raw address',
      'least disclosure rule',
      'Address Communication Object',
      'semantic ACK state machine',
      'receiver capability negotiation',
      'leakage-bounded communication',
      'neutral identifier non-claim',
      'ZK non-repair boundary',
    ],
    safetyRule:
      'AMT resolution is not cryptographic proof; proofs over AMT outputs require envelope state guards, scoped public signals, revocation, audit, and least disclosure.',
  };
}

export function evaluateChapter11ProofRequest(
  envelope: Chapter11Envelope,
  policy: Chapter11VerifierPolicy,
  request: Chapter11ProofRequest,
): Chapter11ProofDecision {
  const reasons: string[] = [];

  if (!isChapter11EnvelopeProofReady(envelope, policy)) {
    reasons.push('envelope-state-not-proof-ready');
  }
  if (!envelope.allowedPredicates.includes(request.predicate)) {
    reasons.push('predicate-not-in-envelope-allowlist');
  }
  if (!policy.allowedPredicates.includes(request.predicate)) {
    reasons.push('predicate-not-allowed-by-policy');
  }
  if (compareDisclosure(request.requestedDisclosure, policy.maxDisclosure) > 0) {
    reasons.push('disclosure-exceeds-policy');
  }
  if (request.publicSignalLeakScore > policy.maxLeakScore) {
    reasons.push('public-signal-leak-above-threshold');
  }
  if (
    !request.nullifierScope.purposeScoped ||
    !request.nullifierScope.verifierScoped ||
    !request.nullifierScope.epochScoped
  ) {
    reasons.push('nullifier-scope-insufficient');
  }
  if (policy.requiresRevocationRoot && !envelope.revocationRoot) {
    reasons.push('revocation-root-required');
  }
  if (policy.requiresAudit && !request.auditReady) {
    reasons.push('audit-required');
  }

  if (reasons.length > 0) {
    return decision('blocked', reasons, 'none');
  }

  if (envelope.resolutionState === 'partial' || envelope.resolutionState === 'disputed') {
    return decision('limited', [], request.requestedDisclosure);
  }

  return decision('allowed', [], request.requestedDisclosure);
}

export function isChapter11EnvelopeProofReady(
  envelope: Chapter11Envelope,
  policy: Pick<Chapter11VerifierPolicy, 'allowDisputed'>,
): boolean {
  if (envelope.resolutionState === 'verified' || envelope.resolutionState === 'partial') return true;
  if (envelope.resolutionState === 'disputed') return policy.allowDisputed;
  return false;
}

export function validateChapter11AuditEvent(event: Chapter11AuditEvent): string[] {
  const errors: string[] = [];
  if (event.storesRawAddress) errors.push('audit-must-not-store-raw-address');
  if (event.storesWitness) errors.push('audit-must-not-store-witness');
  if (event.storesPrivateKey) errors.push('audit-must-not-store-private-key');
  if (!event.action) errors.push('audit-action-required');
  if (!event.purpose) errors.push('audit-purpose-required');
  return errors;
}

export function chapter11LeastDisclosurePreferred(
  requested: Chapter11DisclosureLevel,
  sufficient: Chapter11DisclosureLevel,
): boolean {
  return compareDisclosure(sufficient, requested) <= 0;
}

export function chapter11ZkRepairsBadResolution(): false {
  return false;
}

export function chapter11IdentifierImpliesSovereignty(): false {
  return false;
}

function compareDisclosure(left: Chapter11DisclosureLevel, right: Chapter11DisclosureLevel): number {
  return DISCLOSURE_ORDER[left] - DISCLOSURE_ORDER[right];
}

function decision(
  state: Chapter11ProofDecisionState,
  reasons: string[],
  disclosureAllowed: Chapter11DisclosureLevel,
): Chapter11ProofDecision {
  return {
    state,
    reasons,
    disclosureAllowed,
    nonClaims: [
      'AMT envelope is not raw address disclosure',
      'ZK proof cannot repair bad AMT resolution',
      'AGID or PID is not a sovereignty claim',
      'audit does not justify raw address storage',
      'stable global nullifier is not unlinkable',
    ],
  };
}
