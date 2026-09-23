export const ADDRESSQL_ZK_PROOF_HOOK_VERSION = 'addressql-zk-proof-hooks-v0.6';

export type AddressQlProofClaimKind =
  | 'region_membership'
  | 'postal_equivalent'
  | 'deliverable'
  | 'quality_threshold'
  | 'consent_scope'
  | 'freshness'
  | 'not_revoked';

/**
 * Public proof claims use fixed tokens rather than free-form text. This keeps
 * the claim surface descriptive without creating another channel for details.
 */
export const ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS: Record<
  AddressQlProofClaimKind,
  string
> = {
  region_membership: 'addressql:region-membership',
  postal_equivalent: 'addressql:postal-equivalent',
  deliverable: 'addressql:deliverable',
  quality_threshold: 'addressql:quality-threshold',
  consent_scope: 'addressql:consent-scope',
  freshness: 'addressql:freshness',
  not_revoked: 'addressql:not-revoked',
};

export type AddressQlProofVisibility = 'public_signal' | 'private_witness' | 'root_reference' | 'verifier_policy' | 'proof_artifact';

export type AddressQlProofInputSchemaField = {
  path: string;
  visibility: AddressQlProofVisibility;
  required: boolean;
  description: string;
};

export type AddressQlProofInput = {
  schemaVersion: typeof ADDRESSQL_ZK_PROOF_HOOK_VERSION;
  proofFamily: 'addressql-zk-ready-v0.6';
  claim: {
    kind: AddressQlProofClaimKind;
    purpose: 'delivery' | 'address_login' | 'hotel_checkin' | 'locker_pickup' | 'research_fixture';
    statement: string;
  };
  envelopeCommitment: string;
  publicSignals: {
    challengeHash: string;
    nullifierHash: string;
    verifierPolicyHash: string;
    sourceVersion: string;
    proofExpiry: string;
  };
  roots: {
    issuerRoot: string;
    revocationRoot: string;
    freshnessRoot: string;
    areaRoot?: string;
  };
  verifierPolicy: {
    verifierId: string;
    audience: string;
    allowedClaims: AddressQlProofClaimKind[];
    maxDisclosure: 'proof_only' | 'country' | 'region' | 'carrier_decryptable';
    requireFreshnessRoot: boolean;
    requireRevocationRoot: boolean;
  };
  proofArtifact: {
    format: 'fixture_proof_bundle' | 'external_verifier_receipt' | 'recursive_proof_placeholder';
    proofCommitment: string;
    publicInputCommitment: string;
  };
  nonClaims: string[];
};

export type AddressQlVerifierHook = {
  id: string;
  mode: 'schema_only' | 'external_verifier_hook';
  acceptedProofFormats: AddressQlProofInput['proofArtifact']['format'][];
  mustRejectPrivateMaterial: boolean;
  cryptographicVerification: 'not_performed' | 'external_required';
};

export type AddressQlProofHookDecision = {
  schemaAccepted: boolean;
  hookReady: boolean;
  cryptographicVerification: AddressQlVerifierHook['cryptographicVerification'];
  verified: false;
  errors: string[];
  warnings: string[];
  nonClaims: string[];
};

export const ADDRESSQL_PROOF_INPUT_SCHEMA: AddressQlProofInputSchemaField[] = [
  { path: 'schemaVersion', visibility: 'public_signal', required: true, description: 'AddressQL proof input schema version.' },
  { path: 'proofFamily', visibility: 'public_signal', required: true, description: 'Proof-family label used for domain separation.' },
  { path: 'claim.kind', visibility: 'public_signal', required: true, description: 'Predicate kind requested by the verifier.' },
  { path: 'claim.purpose', visibility: 'public_signal', required: true, description: 'Purpose scope for the proof.' },
  { path: 'claim.statement', visibility: 'public_signal', required: true, description: 'Canonical public token for the requested predicate.' },
  { path: 'envelopeCommitment', visibility: 'public_signal', required: true, description: 'Commitment to the AMT-compatible envelope, not the raw address.' },
  { path: 'publicSignals.challengeHash', visibility: 'public_signal', required: true, description: 'Replay-resistant challenge hash.' },
  { path: 'publicSignals.nullifierHash', visibility: 'public_signal', required: true, description: 'Purpose-scoped nullifier hash.' },
  { path: 'publicSignals.verifierPolicyHash', visibility: 'public_signal', required: true, description: 'Hash of the verifier policy used for the proof request.' },
  { path: 'publicSignals.sourceVersion', visibility: 'public_signal', required: true, description: 'Source version bound into the proof statement.' },
  { path: 'publicSignals.proofExpiry', visibility: 'public_signal', required: true, description: 'Expiry time for proof use.' },
  { path: 'roots.issuerRoot', visibility: 'root_reference', required: true, description: 'Issuer trust root.' },
  { path: 'roots.revocationRoot', visibility: 'root_reference', required: true, description: 'Revocation root.' },
  { path: 'roots.freshnessRoot', visibility: 'root_reference', required: true, description: 'Freshness root.' },
  { path: 'roots.areaRoot', visibility: 'root_reference', required: false, description: 'Area or region-membership root when the claim needs it.' },
  { path: 'verifierPolicy.allowedClaims', visibility: 'verifier_policy', required: true, description: 'Claims accepted by this verifier.' },
  { path: 'proofArtifact.proofCommitment', visibility: 'proof_artifact', required: true, description: 'Commitment to a proof artifact or verifier receipt.' },
  { path: 'proofArtifact.publicInputCommitment', visibility: 'proof_artifact', required: true, description: 'Commitment to public inputs only.' },
];

export const ADDRESSQL_PROOF_ALLOWED_PUBLIC_SIGNAL_KEYS = [
  'challengeHash',
  'nullifierHash',
  'verifierPolicyHash',
  'sourceVersion',
  'proofExpiry',
] as const;

const ADDRESSQL_PROOF_ROOT_KEYS = [
  'schemaVersion',
  'proofFamily',
  'claim',
  'envelopeCommitment',
  'publicSignals',
  'roots',
  'verifierPolicy',
  'proofArtifact',
  'nonClaims',
] as const;

const ADDRESSQL_PROOF_NESTED_OBJECT_KEYS: Record<string, readonly string[]> = {
  'proofInput.claim': ['kind', 'purpose', 'statement'],
  'proofInput.publicSignals': [...ADDRESSQL_PROOF_ALLOWED_PUBLIC_SIGNAL_KEYS],
  'proofInput.roots': ['issuerRoot', 'revocationRoot', 'freshnessRoot', 'areaRoot'],
  'proofInput.verifierPolicy': [
    'verifierId',
    'audience',
    'allowedClaims',
    'maxDisclosure',
    'requireFreshnessRoot',
    'requireRevocationRoot',
  ],
  'proofInput.proofArtifact': ['format', 'proofCommitment', 'publicInputCommitment'],
};

export const ADDRESSQL_PROOF_FORBIDDEN_FIELD_PATTERNS = [
  /raw.?address/i,
  /normalized.?address/i,
  /address.?text/i,
  /street/i,
  /building/i,
  /room/i,
  /unit/i,
  /recipient/i,
  /phone/i,
  /email/i,
  /latitude|longitude|lat|lon/i,
  /witness/i,
  /private.?key/i,
  /proof.?secret/i,
  /secret/i,
  /salt/i,
  /ciphertext/i,
] as const;

export const ADDRESSQL_PROOF_NON_CLAIMS = [
  'Schema acceptance is not cryptographic proof verification.',
  'Proof verification does not prove address resolution correctness.',
  'Deliverability is not proof of residence or identity.',
  'Postal-equivalent membership is not an official postal code claim.',
  'No AddressQL v0.6 hook may store witness, private key, raw address, or proof secret material.',
];

export const ADDRESSQL_VERIFIER_HOOKS: AddressQlVerifierHook[] = [
  {
    id: 'addressql-schema-only-hook',
    mode: 'schema_only',
    acceptedProofFormats: ['fixture_proof_bundle', 'external_verifier_receipt', 'recursive_proof_placeholder'],
    mustRejectPrivateMaterial: true,
    cryptographicVerification: 'not_performed',
  },
  {
    id: 'addressql-external-verifier-hook',
    mode: 'external_verifier_hook',
    acceptedProofFormats: ['external_verifier_receipt', 'recursive_proof_placeholder'],
    mustRejectPrivateMaterial: true,
    cryptographicVerification: 'external_required',
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAddressQlProofClaimKind(value: unknown): value is AddressQlProofClaimKind {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS, value)
  );
}

function collectUnexpectedFieldPaths(value: unknown, path = 'proofInput'): string[] {
  if (!isRecord(value)) return [];

  const allowedKeys = path === 'proofInput'
    ? ADDRESSQL_PROOF_ROOT_KEYS
    : ADDRESSQL_PROOF_NESTED_OBJECT_KEYS[path];
  if (!allowedKeys) return [];

  const unexpectedPaths = Object.keys(value)
    .filter(key => !allowedKeys.includes(key))
    .map(key => `${path}.${key}`);

  for (const key of allowedKeys) {
    const childPath = `${path}.${key}`;
    if (ADDRESSQL_PROOF_NESTED_OBJECT_KEYS[childPath]) {
      unexpectedPaths.push(...collectUnexpectedFieldPaths(value[key], childPath));
    }
  }

  return unexpectedPaths;
}

function getPath(input: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, input);
}

function addOnce(items: string[], item: string) {
  if (!items.includes(item)) items.push(item);
}

function fieldNameLooksPrivate(path: string): boolean {
  return ADDRESSQL_PROOF_FORBIDDEN_FIELD_PATTERNS.some(pattern => pattern.test(path));
}

function collectPrivateFieldPaths(value: unknown, prefix = 'proofInput'): string[] {
  const paths: string[] = [];
  if (!isRecord(value) && !Array.isArray(value)) return paths;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      paths.push(...collectPrivateFieldPaths(item, `${prefix}[${index}]`));
    });
    return paths;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${prefix}.${key}`;
    if (fieldNameLooksPrivate(childPath)) paths.push(childPath);
    paths.push(...collectPrivateFieldPaths(child, childPath));
  }

  return paths;
}

export function createSyntheticAddressQlProofInput(overrides: Partial<AddressQlProofInput> = {}): AddressQlProofInput {
  const base: AddressQlProofInput = {
    schemaVersion: ADDRESSQL_ZK_PROOF_HOOK_VERSION,
    proofFamily: 'addressql-zk-ready-v0.6',
    claim: {
      kind: 'deliverable',
      purpose: 'research_fixture',
      statement: ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS.deliverable,
    },
    envelopeCommitment: 'commitment:amt-envelope:synthetic:v0.6',
    publicSignals: {
      challengeHash: 'hash:challenge:synthetic:v0.6',
      nullifierHash: 'hash:nullifier:delivery:synthetic:v0.6',
      verifierPolicyHash: 'hash:verifier-policy:synthetic:v0.6',
      sourceVersion: 'synthetic-addressql-v0.6',
      proofExpiry: '2030-01-01T00:00:00Z',
    },
    roots: {
      issuerRoot: 'root:issuer:synthetic:v0.6',
      revocationRoot: 'root:revocation:synthetic:v0.6',
      freshnessRoot: 'root:freshness:synthetic:v0.6',
      areaRoot: 'root:area:synthetic:v0.6',
    },
    verifierPolicy: {
      verifierId: 'verifier:synthetic',
      audience: 'audience:addressql-tests',
      allowedClaims: ['deliverable', 'region_membership', 'postal_equivalent'],
      maxDisclosure: 'proof_only',
      requireFreshnessRoot: true,
      requireRevocationRoot: true,
    },
    proofArtifact: {
      format: 'fixture_proof_bundle',
      proofCommitment: 'commitment:proof-artifact:synthetic:v0.6',
      publicInputCommitment: 'commitment:public-inputs:synthetic:v0.6',
    },
    nonClaims: [...ADDRESSQL_PROOF_NON_CLAIMS],
  };

  return {
    ...base,
    ...overrides,
    claim: { ...base.claim, ...overrides.claim },
    publicSignals: { ...base.publicSignals, ...overrides.publicSignals },
    roots: { ...base.roots, ...overrides.roots },
    verifierPolicy: { ...base.verifierPolicy, ...overrides.verifierPolicy },
    proofArtifact: { ...base.proofArtifact, ...overrides.proofArtifact },
    nonClaims: overrides.nonClaims ?? [...base.nonClaims],
  };
}

export function validateAddressQlProofInput(input: unknown, nowIso = '2026-07-02T00:00:00Z'): string[] {
  const errors: string[] = [];

  if (!isRecord(input)) return ['proof-input-not-object'];

  for (const path of collectUnexpectedFieldPaths(input)) {
    addOnce(errors, `unexpected-field:${path}`);
  }

  for (const field of ADDRESSQL_PROOF_INPUT_SCHEMA.filter(field => field.required)) {
    if (getPath(input, field.path) === undefined) addOnce(errors, `missing:${field.path}`);
  }

  if (input.schemaVersion !== ADDRESSQL_ZK_PROOF_HOOK_VERSION) addOnce(errors, 'schema-version-mismatch');
  if (input.proofFamily !== 'addressql-zk-ready-v0.6') addOnce(errors, 'proof-family-mismatch');

  const publicSignals = isRecord(input.publicSignals) ? input.publicSignals : {};
  for (const key of Object.keys(publicSignals)) {
    if (!ADDRESSQL_PROOF_ALLOWED_PUBLIC_SIGNAL_KEYS.includes(key as (typeof ADDRESSQL_PROOF_ALLOWED_PUBLIC_SIGNAL_KEYS)[number])) {
      addOnce(errors, `unexpected-public-signal:${key}`);
    }
    if (fieldNameLooksPrivate(`publicSignals.${key}`)) addOnce(errors, `private-public-signal:${key}`);
  }

  const privatePaths = collectPrivateFieldPaths(input);
  for (const path of privatePaths) addOnce(errors, `private-material:${path}`);

  const claim = isRecord(input.claim) ? input.claim : {};
  const verifierPolicy = isRecord(input.verifierPolicy) ? input.verifierPolicy : {};
  const allowedClaims = Array.isArray(verifierPolicy.allowedClaims) ? verifierPolicy.allowedClaims : [];
  if (!isAddressQlProofClaimKind(claim.kind)) {
    addOnce(errors, 'unsupported-claim-kind');
  } else if (claim.statement !== ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS[claim.kind]) {
    addOnce(errors, 'claim-statement-not-canonical');
  }
  if (typeof claim.kind === 'string' && !allowedClaims.includes(claim.kind)) {
    addOnce(errors, 'claim-not-allowed-by-verifier-policy');
  }

  const roots = isRecord(input.roots) ? input.roots : {};
  if (verifierPolicy.requireFreshnessRoot === true && typeof roots.freshnessRoot !== 'string') addOnce(errors, 'freshness-root-required');
  if (verifierPolicy.requireRevocationRoot === true && typeof roots.revocationRoot !== 'string') addOnce(errors, 'revocation-root-required');

  const proofExpiry = typeof publicSignals.proofExpiry === 'string' ? publicSignals.proofExpiry : undefined;
  if (proofExpiry && proofExpiry <= nowIso) addOnce(errors, 'proof-expired');

  if (!Array.isArray(input.nonClaims) || input.nonClaims.length < ADDRESSQL_PROOF_NON_CLAIMS.length) {
    addOnce(errors, 'non-claims-incomplete');
  }

  return errors;
}

export function runAddressQlVerifierHook(input: unknown, hook: AddressQlVerifierHook = ADDRESSQL_VERIFIER_HOOKS[0]): AddressQlProofHookDecision {
  const errors = validateAddressQlProofInput(input);
  const warnings: string[] = [];
  const proofArtifact = isRecord(input) && isRecord(input.proofArtifact) ? input.proofArtifact : {};
  const proofFormat = proofArtifact.format;

  if (hook.mustRejectPrivateMaterial && collectPrivateFieldPaths(input).length > 0) {
    addOnce(errors, 'hook-rejected-private-material');
  }

  if (typeof proofFormat !== 'string' || !hook.acceptedProofFormats.includes(proofFormat as AddressQlProofInput['proofArtifact']['format'])) {
    addOnce(errors, 'proof-format-not-accepted-by-hook');
  }

  if (hook.cryptographicVerification === 'not_performed') {
    addOnce(warnings, 'cryptographic-verification-not-performed');
  }
  if (hook.cryptographicVerification === 'external_required') {
    addOnce(warnings, 'external-verifier-required');
  }

  return {
    schemaAccepted: errors.length === 0,
    hookReady: errors.length === 0 && hook.mustRejectPrivateMaterial,
    cryptographicVerification: hook.cryptographicVerification,
    verified: false,
    errors,
    warnings,
    nonClaims: [...ADDRESSQL_PROOF_NON_CLAIMS],
  };
}

export function validateAddressQlZkProofHookPlan(): string[] {
  const errors: string[] = [];
  const requiredPublicSignals = ['challengeHash', 'nullifierHash', 'verifierPolicyHash', 'sourceVersion', 'proofExpiry'];
  const schemaPaths = new Set(ADDRESSQL_PROOF_INPUT_SCHEMA.map(field => field.path));
  const nonClaimText = ADDRESSQL_PROOF_NON_CLAIMS.join(' ');

  for (const required of requiredPublicSignals) {
    if (!ADDRESSQL_PROOF_ALLOWED_PUBLIC_SIGNAL_KEYS.includes(required as (typeof ADDRESSQL_PROOF_ALLOWED_PUBLIC_SIGNAL_KEYS)[number])) {
      errors.push(`missing allowed public signal: ${required}`);
    }
    if (!schemaPaths.has(`publicSignals.${required}`)) errors.push(`missing schema path: publicSignals.${required}`);
  }

  for (const requiredPath of ['envelopeCommitment', 'roots.issuerRoot', 'roots.revocationRoot', 'roots.freshnessRoot', 'verifierPolicy.allowedClaims']) {
    if (!schemaPaths.has(requiredPath)) errors.push(`missing schema path: ${requiredPath}`);
  }

  for (const forbidden of ['raw address', 'witness', 'private key', 'proof secret']) {
    if (!new RegExp(forbidden, 'i').test(nonClaimText)) errors.push(`missing non-claim boundary: ${forbidden}`);
  }

  for (const claimKind of Object.keys(ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS) as AddressQlProofClaimKind[]) {
    const statement = ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS[claimKind];
    if (!statement.startsWith('addressql:')) errors.push(`missing canonical claim token: ${claimKind}`);
  }

  const fixture = createSyntheticAddressQlProofInput();
  const fixtureErrors = validateAddressQlProofInput(fixture);
  if (fixtureErrors.length > 0) errors.push(`synthetic fixture invalid: ${fixtureErrors.join(',')}`);
  if (fixture.claim.statement !== ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS[fixture.claim.kind]) {
    errors.push('synthetic fixture claim statement is not canonical');
  }

  const hookDecision = runAddressQlVerifierHook(fixture);
  if (hookDecision.verified !== false) errors.push('v0.6 hook must not claim cryptographic verification');
  if (!hookDecision.warnings.includes('cryptographic-verification-not-performed')) {
    errors.push('schema-only hook must warn that cryptographic verification was not performed');
  }

  return errors;
}
