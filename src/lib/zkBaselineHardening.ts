export const ZK_BASELINE_HARDENING_VERSION = 'agid-zk-baseline-hardening-v1';

export type ZkBaselinePriority = 'P0' | 'P1' | 'P2';
export type ZkBaselineControlId =
  | 'public-signal-allowlist'
  | 'witness-hygiene'
  | 'domain-separated-nullifiers'
  | 'fixture-production-separation'
  | 'proof-bundle-compatibility'
  | 'managed-prover-boundary'
  | 'verifier-and-registry-contracts'
  | 'audit-and-release-evidence';

export type ZkPublicSignalClassification = 'allowed' | 'forbidden' | 'unknown';

export type ZkBaselineHardeningControl = {
  id: ZkBaselineControlId;
  priority: ZkBaselinePriority;
  title: string;
  requirement: string;
  implementation: string[];
  requiredTests: string[];
  openSourceArtifacts: string[];
  productionBlockerIfMissing: boolean;
};

export type ZkBaselineHardeningPlan = {
  version: typeof ZK_BASELINE_HARDENING_VERSION;
  principle: string;
  allowedPublicSignals: string[];
  forbiddenPublicSignals: string[];
  controls: ZkBaselineHardeningControl[];
  productionBlockers: string[];
  recommendedCommands: string[];
  wordingRules: string[];
};

export type ZkPublicSignalSetValidation = {
  valid: boolean;
  allowed: string[];
  forbidden: string[];
  unknown: string[];
  errors: string[];
  warnings: string[];
};

export type ZkBaselineHardeningValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const ZK_BASELINE_ALLOWED_PUBLIC_SIGNALS = [
  'predicate identifier',
  'scope hash',
  'issuer root',
  'revocation root',
  'freshness root',
  'area root',
  'quality threshold',
  'nullifier hash',
  'proof expiry',
  'verifier key reference',
  'circuit id',
] as const;

export const ZK_BASELINE_FORBIDDEN_PUBLIC_SIGNALS = [
  'raw address text',
  'raw AGID',
  'raw AOID',
  'AGID-S ciphertext',
  'precise coordinates',
  'unit number',
  'phone number',
  'recipient name',
  'proof code',
  'holder secret',
  'credential secret',
  'witness',
  'private input',
  'full delivery history',
] as const;

export const ZK_BASELINE_CONTROLS: ZkBaselineHardeningControl[] = [
  {
    id: 'public-signal-allowlist',
    priority: 'P0',
    title: 'Public signal allowlist',
    requirement: 'Every proof family must publish only explicit public signals and reject private address, identity, and witness material.',
    implementation: [
      'Keep an allowlist of public signal names shared by circuits, envelopes, docs, and verifier contracts.',
      'Reject raw address, raw AGID, raw AOID, AGID-S ciphertext, precise coordinates, proof codes, secrets, and witness fields.',
      'Treat unknown public signals as review-required until classified.',
    ],
    requiredTests: ['public signal allowlist test', 'forbidden signal rejection test', 'unknown signal warning test'],
    openSourceArtifacts: ['circuits/README.md', 'src/lib/zkBaselineHardening.ts', 'public signal test vectors'],
    productionBlockerIfMissing: true,
  },
  {
    id: 'witness-hygiene',
    priority: 'P0',
    title: 'Witness hygiene',
    requirement: 'Witnesses and private inputs must stay client-side or inside an explicitly private proving environment and must never be logged.',
    implementation: [
      'Default to client-side witness for local and OSS flows.',
      'Reject server-held witness for managed SaaS unless a private deployment policy explicitly allows it.',
      'Keep generated witness, zkey, proving key, ptau, and build artifacts out of git and logs.',
    ],
    requiredTests: ['managed prover private material rejection', 'fixture temp workspace test', 'git artifact exclusion check'],
    openSourceArtifacts: ['scripts/verify-zk-circuit-fixture.ts', 'src/lib/managedZkProofServer.ts', 'circuits/.gitignore guidance'],
    productionBlockerIfMissing: true,
  },
  {
    id: 'domain-separated-nullifiers',
    priority: 'P0',
    title: 'Domain-separated nullifiers',
    requirement: 'Nullifiers must be scoped by purpose, region, issuer, registry, and proof family so they cannot become cross-purpose trackers.',
    implementation: [
      'Include proof family and purpose scope in nullifier derivation.',
      'Separate request nullifiers from bucket nullifiers and commitments.',
      'Reject duplicate single-use nullifiers inside proof bundles.',
    ],
    requiredTests: ['duplicate nullifier rejection', 'cross-role collision rejection', 'shared bucket warning test'],
    openSourceArtifacts: ['src/lib/zkProofCompatibility.ts', 'src/lib/zkProofBundleRegistry.ts', 'contracts/AGIDNullifierRegistry.sol'],
    productionBlockerIfMissing: true,
  },
  {
    id: 'fixture-production-separation',
    priority: 'P0',
    title: 'Fixture and production circuit separation',
    requirement: 'Fixture circuits may prove tooling only; production claims require reviewed SNARK-friendly commitments and nullifiers.',
    implementation: [
      'Label fixture circuits as non-production in docs and tests.',
      'Block wording that claims fixture arithmetic is production privacy.',
      'Require a production circuit id, verifier key reference, and audit status before production use.',
    ],
    requiredTests: ['fixture circuit verification', 'production blocker validation', 'wording rule test'],
    openSourceArtifacts: ['circuits/fixtures/nullifier_linear_fixture.circom', 'circuits/README.md'],
    productionBlockerIfMissing: true,
  },
  {
    id: 'proof-bundle-compatibility',
    priority: 'P1',
    title: 'Proof bundle compatibility',
    requirement: 'Composed proofs must share scope/challenge rules, validity windows, and collision domains before use.',
    implementation: [
      'Normalize proof descriptors before bundling.',
      'Require common validity windows for multi-proof decisions.',
      'Store bundle registry records without private proof material.',
    ],
    requiredTests: ['proof bundle compatibility', 'common validity window test', 'registry rejects private proof material'],
    openSourceArtifacts: ['src/lib/zkProofCompatibility.ts', 'src/lib/zkProofBundleRegistry.ts'],
    productionBlockerIfMissing: false,
  },
  {
    id: 'managed-prover-boundary',
    priority: 'P1',
    title: 'Managed prover boundary',
    requirement: 'Managed proving must accept public statements and commitments by default, not raw address material or witnesses.',
    implementation: [
      'Expose a public-only job contract for managed proving.',
      'Set artifact policy to store proofs and public inputs only, never witnesses.',
      'Require private deployments for any exceptional witness-handling mode.',
    ],
    requiredTests: ['managed ZK public-only contract test', 'server-held witness rejection test', 'artifact retention test'],
    openSourceArtifacts: ['src/lib/managedZkProofServer.ts', 'docs/managed-zk-proof-generation-server.md'],
    productionBlockerIfMissing: false,
  },
  {
    id: 'verifier-and-registry-contracts',
    priority: 'P1',
    title: 'Verifier and registry contracts',
    requirement: 'On-chain or server registries should store only verifier status, roots, commitments, nullifiers, and receipts.',
    implementation: [
      'Keep Ethereum optional and registry-only unless a workflow explicitly needs public settlement.',
      'Verify proof results and mark used nullifiers without publishing AGID/AOID/address material.',
      'Keep ABI/RPC clients separated from local-only POS mode.',
    ],
    requiredTests: ['nullifier registry duplicate test', 'no raw address event policy test', 'local mode wallet-free test'],
    openSourceArtifacts: ['contracts/AGIDNullifierRegistry.sol', 'src/lib/web3ZkSdkPlan.ts', 'src/lib/ethereumRegistryOnlyMode.ts'],
    productionBlockerIfMissing: false,
  },
  {
    id: 'audit-and-release-evidence',
    priority: 'P2',
    title: 'Audit and release evidence',
    requirement: 'Release notes must distinguish proof-ready envelopes, fixture circuits, production circuits, and audited circuits.',
    implementation: [
      'Publish circuit fixtures, public signal schemas, and test vectors.',
      'Document which claims are envelope-only, circuit-verified, or externally audited.',
      'Require external cryptographic review before calling a circuit production-grade.',
    ],
    requiredTests: ['release wording test', 'audit status inventory test', 'no overclaiming test'],
    openSourceArtifacts: ['docs/zk-address-proof-materials-roadmap-ja.md', 'docs/address-morphism-executable-expectations.md'],
    productionBlockerIfMissing: false,
  },
];

export const ZK_BASELINE_PRODUCTION_BLOCKERS = [
  'fixture circuit used as production privacy circuit',
  'forbidden public signal present',
  'unknown public signal not reviewed',
  'witness or private input logged or stored',
  'missing domain separation for nullifier',
  'single-use nullifier replay accepted',
  'raw AGID/AOID/address material emitted by registry or verifier',
  'production-grade wording without circuit audit status',
];

export const ZK_BASELINE_RECOMMENDED_COMMANDS = [
  'npm run verify:zk-baseline',
  'npm run verify:zk:circuit',
  'npm run verify:web3-zk-stack',
  'npm run lint',
];

export const ZK_BASELINE_WORDING_RULES = [
  'Call current TypeScript proof objects ZK-ready envelopes unless a real prover generated and verified the proof.',
  'Call checked-in fixture circuits tooling fixtures, not production privacy circuits.',
  'Use production-grade ZK only after circuit review, verifier integration, witness hygiene, and public signal leakage tests pass.',
  'State that ZK proves a predicate, not the real-world truth of the underlying address source.',
];

function normalizeSignal(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function classifyZkPublicSignal(signal: string): ZkPublicSignalClassification {
  const normalized = normalizeSignal(signal);
  if (ZK_BASELINE_ALLOWED_PUBLIC_SIGNALS.some(allowed => normalizeSignal(allowed) === normalized)) return 'allowed';
  if (ZK_BASELINE_FORBIDDEN_PUBLIC_SIGNALS.some(forbidden => normalizeSignal(forbidden) === normalized)) return 'forbidden';
  return 'unknown';
}

export function validateZkPublicSignalSet(signals: readonly string[]): ZkPublicSignalSetValidation {
  const allowed: string[] = [];
  const forbidden: string[] = [];
  const unknown: string[] = [];

  for (const signal of signals) {
    const classification = classifyZkPublicSignal(signal);
    if (classification === 'allowed') allowed.push(signal);
    if (classification === 'forbidden') forbidden.push(signal);
    if (classification === 'unknown') unknown.push(signal);
  }

  const errors = forbidden.map(signal => `forbidden-public-signal:${signal}`);
  const warnings = unknown.map(signal => `unknown-public-signal:${signal}`);
  return {
    valid: errors.length === 0 && warnings.length === 0,
    allowed,
    forbidden,
    unknown,
    errors,
    warnings,
  };
}

export function getZkBaselineHardeningPlan(): ZkBaselineHardeningPlan {
  return {
    version: ZK_BASELINE_HARDENING_VERSION,
    principle: 'Strengthen the open ZK baseline by proving leakage boundaries, witness hygiene, domain-separated nullifiers, fixture/production separation, and proof-bundle compatibility before adding production claims.',
    allowedPublicSignals: [...ZK_BASELINE_ALLOWED_PUBLIC_SIGNALS],
    forbiddenPublicSignals: [...ZK_BASELINE_FORBIDDEN_PUBLIC_SIGNALS],
    controls: ZK_BASELINE_CONTROLS.map(control => ({
      ...control,
      implementation: [...control.implementation],
      requiredTests: [...control.requiredTests],
      openSourceArtifacts: [...control.openSourceArtifacts],
    })),
    productionBlockers: [...ZK_BASELINE_PRODUCTION_BLOCKERS],
    recommendedCommands: [...ZK_BASELINE_RECOMMENDED_COMMANDS],
    wordingRules: [...ZK_BASELINE_WORDING_RULES],
  };
}

export function validateZkBaselineHardeningPlan(
  plan = getZkBaselineHardeningPlan(),
): ZkBaselineHardeningValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const controlIds = new Set<ZkBaselineControlId>();

  if (plan.version !== ZK_BASELINE_HARDENING_VERSION) errors.push('version-mismatch');
  if (plan.controls.length !== 8) errors.push(`expected-8-controls:${plan.controls.length}`);

  for (const control of plan.controls) {
    if (controlIds.has(control.id)) errors.push(`duplicate-control:${control.id}`);
    controlIds.add(control.id);
    if (!control.implementation.length) errors.push(`missing-implementation:${control.id}`);
    if (!control.requiredTests.length) errors.push(`missing-required-tests:${control.id}`);
    if (!control.openSourceArtifacts.length) errors.push(`missing-open-source-artifacts:${control.id}`);
  }

  const requiredAllowedSignals = ['scope hash', 'issuer root', 'revocation root', 'freshness root', 'area root', 'nullifier hash', 'proof expiry'];
  for (const signal of requiredAllowedSignals) {
    if (!plan.allowedPublicSignals.some(item => normalizeSignal(item) === normalizeSignal(signal))) {
      errors.push(`missing-allowed-public-signal:${signal}`);
    }
  }

  const requiredForbiddenSignals = ['raw address text', 'raw AGID', 'raw AOID', 'AGID-S ciphertext', 'precise coordinates', 'proof code', 'witness', 'private input'];
  for (const signal of requiredForbiddenSignals) {
    if (!plan.forbiddenPublicSignals.some(item => normalizeSignal(item) === normalizeSignal(signal))) {
      errors.push(`missing-forbidden-public-signal:${signal}`);
    }
  }

  const p0Blockers = plan.controls.filter(control => control.priority === 'P0');
  if (p0Blockers.length < 4) errors.push(`too-few-p0-controls:${p0Blockers.length}`);
  for (const control of p0Blockers) {
    if (!control.productionBlockerIfMissing) errors.push(`p0-not-production-blocker:${control.id}`);
  }

  for (const requiredControl of [
    'public-signal-allowlist',
    'witness-hygiene',
    'domain-separated-nullifiers',
    'fixture-production-separation',
  ] satisfies ZkBaselineControlId[]) {
    if (!controlIds.has(requiredControl)) errors.push(`missing-required-control:${requiredControl}`);
  }

  for (const blocker of [
    'fixture circuit used as production privacy circuit',
    'forbidden public signal present',
    'witness or private input logged or stored',
    'missing domain separation for nullifier',
  ]) {
    if (!plan.productionBlockers.includes(blocker)) errors.push(`missing-production-blocker:${blocker}`);
  }

  for (const command of ['npm run verify:zk-baseline', 'npm run verify:zk:circuit', 'npm run lint']) {
    if (!plan.recommendedCommands.includes(command)) warnings.push(`missing-recommended-command:${command}`);
  }

  if (!plan.wordingRules.some(rule => /ZK-ready envelopes/i.test(rule))) errors.push('missing-zk-ready-wording-rule');
  if (!plan.wordingRules.some(rule => /fixture circuits tooling fixtures/i.test(rule))) errors.push('missing-fixture-wording-rule');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
