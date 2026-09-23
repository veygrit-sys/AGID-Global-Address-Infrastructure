export const ZK_PROOF_COMPATIBILITY_MANIFEST_VERSION = 'zk-proof-compatibility-manifest-v1';

export type ZkProofCompatibilityOptions = {
  expectedScope?: string;
  expectedChallengeHash?: string;
  expectedChallengeHashesByVersion?: Record<string, string>;
  requireSameScope?: boolean;
  requireSameChallenge?: boolean;
  requireCommonValidityWindow?: boolean;
  allowUnknownProofVersions?: boolean;
  allowDuplicateNullifiers?: boolean;
  allowSharedCommitments?: boolean;
  now?: Date | string;
};

export type ZkProofValueRole = 'nullifier' | 'commitment';
export type ZkProofNullifierUsage = 'single-use' | 'bucket' | 'other';

export type ZkProofValueReference = {
  proofIndex: number;
  proofVersion: string | null;
  role: ZkProofValueRole;
  usage: ZkProofNullifierUsage | 'commitment';
  path: string;
};

export type ZkProofDescriptor = {
  index: number;
  version: string | null;
  scope: string | null;
  challengeHash: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  issuerId: string | null;
  zkReady: boolean;
  zkpGenerated: boolean | null;
  privacyHides: string[];
  privacyReveals: string[];
  privateFieldPaths: string[];
  nullifierPaths: string[];
  commitmentPaths: string[];
};

export type ZkProofValidityWindow = {
  issuedAt: string | null;
  expiresAt: string | null;
  active: boolean;
};

export type ZkProofCompatibilityManifest = {
  version: typeof ZK_PROOF_COMPATIBILITY_MANIFEST_VERSION;
  proofVersions: string[];
  scopes: string[];
  challengeHashes: string[];
  collisionDomains: string[];
  commonValidityWindow: ZkProofValidityWindow;
};

export type ZkProofCompatibilityResult = {
  compatible: boolean;
  privacySafe: boolean;
  collisionFree: boolean;
  proofCount: number;
  commonValidityWindow: ZkProofValidityWindow;
  proofs: ZkProofDescriptor[];
  errors: string[];
  warnings: string[];
  manifest: ZkProofCompatibilityManifest;
};

type InternalProofDescriptor = ZkProofDescriptor & {
  nullifierRefs: Array<ZkProofValueReference & { value: string }>;
  commitmentRefs: Array<ZkProofValueReference & { value: string }>;
};

const KNOWN_PROOF_VERSIONS = new Set([
  'aoid-ownership-proof-v1',
  'consent-purpose-scope-proof-v1',
  'anonymous-rate-limit-proof-v1',
  'address-credential-freshness-proof-v1',
  'pid-lifecycle-proof-v1',
  'region-membership-proof-v1',
  'quality-threshold-proof-v1',
  'private-address-predicate-proof-v1',
  'address-credential-v1',
  'address-duplicate-nullifier-v1',
  'pid-issuance-audit-v1',
]);

const SCOPELESS_SUPPORT_PROOF_VERSIONS = new Set([
  'address-credential-v1',
]);

const PRIVATE_FIELD_NAMES = new Set([
  'privateProofSalt',
  'privateMembershipSalt',
  'privateLifecycleSalt',
  'privateAuditSalt',
  'privateSalt',
  'privateIdentityBindingSalt',
  'identitySubjectId',
  'identityPrivateSalt',
  'credentialPrivateSalt',
  'ownerPrivateKey',
  'ownerNullifierSecret',
  'privateKeyJwk',
  'localCacheKey',
  'rawEvidence',
  'rawCandidates',
  'rawClusters',
  'rawValidation',
  'rawSources',
  'inputAddress',
  'addressText',
  'subjectSecret',
  'deviceSecret',
  'ownerSecret',
  'userHistory',
]);

const PUBLIC_PROOF_VALUE_MIN_LENGTH = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeToken(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFKC')
    .replace(/[\u3000\s]+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9:_.*/-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stringOrNull(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseIsoDate(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function maxIso(values: string[]) {
  if (values.length === 0) return null;
  return values.reduce((max, value) => (value > max ? value : max), values[0]);
}

function minIso(values: string[]) {
  if (values.length === 0) return null;
  return values.reduce((min, value) => (value < min ? value : min), values[0]);
}

function uniqueSorted(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort();
}

function getClaim(proof: unknown) {
  if (isRecord(proof) && isRecord(proof.claim)) return proof.claim;
  return proof;
}

function getSignatureIssuer(proof: unknown) {
  if (!isRecord(proof) || !isRecord(proof.signature)) return null;
  return stringOrNull(proof.signature.issuerId);
}

function getPrivacy(claim: unknown) {
  if (!isRecord(claim) || !isRecord(claim.privacy)) {
    return { hides: [], reveals: [] };
  }

  const hides = Array.isArray(claim.privacy.hides)
    ? claim.privacy.hides.map(String)
    : [];
  const reveals = Array.isArray(claim.privacy.reveals)
    ? claim.privacy.reveals.map(String)
    : [];
  return { hides, reveals };
}

function getProofHint(claim: unknown) {
  if (!isRecord(claim) || !isRecord(claim.proofHint)) {
    return { zkReady: false, zkpGenerated: null as boolean | null };
  }

  return {
    zkReady: claim.proofHint.zkReady === true,
    zkpGenerated: typeof claim.proofHint.zkpGenerated === 'boolean'
      ? claim.proofHint.zkpGenerated
      : null,
  };
}

function visitObject(value: unknown, path: string, visit: (key: string, child: unknown, childPath: string) => void) {
  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      const childPath = `${path}[${index}]`;
      visit(String(index), child, childPath);
      visitObject(child, childPath, visit);
    });
    return;
  }

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`;
    visit(key, child, childPath);
    visitObject(child, childPath, visit);
  });
}

function collectPrivateFieldPaths(proof: unknown) {
  const paths: string[] = [];
  visitObject(proof, 'proof', (key, _child, childPath) => {
    if (PRIVATE_FIELD_NAMES.has(key)) {
      paths.push(childPath);
    }
  });
  return paths;
}

function isProofValue(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= PUBLIC_PROOF_VALUE_MIN_LENGTH;
}

function nullifierUsageForPath(path: string): ZkProofNullifierUsage {
  const lowerPath = path.toLowerCase();
  if (lowerPath.includes('requestnullifier') || lowerPath.endsWith('.nullifier')) return 'single-use';
  if (lowerPath.includes('bucketnullifier')) return 'bucket';
  return 'other';
}

function shouldCollectNullifier(key: string) {
  const lowerKey = key.toLowerCase();
  if (!lowerKey.includes('nullifier')) return false;
  return !lowerKey.includes('algorithm');
}

function shouldCollectCommitment(key: string) {
  const lowerKey = key.toLowerCase();
  if (!lowerKey.includes('commitment')) return false;
  return !lowerKey.includes('algorithm');
}

function collectValueReferences(
  proof: unknown,
  proofIndex: number,
  proofVersion: string | null
) {
  const nullifierRefs: InternalProofDescriptor['nullifierRefs'] = [];
  const commitmentRefs: InternalProofDescriptor['commitmentRefs'] = [];

  visitObject(proof, 'proof', (key, child, childPath) => {
    if (!isProofValue(child)) return;
    const value = child.trim();

    if (shouldCollectNullifier(key)) {
      nullifierRefs.push({
        proofIndex,
        proofVersion,
        role: 'nullifier',
        usage: nullifierUsageForPath(childPath),
        path: childPath,
        value,
      });
      return;
    }

    if (shouldCollectCommitment(key)) {
      commitmentRefs.push({
        proofIndex,
        proofVersion,
        role: 'commitment',
        usage: 'commitment',
        path: childPath,
        value,
      });
    }
  });

  return { nullifierRefs, commitmentRefs };
}

export function normalizeZkProofDescriptor(proof: unknown, index = 0): ZkProofDescriptor {
  const claim = getClaim(proof);
  const version = isRecord(claim) ? stringOrNull(claim.version) : null;
  const privacy = getPrivacy(claim);
  const proofHint = getProofHint(claim);
  const privateFieldPaths = collectPrivateFieldPaths(proof);
  const valueRefs = collectValueReferences(proof, index, version);

  return {
    index,
    version,
    scope: isRecord(claim) ? stringOrNull(claim.scope) : null,
    challengeHash: isRecord(claim) ? stringOrNull(claim.challengeHash) : null,
    issuedAt: isRecord(claim) ? parseIsoDate(claim.issuedAt) : null,
    expiresAt: isRecord(claim) ? parseIsoDate(claim.expiresAt) : null,
    issuerId: getSignatureIssuer(proof),
    zkReady: proofHint.zkReady,
    zkpGenerated: proofHint.zkpGenerated,
    privacyHides: privacy.hides,
    privacyReveals: privacy.reveals,
    privateFieldPaths,
    nullifierPaths: valueRefs.nullifierRefs.map(ref => ref.path),
    commitmentPaths: valueRefs.commitmentRefs.map(ref => ref.path),
  };
}

function normalizeInternalProofDescriptor(proof: unknown, index: number): InternalProofDescriptor {
  const descriptor = normalizeZkProofDescriptor(proof, index);
  const refs = collectValueReferences(proof, index, descriptor.version);
  return {
    ...descriptor,
    nullifierRefs: refs.nullifierRefs,
    commitmentRefs: refs.commitmentRefs,
  };
}

function computeCommonValidityWindow(
  descriptors: InternalProofDescriptor[],
  nowIso: string | null
): ZkProofValidityWindow {
  const issuedAt = maxIso(descriptors.map(descriptor => descriptor.issuedAt).filter((value): value is string => Boolean(value)));
  const expiresAt = minIso(descriptors.map(descriptor => descriptor.expiresAt).filter((value): value is string => Boolean(value)));
  const active = Boolean(
    nowIso
      ? (!issuedAt || nowIso >= issuedAt) && (!expiresAt || nowIso <= expiresAt)
      : true
  );

  return { issuedAt, expiresAt, active };
}

function addOnce(values: string[], value: string) {
  if (!values.includes(value)) values.push(value);
}

function validateDescriptor(
  descriptor: InternalProofDescriptor,
  options: ZkProofCompatibilityOptions,
  nowIso: string | null,
  errors: string[],
  warnings: string[]
) {
  if (!descriptor.version) {
    addOnce(errors, 'proof-version-missing');
  } else if (!KNOWN_PROOF_VERSIONS.has(descriptor.version) && !options.allowUnknownProofVersions) {
    addOnce(errors, 'unsupported-proof-version');
  }

  if (descriptor.privateFieldPaths.length > 0) addOnce(errors, 'private-proof-material-present');
  if (!descriptor.zkReady) addOnce(errors, 'zk-proof-not-ready');
  if (descriptor.zkpGenerated === false) addOnce(warnings, 'zk-proof-currently-simulated');

  const scopeOptionalSupportProof = Boolean(
    descriptor.version && SCOPELESS_SUPPORT_PROOF_VERSIONS.has(descriptor.version)
  );
  if (
    options.expectedScope
    && (
      descriptor.scope
        ? normalizeToken(options.expectedScope) !== normalizeToken(descriptor.scope)
        : !scopeOptionalSupportProof
    )
  ) {
    addOnce(errors, 'unexpected-proof-scope');
  }

  const expectedChallengeForVersion = descriptor.version
    ? options.expectedChallengeHashesByVersion?.[descriptor.version]
    : undefined;
  if (expectedChallengeForVersion && expectedChallengeForVersion !== descriptor.challengeHash) {
    addOnce(errors, 'unexpected-proof-challenge');
  } else if (options.expectedChallengeHash && options.expectedChallengeHash !== descriptor.challengeHash) {
    addOnce(errors, 'unexpected-proof-challenge');
  }

  if (nowIso && descriptor.issuedAt && nowIso < descriptor.issuedAt) addOnce(errors, 'proof-not-yet-valid');
  if (nowIso && descriptor.expiresAt && nowIso > descriptor.expiresAt) addOnce(errors, 'proof-expired');
}

function validateBundleShape(
  descriptors: InternalProofDescriptor[],
  options: ZkProofCompatibilityOptions,
  errors: string[]
) {
  if (descriptors.length === 0) {
    addOnce(errors, 'no-proofs-provided');
    return;
  }

  if (options.requireSameScope && uniqueSorted(descriptors.map(descriptor => descriptor.scope)).length > 1) {
    addOnce(errors, 'proof-scope-mismatch');
  }

  const domainSeparatedChallengeBound = Boolean(options.expectedChallengeHashesByVersion)
    && descriptors.every(descriptor => {
      if (!descriptor.version || !descriptor.challengeHash) return false;
      return options.expectedChallengeHashesByVersion?.[descriptor.version] === descriptor.challengeHash;
    });

  if (
    options.requireSameChallenge
    && uniqueSorted(descriptors.map(descriptor => descriptor.challengeHash)).length > 1
    && !domainSeparatedChallengeBound
  ) {
    addOnce(errors, 'proof-challenge-mismatch');
  }

  if (options.requireCommonValidityWindow) {
    const hasIssuedAt = descriptors.every(descriptor => Boolean(descriptor.issuedAt));
    const hasExpiry = descriptors.every(descriptor => Boolean(descriptor.expiresAt));
    if (!hasIssuedAt || !hasExpiry) addOnce(errors, 'proof-validity-window-incomplete');
  }
}

function referenceSummary(refs: ZkProofValueReference[]) {
  return refs.map(ref => `${ref.proofIndex}:${ref.role}:${ref.usage}:${ref.path}`);
}

function validateValueCollisions(
  descriptors: InternalProofDescriptor[],
  options: ZkProofCompatibilityOptions,
  errors: string[],
  warnings: string[]
) {
  const refsByValue = new Map<string, Array<ZkProofValueReference & { value: string }>>();

  descriptors.forEach(descriptor => {
    [...descriptor.nullifierRefs, ...descriptor.commitmentRefs].forEach(ref => {
      const existing = refsByValue.get(ref.value) || [];
      existing.push(ref);
      refsByValue.set(ref.value, existing);
    });
  });

  refsByValue.forEach(refs => {
    if (refs.length < 2) return;

    const roles = new Set(refs.map(ref => ref.role));
    if (roles.size > 1) {
      addOnce(errors, 'cross-role-proof-value-collision');
      return;
    }

    const [first] = refs;
    if (!first) return;

    if (first.role === 'commitment') {
      if (!options.allowSharedCommitments) addOnce(errors, 'shared-commitment-linkability-risk');
      return;
    }

    const singleUseRefs = refs.filter(ref => ref.usage === 'single-use');
    if (singleUseRefs.length > 1 && !options.allowDuplicateNullifiers) {
      addOnce(errors, 'duplicate-nullifier');
      return;
    }

    const allBucketRefs = refs.every(ref => ref.usage === 'bucket');
    if (allBucketRefs) {
      addOnce(warnings, 'shared-bucket-nullifier-linkability-risk');
      return;
    }

    if (!options.allowDuplicateNullifiers) addOnce(errors, 'duplicate-nullifier');
  });

  const collisionDomains = descriptors.flatMap(descriptor => [
    ...referenceSummary(descriptor.nullifierRefs),
    ...referenceSummary(descriptor.commitmentRefs),
  ]);
  if (collisionDomains.length === 0) addOnce(warnings, 'proof-bundle-has-no-collision-domain');
}

function buildManifest(
  descriptors: InternalProofDescriptor[],
  commonValidityWindow: ZkProofValidityWindow
): ZkProofCompatibilityManifest {
  return {
    version: ZK_PROOF_COMPATIBILITY_MANIFEST_VERSION,
    proofVersions: uniqueSorted(descriptors.map(descriptor => descriptor.version)),
    scopes: uniqueSorted(descriptors.map(descriptor => descriptor.scope)),
    challengeHashes: uniqueSorted(descriptors.map(descriptor => descriptor.challengeHash)),
    collisionDomains: descriptors.flatMap(descriptor => [
      ...descriptor.nullifierRefs.map(ref => `${ref.proofIndex}:${ref.role}:${ref.usage}:${ref.path}`),
      ...descriptor.commitmentRefs.map(ref => `${ref.proofIndex}:${ref.role}:${ref.usage}:${ref.path}`),
    ]),
    commonValidityWindow,
  };
}

export function analyzeZkProofCompatibility(
  proofs: readonly unknown[],
  options: ZkProofCompatibilityOptions = {}
): ZkProofCompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nowIso = parseIsoDate(options.now);
  const descriptors = proofs.map((proof, index) => normalizeInternalProofDescriptor(proof, index));
  const commonValidityWindow = computeCommonValidityWindow(descriptors, nowIso);

  validateBundleShape(descriptors, options, errors);
  descriptors.forEach(descriptor => validateDescriptor(descriptor, options, nowIso, errors, warnings));
  validateValueCollisions(descriptors, options, errors, warnings);

  if (options.requireCommonValidityWindow && !commonValidityWindow.active) {
    addOnce(errors, 'no-common-proof-validity-window');
  }

  const privacySafe = descriptors.every(descriptor => descriptor.privateFieldPaths.length === 0);
  const collisionFree = !errors.includes('duplicate-nullifier')
    && !errors.includes('cross-role-proof-value-collision')
    && !errors.includes('shared-commitment-linkability-risk');
  const publicDescriptors = descriptors.map(({ nullifierRefs: _nullifierRefs, commitmentRefs: _commitmentRefs, ...descriptor }) => descriptor);

  return {
    compatible: errors.length === 0,
    privacySafe,
    collisionFree,
    proofCount: proofs.length,
    commonValidityWindow,
    proofs: publicDescriptors,
    errors,
    warnings,
    manifest: buildManifest(descriptors, commonValidityWindow),
  };
}
