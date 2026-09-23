import type {
  AddressTabEnvironment,
  AddressTabQualityDecision,
  AddressTabQualityScore,
  AddressTabQualityTier,
} from './addressTabQuality';
import { qualityThresholdSatisfied } from './zkProofRuntime';

export const QUALITY_THRESHOLD_PROOF_VERSION = 'quality-threshold-proof-v1';
export const QUALITY_THRESHOLD_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const QUALITY_THRESHOLD_COMMITMENT_ALGORITHM = 'sha256-salted-quality-threshold-v1';

export type QualityThresholdSubjectKind =
  | 'address-tab'
  | 'address-credential'
  | 'pid-decision'
  | 'search-result'
  | 'map-feature'
  | 'agid'
  | 'aoid';

export type QualityThresholdPurpose =
  | 'display'
  | 'delivery'
  | 'registration'
  | 'shipping'
  | 'audit'
  | 'quality-assistance'
  | 'emergency';

export type QualityThresholdPrivacyField =
  | 'exact-score'
  | 'quality-components'
  | 'quality-reasons'
  | 'raw-validation'
  | 'raw-sources'
  | 'display-text'
  | 'address'
  | 'subject-id'
  | 'aoid'
  | 'agid'
  | 'pid'
  | 'proof-salt';

export type QualityThresholdProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'hidden-quality-score-meets-public-threshold';
};

export type QualityThresholdScoreInput = {
  score: number;
  tab?: string;
  tier?: AddressTabQualityTier | string;
  decision?: AddressTabQualityDecision | string;
  environment?: AddressTabEnvironment;
  components?: unknown;
  reasons?: readonly string[];
  sourceIds?: readonly string[];
  policyVersion?: string;
};

export type QualityThresholdRawEvidence = {
  displayText?: string;
  addressText?: string;
  validation?: unknown;
  sourceIds?: readonly string[];
  mapFeature?: unknown;
  history?: unknown;
};

export type QualityThresholdClaim = {
  version: typeof QUALITY_THRESHOLD_PROOF_VERSION;
  workflowVersion: 'address-quality-threshold-v1';
  scope: string;
  challengeHash: string;
  issuedAt: string;
  expiresAt: string;
  subject: {
    kind: QualityThresholdSubjectKind;
    commitment: string;
  };
  predicate: {
    kind: 'score-gte-threshold';
    threshold: number;
    unit: 'percent';
    satisfied: true;
    purpose: QualityThresholdPurpose;
  };
  quality: {
    environment: AddressTabEnvironment | 'unknown';
    scoreHidden: true;
    componentsHidden: true;
    reasonsHidden: true;
    policyVersion?: string;
  };
  commitments: {
    scoreWitnessCommitment: string;
    qualityEvidenceCommitment: string;
    thresholdPolicyCommitment: string;
  };
  privacy: {
    hides: QualityThresholdPrivacyField[];
    reveals: Array<
      | 'subject-kind'
      | 'subject-commitment'
      | 'threshold'
      | 'predicate-result'
      | 'purpose'
      | 'scope'
      | 'environment'
      | 'challenge-hash'
      | 'commitments'
      | 'issuer'
    >;
  };
  proofHint: QualityThresholdProofHint;
};

export type QualityThresholdSignature = {
  algorithm: typeof QUALITY_THRESHOLD_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type QualityThresholdProofEnvelope = {
  claim: QualityThresholdClaim;
  signature: QualityThresholdSignature;
  privateProofSalt?: string;
  localCacheKey?: string;
};

export type CreateQualityThresholdProofInput = {
  issuerId: string;
  issuerSecret: string;
  subjectKind: QualityThresholdSubjectKind;
  subjectId?: string;
  quality: AddressTabQualityScore | QualityThresholdScoreInput;
  threshold: number;
  scoreScale?: 'percent' | 'unit';
  purpose?: QualityThresholdPurpose;
  scope?: string;
  challenge?: string;
  issuedAt?: Date | string;
  ttlSeconds?: number;
  privateProofSalt?: string;
  rawEvidence?: QualityThresholdRawEvidence;
};

export type VerifyQualityThresholdProofOptions = {
  issuerId?: string;
  issuerSecret?: string;
  expectedSubjectKind?: QualityThresholdSubjectKind;
  expectedPurpose?: QualityThresholdPurpose;
  expectedScope?: string;
  expectedChallenge?: string;
  minimumThreshold?: number;
  maximumThreshold?: number;
  now?: Date | string;
};

export type QualityThresholdProofVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  expired: boolean;
  thresholdSatisfied: boolean;
  privacyPreserved: boolean;
  proofCost: 'none';
  errors: string[];
  warnings: string[];
};

const textEncoder = new TextEncoder();
const DEFAULT_TTL_SECONDS = 600;

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for quality threshold proofs.');
  }
  return cryptoApi;
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFKC')
    .replace(/[\u3000\s]+/g, ' ')
    .trim();
}

function normalizeToken(value: unknown) {
  return normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9:_.*/-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeScope(value: unknown) {
  return normalizeToken(value || 'ADDRESS-QUALITY-THRESHOLD');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  if (value instanceof Date) return JSON.stringify(value.toISOString());

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter(key => record[key] !== undefined).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function bytesToBase64Url(bytes: Uint8Array) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }

  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function base64UrlToBytes(value: string) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64url'));
  }

  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toIsoDate(value?: Date | string) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function addSeconds(isoDate: string, seconds: number) {
  return new Date(new Date(isoDate).getTime() + seconds * 1000).toISOString();
}

function generateRandomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeScore(value: number, scale?: 'percent' | 'unit') {
  if (!Number.isFinite(value)) throw new Error('Quality threshold proof score must be finite.');
  const inferredScale = scale || (value >= 0 && value <= 1 ? 'unit' : 'percent');
  const max = inferredScale === 'unit' ? 1 : 100;
  if (value < 0 || value > max) {
    throw new Error(`Quality threshold proof score must be between 0 and ${max}.`);
  }
  if (inferredScale === 'unit') return clampPercent(value * 100);
  return clampPercent(value);
}

function normalizeThreshold(value: number, scale?: 'percent' | 'unit') {
  if (!Number.isFinite(value)) throw new Error('Quality threshold proof threshold must be finite.');
  const inferredScale = scale || (value >= 0 && value <= 1 ? 'unit' : 'percent');
  const max = inferredScale === 'unit' ? 1 : 100;
  if (value < 0 || value > max) {
    throw new Error(`Quality threshold proof threshold must be between 0 and ${max}.`);
  }
  if (inferredScale === 'unit') return clampPercent(value * 100);
  return clampPercent(value);
}

function normalizeEnvironment(value: unknown): AddressTabEnvironment | 'unknown' {
  const normalized = normalizeText(value).toLowerCase();
  if (
    normalized === 'urban' ||
    normalized === 'rural' ||
    normalized === 'island' ||
    normalized === 'remote' ||
    normalized === 'polar' ||
    normalized === 'water' ||
    normalized === 'mountain' ||
    normalized === 'desert' ||
    normalized === 'sparse_natural' ||
    normalized === 'unknown'
  ) {
    return normalized;
  }
  return 'unknown';
}

function qualityPolicyVersion(quality: AddressTabQualityScore | QualityThresholdScoreInput) {
  if ('policyVersion' in quality && quality.policyVersion) return normalizeText(quality.policyVersion);
  return undefined;
}

async function sha256Base64Url(value: string) {
  const digest = await getCrypto().subtle.digest('SHA-256', textEncoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function hmacSha256Base64Url(secret: string, payload: string) {
  const key = await getCrypto().subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await getCrypto().subtle.sign('HMAC', key, textEncoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.byteLength !== right.byteLength) return false;
  let diff = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

async function verifyHmacSha256(secret: string, payload: string, expected: string) {
  const actual = await hmacSha256Base64Url(secret, payload);
  return constantTimeEqual(base64UrlToBytes(actual), base64UrlToBytes(expected));
}

async function challengeHash(challenge: string) {
  return sha256Base64Url(`quality-threshold-challenge:${challenge}`);
}

function signingPayload(claim: QualityThresholdClaim) {
  return `${QUALITY_THRESHOLD_PROOF_VERSION}.${stableStringify(claim)}`;
}

async function subjectCommitment({
  subjectKind,
  subjectId,
  scope,
  salt,
}: {
  subjectKind: QualityThresholdSubjectKind;
  subjectId: string;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: QUALITY_THRESHOLD_COMMITMENT_ALGORITHM,
    subjectKind,
    subjectId,
    scope,
    salt,
  }));
}

async function scoreWitnessCommitment({
  quality,
  normalizedScore,
  threshold,
  scope,
  salt,
}: {
  quality: AddressTabQualityScore | QualityThresholdScoreInput;
  normalizedScore: number;
  threshold: number;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: QUALITY_THRESHOLD_COMMITMENT_ALGORITHM,
    score: normalizedScore,
    threshold,
    tab: 'tab' in quality ? normalizeText(quality.tab) : '',
    tier: 'tier' in quality ? normalizeText(quality.tier) : '',
    decision: 'decision' in quality ? normalizeText(quality.decision) : '',
    environment: normalizeEnvironment(quality.environment),
    scope,
    salt,
  }));
}

async function qualityEvidenceCommitment({
  quality,
  rawEvidence,
  scope,
  salt,
}: {
  quality: AddressTabQualityScore | QualityThresholdScoreInput;
  rawEvidence?: QualityThresholdRawEvidence;
  scope: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: QUALITY_THRESHOLD_COMMITMENT_ALGORITHM,
    components: 'components' in quality ? quality.components : undefined,
    reasons: 'reasons' in quality ? quality.reasons : undefined,
    sourceIds: [
      ...(('sourceIds' in quality && quality.sourceIds) ? Array.from(quality.sourceIds) : []),
      ...(rawEvidence?.sourceIds ? Array.from(rawEvidence.sourceIds) : []),
    ].map(normalizeText).filter(Boolean).sort(),
    displayText: rawEvidence?.displayText,
    addressText: rawEvidence?.addressText,
    validation: rawEvidence?.validation,
    mapFeature: rawEvidence?.mapFeature,
    history: rawEvidence?.history,
    scope,
    salt,
  }));
}

async function thresholdPolicyCommitment({
  subjectKind,
  threshold,
  purpose,
  scope,
  policyVersion,
  salt,
}: {
  subjectKind: QualityThresholdSubjectKind;
  threshold: number;
  purpose: QualityThresholdPurpose;
  scope: string;
  policyVersion?: string;
  salt: string;
}) {
  return sha256Base64Url(stableStringify({
    algorithm: QUALITY_THRESHOLD_COMMITMENT_ALGORITHM,
    subjectKind,
    threshold,
    unit: 'percent',
    purpose,
    scope,
    policyVersion,
    salt,
  }));
}

export async function createQualityThresholdProof(
  input: CreateQualityThresholdProofInput
): Promise<QualityThresholdProofEnvelope> {
  const scope = normalizeScope(input.scope);
  const challenge = normalizeText(input.challenge || '');
  const purpose = input.purpose || 'display';
  const issuedAt = toIsoDate(input.issuedAt);
  const ttlSeconds = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const expiresAt = addSeconds(issuedAt, ttlSeconds);
  const privateProofSalt = input.privateProofSalt || generateRandomToken();
  const subjectId = normalizeText(input.subjectId || 'unbound-quality-subject');
  const normalizedScore = normalizeScore(input.quality.score, input.scoreScale);
  const threshold = normalizeThreshold(input.threshold, input.scoreScale);

  if (ttlSeconds <= 0) throw new Error('Quality threshold proof ttlSeconds must be positive.');
  if (threshold < 0 || threshold > 100) throw new Error('Quality threshold proof threshold must be between 0 and 100.');
  if (!qualityThresholdSatisfied(normalizedScore, threshold).satisfied) {
    throw new Error('Quality threshold proof cannot be issued because the hidden score is below the quality threshold.');
  }

  const policyVersion = qualityPolicyVersion(input.quality);
  const claim: QualityThresholdClaim = {
    version: QUALITY_THRESHOLD_PROOF_VERSION,
    workflowVersion: 'address-quality-threshold-v1',
    scope,
    challengeHash: await challengeHash(challenge),
    issuedAt,
    expiresAt,
    subject: {
      kind: input.subjectKind,
      commitment: await subjectCommitment({
        subjectKind: input.subjectKind,
        subjectId,
        scope,
        salt: privateProofSalt,
      }),
    },
    predicate: {
      kind: 'score-gte-threshold',
      threshold,
      unit: 'percent',
      satisfied: true,
      purpose,
    },
    quality: {
      environment: normalizeEnvironment(input.quality.environment),
      scoreHidden: true,
      componentsHidden: true,
      reasonsHidden: true,
      ...(policyVersion ? { policyVersion } : {}),
    },
    commitments: {
      scoreWitnessCommitment: await scoreWitnessCommitment({
        quality: input.quality,
        normalizedScore,
        threshold,
        scope,
        salt: privateProofSalt,
      }),
      qualityEvidenceCommitment: await qualityEvidenceCommitment({
        quality: input.quality,
        rawEvidence: input.rawEvidence,
        scope,
        salt: privateProofSalt,
      }),
      thresholdPolicyCommitment: await thresholdPolicyCommitment({
        subjectKind: input.subjectKind,
        threshold,
        purpose,
        scope,
        policyVersion,
        salt: privateProofSalt,
      }),
    },
    privacy: {
      hides: [
        'exact-score',
        'quality-components',
        'quality-reasons',
        'raw-validation',
        'raw-sources',
        'display-text',
        'address',
        'subject-id',
        'aoid',
        'agid',
        'pid',
        'proof-salt',
      ],
      reveals: [
        'subject-kind',
        'subject-commitment',
        'threshold',
        'predicate-result',
        'purpose',
        'scope',
        'environment',
        'challenge-hash',
        'commitments',
        'issuer',
      ],
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'hidden-quality-score-meets-public-threshold',
    },
  };

  return {
    claim,
    privateProofSalt,
    localCacheKey: `quality-threshold:${await sha256Base64Url(stableStringify({
      issuerId: input.issuerId,
      subjectKind: input.subjectKind,
      subjectCommitment: claim.subject.commitment,
      threshold,
      purpose,
      scope,
      challengeHash: claim.challengeHash,
    }))}`,
    signature: {
      algorithm: QUALITY_THRESHOLD_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, signingPayload(claim)),
    },
  };
}

export function stripPrivateQualityThresholdProofMaterial(
  envelope: QualityThresholdProofEnvelope
): Omit<QualityThresholdProofEnvelope, 'privateProofSalt' | 'localCacheKey'> {
  return {
    claim: envelope.claim,
    signature: envelope.signature,
  };
}

async function verifyQualityThresholdProofUnchecked(
  envelope: QualityThresholdProofEnvelope,
  options: VerifyQualityThresholdProofOptions = {}
): Promise<QualityThresholdProofVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const claim = envelope.claim;

  if (claim.version !== QUALITY_THRESHOLD_PROOF_VERSION) errors.push('unsupported-quality-threshold-proof-version');
  if (claim.workflowVersion !== 'address-quality-threshold-v1') errors.push('unsupported-quality-threshold-workflow');
  if (envelope.signature.algorithm !== QUALITY_THRESHOLD_SIGNATURE_ALGORITHM) {
    errors.push('unsupported-signature-algorithm');
  }
  if (options.issuerId && options.issuerId !== envelope.signature.issuerId) errors.push('issuer-mismatch');
  if (options.expectedSubjectKind && options.expectedSubjectKind !== claim.subject.kind) errors.push('subject-kind-mismatch');
  if (options.expectedPurpose && options.expectedPurpose !== claim.predicate.purpose) errors.push('purpose-mismatch');
  if (options.expectedScope && normalizeScope(options.expectedScope) !== claim.scope) errors.push('scope-mismatch');
  if (options.expectedChallenge && await challengeHash(options.expectedChallenge) !== claim.challengeHash) {
    errors.push('challenge-mismatch');
  }
  if (options.minimumThreshold !== undefined && claim.predicate.threshold < normalizeThreshold(options.minimumThreshold)) {
    errors.push('threshold-too-low');
  }
  if (options.maximumThreshold !== undefined && claim.predicate.threshold > normalizeThreshold(options.maximumThreshold)) {
    errors.push('threshold-too-high');
  }
  if (claim.predicate.kind !== 'score-gte-threshold') errors.push('unsupported-quality-predicate');
  if (claim.predicate.unit !== 'percent') errors.push('unsupported-quality-threshold-unit');
  if (claim.predicate.threshold < 0 || claim.predicate.threshold > 100) errors.push('threshold-out-of-range');

  const thresholdSatisfied = claim.predicate.satisfied === true;
  if (!thresholdSatisfied) errors.push('threshold-not-satisfied');
  if (!claim.quality.scoreHidden) errors.push('quality-score-not-hidden');
  if (!claim.quality.componentsHidden) errors.push('quality-components-not-hidden');
  if (!claim.quality.reasonsHidden) errors.push('quality-reasons-not-hidden');

  const now = options.now ? new Date(options.now) : new Date();
  const issuedAt = new Date(claim.issuedAt);
  const expiresAt = new Date(claim.expiresAt);
  const expired = expiresAt.getTime() <= now.getTime();
  if (expired) errors.push('quality-threshold-proof-expired');
  if (issuedAt.getTime() > now.getTime() + 30_000) errors.push('quality-threshold-proof-issued-in-future');
  if (expiresAt.getTime() <= issuedAt.getTime()) errors.push('quality-threshold-proof-window-invalid');

  let signatureValid: boolean | null = null;
  if (options.issuerSecret) {
    signatureValid = await verifyHmacSha256(options.issuerSecret, signingPayload(claim), envelope.signature.value);
    if (!signatureValid) errors.push('signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  const publicEnvelope = stripPrivateQualityThresholdProofMaterial(envelope);
  const publicText = stableStringify(publicEnvelope);
  const privacyPreserved = !('privateProofSalt' in envelope)
    && !('localCacheKey' in envelope)
    && !('privateProofSalt' in publicEnvelope)
    && !('localCacheKey' in publicEnvelope)
    && !publicText.includes('"privateProofSalt"')
    && !publicText.includes('"localCacheKey"')
    && !publicText.includes('"components"')
    && !publicText.includes('"reasons"')
    && !publicText.includes('"rawEvidence"')
    && !publicText.includes('"rawSources"')
    && !/"(?:score|exactScore|displayText|addressText|subjectId|aoid|agid|pid|privateSalt|privateProofSalt)"\s*:/iu.test(publicText)
    && claim.privacy.hides.includes('exact-score')
    && claim.privacy.hides.includes('quality-components')
    && claim.privacy.hides.includes('quality-reasons')
    && claim.privacy.hides.includes('raw-validation')
    && claim.privacy.hides.includes('raw-sources')
    && claim.privacy.hides.includes('display-text')
    && claim.privacy.hides.includes('address')
    && claim.privacy.hides.includes('subject-id')
    && claim.privacy.hides.includes('proof-salt');
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  return {
    valid: errors.length === 0 && signatureValid === true && thresholdSatisfied && !expired,
    signatureValid,
    expired,
    thresholdSatisfied,
    privacyPreserved,
    proofCost: 'none',
    errors,
    warnings,
  };
}

export async function verifyQualityThresholdProof(
  envelope: QualityThresholdProofEnvelope,
  options: VerifyQualityThresholdProofOptions = {}
): Promise<QualityThresholdProofVerificationResult> {
  try {
    return await verifyQualityThresholdProofUnchecked(envelope, options);
  } catch {
    return {
      valid: false,
      signatureValid: null,
      expired: false,
      thresholdSatisfied: false,
      privacyPreserved: false,
      proofCost: 'none',
      errors: ['malformed-quality-threshold-proof'],
      warnings: ['verification-runtime-guarded'],
    };
  }
}
